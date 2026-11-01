---
title: Kompetenzraster für Teil 4
description: Was du nach Teil 4 kannst und wie du es selbst prüfst.
sidebar:
  label: Kompetenzraster
  order: 6
---

Mit diesem Raster schätzt du ein, ob du deine Plattform aus Code bauen und erklären kannst. Lies jede Zeile und löse die Prüfaufgabe daneben, ohne nachzuschauen. Fällt sie dir leicht, hast du das Ziel erreicht. Wenn nicht, führt dich der Link in der letzten Spalte zur passenden Stelle. Teil 4 dient im Rahmenlehrplan vor allem den Kompetenzen B12.3 (Soll-Konfigurationen), B12.4 (Konfigurationsmanagement) und B14.1 (Einführung von Software und Releases) und bereitet mit dem Webshop Teil 5 vor.

| Ich kann … | Prüfaufgabe | Nachschlagen |
|---|---|---|
| deklarative und imperative Beschreibungen unterscheiden | Erkläre an `onetemplate instantiate` und einem Block von OpenTofu, was ein zweiter Lauf bewirkt. | [Infrastructure as Code](../iac/#deklarativ-und-imperativ) |
| State, Drift und Idempotenz erklären | Erkläre, warum der State nicht in Git gehört und was ohne ihn passiert. | [Infrastructure as Code](../iac/#state) |
| VMs mit OpenTofu verwalten | Baue die beiden VMs des Clusters mit `tofu destroy` und `tofu apply` neu und zeige einen Plan ohne Änderungen. | [OpenTofu mit OpenNebula](../opentofu/#ändern-ersetzen-und-neu-bauen) |
| den Platzbedarf des Clusters begründen | Rechne vor, warum neben dem Cluster auf jedem Knoten nur noch eine kleine VM Platz hat. | [OpenTofu mit OpenNebula](../opentofu/#platz-auf-den-knoten) |
| einen Kubernetes-Cluster aus Code aufsetzen | Erkläre, wie das Startskript k3s auf Server und Agent installiert. | [Kubernetes per Code](../kubernetes/#das-startskript) |
| Adressbereiche und Routing des Clusters begründen | Begründe die Bereiche `10.52.0.0/16` und `10.53.0.0/16` und das Routing host-gw. | [Kubernetes per Code](../kubernetes/#adressbereiche) |
| GitOps erklären | Nenne die vier Prinzipien und den Unterschied zum Ausrollen mit einer Pipeline. | [GitOps mit Argo CD](../gitops/#gitops) |
| eine Anwendung mit Argo CD ausrollen | Ändere die Zahl der Pods des Webshops über Git und zeige Self-Heal. | [GitOps mit Argo CD](../gitops/#abgleich-zeigen) |
| begründen, wo der Git-Server läuft | Erkläre, warum Gitea auf dem Front-end und nicht im Cluster läuft. | [GitOps mit Argo CD](../gitops/#gitea-auf-dem-front-end) |
| Namespaces mit einer Vorlage begrenzen und trennen | Zeige die Quota der Gemeinde an ihrer Grenze und die Trennung durch die NetworkPolicy. | [Plattform-Vorlagen](../templates/#an-der-grenze) |
| einen Antrag als Pull Request bearbeiten | Lege ein Mitglied per Pull Request an und erkläre, worauf du beim Prüfen achtest. | [Plattform-Vorlagen](../templates/#der-antrag-der-gemeinde) |

Mit diesem Teil schliesst du den [Umsetzungsnachweis UN2](../../assessment/un2/) ab. UN1 und UN2 gibst du zusammen am Ende von Block 4 ab. In Teil 5 beobachtest du den Webshop, lässt ihn unter Last wachsen und betreibst ein lokales Sprachmodell.
