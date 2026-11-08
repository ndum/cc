---
title: Observability, Skalierung und KI (Meilenstein 3)
description: Der Auftrag des dritten Meilensteins mit den sieben Anforderungen der Basis, den drei Zusatzaufträgen mit dem lokalen Sprachmodell, der Vorführung, dem Inhalt der Abgabe und dem Bewertungsraster.
---

:::assignment
«Vor der Saison will der Vorstand drei Dinge sehen», schreibt Simone Wyss. «Dass ihr merkt, wenn der Webshop leidet, bevor die Kundschaft es tut. Dass er am Samstag mitwächst. Und was unser eigenes Sprachmodell im Betrieb wirklich taugt.»
:::

Meilenstein 3 umfasst Teil 5. In der Basis überwachst du Plattform und Webshop, legst ein SLO mit Alert fest und lässt den Shop unter Last wachsen. In den Zusatzaufträgen betreibst du ein lokales Sprachmodell, baust einen eigenen Triage-Dienst mit Freigabe und verbesserst die Fragen an das Modell. Meilenstein 3 gehört mit Meilenstein 4 zur Abgabe 2.

## Basis

Alles läuft in deinem eigenen Lab mit deinen persönlichen Parametern aus Kapitel 0.3. Die Basis umfasst sieben Anforderungen.

