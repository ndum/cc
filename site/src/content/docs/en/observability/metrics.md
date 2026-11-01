---
title: Metrics with Prometheus
description: What monitoring is for, the Prometheus model of time series, labels and exporters, kube-prometheus-stack from Git, the OpenNebula exporters, first PromQL queries and a Grafana dashboard.
sidebar:
  order: 1
---

:::assignment
"It's spring, and the bike shop's web shop gets slower every Saturday," Simone Wyss writes. "Praxis Rosenweg wants to know whether the platform is up before patients call. And I want to see whether our nodes still have room."
:::

:::goals
After this chapter you can

- name the four golden signals and explain what monitoring is for,
- explain the Prometheus model with time series, labels, exporters and pulling,
- roll out the monitoring stack through Argo CD from your platform repo,
- add OpenNebula and the web shop as targets,
- write simple PromQL queries and show them in Grafana.
:::

## The purpose of monitoring

Monitoring should show what is broken and why. Customers notice what is broken too, for example a slow shop. The why needs a look inside, for example full disks or a node without free memory. Google's book "Site Reliability Engineering" names four signals worth measuring for every service.

| Signal | Question | For the web shop |
|---|---|---|
| Latency | How long does an answer take? | response time of `/` |
| Traffic | How much is asked for? | requests per second |
| Errors | How much goes wrong? | share of 5xx answers |
| Saturation | How full is the system? | CPU of the pods, memory of the nodes |

## Prometheus

Prometheus stores time series. A time series is a name with labels and a sequence of timestamped values.

```text
webshop_requests_total{code="200", path="/", pod="webshop-599c7b4f94-4htg9"}  1532
```

Prometheus pulls the values itself, usually every 15 to 30 seconds. Every target offers a text page at `/metrics`. Programs that cannot do that get an exporter, a small program that collects values and prints them in the Prometheus format. The web shop of chapter 4.4 already has `/metrics` built in.

| Type | Meaning | Example |
|---|---|---|
| Counter | only counts up, until a restart | `webshop_requests_total` |
| Gauge | can go up and down | `opennebula_host_mem_usage_bytes` |
| Histogram | counts values in buckets, for percentiles | `webshop_request_duration_seconds_bucket` |

## The stack

kube-prometheus-stack is a Helm chart of the Prometheus community. It brings Prometheus, Alertmanager, Grafana, the Prometheus Operator, kube-state-metrics for the state of the cluster objects and node-exporter for the nodes. The operator adds types of its own. A ServiceMonitor tells Prometheus which services to scrape, a ScrapeConfig names targets outside the cluster, and a PrometheusRule holds rules.

Like the web shop, the stack comes from Git. The additions for part 5 are in the course repo under `platform/observability/repo`. You copy them over your platform repo and replace the placeholders with your addresses.

```bash
source /etc/cc-lab.env
cd ~/platform
cp -r ~/cc/platform/observability/repo/. .
sed -i "s#http://FRONTEND:3000#http://$CC_FE_IP:3000#" apps/*.yaml
sed -i "s/FRONTEND_IP/$CC_FE_IP/; s/NODE1_IP/$CC_NODE1_IP/; s/NODE2_IP/$CC_NODE2_IP/" monitoring/config/opennebula.yaml
git status
```

`git status` shows new applications in `apps`, the folder `monitoring`, the folder `ai` for chapters 5.5 and 5.6, and changed files in `webshop` and `templates/member`. Before you push, you store the Grafana password as a secret so that it stays out of Git.

::code{file="platform/observability/make-secrets.sh"}

```bash
~/cc/platform/observability/make-secrets.sh
```

The application `monitoring` takes the chart from the community repo and the values from your Gitea. Argo CD can combine several sources in one application for that.

::code{file="platform/observability/repo/apps/monitoring.yaml"}

::code{file="platform/observability/repo/monitoring/kube-prometheus-stack.yaml"}

k3s runs scheduler, controller manager and proxy in a single process. The monitors the chart ships for them would find nothing and stay red, so they are off.

## OpenNebula as a target

For the IaaS layer, OpenNebula ships exporters of its own in the package `opennebula-prometheus-kvm`. On the front-end, the OpenNebula exporter on port 9925 reports hosts, VMs and datastores as OpenNebula sees them. On the nodes, node_exporter on port 9100 shows the operating system, and the libvirt exporter on port 9926 shows the VMs as KVM sees them. Do not install the package `opennebula-prometheus`, it would bring a second Prometheus.

::code{file="platform/observability/install-exporters.sh"}

