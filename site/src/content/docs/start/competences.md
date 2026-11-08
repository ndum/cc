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
| erklären, wie der Kurs aufgebaut ist und wie meine Note entsteht | Nenne die zwei Abgaben sowie das Gewicht der Prüfung und rechne aus, welche Note 1 eine vollständige Basis ergibt. | [Kursüberblick](../overview/#leistungsbeurteilung) |
| die Mitglieder von Wolkenwerk Bern und ihre Anforderungen nennen | Nenne zu jedem Mitglied die Anforderung, die es von den anderen unterscheidet. | [Kursüberblick](../overview/#der-fall) |
| KI-Werkzeuge nach den Regeln des Kurses einsetzen | Nenne die zwei Regeln für KI-Assistenten in den Meilensteinen und sag, was in der Prüfung nicht erlaubt ist. | [Kursüberblick](../overview/#ki-werkzeuge) |
| die VMs des Labs und ihre beiden Netze beschreiben | Zeichne das Lab mit Front-end, Knoten, Client, Labnetz und internem Netz aus dem Gedächtnis. | [Das Lab](../lab/#zwei-netze) |
| erklären, wozu ich auf smartlearn den Client brauche | Erkläre, warum du auf smartlearn vom Client aus per SSH arbeitest und die Konsole eines Servers nur brauchst, wenn er nicht mehr antwortet. | [Das Lab](../lab/#der-client) |
| prüfen, ob eine VM verschachtelte Virtualisierung unterstützt | Zeige auf einem Knoten, dass die CPU `vmx` oder `svm` anbietet. | [Das Lab](../lab/#verschachtelte-virtualisierung) |
| den Servern ihre Adressen geben | Erkläre, wo netplan die Adresse eines Servers festhält und warum der zweite Block `netplan apply` erst nach deiner Abmeldung startet. | [Persönliche Parameter](../parameters/#die-adressen-im-lab) |
| meine persönlichen Parameter erzeugen und erklären | Zeige `/etc/cc-lab.env` auf allen drei Servern und erkläre, wo `CC_GUEST_NET` und `CC_VNI` im Kurs vorkommen. | [Persönliche Parameter](../parameters/#die-werte) |
| vom Client aus ohne Passwort per SSH auf alle Server zugreifen | Melde dich am Client mit `ssh` und dem Namen aus deiner SSH-Konfiguration am Front-end an und von dort an einem Knoten. | [VMs vorbereiten](../prepare/#ssh-vom-client) |
| einen Server für seine Rolle vorbereiten | Führe `prepare.sh` auf einem Knoten noch einmal aus und erkläre, was es prüft. | [VMs vorbereiten](../prepare/#das-vorbereitungsskript) |
| das Gateway des internen Netzes prüfen | Erkläre die Ausgabe von `sudo cc-gateway status`. | [VMs vorbereiten](../prepare/#das-gateway) |
| einen Check starten und seinen Bericht lesen | Starte den Check `start` und erkläre, was der Hash am Ende belegt und was nicht. | [VMs vorbereiten](../prepare/#der-check-start) |
| mein Abgabe-Repo anlegen und teilen | Nenne die Ordner deines Abgabe-Repos und sag, womit du die Basis eines Meilensteins belegst. | [Das Abgabe-Repo](../tools/#das-repo-anlegen) |
| einen Screencast der Zusatzaufträge nach den Regeln der Meilensteine aufnehmen | Zähle auf, was in den ersten 30 Sekunden eines Screencasts zu sehen ist. | [Leistungsbeurteilung](../../assessment/#zusatzaufträge-zeigen) |

Für Teil 2 brauchst du drei vorbereitete Server, die der Check `start` ohne `[!!]` bestätigt. Dieser Check ist zugleich die erste Anforderung von [Meilenstein 1](../../assessment/milestone-1/).
