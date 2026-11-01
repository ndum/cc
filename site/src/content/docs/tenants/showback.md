---
title: Showback
description: Kosten pro Ressource in der Vorlage, die Berechnung mit oneshowback, ein einfaches Kostenmodell für die Genossenschaft und der Unterschied zwischen Showback und Chargeback.
sidebar:
  order: 3
---

:::assignment
«Der Vorstand will wissen, was jedes Mitglied verbraucht», schreibt Beat Kläy. «Noch verrechnen wir nichts, aber jedes Mitglied soll seine Kosten sehen.»
:::

:::goals
Nach diesem Kapitel kannst du

- Showback und Chargeback unterscheiden,
- Preise pro Ressource in einer Vorlage hinterlegen,
- die Kosten der Mitglieder mit `oneshowback` berechnen und lesen,
- die Kosten einer VM pro Stunde und Monat selbst nachrechnen.
:::

## Showback und Chargeback

Wer eine Cloud teilt, will wissen, wer wie viel davon braucht. Die FinOps Foundation unterscheidet zwei Wege. Showback zeigt jedem Bereich, was er verbraucht hat, ohne dass Geld fliesst. Chargeback belastet diesen Verbrauch dem Budget des Bereichs. Showback ist der erste Schritt, denn erst wenn die Zahlen stimmen und alle sie verstehen, lässt sich darauf eine Rechnung stellen. Ob eine Organisation danach Chargeback einführt, hängt von ihrer Buchhaltung ab.

Wolkenwerk Bern beginnt mit Showback. Die Mitglieder sehen ihre Kosten jeden Monat, und der Vorstand entscheidet später, wie die Genossenschaft sie verrechnet.

## Preise in der Vorlage

OpenNebula rechnet mit drei Preisen pro Stunde, die in der Vorlage stehen. `CPU_COST` gilt pro CPU der Vorlage, `MEMORY_COST` pro MB Arbeitsspeicher und `DISK_COST` pro MB Disk. Die Preise im Lab sind für den Fall erfunden, sie sind in Franken gedacht.

::code{file="lab/tenants/costs.tpl"}

```bash
onetemplate update ubuntu --append ~/cc/lab/tenants/costs.tpl
onetemplate show ubuntu | grep COST
```

Eine VM übernimmt die Preise beim Start aus der Vorlage. VMs, die vorher gestartet sind, kosten deshalb nichts. Ein Neustart mit `onevm reboot` genügt dafür nicht. Im Lab beendest du die VMs der Mitglieder nach dem Eintragen der Preise mit `onevm terminate` und startest sie aus der Vorlage wieder.

## Kosten berechnen

`oneshowback calculate` berechnet die Kosten aller VMs aus ihrer Laufzeit und legt sie pro Monat ab. Im Lab startest du die Berechnung selbst, im Betrieb würde ein Timer sie regelmässig auslösen. `oneshowback list` zeigt danach pro VM Besitzer, Gruppe, Monat, Stunden, Laufzeit und Kosten. Mit `-g` siehst du nur ein Mitglied.

```bash
oneshowback calculate
oneshowback list
oneshowback list -g treuhand
oneshowback list --csv > ~/cc-lab/showback.csv
```

Ein Gruppenadmin sieht mit `oneshowback list` nur die VMs seiner Gruppe. So kann jedes Mitglied seine eigenen Kosten prüfen, ohne die der anderen zu sehen.

## Die Kosten einer VM

Eine VM aus der Vorlage `ubuntu` hat 0,5 CPU, 1024 MB Arbeitsspeicher und eine Disk von 3584 MB. Pro Stunde kostet sie

```text
0.5 × 0.05 + 1024 × 0.00002 + 3584 × 0.000001 = 0.025 + 0.0205 + 0.0036 ≈ 0.049
```

Über 30 Tage mit 720 Stunden sind das rund 35 Franken. Die Kosten hängen an der Laufzeit, eine gestoppte VM kostet in diesem Modell nichts mehr. Darum lohnt es sich für die Mitglieder, VMs zu stoppen, die sie nicht brauchen.

Die Preise müssen am Ende die Kosten der Genossenschaft decken. Dazu gehören die Hardware über ihre Lebensdauer, Strom, Lizenzen, Backup und die Arbeit des Plattform-Teams, auch die Reserve für Wartung aus Kapitel 2.5. Ein einfacher Ansatz teilt die jährlichen Kosten durch die Kapazität, die im Jahr verkauft werden kann. In Teil 6 kommt das Kostenmodell für dein eigenes Mitglied dazu.

::::exercise[Lab]
Trage die Preise in die Vorlage ein. Beende je eine VM der Praxis und der Treuhand mit `onevm terminate` und starte sie unter demselben Namen aus der Vorlage neu. Berechne den Showback nach einer Stunde, in der Zwischenzeit kannst du mit Kapitel 3.4 weiterarbeiten. Exportiere die Liste als CSV in dein Abgabe-Repo.

:::solution
`onetemplate show ubuntu` zeigt `CPU_COST`, `MEMORY_COST` und `DISK_COST`. Nach `oneshowback calculate` listet `oneshowback list` die neuen VMs mit rund einer Stunde und Kosten um 0.05. Die alten VMs ohne Preise stehen mit Kosten 0 in der Liste.
:::
::::

::::exercise[Kostenmodell]
Die beiden Knoten haben zusammen 7 000 Franken gekostet und laufen fünf Jahre. Strom, Backup und Arbeit kosten im Jahr 6 000 Franken. Im Mittel sind 10 VMs aus der Vorlage `ubuntu` belegt. Decken die Preise des Labs die Kosten? Was würdest du dem Vorstand vorschlagen?

:::solution
Die Kosten pro Jahr sind 7 000 / 5 + 6 000 = 7 400 Franken. 10 VMs zu je 35 Franken im Monat bringen 4 200 Franken im Jahr. Die Preise decken also nur gut die Hälfte. Entweder steigen die Preise auf etwa das 1,8-Fache, oder es braucht mehr Auslastung. Ein fester Grundbeitrag pro Mitglied für die Arbeit des Plattform-Teams wäre eine weitere Möglichkeit.
:::
::::
