---
title: Meilenstein 3 · Observability, Skalierung und KI
description: Der Auftrag des dritten Meilensteins mit den sieben Anforderungen der Basis, den drei Zusatzaufträgen mit dem lokalen Sprachmodell, der Vorführung, dem Inhalt der Abgabe und dem Bewertungsraster.
---

:::assignment
«Vor der Saison will der Vorstand drei Dinge sehen», schreibt Simone Wyss. «Dass ihr merkt, wenn der Webshop leidet, bevor die Kundschaft es tut. Dass er am Samstag mitwächst. Und was unser eigenes Sprachmodell im Betrieb wirklich taugt.»
:::

Meilenstein 3 umfasst Teil 5. In der Basis überwachst du Plattform und Webshop, legst ein SLO mit Alert fest und lässt den Shop unter Last wachsen. In den Zusatzaufträgen betreibst du ein lokales Sprachmodell, baust einen eigenen Triage-Dienst mit Freigabe und verbesserst die Fragen an das Modell. Meilenstein 3 ist eine Einzelarbeit und gehört mit Meilenstein 4 zur Abgabe 2.

## Basis

Alles läuft in deinem eigenen Lab mit deinen persönlichen Parametern aus Kapitel 0.3. Die Basis umfasst sieben Anforderungen.

1. Die Charts kube-prometheus-stack, Loki und Alloy kommen über Argo CD aus deinem Plattform-Repo, das Passwort von Grafana liegt nicht in Git.
2. Die Exporter von OpenNebula sind installiert, alle Ziele in Prometheus sind `up`.
3. Das Dashboard des Kurses läuft, mindestens ein Panel darin hast du selbst entworfen.
4. Du findest den Fehler eines Deployments mit LogQL in Loki.
5. Das SLO des Webshops ist mit dem Ziel aus deinen [persönlichen Werten](../../start/parameters/) als Regel hinterlegt, du löst den Alert über Git aus und beendest ihn wieder.
6. Der Webshop wächst unter Last mit dem HPA bis zu deiner persönlichen Obergrenze und schrumpft wieder, du zeigst den Lasttest im Dashboard.
7. Eine eigene Zeichnung zeigt den Weg einer Metrik vom Exporter bis ins Dashboard und den Weg eines Alerts, der Check `m3` ist grün.

Die Dokumentation zeigt zu jeder Anforderung einen Screenshot mit einem oder zwei Sätzen dazu und enthält den Bericht des Checks `m3` und deine Zeichnung. Den Bericht erzeugt `python3 ~/cc/checks/check.py m3` auf dem Front-end. Der Alert nach Burn Rate feuerte im Lab vier bis sechs Minuten nach dem Push. Nach einem Lasttest in der Stunde davor kann es zehn Minuten und länger dauern. Der HPA schrumpft erst nach fünf Minuten. Plane diese Wartezeiten für die Screenshots ein.

## Zusatzaufträge

Die drei Zusatzaufträge drehen sich um das lokale Sprachmodell und bauen aufeinander auf. Rechne mit vier bis sechs Stunden. [Kapitel 5.5](../../observability/advanced/) erklärt die Konzepte und nennt zu jedem Auftrag die Anforderungen. Jeder Auftrag gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../#stufen-der-zusatzaufträge).

### A · Ein lokales Sprachmodell

Ein lokales Sprachmodell läuft als Dienst deiner Plattform. Du misst die Tokens pro Sekunde und erklärst, wovon sie abhängen. Ein Mitglied hat Zugriff auf das Modell, ein anderes nicht. Die Anforderungen stehen in [Kapitel 5.5](../../observability/advanced/#auftrag-a--ein-lokales-sprachmodell).

### B · Triage mit Freigabe

Dein eigener Triage-Dienst bekommt die Alerts des Webshops, fragt das Modell aus Auftrag A und schlägt Ursache und Aktion vor. Eine Aktion läuft nur nach einer Freigabe, der Dienst hat minimale Rechte und schreibt ein Audit-Log. Du gibst einen Vorschlag frei und lehnst einen anderen ab, das Audit-Log zeigt beide Entscheidungen. In der Dokumentation beurteilst du beide Vorschläge kritisch und hältst fest, was daran stimmte und was falsch war. Die Anforderungen stehen in [Kapitel 5.5](../../observability/advanced/#auftrag-b--triage-mit-freigabe).

### C · Bessere Fragen an das Modell

Du verbesserst die Frage, die dein Triage-Dienst an das Modell stellt. Du vergleichst die Vorschläge zum selben Alert vorher und nachher und hältst das gemessene Ergebnis fest, etwa die Dauer und ob die vorgeschlagene Aktion zum Fehler passt. Die Anforderungen stehen in [Kapitel 5.5](../../observability/advanced/#auftrag-c--bessere-fragen-an-das-modell).

## Zusatzaufträge zeigen

Die Zusatzaufträge zeigst du live im Unterricht oder in einem Screencast von höchstens zehn Minuten. Für die Vorführung im Unterricht vereinbarst du selbst einen Termin mit deiner Dozentin oder deinem Dozenten. Sie muss bis zur Abgabe 2 stattfinden. Der Screencast beginnt mit `cat /etc/cc-lab.env` und dem Bericht des Checks `m3` mit Hash und deinen zwei Fragen, die du in der Vorführung beantwortest. Der Alert nach Burn Rate feuert erst einige Minuten nach dem Push. Löse ihn für die Triage deshalb vor der Vorführung aus und zeige seinen Verlauf in Prometheus.

## Abgabe

Im Ordner `m3/` deines Abgabe-Repos liegen die Dokumentation mit den Screenshots und der Zeichnung sowie `platform/`, eine Kopie deines Repos `platform` aus Gitea ohne den Ordner `.git`, ohne State und ohne Passwörter. Für Auftrag B kommt das Audit-Log deines Triage-Dienstes dazu, für die Vorführung der Screencast oder ein Link darauf. Liegt der Code deines Triage-Dienstes nicht im Plattform-Repo, legst du ihn in den Ordner `m3/triage/`.

Die Berichte der Checks legst du in `reports/`. Wie das Repo aufgebaut ist und wie du einen Tag setzt, steht in der [Übersicht](../).

## Bewertungsraster

| Anforderung der Basis | Punkte |
|---|---|
| Stack aus Git, Passwort von Grafana nicht in Git | 3 |
| Exporter installiert, alle Ziele `up` | 3 |
| Dashboard des Kurses mit eigenem Panel | 3 |
| Fehlersuche mit LogQL | 3 |
| SLO mit persönlichem Ziel, Alert über Git ausgelöst und beendet | 3 |
| HPA mit persönlicher Obergrenze, Lasttest im Dashboard | 3 |
| Zeichnung mit den Wegen von Metrik und Alert, Check `m3` | 3 |
| **Basis** | **21** |

| Zusatzauftrag | Punkte |
|---|---|
| A · Lokales Sprachmodell gemessen, Zugriff gesteuert | 3 |
| B · Triage mit Freigabe und Ablehnung, kritisch beurteilt | 3 |
| C · Bessere Fragen mit gemessenem Vergleich | 3 |
| **Zusatz** | **9** |

Meilenstein 3 gibt zusammen höchstens 30 Punkte. Eine Anforderung der Basis gibt 3 Punkte, wenn Bericht und Screenshot sie belegen. Für eine nur teilweise erfüllte Anforderung gibt es 1 Punkt. Beantwortest du eine der zwei Fragen nicht oder falsch, bekommt der Zusatzauftrag, zu dem sie gehört, höchstens 1 Punkt.
