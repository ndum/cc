---
title: Metriken mit Prometheus
description: Was Überwachung leisten soll, das Modell von Prometheus mit Zeitreihen, Labels und Exportern, kube-prometheus-stack aus Git, die Exporter von OpenNebula, erste Abfragen mit PromQL und ein Dashboard in Grafana.
sidebar:
  order: 1
---

:::assignment
«Es ist Frühling, und der Webshop des Veloateliers wird jeden Samstag langsamer», schreibt Simone Wyss. «Die Praxis Rosenweg will wissen, ob die Plattform läuft, bevor Patientinnen anrufen. Und ich will sehen, ob unsere Knoten noch Platz haben.»
:::

:::goals
Nach diesem Kapitel kannst du

- die vier goldenen Signale nennen und erklären, was Überwachung leisten soll,
- das Modell von Prometheus mit Zeitreihen, Labels, Exportern und dem Abholen erklären,
- den Monitoring-Stack über Argo CD aus deinem Plattform-Repo ausrollen,
- OpenNebula und den Webshop als Ziele einbinden,
- einfache Abfragen mit PromQL schreiben und in Grafana darstellen.
:::

## Der Zweck der Überwachung

Überwachung soll zeigen, was kaputt ist und warum. Was kaputt ist, sieht auch die Kundschaft, etwa an einem langsamen Shop. Das Warum braucht einen Blick ins Innere, etwa volle Disks oder einen Knoten ohne freien Speicher. Das Buch «Site Reliability Engineering» von Google nennt vier Signale, die man für jeden Dienst messen sollte.

| Signal | Frage | Beim Webshop |
|---|---|---|
| Latenz | Wie lange dauert eine Antwort? | Antwortzeit von `/` |
| Verkehr | Wie viel wird verlangt? | Anfragen pro Sekunde |
| Fehler | Wie viel geht schief? | Anteil der Antworten mit 5xx |
| Sättigung | Wie voll ist das System? | CPU der Pods, Speicher der Knoten |

## Prometheus

Prometheus speichert Zeitreihen. Eine Zeitreihe ist ein Name mit Labels und einer Folge von Werten mit Zeitstempel.

```text
webshop_requests_total{code="200", path="/", pod="webshop-599c7b4f94-4htg9"}  1532
```

Prometheus holt die Werte selbst ab, in der Regel alle 15 bis 30 Sekunden. Jedes Ziel bietet unter `/metrics` eine Textseite an. Programme, die das nicht selbst können, bekommen einen Exporter, ein kleines Programm, das Werte sammelt und im Format von Prometheus ausgibt. Der Webshop aus Kapitel 4.4 hat `/metrics` schon eingebaut.

| Typ | Bedeutung | Beispiel |
|---|---|---|
| Counter | zählt nur aufwärts, bis zum Neustart | `webshop_requests_total` |
| Gauge | kann steigen und sinken | `opennebula_host_mem_usage_bytes` |
| Histogram | zählt Werte in Klassen, für Perzentile | `webshop_request_duration_seconds_bucket` |

## Der Stack

kube-prometheus-stack ist ein Helm-Chart der Community von Prometheus. Es bringt Prometheus, Alertmanager, Grafana, den Prometheus Operator, kube-state-metrics für den Zustand der Objekte im Cluster und node-exporter für die Nodes mit. Der Operator führt eigene Typen ein. Ein ServiceMonitor sagt, welche Services Prometheus abfragen soll, eine ScrapeConfig nennt Ziele ausserhalb des Clusters, eine PrometheusRule enthält Regeln.

Der Stack kommt wie der Webshop aus Git. Die Ergänzungen für Teil 5 liegen im Kursrepo unter `platform/observability/repo`. Du kopierst sie über dein Plattform-Repo und ersetzt die Platzhalter durch deine Adressen.

