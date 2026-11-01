---
title: SLA und Betriebskonzept
description: Was ein SLA regelt, welche Verfügbarkeit die Plattform ehrlich zusagen kann, ein Betriebskonzept für eine kleine Genossenschaft und ein Postmortem, dessen Entwurf das lokale Modell schreibt.
sidebar:
  order: 3
---

:::assignment
«Die neue Organisation will ein SLA, bevor sie unterschreibt», schreibt Simone Wyss. «Was können wir ehrlich versprechen? Und schreibt bitte auf, wie wir den Betrieb überhaupt organisieren. Nach dem letzten Samstag möchte der Vorstand auch einen kurzen Bericht, was passiert ist.»
:::

:::goals
Nach diesem Kapitel kannst du

- die Teile eines SLA nennen und für ein Mitglied entwerfen,
- aus der Architektur ableiten, welche Verfügbarkeit realistisch ist,
- ein Betriebskonzept für eine kleine Organisation schreiben,
- ein Postmortem ohne Schuldzuweisung verfassen,
- den Entwurf eines Sprachmodells gegen die Fakten prüfen.
:::

## SLA, SLO und SLI

Kapitel 5.3 hat ein SLO für den Webshop festgelegt, 99,5 % der Anfragen ohne Serverfehler über sieben Tage. Ein SLO ist ein internes Ziel des Plattform-Teams. Ein Service Level Agreement (SLA) ist eine Vereinbarung mit dem Mitglied, und es hat Folgen, wenn es verfehlt wird, etwa eine Gutschrift. Das SLA liegt darum lockerer als das SLO. So bleibt Raum, ein verfehltes SLO zu bemerken und zu beheben, bevor das SLA bricht.

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

Prozentzahlen klingen ähnlich und unterscheiden sich stark. Die Tabelle rechnet sie in erlaubte Ausfallzeit um.

| Verfügbarkeit | pro 30 Tage | pro Jahr |
|---|---|---|
| 99 % | 7,2 Stunden | 3,65 Tage |
| 99,5 % | 3,6 Stunden | 1,83 Tage |
| 99,9 % | 43 Minuten | 8,8 Stunden |

Was die Plattform zusagen kann, folgt aus ihrer Architektur. Im Lab gibt es ein Front-end, einen Server von k3s und zwei Knoten. Fällt der Server von k3s aus, steht der Webshop, bis die VM neu gebaut ist. Das waren im Lab gut zehn Minuten, wenn jemand sofort reagiert. Fällt ein Knoten aus, sind seine VMs weg, bis er wieder läuft oder sie auf dem anderen Knoten neu entstehen. Und das Plattform-Team einer kleinen Genossenschaft arbeitet zu Bürozeiten. Ein Ausfall am Samstagabend wird erst am Montag behoben, wenn kein Pikettdienst besteht.

Ehrlich sind darum Zusagen wie 99 % zu Bürozeiten mit einer Reaktionszeit von vier Stunden. Mehr verlangt mehr Aufwand, etwa drei Server für k3s, einen Pikettdienst oder ein zweites Rechenzentrum, und es kostet entsprechend mehr. Kapitel 6.4 rechnet den Preis aus.

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

## Ein Alert für ein neues Mitglied

Seit Kapitel 6.1 schickt Alertmanager nicht nur die Alerts des Webshops an den Triage-Dienst, sondern jeden Alert mit dem Label `triage: "true"`. Ein neues Mitglied bringt seine Regeln deshalb selbst mit, als `PrometheusRule` in seinem Ordner im Plattform-Repo. Das Beispiel überwacht die App `web` einer Kindertagesstätte im Namespace `kita`.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: kita
spec:
  groups:
    - name: kita
      rules:
        - alert: KitaWebDown
          expr: kube_deployment_status_replicas_available{namespace="kita", deployment="web"} < 1
          for: 2m
          labels:
            severity: critical
            triage: "true"
          annotations:
            summary: Die Website der Kita hat keinen laufenden Pod
