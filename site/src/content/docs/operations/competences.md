---
title: Kompetenzraster für Teil 6
description: Was du nach Teil 6 kannst und wie du es selbst prüfst.
sidebar:
  label: Kompetenzraster
  order: 5
---

Mit diesem Raster schätzt du ein, ob du deine Plattform sicher, wiederherstellbar und wirtschaftlich betreiben kannst. Lies jede Zeile und löse die Prüfaufgabe daneben, ohne nachzuschauen. Fällt sie dir leicht, hast du das Ziel erreicht. Wenn nicht, führt dich der Link in der letzten Spalte zur passenden Stelle. Teil 6 dient im Rahmenlehrplan vor allem den Kompetenzen B9.2 (Schutzbedarf ermitteln), B13.1 (Konzepte für Sicherung und Wiederherstellung), B13.5 (Service Levels), B14.7 (Verrechnung von ICT-Leistungen) und B15.1 (Energie- und Ressourceneffizienz).

| Ich kann … | Prüfaufgabe | Nachschlagen |
|---|---|---|
| den Schutzbedarf eines Mitglieds einschätzen | Stufe Vertraulichkeit, Integrität und Verfügbarkeit der Treuhand ein und begründe jede Stufe. | [Sicherheit](../security/#schutzbedarf) |
| einen Server härten | Nenne die drei Massnahmen des Härtungsskripts und wogegen sie schützen. | [Sicherheit](../security/#das-front-end-härten) |
| Pods auf ein Sicherheitsprofil verpflichten | Zähle auf, was ein Pod für das Profil `restricted` angeben muss. | [Sicherheit](../security/#pod-security-admission) |
| Secrets sicher in Git ablegen | Erkläre, wer ein SealedSecret entschlüsseln kann und was ohne seinen Schlüssel passiert. | [Sicherheit](../security/#secrets-in-git) |
| RPO und RTO festlegen | Lege RPO und RTO für den Webshop fest und sage, welche Sicherung sie erreicht. | [Backup und Wiederherstellung](../backup/#rpo-und-rto) |
| abgrenzen, was Git abdeckt | Nenne drei Dinge, die nach einem Neubau aus Git fehlen. | [Backup und Wiederherstellung](../backup/#grenzen-von-git) |
| den Cluster aus einem Snapshot wiederherstellen | Beschreibe die Schritte und was danach noch zu tun ist. | [Backup und Wiederherstellung](../backup/#den-cluster-wiederherstellen) |
| VMs sichern und wiederherstellen | Sichere eine VM und stelle sie als neue VM wieder her. | [Backup und Wiederherstellung](../backup/#vms-in-opennebula) |
| eine ehrliche Verfügbarkeit zusagen | Begründe mit der Architektur des Labs, warum 99,9 % nicht realistisch sind. | [SLA und Betriebskonzept](../sla/#verfügbarkeit-in-zahlen) |
| ein Postmortem verfassen und prüfen | Prüfe einen Entwurf des Modells gegen seine Zeitlinie und korrigiere ihn. | [SLA und Betriebskonzept](../sla/#postmortems) |
| Vollkosten berechnen und einen Preis ableiten | Rechne aus, welchen Anteil der Kosten ein Mitglied mit 1 CPU und 2 GB trägt. | [Kosten und Ressourceneffizienz](../cost/#ein-preis-für-das-neue-mitglied) |
| Ressourcen nach Messwerten anpassen | Vergleiche Requests und Verbrauch eines Namespaces und schlage neue Werte vor. | [Kosten und Ressourceneffizienz](../cost/#right-sizing) |

Mit diesem Teil schliesst du den [Umsetzungsnachweis UN4](../../assessment/un4/) ab und hast die Inhalte des Kurses durch. Block 7 gehört der [Probeprüfung](../../assessment/mock-exam/).
