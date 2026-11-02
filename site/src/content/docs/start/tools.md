---
title: Werkzeuge und Abgabe-Repo
description: SSH-Schlüssel und eine SSH-Konfiguration auf dem Client, der Schlüssel vom Front-end zu den Knoten, das Abgabe-Repo auf GitLab oder GitHub, der erste Check mit Bericht und die Regeln für Screencasts.
sidebar:
  order: 5
---

:::assignment
«Bevor wir weitermachen, will der Vorstand wissen, wie wir festhalten, was wir bauen», schreibt Simone Wyss. «Kannst du ein Repo anlegen, in dem jeder Schritt nachvollziehbar ist? Und bitte nicht jedes Mal ein Passwort eintippen, das hält niemand lange durch.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Mit einem SSH-Schlüssel und einer SSH-Konfiguration vom Client aus ohne Passwort auf die Server zugreifen
- Vom Front-end ohne Passwort auf die Knoten zugreifen
- Dein Abgabe-Repo anlegen und mit deiner Dozentin oder deinem Dozenten teilen
- Den Check eines Kapitels starten und seinen Bericht lesen
- Einen Screencast der Zusatzaufträge aufnehmen, der die Regeln der Meilensteine erfüllt
:::

## SSH-Schlüssel

Ein SSH-Schlüssel besteht aus zwei Dateien. Den privaten Schlüssel behältst du auf dem Client, den öffentlichen legst du auf jeden Server. Beim Anmelden beweist der Client mit dem privaten Schlüssel, dass er zum öffentlichen passt. Ein Passwort geht dabei nicht über das Netz.

Erzeuge den Schlüssel im Terminal des Clients. Die Passphrase schützt den privaten Schlüssel, falls jemand die Datei kopiert.

```bash
ssh-keygen -t ed25519 -C "cc-lab"
```

Den öffentlichen Schlüssel aus `~/.ssh/id_ed25519.pub` kopierst du mit `ssh-copy-id` auf jeden Server. Der Befehl fragt ein letztes Mal nach dem Passwort und trägt den Schlüssel auf dem Server in `~/.ssh/authorized_keys` ein.

```bash
ssh-copy-id cc@<adresse>
```

:::selfhost
Ohne Client arbeitest du auf deinem PC. Windows 11, macOS und Linux bringen OpenSSH mit, unter Windows erzeugst du den Schlüssel in der PowerShell mit demselben Befehl. Windows kennt kein `ssh-copy-id`. Dort hängst du den öffentlichen Schlüssel mit diesem Befehl in der PowerShell an `~/.ssh/authorized_keys` des Servers an.

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh cc@<adresse> "umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys"
```

Die SSH-Konfiguration aus dem nächsten Abschnitt liegt unter Windows in `%USERPROFILE%\.ssh\config`.
:::

## Eine SSH-Konfiguration

Damit du dir keine Adressen merken musst, legst du auf dem Client die Datei `~/.ssh/config` an, etwa mit `nano ~/.ssh/config`. Danach genügt `ssh mmuster-fe`. Ersetze die Namen und Adressen durch deine eigenen aus `/etc/cc-lab.env`.

```text
Host mmuster-fe
  HostName 192.168.210.137
  User cc

Host mmuster-node1
  HostName 192.168.210.138
  User cc

Host mmuster-node2
  HostName 192.168.210.139
  User cc
```

## SSH vom Front-end auf die Knoten

Ab Teil 2 arbeitest du vor allem auf dem Front-end. Von dort aus richtet Ansible die Knoten ein und die Check-Skripte prüfen sie. Dafür braucht das Front-end einen eigenen Schlüssel, der auf den Knoten eingetragen ist. Das Front-end selbst richtet Ansible lokal ein, ohne SSH.

Melde dich auf dem Front-end an, erzeuge dort einen Schlüssel ohne Passphrase und kopiere ihn auf beide Knoten. `ssh-copy-id` fragt dabei einmal nach dem Passwort des Knotens. Vorher lässt dich SSH bestätigen, dass du den Knoten kennst.

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
ssh-copy-id mmuster-node1
ssh-copy-id mmuster-node2
```

