---
title: Tools of the platform
description: Argo CD, Helm, Kustomize, Prometheus, Alertmanager, Grafana, Loki, Alloy and Sealed Secrets with their purpose, architecture, main terms, the version the course uses and how the lab installs them.
sidebar:
  order: 5
---

:::goals
After this chapter you can:

- Say for each platform tool what it does, how it gets into the lab and which chapter introduces it
- Describe the architecture of Argo CD, the monitoring stack and Sealed Secrets in a few sentences
- Tell Helm and Kustomize apart and explain how Argo CD uses both
- Find the versions in your platform repo and open the documentation for the same version
- Check in your lab how each tool runs, using commands that change nothing
:::

Part 4 brings in nine tools, and each chapter introduces a tool where it is needed. This supplement gathers purpose, architecture, terms and installation in one place. OpenTofu and Gitea are left out here because chapters [4.2](../../platform/opentofu/) and [4.4](../../platform/gitops/) cover them in depth.

## Overview

| Tool | Job | Version in the lab | How it gets into the lab | Chapter |
|---|---|---|---|---|
| Argo CD | keeps the cluster in line with Git | 3.5.6, chart argo-cd 10.11.6 | Helm, once through `bootstrap-argocd.sh` | [4.4](../../platform/gitops/), [4.5](../../platform/templates/) |
| Helm | installs packages called charts | 4.3.0 | Helm package repository through `install-tools.sh` | [4.2](../../platform/opentofu/), [4.4](../../platform/gitops/) |
| Kustomize | builds manifests from a template and patches | 5.8.1 inside kubectl 1.36.6 | built into kubectl and Argo CD | [4.5](../../platform/templates/) |
| Prometheus | scrapes metrics and evaluates rules | 3.15.1, chart kube-prometheus-stack 92.17.0 | Argo CD, application `monitoring` | [5.1](../../observability/metrics/) |
| Alertmanager | groups alerts and routes them | 0.34.2, chart kube-prometheus-stack 92.17.0 | Argo CD, application `monitoring` | [5.3](../../observability/slo/) |
| Grafana | shows queries as dashboards | 13.3.0, chart kube-prometheus-stack 92.17.0 | Argo CD, application `monitoring` | [5.1](../../observability/metrics/), [5.2](../../observability/logs/) |
| Loki | stores logs | 3.6.16, chart loki 7.5.0 | Argo CD, application `loki` | [5.2](../../observability/logs/) |
| Alloy | collects the logs of the pods | 1.21.3, chart alloy 1.15.0 | Argo CD, application `alloy` | [5.2](../../observability/logs/) |
| Sealed Secrets | encrypts Secrets for Git | 0.41.2, chart sealed-secrets 2.22.0 | Argo CD, application `sealed-secrets`, plus `kubeseal` through `install-kubeseal.sh` | [6.1](../../operations/security/), [6.2](../../operations/backup/) |

![The tools of the platform. At the top the front-end with Helm, Gitea and kubeseal. Helm installs Argo CD once with bootstrap-argocd.sh into the namespace argocd. Argo CD polls your platform repo in Gitea every minute. It renders folders such as webshop/ and members/ with Kustomize, which brings the web shop and the members into the namespaces velo and gemeinde. It renders charts with Helm, which brings Prometheus, Alertmanager, Grafana, Loki and Alloy into the namespace monitoring and the Sealed Secrets controller into kube-system. kubeseal encrypts a Secret, and seal-secrets.sh puts it into your repo as a SealedSecret. Notice that Helm on the front-end only installs Argo CD. Argo CD brings everything else from Git into the cluster.](../../../../assets/figures/en/ex-tools.svg)

Your platform repo pins the chart versions in the `targetRevision` of the applications in `apps/`, and `bootstrap-argocd.sh` in the course repo pins the version of Argo CD. A chart has a version number of its own and names the version of the program it installs in `appVersion`, so chart argo-cd 10.11.6 brings Argo CD 3.5.6. `install-tools.sh` installs the latest Helm from its package repository and kubectl from the 1.36 series. The links on this page go to the documentation of the versions in the table, because fields and defaults change between versions.

Almost everything reaches the cluster through Argo CD. It fetches your repo from Gitea, renders charts with Helm and folders with Kustomize, and applies the result.

## Argo CD

Argo CD is a CNCF project and a GitOps controller. It compares the desired state in Git with the actual state in the cluster and corrects any drift. Several components run in the `argocd` namespace for this, as the [architecture page](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/architecture/) shows.

| Component | Job |
|---|---|
| API server | web UI and API, a NodePort on 30080 in the lab |
| Repository server | fetches the repos, renders the manifests with Helm or Kustomize and caches them |
| Application controller | compares desired and actual state, runs the sync and reports sync status and health |
| ApplicationSet controller | generates applications from a pattern, one per folder under `members` in the course |
| Redis | cache for the other components |

