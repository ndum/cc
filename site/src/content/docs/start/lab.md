---
title: Lab einrichten
description: Drei virtuelle Maschinen auf SmartLearn, mit Hyper-V oder einem anderen Hypervisor, Ubuntu 26.04, deine persönlichen Parameter und das Skript, das jede VM vorbereitet.
sidebar:
  order: 2
---

:::assignment
Simone Wyss schickt dir die Liste der Hardware. «Drei Server, einer für die Verwaltung und zwei für die Arbeit. Bitte bereite sie so vor, dass wir nächste Woche die Cloud darauf installieren können. Und gib ihnen Namen, die wir uns merken können.»
:::

:::goals
Nach diesem Kapitel kannst du

- drei VMs für das Lab auf einem der drei Wege bereitstellen,
- prüfen, ob eine VM verschachtelte Virtualisierung unterstützt,
- Ubuntu Server 26.04 mit einer festen Adresse installieren,
- deine persönlichen Parameter erzeugen und auf den VMs ablegen,
- jede VM mit dem Vorbereitungsskript des Kurses vorbereiten.
:::

## Das Lab im Überblick

Dein Lab besteht aus drei virtuellen Maschinen. Das Front-end verwaltet später die Cloud, die beiden Knoten führen die virtuellen Maschinen deiner Mitglieder aus. Weil auf den Knoten selbst wieder VMs laufen, brauchen sie verschachtelte Virtualisierung (Nested Virtualization). Die VM muss also die Virtualisierungsfunktionen der CPU an ihr eigenes Betriebssystem weiterreichen.

| VM | Rolle | vCPU | RAM | Disk |
|---|---|---:|---:|---:|
| Front-end | Verwaltung, Weboberfläche, Gateway | 4 | 16 GB | 100 GB |
| Knoten 1 | führt VMs aus | 4 | mindestens 8 GB | 50 GB |
| Knoten 2 | führt VMs aus | 4 | mindestens 8 GB | 50 GB |

Alle drei VMs liegen im selben Netz und haben feste IP-Adressen. Die VMs deiner Cloud bekommen später ein eigenes, internes Netz, das nur deine drei VMs kennen. Das Front-end verbindet dieses Netz über NAT mit dem Internet. So funktioniert das Lab auf jedem Hypervisor, auch wenn er fremde MAC-Adressen in seinem Netz nicht zulässt.

## Drei Wege zu den VMs

Für das Lab gibt es drei Wege. Wähle einen davon und bleibe für den ganzen Kurs dabei.

1. SmartLearn. Deine Lehrperson stellt dir die drei VMs bereit, mit fester Adresse und eingeschalteter verschachtelter Virtualisierung. Das ist der empfohlene Weg, weil er unabhängig von deinem Laptop funktioniert.
2. Hyper-V unter Windows 11 Pro, Education oder Enterprise. Der Kurs liefert ein Skript, das die drei VMs anlegt. Dein Laptop braucht dafür mindestens 32 GB RAM.
3. Ein anderer Hypervisor wie VMware Workstation, VirtualBox oder Proxmox. Dieser Weg ist möglich, aber auf eigenes Risiko. Der Kurs beschreibt ihn nicht im Detail.

Ein Mac mit Apple-Prozessor eignet sich nicht, weil das Lab auf x86-Prozessoren getestet ist. Nimm in diesem Fall SmartLearn.

## Verschachtelte Virtualisierung unter Windows

Unter Windows 11 läuft oft im Hintergrund der Hypervisor von Windows. Die Speicherintegrität der Windows-Sicherheit, Credential Guard, WSL 2 und Docker Desktop brauchen ihn. Solange er läuft, können VMware Workstation und VirtualBox die Virtualisierungsfunktionen der CPU nicht an ihre VMs weitergeben. VMware meldet dann beim Start «Virtualized Intel VT-x/EPT is not supported on this platform».

Hyper-V hat dieses Problem nicht, weil es selbst dieser Hypervisor ist. Auf Windows 11 Pro, Education oder Enterprise ist Hyper-V deshalb der einfachere lokale Weg. Windows 11 Home enthält kein Hyper-V.

Ob eine VM die Virtualisierung sieht, prüfst du in der VM selbst. Die Zahl muss grösser als null sein.

```bash
grep -cE 'vmx|svm' /proc/cpuinfo
```

## Die VMs mit Hyper-V anlegen