```bash
source /etc/cc-lab.env
cd ~/platform
cp -r ~/cc/platform/observability/repo/. .
sed -i "s#http://FRONTEND:3000#http://$CC_FE_IP:3000#" apps/*.yaml
sed -i "s/FRONTEND_IP/$CC_FE_IP/; s/NODE1_IP/$CC_NODE1_IP/; s/NODE2_IP/$CC_NODE2_IP/" monitoring/config/opennebula.yaml
git status
```

`git status` zeigt neue Applications in `apps`, den Ordner `monitoring`, den Ordner `ai` für die Kapitel 5.5 und 5.6 und geänderte Dateien in `webshop` und `templates/member`. Bevor du pushst, legst du das Passwort für Grafana als Secret an, damit es nicht in Git landet.

::code{file="platform/observability/make-secrets.sh"}

```bash
~/cc/platform/observability/make-secrets.sh
```

Die Application `monitoring` holt das Chart aus dem Repo der Community und die Werte aus deinem Gitea. Argo CD kann dafür mehrere Quellen in einer Application verbinden.

::code{file="platform/observability/repo/apps/monitoring.yaml"}

::code{file="platform/observability/repo/monitoring/kube-prometheus-stack.yaml"}

k3s führt Scheduler, Controller Manager und Proxy in einem einzigen Prozess aus. Die Monitore, die das Chart dafür mitbringt, fänden nichts und blieben rot, darum sind sie aus.

## OpenNebula als Ziel

Für die IaaS-Schicht bringt OpenNebula eigene Exporter mit, im Paket `opennebula-prometheus-kvm`. Auf dem Front-end liefert der OpenNebula-Exporter auf Port 9925 Hosts, VMs und Datastores, wie OpenNebula sie sieht. Auf den Knoten zeigt node_exporter auf Port 9100 das Betriebssystem und der Libvirt-Exporter auf Port 9926 die VMs, wie KVM sie sieht. Das Paket `opennebula-prometheus` installierst du nicht, es brächte ein zweites Prometheus mit.

::code{file="platform/observability/install-exporters.sh"}

```bash
~/cc/platform/observability/install-exporters.sh
```

Im Lab meldeten alle sechs Ziele `ok`. Der OpenNebula-Exporter brauchte nach dem Start etwa eine halbe Minute, bis er die Hosts kannte. Prometheus erreicht die Exporter über drei ScrapeConfigs mit den Adressen aus deinen Parametern.

::code{file="platform/observability/repo/monitoring/config/opennebula.yaml"}

## Der Webshop als Ziel

Für den Webshop genügt ein ServiceMonitor neben seinem Deployment. Prometheus fragt dann jeden Pod hinter dem Service `webshop` ab.

::code{file="platform/observability/repo/webshop/servicemonitor.yaml"}

Die NetworkPolicy der Mitglieder aus Kapitel 4.5 liess bisher nur den eigenen Namespace und `kube-system` durch. Ohne Änderung käme Prometheus nicht an `/metrics`. Die neue Fassung der Vorlage lässt auch den Namespace `monitoring` zu.

::code{file="platform/observability/repo/templates/member/networkpolicy.yaml"}

Jetzt pushst du alles. Argo CD rollt den Stack aus, im Lab war er 161 Sekunden nach dem Push synchron und gesund.

```bash
git add .
git commit -m "Überwachung mit Prometheus, Grafana und den Exportern von OpenNebula"
git push
kubectl -n monitoring get pods
```

## PromQL

Prometheus und Grafana erreichst du vom eigenen Rechner wieder über einen Tunnel, Prometheus auf Port 30090 und Grafana auf Port 30300 des Servers.

```bash
ssh -L 9090:<adresse-des-servers>:30090 -L 3000:<adresse-des-servers>:30300 mmuster-fe
```

Unter `http://localhost:9090/targets` zeigt Prometheus jedes Ziel mit seinem Zustand. Im Lab waren alle `up`, auch die Jobs `opennebula`, `opennebula-hosts`, `opennebula-libvirt` und `webshop`. Unter «Query» probierst du Abfragen aus.

