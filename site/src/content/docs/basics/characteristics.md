---
title: Merkmale einer Cloud
description: Cloud als Betriebsmodell statt als Ort, die fünf Merkmale nach NIST mit Beispielen aus dem Lab und warum auch eine kleine Private Cloud eine Cloud ist.
sidebar:
  order: 1
---

:::assignment
Beat Kläy, der Präsident des Vorstands, schreibt dir vor der nächsten Sitzung. «Ich habe dreissig Jahre lang Server für eine Gemeinde betrieben. Erklär mir bitte, was an einer Cloud anders ist als an einem gut geführten Rechenzentrum. Kurz, ich will es dem Vorstand auf einer Seite zeigen.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Erklären, warum Cloud ein Betriebsmodell und kein Ort ist
- Die fünf Merkmale einer Cloud nach NIST nennen und an Beispielen erklären
- Prüfen, ob ein Angebot diese Merkmale erfüllt
- Begründen, warum auch die kleine Cloud von Wolkenwerk Bern eine Cloud ist
:::

## Cloud als Betriebsmodell

Im Alltag klingt «Cloud» nach einem fernen Rechenzentrum eines grossen Anbieters. Fachleute verstehen darunter ein **Betriebsmodell**, also eine Art, IT-Ressourcen bereitzustellen und zu nutzen. Rechenleistung, Speicher und Netz liegen in einem gemeinsamen Pool. Wer sie braucht, holt sie sich selbst, nutzt sie so lange wie nötig und gibt sie danach zurück.

Ein gut geführtes Rechenzentrum kann dieselbe Hardware haben wie eine Cloud. Der Unterschied liegt darin, wie man zu einer Ressource kommt. Im klassischen Betrieb stellt jemand einen Antrag, das Betriebsteam bestellt oder richtet einen Server ein. Nach Tagen oder Wochen steht er bereit. In einer Cloud stellt die Nutzerin oder der Nutzer die Ressource selbst bereit, in Minuten, über eine Weboberfläche oder eine API.

## Die fünf Merkmale nach NIST

Die am häufigsten zitierte Definition stammt vom amerikanischen National Institute of Standards and Technology (NIST), veröffentlicht 2011 als [Special Publication 800-145](https://csrc.nist.gov/pubs/sp/800/145/final). Sie nennt fünf Merkmale, die eine Cloud erfüllen muss.

| Merkmal | Bedeutung | Im Lab |
|---|---|---|
| On-demand self-service | Nutzende stellen Ressourcen selbst bereit, ohne dass ein Mensch beim Anbieter eingreifen muss. | Ein Mitglied startet in Sunstone eine VM aus einer Vorlage (Kapitel 3.4). |
| Broad network access | Die Ressourcen sind über das Netz mit Standardprotokollen erreichbar, von verschiedenen Geräten aus. | Weboberfläche, API von OpenNebula, SSH zu den VMs |
| Resource pooling | Die Ressourcen bilden einen gemeinsamen Pool für mehrere Mandanten, die nicht wissen müssen, auf welcher Hardware ihre VM läuft. | Der Scheduler verteilt VMs auf die Knoten, die Mitglieder sind Mandanten (Kapitel 3.1). |
| Rapid elasticity | Ressourcen wachsen und schrumpfen schnell, teils automatisch, mit dem Bedarf. | Der Webshop skaliert unter Last (Kapitel 5.4), OneFlow vergrössert Dienste (Kapitel 3.5). |
| Measured service | Der Verbrauch wird gemessen und ist für Anbieter und Nutzende sichtbar. | Showback pro Mitglied (Kapitel 3.3), Metriken in Prometheus (Kapitel 5.1) |

![Die fünf Merkmale einer Cloud bei Wolkenwerk Bern. In der Mitte steht die Cloud von Wolkenwerk Bern auf drei Servern. Fünf Karten rundherum zeigen die Merkmale einer Cloud nach NIST mit je einem Beispiel aus dem Lab. Ein Mitglied startet selbst eine VM in Sunstone (On-demand self-service). Weboberfläche, API und SSH sind über das Netz erreichbar (Broad network access). Alle Mitglieder teilen sich einen Pool (Resource pooling). Der Webshop skaliert unter Last (Rapid elasticity). Der Showback zeigt jedem Mitglied seinen Verbrauch (Measured service). Erst mit allen fünf Merkmalen bilden die drei Server eine Cloud.](../../../assets/figures/de/p1c1-characteristics.svg)

Fehlt eines der Merkmale, spricht man streng genommen nicht von einer Cloud. Auch eine effiziente Virtualisierungsplattform ist keine Cloud, wenn nur das Betriebsteam darauf VMs anlegt, denn ihr fehlt der Self-Service.

## Grösse und Eigentum

Die Definition sagt nichts über die Grösse und nichts darüber, wem die Hardware gehört. Die drei Server von Wolkenwerk Bern bilden eine Cloud, sobald die Mitglieder selbst Ressourcen beziehen und sich den Pool teilen, der Verbrauch gemessen wird und Dienste mit der Last wachsen. Im Kurs baust du diese Merkmale nacheinander auf. In Teil 2 entstehen der Pool und der Zugang über das Netz, in Teil 3 kommen der Self-Service und die Messung dazu. Die Elastizität folgt in Teil 5, wenn der Webshop unter Last wächst. In den Zusatzaufträgen von Teil 3 lässt du schon einen Dienst mit OneFlow wachsen.

::::exercise[Einordnen]
Ordne jede Aussage einem der fünf Merkmale zu.

1. «Die Treuhand Aaregg sieht jeden Monat, wie viele CPU-Stunden sie gebraucht hat.»
2. «Die Praxis Rosenweg startet am Sonntagabend eine neue VM, ohne jemanden anzurufen.»
3. «Am Samstag laufen vom Webshop acht Kopien statt zwei.»
4. «Die Gemeinde weiss nicht, auf welchem Knoten ihre VM läuft. Sie muss es auch nicht wissen.»
5. «Die Mitglieder erreichen ihre VMs vom Büro und von zu Hause aus.»

:::solution
1. Measured service
2. On-demand self-service
3. Rapid elasticity
4. Resource pooling
5. Broad network access
:::
::::

::::exercise[Briefing]
Erkläre Beat Kläy in fünf Sätzen, je einem pro Merkmal, was Wolkenwerk Bern von einem klassischen Rechenzentrum unterscheidet.

:::solution
Mitglieder beziehen ihre Server selbst und in Minuten statt über einen Antrag. Sie erreichen alles über das Netz mit Standardprotokollen. Die drei Server bilden einen Pool, den sich alle Mitglieder teilen. Wer mehr Leistung braucht, bekommt sie kurzfristig und gibt sie danach wieder ab. Jedes Mitglied sieht seinen Verbrauch und bezahlt entsprechend.
:::
::::
