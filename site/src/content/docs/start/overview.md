---
title: Kursüberblick
description: Wie der Kurs aufgebaut ist, der Fall Wolkenwerk Bern, die vier Umsetzungsnachweise mit ihren zwei Abgaben und die Regeln für KI-Werkzeuge.
sidebar:
  order: 1
---

:::assignment
Simone Wyss schreibt dir an deinem ersten Tag. «Willkommen bei Wolkenwerk Bern. Die drei Server stehen im Rack, angeschlossen ist noch nichts. Unsere Mitglieder warten auf eine Cloud, der sie ihre Daten anvertrauen können. Du bist ab heute unser Plattform-Team.»
:::

:::goals
Nach diesem Kapitel kannst du

- erklären, wie der Kurs aufgebaut ist und wie du mit ihm lernst,
- die Mitglieder von Wolkenwerk Bern und ihre Anforderungen nennen,
- beschreiben, wie die vier Umsetzungsnachweise und die zwei Abgaben deine Note ergeben,
- KI-Werkzeuge im Kurs so einsetzen, wie es die Regeln verlangen.
:::

## So lernst du in diesem Kurs

Der Kurs ist für das Selbststudium gebaut. Im Unterricht gibt es kurze Inputs, den grössten Teil der Zeit arbeitest du in deinem eigenen Lab. Was du im Unterricht nicht fertig bringst, setzt du zu Hause fort. Dazu kommen einige Lektionen Selbststudium, vor allem für die Theorie in Teil 1 und Teil 6.

Jedes Kapitel beginnt mit einem Auftrag von Simone Wyss. Danach folgen die Lernziele, die Erklärung mit Abbildungen und Befehlen und am Ende Aufgaben in deinem Lab. Viele Kapitel haben ein Check-Skript, das dir sagt, ob dein Lab im erwarteten Zustand ist. Jeder Teil endet mit einer Seite, die seine Kompetenzen auflistet.

Der Kurs hat sieben Teile:

1. Teil 0 Start mit Lab und Werkzeugen
2. Teil 1 Cloud-Grundlagen
3. Teil 2 IaaS aufbauen mit OpenNebula
4. Teil 3 Mandanten und Self-Service
5. Teil 4 Plattform per Code mit OpenTofu, Kubernetes und GitOps
6. Teil 5 Observability, Skalierung und KI
7. Teil 6 Betrieb mit Sicherheit, Backup, SLA und Kosten

## Der Fall

Wolkenwerk Bern ist eine junge Genossenschaft. Kleine Organisationen aus der Region haben sie gegründet, weil sie eine Cloud wollen, deren Daten in der Schweiz und unter ihrer eigenen Kontrolle bleiben, zu einem Preis, den eine kleine Organisation zahlen kann. Die Genossenschaft und alle Personen sind erfunden.

Die ersten vier Mitglieder haben unterschiedliche Anforderungen. Die Praxis Rosenweg führt Patientendaten und untersteht dem Berufsgeheimnis. Die Treuhand Aaregg hat am Monatsende und in der Steuersaison viel mehr Last als sonst. Das Veloatelier Matte verkauft über einen Webshop, der an Frühlingssamstagen überläuft. Die Gemeinde Hinterbüel braucht verlässliche Schalterdienste und hat ein festes Budget. In Teil 6 kommt ein fünftes Mitglied dazu, das du selbst entwirfst.

## Die Zielarchitektur

Am Ende des Kurses betreibst du eine Cloud in vier Schichten. Zuunterst laufen deine drei Lab-VMs auf smartlearn. Auf ihnen stellt OpenNebula die Infrastruktur bereit, mit Mandanten, Quotas und einem internen Netz für die VMs deiner Mitglieder. Mit OpenTofu legst du darin zwei VMs an, auf denen der Kubernetes-Cluster k3s läuft. Auf diesem Cluster liegen die Dienste der Plattform. Argo CD rollt die Apps der Mitglieder aus einem Git-Repo aus, Prometheus und Loki überwachen alles, und Ollama bietet ein lokales Sprachmodell an, das bei Alerts eine Ursache und eine Aktion vorschlägt. Ganz oben nutzen die Mitglieder diese Cloud.