| Abfrage | Ergebnis |
|---|---|
| `up` | 1 für jedes erreichbare Ziel, 0 sonst |
| `opennebula_host_mem_usage_bytes / opennebula_host_mem_total_bytes` | Anteil des Speichers jedes Knotens, den VMs belegen |
| `rate(webshop_requests_total[5m])` | Anfragen pro Sekunde, gemittelt über fünf Minuten |
| `sum by (code) (rate(webshop_requests_total[5m]))` | dasselbe, nach Statuscode zusammengezählt |
| `histogram_quantile(0.95, sum by (le) (rate(webshop_request_duration_seconds_bucket[5m])))` | Zeit, in der 95 % der Anfragen beantwortet sind |

Ein Counter allein sagt wenig, er steigt seit dem Start des Pods. `rate()` macht daraus eine Änderung pro Sekunde und übersteht auch Neustarts, bei denen der Counter auf null fällt. `sum by` fasst Zeitreihen zusammen und behält nur die genannten Labels. Im Lab belegten die k3s-VMs auf jedem Knoten 83 % des Speichers, den OpenNebula vergeben kann.

## Grafana

Grafana zeigt Abfragen als Dashboards. Unter `http://localhost:3000/` meldest du dich als `admin` mit dem Passwort aus `~/cc-lab/grafana.pass` an. Das Chart bringt Dashboards für Kubernetes mit, etwa «Kubernetes / Compute Resources / Namespace (Pods)». Dazu kommt ein Dashboard des Plattform-Teams aus Git, `monitoring/config/dashboard-wolkenwerk.yaml`. Es zeigt Hosts und VMs von OpenNebula, Verkehr, Fehler und Antwortzeit des Webshops, CPU pro Namespace und den Speicher der Mitglieder gegen ihre Quota. Grafana lädt jede ConfigMap mit dem Label `grafana_dashboard` selbst.

::::exercise[Lab]
Rolle den Stack aus, installiere die Exporter und zeige in Prometheus, dass alle Ziele `up` sind. Öffne das Dashboard «Wolkenwerk platform» und erzeuge mit `curl` Verkehr auf den Webshop.

:::solution
`kubectl -n argocd get applications` zeigt `monitoring` und `monitoring-config` als `Synced` und `Healthy`. Unter Targets stehen die Jobs `opennebula` mit einem Ziel, `opennebula-hosts` mit drei, `opennebula-libvirt` mit zwei und `webshop` mit einem Ziel pro Pod. Nach einigen `curl http://<adresse-des-servers>/` zeigt das Dashboard Anfragen mit dem Code 200.
:::
::::

::::exercise[Eigene Abfrage]
Die Gemeinde Hinterbüel will wissen, wie viele VMs gerade in OpenNebula laufen und wie viel CPU sie insgesamt beanspruchen. Schreibe die Abfragen.

:::solution
`count(opennebula_vm_state == 3)` zählt die VMs im Zustand aktiv, der Exporter beschreibt die Zustände im Text seiner Metrik. `sum(opennebula_host_cpu_usage_ratio)` zählt die CPU zusammen, die OpenNebula auf allen Knoten an VMs vergeben hat. Wer statt der Zuteilung die echte Last will, nimmt `sum(rate(opennebula_libvirt_cpu_seconds_total[5m]))` von den Knoten.
:::
::::

::::exercise[Sättigung]
Welche Abfrage hätte dir in Kapitel 4.2 gezeigt, dass der Cluster neben den VMs aus Teil 2 und 3 keinen Platz hat?

:::solution
`opennebula_host_mem_total_bytes - opennebula_host_mem_usage_bytes` zeigt pro Knoten den Speicher, den OpenNebula noch vergeben kann. Mit den Webservern, den VMs der Praxis und dem Dienst der Treuhand lag er unter den 6 GB, die eine VM des Clusters braucht.
:::
::::
