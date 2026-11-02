---
title: SLA und Betriebskonzept
description: Was ein SLA regelt, welche Verfügbarkeit die Plattform ehrlich zusagen kann, ein Betriebskonzept für eine kleine Genossenschaft und Postmortems ohne Schuldzuweisung.
sidebar:
  order: 3
---

:::assignment
«Die neue Organisation will ein SLA, bevor sie unterschreibt», schreibt Simone Wyss. «Was können wir ehrlich versprechen? Und schreibt bitte auf, wie wir den Betrieb überhaupt organisieren. Nach dem letzten Samstag möchte der Vorstand auch einen kurzen Bericht, was passiert ist.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Die Teile eines SLA nennen und für ein Mitglied entwerfen
- Aus der Architektur ableiten, welche Verfügbarkeit realistisch ist
- Ein Betriebskonzept für eine kleine Organisation schreiben
- Zweck und Aufbau eines Postmortems ohne Schuldzuweisung erklären
:::

## SLA, SLO und SLI

Kapitel 5.3 hat ein SLO für den Webshop festgelegt, 99,5 % der Anfragen ohne Serverfehler über sieben Tage. Ein SLO ist ein internes Ziel des Plattform-Teams. Ein Service Level Agreement (SLA) ist dagegen eine Vereinbarung mit dem Mitglied. Wird es verfehlt, hat das Folgen, etwa eine Gutschrift. Darum setzt man das SLA lockerer an als das SLO. Ein verfehltes SLO lässt sich dann bemerken und beheben, bevor das SLA bricht.

Ein SLA regelt mehr als eine Prozentzahl.

| Teil | Inhalt |
|---|---|
| Leistung | welcher Dienst, mit welchen Ressourcen und Grenzen |
| Verfügbarkeit | Zielwert, Messung, Zeitraum und was nicht zählt, etwa angekündigte Wartung |
| Support | Erreichbarkeit, Kanal, Reaktionszeit nach Dringlichkeit |
| Datensicherung | RPO und RTO aus Kapitel 6.2, Aufbewahrung der Backups |
| Sicherheit und Datenschutz | Ort der Daten, Schutzmassnahmen, Meldung von Vorfällen |
| Pflichten des Mitglieds | etwa sichere Anwendungen, Ansprechperson, Meldung von Störungen |
| Bericht und Folgen | monatlicher Bericht, Gutschrift oder Kündigungsrecht bei Verfehlung |

## Verfügbarkeit in Zahlen

99 % und 99,9 % klingen ähnlich, erlauben aber sehr verschiedene Ausfallzeiten. Die Tabelle zeigt, wie viel Ausfallzeit jeder Wert erlaubt.

| Verfügbarkeit | pro 30 Tage | pro Jahr |
|---|---|---|
| 99 % | 7,2 Stunden | 3,65 Tage |
| 99,5 % | 3,6 Stunden | 1,83 Tage |
| 99,9 % | 43 Minuten | 8,8 Stunden |

Was die Plattform zusagen kann, folgt aus ihrer Architektur. Das Lab hat ein Front-end, einen Server von k3s und zwei Knoten. Fällt der Server von k3s aus, steht der Webshop, bis die VM neu gebaut ist. Im Lab dauerte es mit dem ganzen Stack gut zehn Minuten, bis der Webshop wieder lief. Das setzt voraus, dass jemand sofort reagiert. Fällt ein Knoten aus, sind seine VMs weg, bis er wieder läuft oder sie auf dem anderen Knoten neu entstehen. Dazu kommt, dass das Plattform-Team einer kleinen Genossenschaft zu Bürozeiten arbeitet. Ohne Pikettdienst wird ein Ausfall am Samstagabend erst am Montag behoben.

Ehrlich sind darum Zusagen wie 99 % zu Bürozeiten mit einer Reaktionszeit von vier Stunden. Mehr verlangt mehr Aufwand, etwa drei Server für k3s, einen Pikettdienst oder ein zweites Rechenzentrum. Das kostet entsprechend mehr. Kapitel 6.4 rechnet den Preis aus.

## Das Betriebskonzept

Ein Betriebskonzept beschreibt, wie der Betrieb organisiert ist, damit er nicht vom Gedächtnis einer Person abhängt. Für Wolkenwerk genügen wenige Seiten.

| Thema | Inhalt bei Wolkenwerk |
|---|---|
| Rollen | Plattform-Team, Ansprechperson je Mitglied, Vorstand für Ausnahmen |
| Betriebszeiten | Support Montag bis Freitag zu Bürozeiten, Pikett nur nach Vereinbarung |
| Überwachung | Prometheus und Alertmanager aus Teil 5, SLO je Dienst |
| Störungen | erkennen, einordnen, beheben, informieren, Postmortem |
| Änderungen | nur über Pull Requests in Gitea, Wartungsfenster am Dienstagabend |
| Sicherheit | Härtung, Updates, Rechte aus Kapitel 6.1 |
| Datensicherung | Snapshots, Backups und eine Übung zur Wiederherstellung pro Quartal |
| Dokumentation | README im Plattform-Repo, Anleitungen für wiederkehrende Störungen |
| Kosten | Showback pro Monat aus Kapitel 3.3, Vollkosten aus Kapitel 6.4 |

