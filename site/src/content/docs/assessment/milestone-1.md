---
title: Meilenstein 1 · IaaS für Wolkenwerk
description: Der Auftrag des ersten Meilensteins mit den sieben Anforderungen der Basis, den drei Zusatzaufträgen, der Vorführung, dem Inhalt der Abgabe und dem Bewertungsraster.
---

:::assignment
«Die vier Mitglieder sollen ab nächstem Monat auf unserer eigenen Cloud arbeiten», schreibt Simone Wyss. «Zeig dem Vorstand, dass sie läuft, dass jedes Mitglied nur seine eigenen Maschinen sieht, was es verbraucht und wie die Treuhand Ende Monat mehr Leistung bekommt.»
:::

Meilenstein 1 umfasst Teil 0 bis Teil 3. In der Basis baust du in deinem Lab die IaaS für Wolkenwerk Bern auf und teilst sie unter den vier Mitgliedern auf. In den Zusatzaufträgen lässt du einen Dienst elastisch wachsen, automatisierst den Showback und prüfst, was ein Knotenausfall für die Mitglieder bedeutet. Meilenstein 1 gehört mit Meilenstein 2 zur Abgabe 1.

## Basis

Alles läuft in deinem eigenen Lab mit deinen persönlichen Parametern aus Kapitel 0.3. Die Basis umfasst sieben Anforderungen.