An application connects a source in Git with a destination in the cluster. The sync status says whether the cluster matches Git (`Synced` or `OutOfSync`), and health says whether the objects work (`Healthy`, `Progressing` or `Degraded`). A refresh only compares, while a sync applies. Prune deletes what has disappeared from Git, and self-heal reverts changes made by hand. If a folder contains a `Chart.yaml`, Argo CD renders it with Helm, with a `kustomization.yaml` it uses Kustomize, and otherwise it takes the files as they are. Every object Argo CD manages carries the annotation `argocd.argoproj.io/tracking-id`. The [core concepts](https://argo-cd.readthedocs.io/en/release-3.5/core_concepts/) are in the Argo CD 3.5 documentation.

The script `bootstrap-argocd.sh` from [chapter 4.4](../../platform/gitops/) installs the chart with Helm. Its values switch off Dex, which handles logins through other accounts, and the notifications service. The UI answers without TLS, and Argo CD polls Git every minute instead of every three minutes. The script then creates the Secret with the read-only token for Gitea and applies `root.yaml`, and from there everything comes from Git. Argo CD applies manifests the way `kubectl apply` does. The `monitoring` application sets `ServerSideApply=true` because the Prometheus Operator's definitions are too large for the annotation a regular `apply` writes. AppProjects of your own besides `default` are part of the [advanced tasks of chapter 4.6](../../platform/advanced/).

## Helm

Helm is a package manager for Kubernetes. A chart is a package of manifest templates, a `values.yaml` file with defaults and a `Chart.yaml` file with `version` and `appVersion`. Charts live in repositories, the Argo CD ones for example at `https://argoproj.github.io/argo-helm`. A release is an installed chart in a cluster. You supply your own values with `-f values.yaml` or `--set`. Helm stores its releases as Secrets in the cluster, so it needs no database of its own. The [introduction to Helm](https://helm.sh/docs/intro/introduction/) explains these terms for Helm 4.

The Helm on the front-end creates exactly one release in the course, `argocd` in the `argocd` namespace, through `helm upgrade --install` in the bootstrap script. For the charts of parts 5 and 6, Argo CD only produces manifests with `helm template` and manages them itself, as the [Argo CD documentation on Helm](https://argo-cd.readthedocs.io/en/release-3.5/user-guide/helm/) describes. That is why `helm list` does not show them, and a rollback means `git revert`. k3s uses Helm too. Its built-in [Helm controller](https://docs.k3s.io/add-ons/helm) installs Traefik from HelmChart objects in `kube-system`.

## Kustomize

Kustomize builds manifests from plain YAML, without a template language. A `kustomization.yaml` file lists the files of a folder under `resources` and pulls in components under `components`. With `namespace` it sets the namespace of every object, and with `patches` it changes single fields. A patch is either a JSON patch with operations such as `op: replace` or a strategic merge patch, a piece of YAML that Kustomize merges into the original. A [component](https://kubectl.docs.kubernetes.io/guides/config_management/components/) with `kind: Component` is a building block that several folders can include.

In the course, `templates/member` from [chapter 4.5](../../platform/templates/) is such a component, with a namespace, ResourceQuota, LimitRange and NetworkPolicy. `members/velo` sets the namespace `velo` and replaces the value of `requests.cpu` with a JSON patch. The `webshop/` folder has a `kustomization.yaml` as well. `kubectl kustomize` shows the result without applying anything. Argo CD ships its own Kustomize and Helm inside the repository server. The [Kubernetes 1.36 documentation](https://v1-36.docs.kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/) and the [patches reference](https://kubectl.docs.kubernetes.io/references/kustomize/kustomization/patches/) describe every field.

| | Helm | Kustomize |
|---|---|---|
| Approach | templates with placeholders, filled from values | finished YAML, changed by patches |
| Package | a versioned chart in a repository | a folder in Git |
| Used in the course for | other projects' software such as Argo CD, Loki and Sealed Secrets | the course's own manifests, the web shop and the members |

## Prometheus

Prometheus scrapes metrics from its targets over HTTP at fixed intervals and stores them as time series on disk. You query them in PromQL. Prometheus evaluates rules at regular intervals. Recording rules store their result as a new time series, and alerting rules send firing alerts to Alertmanager. Systems without a `/metrics` page of their own get an exporter, such as the OpenNebula exporter on port 9925.

In the lab, Prometheus comes with the chart kube-prometheus-stack from [chapter 5.1](../../observability/metrics/). Besides Prometheus, Alertmanager and Grafana, the chart brings three more parts. The Prometheus Operator 0.94.2 introduces object types of its own and generates the Prometheus configuration from them. The kube-state-metrics service reports the state of the objects in the cluster, such as the ready pods of a deployment, and the node-exporter runs as a DaemonSet that reports on each node.

| Object type | Contents | In the course |
|---|---|---|
| ServiceMonitor | which services Prometheus scrapes | `webshop` in `velo`, every 15 seconds |
| ScrapeConfig | targets outside the cluster | the OpenNebula exporters |
| PrometheusRule | recording and alerting rules | the web shop SLO from [chapter 5.3](../../observability/slo/) |

The course values keep data for three days on a 5 GiB volume and open NodePort 30090. Prometheus reads monitors and rules from every namespace, including those that do not come from the chart. The monitors for etcd, scheduler, controller manager and proxy are off, because k3s runs these parts in a single process. The [PromQL basics](https://prometheus.io/docs/prometheus/3.15/querying/basics/) apply to Prometheus 3.15, and the [operator's object types](https://prometheus-operator.dev/docs/getting-started/design/) are described on its website.

## Alertmanager

Alertmanager receives the alerts from Prometheus and decides who hears about them. It groups alerts with the same labels and sends a group only once per interval. Inhibition suppresses notifications while certain other alerts are already firing, and a silence mutes alerts for a set time. Routes assign alerts to a receiver by their labels, for example a webhook or an email address. The [Alertmanager 0.34 documentation](https://prometheus.io/docs/alerting/0.34/alertmanager/) explains these terms.

In the lab, Alertmanager runs from the same chart on NodePort 30093. The course values group by `alertname` and `namespace` and send every alert to the receiver `null`, which sends nothing, so alerts only appear in the UI. There you also find `Watchdog`, a rule of the chart that always fires and shows that the path from Prometheus to Alertmanager works. [Chapter 5.3](../../observability/slo/) explains the routing, and you set up a receiver of your own in the [advanced tasks of chapter 5.5](../../observability/advanced/).

## Grafana

Grafana shows queries as dashboards. A [data source](https://grafana.com/docs/grafana/v13.3/datasources/) is the connection to a store such as Prometheus or Loki. A [dashboard](https://grafana.com/docs/grafana/v13.3/dashboards/) is made of panels, and each panel shows one or more queries. Under "Explore" you try queries without a dashboard.

In the lab, Grafana is part of the chart kube-prometheus-stack and listens on NodePort 30300. The chart sets up the Prometheus data source itself, and Loki is added through `additionalDataSources` in the values. The password of `admin` lives in the Secret `grafana-admin`, which comes from a SealedSecret from [chapter 6.1](../../operations/security/) on. A sidecar, an extra container in the Grafana pod, loads every ConfigMap with the label `grafana_dashboard` as a dashboard, including the platform team's dashboard from [chapter 5.1](../../observability/metrics/). Grafana has no volume in the lab. Whatever you change in the UI is lost when the pod restarts, so dashboards belong in Git.

## Loki

Loki stores logs and indexes only their labels, such as namespace and pod, not the text. All lines with the same labels form a stream. Loki stores the text compressed in chunks and only searches it when a LogQL query runs. A query either returns lines or turns lines into a metric, for example with `count_over_time`. The [Loki 3.6 overview](https://grafana.com/docs/loki/v3.6.x/get-started/overview/) describes the architecture, and the [LogQL page](https://grafana.com/docs/loki/v3.6.x/query/) the queries.

In the lab, Loki runs in monolithic mode, which the chart calls `SingleBinary`. All components share one process, the data sits on the file system of a 5 GiB volume, and the compactor deletes it after 72 hours. The [page on deployment modes](https://grafana.com/docs/loki/v3.6.x/get-started/deployment-modes/) suggests this mode for small volumes of up to about 20 GB a day. There is no authentication, and Grafana and Alloy reach Loki at `loki.monitoring.svc:3100`. [Chapter 5.2](../../observability/logs/) explains which labels belong in the index.

## Alloy

Alloy by Grafana collects data such as metrics and logs and sends it on. Its configuration consists of [components](https://grafana.com/docs/alloy/v1.21/get-started/components/). Each one does a single job, takes arguments and exports values that other components use, and together they form a pipeline.

In the lab, Alloy runs as a DaemonSet with one pod per node. The pipeline from [chapter 5.2](../../observability/logs/) has four links. `discovery.kubernetes` finds the pods, `discovery.relabel` turns them into the labels `namespace`, `pod`, `container` and `app`, `loki.source.kubernetes` reads the logs, and `loki.write` sends them to Loki. The component [`loki.source.kubernetes`](https://grafana.com/docs/alloy/v1.21/reference/components/loki/loki.source.kubernetes/) reads logs through the Kubernetes API and could reach every pod in the cluster. That is why `discovery.kubernetes` in each instance uses a selector on `spec.nodeName` to find only the pods of its own node. Alloy gets the node name as the variable `NODE_NAME` from its own pod.

## Sealed Secrets

A Secret in Git would be readable by anyone who can read the repo. Sealed Secrets solves this with two parts. A controller in the cluster creates a key pair. `kubeseal` on the front-end fetches the public key and uses it to encrypt a Secret into a SealedSecret, which may go into Git. Only the controller can open it with its private key, and it then creates a regular Secret owned by the SealedSecret. In the default scope `strict`, name and namespace are part of the encryption. The controller renews its key every 30 days and keeps the old ones. If the private keys are lost, nobody can open a SealedSecret anymore, which is why [chapter 6.2](../../operations/backup/) backs them up on the front-end. The [Sealed Secrets 0.41.2 documentation](https://github.com/bitnami/sealed-secrets/blob/v0.41.2/README.md) explains the variants.

In the lab, the application `sealed-secrets` from [chapter 6.1](../../operations/security/) puts the controller into `kube-system` under the name `sealed-secrets-controller`, where `kubeseal` looks for it. `install-kubeseal.sh` installs `kubeseal` and checks its checksum. `seal-secrets.sh` writes the Grafana password to `secrets/grafana-admin.yaml` in the platform repo, and the application `secrets` takes it from there into the cluster.

## In the lab

From part 6 on all nine tools are in use. The following commands on the front-end only read and change nothing.

```bash
helm list -A
grep -h -A1 'chart:' ~/platform/apps/*.yaml
```

Helm lists only releases it installed itself, among them `argocd` with the chart `argo-cd-10.11.6`. `grep` shows each application's chart and the version pinned in Git.

```bash
kubectl -n argocd get pods
kubectl -n argocd get applications
```

You see one pod each for the server, the repository server, the application controller, the ApplicationSet controller and Redis, plus every application with its sync status and health.

```bash
kubectl api-resources --api-group=argoproj.io
kubectl api-resources --api-group=monitoring.coreos.com
kubectl api-resources --api-group=bitnami.com
```

The output lists the object types that Argo CD, the Prometheus Operator and Sealed Secrets add to the cluster, such as `applications`, `servicemonitors` and `sealedsecrets`.

```bash
kubectl get servicemonitors,scrapeconfigs,prometheusrules -A
kubectl -n monitoring get configmaps -l grafana_dashboard
```

The first command shows where Prometheus gets its targets and rules, from the chart and from your repo. The second lists the dashboards Grafana loads.

```bash
kubectl -n monitoring get pods -o wide | grep -E 'loki|alloy'
kubectl get sealedsecrets -A
kubectl version --client
```

Loki runs in one pod and Alloy in one pod per node. The SealedSecret `grafana-admin` shows `True` in the `SYNCED` column once the controller has decrypted it. The last command prints the Kustomize version next to the kubectl version.

::::exercise[Lab]
Make a table of the nine tools for your lab. For each one, note how it got into the lab, which version runs, which namespace or VM it lives in and which file holds its settings. Then explain why `helm list -A` does not show the charts of part 5. What happens when you change the `targetRevision` of Loki in your platform repo and push?

:::solution
Argo CD 3.5.6 came from chart 10.11.6 through Helm and runs in `argocd`, with its values in `platform/argocd/values.yaml` of the course repo. Helm and kubectl are packages on the front-end, `helm version` and `kubectl version --client` print their versions, and kubectl also prints the Kustomize version. Kustomize has no installation of its own, its files are the `kustomization.yaml` files in `webshop/`, `templates/member/` and `members/`. Prometheus, Alertmanager and Grafana come through the application `monitoring` with kube-prometheus-stack 92.17.0 into `monitoring`, with values in `monitoring/kube-prometheus-stack.yaml`. Loki and Alloy come through `apps/loki.yaml`, with values in `monitoring/loki.yaml` and `monitoring/alloy.yaml`. The Sealed Secrets controller comes through `apps/sealed-secrets.yaml` into `kube-system`, and `kubeseal` sits in `/usr/local/bin` on the front-end.

`helm list -A` only shows releases Helm installed itself, which means `argocd` and, depending on the version, the releases k3s uses to set up Traefik. Argo CD renders the other charts with `helm template` and applies the manifests itself, so no Helm release exists for them. After the push, Argo CD notices the new `targetRevision` within one to two minutes, renders the new chart version with your values and updates the objects. `git revert` takes you back. Read the upgrade notes of the chart first, since new versions sometimes change the structure of the values.
:::
::::
