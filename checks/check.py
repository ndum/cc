#!/usr/bin/env python3
"""Checks the state of the CC lab and writes a report with a hash.

Run it on the front-end as the user who works with the lab:

    python3 checks/check.py start      end of chapter 0.3, the three VMs are prepared and connected
    python3 checks/check.py install    chapter 2.2, OpenNebula runs with both nodes

The report lands in ~/cc-reports/ and is printed. The hash at its end covers the whole report, so a
changed report no longer matches its hash. The script is public, so the hash proves only that a
report was not edited by hand afterwards, not that the check really ran. The showing of a proof is
what counts.
"""
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
    return run("ssh", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=5", host, command)


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
                            tr("Kapitel 0.3 zeigt, wie der Schlüssel auf die Knoten kommt.", "Chapter 0.3 shows how the key gets to the nodes.")):
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


CHECKS = {"start": check_start, "install": check_install}


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in CHECKS:
        sys.exit(tr("Aufruf: python3 checks/check.py ", "usage: python3 checks/check.py ") + "|".join(CHECKS))
    if not ENV_FILE.exists():
        sys.exit(tr(f"{ENV_FILE} fehlt, Kapitel 0.2 zeigt, wie du sie anlegst.", f"{ENV_FILE} is missing, chapter 0.2 shows how to create it."))
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
