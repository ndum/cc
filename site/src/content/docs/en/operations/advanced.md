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

## Scope and grading

This chapter gives you no recipe to follow. For each task you design a solution of your own, build it in your lab and justify your decisions. The sections before the tasks explain the concepts and point out where you have to weigh options. These conditions apply:

- The tasks are the advanced tasks of [milestone 4](../../assessment/milestone-4/) and build on the state of your base
- Task A needs your triage service from advanced task B of milestone 3, as [chapter 5.5](../../observability/advanced/#triage-with-approval-task-b) describes it. Tasks B and C build on the member from task A.
- Plan four to six hours for all three tasks together
- You show them live in class or in a screencast of at most ten minutes, as the milestone describes under [Showing the advanced tasks](../../assessment/milestone-4/#showing-the-advanced-tasks). During the showing you answer the two questions from the check `m4`.
- For each task you write documentation in five parts, as [Assessment](../../assessment/#documenting-the-advanced-tasks) describes
- Each task is worth 0 to 3 points by the [levels of the advanced tasks](../../assessment/#levels-of-the-advanced-tasks), and 3 points require a decision of your own with an alternative and a trade-off. Without documentation a task gets at most 1 point.
- You may use AI assistants under the [rules of the course](../../start/overview/#ai-tools). You must be able to explain every line of your solution in the showing.

## Designing a member

You choose the fifth member freely, a small organization from the region with a service on a VM and an application in the cluster. The table offers a few ideas.

| Idea | What it needs |
|---|---|
| Daycare center | registrations with children's data, a website for parents |
| Music school | timetable and billing, peaks at the start of each semester |
| Physiotherapy practice | appointments and treatment notes under professional secrecy |
| Neighborhood association | website and member list, small budget |
| Bakery with orders | orders until 6 p.m., peaks before holidays |
| Architecture firm | large plans, backups matter more than availability |

Before you create anything, rate the member's protection needs as in [chapter 6.1](../security/#protection-needs) and justify each level. Your decisions on the quota, the rights of the triage service, the RPO and the price follow from that rating. The lab sets two limits:

- The member's VM has at most 1 GB of memory. Even with that, a node in the lab swapped out around 200 MB next to the k3s server.
- The application in the cluster meets the profile `restricted`, which the template has required since chapter 6.1. A static website with the image `nginxinc/nginx-unprivileged` is enough, and so is a small app of your own.

## A member on two layers

A member exists on both layers of the platform. The layers know nothing of each other, and only the names and your documentation show that the group and the namespace belong together.

| Layer | The member | Its limit |
|---|---|---|
| OpenNebula | a group with a group admin in a VDC and with prices for showback | the group quota |
| Cluster | a folder in `members/` that Argo CD turns into a namespace with LimitRange, NetworkPolicy and the profile `restricted` | the ResourceQuota in the namespace |

For the four members, the script from [chapter 3.1](../../tenants/groups/) and the pull requests from [chapter 4.5](../../platform/templates/#the-municipalitys-request) did this work. For the fifth you choose between manual work, a script of your own and Git. A script takes longer for the first member, but it records every step and can be reused. A VDC of its own instead of `wolkenwerk` can give the member a different slice, such as a single node.

You justify each limit on its own. A generous quota spares the member requests to the platform team, but in the price model of [chapter 6.4](../cost/#a-price-for-the-new-member) it counts as reserved capacity. A tight quota suits a small budget but holds back an application that has to grow at peak times.

## Alerts for a member

A member's rules live as a `PrometheusRule` in its folder of the platform repo, so they arrive and leave with its pull request. The kube-prometheus-stack values from chapter 5.1 let Prometheus read the rules of every namespace, so no special label is needed.

A good alert reports a symptom the customers notice, as [chapter 5.3](../../observability/slo/#symptoms-and-causes) explains. For a small website it is often enough to ask whether a pod is still ready. The metrics from kube-state-metrics carry the labels `namespace` and `deployment` for this, from which your triage service can tell its target. You add labels such as `severity` in the alert rule yourself. With a duration in `for` that is too short, the alert already reports an ordinary restart, and with one that is too long it comes late.

Alertmanager passes every alert from the top route to the first child route whose matchers fit its labels. With `continue` it also checks the routes that follow. In the base there is only the top route with the receiver `null`. You decide how Alertmanager recognizes the alerts meant for triage, for example by the alert name, the namespace or a label of your own. `amtool config routes test` shows which route an alert takes, as the [Alertmanager README](https://github.com/prometheus/alertmanager/blob/v0.34.2/README.md#amtool) describes.

| Approach | Advantage | Drawback |
|---|---|---|
| One route per member | easy to read | you change the Alertmanager values for every new member |
| A shared label for triage | the route stays the same, the members' rules decide | every rule meant for triage must carry the label |

## Rights of the triage service

Under milestone 3, your triage service may only do what it needs for the web shop. You set what it may read or do for the new member with a `Role` and a `RoleBinding` in that member's namespace. A `ClusterRole` with a `ClusterRoleBinding` would apply to every namespace at once. [Chapter 6.1](../security/#rights-on-the-platform) explains the roles, and `kubectl auth can-i` with `--as` shows what a ServiceAccount is really allowed to do.

These rights only cover the Kubernetes API, not the logs in Loki. In the lab, Loki runs with `auth_enabled: false` and gives anyone who reaches it the logs of every namespace. Whether your service reads the member's logs is therefore something you control in the service itself and justify with the protection needs.

| Rights for the member | Consequence |
|---|---|
| No rights, no logs | the model lacks context, and its proposal stays generic |
| Read access | the model sees more, including the member's data, since logs can contain personal data |
| Restarting a deployment | a wrong proposal can do damage after a careless approval |

## Restoring from a snapshot

A **snapshot** is a copy of the whole cluster database at one point in time, with every object down to the secrets, the Argo CD applications and the Argo CD password. Whatever pods write to volumes, such as metrics and logs, is not in it. Without the old server's token the snapshot is useless, because k3s uses the token to encrypt confidential data in the database, as the k3s page [Backup and Restore](https://docs.k3s.io/datastore/backup-restore) describes.

On an existing server, k3s resets the database to a snapshot with the options `--cluster-reset` and `--cluster-reset-restore-path`. The server then becomes the only member of a new etcd cluster. If the server itself is lost, a new server needs the copy of the snapshot and the old token. The [snapshot documentation](https://docs.k3s.io/cli/etcd-snapshot) covers both cases.

Controllers such as Argo CD and the Prometheus operator remember the last state they saw, which no longer holds after the reset. In the course lab, the API was back 13 seconds after the reset, together with all applications and the namespace `argocd` that a drill had deleted. Argo CD then picked up no new commits, though, and the operator reported watch errors until the controllers in `argocd` and `monitoring` and the Sealed Secrets controller were restarted. The [Kubernetes documentation](https://v1-36.docs.kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#restoring-an-etcd-cluster) also recommends this restart after an etcd restore. Argo CD then rolls out whatever was added to Git since the snapshot. What is lost is whatever was created only in the cluster after the snapshot, such as a secret made with `kubectl`. With snapshots every six hours, that is six hours of work at most.

## Measuring the time

Decide before the drill when the clock starts and when it stops. The 13 seconds from the lab only measure the time until the API answered again. For the member, what counts is when its application runs and Argo CD picks up changes from Git. The RTO also includes the time until someone notices the outage, reacts and picks the right snapshot.

| Case | You need | In the course lab |
|---|---|---|
| Deleted namespace | the snapshot on the server itself | API back after 13 seconds, then a restart of the controllers |
| Lost server | a new server, the copy of the snapshot on the front-end and the token | just under a minute from the reset to the member's running application |

The local-path volumes on the lost server's disk were left as objects without their folders, so their pods waited with the message "does not exist". Which case you practice is your decision. In the SLA you state which case your time applies to.

## An SLA based on measurements

[Chapter 6.3](../sla/) describes the parts of an SLA and the availability the lab can honestly support. For your member, you base every promise on measurements and backups.

- The RTO follows from your measurement and the operating hours. Without an on-call service, an outage on Saturday evening only gets fixed on Monday, so the SLA states whether the RTO applies around the clock or only during support hours.
- The RPO follows from the backups, for the cluster the snapshots every six hours, for the VM its backup job. Without a backup job, the SLA can promise no RPO for the VM's data.
- The availability follows from the architecture with only one front-end and one k3s server. A higher promise takes something like an on-call service or three k3s servers, which also raises the price in task C.

Set the SLO you track internally stricter than the SLA, so that you notice a problem before the promise breaks. The chapter [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) of Google's SRE book explains the difference.

## A postmortem from data

The timeline is the most important and the most tedious part of a postmortem. At Wolkenwerk its facts sit in three places.

| Source | What it provides |
|---|---|
| The series `ALERTS` in Prometheus | name and state of every alert in `pending` or `firing`, and from that its start and end |
| The audit log of your triage service | proposals and decisions |
| The history of the platform repo in Git | the changes |

A program can query these sources and sort them by time without any model involved. The model then only writes the text around the timeline, such as summary, impact, causes and measures. A good question asks for a blameless report that uses only the facts supplied and says when a fact is missing. With the option `format`, Ollama answers in JSON or in the shape of a JSON schema, which fits a document with fixed sections.

In the course lab, `FAIL_PERCENT` was set to 60 through Git, as in the incident of chapter 5.3. The model `llama3.2:3b` wrote the draft in 33 seconds. The timeline from the program was correct, but the draft contained several errors.

- It stated about one hour of downtime, while the errors lasted around ten minutes
- It blamed the switch to etcd for a delay of the snapshots that never happened
- It praised the same switch as a gain in stability without any fact to show it
- It invented owners such as "Teamleiter A" and listed measures under "what went badly"
- It took the right cause from the triage service's proposal

A second draft covering half an hour stated 13 minutes of impact and right after that claimed users noticed no failures, although 60% of requests failed. Since a draft looks finished even when it is wrong, your correction checks every number, every cause and every person named against the timeline.

## A cost model for a member

In [chapter 6.4](../cost/), a member with a namespace of 1 CPU and 1 GB and a VM with half a CPU and 1 GB cost about 233 francs a month, 16.3% of Wolkenwerk's full cost of 17,128 francs a year. With the showback prices from chapter 3.3 it came to about 86 francs, mostly because showback leaves out the platform team's labor.

For your member you choose how to split the cost and justify your assumptions.

| Split | Character |
|---|---|
| By reservation | simple and predictable, but a generous quota becomes expensive |
| By measured use | follows actual consumption, but varies from month to month and needs measurements over a longer period |
| Base fee plus a share by use | the base fee covers the labor, and consumption is added by showback |

Backups take space in the backup datastore and belong in the calculation if the member has many or large ones. For right-sizing you compare your member's requests and quota with the use that the queries from [chapter 6.4](../cost/#right-sizing) measure. In the course lab, the member `probe` reserved 64 MiB of memory and used at most 21 MiB.

## A member of your own (Task A)

You onboard a fifth member that you designed yourself on both layers of your platform and monitor its application. Its alert reaches your triage service from milestone 3, and you decide on the proposal and fix the fault through Git.

Your solution meets these requirements:

1. A short description names the member, its service and its protection needs with reasons.
2. In OpenNebula the member has a group with an admin in a VDC, a quota, prices for showback and a running VM with at most 1 GB of memory.
3. Its namespace comes from the template through a merged pull request in Gitea. Argo CD rolls out its application, which meets the profile `restricted`.
4. An alert rule in the member's folder watches the application. Alertmanager forwards its alert to your triage service.
5. You fired the alert through Git, decided on the proposal and fixed the fault through Git. The audit log shows the proposal and the decision.

In the showing you present:

- The member's group, quota and running VM in Sunstone or the CLI
- The pull request in Gitea and the healthy application in Argo CD
- The alert in Alertmanager, the proposal of your triage service and your decision in the audit log
- What your triage service may do in the member's namespace, with `kubectl auth can-i`

These sources help you:

- [Chapter 3.1](../../tenants/groups/) on groups, group admins and VDCs, [chapter 3.2](../../tenants/quotas/) on quotas and [chapter 3.3](../../tenants/showback/) on prices
- The OpenNebula 7.4 documentation on [groups](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/manage_groups/), [VDCs](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/manage_vdcs/), [quotas](https://docs.opennebula.io/7.4/product/cloud_system_administration/capacity_planning/quotas/) and [showback](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/)
- [Chapter 4.5](../../platform/templates/#the-municipalitys-request) on how a namespace arrives through a pull request
- [Chapter 6.1](../security/#pod-security-admission) and the [Pod Security Standards](https://v1-36.docs.kubernetes.io/docs/concepts/security/pod-security-standards/) of Kubernetes 1.36 on the profile `restricted`
- [Chapter 5.3](../../observability/slo/) and the Prometheus Operator 0.94 guide on [rules](https://github.com/prometheus-operator/prometheus-operator/blob/v0.94.2/Documentation/developer/alerting.md#deploying-prometheus-rules) for the alert rule
- The [configuration of Alertmanager 0.34](https://prometheus.io/docs/alerting/0.34/configuration/#route), the version in kube-prometheus-stack 92.17.0, on `route`, matchers and `webhook_config`
- The [RBAC documentation](https://v1-36.docs.kubernetes.io/docs/reference/access-authn-authz/rbac/) on roles and bindings

Notes from the lab:

- You fire the alert through Git, for example with zero replicas or an image that does not exist
- In the course lab the alert came two minutes after the last pod was gone
- The triage service proposed a restart there. The team rejected it, because a restart starts no pod as long as Git asks for zero replicas.
- Argo CD keeps restoring the state from Git, so the fault is only fixed once the right state is back in Git

## Cluster restore and SLA (Task B)

You restore the cluster from an etcd snapshot and measure the time until the platform runs again for your member. You base an SLA for the member on that time and on the architecture of your lab.

Your solution meets these requirements:

1. You chose a failure case and restored the cluster with a snapshot from the copy on the front-end.
2. The start and end of your measurement are defined, and the measured times are recorded.
3. After the restore, Argo CD picks up new commits again and your member's application runs.
4. The SLA names the service, the availability with period and exclusions, the support hours, RPO and RTO.
5. Availability, RPO and RTO are justified with your measurement, your backups and the architecture of the lab.

In the showing you present:

- The snapshot you used and its copy on the front-end
- Your measurement with start, end and intermediate times
- A commit that Argo CD picked up after the restore
- The SLA and the reasoning behind RPO and RTO

These sources help you:

- [Chapter 6.2](../backup/#saving-the-snapshots) on the snapshots, their copy and the token
- The k3s [snapshot documentation](https://docs.k3s.io/cli/etcd-snapshot) on restoring on an existing server and on new hosts
- [Chapter 6.3](../sla/) with the parts of an SLA and the table of downtimes, [chapter 6.2](../backup/#rpo-and-rto) with RPO and RTO
- The chapter [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) of the SRE book, which explains why an internal SLO should be stricter than the SLA

Notes from the lab:

- You may do the restore before the showing. There you show it by its traces, such as the snapshot, your times and the state afterwards.
- When `tofu apply` replaced a lost server in the lab, the new VM waited ten minutes in `pending`. As in the rebuild of chapter 6.2, OpenNebula still had the old value for the node's disk.
- A new server only has a snapshot of its own again once k3s writes the next scheduled one

:::caution[Before the restore]
An etcd snapshot brings back no data from volumes. Copy the audit log of your triage service from task A into your hand-in repo first. Also take a snapshot of the three servers in smartlearn or in your hypervisor, so that you can go back if the restore fails.
:::

## Postmortem and cost model (Task C)

For the incident from task A, the local model drafts a postmortem from a timeline that you build from the data without the model. You correct the draft and also work out a cost model for your member.

Your solution meets these requirements:

1. The timeline of the incident comes from alerts, the audit log and Git, without the model.
2. The local model writes the draft `postmortem-entwurf.md` from it. Your question to the model asks for a blameless report that uses only the facts supplied.
3. `postmortem.md` is your corrected version and records what was right in the draft, what was wrong and what you changed.
4. The cost model names the member's resources, its share of the full cost and a monthly price. It compares the price with the member's showback from OpenNebula.
5. A right-sizing proposal is based on measured requests and measured use.

In the showing you present:

- The timeline with the source of every entry
- The model's draft next to your correction, with two places you changed
- The cost model and the showback of your member for one month
- Your right-sizing proposal with the measurements

These sources help you:

- [Chapter 6.3](../sla/#postmortems) on blameless postmortems and the chapter [Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) of Google's SRE book
- An [example postmortem](https://sre.google/sre-book/example-postmortem/) in the same book with a complete structure and a timeline
- The [documentation of Prometheus 3.15](https://prometheus.io/docs/prometheus/3.15/configuration/alerting_rules/#inspecting-alerts-during-runtime) on the series `ALERTS`
- The [API of Ollama 0.40.13](https://github.com/ollama/ollama/blob/v0.40.13/docs/api.md) with the option `format`
- [Advanced task A of milestone 3](../../observability/advanced/#a-local-language-model-task-a), since you reach the model from the front-end the way you deployed it there
- [Chapter 6.4](../cost/) on the full cost and the queries, and [chapter 3.3](../../tenants/showback/#calculating-costs) on showback with `oneshowback`
- [Invoicing and Chargeback](https://www.finops.org/framework/capabilities/invoicing-chargeback/) of the FinOps Foundation on showback and chargeback

Notes from the lab:

- `Watchdog` always fires and only shows that alerting works. It does not belong in the timeline, and neither does `InfoInhibitor`, which only suppresses alerts of severity info.
- For a right-sizing decision, measure longer than an hour, at least one day with typical load
- Draft and correction stay as two files, so that anyone can see what you changed
