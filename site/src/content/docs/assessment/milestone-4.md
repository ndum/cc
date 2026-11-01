---
title: Meilenstein 4 · Ein eigenes Mitglied
description: Der Auftrag des vierten Meilensteins mit dem eigenen Mitglied, den verlangten Funktionen, dem Ablauf des Screencasts, dem Inhalt der Abgabe und dem Bewertungsraster.
---

:::assignment
«Die fünfte Organisation hat ja gesagt», schreibt Simone Wyss. «Jetzt brauchen wir alles, was der Vorstand verlangt hat. Eine Einschätzung des Schutzbedarfs, ein SLA, einen Preis, und dass sie sicher und mit Backup auf unserer Plattform läuft. Und wenn bei ihr etwas schiefgeht, will ich danach einen ehrlichen Bericht.»
:::

Meilenstein 4 umfasst Teil 6. Du entwirfst ein fünftes Mitglied von Wolkenwerk Bern selbst, schätzt seinen Schutzbedarf ein, legst Service Levels und einen Preis fest und bringst es gesichert auf deine gehärtete Plattform. Einen Vorfall bei diesem Mitglied behandelst du mit dem Triage-Dienst und schreibst ein Postmortem. Meilenstein 4 ist eine Einzelarbeit und gehört mit Meilenstein 3 zur Abgabe 2.

## Dein Mitglied

Du wählst das Mitglied frei. Es soll eine kleine Organisation aus der Region sein, die zu einer Genossenschaft wie Wolkenwerk passt, mit einem Dienst auf einer VM und einer Anwendung im Cluster. Falls dir keine Idee kommt, hilft die Liste.

| Idee | Was sie braucht |
|---|---|
| Kindertagesstätte | Anmeldungen mit Daten von Kindern, eine Website für Eltern |
| Musikschule | Stundenplan und Abrechnung, Spitzen zu Semesterbeginn |
| Physiotherapie | Termine und Behandlungsnotizen unter Berufsgeheimnis |
| Quartierverein | Website und Mitgliederliste, kleines Budget |
| Bäckerei mit Bestellungen | Bestellungen bis 18 Uhr, Spitzen vor Feiertagen |
| Architekturbüro | grosse Pläne, Backups wichtiger als Verfügbarkeit |

Die Anwendung im Cluster muss das Profil `restricted` erfüllen, etwa eine statische Website mit `nginxinc/nginx-unprivileged` oder eine kleine eigene App. Die VM darf höchstens 1 GB Arbeitsspeicher haben, mehr haben die Knoten neben k3s nicht frei. Im Lab lief eine VM mit 1 GB neben dem Server von k3s, und der Knoten lagerte dafür rund 200 MB aus.

## Verlangte Funktionen

Alles läuft in deinem eigenen Lab mit deinen persönlichen Parametern aus Kapitel 0.3.

