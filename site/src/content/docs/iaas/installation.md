---
title: Installation mit OneDeploy
description: Ansible und OneDeploy auf dem Front-end, das Inventar deines Labs, ein Lauf, der OpenNebula 7.4 auf drei VMs installiert, und das Lesen eines Laufs, der abbricht.
sidebar:
  order: 2
---

:::assignment
«Der Vorstand hat sich für OpenNebula entschieden», schreibt Simone Wyss. «Die Software ist frei, kommt aus Europa und läuft auf unseren drei Servern. Kannst du sie so installieren, dass wir das bei einem neuen Server jederzeit wiederholen können?»
:::

:::goals
Nach diesem Kapitel kannst du

- erklären, wie Ansible mit einem Inventar und Playbooks arbeitet,
- OneDeploy auf dem Front-end einrichten,
- das Inventar deines Labs erzeugen und lesen,
- OpenNebula 7.4 mit einem Lauf von OneDeploy installieren,
- die Meldung eines abgebrochenen Laufs lesen und den Fehler beheben.
:::

## Ansible und OneDeploy

Ansible richtet Server über SSH ein. Ein Inventar listet die Server und ihre Gruppen, ein Playbook beschreibt Schritte, die Ansible auf diesen Servern ausführt. Ansible beschreibt den Zielzustand, nicht die einzelnen Befehle. Ein zweiter Lauf ändert deshalb nur, was noch nicht stimmt.

OneDeploy ist die Sammlung von Playbooks, mit der das OpenNebula-Projekt eine Cloud aus einem Front-end und mehreren Knoten aufbaut. Der Kurs verwendet die Version `release-1.4.1`, mit der er getestet ist. Ansible läuft auf dem Front-end und richtet von dort aus das Front-end selbst und beide Knoten ein.

![Wie OneDeploy das Lab einrichtet. Ansible auf dem Front-end liest das Inventar und die Playbooks von OneDeploy. Es richtet das Front-end lokal ein, mit oned, Scheduler und FireEdge, und die beiden Knoten über SSH, mit KVM und libvirt.](../../../assets/figures/de/p2c2-deploy.svg)

## OneDeploy einrichten

Das Skript `lab/one-deploy/install.sh` installiert Ansible aus den Paketen von Ubuntu, holt OneDeploy in der Kursversion nach `~/cc-lab/one-deploy` und installiert die Ansible-Collections, die OneDeploy braucht.

```bash
~/cc/lab/one-deploy/install.sh
```

::code{file="lab/one-deploy/install.sh" lines="15-22"}

## Das Inventar

Das Inventar beschreibt dein Lab für OneDeploy. Das Skript `make-inventory.sh` schreibt es aus deinen persönlichen Parametern und erzeugt beim ersten Aufruf ein zufälliges Passwort für den Benutzer `oneadmin`, den Administrator von OpenNebula. Das Passwort liegt danach in `~/cc-lab/oneadmin.pass`.

```bash
~/cc/lab/one-deploy/make-inventory.sh > ~/cc-lab/inventory.yml
```

::code{file="lab/one-deploy/make-inventory.sh" lines="18-42"}

Die Gruppe `frontend` enthält das Front-end, die Gruppe `node` die beiden Knoten. Weil Ansible auf dem Front-end läuft, verbindet es sich mit ihm lokal statt über SSH, das sagt `ansible_connection: local`. Unter `vars` stehen Werte, die für alle gelten. `one_version` legt die Version von OpenNebula fest, `ds` mit `mode: ssh` sagt, dass die Knoten Images über SSH erhalten und kein gemeinsamer Speicher nötig ist. Netze für die VMs deiner Mitglieder legst du in Kapitel 2.3 selbst an, das Inventar enthält deshalb noch keine.

Bevor du installierst, prüfst du, ob Ansible alle drei VMs erreicht.

```bash
cd ~/cc-lab/one-deploy
ansible -i ../inventory.yml all -m ping
```

