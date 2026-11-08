---
title: Kompetenzraster für Teil 3
description: Was du nach Teil 3 kannst und wie du es selbst prüfst.
sidebar:
  label: Kompetenzraster
  order: 6
---

Mit diesem Raster schätzt du ein, ob deine Cloud für mehrere Mitglieder bereit ist und du sie verstehst. Lies jede Zeile und löse die Prüfaufgabe daneben, ohne nachzuschauen. Fällt sie dir leicht, hast du das Ziel erreicht. Wenn nicht, führt dich der Link in der letzten Spalte zur passenden Stelle. Teil 3 bezieht sich im Rahmenlehrplan vor allem auf die Kompetenzen B12.3 (Soll-Konfigurationen) und B14.2 (Überwachung im Betrieb) und bereitet die Kostenfragen von Teil 6 vor.

| Ich kann … | Prüfaufgabe | Nachschlagen |
|---|---|---|
| Mandantenfähigkeit mit Gruppen, Gruppenadmins und VDCs erklären | Zeichne die vier Mitglieder mit ihren Gruppen, dem VDC und dem Cluster. | [Benutzer, Gruppen und VDCs](../groups/#mandantenfähigkeit) |
| Mitglieder anlegen und ihre Trennung zeigen | Zeige als `velo-admin`, dass das Veloatelier die VMs der Praxis nicht sieht. | [Benutzer, Gruppen und VDCs](../groups/#als-mitglied-arbeiten) |
| eine ACL lesen | Erkläre die Regel `@100 VM+IMAGE+TEMPLATE+DOCUMENT/* CREATE` Teil für Teil. | [Benutzer, Gruppen und VDCs](../groups/#acls) |
| Quotas setzen und ihre Grenze zeigen | Setze eine Quota und zeige die Meldung, wenn sie erreicht ist. | [Quotas](../quotas/#an-der-grenze) |
| erklären, was eine Quota bei Überbuchung begrenzt und was nicht | Erkläre, warum die VM der Praxis träge sein kann, obwohl alle Mitglieder ihre Quotas einhalten. | [Quotas](../quotas/#quota-und-überbuchung) |
| Showback und Chargeback unterscheiden | Erkläre den Unterschied in zwei Sätzen für den Vorstand. | [Showback](../showback/#showback-und-chargeback) |
| die Kosten einer VM berechnen | Rechne die Kosten einer VM pro Stunde und pro Monat aus ihren Preisen nach. | [Showback](../showback/#die-kosten-einer-vm) |
| als Gruppenadmin Benutzer anlegen und die Ansichten von Sunstone unterscheiden | Zeige als `praxis-admin` mit `oneuser list` die Benutzer der Praxis. Erkläre, welche Ansicht `praxis-mpa` in Sunstone bekommt und warum ein fehlender Reiter nichts verbietet. | [Self-Service](../self-service/#benutzer-in-der-gruppe) |
| Self-Service mit gemeinsamen Vorlagen einrichten | Zeige, was ein Gruppenadmin an der Vorlage `ubuntu` ändern darf und was nicht. | [Self-Service](../self-service/#die-grenzen-eines-mitglieds) |
| einen Dienst mit OneFlow beschreiben (Zusatz) | Erkläre an deinem Dienst der Treuhand die Rolle, die Kardinalität, die Grenzen `min_vms` und `max_vms` sowie `cooldown`. | [Zusatzaufträge](../advanced/#dienste-und-rollen) |
| Regeln für die Elastizität nach Last begründen (Zusatz) | Erkläre, warum eine Rolle mit einer VM unter Volllast und einer leeren VM bei einer Schwelle von 60 % nicht weiter wächst. | [Zusatzaufträge](../advanced/#regeln-nach-last) |
| Elastizität nach Zeitplan einsetzen (Zusatz) | Schreibe eine Regel, die den Dienst jeden Montag um 7 Uhr auf zwei VMs setzt. | [Zusatzaufträge](../advanced/#regeln-nach-zeitplan) |
| einen monatlichen Bericht mit einem Timer planen (Zusatz) | Erkläre, wann dein Timer abläuft und was geschieht, wenn das Front-end zu diesem Zeitpunkt ausgeschaltet ist. | [Zusatzaufträge](../advanced/#timer-von-systemd) |
| die Kostendeckung aus dem Showback berechnen (Zusatz) | Berechne aus dem Showback eines Monats die Kostendeckung der Genossenschaft und nenne deine Annahmen. | [Zusatzaufträge](../advanced/#kostendeckung) |
| die Folgen eines Knotenausfalls beurteilen (Zusatz) | Erkläre, was mit den VMs der Mitglieder bei einem Ausfall eines Knotens geschieht und warum sie im Lab nicht auf dem anderen Knoten starten. | [Zusatzaufträge](../advanced/#folgen-eines-ausfalls) |
| eine Platzierung der VMs vorschlagen (Zusatz) | Begründe für Wolkenwerk, ob Packing oder Striping besser passt. Nenne, was eine VM-Gruppe mit `ANTI_AFFINED` daran ändert. | [Zusatzaufträge](../advanced/#platzierung-und-ausfall) |

Mit diesem Teil schliesst du [Meilenstein 1](../../assessment/milestone-1/) ab. Die Screenshots von Teil 3 und den Bericht des Checks `m1` aus [Kapitel 3.4](../self-service/#der-check-von-meilenstein-1) lädst du vor Kapitel 4.2 in dein Abgabe-Repo, denn dort entfernst du die VMs, die die Screenshots zeigen. Zeilen mit dem Vermerk «Zusatz» gehören zu einem Zusatzauftrag aus [Kapitel 3.5](../advanced/) und nicht zur Basis. In Teil 4 baust du auf dieser Cloud eine Plattform per Code.
