---
title: Hosts betreiben
description: Die Zustände eines Hosts, Kapazität mit realer und zugeteilter Nutzung, Überbuchung, Migration mit und ohne Unterbruch, Wartung eines Knotens und was beim Ausfall eines Knotens geschieht.
sidebar:
  order: 5
---

:::assignment
«Nächste Woche bekommt Knoten 1 mehr Arbeitsspeicher», schreibt Simone Wyss. «Die Praxis darf davon nichts merken. Und was passiert eigentlich, wenn ein Knoten einfach ausfällt?»
:::

:::goals
Nach diesem Kapitel kannst du

- die Zustände eines Hosts lesen und ändern,
- reale und zugeteilte Kapazität unterscheiden und Überbuchung erklären,
- beschreiben, nach welchen Regeln der Scheduler einen Knoten wählt, und die Zustände einer VM lesen,
- VMs mit und ohne Unterbruch auf einen anderen Knoten verschieben,
- einen Knoten für die Wartung leeren und wieder in Betrieb nehmen,
- beschreiben, was beim Ausfall eines Knotens mit seinen VMs geschieht.
:::

## Zustände eines Hosts

`onehost list` zeigt in der Spalte `STAT` den Zustand jedes Knotens.

| Zustand | Bedeutung | Befehl |
|---|---|---|
| `on` | überwacht und bereit für neue VMs | `onehost enable` |
| `dsbl` | überwacht, laufende VMs bleiben, neue VMs kommen nicht dazu | `onehost disable` |
| `off` | nicht mehr überwacht, für ausgeschaltete Knoten | `onehost offline` |
| `err` | die Überwachung meldet einen Fehler, oft fehlt die SSH-Verbindung | |

## Kapazität und Überbuchung

`onehost show` zeigt für Arbeitsspeicher und CPU zwei Werte. `USED (ALLOCATED)` ist, was die Vorlagen der laufenden VMs reservieren, `USED (REAL)` ist, was sie tatsächlich brauchen. Drei VMs aus der Vorlage `ubuntu` reservieren 3 GB, brauchen im Leerlauf aber rund 2 GB. Die CPU zählt OpenNebula in Hundertsteln eines Kerns, ein Knoten mit vier Kernen hat 400. Eine VM mit `CPU = "0.5"` reserviert 50 davon.

```bash
onehost show <knoten> | sed -n '/HOST SHARES/,/LOCAL SYSTEM/p'
```

Der Scheduler plant mit der reservierten Kapazität. Ist ein Knoten voll reserviert, startet dort keine VM mehr, auch wenn er eigentlich noch Luft hätte. Mit den Werten `RESERVED_CPU` und `RESERVED_MEM` im Host kann das Plattform-Team die Kapazität anpassen. Ein positiver Wert hält Reserve frei, ein negativer Wert erlaubt Überbuchung. Überbuchung nutzt den Umstand, dass selten alle VMs gleichzeitig voll arbeiten, und senkt so die Kosten. Arbeiten doch alle gleichzeitig, werden alle langsamer. Beim Arbeitsspeicher ist Überbuchung heikler als bei der CPU, weil fehlender Speicher VMs abstürzen lässt statt sie nur zu verlangsamen.

## Platzierung durch den Scheduler

