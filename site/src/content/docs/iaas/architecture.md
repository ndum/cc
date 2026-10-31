---
title: Architektur von OpenNebula
description: Die Bausteine von OpenNebula auf Front-end und Knoten, die Objekte, mit denen du arbeitest, und die Wege, über die du auf die Cloud zugreifst.
sidebar:
  order: 1
---

:::assignment
«Bevor du installierst, will ich verstehen, was wir da betreiben», schreibt Simone Wyss. «Was läuft wo, und wer redet mit wem? Wenn nachts etwas ausfällt, muss das Plattform-Team das wissen.»
:::

:::goals
Nach diesem Kapitel kannst du

- die Bausteine von OpenNebula nennen und Front-end oder Knoten zuordnen,
- erklären, wie ein Auftrag von der Weboberfläche bis zur laufenden VM gelangt,
- die Objekte von OpenNebula unterscheiden,
- die drei Wege nennen, über die du OpenNebula bedienst.
:::

## Die Bausteine

OpenNebula besteht aus einem Front-end, das die Cloud verwaltet, und aus Knoten, auf denen die VMs laufen. Auf den Knoten läuft kein eigener Dienst von OpenNebula. Das Front-end steuert sie über SSH und kleine Treiberprogramme.

![Die Bausteine von OpenNebula. Drei Bereiche nebeneinander. Links greifen Sunstone, die CLI und OpenTofu über die API auf das Front-end zu. In der Mitte verwaltet oned auf dem Front-end alle Objekte, speichert sie in MariaDB, lässt den Scheduler Knoten wählen und erhält Zustände von onemonitord. Die Treiber für Hosts, VMs, Transfer, Netze und Datastores führen die Aufträge aus. Rechts arbeiten die Knoten mit libvirt und KVM, die Treiber erreichen sie über SSH.](../../../assets/figures/de/p2c1-architecture.svg)

Der Kern ist der Dienst `oned`. Er nimmt alle Aufträge über seine API entgegen, verwaltet den Zustand jedes Objekts und speichert ihn in einer Datenbank, im Kurs MariaDB. Der Scheduler ist ein Treiber von `oned` und wählt für jede neue VM einen Knoten mit genug freier Kapazität. `onemonitord` fragt regelmässig ab, wie es den Knoten und VMs geht.

Die eigentliche Arbeit erledigen Treiber, die `oned` für jede Art von Aufgabe aufruft:

| Treiber | Aufgabe | Im Lab |
|---|---|---|
| IM (Information Manager) | Zustand und Kapazität der Hosts erfassen | KVM-Knoten |
| VMM (Virtual Machine Manager) | VMs starten, stoppen und verschieben | libvirt mit KVM |
| TM (Transfer Manager) | Disks zum Knoten bringen und zurück | `ssh`, kopiert über SSH |
| VNM (Virtual Network Manager) | Netze auf den Knoten einrichten | `vxlan` ab Kapitel 2.3 |
| DS (Datastore) | Images speichern und verwalten | `fs` auf dem Front-end |

## Der Weg einer VM

Startest du in Sunstone eine VM, schickt Sunstone den Auftrag an die API von `oned`. `oned` legt die VM in der Datenbank an, und der Scheduler wählt einen Knoten. Der TM-Treiber kopiert das Image über SSH in den Datastore auf dem Knoten, der VNM-Treiber richtet dort das Netz ein, und der VMM-Treiber lässt libvirt die VM mit KVM starten. `onemonitord` meldet danach laufend ihren Zustand. In Kapitel 2.2 siehst du, welche Dienste und Ports dazu auf dem Front-end laufen.

## Die Objekte

In OpenNebula arbeitest du mit Objekten. Jedes hat eine Nummer, einen Namen, einen Besitzer, eine Gruppe und Rechte.

| Objekt | Bedeutung | CLI |
|---|---|---|
| Host | ein Knoten, auf dem VMs laufen | `onehost` |
| Cluster | eine Gruppe von Hosts mit ihren Netzen und Datastores | `onecluster` |
| Datastore | ein Speicherort für Images oder für die Disks laufender VMs | `onedatastore` |
| Image | eine Disk, aus der VMs starten | `oneimage` |
| Virtuelles Netz | ein Netz mit Adressbereich für die VMs | `onevnet` |
| Vorlage | die Beschreibung einer VM, aus der du VMs startest | `onetemplate` |
| VM | eine laufende oder gestoppte virtuelle Maschine | `onevm` |
| Benutzer und Gruppe | wer etwas darf und wem es gehört | `oneuser`, `onegroup` |

## Zugang

Auf OpenNebula greifst du auf drei Wegen zu, und alle drei sprechen mit derselben API von `oned`. Die Weboberfläche Sunstone eignet sich zum Erkunden und für die Mitglieder. Die CLI auf dem Front-end ist der schnellste Weg für das Plattform-Team und für Skripte. Die API selbst nutzen Werkzeuge wie OpenTofu, mit dem du ab Teil 4 VMs aus Code anlegst.

::::exercise[Einordnen]
Ordne die Bausteine `oned`, KVM, MariaDB, Scheduler, libvirt, Sunstone, `onemonitord` und den Datastore 0 mit den Disks laufender VMs dem Front-end oder den Knoten zu.

:::solution
Auf dem Front-end laufen `oned`, MariaDB, der Scheduler, Sunstone und `onemonitord`. Auf den Knoten laufen KVM und libvirt, und dort liegt auch der Datastore 0 mit den Disks der laufenden VMs, weil der Transfertreiber `ssh` sie dorthin kopiert.
:::
::::

::::exercise[Der Weg einer VM]
Beschreibe in fünf Schritten, was zwischen dem Klick auf «Erstellen» in Sunstone und der laufenden VM geschieht. Nenne bei jedem Schritt den beteiligten Baustein.

:::solution
1. Sunstone schickt den Auftrag an die API von `oned`.
2. `oned` legt die VM in MariaDB an.
3. Der Scheduler wählt einen Knoten mit genug Kapazität.
4. Der TM-Treiber kopiert das Image auf den Knoten, der VNM-Treiber richtet das Netz ein.
5. Der VMM-Treiber lässt libvirt die VM mit KVM starten, `onemonitord` meldet den Zustand.
:::
::::
