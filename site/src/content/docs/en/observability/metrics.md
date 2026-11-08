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
After this chapter you can:

- Name the four golden signals and explain what monitoring is for
- Explain the Prometheus model with time series, labels, exporters and pulling
- Roll out the monitoring stack through Argo CD from your platform repo
- Add OpenNebula and the web shop as targets
- Write simple PromQL queries and show them in Grafana
:::

## The purpose of monitoring

Monitoring should show what is broken and why. Customers often notice that something is wrong, for example when the shop is slow. The reason only shows up inside the system, such as full disks or a node without free memory. Google's book "Site Reliability Engineering" names **four golden signals** worth measuring for every service.

| Signal | Question | For the web shop |
|---|---|---|
| Latency | How long does an answer take? | response time of `/` |
| Traffic | How much is asked for? | requests per second |
| Errors | How much goes wrong? | share of 5xx answers |
| Saturation | How full is the system? | CPU of the pods, memory of the nodes |

## Prometheus

Prometheus stores time series. A **time series** is a name with labels and a sequence of timestamped values.

```text
webshop_requests_total{code="200", path="/", pod="webshop-599c7b4f94-4htg9"}  1532
```

Prometheus pulls the values itself, usually every 15 to 30 seconds. Every target offers a text page at `/metrics`. Programs that cannot do that get an **exporter**, a small program that collects values and prints them in the Prometheus format. The web shop of chapter 4.4 already has `/metrics` built in.

| Type | Meaning | Example |
|---|---|---|
| Counter | only counts up, until a restart | `webshop_requests_total` |
| Gauge | can go up and down | `opennebula_host_mem_usage_bytes` |
| Histogram | counts values in buckets, for percentiles | `webshop_request_duration_seconds_bucket` |

## The stack

kube-prometheus-stack is a Helm chart of the Prometheus community. It contains Prometheus, Alertmanager, Grafana, the Prometheus Operator, kube-state-metrics for the state of the cluster objects and node-exporter for the nodes. The operator adds resource types of its own. A **ServiceMonitor** tells Prometheus which services to scrape, a **ScrapeConfig** names targets outside the cluster, and a PrometheusRule holds rules.

Like the web shop, the stack comes from Git. The additions for part 5 are in the course repo under `platform/observability/repo`. You copy them over your platform repo and replace the placeholders with your addresses.

```bash
source /etc/cc-lab.env
cd ~/platform
cp -r ~/cc/platform/observability/repo/. .
sed -i "s#http://FRONTEND:3000#http://$CC_FE_IP:3000#" apps/*.yaml
sed -i "s/FRONTEND_IP/$CC_FE_IP/; s/NODE1_IP/$CC_NODE1_IP/; s/NODE2_IP/$CC_NODE2_IP/" monitoring/config/opennebula.yaml
git status
```

