#!/usr/bin/env python3
"""Triage of alerts with a local language model and approval by a person, chapter 5.6.

Alertmanager sends alerts to /alert. For every firing alert the service collects the recent error
lines from Loki and the state of the deployment, asks the model for a summary and one action from a
short list, and stores the proposal. A person approves or rejects it on the web page. Only an
approved action runs, and only on the deployments in ALLOWED_TARGETS. Every step lands in the audit
log, a file with one JSON object per line.

It only needs the standard library.
"""
import datetime
import html
import json
import os
import ssl
import threading
import urllib.parse
import urllib.request
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSION = "1.0.0"
PORT = int(os.environ.get("PORT", "8080"))
OLLAMA = os.environ.get("OLLAMA_URL", "http://ollama.ai.svc:11434")
MODEL = os.environ.get("MODEL", "llama3.2:3b")
LOKI = os.environ.get("LOKI_URL", "http://loki.monitoring.svc:3100")
AUDIT = os.environ.get("AUDIT_LOG", "/data/audit.jsonl")
# Deployments the service may touch, as namespace/name separated by commas
ALLOWED_TARGETS = {t.strip() for t in os.environ.get("ALLOWED_TARGETS", "velo/webshop").split(",") if t.strip()}
# Extra instructions for the model, set in the deployment to improve the questions without a new image
EXTRA = os.environ.get("EXTRA_INSTRUCTIONS", "").strip()
# Actions that run without approval, empty by default. Anything listed here acts on its own
AUTONOMOUS = {a.strip() for a in os.environ.get("AUTONOMOUS_ACTIONS", "").split(",") if a.strip()}
ACTIONS = {
    "none": "do nothing, a person has to look at it",
    "restart": "restart the pods of the deployment one after the other",
}

API = "https://kubernetes.default.svc"
SA = "/var/run/secrets/kubernetes.io/serviceaccount"
lock = threading.Lock()
proposals = {}


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def audit(event, **fields):
    entry = {"time": now(), "event": event, **fields}
    line = json.dumps(entry, ensure_ascii=False)
    # stdout reaches Loki through Alloy, the file keeps the log across restarts of the pod
    print(line, flush=True)
    with lock, open(AUDIT, "a", encoding="utf-8") as log:
        log.write(line + "\n")


def http_json(url, data=None, headers=None, method=None, context=None, timeout=10):
    body = json.dumps(data).encode() if data is not None else None
    request = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json", **(headers or {})}, method=method)
    with urllib.request.urlopen(request, timeout=timeout, context=context) as answer:
        return json.loads(answer.read() or b"{}")


def kube(path, data=None, method="GET", patch=None):
    token = open(f"{SA}/token").read()
    context = ssl.create_default_context(cafile=f"{SA}/ca.crt")
    headers = {"Authorization": f"Bearer {token}"}
    if patch:
        headers["Content-Type"] = patch
    return http_json(API + path, data, headers, method, context)


def recent_errors(namespace):
    """The last error lines of a namespace from Loki, at most 15"""
    query = f'{{namespace="{namespace}"}} |~ "(?i)error|exception| 5[0-9][0-9] "'
    params = urllib.parse.urlencode({"query": query, "limit": 15, "since": "15m"})
    try:
        result = http_json(f"{LOKI}/loki/api/v1/query_range?{params}")["data"]["result"]
    except (OSError, ValueError, KeyError):
        return ["(Loki not reachable)"]
    lines = sorted((v for stream in result for v in stream["values"]), reverse=True)[:15]
    return [line for _, line in lines] or ["(no error lines in the last 15 minutes)"]


def deployment_state(namespace, name):
    try:
        d = kube(f"/apis/apps/v1/namespaces/{namespace}/deployments/{name}")
    except (OSError, ValueError):
        return "(deployment not readable)"
    status = d.get("status", {})
    env = {e["name"]: e.get("value") for c in d["spec"]["template"]["spec"]["containers"] for e in c.get("env", [])}
    return f"replicas {status.get('replicas')}, ready {status.get('readyReplicas')}, env {env}"


def ask_model(alert, target, errors, state):
    prompt = (
        "You support the platform team of a small cloud. Analyse the alert and answer in German.\n"
        f"Alert: {alert['labels'].get('alertname')}\n"
        f"Summary: {alert.get('annotations', {}).get('summary', '')}\n"
        f"Description: {alert.get('annotations', {}).get('description', '')}\n"
        f"Deployment {target}: {state}\n"
        "Recent error lines:\n" + "\n".join(errors) + "\n\n"
        + (EXTRA + "\n" if EXTRA else "")
        + "Possible actions: " + "; ".join(f"{k} = {v}" for k, v in ACTIONS.items()) + "\n"
        'Answer only with JSON: {"summary": "two sentences", "cause": "most likely cause", '
        '"action": "one of the possible actions", "reason": "why this action"}'
    )
    answer = http_json(f"{OLLAMA}/api/chat", {
        "model": MODEL, "stream": False, "format": "json",
        "options": {"temperature": 0.2},
        "messages": [{"role": "user", "content": prompt}],
    }, timeout=300)
    result = json.loads(answer["message"]["content"])
    # The model may name anything, only listed actions survive
    if result.get("action") not in ACTIONS:
        result["action"] = "none"
    seconds = answer.get("total_duration", 0) / 1e9
    return result, prompt, round(seconds, 1)


