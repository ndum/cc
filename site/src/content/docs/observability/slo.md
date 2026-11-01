---
title: Alerts und SLOs
description: SLI, SLO und Fehlerbudget für den Webshop, Recording Rules, ein Alert nach Burn Rate mit zwei Zeitfenstern, Symptome gegen Ursachen und die Weiterleitung durch Alertmanager.
sidebar:
  order: 3
---

:::assignment
«Wir wollen nicht bei jedem kleinen Fehler geweckt werden», schreibt das Veloatelier Matte. «Aber wenn der Shop am Samstag nicht verkauft, wollen wir es wissen, bevor die Kundschaft anruft.»
:::

:::goals
Nach diesem Kapitel kannst du

- SLI, SLO, SLA und Fehlerbudget unterscheiden,
- ein SLO für den Webshop formulieren und sein Fehlerbudget berechnen,
- einen Alert nach Burn Rate lesen und begründen,
- Alerts auf Symptome von Alerts auf Ursachen unterscheiden,
- erklären, wie Alertmanager Alerts gruppiert und weiterleitet.
:::

## SLI, SLO und SLA

Ein Service Level Indicator (SLI) misst, wie gut ein Dienst aus Sicht der Kundschaft arbeitet, meist als Anteil guter Ereignisse. Ein Service Level Objective (SLO) ist das Ziel für diesen Anteil über einen Zeitraum. Ein Service Level Agreement (SLA) ist ein Vertrag mit Folgen, wenn das Ziel verfehlt wird. Ein SLA folgt in Teil 6, hier geht es um das interne Ziel.

| Begriff | Webshop |
|---|---|
| SLI | Anteil der Anfragen an den Shop, die ohne Serverfehler beantwortet werden |
| SLO | 99,5 % über 7 Tage |
| Fehlerbudget | 0,5 % der Anfragen dürfen scheitern |

Kein Dienst erreicht 100 %. Das Fehlerbudget macht die Lücke zu einer Grösse, mit der man planen kann. Ist es noch voll, darf das Veloatelier Neues ausprobieren. Ist es aufgebraucht, haben Stabilität und Korrekturen Vorrang.

## Recording Rules

Die Regeln liegen in deinem Repo unter `monitoring/config/webshop-slo.yaml`, als PrometheusRule.

::code{file="platform/observability/repo/monitoring/config/webshop-slo.yaml"}

Die ersten zwei Regeln sind Recording Rules. Prometheus berechnet den Fehleranteil über fünf Minuten und über eine Stunde regelmässig und speichert ihn als eigene Zeitreihe, `webshop:error_ratio:rate5m` und `webshop:error_ratio:rate1h`. Alerts und Dashboards lesen diese Reihen, statt dieselbe Rechnung jedes Mal neu zu machen. `clamp_min` verhindert eine Division durch null, wenn gerade niemand einkauft.

## Burn Rate

Ein Alert auf «mehr als 0,5 % Fehler» würde bei jeder kurzen Spitze auslösen. Die Burn Rate fragt stattdessen, wie schnell das Budget verbraucht wird. Eine Burn Rate von 1 verbraucht das Budget genau in den 7 Tagen. Bei 14,4 wäre es nach 168 / 14,4 ≈ 12 Stunden weg. Der Alert `WebshopErrorBudgetBurn` löst aus, wenn der Fehleranteil über fünf Minuten und über eine Stunde beide über 14,4 × 0,5 % = 7,2 % liegen, und das während zwei Minuten.

| Fenster | Aufgabe |
|---|---|
| 1 Stunde | zeigt, dass das Problem anhält und das Budget wirklich angreift |
| 5 Minuten | zeigt, dass es jetzt noch besteht, und beendet den Alert bald nach der Behebung |

Im Lab war die Wirkung des langen Fensters gut zu sehen. Vorher hatte ein Lasttest zehntausende gute Anfragen erzeugt. Als danach jede achte Anfrage scheiterte, lag der Anteil über fünf Minuten sofort bei 12 %, über eine Stunde aber lange bei 3 bis 4 %. Erst nach rund 25 Minuten, und erst nachdem der Fehleranteil weiter gestiegen war, löste der Alert aus. Eine kurze Störung weckt so niemanden, eine lange schon.

## Symptome und Ursachen

`WebshopErrorBudgetBurn`, `WebshopSlow` und `WebshopDown` melden Symptome, also das, was die Kundschaft merkt. Ursachen wie eine volle Disk, ein Pod in einer Neustartschleife oder ein Knoten ohne Speicher bringt kube-prometheus-stack als eigene Regeln mit, etwa `KubePodCrashLooping` oder `KubePersistentVolumeFillingUp`. Im Lab meldete Prometheus `KubePersistentVolumeFillingUp`, als die Disk des Agents zu 87 % voll war. Das Zusatzkapitel 5.5 erzählt, warum.