![Die Zielarchitektur des Kurses. Vier Schichten übereinander. Die Infrastruktur besteht aus dem Front-end und zwei Knoten mit Ubuntu auf smartlearn, eingerichtet mit prepare.sh. Darauf stellt OpenNebula die IaaS bereit, mit oned, Sunstone, Mandanten und Netzen, installiert mit Ansible und OneDeploy, die VMs laufen mit KVM auf den Knoten. Darüber läuft die Plattform k3s, von OpenTofu angelegt, mit Argo CD, dem Webshop, Ollama, der KI-Triage, Prometheus, Grafana und Loki, die Apps holt Argo CD aus einem Git-Repo. Zuoberst nutzen die Mitglieder von Wolkenwerk Bern die Cloud. Jede Schicht nennt die Teile des Kurses, die sie aufbauen.](../../../assets/figures/de/p0c1-architecture.svg)

Jeder Teil des Kurses baut eine Schicht auf oder erweitert sie. In der Kopfzeile jeder Schicht stehen die Teile, die sie aufbauen, und rechts das Werkzeug, mit dem sie entsteht. Das Vorbereitungsskript richtet die Lab-VMs ein, Ansible mit OneDeploy die IaaS, OpenTofu die VMs von k3s, und Argo CD holt die Apps aus einem Git-Repo.

## Leistungsbeurteilung

Deine Modulnote entsteht aus vier Umsetzungsnachweisen. UN1 und UN2 gibst du am Ende von Block 4 zusammen ab und erhältst dafür die erste Note. UN3 und UN4 gibst du am Ende von Block 6 ab, sie ergeben die zweite Note. Beide Noten zählen gleich viel. Block 7 gehört der Probeprüfung und ihrer Besprechung. Die Einzelheiten stehen unter [Leistungsbeurteilung](../../assessment/).

Jeder Nachweis ist eine Einzelarbeit. Du zeigst ihn entweder in einem Screencast von höchstens zehn Minuten oder live im Unterricht, und du gibst dazu dein Abgabe-Repo ab. Deine Umgebung trägt deine [persönlichen Parameter](../parameters/) wie Hostnamen und Netze. Deshalb sieht jedes Lab ein wenig anders aus, und eine kopierte Lösung fällt auf.

## KI-Werkzeuge

Du darfst KI-Assistenten verwenden, um Code, Konfigurationen und Skripte zu schreiben. Zwei Regeln gelten dabei. Erstens hältst du im README jedes Nachweises fest, wofür du einen KI-Assistenten eingesetzt hast. Zweitens musst du alles erklären können, was du abgibst. In der Vorführung fragt deine Lehrperson nach, und eine Lösung, die du nicht erklären kannst, zählt nicht als deine.

Im Kurs selbst läuft ab Teil 5 ein lokales Sprachmodell auf deiner Plattform. Dort lernst du, was ein kleines Modell im Betrieb leisten kann und wo es danebenliegt.

::::exercise[Einstieg]
Lies die Beschreibung der vier Mitglieder noch einmal. Schreibe für jedes Mitglied in einem Satz auf, was es von einer Cloud am dringendsten braucht.

:::solution
Die Praxis Rosenweg braucht eine strikte Trennung von den anderen Mitgliedern und Daten, die die Schweiz nicht verlassen. Die Treuhand Aaregg braucht Rechenleistung, die am Monatsende wächst und danach wieder sinkt. Das Veloatelier Matte braucht einen Webshop, der unter Last automatisch skaliert. Die Gemeinde Hinterbüel braucht verlässliche Dienste und eine Abrechnung, die ins Budget passt.
:::
::::