def execute(proposal):
    namespace, name = proposal["target"].split("/")
    if proposal["target"] not in ALLOWED_TARGETS:
        raise PermissionError(f"{proposal['target']} is not in ALLOWED_TARGETS")
    if proposal["action"] == "restart":
        stamp = now()
        kube(f"/apis/apps/v1/namespaces/{namespace}/deployments/{name}",
             {"spec": {"template": {"metadata": {"annotations": {"kubectl.kubernetes.io/restartedAt": stamp}}}}},
             method="PATCH", patch="application/strategic-merge-patch+json")


def triage(alert):
    labels = alert.get("labels", {})
    namespace = labels.get("namespace", "")
    target = f"{namespace}/{labels.get('deployment', 'webshop')}"
    pid = uuid.uuid4().hex[:8]
    audit("alert", id=pid, alert=labels.get("alertname"), target=target)
    errors = recent_errors(namespace)
    state = deployment_state(*target.split("/"))
    try:
        result, prompt, seconds = ask_model(alert, target, errors, state)
    except (OSError, ValueError, KeyError) as error:
        result, prompt, seconds = {"summary": f"Model failed: {error}", "cause": "", "action": "none", "reason": ""}, "", 0
    proposal = {"id": pid, "time": now(), "alert": labels.get("alertname"), "target": target, "status": "pending",
                "seconds": seconds, "errors": errors, "state": state, **result}
    with lock:
        proposals[pid] = proposal
    audit("proposal", id=pid, model=MODEL, seconds=seconds, action=proposal["action"],
          summary=proposal.get("summary"), cause=proposal.get("cause"), reason=proposal.get("reason"))
    if proposal["action"] in AUTONOMOUS and proposal["action"] != "none":
        decide(pid, "approve", "autonomous")


def decide(pid, decision, person):
    with lock:
        proposal = proposals.get(pid)
        if proposal is None or proposal["status"] != "pending":
            return
        proposal["status"] = "approved" if decision == "approve" else "rejected"
        proposal["by"] = person
    audit(proposal["status"], id=pid, by=person, action=proposal["action"], target=proposal["target"])
    if proposal["status"] == "approved" and proposal["action"] != "none":
        try:
            execute(proposal)
            audit("executed", id=pid, action=proposal["action"], target=proposal["target"])
        except (OSError, ValueError, PermissionError) as error:
            audit("failed", id=pid, action=proposal["action"], error=str(error))


def page():
    with lock:
        items = sorted(proposals.values(), key=lambda p: p["time"], reverse=True)
    rows = []
    for p in items:
        e = {k: html.escape(str(p.get(k, ""))) for k in ("id", "time", "alert", "target", "summary", "cause", "action", "reason", "status", "seconds", "by")}
        form = ""
        if p["status"] == "pending":
            form = (f'<form method="post" action="/decide"><input type="hidden" name="id" value="{e["id"]}">'
                    '<input name="person" placeholder="Dein Name" required> '
                    '<button name="decision" value="approve">Freigeben</button> '
                    '<button name="decision" value="reject">Ablehnen</button></form>')
        rows.append(f"<section><h2>{e['alert']} auf {e['target']}</h2><p><small>{e['time']}, Modell {e['seconds']} s, Status {e['status']} {e['by']}</small></p>"
                     f"<p>{e['summary']}</p><p><b>Ursache</b> {e['cause']}</p><p><b>Vorschlag</b> {e['action']}, {e['reason']}</p>"
                     f"<details><summary>Kontext</summary><pre>{html.escape(chr(10).join(p['errors']))}\n\n{html.escape(p['state'])}</pre></details>{form}</section>")
    return ("<!doctype html><html lang=\"de-CH\"><head><meta charset=\"utf-8\"><title>Triage</title>"
            "<style>body{font-family:sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem}section{border-top:1px solid #ccc;padding:1rem 0}pre{white-space:pre-wrap}</style>"
            f"</head><body><h1>Triage von Wolkenwerk</h1><p>Modell {html.escape(MODEL)}, selbständig: {html.escape(', '.join(sorted(AUTONOMOUS)) or 'nichts')}</p>"
            + ("".join(rows) or "<p>Keine Vorschläge.</p>") + "</body></html>")


class Handler(BaseHTTPRequestHandler):
    server_version = f"triage/{VERSION}"

    def send(self, code, kind, body):
        data = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/healthz":
            self.send(200, "text/plain", "ok\n")
        elif self.path == "/":
            self.send(200, "text/html; charset=utf-8", page())
        else:
            self.send(404, "text/plain", "not found\n")

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        if self.path == "/alert":
            message = json.loads(body or b"{}")
            for alert in message.get("alerts", []):
                if alert.get("status") == "firing":
                    threading.Thread(target=triage, args=(alert,), daemon=True).start()
            self.send(200, "text/plain", "ok\n")
        elif self.path == "/decide":
            form = urllib.parse.parse_qs(body.decode())
            person = form.get("person", [""])[0].strip()
            if person:
                decide(form.get("id", [""])[0], form.get("decision", [""])[0], person)
            self.send_response(303)
            self.send_header("Location", "/")
            self.end_headers()
        else:
            self.send(404, "text/plain", "not found\n")

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    os.makedirs(os.path.dirname(AUDIT), exist_ok=True)
    print(f"triage {VERSION} listens on port {PORT}, model {MODEL}, targets {sorted(ALLOWED_TARGETS)}", flush=True)
    ThreadingHTTPServer(("", PORT), Handler).serve_forever()
