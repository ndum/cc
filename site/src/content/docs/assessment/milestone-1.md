---
title: Meilenstein 1 · IaaS für Wolkenwerk
description: Der Auftrag des ersten Meilensteins mit den verlangten Funktionen, dem Ablauf des Screencasts, dem Inhalt der Abgabe und dem Bewertungsraster.
---

:::assignment
«Die vier Mitglieder sollen ab nächstem Monat auf unserer eigenen Cloud arbeiten», schreibt Simone Wyss. «Zeig dem Vorstand, dass sie läuft, dass jedes Mitglied nur seine eigenen Maschinen sieht, was es verbraucht und wie die Treuhand Ende Monat mehr Leistung bekommt.»
:::

Meilenstein 1 umfasst Teil 2 und Teil 3. Du baust in deinem Lab die IaaS für Wolkenwerk Bern auf, teilst sie unter den vier Mitgliedern auf und erklärst deine Entscheide. Meilenstein 1 ist eine Einzelarbeit und gehört mit Meilenstein 2 zur Abgabe 1.

## Verlangte Funktionen

Alles läuft in deinem eigenen Lab mit deinen persönlichen Parametern aus Kapitel 0.3.

1. OpenNebula 7.4 läuft mit zwei Knoten, der Check `install` ist grün.
2. Das Netz `cc-net` ist aus deinen Parametern angelegt, eine VM aus der Vorlage `ubuntu` läuft mit SSH und Zugang zum Internet, der Check `iaas` ist grün.
3. Du leerst einen Knoten für die Wartung, nimmst ihn wieder in Betrieb und verschiebst eine VM live.
4. Die vier Mitglieder haben Gruppen mit Admins im VDC `wolkenwerk`, und ein Mitglied sieht die VMs eines anderen nicht.
5. Die Quotas der Mitglieder sind gesetzt, und du zeigst die Meldung an der Grenze.
6. Die Vorlage `ubuntu` hat Preise, der Showback eines Monats liegt als CSV in deinem Abgabe-Repo.
7. Ein Benutzer eines Mitglieds startet eine VM im Self-Service.
8. Die Treuhand betreibt ihren Dienst in OneFlow selbst, er wächst unter Last und schrumpft wieder, der Check `tenants` ist grün.

## Erklärungen und Entscheide

Im README von Meilenstein 1 und im Screencast erklärst du

- die Architektur deines Labs mit einer eigenen Zeichnung von Front-end, Knoten, Netzen, Gruppen und VDC,
- warum die VMs VXLAN und eine MTU von 1450 brauchen,
- wie Gruppen, VDC und ACLs die Mitglieder trennen,
- wie du Quotas und Preise festgelegt hast und ob die Preise die Kosten der Genossenschaft decken,
- warum deine Regeln für die Elastizität so sind, wie sie sind,
- was im Lab beim Ausfall eines Knotens geschieht und was es für eine höhere Verfügbarkeit bräuchte.

Weichst du von den Werten des Kurses ab, etwa bei Quotas, Preisen oder Regeln, begründest du das. Eigene Entscheide geben mehr Punkte als übernommene Werte.

## Screencast

Der Screencast dauert höchstens zehn Minuten in einer einzigen Aufnahme. Ein Vorschlag für den Ablauf.

| Minuten | Was du zeigst |
|---|---|
| 0 bis 1 | `/etc/cc-lab.env` und die Berichte der Checks `install`, `iaas` und `tenants` mit Hash |
| 1 bis 3 | Architektur anhand deiner Zeichnung, `onehost list`, `onevnet show cc-net` |
| 3 bis 4 | Wartung eines Knotens mit Migration |
| 4 bis 6 | Mitglieder, Trennung, Quota an der Grenze, Self-Service |
| 6 bis 7 | Showback und deine Kostenrechnung |
| 7 bis 9 | Dienst der Treuhand unter Last |
| 9 bis 10 | zwei oder drei eigene Entscheide |

Den Dienst unter Last startest du am besten vor der Aufnahme, das Wachsen braucht einige Minuten. Nimm den Screencast auf, bevor du mit Teil 4 beginnst. In Kapitel 4.2 entfernst du die VMs von Teil 2 und 3, weil der Kubernetes-Cluster ihren Platz braucht. Zeigst du Meilenstein 1 live im Unterricht, gilt derselbe Ablauf, und [Kapitel 4.2](../../platform/opentofu/#platz-auf-den-knoten) zeigt, wie du den Cluster dafür vorübergehend von den Knoten nimmst.

## Abgabe

Im Ordner `m1/` deines Abgabe-Repos liegen

- `README.md` mit Zeichnung, Erklärungen, Entscheiden und deinem Einsatz von KI,
- der Showback als CSV,
- deine angepassten Skripte und Vorlagen, falls du welche geändert hast,
- der Screencast oder ein Link darauf.

Die Berichte der Checks legst du in `reports/`. Wie das Repo aufgebaut ist und wie du einen Tag setzt, steht in der [Übersicht](../).

## Bewertungsraster

| Kriterium | Punkte |
|---|---|
| OpenNebula mit zwei Knoten, Check `install` | 2 |
| Netz, Vorlage und VM, Check `iaas` | 3 |
| Wartung eines Knotens mit Migration | 2 |
| Mitglieder mit Gruppen, Admins und VDC, Trennung gezeigt | 3 |
| Quotas gesetzt, Grenze gezeigt | 2 |
| Showback mit Preisen und CSV | 2 |
| Self-Service und Dienst der Treuhand mit Elastizität, Check `tenants` | 4 |
| **Funktionen** | **18** |
| Architektur mit eigener Zeichnung | 3 |
| VXLAN, MTU und Trennung der Mitglieder erklärt | 3 |
| Quotas, Preise und Kostendeckung begründet | 3 |
| Regeln der Elastizität und Folgen eines Knotenausfalls begründet | 3 |
| **Erklärungen und Entscheide** | **12** |
| **Total** | **30** |

Die Funktionen ergeben 60 % der Punkte, die Erklärungen und Entscheide 40 %. Die Note der Abgabe 1 berechnet deine Dozentin oder dein Dozent aus den Punkten von Meilenstein 1 und 2 nach den Regeln der Schule.
