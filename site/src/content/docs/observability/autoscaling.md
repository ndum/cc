---
title: Autoscaling
description: Requests und Limits, der HorizontalPodAutoscaler mit CPU, ein Lasttest auf den Webshop, die Grenzen durch Quotas und Rollouts und der Vergleich mit der Elastizität von OneFlow.
sidebar:
  order: 4
---

:::assignment
«Samstags um zehn geht es los», schreibt das Veloatelier Matte. «Unter der Woche reicht der Shop mit wenig, am Samstag soll er wachsen, ohne dass jemand von euch daneben sitzt.»
:::

:::goals
Nach diesem Kapitel kannst du

- erklären, wie der HorizontalPodAutoscaler die Zahl der Pods berechnet,
- Requests, Limits und Quotas für ein Deployment mit Autoscaling abstimmen,
- einen Lasttest durchführen und Wachsen und Schrumpfen beobachten,
- erkennen, wann mehr Pods nicht mehr helfen,
- Autoscaling in Kubernetes mit der Elastizität von OneFlow vergleichen.
:::

## Der HorizontalPodAutoscaler

Der HorizontalPodAutoscaler (HPA) passt die Zahl der Pods eines Deployments an eine Metrik an, meist die CPU. Er vergleicht die mittlere Auslastung der Pods mit einem Ziel, gemessen in Prozent ihres CPU-Requests. Die Kubernetes-Dokumentation gibt die Rechnung an.

```text
gewünschte Pods = aufrunden(aktuelle Pods × aktuelle Auslastung / Ziel)
```

Zwei Pods mit 120 % bei einem Ziel von 60 % ergeben vier Pods. Die Werte holt der HPA vom metrics-server, den k3s mitbringt.

::code{file="platform/observability/repo/webshop/hpa.yaml"}

Der Webshop wächst zwischen zwei und sechs Pods. Beim Schrumpfen wartet der HPA fünf Minuten und nimmt die höchste Empfehlung dieser Zeit. Ein Shop, der zwischen zwei Wellen kurz ruhig ist, verliert so nicht gleich seine Pods.

## Zwei Steuerungen für eine Zahl

Bisher stand die Zahl der Pods in Git, `replicas: 3` aus Kapitel 4.4. Mit dem HPA gäbe es zwei Steuerungen für dieselbe Zahl. Der HPA würde auf sechs erhöhen, Argo CD mit Self-Heal auf drei zurücksetzen, und so fort. Das Deployment in `observability/repo/webshop` hat darum kein `replicas` mehr. Fehlt das Feld in Git, rührt Argo CD es nicht an, und der HPA bestimmt allein.

::code{file="platform/observability/repo/webshop/deployment.yaml"}

`WORK_MS` lässt den Shop pro Anfrage 20 Millisekunden rechnen, damit die Last in der CPU sichtbar wird. Der Request von `50m` ist die Grundlage der Prozente des HPA, das Limit von `250m` die Obergrenze eines Pods.

## Der Lasttest

Das Image des Webshops enthält einen Lastgenerator, `load.py`. Er schickt mit mehreren Threads Anfragen, so schnell der Shop antwortet, und gibt alle zehn Sekunden Durchsatz, Fehler und Antwortzeit aus. Du startest ihn als Pod im Namespace `default` und schickst die Last über Traefik, so wie die Kundschaft kommt.

```bash
kubectl run load --restart=Never --image=ghcr.io/ndum/cc/webshop:1.0.0 -- \
  python3 /app/load.py http://<adresse-des-servers>/ --workers 20 --seconds 240
kubectl -n velo get hpa webshop --watch
kubectl logs load
```

Im Lab stand der HPA nach 30 Sekunden bei 200 % und zwei Pods, nach 60 Sekunden liefen sechs Pods mit je 500 % ihres Requests, also am Limit von `250m`. Der Generator meldete um 135 Anfragen pro Sekunde, und 95 % der Anfragen kamen in etwa 300 ms zurück. Nach dem Ende der Last blieb der Shop wegen der Wartezeit von fünf Minuten zuerst bei sechs Pods und schrumpfte dann auf zwei.

## Grenzen

Im Lab zeigten sich drei Grenzen, die im Betrieb ebenso vorkommen.

### Die Quota

In einem ersten Versuch hatte jeder Pod ein Limit von `500m`. Die Quota des Veloateliers erlaubt 2 CPU an Limits. Der HPA wollte sechs Pods, es liefen vier, der fünfte scheiterte mit dieser Meldung.

