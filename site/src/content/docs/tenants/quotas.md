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
Nach diesem Kapitel kannst du:

- Erklären, wozu eine Cloud Quotas braucht
- Die Arten von Quotas in OpenNebula unterscheiden
- Quotas für Gruppen setzen und ihre Nutzung lesen
- Beschreiben, was an der Grenze einer Quota geschieht
:::

## Der Zweck von Quotas

In einer Cloud teilen sich mehrere Mandanten dieselben Knoten. Ohne Grenze könnte ein Mitglied alle Knoten füllen, die anderen bekämen dann keine VM mehr. Eine Quota legt fest, wie viele Ressourcen eine Gruppe oder ein Benutzer höchstens belegen darf.

Die Quota schützt die anderen Mitglieder vor einem lauten Nachbarn, englisch Noisy Neighbor. Gemeint ist ein Mandant, der mit vielen oder grossen VMs den Platz belegt, den andere ebenfalls brauchen. Ausserdem teilt die Quota die Kapazität fair auf. Jedes Mitglied bekommt den Anteil, den es mit der Genossenschaft vereinbart hat, auch wenn ein anderes gerade viel mehr möchte. Sie macht auch die Kosten für beide Seiten planbar. Ein Mitglied weiss im Voraus, wie viel es höchstens belegen kann. Seine Showback-Rechnung aus Kapitel 3.3 fällt deshalb nie höher aus als die Kosten der vollen Quota über den ganzen Monat. Darauf ist die Gemeinde mit ihrem festen Budget angewiesen. Das Plattform-Team wiederum weiss, wie viel Hardware es braucht, um alle Zusagen gleichzeitig einzuhalten.

## Arten von Quotas

`onegroup show` listet für jede Gruppe vier Arten von Quotas mit Nutzung und Grenze.

| Art | Begrenzt | Beispiel |
|---|---|---|
| VM | Anzahl VMs, CPU, Arbeitsspeicher und Grösse der Disks, auch nur für laufende VMs | höchstens 2 VMs mit zusammen 2048 MB |
| Datastore | Anzahl und Grösse der Images in einem Datastore | höchstens 20 GB eigene Images |
| Netz | Anzahl Adressen aus einem Netz | höchstens 5 Adressen aus `cc-net` |
| Image | wie viele laufende VMs ein Image gleichzeitig nutzen | |

Die Grenzen der VM-Quota heissen in der Datei einer Quota `VMS` für die Zahl der VMs, `CPU` für die CPU, `MEMORY` für den Arbeitsspeicher und `SYSTEM_DISK_SIZE` für die Disks, die beiden letzten in MB. `SYSTEM_DISK_SIZE` zählt die Disks, die auf dem System-Datastore der Knoten liegen, also flüchtige und nicht persistente Disks samt ihren Snapshots. Zu jeder dieser Grenzen gibt es eine Variante mit `RUNNING_`, etwa `RUNNING_VMS` oder `RUNNING_MEMORY`. Sie zählt nur VMs, die aktiv sind, auf einen Knoten warten oder zurückgehalten werden. Eine ausgeschaltete VM belegt dann keinen Platz mehr in `RUNNING_MEMORY`, wohl aber weiterhin in `MEMORY`. Die anderen Arten haben eigene Namen. Die Datastore-Quota begrenzt mit `SIZE` die Grösse und mit `IMAGES` die Zahl der Images. Die Netz-Quota zählt mit `LEASES` die Adressen, die Image-Quota mit `RVMS` die laufenden VMs, die ein Image gleichzeitig nutzen.