Eine neue VM wartet, bis der Scheduler ihr einen Knoten zuweist. OpenNebula 7.4 nutzt dafür standardmässig den [Rank Scheduler](https://docs.opennebula.io/7.4/product/cloud_system_administration/scheduler/rank_scheduler/), der in zwei Schritten arbeitet. Zuerst filtert er. Er streicht jeden Knoten, der die Bedingung `SCHED_REQUIREMENTS` der VM nicht erfüllt oder zu wenig freie CPU oder zu wenig freien Arbeitsspeicher hat, gemessen an der reservierten Kapazität. Auf dieselbe Weise prüft er Datastores und Netze. Danach ordnet er die übrigen Knoten nach dem Ausdruck `SCHED_RANK` und nimmt den Knoten mit dem höchsten Wert. Beide Ausdrücke kannst du in einer Vorlage setzen, etwa damit eine VM nur auf Knoten mit einer bestimmten Eigenschaft startet. Fehlt `SCHED_RANK`, gilt die Strategie der Installation. Die Dokumentation nennt dafür diese Strategien.

| Strategie | Rang | Wirkung |
|---|---|---|
| Packing | `RUNNING_VMS` | füllt zuerst Knoten, auf denen schon VMs laufen, und lässt andere leer |
| Striping | `- RUNNING_VMS` | verteilt die VMs auf möglichst viele Knoten |
| Load-aware | `FREE_CPU` | bevorzugt Knoten, deren CPU gerade am wenigsten belastet ist |
| Fixed | `PRIORITY` | folgt einer Priorität, die das Plattform-Team bei Host oder Cluster setzt |

Im Lab steht in `/etc/one/schedulers/rank.conf` der Eintrag `DEFAULT_SCHED` mit `POLICY = 1`, also Striping, so wie das Paket von OpenNebula die Datei ausliefert. Deshalb verteilen sich deine VMs auf beide Knoten. Packing braucht weniger Knoten, die übrigen lassen sich ausschalten. Striping hält auf jedem Knoten Reserve frei, und ein Ausfall trifft weniger VMs. Neben dem Rank Scheduler bringt OpenNebula 7.4 den [Distributed Resource Scheduler](https://docs.opennebula.io/7.4/product/cloud_system_administration/scheduler/drs/) mit. Er berücksichtigt die tatsächliche Auslastung der Knoten und schlägt Migrationen vor, die das Plattform-Team prüft oder automatisch ausführen lässt.

## Lebenszyklus einer VM

`onevm list` zeigt in der Spalte `STAT` den Zustand jeder VM in einer Kurzform. Die [Referenz der Zustände](https://docs.opennebula.io/7.4/product/operation_references/configuration_references/vm_states/) kennt sehr viele davon, im Alltag begegnen dir vor allem die folgenden.

| Zustand | Bedeutung | Auslöser |
|---|---|---|
| `pend` | wartet darauf, dass der Scheduler einen Knoten wählt | `onetemplate instantiate`, `onevm resume` aus `unde` |
| `prol` | OpenNebula kopiert die Disks auf den Knoten | Wahl des Knotens |
| `boot` | OpenNebula wartet, bis der Hypervisor die VM angelegt hat | Ende des Kopierens |
| `runn` | die VM läuft, ihr eigenes Hoch- und Herunterfahren eingeschlossen | Start durch den Hypervisor |
| `poff` | ausgeschaltet, die Disks bleiben auf dem Knoten | `onevm poweroff` |
| `unde` | ausgeschaltet, die Disks liegen wieder im Datastore `system` des Front-ends | `onevm undeploy` |
| `fail` | ein Schritt wie das Kopieren oder der Start ist fehlgeschlagen | Fehler in `prol`, `boot` oder bei einer Migration |
| `unkn` | die Überwachung erreicht die VM nicht mehr | Ausfall des Knotens |
| `done` | beendet, `onevm list` zeigt die VM nicht mehr | `onevm terminate` |

Der Unterschied zwischen `poff` und `unde` zählt für die Kapazität. Eine ausgeschaltete VM behält ihren Platz auf dem Knoten, eine VM in `unde` gibt ihn frei und läuft beim nächsten Start wieder durch Scheduler und `prol`. Steht eine VM auf `fail`, findest du die Ursache in ihrem Log unter `/var/log/one/<id>.log` und holst sie danach mit `onevm recover` zurück.

## Migration

Mit `onevm migrate` verschiebst du eine VM auf einen anderen Knoten. Ohne weitere Option hält OpenNebula die VM kurz an, kopiert ihren Arbeitsspeicher und ihre Disk und lässt sie auf dem Ziel weiterlaufen. Mit `--live` läuft die VM während der Migration weiter, und nur der letzte Teil des Arbeitsspeichers wird in einem sehr kurzen Moment übertragen. Im Lab dauerte die Migration einer kleinen VM ohne Option 7 Sekunden und mit `--live` 10 Sekunden.

```bash
onevm migrate --live web-1 <anderer-knoten>
onevm list
```

## Wartung eines Knotens

Für die Wartung leerst du einen Knoten und nimmst ihn danach wieder in Betrieb. `onehost flush` sperrt den Knoten und markiert seine VMs für eine neue Planung, worauf der Scheduler sie auf die anderen Knoten verschiebt. In `onevm list` tragen diese VMs kurz einen Stern vor dem Namen. Im Lab waren drei VMs nach etwa 10 Sekunden verschoben.

```bash
onehost flush <knoten>
onevm list
onehost offline <knoten>
```

Nach der Wartung startest du den Knoten wieder und gibst ihn mit `onehost enable` frei. Neue VMs landen dann wieder auf beiden Knoten. Die verschobenen VMs bleiben, wo sie sind, bis du sie selbst zurückholst.

Die Wartung klappt nur, wenn die übrigen Knoten genug Kapazität für alle VMs haben. Bei zwei Knoten heisst das, dass jeder allein alle VMs tragen muss. Wer eine solche Reserve plant, hält sie für Wartung und Ausfälle frei und rechnet sie in die Kosten ein.

## Ausfall eines Knotens

Fällt ein Knoten aus, laufen seine VMs nicht mehr. `onehost list` zeigt den Knoten nach einiger Zeit als `err`, seine VMs als `unkn`. Im Lab liegen die Disks laufender VMs im Datastore `system` des Knotens selbst. Solange der Knoten aus ist, kommt niemand an diese Disks, und die VMs lassen sich nicht auf einem anderen Knoten starten.

Für eine Cloud, die Ausfälle verkraftet, braucht es deshalb gemeinsamen Speicher, den alle Knoten erreichen, etwa Ceph oder ein NFS-Server, und eine Regel, die VMs eines ausgefallenen Knotens automatisch auf einem anderen neu startet. OpenNebula bietet dafür Hooks. Im Lab fehlt beides bewusst, damit es mit drei VMs auskommt. In Teil 6 gehört diese Lücke zur Beurteilung der Verfügbarkeit.

::::exercise[Wartung]
Starte zwei VMs aus der Vorlage `ubuntu`, leere einen Knoten, auf dem eine davon läuft, nimm ihn offline und danach wieder in Betrieb. Verschiebe zum Schluss eine VM live zurück. Notiere die Befehle in der richtigen Reihenfolge.

:::solution
1. `onetemplate instantiate ubuntu --name web-2` und `--name web-3`, dann `onevm list --size host=15` für die Knoten, denn ohne die Option kürzt die Spalte `HOST` die Adresse
2. `onehost flush <knoten>` und warten, bis `onevm list` keinen Stern mehr zeigt
3. `onehost offline <knoten>`
4. `onehost enable <knoten>` nach der Wartung
5. `onevm migrate --live web-2 <knoten>`
:::
::::

::::exercise[Kapazität]
Die Gemeinde Hinterbüel will wissen, ob zwei Knoten reichen, wenn einer zur Wartung ausfällt. Berechne mit `onehost show`, wie viele VMs aus der Vorlage `ubuntu` auf einem Knoten allein Platz haben, und begründe, ob Überbuchung beim Arbeitsspeicher eine gute Idee wäre.

:::solution
Ein Knoten mit 7,2 GB und 400 Hundertsteln CPU trägt sieben VMs mit je 1 GB und 50 Hundertsteln, der Arbeitsspeicher setzt die Grenze. Über beide Knoten verteilt dürfen es also nicht mehr als sieben sein, wenn einer allein alle tragen soll. Überbuchung beim Arbeitsspeicher wäre riskant, weil VMs bei fehlendem Speicher abstürzen und gerade während der Wartung alle auf einem Knoten laufen.
:::
::::

::::exercise[Strategie des Schedulers]
Die Gemeinde Hinterbüel möchte nachts Strom sparen und Knoten ausschalten, auf denen keine VMs laufen. Welche Strategie des Schedulers passt dazu, wo würdest du sie einstellen, und was nimmt die Gemeinde damit in Kauf?

:::solution
Packing passt, weil es zuerst die Knoten füllt, auf denen schon VMs laufen, und andere leer lässt. Eingestellt wird es in `/etc/one/schedulers/rank.conf` mit `POLICY = 0` im Eintrag `DEFAULT_SCHED`, für einzelne VMs auch mit `SCHED_RANK = "RUNNING_VMS"` in der Vorlage. Dafür laufen mehr VMs auf demselben Knoten. Fällt er aus, trifft es mehr VMs, und Lastspitzen dieser VMs bremsen sich gegenseitig. Packing wirkt nur auf neue Platzierungen, bestehende VMs verschiebt es nicht.
:::
::::
