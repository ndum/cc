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

Ohne Grenze könnte ein Mitglied alle Knoten füllen, und die anderen bekämen keine VM mehr. Eine Quota legt fest, wie viele Ressourcen eine Gruppe oder ein Benutzer höchstens belegen darf. Sie schützt die anderen Mitglieder, und sie macht die Kosten planbar, weil niemand mehr verbraucht, als vereinbart ist. Die Summe aller Quotas darf grösser sein als die Cloud. Das ist eine Überbuchung wie in Kapitel 2.5 und geht gut, solange nicht alle ihre Quota gleichzeitig ausschöpfen.

## Arten von Quotas

`onegroup show` listet für jede Gruppe vier Arten von Quotas mit Nutzung und Grenze.

| Art | Begrenzt | Beispiel |
|---|---|---|
| VM | Anzahl VMs, CPU, Arbeitsspeicher und Grösse der Disks, auch nur für laufende VMs | höchstens 2 VMs mit zusammen 2048 MB |
| Datastore | Anzahl und Grösse der Images in einem Datastore | höchstens 20 GB eigene Images |
| Netz | Anzahl Adressen aus einem Netz | höchstens 5 Adressen aus `cc-net` |
| Image | wie viele laufende VMs ein Image gleichzeitig nutzen | |

Quotas gibt es für Gruppen und für einzelne Benutzer. Eine Gruppe begrenzt das ganze Mitglied, ein Benutzer nur sich selbst innerhalb der Gruppe. Ein Strich in der Ausgabe heisst, dass keine Grenze gesetzt ist.

## Die Quotas der Mitglieder

Die Mitglieder zahlen unterschiedlich viel und brauchen unterschiedlich viel. Die Treuhand braucht für ihren Dienst aus Kapitel 3.5 Platz für bis zu drei VMs.

| Mitglied | Gruppe | VMs | CPU | Arbeitsspeicher |
|---|---|---|---|---|
| Praxis Rosenweg | `praxis` | 2 | 1 | 2048 MB |
| Treuhand Aaregg | `treuhand` | 4 | 2 | 4096 MB |
| Veloatelier Matte | `velo` | 2 | 1 | 2048 MB |
| Gemeinde Hinterbüel | `gemeinde` | 2 | 1 | 2048 MB |

Das Skript `lab/tenants/set-quotas.sh` setzt diese Werte. Für jede Gruppe schreibt es eine kleine Datei mit der Quota und übergibt sie an `onegroup quota`.

::code{file="lab/tenants/set-quotas.sh"}

```bash
~/cc/lab/tenants/set-quotas.sh
onegroup show praxis | sed -n '/VMS USAGE/,/DATASTORE/p'
```

Die CPU der Quota zählt wie `CPU` in der Vorlage. Eine VM aus der Vorlage `ubuntu` braucht 0,5 davon, zwei VMs füllen also die Quota der Praxis.

## An der Grenze

OpenNebula prüft die Quota, bevor es eine VM anlegt. Ist sie erschöpft, lehnt es den Auftrag sofort ab, und keine VM entsteht. Im Lab meldete die dritte VM der Praxis

```text
[one.template.instantiate] User [2] : group [100] limit of 2 reached for VMS quota in VM.
```

Die Meldung nennt den Benutzer, die Gruppe, die Grenze und welche Quota erreicht ist. Das Mitglied löscht dann eine VM oder bittet das Plattform-Team um eine grössere Quota. Eine Quota greift nur bei neuen Aufträgen. Senkt das Plattform-Team sie unter die aktuelle Nutzung, laufen die VMs weiter, aber es kommen keine neuen dazu.

::::exercise[Lab]
Setze die Quotas der vier Mitglieder und starte als `praxis-admin` eine dritte VM. Notiere die Meldung und zeige mit `onegroup show praxis` die Nutzung.

:::solution
`set-quotas.sh` meldet die Werte aller vier Mitglieder. Die dritte VM scheitert mit «limit of 2 reached for VMS quota in VM». `onegroup show praxis` zeigt bei den VMs `2 / 2` und beim Arbeitsspeicher `2048M / 2G`, auch die CPU ist voll ausgeschöpft.
:::
::::

::::exercise[Quota planen]
Das Veloatelier möchte für den Samstag eine VM mit 2 CPU und 2048 MB Arbeitsspeicher aus einer eigenen Vorlage. Passt das in seine Quota? Welche Quota würdest du vorschlagen, und was bedeutet das für die anderen Mitglieder?

:::solution
Nein, die Quota des Veloateliers erlaubt nur 1 CPU. Für diese VM und eine kleine daneben bräuchte es mindestens 2,5 CPU und 3072 MB. Die Quotas aller Mitglieder ergäben dann zusammen 6,5 CPU und 11 GB. Beide Knoten zusammen tragen das, ein einzelner Knoten während der Wartung aber nicht mehr. Das ist vertretbar, wenn die Samstage des Veloateliers nicht mit dem Monatsende der Treuhand zusammenfallen, und gehört in die Kostenrechnung.
:::
::::