In OpenNebula 7.4 lässt sich eine VM-Quota mit `CLUSTER_IDS` auf einzelne Cluster beschränken. Ohne diese Angabe gilt sie für die ganze Cloud, deshalb steht in `onegroup show` die Spalte `CLUSTERS` leer. Alle Attribute beschreibt die [Dokumentation zu den Quotas](https://docs.opennebula.io/7.4/product/cloud_system_administration/capacity_planning/quotas/).

## Ebenen und Standardwerte

Quotas gibt es auf zwei Ebenen. Eine Gruppenquota begrenzt, was alle Benutzer einer Gruppe zusammen belegen, also das ganze Mitglied. Eine Benutzerquota begrenzt einen einzelnen Benutzer innerhalb seiner Gruppe. Ein neuer Auftrag muss beide Grenzen einhalten. Die Praxis kann ihrer MPA zum Beispiel eine einzige VM erlauben, während die Gruppe als Ganzes bei zwei VMs bleibt.

Wer eine Quota setzen darf, hängt von den Rechten ab. Für eine Gruppenquota braucht es das Recht `ADMIN` auf die Gruppe, das ohne weitere ACL nur `oneadmin` hat. Für eine Benutzerquota genügt `MANAGE` auf den Benutzer, deshalb kann ein Gruppenadmin die Benutzer seiner eigenen Gruppe begrenzen. Das Plattform-Team verteilt die Kapazität also auf die Mitglieder. Jedes Mitglied teilt seinen Anteil selbst unter seinen Benutzern auf.

Für alle Gruppen und Benutzer ohne eigene Grenze gelten Standardquotas. `onegroup defaultquota` und `oneuser defaultquota` legen sie fest, ab Werk sind sie unbegrenzt. In der Datei einer Quota steht `-1` für den Standardwert und `-2` für unbegrenzt. In der Ausgabe von `onegroup show` heisst ein Strich, dass keine Grenze gesetzt ist. Für Quotas einzelner Cluster gelten die Standardwerte nicht, die setzt das Plattform-Team von Hand.

## Die Quotas der Mitglieder

Die Mitglieder zahlen und brauchen unterschiedlich viel. Die Treuhand bekommt mehr Platz als die anderen, weil sie Ende Monat mehr braucht. Lässt du ihren Dienst im [Zusatzauftrag A](../advanced/#auftrag-a--elastizität-mit-oneflow) wachsen, zählt jede seiner VMs gegen diese Quota.

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

Die CPU der Quota zählt wie `CPU` in der Vorlage. Eine VM aus der Vorlage `ubuntu` braucht 0,5 davon. Die Praxis bekommt 1,5 CPU, damit in Kapitel 3.4 eine VM aus Sunstone neben `praxis-1` Platz hat. Sunstone setzt die CPU einer neuen VM nämlich auf die Zahl ihrer virtuellen CPUs, also auf 1.

Für Meilenstein 1 bekommt die Gemeinde die Quota aus deinen [persönlichen Werten](../../start/parameters/). Kopiere dafür das Skript, ändere die Zeile der Gemeinde und führe die Kopie aus. Die anderen Mitglieder behalten die Werte der Tabelle.

```bash
cp ~/cc/lab/tenants/set-quotas.sh ~/cc-lab/set-quotas.sh
nano ~/cc-lab/set-quotas.sh
~/cc-lab/set-quotas.sh
```

## An der Grenze

OpenNebula prüft die Quota, bevor es eine VM anlegt. Ist sie erschöpft, lehnt es den Auftrag sofort ab und legt keine VM an. Im Lab kam beim Start der dritten VM der Praxis diese Meldung:

```text
[one.template.instantiate] User [2] : group [100] limit of 2 reached for VMS quota in VM.
```

Die Meldung nennt den Benutzer, die Gruppe, die Grenze und welche Quota erreicht ist. Das Mitglied löscht dann eine VM oder bittet das Plattform-Team um eine grössere Quota. Eine Quota greift nur bei neuen Aufträgen. Senkt das Plattform-Team sie unter die aktuelle Nutzung, laufen die VMs weiter, aber es kommen keine neuen dazu.

## Quota und Überbuchung

Eine Quota begrenzt, wie viel ein Mandant reservieren darf. Ob die Hardware diese Reservationen auch trägt, sagt sie nicht. Überbuchung heisst, dass auf einem Knoten mehr reserviert ist, als er hat. In Kapitel 2.5 erlaubt ein negativer Wert für `RESERVED_CPU` oder `RESERVED_MEM` genau das. Auch die Quotas selbst lassen sich überbuchen. Die Summe aller Quotas darf grösser sein als die Cloud. Das geht gut, solange nicht alle Mitglieder ihre Quota gleichzeitig ausschöpfen.

Bei der CPU ist Überbuchung wenig riskant. Teilen sich mehrere virtuelle CPUs einen Kern, verteilt der Hypervisor die Rechenzeit. Alle VMs werden langsamer, laufen aber weiter. Die Vorlage `ubuntu` überbucht bereits im Kleinen. Sie gibt der VM mit `VCPU = 1` einen ganzen virtuellen Kern, reserviert mit `CPU = 0.5` aber nur einen halben. Beim Arbeitsspeicher fehlt dieser Spielraum. Brauchen die VMs zusammen mehr Speicher, als der Knoten hat, muss der Host auslagern oder Prozesse beenden. Dabei kann auch eine VM abstürzen. Deshalb überbucht man die CPU eher als den Arbeitsspeicher. Die Summe der Speicherquotas sollte zur Kapazität der Knoten passen.

Eine Quota begrenzt ausserdem nur, wie viel reserviert ist. Wie stark eine VM ihre CPU tatsächlich auslastet, regelt sie nicht. Auf einem überbuchten Knoten kann eine VM unter Volllast die anderen deshalb trotz Quota bremsen. Gegen diese Form des lauten Nachbarn hilft vor allem weniger Überbuchung oder ein eigener Knoten.

![Quota, Reservierung und Nutzung. Die Gruppe praxis hat die Werte des Kurses und die VMs praxis-1 und praxis-2 aus der Vorlage ubuntu. Bei der CPU erlaubt die Quota 1,5. Auf den Knoten reservieren die VMs 1,0, je 0,5 pro VM. Unter Last nutzen sie bis 2,0, weil jede VM eine ganze virtuelle CPU hat. Beim Arbeitsspeicher erlaubt die Quota 2048 MB. Die beiden VMs reservieren mit je 1024 MB genau so viel und nutzen höchstens so viel, im Leerlauf weniger. Achte darauf, dass die Quota nur zählt, was reserviert ist. Wie stark die VMs ihre CPU auslasten, begrenzt sie nicht. Mit 2 von 2 VMs lehnt OpenNebula eine dritte VM ab.](../../../assets/figures/de/p3c2-quota.svg)

## Quotas in Kubernetes

In Teil 4 begegnest du derselben Idee wieder. Eine [ResourceQuota](https://kubernetes.io/docs/concepts/policy/resource-quotas/) begrenzt, was alle Pods eines Namespaces zusammen an CPU und Arbeitsspeicher anfordern dürfen, so wie eine Gruppenquota alle VMs einer Gruppe begrenzt. Der Namespace übernimmt dort die Rolle der Gruppe. Auch Kubernetes unterscheidet zwei Werte. Die Requests sind reserviert, die Limits legen fest, wie viel ein Container höchstens nutzen darf. Welche Quota jedes Mitglied im Cluster bekommt, zeigt [Kapitel 4.5](../../platform/templates/).

::::exercise[Lab]
Setze die Quotas der vier Mitglieder. Starte als `praxis-admin` neben `praxis-1` aus Kapitel 3.1 die VM `praxis-2` und danach eine dritte VM `praxis-3`. Notiere die Meldung und zeige mit `onegroup show praxis` die Nutzung.

:::solution
`set-quotas.sh` meldet die Werte aller vier Mitglieder. `praxis-2` startet, die dritte VM scheitert mit «limit of 2 reached for VMS quota in VM». `onegroup show praxis` zeigt bei den VMs `2 / 2`, beim Arbeitsspeicher `2G / 2G` und bei der CPU `1 / 1.5`.
:::
::::

::::exercise[Quota planen]
Das Veloatelier möchte für den Samstag eine VM mit 2 CPU und 2048 MB Arbeitsspeicher aus einer eigenen Vorlage. Passt das in seine Quota? Welche Quota würdest du vorschlagen? Was bedeutet das für die anderen Mitglieder?

:::solution
Nein, die Quota des Veloateliers erlaubt nur 1 CPU. Für diese VM und eine kleine daneben bräuchte es mindestens 2,5 CPU und 3072 MB. Die Quotas aller Mitglieder ergäben dann zusammen 7 CPU und 11 GB. Beide Knoten zusammen tragen das, ein einzelner Knoten während der Wartung aber nicht mehr. Vertretbar ist das, solange die Samstage des Veloateliers nicht mit dem Monatsende der Treuhand zusammenfallen. Die grössere Quota gehört ausserdem in die Kostenrechnung.
:::
::::

::::exercise[Quota und Last]
Am Monatsende lastet die Treuhand ihre VMs voll aus. Die Praxis meldet, ihre VM reagiere träge, obwohl sie ihre Quota nicht ausschöpft und die Treuhand innerhalb ihrer Quota bleibt. Erkläre, wie das trotz Quotas geschehen kann. Schlage zwei Massnahmen vor.

:::solution
Die Quotas begrenzen nur, wie viel CPU die Mitglieder reservieren. Die VMs aus `ubuntu` reservieren 0,5 CPU, haben aber je eine ganze virtuelle CPU. Ein Knoten mit vier Kernen nimmt so bis zu acht solche VMs auf, seine CPU ist also überbucht. Arbeiten die VMs der Treuhand unter Volllast, teilen sie sich die Kerne mit der VM der Praxis. Dadurch werden alle langsamer. Das Plattform-Team kann die Überbuchung senken, etwa mit `CPU = 1` in den Vorlagen der Treuhand oder ohne negatives `RESERVED_CPU`. Es kann die VMs der Treuhand auch auf einen anderen Knoten verschieben. Eine kleinere Quota der Treuhand löst das Problem nicht zuverlässig, weil schon wenige VMs unter Volllast den Knoten bremsen.
:::
::::