Wenn du den Weg über Hyper-V wählst, aktiviere zuerst Hyper-V in den Windows-Features und starte den Laptop neu. Lade das ISO von Ubuntu Server 26.04 LTS von [ubuntu.com](https://ubuntu.com/download/server) herunter. Das Skript `lab/hyperv/new-lab.ps1` aus dem Kursrepo legt danach ein internes Netz mit NAT und die drei VMs an. Du startest es in einer PowerShell als Administrator, mit deinem persönlichen Code aus dem Abschnitt [Persönliche Parameter](#persönliche-parameter) und dem Pfad zum ISO.

```powershell
powershell -ExecutionPolicy Bypass -File new-lab.ps1 -Code mmuster -Iso "$env:USERPROFILE\Downloads\ubuntu-26.04-live-server-amd64.iso"
```

Das Skript gibt die Knoten mit 8 GB RAM, das Front-end mit 16 GB und jeder VM vier virtuelle CPUs. Es schaltet die verschachtelte Virtualisierung ein, die dafür nötigen festen Speicher und das Zertifikat für Secure Boot mit Ubuntu. Am Ende zeigt es die Adressen, die du bei der Installation von Ubuntu einträgst.

::code{file="lab/hyperv/new-lab.ps1" lines="45-49"}

## Ubuntu installieren

Installiere auf allen drei VMs Ubuntu Server 26.04 LTS. Bei der Installation gelten diese Einstellungen:

1. die Variante «Ubuntu Server (minimized)»
2. eine feste IPv4-Adresse mit Gateway und DNS, auf SmartLearn die Werte deiner Lehrperson, mit Hyper-V die Werte aus dem Skript
3. denselben Benutzernamen auf allen drei VMs, zum Beispiel `cc`
4. das Häkchen bei «Install OpenSSH server»
5. keine zusätzlichen Snaps

Nach der Installation meldest du dich per SSH an jeder VM an. Damit der Benutzer später ohne Passwort Befehle als Administrator ausführen kann, wie es Ansible in Kapitel 2.2 braucht, trägst du ihn auf jeder VM für sudo ohne Passwort ein.

```bash
echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$USER
```

Wenn dein Hypervisor Snapshots kennt, ist jetzt ein guter Moment für einen ersten Snapshot. Mit ihm kommst du jederzeit zu einer frischen Installation zurück.

## Persönliche Parameter

Jedes Lab im Kurs ist ein wenig anders. Aus einem persönlichen Code, den dir deine Lehrperson nennt, entstehen deine Hostnamen, dein internes Netz und die Kennung deines VXLAN-Netzes. Gib unten deinen Code und die Adressen deiner drei VMs ein. Die Rechnung läuft nur in deinem Browser, nichts verlässt diese Seite.

<cc-params></cc-params>

Das Ergebnis ist der Inhalt der Datei `/etc/cc-lab.env`. Lege sie auf allen drei VMs mit demselben Inhalt an, zum Beispiel mit `sudo nano /etc/cc-lab.env`. Das Vorbereitungsskript und die Check-Skripte lesen ihre Werte aus dieser Datei.

## Das Kursrepo auf den VMs

Die Skripte des Kurses liegen im Kursrepo. Die minimale Installation von Ubuntu enthält kein Git, deshalb installierst du es zuerst. Danach holst du das Kursrepo auf jeder der drei VMs in dein Home-Verzeichnis.

```bash
sudo apt install -y git
git clone https://github.com/ndum/cc.git
```

## Jede VM vorbereiten

Das Skript `lab/prepare.sh` bereitet eine VM für ihre Rolle vor. Du startest es auf jeder VM mit der passenden Rolle, also `fe` auf dem Front-end und `node1` und `node2` auf den Knoten.

```bash
sudo ./cc/lab/prepare.sh node1
```

Auf jeder VM setzt das Skript den Hostnamen, trägt die Namen aller drei VMs in `/etc/hosts` ein und installiert rsyslog. Auf den Knoten prüft es, ob die CPU-Virtualisierung ankommt, und nennt die Netzwerkschnittstelle, die OpenNebula später braucht. Auf dem Front-end legt es das Gateway für das interne Netz an, als Dienst `cc-gateway`, der bei jedem Start läuft.

::code{file="lab/prepare.sh" lines="46-57"}

Das Skript darf mehrmals laufen. Es ändert nur, was noch nicht stimmt. Wenn es mit einer Fehlermeldung abbricht, sagt die Meldung, was fehlt, etwa eine falsche Adresse in `/etc/cc-lab.env` oder eine Knoten-VM ohne verschachtelte Virtualisierung.

:::note
Der Dienst `cc-gateway` verbindet das Front-end mit dem internen Netz deiner Cloud. Mit `sudo cc-gateway status` siehst du jederzeit, ob das Gateway, das VXLAN-Netz und die NAT-Regel vorhanden sind.
:::

::::exercise[Lab]
Stelle die drei VMs auf dem Weg deiner Wahl bereit, erzeuge deine persönlichen Parameter, lege `/etc/cc-lab.env` an und führe `prepare.sh` auf allen drei VMs mit der richtigen Rolle aus. Notiere dir die Netzwerkschnittstelle, die das Skript auf den Knoten nennt.

:::solution
Auf jeder VM endet das Skript mit dem Abschnitt «Done». Auf dem Front-end zeigt `sudo cc-gateway status` dein Gateway, die VXLAN-Kennung und die NAT-Regel mit deinem internen Netz. Den vollständigen Check startest du am Ende von [Kapitel 0.3](../tools/), weil er auch die SSH-Verbindung vom Front-end zu den Knoten prüft.
:::
::::