```bash
~/cc/platform/observability/install-exporters.sh
```

In the lab all six targets reported `ok`. The OpenNebula exporter needed about half a minute after starting before it knew the hosts. Prometheus reaches the exporters through three ScrapeConfigs with the addresses of your parameters.

::code{file="platform/observability/repo/monitoring/config/opennebula.yaml"}

## The web shop as a target

For the web shop, a ServiceMonitor next to its deployment is enough. Prometheus then scrapes every pod behind the service `webshop`.

::code{file="platform/observability/repo/webshop/servicemonitor.yaml"}

So far, the member NetworkPolicy of chapter 4.5 only admitted the own namespace and `kube-system`. Without a change, Prometheus would not reach `/metrics`. The new version of the template also admits the namespace `monitoring`.

::code{file="platform/observability/repo/templates/member/networkpolicy.yaml"}

Now you push everything. Argo CD rolls out the stack, in the lab it was synced and healthy 161 seconds after the push.

```bash
git add .
git commit -m "Monitoring with Prometheus, Grafana and the OpenNebula exporters"
git push
kubectl -n monitoring get pods
```

## PromQL

You reach Prometheus and Grafana from your computer through a tunnel again, Prometheus on port 30090 and Grafana on port 30300 of the server.

```bash
ssh -L 9090:<server-address>:30090 -L 3000:<server-address>:30300 mmuster-fe
```

At `http://localhost:9090/targets`, Prometheus lists every target with its state. In the lab all of them were `up`, including the jobs `opennebula`, `opennebula-hosts`, `opennebula-libvirt` and `webshop`. Under "Query" you try out queries.

| Query | Result |
|---|---|
| `up` | 1 for every reachable target, 0 otherwise |
| `opennebula_host_mem_usage_bytes / opennebula_host_mem_total_bytes` | share of each node's memory taken by VMs |
| `rate(webshop_requests_total[5m])` | requests per second, averaged over five minutes |
| `sum by (code) (rate(webshop_requests_total[5m]))` | the same, added up by status code |
| `histogram_quantile(0.95, sum by (le) (rate(webshop_request_duration_seconds_bucket[5m])))` | time within which 95 % of the requests are answered |

A counter on its own says little, it has been rising since the pod started. `rate()` turns it into a change per second and also copes with restarts, when the counter drops to zero. `sum by` combines time series and keeps only the labels you name. In the lab, the k3s VMs took 83 % of the memory OpenNebula can hand out on each node.

## Grafana

Grafana shows queries as dashboards. At `http://localhost:3000/` you sign in as `admin` with the password from `~/cc-lab/grafana.pass`. The chart brings dashboards for Kubernetes, such as "Kubernetes / Compute Resources / Namespace (Pods)". On top comes a dashboard of the platform team from Git, `monitoring/config/dashboard-wolkenwerk.yaml`. It shows OpenNebula hosts and VMs, traffic, errors and response time of the web shop, CPU per namespace and the members' memory against their quota. Grafana loads every config map with the label `grafana_dashboard` on its own.

::::exercise[Lab]
Roll out the stack, install the exporters and show in Prometheus that all targets are `up`. Open the dashboard "Wolkenwerk platform" and create traffic on the web shop with `curl`.

:::solution
`kubectl -n argocd get applications` shows `monitoring` and `monitoring-config` as `Synced` and `Healthy`. Under targets you find the job `opennebula` with one target, `opennebula-hosts` with three, `opennebula-libvirt` with two and `webshop` with one target per pod. After a few `curl http://<server-address>/`, the dashboard shows requests with code 200.
:::
::::

::::exercise[A query of your own]
Gemeinde Hinterbüel wants to know how many VMs are running in OpenNebula right now and how much CPU they claim in total. Write the queries.

:::solution
`count(opennebula_vm_state == 3)` counts the VMs in the active state, the exporter describes the states in the help text of its metric. `sum(opennebula_host_cpu_usage_ratio)` adds up the CPU OpenNebula has allocated to VMs on all nodes. For the real load instead of the allocation, use `sum(rate(opennebula_libvirt_cpu_seconds_total[5m]))` from the nodes.
:::
::::

::::exercise[Saturation]
Which query would have shown you in chapter 4.2 that the cluster had no room next to the VMs of parts 2 and 3?

:::solution
`opennebula_host_mem_total_bytes - opennebula_host_mem_usage_bytes` shows, per node, the memory OpenNebula can still hand out. With the web servers, the practice's VMs and the fiduciary office's service, it was below the 6 GB a cluster VM needs.
:::
::::
