#!/usr/bin/env python3
"""Checks the state of the CC lab and writes a report with a hash.

Run it on the front-end as the user who works with the lab:

    python3 checks/check.py start      end of chapter 0.5, the three VMs are prepared and connected
    python3 checks/check.py install    chapter 2.2, OpenNebula runs with both nodes
    python3 checks/check.py iaas       chapters 2.3 and 2.4, network, template and a VM in the cloud
    python3 checks/check.py tenants    chapters 3.1 to 3.5, members, quotas, showback and the OneFlow service
    python3 checks/check.py platform   chapters 4.2 to 4.5, k3s from OpenTofu, Gitea, Argo CD and member namespaces
    python3 checks/check.py observability  chapters 5.1 to 5.6, metrics, logs, SLO, autoscaling, local model and triage
    python3 checks/check.py operations  chapters 6.1 and 6.2 and UN4, hardening, Sealed Secrets, backups and the new member

The report lands in ~/cc-reports/ and is printed. The hash at its end covers the whole report, so a
changed report no longer matches its hash. The script is public, so the hash proves only that a
report was not edited by hand afterwards, not that the check really ran. The showing of a proof is
what counts.
"""
import base64
import datetime
import getpass
import hashlib
import json
import os
import pathlib
import re
import socket
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

ENV_FILE = pathlib.Path("/etc/cc-lab.env")
REPORT_DIR = pathlib.Path.home() / "cc-reports"
# The language of the report comes from CC_LANG in /etc/cc-lab.env, set by the parameter generator
LANG = "en" if os.environ.get("CC_LANG", "") == "en" else "de"


def tr(de, en):
    return en if LANG == "en" else de


def run(*cmd, timeout=20):
    """Runs a command and returns (exit code, output), never raises"""
    try:
        done = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return done.returncode, (done.stdout + done.stderr).strip()
    except (OSError, subprocess.TimeoutExpired) as error:
        return 1, str(error)


