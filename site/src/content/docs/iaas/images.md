---
title: Images, Vorlagen und Kontext
description: Datastores und Images aus dem Marketplace, eine Vorlage für kleine Ubuntu-VMs, die Kontextualisierung mit Netz, SSH-Schlüssel und Hostname und deine erste VM in der Cloud.
sidebar:
  order: 4
---

:::assignment
«Die Praxis Rosenweg möchte eine erste Testmaschine», schreibt Simone Wyss. «Ubuntu, klein, im internen Netz und ohne dass jemand von uns sie von Hand einrichten muss. Geht das in ein paar Minuten?»
:::

:::goals
Nach diesem Kapitel kannst du

- Datastores, Images und Vorlagen unterscheiden,
- ein Image aus dem Marketplace in deine Cloud holen,
- eine Vorlage für VMs lesen und anpassen,
- erklären, wie die Kontextualisierung eine VM beim ersten Start einrichtet,
- eine VM starten, dich per SSH anmelden und den Check dieses Teils bestehen.
:::

## Datastores und Images

Ein Image ist eine Disk, aus der VMs starten, etwa ein vorbereitetes Ubuntu. Images liegen in einem Datastore. OneDeploy hat drei Datastores angelegt. `default` hält die Images, `system` die Disks laufender VMs, und `files` kleinere Dateien wie Skripte. Startet eine VM, kopiert der Transfertreiber `ssh` ihr Image in den Datastore `system` des Knotens. Die VM arbeitet auf dieser Kopie, das Image im Datastore bleibt unverändert.

Fertige Images liefert der Marketplace von OpenNebula. Mit `onemarketapp export` holst du ein Image in deinen Datastore. OpenNebula legt dazu eine einfache Vorlage an.

```bash
onemarketapp list | grep -i ubuntu
onemarketapp export "Ubuntu Minimal 26.04" ubuntu-26.04 --datastore default
oneimage list
```

Das Image ist bereit, sobald `oneimage list` in der Spalte `STAT` den Wert `rdy` zeigt.

## Vorlagen

Eine Vorlage beschreibt eine VM, aus der du beliebig viele VMs startest. Der Kurs liefert die Vorlage `ubuntu` für kleine VMs im internen Netz.

::code{file="lab/iaas/ubuntu.tpl"}

`CPU` ist der Anteil eines physischen Kerns, den der Scheduler für die VM reserviert. `VCPU` ist die Anzahl CPUs, die die VM sieht. Mit `CPU = "0.5"` und `VCPU = "1"` passen doppelt so viele VMs auf einen Knoten, wie er Kerne hat, solange nicht alle gleichzeitig voll rechnen. `CPU_MODEL` mit `host-passthrough` zeigt der VM die echte CPU, wie Kapitel 1.3 erklärt. `DISK` nennt das Image, `NIC` das Netz. Den Abschnitt `CONTEXT` erklärt der nächste Abschnitt.

```bash
onetemplate create ~/cc/lab/iaas/ubuntu.tpl
onetemplate list
```

## Kontextualisierung

Ein Image ist für alle VMs gleich, jede VM braucht aber ihre eigene Adresse, ihren Namen und die Schlüssel ihrer Benutzer. Diese Angaben gibt OpenNebula der VM beim Start mit. Es legt sie als kleines virtuelles CD-Laufwerk an die VM, und das Paket `one-context` im Image liest sie beim ersten Start und richtet die VM danach ein. Dieses Prinzip heisst Kontextualisierung.

| Angabe | Wirkung in der VM |
|---|---|
| `NETWORK = "YES"` | Adresse, Gateway, DNS und MTU aus dem Netz `cc-net` |
| `SSH_PUBLIC_KEY` | der öffentliche Schlüssel in `authorized_keys` von root |
| `SET_HOSTNAME` | der Hostname, hier der Name der VM |
| `START_SCRIPT` | ein Skript, das beim Start läuft, in Teil 4 für k3s |

`$USER[SSH_PUBLIC_KEY]` übernimmt den Schlüssel aus dem Benutzer, der die VM startet. Damit du dich vom Front-end aus anmelden kannst, legst du den Schlüssel des Front-ends bei `oneadmin` ab.

```bash
printf 'SSH_PUBLIC_KEY="%s"\n' "$(cat ~/.ssh/id_ed25519.pub)" > /tmp/key.tpl
oneuser update oneadmin --append /tmp/key.tpl
```

## Deine erste VM

Jetzt startest du eine VM aus der Vorlage und meldest dich an. Sie läuft meist nach wenigen Sekunden, SSH ist nach etwa einer halben Minute bereit.

```bash
onetemplate instantiate ubuntu --name web-1
onevm list
onevm show web-1 | grep -E 'IP=|HOST'
ssh root@<adresse-der-vm>
```

In der VM zeigen `hostname`, `ip -br addr` und `ip link show eth0`, was die Kontextualisierung eingerichtet hat. Mit `curl -I https://ubuntu.com` prüfst du, ob die VM über das Gateway ins Internet kommt. In Sunstone öffnet ein Klick auf die VM und dann auf das Symbol der Konsole ihren Bildschirm im Browser.

Der Check dieses Teils prüft das Netz, die Vorlage, eine laufende VM, die Anmeldung per SSH, ihren Hostnamen und den Zugang zum Internet.

```bash
python3 ~/cc/checks/check.py iaas
```

::::exercise[Lab]
Hole das Image, lege die Vorlage an, starte die VM `web-1` und lade den Bericht des Checks `iaas` in dein Abgabe-Repo.

:::solution
Der Check endet mit «11 von 11 Prüfungen erfüllt». In der VM zeigt `hostname` den Namen `web-1`, `ip -br addr` eine Adresse aus deinem internen Netz und `ip link show eth0` die MTU 1450.
:::
::::

::::exercise[Vorlage anpassen]
Die Treuhand Aaregg braucht am Monatsende eine grössere VM mit zwei CPUs und 2 GB Arbeitsspeicher. Lege eine Kopie der Vorlage unter dem Namen `ubuntu-medium` an und starte daraus eine VM. Wie viele solcher VMs passen nach `onehost list` auf einen Knoten?

:::solution
`onetemplate clone ubuntu ubuntu-medium` und danach `onetemplate update ubuntu-medium` mit `CPU = "1"`, `VCPU = "2"` und `MEMORY = "2048"`. Ein Knoten mit 7,2 GB Arbeitsspeicher und vier Kernen trägt drei solcher VMs, der Arbeitsspeicher setzt die Grenze, nicht die CPU.
:::
::::
