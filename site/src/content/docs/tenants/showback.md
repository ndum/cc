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
Nach diesem Kapitel kannst du:

- Showback und Chargeback unterscheiden
- Preise pro Ressource in einer Vorlage hinterlegen
- Die Kosten der Mitglieder mit `oneshowback` berechnen und lesen
- Die Kosten einer VM pro Stunde und Monat selbst nachrechnen
- Mit einem einfachen Kostenmodell prüfen, ob die Preise die Kosten decken
:::

## Showback und Chargeback

Wer eine Cloud teilt, will wissen, wer wie viel davon braucht. Dafür gibt es zwei Wege. **Showback** zeigt jedem Bereich, was er verbraucht hat, ohne dass Geld fliesst. **Chargeback** belastet diesen Verbrauch dem Budget des Bereichs. Showback ist der erste Schritt, denn erst wenn die Zahlen stimmen und alle sie verstehen, lässt sich darauf eine Rechnung stellen. Ob eine Organisation danach Chargeback einführt, hängt von ihrer Buchhaltung ab.

Wolkenwerk Bern beginnt mit Showback. Die Mitglieder sehen ihre Kosten jeden Monat. Wie die Genossenschaft sie verrechnet, entscheidet der Vorstand später.

## Preise in der Vorlage

OpenNebula rechnet mit drei Preisen pro Stunde, die in der Vorlage stehen. `CPU_COST` gilt pro CPU der Vorlage, `MEMORY_COST` pro MB Arbeitsspeicher und `DISK_COST` pro MB Disk. Die Preise im Lab sind für den Fall erfunden und in Franken gedacht. Wie du die Preise einer Vorlage setzt, beschreibt die [Dokumentation zum Showback](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/#set-the-vm-cost). Die Vorlage `ubuntu` gehört `oneadmin`, deshalb trägst du die Preise als `oneadmin` ein, also ohne `ONE_AUTH`.

::code{file="lab/tenants/costs.tpl"}

```bash
onetemplate update ubuntu --append ~/cc/lab/tenants/costs.tpl
onetemplate show ubuntu | grep COST
```

Eine VM übernimmt die Preise beim Start aus der Vorlage. VMs, die schon vorher gestartet wurden, kosten deshalb nichts. Auch ein Neustart mit `onevm reboot` ändert daran nichts. Im Lab beendest du darum `praxis-1` als `praxis-admin` und startest sie unter demselben Namen aus der Vorlage neu. Die alte VM zählt gegen die Quota der Praxis, bis sie ganz gelöscht ist. Das dauert einige Sekunden. Prüfe deshalb mit `onevm list`, dass `praxis-1` aus der Liste verschwunden ist, bevor du sie neu startest.

```bash
ONE_AUTH=~/cc-lab/tenants/praxis.auth onevm terminate praxis-1
ONE_AUTH=~/cc-lab/tenants/praxis.auth onevm list
```

Fehlt `praxis-1` in der Liste, startest du sie neu. Ausserdem startet die Treuhand ihre erste VM `treuhand-1`, damit auch ein zweites Mitglied Kosten hat.

```bash
ONE_AUTH=~/cc-lab/tenants/praxis.auth onetemplate instantiate ubuntu --name praxis-1
ONE_AUTH=~/cc-lab/tenants/treuhand.auth onetemplate instantiate ubuntu --name treuhand-1
```

## Kosten berechnen

`oneshowback calculate` berechnet die Kosten aller VMs aus ihrer Laufzeit und legt sie pro Monat ab. OpenNebula bringt dafür den Timer `opennebula-showback.timer` mit, der die Berechnung jeden Tag startet. Für die Übungen startest du sie selbst, damit du nicht bis Mitternacht warten musst. `oneshowback list` zeigt danach pro VM Besitzer, Gruppe, Monat, Stunden, Laufzeit und Kosten. Mit `-g` siehst du nur ein Mitglied. Wie du einzelne Monate berechnest und abrufst, beschreibt die [Anleitung zu den Monatsberichten](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/#calculate-monthly-reports). Laut der Anleitung läuft die Berechnung als `oneadmin`, deshalb startest du auch diesen Block ohne `ONE_AUTH`.

```bash
oneshowback calculate
oneshowback list
oneshowback list -g treuhand
oneshowback list --csv > ~/cc-lab/showback.csv
```

Die Berechnung lässt sich jederzeit wiederholen, den laufenden Monat rechnet OpenNebula dabei bis heute. Für den Check und den Screenshot von Meilenstein 1 genügen einige Minuten Laufzeit. Im Lab zeigte `oneshowback list` nach gut zehn Minuten für `praxis-1` und `treuhand-1` je `0.01`. Die Beträge im Bild unten und in der Lösung der Aufgabe stammen aus einer Berechnung nach rund einer Stunde. Willst du sie selbst sehen, berechnest du den Showback später nochmals, etwa während du an Kapitel 3.4 arbeitest.

Ein Gruppenadmin sieht mit `oneshowback list` nur die VMs seiner Gruppe. Jedes Mitglied kann also seine eigenen Kosten prüfen, ohne die der anderen zu sehen.

Sunstone zeigt die Kosten im Reiter «Showback» einer Gruppe.

![Der Reiter Showback der Gruppe praxis in Sunstone. Oben stehen die Kosten pro Monat, unten die Kosten und Stunden jeder VM. Das Lab lief erst rund eine Stunde mit Preisen, deshalb sind die Beträge klein. Die VM praxis-1 hat in dieser Stunde 0,05 Franken gekostet, das passt zur Rechnung im nächsten Abschnitt.](../../../assets/screenshots/sunstone-showback.png)

## Die Kosten einer VM

Eine VM aus der Vorlage `ubuntu` hat 0,5 CPU, 1024 MB Arbeitsspeicher und eine Disk von 3584 MB. Pro Stunde kostet sie

```text
0.5 × 0.05 + 1024 × 0.00002 + 3584 × 0.000001 = 0.025 + 0.0205 + 0.0036 ≈ 0.049
```

Über 30 Tage mit 720 Stunden sind das rund 35 Franken. Die Kosten richten sich nach der Zeit, in der eine VM auf einem Host Ressourcen belegt. Eine VM, die mit `onevm poweroff` ausgeschaltet ist, kostet deshalb weiter. Erst `onevm undeploy` nimmt sie vom Host, dann kostet sie in diesem Modell nichts mehr. Für die Mitglieder lohnt es sich, VMs, die sie länger nicht brauchen, so vom Host zu nehmen.

![Die Berechnung des Showbacks. Links oben liefert das Accounting von OpenNebula die Laufzeit der VM treuhand-1, 720 Stunden in einem Monat. Daneben stehen die Preise pro Stunde aus der Vorlage ubuntu. oneshowback calculate rechnet daraus CPU-Stunden, MB-Stunden des Arbeitsspeichers und MB-Stunden der Disk und multipliziert sie mit CPU_COST, MEMORY_COST und DISK_COST. Das ergibt 18.00, 14.75 und 2.58 Franken, zusammen 35.33 Franken für die VM im Monat. Rechts unten listet oneshowback list -g treuhand die Kosten jeder VM der Gruppe, zusammen ergeben sie den Showback des Mitglieds. Ein Gruppenadmin sieht dabei nur die VMs seiner Gruppe. Achte darauf, dass jede Zeile mit denselben 720 Stunden rechnet, der Zeit, in der die VM Ressourcen auf einem Host belegt.](../../../assets/figures/de/p3c3-showback.svg)

Am Ende müssen die Preise die Kosten der Genossenschaft decken. Dazu gehören die Hardware über ihre Lebensdauer, Strom, Lizenzen, Backup und die Arbeit des Plattform-Teams, aber auch die Reserve für Wartung aus Kapitel 2.5. Ein einfacher Ansatz teilt die jährlichen Kosten durch die Kapazität, die sich im Jahr verkaufen lässt. Kapitel 6.4 rechnet mit allen Kosten, in Zusatzauftrag C von Meilenstein 4 auch für ein eigenes Mitglied. Wie weit die Preise die Kosten der Genossenschaft decken, berechnest du im [Zusatzauftrag B](../advanced/#showback-als-bericht-auftrag-b) aus einem monatlichen Bericht.

::::exercise[Lab]
Trage die Preise in die Vorlage ein. Beende als `praxis-admin` die VM `praxis-1` und starte sie unter demselben Namen aus der Vorlage neu. Starte ausserdem als `treuhand-admin` die VM `treuhand-1`. Berechne den Showback nach einigen Minuten und exportiere die Liste als CSV nach `~/cc-lab/showback.csv`. Halte die Ausgabe von `oneshowback list` und `cat ~/cc-lab/showback.csv` für Anforderung 7 von Meilenstein 1 in `7-showback.png` fest und kopiere das Bild wie in [Kapitel 3.1](../groups/) in den Ordner `m1/` deines Abgabe-Repos. Nach etwa einer Stunde kannst du den Showback nochmals berechnen und die Beträge mit der Lösung vergleichen. In der Zwischenzeit arbeitest du an Kapitel 3.4 weiter.

:::solution
`onetemplate show ubuntu` zeigt die drei Preise `CPU_COST`, `MEMORY_COST` sowie `DISK_COST`. Nach einigen Minuten zeigt `oneshowback list` für die neuen VMs kleine Beträge, im Lab nach gut zehn Minuten je `0.01`. Nach rund einer Stunde listet es die neuen VMs mit rund einer Stunde und Kosten um `0.05`. Die alten VMs ohne Preise stehen mit Kosten 0 in der Liste.
:::
::::

::::exercise[Kostenmodell]
Die beiden Knoten haben zusammen 7’000 Franken gekostet und laufen fünf Jahre. Strom, Backup und Arbeit kosten im Jahr 6’000 Franken. Im Mittel laufen 10 VMs aus der Vorlage `ubuntu`. Decken die Preise des Labs die Kosten? Was würdest du dem Vorstand vorschlagen?

:::solution
Die Kosten pro Jahr betragen 7’000 / 5 + 6’000 = 7’400 Franken. 10 VMs zu je 35 Franken im Monat bringen 4’200 Franken im Jahr. Die Preise decken also nur gut die Hälfte. Entweder steigen die Preise auf etwa das 1,8-Fache, oder es braucht mehr Auslastung. Möglich wäre auch ein fester Grundbeitrag pro Mitglied für die Arbeit des Plattform-Teams.
:::
::::
