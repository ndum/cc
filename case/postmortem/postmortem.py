#!/usr/bin/env python3
"""Draft of a postmortem by the local language model, chapter 6.3.

Runs on the front-end. The script collects the facts of an incident itself: the alerts from
Prometheus, the audit log of the triage service and the commits in the platform repo. From them it
builds the timeline without the model. The model only writes the text around it, a summary, the
impact, the causes and proposed measures. A person checks and corrects the draft before anyone
else reads it.

    ~/cc/case/postmortem/postmortem.py --hours 3 > postmortem.md

It only needs the standard library, kubectl and git.
"""
import argparse
import datetime
import json
import os
import socket
import subprocess
import time
import urllib.parse
import urllib.request

MODEL = os.environ.get("MODEL", "llama3.2:3b")
REPO = os.path.expanduser(os.environ.get("PLATFORM_REPO", "~/platform"))
UTC = datetime.timezone.utc


def lab_env():
    env = {}
    with open("/etc/cc-lab.env", encoding="utf-8") as f:
        for line in f:
            if "=" in line:
                key, value = line.strip().split("=", 1)
                env[key] = value
    return env


def http_json(url, data=None, timeout=10):
    body = json.dumps(data).encode() if data is not None else None
    request = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=timeout) as answer:
        return json.loads(answer.read())


def stamp(seconds):
    return datetime.datetime.fromtimestamp(seconds, UTC).strftime("%Y-%m-%d %H:%M")


def alerts(prometheus, start, end):
    """Firing alerts as (first seen, last seen, name, namespace), from the series ALERTS"""
    params = urllib.parse.urlencode({"query": 'ALERTS{alertstate="firing"}', "start": start, "end": end, "step": 60})
    result = http_json(f"{prometheus}/api/v1/query_range?{params}")["data"]["result"]
    found = []
    for series in result:
        times = [float(t) for t, _ in series["values"]]
        labels = series["metric"]
        # These two always fire, they only show that the alerting itself works
        if labels.get("alertname") in ("Watchdog", "InfoInhibitor"):
            continue
        found.append((min(times), max(times), labels.get("alertname", "?"), labels.get("namespace", "")))
    return sorted(found)


def audit_log(start):
    """Entries of the audit log of the triage service since start"""
    out = subprocess.run(["kubectl", "-n", "ai", "exec", "deploy/triage", "--", "cat", "/data/audit.jsonl"],
                         capture_output=True, text=True, check=False).stdout
    entries = []
    for line in out.splitlines():
        try:
            entry = json.loads(line)
            seconds = datetime.datetime.strptime(entry["time"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC).timestamp()
        except (ValueError, KeyError):
            continue
        if seconds >= start:
            entries.append((seconds, entry))
    return entries


def commits(start):
    """Commits in the platform repo since start, with the changed lines"""
    out = subprocess.run(["git", "-C", REPO, "log", f"--since=@{int(start)}", "--reverse", "--format=%x1e%ct %an: %s", "-p", "-U0"],
                         capture_output=True, text=True, check=False).stdout
    found = []
    for block in out.split("\x1e")[1:]:
        head, _, diff = block.partition("\n")
        seconds, _, subject = head.partition(" ")
        changed = [line for line in diff.splitlines() if line[:1] in "+-" and line[:3] not in ("+++", "---")]
        found.append((float(seconds), subject, changed[:12]))
    return found


def timeline(alert_list, audit_entries, commit_list):
    events = [(s, f"commit {subject}") for s, subject, _ in commit_list]
    for first, last, name, namespace in alert_list:
        events.append((first, f"alert {name} ({namespace}) fires"))
        events.append((last, f"alert {name} ({namespace}) last seen firing"))
    for seconds, entry in audit_entries:
        details = {k: v for k, v in entry.items() if k in ("alert", "action", "by", "target", "cause")}
        events.append((seconds, f"triage {entry['event']} {json.dumps(details, ensure_ascii=False)}"))
    return [f"- {stamp(s)} UTC {text}" for s, text in sorted(events)]


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def ask_model(facts, language):
    port = free_port()
    # Ollama has no address outside the cluster, kubectl forwards a local port for the duration of the question
    forward = subprocess.Popen(["kubectl", "-n", "ai", "port-forward", "svc/ollama", f"{port}:11434"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(3)
        prompt = (
            f"You help the platform team of a small cloud write a postmortem. Write in {language}.\n"
            "The postmortem is blameless, it names causes in systems and processes, never guilty persons.\n"
            "Use only the facts below. If a fact is missing, write that it is missing instead of guessing.\n\n"
            + facts + "\n\n"
            'Answer only with JSON: {"summary": "three sentences", "impact": "what users noticed and how long", '
            '"causes": "the causes that the facts show", "went_well": "what went well", '
            '"to_improve": "what went badly", "measures": ["concrete measures, each with an owner role"]}'
        )
        answer = http_json(f"http://127.0.0.1:{port}/api/chat", {
            "model": MODEL, "stream": False, "format": "json",
            "options": {"temperature": 0.2},
            "messages": [{"role": "user", "content": prompt}],
        }, timeout=600)
    finally:
        forward.terminate()
    return json.loads(answer["message"]["content"]), round(answer.get("total_duration", 0) / 1e9, 1)


def main():
    parser = argparse.ArgumentParser(description="Draft of a postmortem by the local model")
    parser.add_argument("--hours", type=float, default=3, help="how far back the incident starts")
    args = parser.parse_args()
    env = lab_env()
    german = env.get("CC_LANG", "de") == "de"
    end = time.time()
    start = end - args.hours * 3600

    alert_list = alerts(f"http://{env['CC_K3S_SERVER_IP']}:30090", start, end)
    audit_entries = audit_log(start)
    commit_list = commits(start)
    lines = timeline(alert_list, audit_entries, commit_list)
    changes = [f"{stamp(s)} UTC {subject}\n" + "\n".join(f"    {c}" for c in changed) for s, subject, changed in commit_list]
    facts = "Timeline:\n" + "\n".join(lines) + "\n\nChanges in Git:\n" + "\n".join(changes)

    text, seconds = ask_model(facts, "Swiss Standard German without the letter ß" if german else "English")
    titles = (["Entwurf eines Postmortems", "Vom Modell geschrieben, von einer Person zu prüfen", "Zusammenfassung",
               "Auswirkung", "Ursachen", "Was gut lief", "Was schlecht lief", "Massnahmen", "Zeitlinie aus den Daten"]
              if german else
              ["Draft of a postmortem", "Written by the model, to be checked by a person", "Summary",
               "Impact", "Causes", "What went well", "What went badly", "Measures", "Timeline from the data"])

    def section(value):
        return "\n".join(f"- {v}" for v in value) if isinstance(value, list) else str(value or "")

    print(f"# {titles[0]}\n\n{titles[1]}, {MODEL}, {seconds} s, {stamp(start)} to {stamp(end)} UTC\n")
    for title, key in zip(titles[2:8], ["summary", "impact", "causes", "went_well", "to_improve", "measures"]):
        print(f"## {title}\n\n{section(text.get(key))}\n")
    print(f"## {titles[8]}\n\n" + ("\n".join(lines) or "-"))


if __name__ == "__main__":
    main()
