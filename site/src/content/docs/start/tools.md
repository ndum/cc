---
title: Werkzeuge und Abgabe-Repo
description: SSH-Schlüssel und eine SSH-Konfiguration, der Schlüssel vom Front-end zu den Knoten, das Abgabe-Repo auf GitLab oder GitHub, der erste Check mit Bericht und die Regeln für Screencasts.
sidebar:
  order: 5
---

:::assignment
«Bevor wir weitermachen, will der Vorstand wissen, wie wir festhalten, was wir bauen», schreibt Simone Wyss. «Kannst du ein Repo anlegen, in dem jeder Schritt nachvollziehbar ist? Und bitte nicht jedes Mal ein Passwort eintippen, das hält niemand lange durch.»
:::

:::goals
Nach diesem Kapitel kannst du

- mit einem SSH-Schlüssel und einer SSH-Konfiguration ohne Passwort auf deine VMs zugreifen,
- vom Front-end ohne Passwort auf die Knoten zugreifen,
- dein Abgabe-Repo anlegen und mit deiner Dozentin oder deinem Dozenten teilen,
- den Check eines Kapitels starten und seinen Bericht lesen,
- einen Screencast der Zusatzaufträge aufnehmen, der die Regeln der Meilensteine erfüllt.
:::

## SSH-Schlüssel

Ein SSH-Schlüssel besteht aus zwei Dateien. Den privaten Schlüssel behältst du auf deinem Laptop, den öffentlichen Schlüssel legst du auf jede VM. Beim Anmelden beweist dein Laptop mit dem privaten Schlüssel, dass er zum öffentlichen passt, ohne dass ein Passwort über das Netz geht.

Windows 11, macOS und Linux bringen OpenSSH mit. Erzeuge einen Schlüssel im Terminal oder in der PowerShell. Die Passphrase schützt den privaten Schlüssel, falls jemand die Datei kopiert.

```bash
ssh-keygen -t ed25519 -C "cc-lab"
```

Den öffentlichen Schlüssel aus `~/.ssh/id_ed25519.pub` trägst du auf jeder VM in die Datei `~/.ssh/authorized_keys` ein. Unter macOS und Linux erledigt das `ssh-copy-id`. Unter Windows kopierst du den Inhalt der Datei und fügst ihn auf der VM mit einem Editor ein.

## Eine SSH-Konfiguration

Damit du dir keine Adressen merken musst, legst du auf deinem Laptop die Datei `~/.ssh/config` an, unter Windows `%USERPROFILE%\.ssh\config`. Danach genügt `ssh mmuster-fe`. Ersetze die Namen und Adressen durch deine eigenen aus `/etc/cc-lab.env`.

```text
Host mmuster-fe
  HostName 192.168.42.10
  User cc

Host mmuster-node1
  HostName 192.168.42.11
  User cc

Host mmuster-node2
  HostName 192.168.42.12
  User cc
```

## SSH vom Front-end auf die Knoten

Ab Teil 2 arbeitest du vor allem auf dem Front-end. Von dort aus richtet Ansible die Knoten ein, und die Check-Skripte prüfen sie. Das Front-end selbst richtet Ansible lokal ein, ohne SSH. Das Front-end braucht deshalb einen eigenen Schlüssel, der auf den Knoten eingetragen ist. Melde dich auf dem Front-end an, erzeuge dort einen Schlüssel ohne Passphrase und kopiere ihn auf beide Knoten. `ssh-copy-id` fragt dabei einmal nach dem Passwort des Knotens und bestätigt, dass du den Knoten kennst.

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
ssh-copy-id mmuster-node1
ssh-copy-id mmuster-node2
```

Danach muss `ssh mmuster-node1 hostname` den Namen des Knotens ausgeben, ohne nach einem Passwort zu fragen.

## Das Abgabe-Repo

Für deine Meilensteine legst du ein privates Repo an, entweder auf dem GitLab deiner Schule oder auf GitHub. Nenne es `cc-` und deinen Code, also zum Beispiel `cc-mmuster`, und gib deiner Dozentin oder deinem Dozenten Lesezugriff. In dieses Repo kommen dein Code, die Berichte der Checks, eine Kopie von `/etc/cc-lab.env`, pro Meilenstein eine Dokumentation mit Screenshots und für die Zusatzaufträge dein Screencast oder ein Link darauf. Die genaue Struktur steht unter [Leistungsbeurteilung](../../assessment/).

Klone das Repo auf das Front-end, denn dort entstehen die meisten Dateien. Für den Zugriff von der VM aus legst du den öffentlichen Schlüssel des Front-ends in deinem GitLab- oder GitHub-Konto ab.

```bash
git clone git@github.com:mmuster/cc-mmuster.git
```

## Der erste Check

Jetzt prüfst du, ob dein Lab bereit ist. Das Check-Skript läuft auf dem Front-end. Es kontrolliert die Namen und Adressen, das Gateway, die SSH-Verbindung zu den Knoten und auf jedem Knoten Ubuntu, die CPU-Virtualisierung und rsyslog.

```bash
python3 ~/cc/checks/check.py start
```

Jede Zeile des Berichts beginnt mit `[ok]` oder `[!!]`. Unter einer Zeile mit `[!!]` steht ein Hinweis, wo du suchen kannst. Das Skript speichert den Bericht in `~/cc-reports/`. Am Ende steht ein Hash, der zum ganzen Bericht gehört. Wer den Bericht nachträglich von Hand ändert, macht diesen Hash ungültig. Weil das Skript öffentlich ist, beweist der Hash aber nicht, dass der Check wirklich gelaufen ist. Den Beweis liefern deine Screenshots und die Vorführung der Zusatzaufträge.

::code{file="checks/check.py" lines="161-166"}

Kopiere den Bericht in dein Abgabe-Repo, in den Ordner `reports/`, und lade ihn mit einem Commit hoch.

## Screencasts

Die Basis eines Meilensteins belegst du mit einer Dokumentation und Screenshots, dafür brauchst du keinen Screencast. Die Zusatzaufträge zeigst du entweder live im Unterricht oder in einem Screencast. Für Screencasts gelten diese Regeln:

1. höchstens zehn Minuten, in einer Aufnahme ohne Schnitt
2. zuerst `cat /etc/cc-lab.env` und der Bericht des Checks des Meilensteins mit seinem Hash und deinen zwei Fragen
3. danach die Zusatzaufträge, live in deinem Lab
4. die Antworten auf die zwei Fragen und deine eigenen Entscheide mit ihrer Begründung
5. Ton mit deiner Stimme, damit deine Dozentin oder dein Dozent hört, wie du erklärst

Unter Windows nimmst du mit dem Snipping Tool oder mit OBS Studio auf, unter macOS mit der Bildschirmaufnahme. Den Screencast legst du in dein Abgabe-Repo oder auf einen Speicher wie OneDrive und trägst den Link in der Dokumentation des Meilensteins ein.

::::exercise[Lab]
Richte SSH mit Schlüssel und Konfiguration ein, verbinde das Front-end mit den Knoten, lege dein Abgabe-Repo an und lade den Bericht des Checks `start` hoch.

:::solution
Der Check endet mit einer Zeile wie «20 von 20 Prüfungen erfüllt» und einem Hash. Eine fehlende SSH-Verbindung zeigt der Bericht mit `[!!] SSH ohne Passwort auf` und dem Namen des Knotens. In diesem Fall fehlt der Schlüssel des Front-ends auf dem Knoten.
:::
::::