1. Die drei VMs sind vorbereitet, der Check `start` ist grün.
2. OpenNebula 7.4 läuft mit beiden Knoten, der Check `install` ist grün.
3. Das Netz `cc-net` ist aus deinen Parametern angelegt, eine VM aus der Vorlage `ubuntu` läuft mit SSH und Zugang zum Internet, der Check `iaas` ist grün.
4. Du leerst einen Knoten für die Wartung, nimmst ihn wieder in Betrieb und verschiebst eine VM live.
5. Die vier Mitglieder haben Gruppen mit Admins im VDC `wolkenwerk`, ein Mitglied sieht die VMs eines anderen nicht.
6. Die Quotas der Mitglieder sind gesetzt, die Gemeinde hat die Quota aus deinen [persönlichen Werten](../../start/parameters/#deine-werte-für-die-meilensteine). Du zeigst die Meldung an der Grenze.
7. Die Vorlage `ubuntu` hat Preise, der Showback eines Monats liegt als CSV vor. Ein Benutzer eines Mitglieds startet eine VM im Self-Service.

Die Basis belegst du mit dem Bericht des Checks `m1` und mit einem Screenshot zu jeder Anforderung, dessen Dateiname mit ihrer Nummer beginnt. Den Bericht erzeugt `python3 ~/cc/checks/check.py m1` auf dem Front-end.

:::caution[Screenshots vor Kapitel 4.2]
In Kapitel 4.2 entfernst du die VMs von Teil 2 und 3, weil der Kubernetes-Cluster ihren Platz braucht. Mach die Screenshots der Basis vorher, danach fehlen die VMs, die sie zeigen. Zeigst du die Zusatzaufträge im Screencast, nimmst du ihn ebenfalls vor Kapitel 4.2 auf.
:::

## Zusatzaufträge

Für die drei Zusatzaufträge rechnest du mit vier bis sechs Stunden. Jeder gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../#stufen-der-zusatzaufträge). Zu jedem Auftrag, den du machst, gehört eine [Dokumentation in fünf Teilen](../#dokumentation-der-zusatzaufträge). [Kapitel 3.5](../../tenants/advanced/) erklärt die Konzepte dazu und nennt für jeden Auftrag die Anforderungen an deine Lösung.

### A · Elastizität mit OneFlow

Die Treuhand betreibt einen Dienst in OneFlow, der nach Last und nach Zeitplan wächst und danach wieder schrumpft. Du zeigst das Wachsen unter Last und das Schrumpfen ohne Last und begründest deine Regeln. Starte die Last vor der Vorführung, das Wachsen braucht einige Minuten. Die Anforderungen nennt [Auftrag A in Kapitel 3.5](../../tenants/advanced/#auftrag-a--elastizität-mit-oneflow).

### B · Showback als Bericht

Ein eigenes Skript mit einem eigenen systemd-Timer legt den Showback des vergangenen Monats als CSV ab. Aus dem CSV berechnest du, ob die Preise die Kosten der Genossenschaft decken. OpenNebula 7.4 bringt schon den Timer `opennebula-showback.timer` mit, der den Showback täglich berechnet. Der Name deines Timers enthält deshalb `showback`, beginnt aber nicht mit `opennebula-`. [Auftrag B in Kapitel 3.5](../../tenants/advanced/#auftrag-b--showback-als-bericht) nennt die Anforderungen, [Kapitel 3.3](../../tenants/showback/) erklärt Preise und Showback.

### C · Ausfall eines Knotens

Du schaltest einen Knoten aus und zeigst, was mit den VMs der Mitglieder geschieht. Daraus leitest du einen Vorschlag für die Platzierung der VMs ab, etwa Packing oder Striping, den du für die Mitglieder von Wolkenwerk begründest. [Auftrag C in Kapitel 3.5](../../tenants/advanced/#auftrag-c--ausfall-eines-knotens) nennt die Anforderungen, [Kapitel 2.5](../../iaas/hosts/) beschreibt Scheduler, Wartung und Ausfall.

## Zusatzaufträge zeigen

Die Zusatzaufträge zeigst du live im Unterricht oder in einem Screencast von höchstens zehn Minuten. Für die Vorführung im Unterricht vereinbarst du selbst einen Termin mit deiner Dozentin oder deinem Dozenten. Sie muss bis zur Abgabe 1 stattfinden. Der Screencast beginnt mit `cat /etc/cc-lab.env` und dem Bericht des Checks `m1` mit Hash und deinen zwei Fragen, die du in der Vorführung beantwortest.

Nach Kapitel 4.2 belegt der Kubernetes-Cluster die Knoten. Führst du Auftrag A oder C danach live vor, nimmst du den Cluster dafür vorübergehend von den Knoten. Wie das geht, steht in [Kapitel 4.2](../../platform/opentofu/#platz-auf-den-knoten).

## Abgabe

Im Ordner `m1/` deines Abgabe-Repos liegen die Screenshots der Basis. Für die Zusatzaufträge kommen ihre Dokumentation, für Auftrag B das Skript und die Units des Timers und für die Vorführung der Screencast oder ein Link darauf dazu.

Die Berichte der Checks legst du in `reports/`. Wie das Repo aufgebaut ist und wie du einen Tag setzt, steht in der [Übersicht](../).

## Bewertungsraster

| Anforderung der Basis | Punkte |
|---|---|
| Drei vorbereitete VMs, Check `start` | 3 |
| OpenNebula mit beiden Knoten, Check `install` | 3 |
| Netz, Vorlage und VM mit SSH und Internet, Check `iaas` | 3 |
| Wartung eines Knotens mit Migration | 3 |
| Mitglieder mit Gruppen, Admins und VDC, Trennung gezeigt | 3 |
| Quotas mit den persönlichen Werten der Gemeinde, Grenze gezeigt | 3 |
| Preise, Showback als CSV und Self-Service | 3 |
| **Basis** | **21** |

| Zusatzauftrag | Punkte |
|---|---|
| A · Elastizität mit OneFlow | 3 |
| B · Showback als Bericht mit Kostendeckung | 3 |
| C · Ausfall eines Knotens und Vorschlag zur Platzierung | 3 |
| **Zusatz** | **9** |

Meilenstein 1 gibt zusammen höchstens 30 Punkte. Eine Anforderung der Basis gibt 3 Punkte, wenn Bericht und Screenshot sie belegen. Für eine nur teilweise erfüllte Anforderung gibt es 1 Punkt. Beantwortest du eine der zwei Fragen nicht oder falsch, bekommt der Zusatzauftrag, zu dem sie gehört, höchstens 1 Punkt. Ohne Dokumentation gibt ein Zusatzauftrag höchstens 1 Punkt.
