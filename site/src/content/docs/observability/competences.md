---
title: Kompetenzraster für Teil 5
description: Was du nach Teil 5 kannst und wie du es selbst prüfst.
sidebar:
  label: Kompetenzraster
  order: 6
---

Mit diesem Raster schätzt du ein, ob du deine Plattform beobachten, skalieren und mit einem lokalen Modell unterstützen kannst. Lies jede Zeile und löse die Prüfaufgabe daneben, ohne nachzuschauen. Fällt sie dir leicht, hast du das Ziel erreicht. Wenn nicht, führt dich der Link in der letzten Spalte zur passenden Stelle. Teil 5 dient im Rahmenlehrplan vor allem den Kompetenzen B14.2 (Überwachung im Betrieb), B13.5 (Service Levels) und B4.2 (aktuelle Technologien anwenden).

| Ich kann … | Prüfaufgabe | Nachschlagen |
|---|---|---|
| die vier goldenen Signale nennen | Ordne jedem Signal eine Metrik des Webshops zu. | [Metriken mit Prometheus](../metrics/#der-zweck-der-überwachung) |
| Ziele in Prometheus einbinden | Zeige, wie die Exporter von OpenNebula und der Webshop zu Zielen werden. | [Metriken mit Prometheus](../metrics/#opennebula-als-ziel) |
| Abfragen mit PromQL schreiben | Schreibe eine Abfrage für die Anfragen pro Sekunde nach Statuscode. | [Metriken mit Prometheus](../metrics/#promql) |
| Logs mit LogQL durchsuchen | Finde die Fehlerzeilen des Webshops und zähle sie pro Pod. | [Logs mit Loki](../logs/#logql) |
| SLI, SLO und Fehlerbudget erklären | Berechne das Fehlerbudget eines Samstags für das SLO des Webshops. | [Alerts und SLOs](../slo/#sli-slo-und-sla) |
| einen Alert nach Burn Rate begründen | Erkläre, wozu der Alert zwei Zeitfenster braucht. | [Alerts und SLOs](../slo/#burn-rate) |
| Autoscaling einrichten und begrenzen | Rechne nach, ob `maxReplicas` mit dem Limit eines Pods und der Reserve für einen Rollout in die Quota passt. | [Autoscaling](../autoscaling/#grenzen) |
| einen Lasttest auswerten | Erkläre, warum mehr Pods im Lab nicht mehr Durchsatz brachten. | [Autoscaling](../autoscaling/#der-engpass-anderswo) |
| ein lokales Modell betreiben und messen (Zusatz) | Miss die Tokens pro Sekunde und erkläre, wovon sie abhängen. | [Zusatzaufträge](../advanced/#tokens-pro-sekunde) |
| den Zugriff auf das Modell steuern (Zusatz) | Gib einem Mitglied Zugriff und zeige, dass ein anderes keinen hat. | [Zusatzaufträge](../advanced/#zugriff-der-mitglieder) |
| einen Vorschlag des Modells prüfen (Zusatz) | Beurteile einen Vorschlag deines Triage-Dienstes und entscheide begründet. | [Zusatzaufträge](../advanced/#freigabe-durch-einen-menschen) |
| Risiken eines Modells im Betrieb einschätzen (Zusatz) | Nenne die Schutzmassnahmen deines Triage-Dienstes und wogegen sie schützen. | [Zusatzaufträge](../advanced/#schutzmassnahmen) |
| Fragen an ein Modell verbessern (Zusatz) | Erkläre, wie du zwei Fassungen einer Frage fair vergleichst. | [Zusatzaufträge](../advanced/#fragen-an-das-modell) |

Mit diesem Teil schliesst du [Meilenstein 3](../../assessment/milestone-3/) ab. Zeilen mit dem Vermerk «Zusatz» gehören zu den Zusatzaufträgen in Kapitel 5.5 und nicht zur Basis. In Teil 6 geht es um Sicherheit, Sicherung, Service Levels und Kosten. Als Zusatz bringst du dort ein eigenes Mitglied auf die Plattform.