Symptome eignen sich, um Menschen zu wecken, denn sie betreffen die Kundschaft sicher. Ursachen eignen sich für Tickets und Dashboards. Ein Alert, auf den niemand reagieren muss, gehört gelöscht, sonst lernt das Team, Alerts zu übersehen.

## Alertmanager

Prometheus wertet die Regeln aus und schickt auslösende Alerts an Alertmanager. Alertmanager fasst ähnliche Alerts zusammen, unterdrückt Wiederholungen und leitet sie an Empfänger weiter, etwa an E-Mail, einen Chat oder einen Webhook. Die Weiterleitung steht in den Werten von kube-prometheus-stack.

```yaml
route:
  receiver: "null"
  group_by: [alertname, namespace]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - receiver: triage
      matchers:
        - alertname =~ "Webshop.*"
```

Alerts des Webshops gehen an den Empfänger `triage`, den Dienst aus dem Zusatzkapitel 5.6. Die Weiterleitung gehört zur Basis, die Arbeit mit dem Dienst selbst zu den Zusatzaufträgen von Meilenstein 3. Alle anderen landen vorerst bei `null` und erscheinen nur in der Oberfläche von Alertmanager auf Port 30093. `group_wait` wartet 30 Sekunden auf weitere Alerts derselben Gruppe, `repeat_interval` wiederholt einen offenen Alert erst nach vier Stunden.

## Einen Alert auslösen

Du brichst das SLO absichtlich über Git. Der Webshop hat dafür die Variable `FAIL_PERCENT`, sie gibt an, wie viele Anfragen er mit einem Fehler beantwortet.

```bash
cd ~/platform
sed -i '/FAIL_PERCENT/{n;s/value: "0"/value: "60"/}' webshop/deployment.yaml
git commit -am "Neues Zahlungsmodul im Webshop"
git push
kubectl run load --restart=Never --image=ghcr.io/ndum/cc/webshop:1.0.0 -- \
  python3 /app/load.py http://<adresse-des-servers>/ --workers 1 --seconds 1800
```

In Prometheus unter «Alerts» wechselt `WebshopErrorBudgetBurn` zuerst auf `pending` und nach zwei Minuten auf `firing`. Danach stellst du den alten Stand her, mit `git revert` und `git push`, und löschst den Pod `load`. Im Lab war der Alert knapp sechs Minuten nach dem Revert wieder inaktiv.

::::exercise[Lab]
Löse den Alert wie oben aus, beobachte ihn in Prometheus und Alertmanager und stelle den alten Stand wieder her. Notiere die Zeiten.

:::solution
Nach dem Push steigt `webshop:error_ratio:rate5m` innerhalb weniger Minuten über 7,2 %. Wie lange `webshop:error_ratio:rate1h` braucht, hängt vom Verkehr der letzten Stunde ab. Ohne vorherigen Lasttest geht es schneller. Alertmanager zeigt den Alert mit dem Empfänger `triage`. Nach dem Revert fällt der Anteil über fünf Minuten, und der Alert endet, obwohl der Anteil über eine Stunde noch hoch ist.
:::
::::

::::exercise[Fehlerbudget]
Der Webshop beantwortet an einem Samstag 40 000 Anfragen. Wie viele dürfen scheitern, bis das Budget dieses Tages verbraucht ist? Was heisst eine Burn Rate von 6 für das Budget der Woche?

:::solution
0,5 % von 40 000 sind 200 Anfragen. Eine Burn Rate von 6 verbraucht das Budget sechsmal so schnell wie erlaubt, das Budget von 7 Tagen wäre nach 28 Stunden weg. Ein zweiter Alert mit tieferer Schwelle und längeren Fenstern würde so etwas melden, ohne gleich jemanden zu wecken.
:::
::::

::::exercise[Für die Praxis]
Die Praxis Rosenweg will einen Alert, bevor die Patientinnen etwas merken. Schlage ein SLI und ein SLO für ihr Terminportal vor und begründe die Werte.

:::solution
Ein mögliches SLI ist der Anteil der Aufrufe der Terminseite, die ohne Fehler in weniger als einer Sekunde antworten. Ein SLO von 99,9 % über 30 Tage erlaubt etwa 43 Minuten Ausfall im Monat. Die Praxis hat Sprechzeiten, darum könnte man nur Anfragen zwischen 7 und 19 Uhr zählen. Höhere Ziele kosten Redundanz, die ein Lab mit einem Server nicht hat.
:::
::::
