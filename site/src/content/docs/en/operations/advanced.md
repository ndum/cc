---
title: Advanced tasks
description: A fifth member of your own with group, VM, namespace and alert, the cluster restored from a snapshot with an SLA based on the measured time, a postmortem from a draft by the model, and a cost model for the member.
sidebar:
  order: 5
  badge:
    text: Advanced
    variant: note
---

:::assignment
"A fifth organization wants to join us," writes Simone Wyss. "Please bring them onto our platform the same way as the other four. Before they sign, they want to know how fast we are back after a serious failure and what we can promise them. If something goes wrong for them, the board wants an honest report. And Beat Kläy is already asking what they will cost us and what we should charge them."
:::

:::goals
After this chapter you can:

- Onboard a new member in OpenNebula and in the cluster
- Route a member's alerts to a service of your own and justify that service's rights
- Restore the cluster from an etcd snapshot and measure the time
- Base an SLA on measured times and on the architecture
- Build the timeline of a postmortem from data and correct a model's draft
- Derive a price for a member from the full cost
:::

## Ground rules

The three tasks set a goal and requirements, and you design the way there yourself, building on the state of your base for milestone 4. The sections before the tasks explain the concepts and point out where you have to weigh options. You find commands and files in the documentation and in the chapters the hints point to.