1. Die Charts kube-prometheus-stack, Loki und Alloy kommen über Argo CD aus deinem Plattform-Repo, das Passwort von Grafana liegt nicht in Git.
2. Die Exporter von OpenNebula sind installiert, alle Ziele in Prometheus sind `up`.
3. Das Dashboard des Kurses läuft, mindestens ein Panel darin hast du selbst entworfen.
4. Du findest den Fehler eines Deployments mit LogQL in Loki.
5. Das SLO des Webshops ist mit dem Ziel aus deinen [persönlichen Werten](../../start/parameters/#deine-werte-für-die-meilensteine) als Regel hinterlegt, du löst den Alert über Git aus und beendest ihn wieder.
6. Der Webshop wächst unter Last mit dem HPA bis zu deiner persönlichen Obergrenze und schrumpft wieder, du zeigst den Lasttest im Dashboard.
7. Der Check `m3` ist grün.

Die Basis belegst du mit dem Bericht des Checks `m3` und mit einem Screenshot zu jeder Anforderung, dessen Dateiname mit ihrer Nummer beginnt. Den Bericht erzeugt `python3 ~/cc/checks/check.py m3` auf dem Front-end. Der Alert nach Burn Rate feuerte im Lab vier bis sechs Minuten nach dem Push. Nach einem Lasttest in der Stunde davor kann es zehn Minuten und länger dauern. Der HPA schrumpft erst nach fünf Minuten. Plane diese Wartezeiten für die Screenshots ein.

:::caution[Screenshots vor Kapitel 6.2]
In Kapitel 6.2 baust du den Cluster neu, dabei gehen die Metriken, die Logs und das Audit-Log eines Triage-Dienstes verloren. Erzeuge deshalb vorher den Bericht von `m3`, mach die Screenshots der Basis und kopiere das Audit-Log in dein Abgabe-Repo. Zeigst du die Zusatzaufträge im Screencast, nimmst du ihn ebenfalls vor Kapitel 6.2 auf.
:::

## Zusatzaufträge

Die drei Zusatzaufträge drehen sich um das lokale Sprachmodell und bauen aufeinander auf. Rechne mit vier bis sechs Stunden. [Kapitel 5.5](../../observability/advanced/) erklärt die Konzepte und nennt zu jedem Auftrag die Anforderungen. Jeder Auftrag gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../#stufen-der-zusatzaufträge). Zu jedem Auftrag, den du machst, gehört eine [Dokumentation in fünf Teilen](../#dokumentation-der-zusatzaufträge).

### Ein lokales Sprachmodell (Auftrag A)

Ein lokales Sprachmodell läuft als Dienst deiner Plattform. Du misst die Tokens pro Sekunde und erklärst, wovon sie abhängen. Ein Mitglied hat Zugriff auf das Modell, ein anderes nicht. Die Anforderungen stehen in [Kapitel 5.5](../../observability/advanced/#ein-lokales-sprachmodell-auftrag-a).

### Triage mit Freigabe (Auftrag B)

Dein eigener Triage-Dienst bekommt die Alerts des Webshops, fragt das Modell aus Auftrag A und schlägt Ursache und Aktion vor. Eine Aktion läuft nur nach einer Freigabe, der Dienst hat minimale Rechte und schreibt ein Audit-Log. Du gibst einen Vorschlag frei und lehnst einen anderen ab, das Audit-Log zeigt beide Entscheide. In der Dokumentation beurteilst du beide Vorschläge kritisch und hältst fest, was stimmte und was falsch war. Die Anforderungen stehen in [Kapitel 5.5](../../observability/advanced/#triage-mit-freigabe-auftrag-b).

### Bessere Fragen an das Modell (Auftrag C)

Du verbesserst die Frage, die dein Triage-Dienst an das Modell stellt. Du vergleichst die Vorschläge zum selben Alert vorher und nachher und hältst das gemessene Ergebnis fest, etwa die Dauer und ob die vorgeschlagene Aktion zum Fehler passt. Die Anforderungen stehen in [Kapitel 5.5](../../observability/advanced/#bessere-fragen-an-das-modell-auftrag-c).

## Zusatzaufträge zeigen

Die Zusatzaufträge zeigst du live im Unterricht oder in einem Screencast von höchstens zehn Minuten. Für die Vorführung im Unterricht vereinbarst du selbst einen Termin mit deiner Dozentin oder deinem Dozenten. Sie muss bis zur Abgabe 2 stattfinden. Der Screencast beginnt mit `cat /etc/cc-lab.env` und dem Bericht des Checks `m3` mit Hash und deinen zwei Fragen, die du in der Vorführung beantwortest. Der Alert nach Burn Rate feuert erst einige Minuten nach dem Push. Löse ihn für die Triage deshalb vor der Vorführung aus und zeige seinen Verlauf in Prometheus.

## Abgabe

Im Ordner `m3/` deines Abgabe-Repos liegen die Screenshots der Basis. Für die Zusatzaufträge kommen ihre Dokumentation und `platform/` dazu, eine Kopie deines Repos `platform` aus Gitea ohne den Ordner `.git`, ohne State, Tokens und Passwörter. Für Auftrag B kommt das Audit-Log deines Triage-Dienstes dazu, für eine Vorführung im Screencast sein Link. Liegt der Code deines Triage-Dienstes nicht im Plattform-Repo, legst du ihn in den Ordner `m3/triage/`.

Die Berichte der Checks legst du in `reports/`. Wie das Repo aufgebaut ist und wie du einen Tag setzt, steht unter [Abgeben](../#abgeben).

## Bewertungsraster

| Anforderung der Basis | Punkte |
|---|---|
| Stack aus Git, Passwort von Grafana nicht in Git | 3 |
| Exporter installiert, alle Ziele `up` | 3 |
| Dashboard des Kurses mit eigenem Panel | 3 |
| Fehlersuche mit LogQL | 3 |
| SLO mit persönlichem Ziel, Alert über Git ausgelöst und beendet | 3 |
| HPA mit persönlicher Obergrenze, Lasttest im Dashboard | 3 |
| Check `m3` grün | 3 |
| **Basis** | **21** |

| Zusatzauftrag | Punkte |
|---|---|
| Lokales Sprachmodell gemessen, Zugriff gesteuert (Auftrag A) | 3 |
| Triage mit Freigabe und Ablehnung, kritisch beurteilt (Auftrag B) | 3 |
| Bessere Fragen mit gemessenem Vergleich (Auftrag C) | 3 |
| **Zusatz** | **9** |

Meilenstein 3 gibt zusammen höchstens 30 Punkte. Eine Anforderung der Basis gibt 3 Punkte, wenn Bericht und Screenshot sie belegen, 2 Punkte bei grünem Check ohne passenden Screenshot und 1 Punkt, wenn sie nur teilweise erfüllt ist. Jede der zwei Fragen, die du nicht oder falsch beantwortest, kostet 1 Punkt der Zusatzaufträge. Fehlt die Dokumentation oder einer ihrer Teile 1, 2, 4 und 5, gibt ein Zusatzauftrag höchstens 1 Punkt.
