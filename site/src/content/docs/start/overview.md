---
title: Kursüberblick
description: Wie der Kurs aufgebaut ist, der Fall Wolkenwerk Bern, die vier Meilensteine mit ihren zwei Abgaben und die Regeln für KI-Werkzeuge.
sidebar:
  order: 1
---

:::assignment
Simone Wyss schreibt dir an deinem ersten Tag. «Willkommen bei Wolkenwerk Bern. Die drei Server stehen im Rack, angeschlossen ist noch nichts. Unsere Mitglieder warten auf eine Cloud, der sie ihre Daten anvertrauen können. Du bist ab heute unser Plattform-Team.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Beschreiben, was du in diesem Modul aufbaust und lernst
- Erklären, wie der Kurs aufgebaut ist und wie du mit ihm lernst
- Die Mitglieder von Wolkenwerk Bern und ihre Anforderungen nennen
- Beschreiben, wie Basis und Zusatzaufträge der vier Meilensteine deine Note ergeben
- KI-Werkzeuge im Kurs so einsetzen, wie es die Regeln verlangen
:::

## Das Modul im Überblick

In diesem Modul baust du in deinem eigenen Lab eine kleine Cloud auf und betreibst sie wie ein Plattform-Team. Du beginnst mit drei leeren Ubuntu-Servern. Am Ende laufen auf ihnen die Apps von fünf Mitgliedern, mit Monitoring, Backups und einem Preis für jedes Mitglied. Die Theorie zu Cloud Computing steht jeweils in dem Kapitel, in dem du sie im Lab brauchst.

| Teil | Das machst du | Ergebnis |
|---|---|---|
| 0 Start | Du lernst den Fall kennen, erzeugst deine persönlichen Parameter und bereitest vom Client aus die drei Server und deine Werkzeuge vor. | vorbereitete Server und ein Abgabe-Repo |
| 1 Cloud-Grundlagen | Du lernst die Merkmale einer Cloud, die Service- und Bereitstellungsmodelle, die Regeln zu Datenschutz und Souveränität und die Virtualisierung mit KVM kennen. | Schutzbedarf der Mitglieder und geprüfte Virtualisierung auf den Knoten |
| 2 IaaS aufbauen | Du installierst OpenNebula mit Ansible, nimmst die Knoten als Hosts in Betrieb, legst Netze, Images und Vorlagen an und startest erste VMs. | eine laufende IaaS-Cloud |
| 3 Mandanten und Self-Service | Du teilst die Cloud in Gruppen mit Quotas auf, rechnest den Verbrauch mit Showback ab, gibst den Mitgliedern Self-Service und lässt einen Dienst mit OneFlow wachsen. | vier Mitglieder mit eigenen Ressourcen, Meilenstein 1 |
| 4 Plattform per Code | Du legst mit OpenTofu einen Kubernetes-Cluster an, rollst den Webshop mit Argo CD aus Git aus und gibst den Mitgliedern Namespaces aus einer Vorlage. | eine Plattform, die du aus Code neu bauen kannst, Meilenstein 2 |
| 5 Observability, Skalierung und KI | Du überwachst alles mit Prometheus, Grafana und Loki, legst ein SLO fest und lässt den Webshop automatisch skalieren. In den Zusatzaufträgen betreibst du ein lokales Sprachmodell, das Alerts einordnet. | eine überwachte Plattform, Meilenstein 3 mit dem lokalen Sprachmodell in den Zusatzaufträgen |
| 6 Betrieb | Du härtest die Plattform, sicherst und stellst wieder her, schreibst ein SLA, rechnest die Kosten und bringst ein eigenes, fünftes Mitglied in Betrieb. | eine betriebsbereite Cloud, Meilenstein 4 |

