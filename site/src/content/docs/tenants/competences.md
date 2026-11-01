---
title: Kompetenzraster für Teil 3
description: Was du nach Teil 3 kannst und wie du es selbst prüfst.
sidebar:
  label: Kompetenzraster
  order: 6
---

Mit diesem Raster schätzt du ein, ob deine Cloud für mehrere Mitglieder bereit ist und du sie verstehst. Lies jede Zeile und löse die Prüfaufgabe daneben, ohne nachzuschauen. Fällt sie dir leicht, hast du das Ziel erreicht. Wenn nicht, führt dich der Link in der letzten Spalte zur passenden Stelle. Teil 3 dient im Rahmenlehrplan vor allem den Kompetenzen B12.3 (Soll-Konfigurationen) und B14.2 (Überwachung im Betrieb) und bereitet die Kostenfragen von Teil 6 vor.

| Ich kann … | Prüfaufgabe | Nachschlagen |
|---|---|---|
| Mandantenfähigkeit mit Gruppen, Gruppenadmins und VDCs erklären | Zeichne die vier Mitglieder mit ihren Gruppen, dem VDC und dem Cluster. | [Benutzer, Gruppen und VDCs](../groups/#mandantenfähigkeit) |
| Mitglieder anlegen und ihre Trennung zeigen | Zeige als `velo-admin`, dass das Veloatelier die VMs der Praxis nicht sieht. | [Benutzer, Gruppen und VDCs](../groups/#als-mitglied-arbeiten) |
| eine ACL lesen | Erkläre die Regel `@100 VM+IMAGE+TEMPLATE+DOCUMENT/* CREATE` Teil für Teil. | [Benutzer, Gruppen und VDCs](../groups/#acls) |
| Quotas setzen und ihre Grenze zeigen | Setze eine Quota und zeige die Meldung, wenn sie erreicht ist. | [Quotas](../quotas/#an-der-grenze) |
| Showback und Chargeback unterscheiden | Erkläre den Unterschied in zwei Sätzen für den Vorstand. | [Showback](../showback/#showback-und-chargeback) |
| die Kosten einer VM berechnen | Rechne die Kosten einer VM pro Stunde und pro Monat aus ihren Preisen nach. | [Showback](../showback/#die-kosten-einer-vm) |
| Self-Service mit gemeinsamen Vorlagen einrichten | Zeige, was ein Gruppenadmin an der Vorlage `ubuntu` ändern darf und was nicht. | [Self-Service](../self-service/#die-grenzen-eines-mitglieds) |
| einen Dienst mit OneFlow beschreiben | Erkläre Rolle, Kardinalität, `min_vms`, `max_vms` und `cooldown` am Dienst der Treuhand. | [Elastizität mit OneFlow](../oneflow/#dienste-und-rollen) |
| Regeln für die Elastizität schreiben und beobachten | Zeige, wie der Dienst unter Last wächst, und erkläre, warum er nicht auf drei VMs wächst. | [Elastizität mit OneFlow](../oneflow/#wachsen-unter-last) |
| Elastizität nach Zeitplan einsetzen | Schreibe eine Regel, die den Dienst jeden Montag um 7 Uhr auf zwei VMs setzt. | [Elastizität mit OneFlow](../oneflow/#wachsen-nach-zeitplan) |

Mit diesem Teil schliesst du den [Umsetzungsnachweis UN1](../../assessment/un1/) ab. In Teil 4 baust du auf dieser Cloud eine Plattform per Code.