`git status` shows new applications in `apps`, the folder `monitoring` and changed files in `webshop` and `templates/member`. Before you push, you store the Grafana password as a [secret](https://v1-36.docs.kubernetes.io/docs/concepts/configuration/secret/) so that it stays out of Git.

::code{file="platform/observability/make-secrets.sh"}

```bash
~/cc/platform/observability/make-secrets.sh
```

The application `monitoring` takes the chart from the community repo and the values from your Gitea. Argo CD can combine [several sources in one application](https://argo-cd.readthedocs.io/en/release-3.5/user-guide/multiple_sources/) for that.

::code{file="platform/observability/repo/apps/monitoring.yaml"}

::code{file="platform/observability/repo/monitoring/kube-prometheus-stack.yaml"}

k3s runs scheduler, controller manager and proxy in a single process. The monitors the chart ships for them would find nothing and stay red, so they are switched off. The [chart's README for version 92.17.0](https://github.com/prometheus-community/helm-charts/tree/kube-prometheus-stack-92.17.0/charts/kube-prometheus-stack) covers the installation, the values and, for Argo CD, the option `ServerSideApply`.

## OpenNebula as a target

For the IaaS layer, OpenNebula ships exporters of its own in the package `opennebula-prometheus-kvm`. The OpenNebula exporter runs on the front-end and reports hosts, VMs and datastores on port 9925 as OpenNebula sees them. On the front-end and on both nodes, node_exporter on port 9100 reports the values of the operating system. The nodes also run the libvirt exporter on port 9926, which shows the VMs as KVM sees them. Do not install the package `opennebula-prometheus`. It would bring a second Prometheus. For the exporters, the script below follows the [OpenNebula 7.4 guide](https://docs.opennebula.io/7.4/product/cloud_system_administration/prometheus/install/), which installs that package as well.

::code{file="platform/observability/install-exporters.sh"}

```bash
~/cc/platform/observability/install-exporters.sh
```

In the lab all six targets reported `ok`. The OpenNebula exporter knew the hosts a few seconds to half a minute after starting. Prometheus reaches the exporters through three [ScrapeConfigs](https://github.com/prometheus-operator/prometheus-operator/blob/v0.94.2/Documentation/developer/scrapeconfig.md#use-scrapeconfig-to-scrape-an-external-target) with the addresses of your parameters. Prometheus only picks up new ScrapeConfigs and ServiceMonitors once the config reloader sees the changed configuration. In the lab the jobs of the targets outside the cluster appeared two to five minutes after the push, and the job `webshop` after almost four minutes.

In Prometheus, "Status › Target health" shows every target with its state.

![The targets in Prometheus under Target health. The three ScrapeConfigs opennebula, opennebula-hosts and opennebula-libvirt collect the values from the front-end and the nodes. Each of the six targets is UP, next to its labels and the time of its last scrape.](../../../../assets/screenshots/prometheus-targets.png)

![What Prometheus scrapes. On the left the k3s cluster. Prometheus runs in the namespace monitoring and scrapes the metrics in the cluster from the web shop in the namespace velo, from kube-state-metrics and from node-exporter on k3s-server and k3s-agent. Outside the cluster it scrapes the OpenNebula exporter on port 9925 and node_exporter on port 9100 on the front-end, and node_exporter on port 9100 and the libvirt exporter on port 9926 on both nodes. Grafana queries Prometheus with PromQL. Inside the cluster Prometheus finds its targets through ServiceMonitors, outside through three ScrapeConfigs.](../../../../assets/figures/en/p5c1-scrape.svg)

::code{file="platform/observability/repo/monitoring/config/opennebula.yaml"}

## The web shop as a target

For the web shop, a [ServiceMonitor](https://github.com/prometheus-operator/prometheus-operator/blob/v0.94.2/Documentation/developer/getting-started.md#using-servicemonitors) next to its deployment is enough. Prometheus then scrapes every pod behind the service `webshop`.

::code{file="platform/observability/repo/webshop/servicemonitor.yaml"}

So far, the member [NetworkPolicy](https://v1-36.docs.kubernetes.io/docs/concepts/services-networking/network-policies/) of chapter 4.5 only admitted traffic from the member's own namespace and `kube-system`. Without a change, Prometheus would not reach `/metrics`. The new version of the template also admits the namespace `monitoring`.

::code{file="platform/observability/repo/templates/member/networkpolicy.yaml"}

Once you have pushed everything, Argo CD rolls out the stack. In the lab it was synced and healthy after two to five minutes. Argo CD sees the new applications in `apps` only at its next poll of the repo, then each of them loads its charts and images.

```bash
git add .
git commit -m "Monitoring with Prometheus, Grafana and the OpenNebula exporters"
git push
kubectl -n monitoring get pods
```

## PromQL

Like Argo CD, you reach Prometheus and Grafana through a tunnel, Prometheus on port 30090 and Grafana on port 30300 of the server. You open the tunnel from the client, which is the Kali VM on smartlearn and your PC with an own hypervisor.

```bash
ssh -L 9090:<server-address>:30090 -L 3000:<server-address>:30300 mmuster-fe
```

In the browser of the client, `http://localhost:9090/targets` lists every target with its state. All of them were `up` in the lab, including the OpenNebula jobs `opennebula`, `opennebula-hosts` and `opennebula-libvirt` and the job `webshop`. Under "Query" you try out queries.

| Query | Result |
|---|---|
| `up` | 1 for every reachable target, 0 otherwise |
| `opennebula_host_mem_usage_bytes / opennebula_host_mem_total_bytes` | share of each node's memory taken by VMs |
| `rate(webshop_requests_total[5m])` | requests per second, averaged over five minutes |
| `sum by (code) (rate(webshop_requests_total[5m]))` | the same, added up by status code |
| `histogram_quantile(0.95, sum by (le) (rate(webshop_request_duration_seconds_bucket[5m])))` | time within which 95% of the requests are answered |

A counter on its own says little, because it only rises from the moment the pod starts. `rate()` turns it into a change per second and also copes with restarts, when the counter drops to zero. `sum by` combines time series and keeps only the labels you name. According to the second query, the k3s VMs took 83% of the memory OpenNebula can hand out on each node in the lab.

## Grafana

Grafana shows queries as dashboards. In the browser of the client, you sign in at `http://localhost:3000/` as `admin`, with the password from `~/cc-lab/grafana.pass` on the front-end. The chart brings dashboards for Kubernetes, such as "Kubernetes / Compute Resources / Namespace (Pods)". The platform team adds a dashboard of its own from Git, `monitoring/config/dashboard-wolkenwerk.yaml`. It shows OpenNebula hosts and VMs, traffic, errors and response time of the web shop, CPU per namespace and the members' memory against their quota. Grafana loads every ConfigMap with the label `grafana_dashboard` by itself.

![The dashboard Wolkenwerk platform in Grafana during a load test. At the top, tiles count the hosts and VMs in OpenNebula, the requests per second and the share of errors of the web shop. Below are the allocated memory of the nodes and the CPU of the k3s VMs as libvirt sees it, and at the bottom the requests by status code and the response time.](../../../../assets/screenshots/grafana-dashboard.png)

:::caution[Changes in Grafana are lost]
The dashboard comes from a ConfigMap, and Grafana has no volume in the lab. Whatever you change in the Grafana interface is gone after the next restart of the pod, including a panel of your own for milestone 3. A panel you want to keep therefore belongs in Git.
:::

For a panel of your own, copy an existing panel in `monitoring/config/dashboard-wolkenwerk.yaml` and give it your own `title`, your query in `expr` and a free place in `gridPos`, for example below the existing panels with `"y": 28`. The panels in the file have no `id`, and yours needs none either. Then push the change. For a panel you designed in Grafana, the panel menu shows its JSON under "Inspect" and "Panel JSON". The [JSON model of Grafana 13.3](https://grafana.com/docs/grafana/v13.3/dashboards/build-dashboards/view-dashboard-json-model/) describes the fields of a dashboard and its panels.

::::exercise[Lab]
Roll out the stack, install the exporters and show in Prometheus that all targets are `up`. Open the dashboard "Wolkenwerk platform" and create traffic on the web shop with `curl`.

:::solution
`kubectl -n argocd get applications` shows `monitoring` and `monitoring-config` as `Synced` and `Healthy`. Under Targets you find the job `opennebula` with one target, `opennebula-hosts` with three, `opennebula-libvirt` with two and `webshop` with one target per pod. After a few `curl http://<server-address>/`, the dashboard shows requests with code 200.
:::
::::

::::exercise[A query of your own]
Gemeinde Hinterbüel wants to know how many VMs are running in OpenNebula right now and how much CPU they claim in total. Write the queries.

:::solution
`count(opennebula_vm_state == 3)` counts the VMs in the active state. The help text of the metric says which number stands for which state. `sum(opennebula_host_cpu_usage_ratio)` adds up the CPU OpenNebula has allocated to VMs on all nodes. For the real load instead of the allocation, use `sum(rate(opennebula_libvirt_cpu_seconds_total[5m]))` from the nodes.
:::
::::

::::exercise[Saturation]
Which query would have shown you in chapter 4.2 that the cluster had no room next to the VMs of parts 2 and 3?

:::solution
`opennebula_host_mem_total_bytes - opennebula_host_mem_usage_bytes` shows, per node, the memory OpenNebula can still hand out. With the web servers, the practice's VMs and the fiduciary office's service, it was below the 6 GB a cluster VM needs.
:::
::::