```text
Error creating: pods "webshop-68674cff94-7ln2v" is forbidden: exceeded quota: member, requested: limits.cpu=500m, used: limits.cpu=2, limited: limits.cpu=2
```

Die Quota aus Kapitel 4.5 schützt die anderen Mitglieder, sie begrenzt aber auch das Wachsen. Wer `maxReplicas` setzt, rechnet nach, ob `maxReplicas` × Limit in die Quota passt.

### Der Rollout

Bei sechs Pods am Limit der Quota änderte jemand eine Variable des Deployments. Kubernetes startet bei einem Rollout zusätzliche Pods, bevor es alle alten beendet, in der Standardeinstellung bis zu 25 % mehr. Für diese Pods war in der Quota kein Platz, der Rollout blieb mit zwei neuen und drei alten Pods stehen. Eine Quota braucht darum Reserve für die zusätzlichen Pods eines Rollouts. Mit `250m` passen sechs Pods und zwei zusätzliche Pods in 2 CPU.

### Der Engpass anderswo

Als die Quota im ersten Versuch erhöht wurde, liefen sechs statt vier Pods, der Durchsatz stieg aber nur von 175 auf 185 Anfragen pro Sekunde. Der Lastgenerator ist ein einzelner Python-Prozess und schafft nicht mehr. Mehr Pods helfen nur, wenn der Shop der Engpass ist. Vor dem Skalieren gehört die Frage, wo die Zeit verloren geht.

## Vergleich mit OneFlow

| | OneFlow, Kapitel 3.5 | HPA |
|---|---|---|
| Einheit | VM | Pod |
| Start einer neuen Einheit | Minuten | Sekunden |
| Messung | CPU aus der Überwachung von OpenNebula | CPU des metrics-servers |
| Wachsen im Lab | nach etwa 155 Sekunden | nach etwa 60 Sekunden |
| Grenze | `max_vms` und Quota der Gruppe | `maxReplicas` und ResourceQuota |
| Zeitplan | `scheduled_policies` mit Cron | nicht im HPA, etwa mit einem CronJob, der `minReplicas` ändert |

Container starten schneller als VMs, darum reagiert der HPA kürzer. Die Grundidee ist dieselbe, eine Regel misst, vergleicht mit einem Ziel und ändert die Zahl innerhalb fester Grenzen. Unter beiden Systemen liegt dieselbe Hardware. Sechs Pods helfen nur, wenn die zwei VMs des Clusters die CPU haben.

::::exercise[Lab]
Rolle den HPA aus, führe den Lasttest durch und notiere, wann der Shop wächst und wann er schrumpft. Zeige im Dashboard aus Kapitel 5.1, wie sich Verkehr und Antwortzeit verhalten.

:::solution
`kubectl -n velo get hpa webshop --watch` zeigt die Auslastung steigen und die Pods von zwei auf sechs wachsen, im Lab innerhalb einer Minute. Im Dashboard steigen die Anfragen pro Sekunde, und die Antwortzeit steigt, bleibt im Lab aber unter der Grenze von 0,5 s aus Kapitel 5.3. Nach dem Ende bleibt der Shop fünf Minuten bei sechs Pods und fällt dann auf zwei.
:::
::::

::::exercise[Quota und HPA]
Das Veloatelier will am Samstag bis zu zehn Pods. Was musst du im Repo ändern, und was prüfst du, bevor du den Pull Request annimmst?

:::solution
`maxReplicas: 10` in `webshop/hpa.yaml` und in `members/velo` eine höhere Quota für `limits.cpu`. Zehn Pods mit `250m` brauchen 2,5 CPU, mit Reserve für den Rollout eher 3. Zu prüfen ist, ob die zwei VMs die Requests tragen und ob die Summe der Quotas aller Mitglieder noch vertretbar ist, wie in Kapitel 4.5.
:::
::::

::::exercise[Samstag um zehn]
Das Veloatelier weiss, dass die Last samstags um zehn beginnt. Wie bereitest du den Shop vor, damit er nicht erst bei der ersten Welle wächst?

:::solution
Ein CronJob, der samstags um 9.45 Uhr `minReplicas` des HPA auf vier setzt und am Abend zurück, wirkt wie die Regel nach Zeitplan in OneFlow. Weil das Repo die Quelle ist, gehört die Änderung entweder als geplanter Commit nach Git, oder `minReplicas` wird in Argo CD von der Prüfung ausgenommen. Sonst setzt Self-Heal den Wert gleich wieder zurück.
:::
::::
