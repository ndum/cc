---
title: VMs vorbereiten
description: Git und das Kursrepo auf den VMs, das Vorbereitungsskript für Front-end und Knoten, was es einrichtet und wie du das Gateway prüfst.
sidebar:
  order: 4
---

:::assignment
«Die Server haben jetzt Namen und Adressen», schreibt Simone Wyss. «Was fehlt noch, bevor die Cloud darauf kommt?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Das Kursrepo auf die VMs holen
- Jede VM mit dem Vorbereitungsskript für ihre Rolle vorbereiten
- Erklären, was das Skript auf Front-end und Knoten einrichtet
- Das Gateway des internen Netzes prüfen
:::

## Das Kursrepo

Die Skripte des Kurses liegen im Kursrepo. Die minimale Installation von Ubuntu enthält kein Git, deshalb installierst du es zuerst. Danach holst du das Kursrepo auf jeder der drei VMs in dein Home-Verzeichnis.

```bash
sudo apt install -y git
git clone https://github.com/ndum/cc.git
```

## Das Vorbereitungsskript

Das Skript `lab/prepare.sh` bereitet eine VM für ihre Rolle vor. Es liest deine Parameter aus `/etc/cc-lab.env`. Du startest es auf jeder VM mit der passenden Rolle, also `fe` auf dem Front-end und `node1` und `node2` auf den Knoten.

```bash
sudo ./cc/lab/prepare.sh node1
```

Auf jeder VM setzt das Skript den Hostnamen, trägt die Namen aller drei VMs in `/etc/hosts` ein und installiert rsyslog.

::code{file="lab/prepare.sh" lines="47-59"}

Auf den Knoten prüft es, ob die CPU-Virtualisierung ankommt, und nennt die Netzwerkschnittstelle, die OpenNebula später braucht. Auf dem Front-end installiert es acl und nftables, legt fest, dass Node.js aus der Paketquelle von OpenNebula kommt, und richtet das Gateway für das interne Netz als Dienst `cc-gateway` ein, der bei jedem Start läuft.

Das Skript darf mehrmals laufen. Es ändert nur, was noch nicht stimmt. Wenn es mit einer Fehlermeldung abbricht, sagt die Meldung, was fehlt, etwa eine falsche Adresse in `/etc/cc-lab.env` oder ein Knoten ohne verschachtelte Virtualisierung.

## Das Gateway

Der Dienst `cc-gateway` verbindet das Front-end mit dem internen Netz deiner Cloud. Er legt ein VXLAN-Netz mit deiner Kennung an, gibt dem Front-end darin die Adresse des Gateways und leitet den Verkehr der Cloud mit NAT ins Internet. Den Zustand zeigt `cc-gateway status`.

```bash
sudo cc-gateway status
```

Die Ausgabe nennt das Gateway auf `cc-br`, das VXLAN-Netz mit Kennung und Multicast-Gruppe, die Weiterleitung und die NAT-Regel mit deinem internen Netz.

::::exercise[Lab]
Hole das Kursrepo auf alle drei VMs und führe `prepare.sh` mit der richtigen Rolle aus, zuerst auf den Knoten, dann auf dem Front-end. Notiere dir die Netzwerkschnittstelle, die das Skript auf den Knoten nennt.

:::solution
Auf jeder VM endet das Skript mit dem Abschnitt «Done». Auf den Knoten nennt es die Schnittstelle, auf smartlearn meist `ens160` oder `eth0`. `sudo cc-gateway status` zeigt auf dem Front-end das Gateway, die VXLAN-Kennung und die NAT-Regel mit den Werten aus `/etc/cc-lab.env`. Den vollständigen Check startest du am Ende von [Kapitel 0.5](../tools/), weil er auch die SSH-Verbindung vom Front-end zu den Knoten prüft.
:::
::::