def ssh(host, command):
    # accept-new trusts a node seen for the first time, a changed key still fails
    return run("ssh", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new", "-o", "LogLevel=ERROR", "-o", "ConnectTimeout=5", host, command)


def read_env():
    values = {}
    for line in ENV_FILE.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
    return values


class Report:
    def __init__(self):
        self.lines = []
        self.failed = 0

    def check(self, ok, text, hint=""):
        self.lines.append(f"{'[ok]' if ok else '[!!]'} {text}")
        if not ok:
            self.failed += 1
            if hint:
                self.lines.append(f"     {hint}")
        return ok


def check_start(env, report):
    fe, nodes = env["CC_FE_HOST"], [env["CC_NODE1_HOST"], env["CC_NODE2_HOST"]]
    report.check(socket.gethostname() == fe, tr(f"Dieser Rechner heisst {fe}", f"This machine is called {fe}"),
                 tr("Das Skript läuft auf dem Front-end, prepare.sh setzt den Namen.", "Run the check on the front-end, prepare.sh sets the name."))
    for host, ip in [(fe, env["CC_FE_IP"]), (nodes[0], env["CC_NODE1_IP"]), (nodes[1], env["CC_NODE2_IP"])]:
        try:
            resolved = socket.gethostbyname(host)
        except OSError:
            resolved = "?"
        report.check(resolved == ip, tr(f"{host} löst auf {ip} auf", f"{host} resolves to {ip}"),
                     tr(f"Gefunden: {resolved}, prüfe /etc/hosts.", f"Found: {resolved}, check /etc/hosts."))
    code, out = run("systemctl", "is-active", "rsyslog")
    report.check(out == "active", tr("rsyslog läuft auf dem Front-end", "rsyslog runs on the front-end"))
    report.check(pathlib.Path("/etc/apt/preferences.d/opennebula-nodejs").exists(),
                 tr("Node.js ist auf das OpenNebula-Repo festgelegt", "Node.js is pinned to the OpenNebula repository"))
    code, out = run("ip", "-4", "-br", "addr", "show", "cc-br")
    report.check(env["CC_GUEST_GATEWAY"] in out, tr(f"Gateway {env['CC_GUEST_GATEWAY']} liegt auf cc-br", f"Gateway {env['CC_GUEST_GATEWAY']} is on cc-br"),
                 tr("sudo systemctl restart cc-gateway, dann sudo cc-gateway status", "sudo systemctl restart cc-gateway, then sudo cc-gateway status"))
    code, out = run("ip", "-d", "link", "show", "cc-vxlan")
    report.check(f"vxlan id {env['CC_VNI']} " in out, tr(f"VXLAN {env['CC_VNI']} ist eingerichtet", f"VXLAN {env['CC_VNI']} is set up"))
    report.check(pathlib.Path("/proc/sys/net/ipv4/ip_forward").read_text().strip() == "1",
                 tr("Das Front-end leitet Pakete weiter", "The front-end forwards packets"))
    code, out = run("sudo", "-n", "nft", "list", "table", "ip", "cc_gateway")
    report.check("masquerade" in out, tr("NAT für das Gastnetz ist aktiv", "NAT for the guest network is active"))
    for node in nodes:
        code, out = ssh(node, "hostname; . /etc/os-release; echo $VERSION_ID; grep -cwE 'vmx|svm' /proc/cpuinfo; systemctl is-active rsyslog")
        if not report.check(code == 0, tr(f"SSH ohne Passwort auf {node}", f"SSH without password to {node}"),
                            tr("Kapitel 0.5 zeigt, wie der Schlüssel auf die Knoten kommt.", "Chapter 0.5 shows how the key gets to the nodes.")):
            continue
        name, version, flags, rsyslog = (out.splitlines() + ["", "", "0", ""])[:4]
        report.check(name == node, tr(f"{node} trägt seinen Namen", f"{node} has its name"))
        report.check(version == "26.04", tr(f"{node} läuft mit Ubuntu 26.04", f"{node} runs Ubuntu 26.04"), f"VERSION_ID={version}")
        report.check(flags.isdigit() and int(flags) > 0, tr(f"{node} sieht die Virtualisierung der CPU", f"{node} sees the virtualisation of the CPU"),
                     tr("Nested Virtualization ist für diese VM aus.", "Nested virtualisation is off for this VM."))
        report.check(rsyslog == "active", tr(f"rsyslog läuft auf {node}", f"rsyslog runs on {node}"))


def check_install(env, report):
    code, out = run("systemctl", "is-active", "opennebula")
    report.check(out == "active", tr("Der Dienst opennebula läuft", "The service opennebula runs"))
    code, out = run("sudo", "-n", "-u", "oneadmin", "onehost", "list", "--json")
    hosts = []
    if report.check(code == 0, tr("onehost antwortet", "onehost answers"), out[:200]):
        pool = json.loads(out).get("HOST_POOL", {}).get("HOST", [])
        hosts = pool if isinstance(pool, list) else [pool]
    names = {h.get("NAME"): h for h in hosts}
    for host, ip in [(env["CC_NODE1_HOST"], env["CC_NODE1_IP"]), (env["CC_NODE2_HOST"], env["CC_NODE2_IP"])]:
        entry = names.get(host) or names.get(ip)
        report.check(entry is not None, tr(f"{host} ist als Host eingetragen", f"{host} is registered as a host"))
        if entry is not None:
            # State 2 is MONITORED, the host is on and reports its capacity
            report.check(str(entry.get("STATE")) == "2", tr(f"{host} ist eingeschaltet und überwacht", f"{host} is on and monitored"),
                         f"STATE={entry.get('STATE')}")
    code, out = run("sudo", "-n", "-u", "oneadmin", "oned", "--version")
    match = re.search(r"OpenNebula (\d+\.\d+)", out)
    report.check(match is not None and match.group(1) == "7.4", tr("OpenNebula hat Version 7.4", "OpenNebula has version 7.4"), out[:80])
    try:
        status = urllib.request.urlopen("http://127.0.0.1:2616/", timeout=10).status
    except OSError as error:
        status = str(error)
    report.check(status == 200, tr("Die Weboberfläche antwortet auf Port 2616", "The web interface answers on port 2616"), f"{status}")


def one_json(*args):
    """Runs an OpenNebula command with --json as the current user and returns the parsed result or None"""
    code, out = run(*args, "--json")
    if code != 0:
        return None
    try:
        return json.loads(out)
    except ValueError:
        return None


def as_list(value):
    return value if isinstance(value, list) else [value] if value else []


def check_iaas(env, report):
    code, out = run("onevnet", "list")
    if not report.check(code == 0, tr("Die CLI von OpenNebula läuft als dein Benutzer", "The OpenNebula CLI runs as your user"),
                        tr("Kapitel 2.2 zeigt, wie du ~/.one/one_auth anlegst.", "Chapter 2.2 shows how to create ~/.one/one_auth.")):
        return
    vnet = one_json("onevnet", "show", "cc-net")
    template = (vnet or {}).get("VNET", {}).get("TEMPLATE", {})
    if report.check(vnet is not None, tr("Das Netz cc-net existiert", "The network cc-net exists")):
        report.check(template.get("VN_MAD") == "vxlan", tr("cc-net verwendet VXLAN", "cc-net uses VXLAN"), str(template.get("VN_MAD")))
        report.check(str(template.get("VLAN_ID")) == env["CC_VNI"], tr(f"cc-net hat die VXLAN-Kennung {env['CC_VNI']}", f"cc-net has the VXLAN id {env['CC_VNI']}"),
                     f"VLAN_ID={template.get('VLAN_ID')}")
        report.check(template.get("GATEWAY") == env["CC_GUEST_GATEWAY"], tr(f"cc-net hat das Gateway {env['CC_GUEST_GATEWAY']}", f"cc-net has the gateway {env['CC_GUEST_GATEWAY']}"),
                     f"GATEWAY={template.get('GATEWAY')}")
        report.check(str(template.get("GUEST_MTU")) == "1450", tr("cc-net gibt den Gästen MTU 1450", "cc-net gives the guests MTU 1450"))
    report.check(one_json("onetemplate", "show", "ubuntu") is not None, tr("Die Vorlage ubuntu existiert", "The template ubuntu exists"))
    pool = one_json("onevm", "list") or {}
    vms = as_list(pool.get("VM_POOL", {}).get("VM"))
    prefix = env["CC_GUEST_NET"].rsplit(".", 1)[0] + "."
    running = []
    for vm in vms:
        # LCM_STATE 3 is RUNNING
        if str(vm.get("LCM_STATE")) != "3":
            continue
        for nic in as_list(vm.get("TEMPLATE", {}).get("NIC")):
            if str(nic.get("IP", "")).startswith(prefix):
                running.append((vm.get("NAME"), nic.get("IP")))
    if not report.check(running != [], tr("Eine VM läuft im internen Netz", "A VM runs in the internal network"),
                        tr("Starte eine VM aus der Vorlage ubuntu, Kapitel 2.4.", "Start a VM from the template ubuntu, chapter 2.4.")):
        return
    name, ip = running[0]
    code, out = run("ssh", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new", "-o", "LogLevel=ERROR", "-o", "ConnectTimeout=5", f"root@{ip}",
                    "hostname; curl -s -o /dev/null -w '%{http_code}' https://www.ubuntu.com")
    lines = out.splitlines()
    if report.check(code == 0, tr(f"SSH auf {name} ({ip})", f"SSH to {name} ({ip})"),
                    tr("Ist dein Schlüssel bei oneadmin hinterlegt? Kapitel 2.4.", "Is your key stored for oneadmin? Chapter 2.4.")):
        report.check(lines[:1] == [name], tr(f"{name} trägt seinen Namen aus dem Kontext", f"{name} has its name from the context"))
        report.check(lines[-1:] in (["200"], ["301"]), tr(f"{name} erreicht das Internet über das Gateway", f"{name} reaches the internet through the gateway"),
                     out[-80:])


MEMBERS = ["praxis", "treuhand", "velo", "gemeinde"]


def check_tenants(env, report):
    if not report.check(run("onegroup", "list")[0] == 0, tr("Die CLI von OpenNebula läuft als dein Benutzer", "The OpenNebula CLI runs as your user"),
                        tr("Kapitel 2.2 zeigt, wie du ~/.one/one_auth anlegst.", "Chapter 2.2 shows how to create ~/.one/one_auth.")):
        return
    groups = {}
    for member in MEMBERS:
        group = (one_json("onegroup", "show", member) or {}).get("GROUP")
        if not report.check(group is not None, tr(f"Die Gruppe {member} existiert", f"The group {member} exists"),
                            tr("make-tenants.sh aus Kapitel 3.1", "make-tenants.sh from chapter 3.1")):
            continue
        groups[member] = group
        admin = (one_json("oneuser", "show", f"{member}-admin") or {}).get("USER", {})
        report.check(admin.get("ID") in as_list(group.get("ADMINS", {}).get("ID")),
                     tr(f"{member}-admin verwaltet die Gruppe {member}", f"{member}-admin administers the group {member}"))
        quota = (group.get("VM_QUOTA") or {}).get("VM", {})
        # -1 means the default quota, -2 unlimited, a set quota is a positive number
        report.check(str(quota.get("VMS", "-1")).isdigit(),
                     tr(f"{member} hat eine Quota für VMs", f"{member} has a quota for VMs"), f"VMS={quota.get('VMS')}")
    vdc = (one_json("onevdc", "show", "wolkenwerk") or {}).get("VDC")
    if report.check(vdc is not None, tr("Das VDC wolkenwerk existiert", "The VDC wolkenwerk exists")):
        inside = set(as_list((vdc.get("GROUPS") or {}).get("ID")))
        report.check(all(g.get("ID") in inside for g in groups.values()) and len(groups) == len(MEMBERS),
                     tr("Alle Mitglieder gehören zum VDC wolkenwerk", "All members belong to the VDC wolkenwerk"))
        default = set(as_list(((one_json("onevdc", "show", "default") or {}).get("VDC", {}).get("GROUPS") or {}).get("ID")))
        report.check(not any(g.get("ID") in default for g in groups.values()),
                     tr("Kein Mitglied ist mehr im VDC default", "No member is left in the VDC default"),
                     tr("onevdc delgroup default <gruppe>", "onevdc delgroup default <group>"))
    template = (one_json("onetemplate", "show", "ubuntu") or {}).get("VMTEMPLATE", {})
    report.check(template.get("PERMISSIONS", {}).get("OTHER_U") == "1", tr("Die Mitglieder dürfen die Vorlage ubuntu nutzen", "The members may use the template ubuntu"),
                 "onetemplate chmod ubuntu 604")
    report.check(bool(template.get("TEMPLATE", {}).get("CPU_COST")), tr("Die Vorlage ubuntu hat Preise für Showback", "The template ubuntu has prices for showback"),
                 tr("costs.tpl aus Kapitel 3.3", "costs.tpl from chapter 3.3"))
    records = as_list((one_json("oneshowback", "list") or {}).get("SHOWBACK_RECORDS", {}).get("SHOWBACK"))
    report.check(any(r.get("GNAME") in MEMBERS and float(r.get("TOTAL_COST") or 0) > 0 for r in records),
                 tr("Showback weist einem Mitglied Kosten zu", "Showback assigns costs to a member"),
                 tr("VM eines Mitglieds starten, später oneshowback calculate, Kapitel 3.3", "Start a VM of a member, later oneshowback calculate, chapter 3.3"))
    flow = (one_json("oneflow-template", "show", "treuhand-buchhaltung") or {}).get("DOCUMENT", {})
    roles = flow.get("TEMPLATE", {}).get("BODY", {}).get("roles", [])
    report.check(any(role.get("elasticity_policies") for role in roles),
                 tr("Die Dienstvorlage treuhand-buchhaltung hat Regeln für die Elastizität", "The service template treuhand-buchhaltung has elasticity rules"),
                 tr("make-service.sh aus Kapitel 3.5", "make-service.sh from chapter 3.5"))
    code, out = run("oneflow", "list", "--json")
    try:
        services = as_list(json.loads(out)) if code == 0 else []
    except ValueError:
        services = []
    # State 2 of a service is RUNNING
    report.check(any(s.get("GNAME") == "treuhand" and str(s.get("TEMPLATE", {}).get("BODY", {}).get("state")) == "2" for s in services),
                 tr("Ein Dienst der Treuhand läuft", "A service of the fiduciary office runs"),
                 tr("Als treuhand-admin instanziieren, Kapitel 3.5", "Instantiate it as treuhand-admin, chapter 3.5"))


def kube_json(*args):
    """Runs kubectl with -o json and returns the parsed result or None"""
    code, out = run("kubectl", *args, "-o", "json")
    if code != 0:
        return None
    try:
        return json.loads(out)
    except ValueError:
        return None


def http(url, token=None):
    """Returns (status, body) of a GET request, status 0 when nothing answers"""
    request = urllib.request.Request(url)
    if token:
        request.add_header("Authorization", f"token {token}")
    try:
        with urllib.request.urlopen(request, timeout=5) as answer:
            return answer.status, answer.read().decode(errors="replace")
    except urllib.error.HTTPError as error:
        return error.code, ""
    except (OSError, ValueError):
        return 0, ""


def check_platform(env, report):
    for tool, chapter in (("tofu", "4.2"), ("kubectl", "4.2"), ("helm", "4.2")):
        report.check(run(tool, "version")[0] == 0 or run(tool, "version", "--client")[0] == 0,
                     tr(f"{tool} ist installiert", f"{tool} is installed"),
                     tr(f"install-tools.sh aus Kapitel {chapter}", f"install-tools.sh from chapter {chapter}"))
    state_file = pathlib.Path.home() / "platform" / "tofu" / "terraform.tfstate"
    try:
        state = json.loads(state_file.read_text())
    except (OSError, ValueError):
        state = {}
    vms = [i for r in state.get("resources", []) if r.get("type") == "opennebula_virtual_machine" for i in r.get("instances", [])]
    report.check(len(vms) == 2, tr("Der State von OpenTofu enthält zwei VMs", "The OpenTofu state holds two VMs"),
                 tr(f"tofu apply in {state_file.parent}, Kapitel 4.2", f"tofu apply in {state_file.parent}, chapter 4.2"))
    for name, key in (("k3s-server", "CC_K3S_SERVER_IP"), ("k3s-agent", "CC_K3S_AGENT_IP")):
        vm = (one_json("onevm", "show", name) or {}).get("VM", {})
        ips = [n.get("IP") for n in as_list(vm.get("TEMPLATE", {}).get("NIC"))]
        # LCM state 3 is RUNNING
        report.check(vm.get("LCM_STATE") == "3" and env.get(key) in ips,
                     tr(f"Die VM {name} läuft mit {env.get(key)}", f"The VM {name} runs with {env.get(key)}"))
    nodes = (kube_json("get", "nodes") or {}).get("items", [])
    ready = [n for n in nodes if any(c.get("type") == "Ready" and c.get("status") == "True" for c in n.get("status", {}).get("conditions", []))]
    if not report.check(len(ready) == 2, tr("kubectl erreicht den Cluster, zwei Nodes sind Ready", "kubectl reaches the cluster, two nodes are Ready"),
                        tr("get-kubeconfig.sh aus Kapitel 4.3", "get-kubeconfig.sh from chapter 4.3")):
        return
    pods = (kube_json("get", "pods", "-n", "kube-system") or {}).get("items", [])
    report.check(any(p.get("status", {}).get("podIP", "").startswith("10.52.") for p in pods),
                 tr("Pods erhalten Adressen aus 10.52.0.0/16", "Pods get addresses from 10.52.0.0/16"),
                 tr("--cluster-cidr im Startskript, Kapitel 4.3", "--cluster-cidr in the start script, chapter 4.3"))
    fe = env.get("CC_FE_IP")
    report.check(http(f"http://{fe}:3000/api/healthz")[0] == 200, tr("Gitea läuft auf dem Front-end", "Gitea runs on the front-end"),
                 tr("install-gitea.sh aus Kapitel 4.4", "install-gitea.sh from chapter 4.4"))
    token_file = pathlib.Path.home() / "cc-lab" / "gitea" / "platform.token"
    token = token_file.read_text().strip() if token_file.exists() else None
    report.check(http(f"http://{fe}:3000/api/v1/repos/wolkenwerk/platform", token)[0] == 200,
                 tr("Das Repo wolkenwerk/platform existiert", "The repo wolkenwerk/platform exists"),
                 tr("make-repo.sh aus Kapitel 4.4", "make-repo.sh from chapter 4.4"))
    apps = {a["metadata"]["name"]: a.get("status", {}) for a in (kube_json("get", "applications", "-n", "argocd") or {}).get("items", [])}
    for name in ("root", "webshop", "member-velo"):
        status = apps.get(name, {})
        report.check(status.get("sync", {}).get("status") == "Synced" and status.get("health", {}).get("status") == "Healthy",
                     tr(f"Argo CD hält {name} synchron und gesund", f"Argo CD keeps {name} synced and healthy"),
                     tr("bootstrap-argocd.sh und root.yaml, Kapitel 4.4", "bootstrap-argocd.sh and root.yaml, chapter 4.4"))
    source = apps.get("root", {}).get("sync", {}).get("comparedTo", {}).get("source", {}).get("repoURL", "")
    report.check(source.startswith(f"http://{fe}:3000/"), tr("Argo CD liest den Soll-Zustand aus Gitea", "Argo CD reads the desired state from Gitea"), source)
    deploy = kube_json("get", "deployment", "webshop", "-n", "velo") or {}
    report.check((deploy.get("status", {}).get("readyReplicas") or 0) >= 1, tr("Der Webshop läuft im Namespace velo", "The web shop runs in the namespace velo"))
    report.check(http(f"http://{env.get('CC_K3S_SERVER_IP')}/healthz")[1].strip() == "ok",
                 tr("Der Webshop antwortet über traefik", "The web shop answers through traefik"))
    others = [n for n in apps if n.startswith("member-") and n != "member-velo"]
    report.check(bool(others), tr("Ein weiteres Mitglied hat einen Namespace aus der Vorlage", "Another member has a namespace from the template"),
                 tr("Pull Request mit members/<mitglied>, Kapitel 4.5", "Pull request with members/<member>, chapter 4.5"))
    for namespace in ["velo"] + [n[len("member-"):] for n in others]:
        kinds = [(kind, (kube_json("get", kind, "-n", namespace) or {}).get("items", [])) for kind in ("resourcequota", "limitrange", "networkpolicy")]
        report.check(all(items for _, items in kinds),
                     tr(f"Der Namespace {namespace} hat Quota, LimitRange und NetworkPolicy", f"The namespace {namespace} has quota, LimitRange and NetworkPolicy"),
                     ", ".join(kind for kind, items in kinds if not items))


def check_observability(env, report):
    fe, node1, node2, server = env.get("CC_FE_IP"), env.get("CC_NODE1_IP"), env.get("CC_NODE2_IP"), env.get("CC_K3S_SERVER_IP")
    for target, name in ((f"{fe}:9925", "OpenNebula"), (f"{node1}:9926", "libvirt"), (f"{node2}:9926", "libvirt")):
        report.check(http(f"http://{target}/metrics")[0] == 200, tr(f"Der Exporter {name} antwortet auf {target}", f"The {name} exporter answers on {target}"),
                     tr("install-exporters.sh aus Kapitel 5.1", "install-exporters.sh from chapter 5.1"))
    if not report.check(run("kubectl", "get", "nodes")[0] == 0, tr("kubectl erreicht den Cluster", "kubectl reaches the cluster"),
                        tr("get-kubeconfig.sh aus Kapitel 4.3", "get-kubeconfig.sh from chapter 4.3")):
        return
    apps = {a["metadata"]["name"]: a.get("status", {}) for a in (kube_json("get", "applications", "-n", "argocd") or {}).get("items", [])}
    for name in ("monitoring", "monitoring-config", "loki", "alloy", "ai"):
        status = apps.get(name, {})
        report.check(status.get("sync", {}).get("status") == "Synced" and status.get("health", {}).get("status") == "Healthy",
                     tr(f"Argo CD hält {name} synchron und gesund", f"Argo CD keeps {name} synced and healthy"),
                     tr("Ordner observability/repo ins Plattform-Repo kopieren, Kapitel 5.1", "Copy observability/repo into the platform repo, chapter 5.1"))
    code, body = http(f"http://{server}:30090/api/v1/targets")
    try:
        targets = json.loads(body)["data"]["activeTargets"] if code == 200 else []
    except (ValueError, KeyError):
        targets = []
    for job in ("opennebula", "opennebula-libvirt", "webshop"):
        mine = [t for t in targets if t.get("labels", {}).get("job") == job]
        report.check(bool(mine) and all(t.get("health") == "up" for t in mine),
                     tr(f"Prometheus liest den Job {job}", f"Prometheus scrapes the job {job}"), f"{len(mine)} targets")
    code, body = http(f"http://{server}:30090/api/v1/rules?type=alert")
    report.check("WebshopErrorBudgetBurn" in body, tr("Die Regeln des SLO für den Webshop sind geladen", "The SLO rules of the web shop are loaded"),
                 tr("webshop-slo.yaml, Kapitel 5.3", "webshop-slo.yaml, chapter 5.3"))
    code, body = http(f"http://{server}:30093/api/v2/status")
    report.check("receiver: triage" in body, tr("Alertmanager schickt die Alerts des Webshops an den Triage-Dienst", "Alertmanager sends the web shop alerts to the triage service"))
    pass_file = pathlib.Path.home() / "cc-lab" / "grafana.pass"
    password = pass_file.read_text().strip() if pass_file.exists() else ""
    base = f"http://{server}:30300"
    request = urllib.request.Request(f"{base}/api/datasources/proxy/uid/loki/loki/api/v1/query?" + urllib.parse.urlencode({"query": 'count_over_time({namespace="velo"}[1h])'}))
    request.add_header("Authorization", "Basic " + base64.b64encode(f"admin:{password}".encode()).decode())
    try:
        with urllib.request.urlopen(request, timeout=10) as answer:
            logs = json.loads(answer.read())["data"]["result"]
    except (OSError, ValueError, KeyError):
        logs = []
    report.check(bool(logs), tr("Loki hat Logs aus dem Namespace velo", "Loki holds logs of the namespace velo"),
                 tr("Loki und Alloy, Kapitel 5.2", "Loki and Alloy, chapter 5.2"))
    hpa = kube_json("get", "hpa", "webshop", "-n", "velo") or {}
    report.check(hpa.get("spec", {}).get("maxReplicas", 0) > hpa.get("spec", {}).get("minReplicas", 0) > 0,
                 tr("Der Webshop hat einen HorizontalPodAutoscaler", "The web shop has a HorizontalPodAutoscaler"),
                 tr("hpa.yaml, Kapitel 5.4", "hpa.yaml, chapter 5.4"))
    code, out = run("kubectl", "-n", "ai", "exec", "deploy/ollama", "--", "ollama", "list", timeout=30)
    report.check(code == 0 and len(out.splitlines()) > 1, tr("Ollama hat ein Modell geladen", "Ollama has a model loaded"), out.splitlines()[-1] if out else "")
    code, out = run("kubectl", "-n", "ai", "exec", "deploy/triage", "--", "cat", "/data/audit.jsonl", timeout=30)
    events = []
    for line in out.splitlines() if code == 0 else []:
        try:
            events.append(json.loads(line).get("event"))
        except ValueError:
            pass
    report.check("proposal" in events, tr("Der Triage-Dienst hat einen Vorschlag gemacht", "The triage service made a proposal"),
                 tr("Alert des Webshops auslösen, Kapitel 5.6", "Fire a web shop alert, chapter 5.6"))
    report.check("approved" in events or "rejected" in events, tr("Ein Mensch hat über einen Vorschlag entschieden", "A person decided on a proposal"),
                 tr("Seite des Triage-Dienstes, Kapitel 5.6", "Page of the triage service, chapter 5.6"))


def check_operations(env, report):
    home = pathlib.Path.home()
    # Chapter 6.1, the front-end
    code, out = run("ssh", "-o", "BatchMode=yes", "-o", "PubkeyAuthentication=no", "-o", "StrictHostKeyChecking=accept-new",
                    "-o", "ConnectTimeout=5", "localhost", "true")
    methods = out.rsplit("(", 1)[-1] if "Permission denied" in out else out
    report.check("Permission denied" in out and "password" not in methods and "keyboard-interactive" not in methods,
                 tr("SSH auf dem Front-end nimmt nur noch Schlüssel an", "SSH on the front-end only accepts keys"),
                 tr("harden-frontend.sh aus Kapitel 6.1", "harden-frontend.sh from chapter 6.1"))
    report.check(run("systemctl", "is-active", "cc-firewall")[1] == "active",
                 tr("Die Firewall des Front-ends ist aktiv", "The firewall of the front-end is active"),
                 tr("harden-frontend.sh aus Kapitel 6.1", "harden-frontend.sh from chapter 6.1"))
    report.check('"1"' in run("apt-config", "dump", "APT::Periodic::Unattended-Upgrade")[1],
                 tr("Sicherheitsupdates laufen automatisch", "Security updates run automatically"))
    if not report.check(run("kubectl", "get", "nodes")[0] == 0, tr("kubectl erreicht den Cluster", "kubectl reaches the cluster"),
                        tr("get-kubeconfig.sh aus Kapitel 4.3", "get-kubeconfig.sh from chapter 4.3")):
        return
    apps = {a["metadata"]["name"]: a.get("status", {}) for a in (kube_json("get", "applications", "-n", "argocd") or {}).get("items", [])}
    for name in ("sealed-secrets", "secrets"):
        status = apps.get(name, {})
        report.check(status.get("sync", {}).get("status") == "Synced" and status.get("health", {}).get("status") == "Healthy",
                     tr(f"Argo CD hält {name} synchron und gesund", f"Argo CD keeps {name} synced and healthy"),
                     tr("Ordner operations/repo ins Plattform-Repo kopieren, Kapitel 6.1", "Copy operations/repo into the platform repo, chapter 6.1"))
    secret = kube_json("get", "secret", "grafana-admin", "-n", "monitoring") or {}
    owners = [o.get("kind") for o in secret.get("metadata", {}).get("ownerReferences", [])]
    report.check("SealedSecret" in owners, tr("Das Grafana-Passwort kommt als SealedSecret aus Git", "The Grafana password comes from Git as a SealedSecret"),
                 tr("seal-secrets.sh aus Kapitel 6.1", "seal-secrets.sh from chapter 6.1"))
    members = [n[len("member-"):] for n in apps if n.startswith("member-")]
    loose = []
    for namespace in members:
        labels = (kube_json("get", "namespace", namespace) or {}).get("metadata", {}).get("labels", {})
        if labels.get("pod-security.kubernetes.io/enforce") != "restricted":
            loose.append(namespace)
    report.check(bool(members) and not loose, tr("Alle Mitglieder laufen mit dem Profil restricted", "All members run with the profile restricted"),
                 ", ".join(loose))
    # Chapter 6.2, backups
    server = env.get("CC_K3S_SERVER_IP")
    code, out = ssh(f"root@{server}", "k3s etcd-snapshot ls")
    snapshots = [line for line in out.splitlines() if "snapshot" in line and not line.startswith("Name")] if code == 0 else []
    report.check(bool(snapshots), tr("k3s läuft mit etcd und hat Snapshots", "k3s runs with etcd and has snapshots"),
                 tr("--cluster-init im Startskript, Kapitel 6.2", "--cluster-init in the start script, chapter 6.2"))
    backup = home / "backup" / "k3s"
    copies = list((backup / "snapshots").glob("*")) if (backup / "snapshots").is_dir() else []
    report.check(bool(copies) and (backup / "token").exists() and (backup / "sealed-secrets-key.yaml").exists(),
                 tr("Snapshots, Token und Schlüssel liegen auf dem Front-end", "Snapshots, token and key are stored on the front-end"),
                 tr("backup-k3s.sh aus Kapitel 6.2", "backup-k3s.sh from chapter 6.2"))
    report.check(run("systemctl", "is-active", "cc-backup-k3s.timer")[1] == "active",
                 tr("Ein Timer kopiert die Snapshots regelmässig", "A timer copies the snapshots regularly"),
                 tr("install-backup-timer.sh aus Kapitel 6.2", "install-backup-timer.sh from chapter 6.2"))
    datastore = (one_json("onedatastore", "show", "backups") or {}).get("DATASTORE", {})
    report.check(datastore.get("TYPE") == "3", tr("OpenNebula hat einen Backup-Datastore", "OpenNebula has a backup datastore"),
                 tr("backup-datastore.sh aus Kapitel 6.2", "backup-datastore.sh from chapter 6.2"))
    jobs = as_list(((one_json("onebackupjob", "list") or {}).get("BACKUPJOB_POOL") or {}).get("BACKUPJOB"))
    report.check(any(j.get("SCHED_ACTIONS") for j in jobs),
                 tr("Ein Backup-Job läuft nach Zeitplan", "A backup job runs on a schedule"), tr("backup-job.sh aus Kapitel 6.2", "backup-job.sh from chapter 6.2"))
    images = as_list(((one_json("oneimage", "list") or {}).get("IMAGE_POOL") or {}).get("IMAGE"))
    # Image type 6 is a backup
    report.check(any(i.get("TYPE") == "6" for i in images), tr("Es gibt ein Backup einer VM", "There is a backup of a VM"))
    # UN4, the fifth member
    groups = as_list(((one_json("onegroup", "list") or {}).get("GROUP_POOL") or {}).get("GROUP"))
    new = [g for g in groups if g.get("NAME") not in set(MEMBERS) | {"oneadmin", "users"}]
    quotas = [((one_json("onegroup", "show", g.get("NAME")) or {}).get("GROUP", {}).get("VM_QUOTA") or {}).get("VM") or {} for g in new]
    with_quota = [q for q in quotas if str(q.get("VMS", "-1")).isdigit()]
    report.check(bool(with_quota), tr("Das neue Mitglied hat eine Gruppe mit Quota in OpenNebula", "The new member has a group with a quota in OpenNebula"),
                 tr("UN4, wie Kapitel 3.1 und 3.2", "UN4, as in chapters 3.1 and 3.2"))
    vms = as_list(((one_json("onevm", "list") or {}).get("VM_POOL") or {}).get("VM"))
    report.check(any(v.get("GNAME") in {g.get("NAME") for g in new} and v.get("LCM_STATE") == "3" for v in vms),
                 tr("Eine VM des neuen Mitglieds läuft", "A VM of the new member runs"))
    others = [n for n in members if n not in ("velo", "gemeinde")]
    running = [n for n in others if any((d.get("status", {}).get("readyReplicas") or 0) > 0
                                        for d in (kube_json("get", "deployments", "-n", n) or {}).get("items", []))]
    report.check(bool(running), tr("Das neue Mitglied hat einen Namespace mit einer laufenden App", "The new member has a namespace with a running app"),
                 tr("UN4, Ordner in members/ mit Vorlage und App", "UN4, folder in members/ with the template and an app"))
    rules = json.dumps(kube_json("get", "prometheusrules", "-A") or {})
    report.check(any(f'namespace=\\"{n}\\"' in rules for n in others), tr("Eine Alert-Regel überwacht das neue Mitglied", "An alert rule watches the new member"),
                 tr("UN4, wie Kapitel 5.3", "UN4, as in chapter 5.3"))


CHECKS = {"start": check_start, "install": check_install, "iaas": check_iaas, "tenants": check_tenants, "platform": check_platform,
          "observability": check_observability, "operations": check_operations}


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in CHECKS:
        sys.exit(tr("Aufruf: python3 checks/check.py ", "usage: python3 checks/check.py ") + "|".join(CHECKS))
    if not ENV_FILE.exists():
        sys.exit(tr(f"{ENV_FILE} fehlt, Kapitel 0.3 zeigt, wie du sie anlegst.", f"{ENV_FILE} is missing, chapter 0.3 shows how to create it."))
    name = sys.argv[1]
    env = read_env()
    global LANG
    LANG = "en" if env.get("CC_LANG", os.environ.get("CC_LANG", "")) == "en" else "de"
    report = Report()
    CHECKS[name](env, report)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    code, addresses = run("hostname", "-I")
    head = [
        f"CC check {name}",
        f"code {env.get('CC_CODE')}, host {socket.gethostname()}, user {getpass.getuser()}",
        f"addresses {addresses}",
        f"time {now}",
        "",
    ]
    total = len([line for line in report.lines if line.startswith("[")])
    foot = ["", tr(f"{total - report.failed} von {total} Prüfungen erfüllt", f"{total - report.failed} of {total} checks passed")]
    body = "\n".join(head + report.lines + foot)
    digest = hashlib.sha256(body.encode()).hexdigest()[:16]
    text = f"{body}\nhash {digest}\n"
    REPORT_DIR.mkdir(exist_ok=True)
    path = REPORT_DIR / f"{name}-{now.replace(':', '')}.txt"
    path.write_text(text)
    print(text)
    print(tr(f"Bericht gespeichert in {path}", f"Report saved to {path}"))
    sys.exit(1 if report.failed else 0)


if __name__ == "__main__":
    main()
