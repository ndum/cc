---
title: VMs vorbereiten
description: Sudo ohne Passwort, Git und das Kursrepo auf den drei Servern, das Vorbereitungsskript für Front-end und Knoten, was es einrichtet und wie du das Gateway prüfst.
sidebar:
  order: 4
---

:::assignment
«Die Server haben jetzt Namen und Adressen», schreibt Simone Wyss. «Was fehlt noch, bevor die Cloud darauf kommt?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Deinem Benutzer auf den Servern sudo ohne Passwort erlauben
- Das Kursrepo auf die Server holen
- Jeden Server mit dem Vorbereitungsskript für seine Rolle vorbereiten
- Erklären, was das Skript auf Front-end und Knoten einrichtet
- Das Gateway des internen Netzes prüfen
:::

## Sudo ohne Passwort

Für alle Schritte dieses Kapitels meldest du dich vom Client aus per SSH an den Servern an. Ansible führt in Kapitel 2.2 Befehle als Administrator aus, ohne nach einem Passwort zu fragen. Erlaube deshalb deinem Benutzer auf jedem der drei Server sudo ohne Passwort. Der Befehl fragt ein letztes Mal nach dem Passwort.

```bash
echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$USER
```

Danach läuft `sudo -n true` ohne Rückfrage durch.

## Das Kursrepo

Die Skripte des Kurses liegen im Kursrepo. Die minimale Installation von Ubuntu enthält kein Git, deshalb installierst du es zuerst. Danach holst du das Kursrepo auf jedem der drei Server in dein Home-Verzeichnis.

```bash
sudo apt install -y git
git clone https://github.com/ndum/cc.git
```

## Das Vorbereitungsskript

Das Skript `lab/prepare.sh` bereitet einen Server für seine Rolle vor und liest dafür deine Parameter aus `/etc/cc-lab.env`. Du startest es auf jedem Server mit der passenden Rolle, `fe` auf dem Front-end, `node1` und `node2` auf den Knoten.

```bash
sudo ./cc/lab/prepare.sh node1
```

Auf jedem Server setzt das Skript den Hostnamen, trägt die Namen aller drei Server in `/etc/hosts` ein und installiert rsyslog.

::code{file="lab/prepare.sh" lines="47-59"}

Auf den Knoten prüft es, ob die CPU-Virtualisierung ankommt. Es nennt dort auch die Netzwerkschnittstelle, die OpenNebula später braucht. Auf dem Front-end installiert es acl und nftables und holt Node.js aus der Paketquelle von OpenNebula. Ausserdem richtet es das Gateway für das interne Netz als Dienst `cc-gateway` ein, der bei jedem Start läuft.

Das Skript darf mehrmals laufen, es ändert nur, was noch nicht stimmt. Bricht es mit einer Fehlermeldung ab, nennt die Meldung, was fehlt, etwa eine falsche Adresse in `/etc/cc-lab.env` oder einen Knoten ohne verschachtelte Virtualisierung.

## Das Gateway

Der Dienst `cc-gateway` verbindet das Front-end mit dem internen Netz deiner Cloud. Er legt das VXLAN mit deiner Kennung an und gibt dem Front-end darin die Adresse des Gateways. Den Verkehr der Cloud leitet er mit NAT ins Internet. Den Zustand zeigt `cc-gateway status`.

```bash
sudo cc-gateway status
```

Die Ausgabe nennt das Gateway auf `cc-br`, das VXLAN mit Kennung und Multicast-Gruppe, die Weiterleitung und die NAT-Regel mit deinem internen Netz.

Auf smartlearn kannst du von jeder VM einen Snapshot anlegen. Ein Snapshot der drei Server am Ende dieses Kapitels bringt dich zum vorbereiteten Lab zurück, falls später etwas schiefgeht.

::::exercise[Lab]
Erlaube sudo ohne Passwort, hole das Kursrepo auf alle drei Server und führe `prepare.sh` mit der richtigen Rolle aus, zuerst auf den Knoten, dann auf dem Front-end. Notiere dir die Netzwerkschnittstelle, die das Skript auf den Knoten nennt.

:::solution
Auf jedem Server endet das Skript mit dem Abschnitt «Done». Auf den Knoten nennt es dieselbe Schnittstelle, die du in Kapitel 0.3 in den Generator eingetragen hast. `sudo cc-gateway status` zeigt auf dem Front-end das Gateway, die VXLAN-Kennung und die NAT-Regel mit den Werten aus `/etc/cc-lab.env`. Den vollständigen Check startest du am Ende von [Kapitel 0.5](../tools/), weil er auch die SSH-Verbindung vom Front-end zu den Knoten prüft.
:::
::::
