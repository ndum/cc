---
title: Kompetenzraster für Teil 2
description: Was du nach Teil 2 kannst und wie du es selbst prüfst.
sidebar:
  label: Kompetenzraster
  order: 6
---

Mit diesem Raster schätzt du ein, ob deine IaaS steht und du sie verstehst. Lies jede Zeile und löse die Prüfaufgabe daneben, ohne nachzuschauen. Fällt sie dir leicht, hast du das Ziel erreicht. Wenn nicht, führt dich der Link in der letzten Spalte zur passenden Stelle. Teil 2 dient im Rahmenlehrplan vor allem den Kompetenzen B12.1 (Systemarchitektur), B12.2 (Netzarchitektur), B12.3 (Soll-Konfigurationen) und B14.2 (Überwachung im Betrieb).

| Ich kann … | Prüfaufgabe | Nachschlagen |
|---|---|---|
| die Bausteine von OpenNebula Front-end und Knoten zuordnen | Zeichne die Bausteine mit den Treibern und den Wegen zwischen ihnen. | [Architektur](../architecture/#die-bausteine) |
| den Weg einer VM vom Auftrag bis zum Start beschreiben | Erkläre die fünf Schritte mit dem beteiligten Baustein. | [Architektur](../architecture/#der-weg-einer-vm) |
| Ansible und OneDeploy erklären und OpenNebula installieren | Zeige `onehost list` mit zwei Knoten `on` und erkläre, was ein zweiter Lauf von OneDeploy ändern würde. | [Installation](../installation/) |
| die installierten Dienste und ihre Ports zuordnen | Ordne drei Ports aus `sudo ss -ltnp` einem Dienst zu. | [Installation](../installation/#die-installierten-dienste) |
| das interne Netz anlegen und VXLAN erklären | Erkläre, warum die VMs MTU 1450 haben und wie das Gateway zum Netz gehört. | [Virtuelle Netze](../networks/#vxlan) |
| eine Vorlage lesen und anpassen | Erkläre `CPU`, `VCPU` und `CPU_MODEL` in der Vorlage `ubuntu`. | [Images, Vorlagen und Kontext](../images/#vorlagen) |
| die Kontextualisierung erklären | Nenne vier Angaben im Kontext und ihre Wirkung in der VM. | [Images, Vorlagen und Kontext](../images/#kontextualisierung) |
| eine VM starten und prüfen | Starte eine VM, melde dich per SSH an und zeige den Bericht des Checks `iaas`. | [Images, Vorlagen und Kontext](../images/#deine-erste-vm) |
| reale und zugeteilte Kapazität unterscheiden | Lies in `onehost show` beide Werte ab und erkläre den Unterschied. | [Hosts betreiben](../hosts/#kapazität-und-überbuchung) |
| einen Knoten für die Wartung leeren | Zeige die Befehle für Wartung und Rückkehr eines Knotens. | [Hosts betreiben](../hosts/#wartung-eines-knotens) |
| die Folgen eines Knotenausfalls im Lab erklären | Begründe, warum die VMs eines ausgefallenen Knotens nicht anderswo starten. | [Hosts betreiben](../hosts/#ausfall-eines-knotens) |

In Teil 3 teilst du diese Cloud unter den Mitgliedern auf und schliesst damit Meilenstein 1 ab.
