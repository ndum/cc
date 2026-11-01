---
title: Kompetenzraster für Teil 5
description: Was du nach Teil 5 kannst und wie du es selbst prüfst.
sidebar:
  label: Kompetenzraster
  order: 7
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
| ein lokales Modell betreiben und messen | Miss die Tokens pro Sekunde und erkläre, wovon sie abhängen. | [Ein lokaler KI-Dienst](../ai/#geschwindigkeit) |
| den Zugriff auf das Modell steuern | Gib einem Mitglied Zugriff und zeige, dass ein anderes keinen hat. | [Ein lokaler KI-Dienst](../ai/#inferenz-als-last) |
| einen Vorschlag des Modells prüfen | Beurteile einen Vorschlag des Triage-Dienstes und entscheide begründet. | [KI-Triage mit Freigabe](../triage/#im-lab) |
| Risiken eines Modells im Betrieb einschätzen | Nenne die Schutzmassnahmen des Triage-Dienstes und wogegen sie schützen. | [KI-Triage mit Freigabe](../triage/#schutzmassnahmen) |

Mit diesem Teil schliesst du [Meilenstein 3](../../assessment/milestone-3/) ab. In Teil 6 geht es um Sicherheit, Sicherung, Service Levels und Kosten, und du bringst ein eigenes Mitglied auf die Plattform.
