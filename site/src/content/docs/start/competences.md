---
title: Kompetenzraster für Teil 0
description: Was du nach Teil 0 kannst und wie du es selbst prüfst.
sidebar:
  label: Kompetenzraster
  order: 7
---

Mit diesem Raster schätzt du ein, ob du für die nächsten Teile bereit bist. Lies jede Zeile und löse die Prüfaufgabe daneben, ohne nachzuschauen. Fällt sie dir leicht, hast du das Ziel erreicht. Wenn nicht, führt dich der Link in der letzten Spalte zur passenden Stelle.

| Ich kann … | Prüfaufgabe | Nachschlagen |
|---|---|---|
| erklären, wie der Kurs aufgebaut ist und wie meine Note entsteht | Nenne die vier Meilensteine und die zwei Abgaben. | [Kursüberblick](../overview/#leistungsbeurteilung) |
| die Mitglieder von Wolkenwerk Bern und ihre Anforderungen nennen | Nenne zu jedem Mitglied die Anforderung, die es von den anderen unterscheidet. | [Kursüberblick](../overview/#der-fall) |
| KI-Werkzeuge nach den Regeln des Kurses einsetzen | Nenne die zwei Regeln für KI-Assistenten in den Nachweisen. | [Kursüberblick](../overview/#ki-werkzeuge) |
| die drei VMs des Labs und ihre beiden Netze beschreiben | Zeichne das Lab mit Front-end, Knoten, Labnetz und internem Netz aus dem Gedächtnis. | [Das Lab](../lab/#zwei-netze) |
| prüfen, ob eine VM verschachtelte Virtualisierung unterstützt | Zeige auf einem Knoten, dass die CPU `vmx` oder `svm` anbietet. | [Das Lab](../lab/#verschachtelte-virtualisierung) |
| meine persönlichen Parameter erzeugen und erklären | Zeige `/etc/cc-lab.env` auf allen drei VMs und erkläre, wo `CC_GUEST_NET` und `CC_VNI` im Kurs vorkommen. | [Persönliche Parameter](../parameters/#die-werte) |
| eine VM für ihre Rolle vorbereiten | Führe `prepare.sh` auf einem Knoten noch einmal aus und erkläre, was es prüft. | [VMs vorbereiten](../prepare/#das-vorbereitungsskript) |
| das Gateway des internen Netzes prüfen | Erkläre die Ausgabe von `sudo cc-gateway status`. | [VMs vorbereiten](../prepare/#das-gateway) |
| ohne Passwort per SSH auf alle VMs zugreifen | Melde dich mit `ssh` und dem Namen aus deiner SSH-Konfiguration am Front-end an und von dort an einem Knoten. | [Werkzeuge](../tools/#ssh-vom-front-end-auf-die-knoten) |
| einen Check starten und seinen Bericht lesen | Starte den Check `start` und erkläre, was der Hash am Ende belegt und was nicht. | [Werkzeuge](../tools/#der-erste-check) |
| einen Screencast nach den Regeln der Meilensteine aufnehmen | Zähle auf, was in den ersten 30 Sekunden eines Screencasts zu sehen ist. | [Werkzeuge](../tools/#screencasts) |

Für Teil 2 brauchst du drei vorbereitete VMs, die der Check `start` ohne `[!!]` bestätigt.