## OpenNebula installieren

Der Lauf von OneDeploy dauert zehn bis zwanzig Minuten. Er richtet die Paketquellen ein, installiert auf dem Front-end die Datenbank, den Dienst `oned`, den Scheduler und die Weboberfläche FireEdge und auf den Knoten KVM mit libvirt. Zum Schluss trägt er die Knoten als Hosts ein.

```bash
cd ~/cc-lab/one-deploy
ansible-playbook -i ../inventory.yml opennebula.deploy.main | tee ../deploy.log
```

Am Ende steht der Abschnitt `PLAY RECAP` mit einer Zeile pro VM. Bei einer erfolgreichen Installation steht in jeder Zeile `failed=0`.

## Einen abgebrochenen Lauf lesen

Bricht ein Lauf ab, steht weiter oben eine Zeile mit `fatal:` und dem Namen der VM, darunter die Meldung. Davor zeigt Ansible die Aufgabe, an der es gescheitert ist, und die Datei, in der diese Aufgabe steht. Lies zuerst die Meldung, dann die Aufgabe. Meist erklärt die Meldung den Fehler schon.

Bei der Entwicklung dieses Kurses brach der Lauf viermal ab, und jeder Abbruch steckt heute im Vorbereitungsskript aus [Kapitel 0.2](../../start/lab/):

| Meldung | Ursache | Lösung im Kurs |
|---|---|---|
| `Please make sure each cluster member can resolve all Front-end hostnames` | Die VMs kannten die Namen der anderen nicht. | `prepare.sh` schreibt alle Namen in `/etc/hosts`, das Inventar setzt `ensure_hosts`. |
| `Could not find the requested service rsyslog.service` | Das minimale Ubuntu 26.04 enthält rsyslog nicht. | `prepare.sh` installiert rsyslog auf allen VMs. |
| `opennebula-fireedge ... Depends nodejs (<= 21)` | Ubuntu bietet ein neueres Node.js an als die Weboberfläche verträgt. | `prepare.sh` legt fest, dass Node.js aus dem Repo von OpenNebula kommt. |
| `Failed to set permissions on the temporary files Ansible needs to create when becoming an unprivileged user` | Ansible wechselt auf dem Front-end zum Benutzer `oneadmin` und braucht dafür das Paket acl. | `prepare.sh` installiert acl auf dem Front-end. |

Nach einer Korrektur startest du den Lauf einfach noch einmal. Weil Ansible den Zielzustand beschreibt, überspringt es alles, was schon stimmt.

## Prüfen

Ob OpenNebula läuft und beide Knoten bereit sind, zeigt `onehost list`. Den Befehl führst du als Benutzer `oneadmin` aus. In der Spalte `STAT` muss bei beiden Knoten `on` stehen.

```bash
sudo -iu oneadmin onehost list
```

Die Weboberfläche erreichst du im Browser unter Port 2616 des Front-ends, zum Beispiel `http://192.168.42.10:2616/`. Du meldest dich als `oneadmin` mit dem Passwort aus `~/cc-lab/oneadmin.pass` an.

Der Check dieses Kapitels prüft den Dienst, die Version, beide Hosts und die Weboberfläche.

```bash
python3 ~/cc/checks/check.py install
```

::::exercise[Lab]
Installiere OpenNebula 7.4 mit OneDeploy, prüfe die Hosts mit `onehost list`, melde dich an der Weboberfläche an und lade den Bericht des Checks `install` in dein Abgabe-Repo.

:::solution
Der Check endet mit «8 von 8 Prüfungen erfüllt». `onehost list` zeigt beide Knoten mit `on` in der Spalte `STAT`. Steht dort `err`, zeigt `onehost show` und der Name des Hosts im Abschnitt `MONITORING` den Grund, oft eine fehlende SSH-Verbindung vom Front-end zum Knoten.
:::
::::
