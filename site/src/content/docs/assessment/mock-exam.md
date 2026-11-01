---
title: Probeprüfung
description: Ablauf, Vorbereitung, Hilfsmittel und Auswertung der Probeprüfung in Block 7, mit drei Störungen und einer Erweiterung in deinem eigenen Lab.
---

In Block 7 übst du das Format der Diplomprüfung an deinem eigenen Lab. Ein Skript baut drei Störungen ein und verlangt eine Erweiterung. Du hast 60 Minuten, um die Störungen zu finden und zu beheben und die Erweiterung in Betrieb zu bringen. Die Probeprüfung zählt nicht für die Note. Sie zeigt dir, wo du noch unsicher bist, solange Zeit zum Üben bleibt.

## Ablauf

| Lektion | Was passiert |
|---|---|
| 25 | Fragen zum Format, Snapshots in smartlearn, Skript holen, Start |
| 25 bis 27 | 60 Minuten Probeprüfung |
| 27 und 28 | Besprechung aller Störungen, Selbsteinschätzung, Zurücksetzen, Ausblick auf die Diplomprüfung |

## Vorbereitung

Dein Lab muss den Stand nach Teil 6 haben. Prüfe vor Block 7, dass die Checks `platform`, `observability` und `operations` grün sind. Eine Störung, die schon vor dem Start bestand, kostet dich in der Prüfung Zeit.

Lege zu Beginn von Lektion 25 in smartlearn einen Snapshot aller drei VMs an. Er ist dein Sicherheitsnetz. Läuft etwas so schief, dass du es nach der Prüfung nicht mehr reparieren kannst, setzt du die VMs auf den Snapshot zurück.

Deine Lehrperson stellt das Skript `cc-exam.py` in smartlearn bereit. Kopiere es auf das Front-end in dein Home-Verzeichnis und starte es mit der Rundennummer, die deine Lehrperson nennt.

```bash
python3 ~/cc-exam.py start 7
```

Das Skript fragt nach den Snapshots, baut die Störungen ein und zeigt dir drei Tickets und die Erweiterung. Mit `python3 ~/cc-exam.py tickets` siehst du sie jederzeit wieder.

## Tickets und Erweiterung

Jedes Ticket beschreibt ein Symptom, so wie ein Mitglied oder die Geschäftsführung es meldet. Die Ursache steht nicht darin. Je ein Ticket betrifft die IaaS-Schicht mit OpenNebula, die Plattform mit k3s und GitOps und den Betrieb mit Sicherheit, Backup und Monitoring. Welche Störungen du bekommst, hängt von deinem persönlichen Code und der Rundennummer ab. Deine Nachbarn haben andere.

Die Erweiterung verlangt ein sechstes Mitglied von Wolkenwerk mit einer Gruppe und einer Quota in OpenNebula und einem Namespace mit einer App auf der Plattform. Die Werte stehen im Auftrag.

Schreibe pro Ticket drei Sätze in eine Textdatei, je einen zur Ursache, zur Behebung und zur Vorbeugung. Wie du bei einer Störung vorgehst, steht in der [Fehlerbehebung](../../troubleshooting/#vorgehen-bei-einer-störung).

## Prüfen

Mit `check` prüft das Skript, ob die Tickets behoben sind und die Erweiterung läuft. Du kannst es so oft aufrufen, wie du willst.

```bash
python3 ~/cc-exam.py check
```

Der Bericht landet wie bei den Checks des Kurses in `~/cc-reports` und endet mit einem Hash. Manche Reparaturen brauchen einige Minuten, bis sie wirken, etwa wenn Argo CD erst wieder synchronisieren oder OpenNebula einen Knoten neu überwachen muss.

## Hilfsmittel

Erlaubt sind die Kursseite, die Dokumentation der Werkzeuge, das Internet und deine eigenen Notizen und Repos. Nicht erlaubt sind KI-Assistenten und jede Kommunikation mit anderen Personen. Welche Hilfsmittel in der Diplomprüfung gelten, gibt die Schule bekannt.

## Auswertung

Die Probeprüfung zählt nicht für die Note. Schätze dich in der Besprechung mit dem Bericht und deinen Notizen selbst ein.

| Teil | Punkte |
|---|---|
| Pro Ticket behoben | je 1 |
| Pro Ticket Ursache richtig benannt | je 1 |
| Pro Ticket sinnvolle Vorbeugung | je 1 |
| Erweiterung mit Gruppe und Quota | 1 |
| Erweiterung mit Namespace aus der Vorlage | 1 |
| Erweiterung mit App aus Git | 1 |
| **Total** | **12** |

Mit `python3 ~/cc-exam.py reveal` zeigt das Skript nach der Prüfung, welche Störungen es eingebaut hat. In der Besprechung geht die Klasse jede Störung durch, die jemand bekommen hat.

## Danach

Setze zurück, was nach der Prüfung noch kaputt ist. Das Skript repariert nur die Störungen, die Erweiterung bleibt bestehen.

```bash
python3 ~/cc-exam.py restore
python3 ~/cc/checks/check.py operations
```

Ist der Check danach nicht grün und findest du den Grund nicht, setzt du die drei VMs in smartlearn auf den Snapshot zurück.
