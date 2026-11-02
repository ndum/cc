---
title: Meilenstein 4 · Betrieb und ein eigenes Mitglied
description: Der Auftrag des vierten Meilensteins mit den sieben Anforderungen der Basis, den drei Zusatzaufträgen mit einem eigenen Mitglied, der Vorführung, dem Inhalt der Abgabe und dem Bewertungsraster.
---

:::assignment
«Die fünfte Organisation hat ja gesagt», schreibt Simone Wyss. «Jetzt brauchen wir alles, was der Vorstand verlangt hat. Eine Einschätzung des Schutzbedarfs, ein SLA und einen Preis. Sie soll sicher und mit Backup auf unserer Plattform laufen. Und wenn bei ihr etwas schiefgeht, will ich danach einen ehrlichen Bericht.»
:::

Meilenstein 4 umfasst Teil 6. In der Basis härtest du die Plattform, sicherst Cluster und VMs, stellst eine VM wieder her und legst RPO und RTO der vier Mitglieder fest. In den Zusatzaufträgen entwirfst du ein fünftes Mitglied von Wolkenwerk Bern selbst, bringst es auf deine Plattform, gibst ihm ein SLA und einen Preis und schreibst nach einem Vorfall ein Postmortem. Meilenstein 4 ist eine Einzelarbeit und gehört mit Meilenstein 3 zur Abgabe 2.

## Basis

Alles läuft in deinem eigenen Lab mit deinen persönlichen Parametern aus Kapitel 0.3. Die Basis umfasst sieben Anforderungen.

1. Das Front-end ist mit der Firewall gehärtet, SSH nimmt nur noch Schlüssel an.
2. Das Passwort von Grafana kommt als SealedSecret aus Git.
3. Die Namespaces der Mitglieder laufen mit dem Profil `restricted` der Pod Security, du zeigst einen abgewiesenen Pod.
4. Der Cluster k3s läuft mit etcd und Snapshots, ein Timer kopiert die Snapshots auf das Front-end.
5. Der Backup-Datastore ist angelegt. Ein Backup-Job sichert eine VM jede Nacht zur Zeit aus deinen [persönlichen Werten](../../start/parameters/) und behält so viele Backups, wie sie verlangen.
6. Du hast die VM aus ihrem Backup wiederhergestellt.
7. Eine Tabelle nennt RPO und RTO der vier Mitglieder mit Begründung, wie in der Übung «RPO und RTO» in Kapitel 6.2, der Check `m4` ist grün.

Die Dokumentation zeigt zu jeder Anforderung einen Screenshot mit einem oder zwei Sätzen dazu und enthält den Bericht des Checks `m4` und die Tabelle mit RPO und RTO. Für die Sicherung genügt die VM `praxis-1` aus Kapitel 6.2. Machst du Zusatzauftrag A, kann es stattdessen die VM deines eigenen Mitglieds sein.

## Zusatzaufträge

Für die drei Zusatzaufträge rechnest du mit vier bis sechs Stunden. Jeder gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../#stufen-der-zusatzaufträge). Die Aufträge B und C bauen auf dem Mitglied aus Auftrag A auf.

### A · Ein eigenes Mitglied

