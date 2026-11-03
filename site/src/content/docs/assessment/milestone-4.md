---
title: Meilenstein 4 · Betrieb und ein eigenes Mitglied
description: Der Auftrag des vierten Meilensteins mit den sieben Anforderungen der Basis, den drei Zusatzaufträgen mit einem eigenen Mitglied, der Vorführung, dem Inhalt der Abgabe und dem Bewertungsraster.
---

:::assignment
«Die fünfte Organisation hat ja gesagt», schreibt Simone Wyss. «Jetzt brauchen wir alles, was der Vorstand verlangt hat. Eine Einschätzung des Schutzbedarfs, ein SLA und einen Preis. Sie soll sicher und mit Backup auf unserer Plattform laufen. Und wenn bei ihr etwas schiefgeht, will ich danach einen ehrlichen Bericht.»
:::

Meilenstein 4 umfasst Teil 6. In der Basis härtest du die Plattform, sicherst Cluster und VMs und stellst eine VM wieder her. In den Zusatzaufträgen entwirfst du ein fünftes Mitglied von Wolkenwerk Bern selbst, bringst es auf deine Plattform, gibst ihm ein SLA und einen Preis und schreibst nach einem Vorfall ein Postmortem. Meilenstein 4 gehört mit Meilenstein 3 zur Abgabe 2.

## Basis

Alles läuft in deinem eigenen Lab mit deinen persönlichen Parametern aus Kapitel 0.3. Die Basis umfasst sieben Anforderungen.

1. Das Front-end ist mit der Firewall gehärtet, SSH nimmt nur noch Schlüssel an.
2. Das Passwort von Grafana kommt als SealedSecret aus Git.
3. Die Namespaces der Mitglieder laufen mit dem Profil `restricted` der Pod Security, du zeigst einen abgewiesenen Pod.
4. Der Cluster k3s läuft mit etcd und Snapshots, ein Timer kopiert die Snapshots auf das Front-end.
5. Der Backup-Datastore ist angelegt. Ein Backup-Job sichert eine VM jede Nacht zur Zeit aus deinen [persönlichen Werten](../../start/parameters/) und behält so viele Backups, wie sie verlangen.
6. Du hast die VM aus ihrem Backup wiederhergestellt.
7. Der Check `m4` ist grün.

Die Basis belegst du mit dem Bericht des Checks `m4` und mit einem Screenshot zu jeder Anforderung. Den Bericht erzeugt `python3 ~/cc/checks/check.py m4` auf dem Front-end. Für die Sicherung genügt die VM `praxis-1` aus Kapitel 6.2. Machst du Zusatzauftrag A, kann es stattdessen die VM deines eigenen Mitglieds sein.

## Zusatzaufträge

Für die drei Zusatzaufträge rechnest du mit vier bis sechs Stunden. Jeder gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../#stufen-der-zusatzaufträge). Die Aufträge B und C bauen auf dem Mitglied aus Auftrag A auf. Die Konzepte dazu und die Anforderungen an jeden Auftrag stehen in [Kapitel 6.5](../../operations/advanced/).

### A · Ein eigenes Mitglied