Mit jedem Teil kommt eine Schicht der [Zielarchitektur](#die-zielarchitektur) dazu. Die Meilensteine schliessen die Teile 3, 4, 5 und 6 ab. Aus ihnen entsteht deine Note.

## So lernst du in diesem Kurs

Der Kurs ist für das Selbststudium gebaut. Im Unterricht gibt es kurze Inputs, den grössten Teil der Zeit arbeitest du in deinem eigenen Lab. Was du im Unterricht nicht fertig bringst, setzt du zu Hause fort. Wie Unterricht und Selbststudium verteilt sind, legt deine Dozentin oder dein Dozent fest.

Jedes Kapitel beginnt mit einem Auftrag von Simone Wyss. Danach folgen die Lernziele, die Erklärung mit Abbildungen und Befehlen und am Ende Aufgaben in deinem Lab. Viele Kapitel haben ein Check-Skript, das dir sagt, ob dein Lab im erwarteten Zustand ist. Jeder Teil endet mit einer Seite, die seine Kompetenzen auflistet.

## Der Fall

Wolkenwerk Bern ist eine junge Genossenschaft. Kleine Organisationen aus der Region haben sie gegründet, weil sie eine Cloud wollen, deren Daten in der Schweiz und unter ihrer eigenen Kontrolle bleiben, zu einem Preis, den eine kleine Organisation zahlen kann. Die Genossenschaft und alle Personen sind erfunden.

Die ersten vier Mitglieder haben unterschiedliche Anforderungen. Die Praxis Rosenweg führt Patientendaten und untersteht dem Berufsgeheimnis. Die Treuhand Aaregg hat am Monatsende und in der Steuersaison viel mehr Last als sonst. Das Veloatelier Matte verkauft über einen Webshop, der an Frühlingssamstagen überläuft. Die Gemeinde Hinterbüel braucht verlässliche Schalterdienste und hat ein festes Budget. In Teil 6 kommt ein fünftes Mitglied dazu, das du selbst entwirfst.

## Die Zielarchitektur

Am Ende des Kurses betreibst du eine Cloud in vier Schichten. Zuunterst laufen deine drei Server auf smartlearn. Auf ihnen stellt OpenNebula die Infrastruktur bereit, mit Mandanten, Quotas und einem internen Netz für die VMs deiner Mitglieder. Mit OpenTofu legst du darin zwei VMs an, auf denen der Kubernetes-Cluster k3s läuft. Auf diesem Cluster laufen die Dienste der Plattform. Argo CD rollt die Apps der Mitglieder aus einem Git-Repo aus. Prometheus und Loki überwachen alles. In den Zusatzaufträgen kommt ein lokales Sprachmodell dazu, das bei Alerts eine Ursache und eine Aktion vorschlägt. Ganz oben nutzen die Mitglieder diese Cloud. Den Client zeigt die Abbildung nicht, weil er nicht zur Cloud gehört. Von ihm aus arbeitest du auf allen Schichten.

![Die Zielarchitektur des Kurses. Vier Schichten übereinander. Die Infrastruktur besteht aus dem Front-end und zwei Knoten mit Ubuntu auf smartlearn oder einem eigenen Hypervisor, eingerichtet mit prepare.sh. Darauf stellt OpenNebula die IaaS bereit, mit oned, Sunstone, Mandanten und Netzen, installiert mit Ansible und OneDeploy, die VMs laufen mit KVM auf den Knoten. Darüber läuft die Plattform k3s, von OpenTofu angelegt, mit Argo CD, Prometheus, Grafana, Loki, dem Webshop, Ollama und der KI-Triage. Die Apps holt Argo CD aus einem Git-Repo. Ollama und die KI-Triage sind mit «Zusatz» markiert, weil du sie in den Zusatzaufträgen von Teil 5 baust. Zuoberst nutzen die Mitglieder von Wolkenwerk Bern die Cloud. Jede Schicht nennt die Teile des Kurses, die sie aufbauen.](../../../assets/figures/de/p0c1-architecture.svg)

Jeder Teil des Kurses baut eine Schicht auf oder erweitert sie. In der Kopfzeile jeder Schicht stehen die Teile, die sie aufbauen. Rechts steht das Werkzeug, mit dem sie entsteht. Das Vorbereitungsskript richtet die Server ein, Ansible mit OneDeploy die IaaS und OpenTofu die VMs von k3s. Argo CD holt die Apps aus einem Git-Repo.

## Leistungsbeurteilung

Deine Modulnote entsteht aus zwei Noten. Note 1 kommt aus den vier Meilensteinen und zählt 60 %. Die Meilensteine 1 und 2 gibst du zusammen ab, ebenso die Meilensteine 3 und 4. Note 1 ist der Durchschnitt dieser beiden Abgaben. Note 2 kommt aus einer Prüfung von 60 Minuten gegen Ende des Moduls und zählt 40 %. Die Termine gibt deine Dozentin oder dein Dozent bekannt. Die Einzelheiten stehen unter [Leistungsbeurteilung](../../assessment/).

Jeder Meilenstein hat zwei Teile. Die Basis belegst du mit dem Bericht des Checks und mit Screenshots in deinem Abgabe-Repo. Eine vollständige Basis ergibt die Note 4,5. Die Zusatzaufträge dokumentierst du und zeigst sie live im Unterricht oder in einem Screencast von höchstens zehn Minuten, mit ihnen erreichst du bis zur Note 6. Du darfst im Team arbeiten, dein Lab baust du aber selbst auf und du gibst allein ab. Deine Umgebung trägt deine [persönlichen Parameter](../parameters/) wie Hostnamen und Netze. Deshalb sieht jedes Lab ein wenig anders aus, eine kopierte Lösung fällt auf.

## KI-Werkzeuge

Du darfst KI-Assistenten verwenden, um Code, Konfigurationen und Skripte zu schreiben. Zwei Regeln gelten dabei. Erstens hältst du in der Dokumentation deiner Zusatzaufträge fest, wofür du einen KI-Assistenten eingesetzt hast. Zweitens musst du alles erklären können, was du abgibst. In der Vorführung fragt deine Dozentin oder dein Dozent nach. Eine Lösung, die du nicht erklären kannst, zählt nicht als deine.

In den Zusatzaufträgen von Teil 5 betreibst du ein lokales Sprachmodell auf deiner Plattform. Dort setzt du ein kleines Modell im Betrieb ein und prüfst, wo seine Vorschläge stimmen und wo nicht.

::::exercise[Einstieg]
Lies die Beschreibung der vier Mitglieder noch einmal. Schreibe für jedes Mitglied in einem Satz auf, was es von einer Cloud am dringendsten braucht.

:::solution
Die Praxis Rosenweg braucht eine strikte Trennung von den anderen Mitgliedern und Daten, die die Schweiz nicht verlassen. Die Treuhand Aaregg braucht Rechenleistung, die am Monatsende wächst und danach wieder sinkt. Das Veloatelier Matte braucht einen Webshop, der unter Last automatisch skaliert. Die Gemeinde Hinterbüel braucht verlässliche Dienste und eine Abrechnung, die ins Budget passt.
:::
::::