Danach gibt `ssh mmuster-node1 hostname` den Namen des Knotens aus, ohne nach einem Passwort zu fragen.

## Das Abgabe-Repo

Für deine Meilensteine legst du ein privates Repo an, entweder auf dem GitLab deiner Schule oder auf GitHub. Nenne es `cc-` und deinen Code, also zum Beispiel `cc-mmuster`. Deine Dozentin oder dein Dozent bekommt Lesezugriff. In dieses Repo kommen dein Code, die Berichte der Checks, eine Kopie von `/etc/cc-lab.env` und pro Meilenstein eine Dokumentation mit Screenshots. Für die Zusatzaufträge kommt dein Screencast dazu oder ein Link darauf. Die genaue Struktur steht unter [Leistungsbeurteilung](../../assessment/).

Klone das Repo auf das Front-end, denn dort entstehen die meisten Dateien. Damit das Front-end auf GitLab oder GitHub zugreifen kann, legst du seinen öffentlichen Schlüssel in deinem Konto ab. `cat ~/.ssh/id_ed25519.pub` zeigt ihn auf dem Front-end. Du kopierst ihn im Terminal des Clients und fügst ihn im Browser des Clients in den Einstellungen deines Kontos ein.

```bash
git clone git@github.com:mmuster/cc-mmuster.git
```

## Der erste Check

Das Check-Skript prüft, ob dein Lab bereit ist. Es läuft auf dem Front-end und kontrolliert die Namen und Adressen, das Gateway und die SSH-Verbindung zu den Knoten. Auf jedem Knoten prüft es Ubuntu, die CPU-Virtualisierung und rsyslog.

```bash
python3 ~/cc/checks/check.py start
```

Jede Zeile des Berichts beginnt mit `[ok]` oder `[!!]`. Unter einer Zeile mit `[!!]` steht ein Hinweis, wo du suchen kannst. Das Skript speichert den Bericht in `~/cc-reports/`. Am Ende steht ein Hash über den ganzen Bericht. Wer den Bericht nachträglich von Hand ändert, macht diesen Hash ungültig. Weil das Skript öffentlich ist, beweist der Hash aber nicht, dass der Check wirklich gelaufen ist. Dafür braucht es deine Screenshots und die Vorführung der Zusatzaufträge.

::code{file="checks/check.py" lines="747-752"}

Kopiere den Bericht in dein Abgabe-Repo in den Ordner `reports/` und lade ihn mit einem Commit hoch.

## Screencasts

Die Basis eines Meilensteins belegst du mit einer Dokumentation und Screenshots, ein Screencast ist dafür nicht nötig. Die Zusatzaufträge zeigst du live im Unterricht oder in einem Screencast. Für Screencasts gelten diese Regeln:

1. Höchstens zehn Minuten, in einer Aufnahme ohne Schnitt
2. Zuerst `cat /etc/cc-lab.env` und der Bericht des Checks des Meilensteins mit seinem Hash und deinen zwei Fragen
3. Danach die Zusatzaufträge, live in deinem Lab
4. Die Antworten auf die zwei Fragen und deine eigenen Entscheide mit ihrer Begründung
5. Ton mit deiner Stimme, damit deine Dozentin oder dein Dozent hört, wie du erklärst

Den Screencast nimmst du auf deinem PC auf, auf dem auch smartlearn im Browser läuft. Unter Windows geht das mit dem Snipping Tool oder mit OBS Studio, unter macOS mit der Bildschirmaufnahme. Lege den Screencast in dein Abgabe-Repo oder auf einen Speicher wie OneDrive und trag den Link in der Dokumentation des Meilensteins ein.

::::exercise[Lab]
Richte SSH mit Schlüssel und Konfiguration auf dem Client ein und verbinde das Front-end mit den Knoten. Lege dein Abgabe-Repo an und lade den Bericht des Checks `start` hoch.

:::solution
Der Check endet mit einer Zeile wie «22 von 22 Prüfungen der Basis erfüllt» und einem Hash. Eine fehlende SSH-Verbindung zeigt der Bericht mit `[!!] SSH ohne Passwort auf` und dem Namen des Knotens. In diesem Fall fehlt der Schlüssel des Front-ends auf dem Knoten.
:::
::::