Eine Anleitung für eine wiederkehrende Störung heisst Runbook. Sie beschreibt Symptome, erste Prüfungen und Massnahmen, etwa für den Alert `WebshopErrorBudgetBurn`. Ein gutes Runbook kann auch eine Person befolgen, die das System nicht gebaut hat.

Die Zeit vom Beginn einer Störung, bis der Dienst wieder läuft, heisst Zeit bis zur Wiederherstellung. Ihr Mittelwert über viele Störungen ist die MTTR (Mean Time to Restore). Die Abbildung zeigt die Phasen einer Störung auf einer Zeitachse.

![Die Zeitlinie einer Störung. Eine Störung auf einer Zeitachse in fünf Phasen. Nach ihrem Beginn erkennt Prometheus die Störung und schickt einen Alert. Danach ordnet das Team die Störung mit den Logs in Loki und den letzten Commits in Git ein. Es behebt sie mit git revert, das Argo CD ausrollt, bis der Dienst wieder läuft. Dann informiert es die betroffenen Mitglieder und schreibt später ein Postmortem ohne Schuldzuweisung mit Zeitlinie und Massnahmen. Unter der Achse stehen die Zeit bis zum Alert und die Zeit bis zur Wiederherstellung. Der Mittelwert der Zeit bis zur Wiederherstellung über viele Störungen ist die MTTR.](../../../assets/figures/de/p6c3-incident.svg)

## Postmortems

Nach einer Störung schreibt das Team ein Postmortem. Es hält fest, was passiert ist, welche Auswirkung es hatte, welche Ursachen dazu beitrugen und welche Massnahmen eine Wiederholung verhindern. Postmortems stammen aus dem Betrieb grosser Dienste. Das [Buch zu Site Reliability Engineering](https://sre.google/sre-book/postmortem-culture/) von Google beschreibt sie ausführlich. Ein Postmortem sucht keine Schuldigen. Es geht davon aus, dass alle Beteiligten mit ihrem damaligen Wissen vernünftig gehandelt haben. Gefragt ist, welche Systeme und Abläufe den Fehler möglich gemacht haben.

Die Zeitlinie ist der wichtigste Teil und zugleich mühsam zu sammeln. Bei Wolkenwerk liegen die Alerts in Prometheus und die Änderungen in Git. Jede Massnahme nennt eine Rolle als Verantwortliche statt einer Person. Wie das lokale Modell aus einer solchen Zeitlinie einen Entwurf schreibt und wo es dabei irrt, zeigt Zusatzauftrag C in [Kapitel 6.5](../advanced/#ein-postmortem-aus-daten).

::::exercise[SLA]
Entwirf auf einer Seite ein SLA für eines der vier Mitglieder, etwa für die Treuhand. Begründe die Verfügbarkeit mit der Architektur deines Labs und die Supportzeiten mit den Mitteln einer kleinen Genossenschaft. Machst du Zusatzauftrag B aus Kapitel 6.5, schreibst du das SLA für dein eigenes Mitglied und stützt es auf deine gemessene Zeit der Wiederherstellung.

:::solution
Ein gutes SLA nennt den Dienst und seine Grenzen, eine Verfügbarkeit mit Zeitraum und Ausnahmen, etwa 99 % pro Monat zu Bürozeiten ohne angekündigte Wartung, Supportzeiten mit Reaktionszeiten, RPO und RTO aus Kapitel 6.2, den Ort der Daten in der Schweiz, die Pflichten des Mitglieds und eine Folge bei Verfehlung. Die Begründung erwähnt den einzelnen Server von k3s und das fehlende Pikett. Eine Zusage von 99,9 % ohne mehr Server und Pikett wäre nicht ehrlich.
:::
::::

::::exercise[Betriebskonzept]
Schreibe das Betriebskonzept von Wolkenwerk auf höchstens zwei Seiten und ergänze ein Runbook für den Alert `WebshopErrorBudgetBurn`.

:::solution
Das Konzept deckt Rollen, Betriebszeiten, Überwachung, Störungen, Änderungen, Sicherheit, Datensicherung, Dokumentation und Kosten ab. Das Runbook nennt die Symptome, die Abfragen in Prometheus und Loki aus Teil 5, die Prüfung der letzten Commits in Gitea und als Massnahme meist `git revert` statt eines Neustarts.
:::
::::