Du bringst ein fünftes Mitglied von Wolkenwerk durchgehend auf deine Plattform. In OpenNebula bekommt es eine Gruppe mit Admin, VDC, Quota und Preisen, dazu eine VM. Im Cluster erhält es über einen Pull Request in Gitea einen Namespace aus der Vorlage mit seiner Anwendung, die Argo CD ausrollt. Eine Alert-Regel mit dem Label `triage: "true"` überwacht die Anwendung. Du löst den Alert über Git aus, entscheidest über den Vorschlag des Triage-Dienstes und behebst den Fehler. [Kapitel 6.3](../../operations/sla/#ein-alert-für-ein-neues-mitglied) zeigt den Weg.

Du wählst das Mitglied frei. Es soll eine kleine Organisation aus der Region sein, die zu einer Genossenschaft wie Wolkenwerk passt, mit einem Dienst auf einer VM und einer Anwendung im Cluster. In der Dokumentation beschreibst du es in wenigen Sätzen mit seinem Schutzbedarf. Falls dir keine Idee kommt, findest du in der Tabelle einige Vorschläge.

| Idee | Was sie braucht |
|---|---|
| Kindertagesstätte | Anmeldungen mit Daten von Kindern, eine Website für Eltern |
| Musikschule | Stundenplan und Abrechnung, Spitzen zu Semesterbeginn |
| Physiotherapie | Termine und Behandlungsnotizen unter Berufsgeheimnis |
| Quartierverein | Website und Mitgliederliste, kleines Budget |
| Bäckerei mit Bestellungen | Bestellungen bis 18 Uhr, Spitzen vor Feiertagen |
| Architekturbüro | grosse Pläne, Backups wichtiger als Verfügbarkeit |

Die Anwendung im Cluster muss das Profil `restricted` erfüllen, etwa eine statische Website mit `nginxinc/nginx-unprivileged` oder eine kleine eigene App. Die VM darf höchstens 1 GB Arbeitsspeicher haben, mehr haben die Knoten neben k3s nicht frei. Im Lab lief eine VM mit 1 GB neben dem Server von k3s. Der Knoten lagerte dafür rund 200 MB aus.

### B · Cluster wiederherstellen und SLA

Du stellst den Cluster aus einem Snapshot von etcd wieder her und misst die Zeit bis zum laufenden Zustand. Mit dieser Zeit und der Architektur deines Labs schreibst du ein SLA für dein Mitglied mit Verfügbarkeit, Supportzeiten, RPO und RTO. Die Wiederherstellung darfst du vor der Vorführung machen und in der Vorführung mit ihren Spuren zeigen, etwa dem Snapshot, den Zeiten und dem Zustand danach. [Kapitel 6.2](../../operations/backup/) zeigt die Wiederherstellung, [Kapitel 6.3](../../operations/sla/) das SLA.

### C · Postmortem und Kostenmodell

Zum Vorfall aus Auftrag A schreibt das lokale Modell aus der Zeitleiste einen Entwurf des Postmortems. Du korrigierst ihn und hältst fest, was stimmte, was falsch war und was du geändert hast. Dazu rechnest du ein Kostenmodell für dein Mitglied mit dem Preis pro Monat, dem Vergleich mit dem Showback und einem Vorschlag zum Right-Sizing. [Kapitel 6.3](../../operations/sla/) beschreibt Postmortems, [Kapitel 6.4](../../operations/cost/) die Kosten.

## Zusatzaufträge zeigen

Die Zusatzaufträge zeigst du live im Unterricht oder in einem Screencast von höchstens zehn Minuten. Für die Vorführung im Unterricht vereinbarst du selbst einen Termin mit deiner Dozentin oder deinem Dozenten. Sie muss bis zur Abgabe 2 stattfinden. Der Screencast beginnt mit `cat /etc/cc-lab.env` und dem Bericht des Checks `m4` mit Hash und deinen zwei Fragen, die du in der Vorführung beantwortest.

## Abgabe

Im Ordner `m4/` deines Abgabe-Repos liegen die Dokumentation mit den Screenshots und der Tabelle mit RPO und RTO sowie `platform/`, eine Kopie deines Repos `platform` aus Gitea ohne den Ordner `.git`, ohne State und ohne Passwörter. SealedSecrets dürfen drin sein. Für Auftrag A kommt `audit.jsonl` dazu, das Audit-Log des Triage-Dienstes, für Auftrag C `postmortem-entwurf.md` vom Modell und `postmortem.md` mit deiner Korrektur, für die Vorführung der Screencast oder ein Link darauf.

Das Token von k3s, den Schlüssel von Sealed Secrets und die Backups gibst du nicht ab. Die Berichte der Checks legst du in `reports/`. Wie das Repo aufgebaut ist und wie du einen Tag setzt, steht in der [Übersicht](../).

## Bewertungsraster

| Anforderung der Basis | Punkte |
|---|---|
| Front-end mit Firewall und SSH nur mit Schlüssel | 3 |
| Passwort von Grafana als SealedSecret aus Git | 3 |
| Profil `restricted` für die Mitglieder, abgewiesener Pod gezeigt | 3 |
| etcd mit Snapshots, Timer kopiert sie auf das Front-end | 3 |
| Backup-Datastore und Backup-Job mit den persönlichen Werten | 3 |
| VM aus dem Backup wiederhergestellt | 3 |
| RPO und RTO der vier Mitglieder begründet, Check `m4` | 3 |
| **Basis** | **21** |

| Zusatzauftrag | Punkte |
|---|---|
| A · Eigenes Mitglied durchgehend mit Alert und Entscheidung | 3 |
| B · Cluster aus Snapshot mit gemessener Zeit, SLA für das Mitglied | 3 |
| C · Postmortem korrigiert, Kostenmodell für das Mitglied | 3 |
| **Zusatz** | **9** |

Meilenstein 4 gibt zusammen höchstens 30 Punkte. Eine Anforderung der Basis gibt 3 Punkte, wenn Bericht und Screenshot sie belegen. Für eine nur teilweise erfüllte Anforderung gibt es 1 Punkt. Beantwortest du eine der zwei Fragen nicht oder falsch, bekommt der Zusatzauftrag, zu dem sie gehört, höchstens 1 Punkt.
