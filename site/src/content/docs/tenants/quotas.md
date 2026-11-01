---
title: Quotas
description: Quotas für Gruppen und Benutzer, die Arten von Quotas in OpenNebula, die Werte für die vier Mitglieder und was an der Grenze geschieht.
sidebar:
  order: 2
---

:::assignment
«Die Gemeinde Hinterbüel hat ein festes Budget», schreibt Beat Kläy. «Sie darf nicht mehr verbrauchen, als sie bezahlt. Und die Treuhand Aaregg braucht Ende Monat mehr als die anderen.»
:::

:::goals
Nach diesem Kapitel kannst du

- erklären, wozu eine Cloud Quotas braucht,
- die Arten von Quotas in OpenNebula unterscheiden,
- Quotas für Gruppen setzen und ihre Nutzung lesen,
- beschreiben, was an der Grenze einer Quota geschieht.
:::

## Der Zweck von Quotas

In einer Cloud teilen sich mehrere Mandanten dieselben Knoten. Ohne Grenze könnte ein Mitglied alle Knoten füllen, und die anderen bekämen keine VM mehr. Eine Quota legt fest, wie viele Ressourcen eine Gruppe oder ein Benutzer höchstens belegen darf.

Damit schützt sie die anderen Mitglieder vor einem lauten Nachbarn, in der Fachsprache Noisy Neighbor genannt. Gemeint ist ein Mandant, der mit vielen oder grossen VMs den Platz belegt, den andere ebenfalls brauchen. Die Quota teilt die Kapazität zudem fair auf. Jedes Mitglied bekommt den Anteil, den es mit der Genossenschaft vereinbart hat, auch wenn ein anderes gerade viel mehr möchte. Schliesslich macht sie die Kosten planbar, und zwar für beide Seiten. Ein Mitglied weiss im Voraus, wie viel es höchstens belegen kann. Die Showback-Rechnung aus Kapitel 3.3 fällt deshalb nie höher aus als die volle Quota während des ganzen Monats. Für die Gemeinde mit ihrem festen Budget zählt genau das. Das Plattform-Team wiederum weiss, wie viel Hardware es braucht, um alle Zusagen gleichzeitig einzuhalten.

## Arten von Quotas

`onegroup show` listet für jede Gruppe vier Arten von Quotas mit Nutzung und Grenze.

| Art | Begrenzt | Beispiel |
|---|---|---|
| VM | Anzahl VMs, CPU, Arbeitsspeicher und Grösse der Disks, auch nur für laufende VMs | höchstens 2 VMs mit zusammen 2048 MB |
| Datastore | Anzahl und Grösse der Images in einem Datastore | höchstens 20 GB eigene Images |
| Netz | Anzahl Adressen aus einem Netz | höchstens 5 Adressen aus `cc-net` |
| Image | wie viele laufende VMs ein Image gleichzeitig nutzen | |

In der Datei einer Quota heissen die Grenzen der VM-Quota `VMS`, `CPU`, `MEMORY` und `SYSTEM_DISK_SIZE`, die beiden letzten in MB. `SYSTEM_DISK_SIZE` zählt die Disks, die auf dem System-Datastore der Knoten liegen, also flüchtige und nicht persistente Disks samt ihren Snapshots. Zu jeder dieser Grenzen gibt es eine Variante mit `RUNNING_`, etwa `RUNNING_VMS` oder `RUNNING_MEMORY`. Sie zählt nur VMs, die aktiv sind, auf einen Knoten warten oder zurückgehalten werden. Eine ausgeschaltete VM belegt dann keinen Platz mehr in `RUNNING_MEMORY`, wohl aber weiterhin in `MEMORY`. Die anderen Arten haben eigene Namen. Die Datastore-Quota begrenzt mit `SIZE` und `IMAGES`, die Netz-Quota mit `LEASES` die Zahl der Adressen und die Image-Quota mit `RVMS` die gleichzeitig laufenden VMs.