1. Das Front-end ist gehärtet, das Passwort von Grafana kommt als SealedSecret aus Git, und alle Mitglieder laufen mit dem Profil `restricted`.
2. k3s läuft mit etcd, ein Timer kopiert die Snapshots auf das Front-end, und du hast den Cluster aus einem Snapshot wiederhergestellt.
3. Dein Mitglied hat in OpenNebula eine Gruppe mit Admin, VDC, Quota und Preisen und eine VM mit höchstens 1 GB.
4. Ein Backup-Job sichert die VM jede Nacht zur Zeit aus deinen [persönlichen Werten](../../start/parameters/) und behält so viele Backups, wie sie verlangen. Du hast die VM aus einem Backup wiederhergestellt.
5. Dein Mitglied hat einen Namespace aus der Vorlage mit seiner Anwendung, über einen Pull Request in Gitea und Argo CD.
6. Eine Alert-Regel mit dem Label `triage: "true"` überwacht die Anwendung. Du löst den Alert über Git aus, entscheidest über den Vorschlag des Triage-Dienstes und behebst den Fehler. [Kapitel 6.3](../../operations/sla/#ein-alert-für-ein-neues-mitglied) zeigt den Weg.
7. Das Modell schreibt einen Entwurf des Postmortems zu diesem Vorfall, und du korrigierst ihn.
8. Der Check `m4` ist grün.

## Eigene Erweiterung

Zu den Funktionen gehört eine Erweiterung, die über den Kurs hinausgeht. Sie soll zu Wolkenwerk passen und in deinem Lab laufen. Eigene Ideen sind willkommen, die Liste hilft beim Einstieg.

- eine verschlüsselte Kopie der Backups ausser Haus, etwa mit restic
- TLS für Gitea oder die Weboberfläche mit einer eigenen CA
- eine Wiederherstellungsübung als Skript, das die Zeit misst
- ein Alert, wenn der letzte Snapshot von etcd älter als einen Tag ist

Die Erweiterung gibt bis zu 3 Punkte. 1 Punkt gibt es, wenn sie läuft, 2, wenn du sie im README begründest, und 3, wenn du sie im Screencast vorführst und ihre Grenzen beurteilst.

## Erklärungen und Entscheide

Im README von Meilenstein 4 und im Screencast erklärst du

- dein Mitglied, seine Dienste und seinen Schutzbedarf nach Vertraulichkeit, Integrität und Verfügbarkeit, und welcher Dienst warum auf einer VM oder im Cluster läuft,
- dein SLA mit Verfügbarkeit, Supportzeiten, RPO und RTO, begründet mit der Architektur deines Labs und den gemessenen Zeiten der Wiederherstellung,
- dein Kostenmodell mit dem Preis pro Monat, dem Vergleich mit dem Showback und einem Vorschlag zum Right-Sizing,
- dein Konzept der Datensicherung und wie weit es die Regel 3-2-1 erfüllt,
- was im Entwurf des Postmortems stimmte, was falsch war und was du korrigiert hast.

Eigene Entscheide geben mehr Punkte als übernommene Werte. Weichst du von den Werten des Kurses ab, etwa bei den Zeitplänen der Backups oder bei Quotas, begründest du das.

## Screencast

Der Screencast dauert höchstens zehn Minuten in einer einzigen Aufnahme. Ein Vorschlag für den Ablauf.

| Minuten | Was du zeigst |
|---|---|
| 0 bis 1 | `/etc/cc-lab.env`, den Bericht des Checks `m4` mit Hash, dein Mitglied in zwei Sätzen |
| 1 bis 2 | Härtung, SealedSecret, Abweisung eines Pods ohne Sicherheitsangaben |
| 2 bis 4 | Gruppe, Quota und VM in OpenNebula, Backup-Job, die wiederhergestellte VM |
| 4 bis 5 | Snapshots auf dem Front-end, die Wiederherstellung des Clusters mit der gemessenen Zeit |
| 5 bis 7 | Pull Request, Anwendung im Namespace, Alert, Vorschlag und Entscheidung, Behebung über Git |
| 7 bis 8 | korrigiertes Postmortem, SLA und Kostenmodell im Überblick |
| 8 bis 10 | die zwei Fragen aus dem Bericht, deine Erweiterung und eigene Entscheide |

Die Wiederherstellung des Clusters darfst du vor der Aufnahme machen und im Screencast mit ihren Spuren zeigen, etwa dem Snapshot, den Zeiten und dem Zustand danach. Zeigst du Meilenstein 4 live im Unterricht, gilt derselbe Ablauf.

## Abgabe

Im Ordner `m4/` deines Abgabe-Repos liegen

- `README.md` mit Mitglied, Schutzbedarf, SLA, Kostenmodell, Konzept der Datensicherung, deinen Entscheiden und deinem Einsatz von KI,
- `platform/`, eine Kopie deines Repos `platform` aus Gitea ohne den Ordner `.git`, ohne State und ohne Passwörter, SealedSecrets dürfen drin sein,
- `postmortem-entwurf.md` vom Modell und `postmortem.md` mit deiner Korrektur,
- `audit.jsonl`, das Audit-Log des Triage-Dienstes,
- der Screencast oder ein Link darauf.

Das Token von k3s, den Schlüssel von Sealed Secrets und die Backups gibst du nicht ab. Die Berichte der Checks legst du in `reports/`. Wie das Repo aufgebaut ist und wie du einen Tag setzt, steht in der [Übersicht](../).

## Bewertungsraster

| Kriterium | Punkte |
|---|---|
| Härtung, SealedSecret, Profil `restricted` | 2 |
| etcd, Snapshots auf dem Front-end, Cluster wiederhergestellt | 2 |
| Mitglied in OpenNebula mit Quota, VM, Backup-Job mit persönlichen Werten und Wiederherstellung | 3 |
| Namespace mit Anwendung über Pull Request | 2 |
| Alert mit Triage, Entscheidung und Behebung über Git | 2 |
| Postmortem korrigiert | 2 |
| Check `m4` | 2 |
| Eigene Erweiterung | 3 |
| **Funktionen** | **18** |
| Mitglied und Schutzbedarf begründet | 3 |
| SLA mit RPO, RTO und ehrlicher Verfügbarkeit | 3 |
| Kostenmodell und Right-Sizing | 3 |
| Datensicherung und kritische Beurteilung des Modells | 3 |
| **Erklärungen und Entscheide** | **12** |
| **Total** | **30** |

Die Funktionen mit der Erweiterung ergeben 60 % der Punkte, die Erklärungen und Entscheide 40 %. Jedes Erklärungskriterium bewertet deine Dozentin oder dein Dozent nach den [Stufen 0 bis 3](../#stufen-der-erklärungen). Beantwortest du eine der zwei Fragen aus dem Bericht nicht oder falsch, bekommt das Kriterium, zu dem sie gehört, höchstens 1 Punkt. Die Note der Abgabe 2 berechnet deine Dozentin oder dein Dozent aus den Punkten von Meilenstein 3 und 4 nach den Regeln der Schule.