Du bringst ein fünftes Mitglied von Wolkenwerk, das du selbst entwirfst, durchgehend auf deine Plattform. In der Dokumentation beschreibst du es in wenigen Sätzen mit seinem Schutzbedarf. In OpenNebula bekommt es eine Gruppe mit Admin, VDC, Quota und Preisen, dazu eine VM mit höchstens 1 GB Arbeitsspeicher. Im Cluster erhält es über einen Pull Request in Gitea einen Namespace aus der Vorlage mit seiner Anwendung, die Argo CD ausrollt und die das Profil `restricted` erfüllt. Eine Alert-Regel überwacht die Anwendung, Alertmanager schickt ihren Alert an deinen Triage-Dienst aus Zusatzauftrag B von Meilenstein 3. Du löst den Alert über Git aus, entscheidest über den Vorschlag des Triage-Dienstes und behebst den Fehler. Ideen für das Mitglied und die Anforderungen stehen in [Kapitel 6.5](../../operations/advanced/#auftrag-a--ein-eigenes-mitglied).

### B · Cluster wiederherstellen und SLA

Du stellst den Cluster aus einem Snapshot von etcd wieder her und misst die Zeit bis zum laufenden Zustand. Mit dieser Zeit und der Architektur deines Labs schreibst du ein SLA für dein Mitglied mit Verfügbarkeit, Supportzeiten, RPO und RTO. Die Wiederherstellung darfst du vor der Vorführung machen und in der Vorführung mit ihren Spuren zeigen, etwa dem Snapshot, den Zeiten und dem Zustand danach. Die Anforderungen stehen in [Kapitel 6.5](../../operations/advanced/#auftrag-b--cluster-wiederherstellen-und-sla), die Teile eines SLA in [Kapitel 6.3](../../operations/sla/).

### C · Postmortem und Kostenmodell

Zum Vorfall aus Auftrag A schreibt das lokale Modell aus der Zeitlinie einen Entwurf des Postmortems. Die Zeitlinie baust du ohne Modell aus den Daten auf. Du korrigierst den Entwurf und hältst fest, was stimmte, was falsch war und was du geändert hast. Dazu rechnest du ein Kostenmodell für dein Mitglied mit dem Preis pro Monat, dem Vergleich mit dem Showback und einem Vorschlag zum Right-Sizing. Die Anforderungen stehen in [Kapitel 6.5](../../operations/advanced/#auftrag-c--postmortem-und-kostenmodell), die Vollkosten in [Kapitel 6.4](../../operations/cost/).

## Zusatzaufträge zeigen

Die Zusatzaufträge zeigst du live im Unterricht oder in einem Screencast von höchstens zehn Minuten. Für die Vorführung im Unterricht vereinbarst du selbst einen Termin mit deiner Dozentin oder deinem Dozenten. Sie muss bis zur Abgabe 2 stattfinden. Der Screencast beginnt mit `cat /etc/cc-lab.env` und dem Bericht des Checks `m4` mit Hash und deinen zwei Fragen, die du in der Vorführung beantwortest.

## Abgabe

Im Ordner `m4/` deines Abgabe-Repos liegen die Screenshots der Basis. Für die Zusatzaufträge kommen ihre Dokumentation und `platform/` dazu, eine Kopie deines Repos `platform` aus Gitea ohne den Ordner `.git`, ohne State und ohne Passwörter. SealedSecrets dürfen drin sein. Für Auftrag A kommt das Audit-Log deines Triage-Dienstes dazu, für Auftrag C `postmortem-entwurf.md` vom Modell und `postmortem.md` mit deiner Korrektur, für die Vorführung der Screencast oder ein Link darauf. Eigene Skripte, etwa für die Zeitlinie, legst du dazu, falls sie nicht im Plattform-Repo stehen.

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
| Check `m4` grün | 3 |
| **Basis** | **21** |

| Zusatzauftrag | Punkte |
|---|---|
| A · Eigenes Mitglied durchgehend mit Alert und Entscheidung | 3 |
| B · Cluster aus Snapshot mit gemessener Zeit, SLA für das Mitglied | 3 |
| C · Postmortem korrigiert, Kostenmodell für das Mitglied | 3 |
| **Zusatz** | **9** |

Meilenstein 4 gibt zusammen höchstens 30 Punkte. Eine Anforderung der Basis gibt 3 Punkte, wenn Bericht und Screenshot sie belegen. Für eine nur teilweise erfüllte Anforderung gibt es 1 Punkt. Beantwortest du eine der zwei Fragen nicht oder falsch, bekommt der Zusatzauftrag, zu dem sie gehört, höchstens 1 Punkt. Ohne Dokumentation gibt ein Zusatzauftrag höchstens 1 Punkt.