In OpenNebula 7.4 lässt sich eine VM-Quota mit `CLUSTER_IDS` auf einzelne Cluster beschränken. Ohne diese Angabe gilt sie für die ganze Cloud, deshalb steht in `onegroup show` die Spalte `CLUSTERS` leer. Alle Attribute beschreibt die [Dokumentation zu den Quotas](https://docs.opennebula.io/7.4/product/cloud_system_administration/capacity_planning/quotas/).

## Ebenen und Standardwerte

Quotas gibt es auf zwei Ebenen. Eine Gruppenquota begrenzt, was alle Benutzer einer Gruppe zusammen belegen, also das ganze Mitglied. Eine Benutzerquota begrenzt einen einzelnen Benutzer innerhalb seiner Gruppe. Ein neuer Auftrag muss beide Grenzen einhalten. So kann die Praxis ihrer MPA eine einzige VM erlauben, während die Gruppe als Ganzes bei zwei VMs bleibt.

Wer eine Quota setzen darf, hängt von den Rechten ab. Für eine Gruppenquota braucht es das Recht `ADMIN` auf die Gruppe, das hat ohne weitere ACL nur `oneadmin`. Für eine Benutzerquota genügt `MANAGE` auf den Benutzer, deshalb kann ein Gruppenadmin die Benutzer seiner eigenen Gruppe begrenzen. Das Plattform-Team verteilt die Kapazität also auf die Mitglieder, und jedes Mitglied verteilt seinen Anteil selbst weiter.

Für alle Gruppen und Benutzer ohne eigene Grenze gelten Standardquotas. `onegroup defaultquota` und `oneuser defaultquota` legen sie fest, ab Werk sind sie unbegrenzt. In der Datei einer Quota steht `-1` für den Standardwert und `-2` für unbegrenzt. In der Ausgabe von `onegroup show` heisst ein Strich, dass keine Grenze gesetzt ist. Für Quotas einzelner Cluster gelten die Standardwerte nicht, die setzt das Plattform-Team von Hand.

## Die Quotas der Mitglieder

Die Mitglieder zahlen unterschiedlich viel und brauchen unterschiedlich viel. Die Treuhand braucht für ihren Dienst aus Kapitel 3.5 Platz für bis zu drei VMs.

| Mitglied | Gruppe | VMs | CPU | Arbeitsspeicher |
|---|---|---|---|---|
| Praxis Rosenweg | `praxis` | 2 | 1,5 | 2048 MB |
| Treuhand Aaregg | `treuhand` | 4 | 2 | 4096 MB |
| Veloatelier Matte | `velo` | 2 | 1 | 2048 MB |
| Gemeinde Hinterbüel | `gemeinde` | 2 | 1 | 2048 MB |

Das Skript `lab/tenants/set-quotas.sh` setzt diese Werte. Für jede Gruppe schreibt es eine kleine Datei mit der Quota und übergibt sie an `onegroup quota`.

::code{file="lab/tenants/set-quotas.sh"}

```bash
~/cc/lab/tenants/set-quotas.sh
onegroup show praxis | sed -n '/VMS USAGE/,/DATASTORE/p'
```

Die CPU der Quota zählt wie `CPU` in der Vorlage. Eine VM aus der Vorlage `ubuntu` braucht 0,5 davon. Die Praxis bekommt 1,5 CPU, weil Sunstone beim Start einer VM die CPU auf die Zahl der virtuellen CPUs setzt, also auf 1. So passt in Kapitel 3.4 eine VM aus Sunstone neben `praxis-1`.

Für Meilenstein 1 bekommt die Gemeinde die Quota aus deinen [persönlichen Werten](../../start/parameters/). Kopiere dafür das Skript, ändere die Zeile der Gemeinde und führe die Kopie aus. Die anderen Mitglieder behalten die Werte der Tabelle.

```bash
cp ~/cc/lab/tenants/set-quotas.sh ~/cc-lab/set-quotas.sh
nano ~/cc-lab/set-quotas.sh
~/cc-lab/set-quotas.sh
```

## An der Grenze

OpenNebula prüft die Quota, bevor es eine VM anlegt. Ist sie erschöpft, lehnt es den Auftrag sofort ab, und keine VM entsteht. Im Lab meldete die dritte VM der Praxis

```text
[one.template.instantiate] User [2] : group [100] limit of 2 reached for VMS quota in VM.
```

Die Meldung nennt den Benutzer, die Gruppe, die Grenze und welche Quota erreicht ist. Das Mitglied löscht dann eine VM oder bittet das Plattform-Team um eine grössere Quota. Eine Quota greift nur bei neuen Aufträgen. Senkt das Plattform-Team sie unter die aktuelle Nutzung, laufen die VMs weiter, aber es kommen keine neuen dazu.

## Quota und Überbuchung

Eine Quota begrenzt, wie viel ein Mandant reservieren darf. Ob die Hardware diese Reservationen auch trägt, sagt sie nicht. Überbuchung heisst dagegen, dass auf einem Knoten mehr reserviert wird, als er hat. In Kapitel 2.5 erlaubt ein negativer Wert für `RESERVED_CPU` oder `RESERVED_MEM` genau das. Auch die Quotas selbst lassen sich überbuchen. Die Summe aller Quotas darf grösser sein als die Cloud, und das geht gut, solange nicht alle Mitglieder ihre Quota gleichzeitig ausschöpfen.

Bei der CPU ist Überbuchung wenig riskant. Teilen sich mehrere virtuelle CPUs einen Kern, verteilt der Hypervisor die Rechenzeit, und alle VMs werden langsamer, laufen aber weiter. Die Vorlage `ubuntu` tut das bereits im Kleinen. Sie gibt der VM mit `VCPU = 1` einen ganzen virtuellen Kern, reserviert mit `CPU = 0.5` aber nur einen halben. Beim Arbeitsspeicher fehlt dieser Spielraum. Brauchen die VMs zusammen mehr Speicher, als der Knoten hat, muss der Host auslagern oder Prozesse beenden, und eine VM kann abstürzen. Deshalb überbucht man die CPU eher als den Arbeitsspeicher, und die Summe der Speicherquotas sollte zur Kapazität der Knoten passen.

Eine Quota begrenzt ausserdem die Menge, nicht die Last. Eine VM, die ihre CPU voll ausnutzt, kann die anderen auf einem überbuchten Knoten trotzdem bremsen. Gegen diese Form des lauten Nachbarn hilft vor allem weniger Überbuchung oder ein eigener Knoten.

## Quotas in Kubernetes

In Teil 4 begegnest du derselben Idee wieder. Eine [ResourceQuota](https://kubernetes.io/docs/concepts/policy/resource-quotas/) begrenzt, was alle Pods eines Namespaces zusammen an CPU und Arbeitsspeicher anfordern dürfen, so wie eine Gruppenquota alle VMs einer Gruppe begrenzt. Der Namespace übernimmt dort die Rolle der Gruppe. Auch Kubernetes trennt zwischen dem, was reserviert ist, den Requests, und dem, was ein Container höchstens nutzen darf, den Limits. Welche Quota jedes Mitglied im Cluster bekommt, zeigt [Kapitel 4.5](../../platform/templates/).

::::exercise[Lab]
Setze die Quotas der vier Mitglieder. Starte als `praxis-admin` neben `praxis-1` aus Kapitel 3.1 die VM `praxis-2` und danach eine dritte VM `praxis-3`. Notiere die Meldung und zeige mit `onegroup show praxis` die Nutzung.

:::solution
`set-quotas.sh` meldet die Werte aller vier Mitglieder. `praxis-2` startet, die dritte VM scheitert mit «limit of 2 reached for VMS quota in VM». `onegroup show praxis` zeigt bei den VMs `2 / 2` und beim Arbeitsspeicher `2G / 2G` und bei der CPU `1 / 1.5`.
:::
::::

::::exercise[Quota planen]
Das Veloatelier möchte für den Samstag eine VM mit 2 CPU und 2048 MB Arbeitsspeicher aus einer eigenen Vorlage. Passt das in seine Quota? Welche Quota würdest du vorschlagen, und was bedeutet das für die anderen Mitglieder?

:::solution
Nein, die Quota des Veloateliers erlaubt nur 1 CPU. Für diese VM und eine kleine daneben bräuchte es mindestens 2,5 CPU und 3072 MB. Die Quotas aller Mitglieder ergäben dann zusammen 7 CPU und 11 GB. Beide Knoten zusammen tragen das, ein einzelner Knoten während der Wartung aber nicht mehr. Das ist vertretbar, wenn die Samstage des Veloateliers nicht mit dem Monatsende der Treuhand zusammenfallen, und gehört in die Kostenrechnung.
:::
::::

::::exercise[Quota und Last]
Am Monatsende lastet die Treuhand ihre VMs voll aus. Die Praxis meldet, ihre VM reagiere träge, obwohl sie ihre Quota nicht ausschöpft und die Treuhand innerhalb ihrer Quota bleibt. Erkläre, wie das trotz Quotas geschehen kann, und schlage zwei Massnahmen vor.

:::solution
Die Quotas begrenzen nur, wie viel CPU die Mitglieder reservieren. Die VMs aus `ubuntu` reservieren 0,5 CPU, haben aber je eine ganze virtuelle CPU. Ein Knoten mit vier Kernen nimmt so bis zu acht solche VMs auf, die CPU ist also überbucht. Arbeiten die VMs der Treuhand voll, teilen sie sich die Kerne mit der VM der Praxis, und alle werden langsamer. Das Plattform-Team kann die Überbuchung senken, etwa mit `CPU = 1` in den Vorlagen der Treuhand oder ohne negatives `RESERVED_CPU`. Es kann die VMs der Treuhand auch auf einen anderen Knoten verschieben. Eine kleinere Quota der Treuhand löst das Problem nicht zuverlässig, weil schon wenige VMs unter Volllast den Knoten bremsen.
:::
::::