Plan four to six hours for all three tasks. You show them together, live in class or in a screencast, as the page [milestone 4](../../assessment/milestone-4/#showing-the-advanced-tasks) describes, and you answer the two questions from the check `m4` during the showing. You may use AI assistants under the [rules of the course](../../start/overview/#ai-tools). Your documentation states what you used them for, and you must be able to explain everything you show.

Each task is worth 0 to 3 points by the [levels of the advanced tasks](../../assessment/#levels-of-the-advanced-tasks). For 3 points you justify a decision of your own with an alternative and a trade-off, and the sections below name some opportunities for that.

Task A needs your triage service from advanced task B of milestone 3, which [chapter 5.5](../../observability/advanced/#task-b--triage-with-approval) describes. Tasks B and C build on the member from task A.

## Designing a member

You choose the fifth member freely. It should be a small organization from the region that fits a cooperative like Wolkenwerk, with a service on a VM and an application in the cluster. If no idea of your own comes to mind, the table has some.

| Idea | What it needs |
|---|---|
| Daycare center | registrations with children's data, a website for parents |
| Music school | timetable and billing, peaks at the start of each semester |
| Physiotherapy practice | appointments and treatment notes under professional secrecy |
| Neighborhood association | website and member list, small budget |
| Bakery with orders | orders until 6 p.m., peaks before holidays |
| Architecture firm | large plans, backups matter more than availability |

Before you create anything, assess the protection needs. As in [chapter 6.1](../security/#protection-needs), you rate confidentiality, integrity and availability and justify each level. The later decisions follow from that rating, such as the size of the quota, the rights of the triage service, the RPO in the SLA and the price. A physiotherapy practice with notes under professional secrecy needs different answers than a neighborhood association with a public website.

The lab sets two limits. Next to the k3s VMs the nodes have little memory left, so the member's VM gets at most 1 GB. In the lab, a VM with 1 GB ran next to the k3s server, and the node swapped out around 200 MB for it. The application in the cluster must meet the profile `restricted`, which the template has required in every member namespace since chapter 6.1. A static website with the image `nginxinc/nginx-unprivileged` is enough, and so is a small app of your own.

## A member on two layers

A member exists on both layers of the platform. In OpenNebula it is a group with a group admin in a VDC, with a quota and with prices for showback. In the cluster it is a folder in `members/` that Argo CD turns into a namespace with ResourceQuota, LimitRange, NetworkPolicy and the profile `restricted`. The two layers know nothing of each other. Only the names and your documentation show that the group and the namespace belong to the same member.

For the four members, the script from [chapter 3.1](../../tenants/groups/) and the pull requests from [chapter 4.5](../../platform/templates/#the-municipalitys-request) did this work. For the fifth, you decide the order of the steps and what you do by hand, with a script of your own or through Git. A script takes longer for the first member, but it records every step and you can reuse it for the next one. The VDC is a decision too. In the VDC `wolkenwerk` the new member shares the cluster with the other four, while a VDC of its own can give it a different slice, such as a single node.

The limits call for a trade-off. A generous quota spares the member requests to the platform team. In the price model of [chapter 6.4](../cost/#a-price-for-the-new-member), however, it counts as reserved capacity and makes the member more expensive. A tight quota suits a small budget but holds back an application that has to grow at peak times. The quota in OpenNebula and the ResourceQuota in the cluster are two separate limits, and you justify each of them on its own.

## Alerts for a member

A member's rules belong in its folder of the platform repo as a `PrometheusRule`. They then arrive with the member's pull request and leave with it. The kube-prometheus-stack values from chapter 5.1 let Prometheus read the rules of every namespace, so you need no special label for the selector.

A good alert reports a symptom that the member's customers notice, as [chapter 5.3](../../observability/slo/#symptoms-and-causes) explains. For a small website it is often enough to ask whether a pod is still ready, and the metrics of kube-state-metrics describe every deployment for that. The duration in `for` sets how long the condition has to hold before the alert fires. If it is too short, the alert already reports an ordinary restart. If it is too long, the alert comes late.

The labels of an alert carry what a receiver needs to know. Metrics about a deployment bring `namespace` and `deployment`, from which your triage service can tell its target. You add further labels such as `severity` in the rule yourself.

Alertmanager forwards alerts through a tree of routes. Every alert enters at the top route, and the first child route whose matchers fit its labels takes it. With `continue`, Alertmanager also checks the routes that follow. In the base there is only the top route with the receiver `null`. For your member you decide how Alertmanager recognizes the alerts meant for triage, for example by the alert name, by the namespace or by a label of your own that every rule for triage carries. One route per member is easy to read, but you change the Alertmanager values for every new member. With a shared label the members' rules decide, and the route stays the same. `amtool config routes test` shows which route an alert with given labels takes, as the [Alertmanager README](https://github.com/prometheus/alertmanager/blob/v0.34.2/README.md#amtool) describes.

You fire the alert through Git, for example with zero replicas or an image that does not exist. In the course lab, the alert came two minutes after the last pod was gone, and the triage service proposed a restart. The team rejected it, because a restart starts no pod as long as Git asks for zero replicas. Argo CD keeps restoring the state from Git, so the fault is only fixed once the right state is back in Git.

## Rights of the triage service

Under the requirements of milestone 3, your triage service only has the rights it needs for the web shop. For the new member you decide whether it may read or do anything there. In Kubernetes that means a `Role` with a `RoleBinding` in the member's namespace, whereas a `ClusterRole` with a `ClusterRoleBinding` would apply to every namespace at once. [Chapter 6.1](../security/#rights-on-the-platform) explains the roles, and `kubectl auth can-i` with `--as` checks what a ServiceAccount is really allowed to do.

Rights in Kubernetes only apply to requests to the Kubernetes API. They do not protect the logs your service fetches from Loki. In the lab, Loki runs with `auth_enabled: false` and gives anyone who reaches it the logs of every namespace. Whether your service reads the new member's logs is therefore something you decide in the service itself.

The trade-off depends on the protection needs. Without rights and logs, the model lacks context and its proposal stays generic. With read access it sees more, including the member's data, since logs can contain personal data. With the right to restart a deployment, a wrong proposal can do damage after a careless approval. You decide what your service may do for the member and justify it with the member's rating.

## Restoring from a snapshot

In the base you switched the cluster to etcd and copied the snapshots, together with the token and the Sealed Secrets key, to the front-end. A snapshot is a copy of the whole cluster database at one point in time. It holds every object, including the secrets, the Argo CD applications and the Argo CD password. It does not hold the data in volumes. Metrics, logs and anything else that pods write to a disk live outside the database.

A snapshot cannot be used without the old server's token. The token encrypts confidential data in the database, as the k3s page [Backup and Restore](https://docs.k3s.io/datastore/backup-restore) describes. That is why the token is stored with the snapshots on the front-end.

On a single server, k3s resets the database to a snapshot with the options `--cluster-reset` and `--cluster-reset-restore-path`. The server becomes the only member of a new etcd cluster with the content of the snapshot. If the server itself is lost, a new server needs the copy of the snapshot and the old token. The [snapshot documentation](https://docs.k3s.io/cli/etcd-snapshot) covers both cases.

Controllers such as Argo CD and the Prometheus operator watch the cluster continuously and remember the last state they saw. After the reset, that state no longer matches the database. In the course lab, a drill deleted the namespace `argocd`. The API was back 13 seconds after the reset, with the namespace and all applications. After that, though, Argo CD picked up no new commit, and the operator reported watch errors. Restarting the controllers in `argocd` and `monitoring` and the Sealed Secrets controller fixed both. The [Kubernetes documentation](https://v1-36.docs.kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#restoring-an-etcd-cluster) also recommends restarting the components after an etcd restore, so that they do not rely on stale data.

Once Argo CD runs again, it reconciles the cluster with Git and rolls out whatever was added to Git since the snapshot. What is lost is whatever lived only in the cluster and was created after the snapshot, such as a secret someone created with `kubectl`. With snapshots every six hours, that is six hours of work at worst.

## Measuring the time

Decide before the drill when the clock starts and when it stops. The 13 seconds from the lab only measure the time until the API answered again. For the member, what counts is when its application is reachable again and Argo CD picks up changes from Git. The RTO also includes the time before the restore. Someone has to notice the outage, and the person in charge has to react and choose the right snapshot.

A deleted namespace is a different case from a lost server. In the first, the snapshot on the server itself is enough. In the second, you need a new server, the copy on the front-end and the token. In the lab, `tofu apply` alone took 484 seconds to rebuild both k3s VMs with the whole stack of part 5, and a few more minutes passed until all applications were healthy. Which case you practice is your decision. In the SLA you state which case your time applies to.

## An SLA based on measurements

[Chapter 6.3](../sla/) describes the parts of an SLA and which availability the lab architecture can honestly support. For your member you base the promises on what you have measured and backed up.

The RTO follows from your measurement and from the operating hours. Without an on-call service, the team fixes an outage on Saturday evening only on Monday, so the SLA says whether the RTO applies around the clock or only during support hours. The RPO follows from the backups. For the state of the cluster these are the snapshots every six hours, for the member's VM the schedule of its backup job. If the VM is in no backup job, the SLA can promise no RPO for its data.

You derive the availability from the architecture. The lab has one front-end and one k3s server. A higher promise takes more effort, such as an on-call service or three k3s servers, which also raises the price in task C. You set the SLO you track internally stricter than the SLA, so that you notice a problem before the promise breaks. The chapter [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) of Google's SRE book explains this difference.

## A postmortem from data

The timeline is the most important part of a postmortem and the most tedious to collect. At Wolkenwerk the facts are in three places. For every alert in the state `pending` or `firing`, Prometheus stores a time series `ALERTS` with the name and state of the alert, from which you can read when it started and ended. Your triage service records proposals and decisions in its audit log. The changes are in the history of the platform repo in Git. A program can query these three sources and sort them by time without any model involved. Alerts like `Watchdog`, which always fires and only shows that alerting works, do not belong in the timeline. The same goes for `InfoInhibitor`, which only suppresses alerts of severity info.

The model then only writes the text around the timeline, such as summary, impact, causes and measures. A good question to the model asks for a blameless report that uses only the facts supplied and says when a fact is missing. With the option `format`, Ollama returns its answer as JSON or in the shape of a JSON schema, which you can fit into a document with fixed sections. How you reach the model from the front-end depends on how you deployed it in milestone 3.

In the course lab, the incident was like the one in chapter 5.3, with `FAIL_PERCENT` set to 60 through Git. The model `llama3.2:3b` wrote the draft in 33 seconds. The timeline was correct, since a program had built it from the data. The model's draft, on the other hand, contained several errors.

- The downtime it stated was about one hour, while the errors lasted around ten minutes.
- It blamed the switch to etcd for a delay of the snapshots that never happened.
- It praised the same switch as a gain in stability, without any fact showing it.
- It invented owners such as "Teamleiter A" and listed measures under "what went badly".
- The right cause, `FAIL_PERCENT` at 60, came from the triage service's proposal.

A second draft covering half an hour stated 13 minutes of impact. In the next sentence it wrote that users noticed no failures, although 60% of requests failed. A draft saves typing, but it looks like a finished report even when its statements are wrong. Your correction therefore checks every number, every cause and every person named against the timeline. Draft and corrected version stay as two files, so that anyone can see what you changed.

## A cost model for a member

[Chapter 6.4](../cost/) estimated Wolkenwerk's full cost at 17,128 francs a year and split it by reserved resources. A member with a namespace of 1 CPU and 1 GB and a VM with half a CPU and 1 GB carried 16.3% of it, about 233 francs a month. With the showback prices from chapter 3.3, the same member cost about 86 francs. Most of the difference is the platform team's labor, which showback leaves out.

For your member you make your own assumptions and justify them. You can split the cost by reservation, by measured use, or as a base fee per member plus a share by use. A split by reservation is simple and predictable, but a generous quota becomes expensive. A split by use follows actual consumption, but it varies from month to month and needs measurements over a longer period. Backups take space in the backup datastore and belong in the calculation if the member has many or large ones.

For right-sizing you compare the requests and quota of your member with the measured use, using the queries from [chapter 6.4](../cost/#right-sizing). In the course lab, the member `probe` reserved 64 MiB of memory and used at most 21 MiB. For a decision you measure longer than an hour, at least one day with typical load.

## Task A · A member of your own

You onboard a fifth member that you designed yourself on both layers of your platform and monitor its application. An alert of the application reaches your triage service from milestone 3. You decide on its proposal and fix the fault through Git.

Your solution meets these requirements:

1. A short description names the member, its service and its protection needs with reasons.
2. In OpenNebula the member has a group with an admin in a VDC, a quota, prices for showback and a running VM with at most 1 GB of memory.
3. Its namespace comes from the template through a merged pull request in Gitea. Argo CD rolls out its application, which meets the profile `restricted`.
4. An alert rule in the member's folder watches the application. Alertmanager forwards its alert to your triage service.
5. You fired the alert through Git, decided on the proposal and fixed the fault through Git. The audit log shows the proposal and the decision.

In the showing you show:

- The member's group, quota and running VM in Sunstone or the CLI
- The pull request in Gitea and the healthy application in Argo CD
- The alert in Alertmanager, the proposal of your triage service and your decision in the audit log
- What your triage service may do in the member's namespace, with `kubectl auth can-i`

Groups, group admins and VDCs come from [chapter 3.1](../../tenants/groups/), quotas from [chapter 3.2](../../tenants/quotas/) and prices from [chapter 3.3](../../tenants/showback/). The OpenNebula 7.4 documentation covers [groups](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/manage_groups/), [VDCs](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/manage_vdcs/), [quotas](https://docs.opennebula.io/7.4/product/cloud_system_administration/capacity_planning/quotas/) and [showback](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/). [Chapter 4.5](../../platform/templates/#the-municipalitys-request) shows how a namespace arrives through a pull request. What the profile `restricted` requires is in [chapter 6.1](../security/#pod-security-admission) and in the [Pod Security Standards](https://v1-36.docs.kubernetes.io/docs/concepts/security/pod-security-standards/) of Kubernetes 1.36. For the rule, [chapter 5.3](../../observability/slo/) and the Prometheus Operator 0.94 guide on [rules](https://github.com/prometheus-operator/prometheus-operator/blob/v0.94.2/Documentation/developer/alerting.md#deploying-prometheus-rules) help. The [configuration of Alertmanager 0.34](https://prometheus.io/docs/alerting/0.34/configuration/#route), the version in kube-prometheus-stack 92.17.0, describes routing with `route`, matchers and `webhook_config`. The [RBAC documentation](https://v1-36.docs.kubernetes.io/docs/reference/access-authn-authz/rbac/) explains roles and bindings.

## Task B · Cluster restore and SLA

You restore the cluster from an etcd snapshot and measure the time until the platform runs again for your member. You base an SLA for the member on that time and on the architecture of your lab.

Your solution meets these requirements:

1. You chose a failure case and restored the cluster with a snapshot from the copy on the front-end.
2. The start and end of your measurement are defined, and the measured times are recorded.
3. After the restore, Argo CD picks up new commits again and your member's application runs.
4. The SLA names the service, the availability with period and exclusions, the support hours, RPO and RTO.
5. Availability, RPO and RTO are justified with your measurement, your backups and the architecture of the lab.

In the showing you show:

- The snapshot you used and its copy on the front-end
- Your measurement with start, end and intermediate times
- A commit that Argo CD picked up after the restore
- The SLA and the reasoning behind RPO and RTO

You may do the restore before the showing. You then show it by its traces, such as the snapshot, your times and the state afterwards.

Snapshots, their copy and the token come from [chapter 6.2](../backup/#saving-the-snapshots). The k3s [snapshot documentation](https://docs.k3s.io/cli/etcd-snapshot) covers restoring on an existing server and on new hosts. Before the drill, take a snapshot of the three servers in smartlearn or in your hypervisor, so that you can go back if the restore fails. The parts of an SLA and the table of downtimes are in [chapter 6.3](../sla/), RPO and RTO in [chapter 6.2](../backup/#rpo-and-rto). The chapter [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) of the SRE book explains why an internal SLO should be stricter than the SLA.

## Task C · Postmortem and cost model

For the incident from task A, you let the local model write a draft postmortem from a timeline. You build the timeline from the data without the model and correct the draft yourself. You also work out a cost model for your member.

Your solution meets these requirements:

1. The timeline of the incident comes from alerts, the audit log and Git, without the model.
2. The local model writes the draft `postmortem-entwurf.md` from it. Your question to the model asks for a blameless report that uses only the facts supplied.
3. `postmortem.md` is your corrected version and records what was right in the draft, what was wrong and what you changed.
4. The cost model names the member's resources, its share of the full cost and a monthly price. It compares the price with the member's showback from OpenNebula.
5. A right-sizing proposal is based on measured requests and measured use.

In the showing you show:

- The timeline with the source of every entry
- The model's draft next to your correction, with two places you changed
- The cost model and the showback of your member for one month
- Your right-sizing proposal with the measurements

[Chapter 6.3](../sla/#postmortems) covers blameless postmortems and points to the chapter [Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) of Google's SRE book. An [example postmortem](https://sre.google/sre-book/example-postmortem/) in the same book shows a complete structure with a timeline. The [documentation of Prometheus 3.15](https://prometheus.io/docs/prometheus/3.15/configuration/alerting_rules/#inspecting-alerts-during-runtime) explains the series `ALERTS`, and the [API of Ollama 0.40.13](https://github.com/ollama/ollama/blob/v0.40.13/docs/api.md) the option `format`. You reach the model the way you deployed it in [advanced task A of milestone 3](../../observability/advanced/#task-a--a-local-language-model). For the cost, use the full cost and the queries from [chapter 6.4](../cost/) and the showback with `oneshowback` from [chapter 3.3](../../tenants/showback/#calculating-costs). The FinOps Foundation describes showback and chargeback under [Invoicing and Chargeback](https://www.finops.org/framework/capabilities/invoicing-chargeback/).
