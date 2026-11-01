---
title: Meilenstein 3 · Observability, Skalierung und KI
description: Der Auftrag des dritten Meilensteins mit den verlangten Funktionen, dem Ablauf des Screencasts, dem Inhalt der Abgabe und dem Bewertungsraster.
---

:::assignment
«Vor der Saison will der Vorstand drei Dinge sehen», schreibt Simone Wyss. «Dass ihr merkt, wenn der Webshop leidet, bevor die Kundschaft es tut. Dass er am Samstag mitwächst. Und was unser eigenes Sprachmodell im Betrieb wirklich taugt.»
:::

Meilenstein 3 umfasst Teil 5. Du überwachst Plattform und Webshop, legst ein SLO mit Alert fest, lässt den Shop unter Last wachsen, betreibst ein lokales Modell und setzt es mit Freigabe in der Triage ein. Meilenstein 3 ist eine Einzelarbeit und gehört mit Meilenstein 4 zur Abgabe 2.

## Verlangte Funktionen

Alles läuft in deinem eigenen Lab mit deinen persönlichen Parametern aus Kapitel 0.3.

1. kube-prometheus-stack, Loki und Alloy kommen über Argo CD aus deinem Plattform-Repo, das Passwort von Grafana liegt nicht in Git.
2. Prometheus liest die Exporter von OpenNebula auf Front-end und Knoten und den Webshop, alle Ziele sind `up`.
3. Ein Dashboard zeigt OpenNebula, die vier goldenen Signale des Webshops und die Mitglieder gegen ihre Quota. Mindestens ein Panel hast du selbst entworfen.
4. Du findest den Fehler eines Deployments mit LogQL in Loki.
5. Das SLO des Webshops ist als Regel hinterlegt, du löst den Alert über Git aus und beendest ihn wieder.
6. Der Webshop wächst unter Last mit dem HPA und schrumpft wieder, du zeigst den Lasttest im Dashboard.
7. Ollama läuft mit einem Modell, du hast die Tokens pro Sekunde gemessen, und ein Mitglied hat Zugriff, ein anderes nicht.
8. Der Triage-Dienst bekommt einen Alert, du prüfst den Vorschlag und entscheidest, das Audit-Log zeigt deine Entscheidung, der Check `observability` ist grün.

## Erklärungen und Entscheide

Im README von Meilenstein 3 und im Screencast erklärst du

- den Weg einer Metrik vom Exporter bis ins Dashboard und den Weg eines Alerts bis zum Triage-Dienst, mit einer eigenen Zeichnung,
- dein SLO, sein Fehlerbudget und warum der Alert zwei Zeitfenster hat,
- wie du HPA, Limits und Quota abgestimmt hast und wo im Lasttest der Engpass lag,
- die gemessene Geschwindigkeit des Modells und wovon sie abhängt,
- die Qualität der Vorschläge an mindestens zwei Beispielen, mit dem, was stimmte, was falsch war und wie du entschieden hast,
- die Schutzmassnahmen des Triage-Dienstes und ob du eine Aktion selbständig laufen lassen würdest.

Weichst du von den Werten des Kurses ab, etwa beim SLO, beim HPA oder beim Modell, begründest du das. Eigene Entscheide geben mehr Punkte als übernommene Werte.

## Screencast

Der Screencast dauert höchstens zehn Minuten in einer einzigen Aufnahme. Ein Vorschlag für den Ablauf.

| Minuten | Was du zeigst |
|---|---|
| 0 bis 1 | `/etc/cc-lab.env`, den Bericht des Checks `observability` mit Hash und deine Zeichnung |
| 1 bis 3 | Ziele in Prometheus, dein Dashboard, eine Abfrage mit PromQL |
| 3 bis 4 | Fehlersuche mit LogQL |
| 4 bis 6 | Lasttest mit HPA im Dashboard, deine Abstimmung von Limits und Quota |
| 6 bis 8 | SLO, Alert, Vorschlag des Triage-Dienstes, deine Entscheidung, Audit-Log |
| 8 bis 9 | Messung des Modells, Zugriff der Mitglieder |
| 9 bis 10 | zwei oder drei eigene Entscheide |

Der Alert nach Burn Rate braucht je nach Verkehr der letzten Stunde zehn Minuten oder mehr. Löse ihn vor der Aufnahme aus und zeige im Screencast den Verlauf in Prometheus. Zeigst du Meilenstein 3 live im Unterricht, gilt derselbe Ablauf.

## Abgabe

Im Ordner `m3/` deines Abgabe-Repos liegen

- `README.md` mit Zeichnung, Erklärungen, Entscheiden, der Bewertung der Vorschläge und deinem Einsatz von KI,
- `platform/`, eine Kopie deines Repos `platform` aus Gitea ohne den Ordner `.git`, ohne State und ohne Passwörter,
- `audit.jsonl`, das Audit-Log des Triage-Dienstes,
- der Screencast oder ein Link darauf.

Die Berichte der Checks legst du in `reports/`. Wie das Repo aufgebaut ist und wie du einen Tag setzt, steht in der [Übersicht](../).

## Bewertungsraster

| Kriterium | Punkte |
|---|---|
| Stack aus Git, Ziele von OpenNebula und Webshop `up` | 3 |
| Dashboard mit eigenem Panel, Fehlersuche mit LogQL | 3 |
| SLO mit Alert, ausgelöst und beendet | 3 |
| Webshop wächst und schrumpft unter Last | 3 |
| Modell gemessen, Zugriff der Mitglieder gesteuert | 2 |
| Triage mit Entscheidung und Audit-Log, Check `observability` | 4 |
| **Funktionen** | **18** |
| Zeichnung mit den Wegen von Metrik und Alert | 3 |
| SLO, Fehlerbudget und Burn Rate begründet | 3 |
| HPA, Limits, Quota und Engpass begründet | 3 |
| Qualität des Modells und Schutzmassnahmen kritisch beurteilt | 3 |
| **Erklärungen und Entscheide** | **12** |
| **Total** | **30** |

Die Funktionen ergeben 60 % der Punkte, die Erklärungen und Entscheide 40 %. Die Note der Abgabe 2 berechnet deine Dozentin oder dein Dozent aus den Punkten von Meilenstein 3 und 4 nach den Regeln der Schule.