```

Die Datei heisst etwa `members/kita/alerts.yaml` und steht in der `kustomization.yaml` des Mitglieds unter `resources`. Die Metrik liefert die Labels `namespace` und `deployment` mit. Aus ihnen bildet der Triage-Dienst das Ziel, hier `kita/web`, und holt die Logzeilen aus diesem Namespace.

Den Alert löst du über Git aus, indem du in der App `replicas: 0` setzt und pushst. Im Lab des Kurses kam der Alert zwei Minuten nachdem der letzte Pod weg war. Der Triage-Dienst schlug einen Neustart vor, und das Team lehnte ab, denn ein Neustart startet keinen Pod, wenn Git null verlangt. Behoben ist die Störung erst, wenn `replicas: 1` wieder in Git steht.

Der Dienst darf nach Kapitel 5.6 nur `velo/webshop` anfassen. Für ein neues Mitglied steht im Kontext deshalb `(deployment not readable)`, und eine Freigabe würde mit `is not in ALLOWED_TARGETS` scheitern. Soll er das Deployment lesen und neu starten dürfen, ergänzt du `ALLOWED_TARGETS` in `ai/triage.yaml` und legst im Namespace des Mitglieds eine `Role` mit `RoleBinding` wie in `ai/triage-rbac.yaml` an. Ob das sinnvoll ist, entscheidest du mit dem Schutzbedarf des Mitglieds.

## Postmortems

Nach einer Störung schreibt das Team ein Postmortem. Es hält fest, was passiert ist, welche Auswirkung es hatte, welche Ursachen dazu beitrugen und welche Massnahmen eine Wiederholung verhindern. Die Praxis kommt aus dem Betrieb grosser Dienste, das [Buch zu Site Reliability Engineering](https://sre.google/sre-book/postmortem-culture/) von Google beschreibt sie ausführlich. Ein Postmortem sucht keine Schuldigen. Es nimmt an, dass alle Beteiligten mit den Informationen, die sie hatten, vernünftig gehandelt haben, und fragt, welche Systeme und Abläufe den Fehler möglich gemacht haben.

Die Zeitlinie ist der wichtigste Teil, und sie ist mühsam zu sammeln. Bei Wolkenwerk stehen die Fakten an drei Orten, die Alerts in Prometheus, die Entscheide im Audit-Log des Triage-Dienstes und die Änderungen in Git. Das Skript des Kurses sammelt sie und baut daraus die Zeitlinie selbst, ohne Modell. Das lokale Modell aus Kapitel 5.5 schreibt nur den Text darum herum.

::code{file="case/postmortem/postmortem.py" lines="94-103"}

Die Frage an das Modell verlangt ein Postmortem ohne Schuldzuweisung und nur aus den gelieferten Fakten. Fehlt ein Fakt, soll das Modell das schreiben, statt zu raten.

::code{file="case/postmortem/postmortem.py" lines="118-125"}

```bash
~/cc/case/postmortem/postmortem.py --hours 1 > ~/postmortem-entwurf.md
```

Im Lab lief ein Vorfall wie in Kapitel 5.3. `FAIL_PERCENT` stand über Git auf 60, der Alert kam wenige Minuten nachdem die Änderung wirkte, der Triage-Dienst schlug einen Neustart vor, das Team lehnte ab und nahm die Änderung mit `git revert` zurück. Das Modell brauchte für den Entwurf 33 Sekunden. Die Zeitlinie stimmte, denn sie kam aus den Daten. Der Text des Modells enthielt dagegen mehrere Fehler.

- Es nannte eine Ausfallzeit von etwa einer Stunde, die Fehler dauerten rund zehn Minuten.
- Es machte den Umbau auf etcd für eine Verzögerung der Snapshots verantwortlich, die es nie gab.
- Es lobte diesen Umbau als Gewinn an Stabilität, ohne dass ein Fakt das zeigte.
- Es erfand Verantwortliche wie «Teamleiter A» und schrieb Massnahmen unter «Was schlecht lief».
- Die richtige Ursache, `FAIL_PERCENT` auf 60, übernahm es aus dem Vorschlag des Triage-Dienstes.

Ein zweiter Entwurf über eine halbe Stunde nannte 13 Minuten Auswirkung und schrieb im nächsten Satz, die Benutzer hätten keine Ausfälle bemerkt, obwohl 60 % der Anfragen scheiterten. Ein Entwurf spart Tipparbeit, aber jede Aussage muss gegen die Zeitlinie geprüft werden. Wer ihn ungeprüft weitergibt, verbreitet Behauptungen mit dem Anschein eines Berichts.

::::exercise[SLA]
Entwirf ein SLA für dein eigenes Mitglied aus Meilenstein 4 auf einer Seite. Begründe die Verfügbarkeit mit der Architektur deines Labs und die Supportzeiten mit den Mitteln einer kleinen Genossenschaft.

:::solution
Ein gutes SLA nennt den Dienst und seine Grenzen, eine Verfügbarkeit mit Zeitraum und Ausnahmen, etwa 99 % pro Monat zu Bürozeiten ohne angekündigte Wartung, Supportzeiten mit Reaktionszeiten, RPO und RTO aus Kapitel 6.2, den Ort der Daten in der Schweiz, die Pflichten des Mitglieds und eine Folge bei Verfehlung. Die Begründung erwähnt den einzelnen Server von k3s und das fehlende Pikett. Eine Zusage über 99,9 % ohne mehr Server und Pikett wäre nicht ehrlich.
:::
::::

::::exercise[Postmortem]
Löse einen Vorfall aus wie in Kapitel 5.3, entscheide über den Vorschlag des Triage-Dienstes, behebe den Fehler über Git und lass das Modell einen Entwurf schreiben. Korrigiere ihn und markiere jede Änderung.

:::solution
Der Entwurf enthält eine Zeitlinie mit Commit, Alert, Vorschlag, Entscheid und Revert. Die Korrektur prüft jede Zahl und jede Ursache gegen diese Zeitlinie, streicht erfundene Personen und Fakten und ergänzt Massnahmen mit einer Rolle als Verantwortliche, etwa eine Prüfung von Umgebungsvariablen im Pull Request. Das fertige Postmortem nennt keine schuldige Person.
:::
::::

::::exercise[Betriebskonzept]
Schreibe das Betriebskonzept von Wolkenwerk auf höchstens zwei Seiten und ergänze ein Runbook für den Alert `WebshopErrorBudgetBurn`.

:::solution
Das Konzept deckt Rollen, Betriebszeiten, Überwachung, Störungen, Änderungen, Sicherheit, Datensicherung, Dokumentation und Kosten ab. Das Runbook nennt die Symptome, die Abfragen in Prometheus und Loki aus Teil 5, die Prüfung der letzten Commits in Gitea und als Massnahme meist `git revert` statt eines Neustarts.
:::
::::
