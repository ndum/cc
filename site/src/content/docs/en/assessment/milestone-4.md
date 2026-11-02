---
title: Milestone 4 · Operations and a member of your own
description: The assignment of the fourth milestone with the seven base requirements, the three advanced tasks with a member of your own, the showing, the content of the hand-in and the rubric.
---

:::assignment
"The fifth organization said yes," writes Simone Wyss. "Now we need everything the board asked for. An assessment of the protection needs, an SLA and a price. It has to run securely and with backups on our platform. And if something goes wrong for them, I want an honest report afterwards."
:::

Milestone 4 covers part 6. In the base you harden the platform, back up the cluster and the VMs, restore a VM and set RPO and RTO for the four members. In the advanced tasks you design a fifth member of Wolkenwerk Bern yourself, bring it onto your platform, give it an SLA and a price, and write a postmortem after an incident. Milestone 4 is individual work and belongs with milestone 3 to hand-in 2.

## Base

Everything runs in your own lab with your personal parameters from chapter 0.3. The base has seven requirements.

1. The front-end is hardened with the firewall, and SSH accepts keys only.
2. The Grafana password comes from Git as a SealedSecret.
3. The members' namespaces run with the Pod Security profile `restricted`, and you show a rejected pod.
4. The k3s cluster runs with etcd and snapshots, and a timer copies the snapshots to the front-end.
5. The backup datastore exists, and a backup job backs up a VM every night at the time from your [personal values](../../start/parameters/) and keeps as many backups as they ask for.
6. You have restored the VM from its backup.
7. A table lists RPO and RTO of the four members with reasons, as in the exercise "RPO and RTO" in chapter 6.2, and the check `m4` is green.

The documentation has a screenshot for each requirement with one or two sentences about it, plus the report of the check `m4` and the table of RPO and RTO. For the backup, the VM `praxis-1` from chapter 6.2 is enough. If you do advanced task A, it can be the VM of your own member instead.

## Advanced tasks

Plan four to six hours for the three advanced tasks. Each one is worth 0 to 3 points by the [levels of the advanced tasks](../#levels-of-the-advanced-tasks). Tasks B and C build on the member from task A. The concepts and the requirements of each task are in [chapter 6.5](../../operations/advanced/).

### A · A member of your own

You bring a fifth member of Wolkenwerk that you design yourself onto your platform end to end. In the documentation you describe it in a few sentences, with its protection needs. In OpenNebula it gets a group with an admin, VDC, quota and prices, and a VM with at most 1 GB of memory. In the cluster it gets a namespace from the template through a pull request in Gitea, with its application rolled out by Argo CD and meeting the profile `restricted`. An alert rule watches the application, and Alertmanager sends its alert to your triage service from advanced task B of milestone 3. You fire the alert through Git, decide on the triage service's proposal and fix the fault. Ideas for the member and the requirements are in [chapter 6.5](../../operations/advanced/#task-a--a-member-of-your-own).

### B · Cluster restore and SLA

You restore the cluster from an etcd snapshot and measure the time until it runs again. Based on that time and the architecture of your lab you write an SLA for your member with availability, support hours, RPO and RTO. You may do the restore before the showing and show it there by its traces, such as the snapshot, the times and the state afterwards. The requirements are in [chapter 6.5](../../operations/advanced/#task-b--cluster-restore-and-sla), the parts of an SLA in [chapter 6.3](../../operations/sla/).

### C · Postmortem and cost model

For the incident from task A, the local model drafts a postmortem from the timeline. You build the timeline from the data without the model. You correct the draft and record what was right, what was wrong and what you changed. You also work out a cost model for your member with the monthly price, a comparison with the showback and a right-sizing proposal. The requirements are in [chapter 6.5](../../operations/advanced/#task-c--postmortem-and-cost-model), the full cost in [chapter 6.4](../../operations/cost/).

## Showing the advanced tasks

You show the advanced tasks live in class or in a screencast of at most ten minutes. For a live showing you book a slot with your instructor yourself. It must take place by hand-in 2. The screencast starts with `cat /etc/cc-lab.env` and the report of the check `m4` with its hash and your two questions, which you answer during the showing.

## Hand-in

The folder `m4/` of your hand-in repo holds the documentation with the screenshots and the table of RPO and RTO, and `platform/`, a copy of your repo `platform` from Gitea without the `.git` folder, without state and without passwords. SealedSecrets may stay in it. Task A adds the audit log of your triage service, task C adds `postmortem-entwurf.md` from the model and `postmortem.md` with your correction, and the showing adds the screencast or a link to it. Add scripts of your own, for example for the timeline, if they are not in the platform repo.

You do not hand in the k3s token, the Sealed Secrets key or the backups. You put the reports of the checks in `reports/`. The [overview](../) describes how the repo is structured and how you set a tag.

## Rubric

| Base requirement | Points |
|---|---|
| Front-end with firewall and key-only SSH | 3 |
| Grafana password as a SealedSecret from Git | 3 |
| Profile `restricted` for the members, rejected pod shown | 3 |
| etcd with snapshots, timer copies them to the front-end | 3 |
| Backup datastore and backup job with the personal values | 3 |
| VM restored from its backup | 3 |
| RPO and RTO of the four members justified, check `m4` | 3 |
| **Base** | **21** |

| Advanced task | Points |
|---|---|
| A · A member of your own end to end with alert and decision | 3 |
| B · Cluster from a snapshot with the measured time, SLA for the member | 3 |
| C · Postmortem corrected, cost model for the member | 3 |
| **Advanced** | **9** |

Milestone 4 is worth up to 30 points in total. A base requirement gets 3 points when the report and a screenshot prove it, and 1 point when it is only partly met. If you leave one of the two questions unanswered or answer it wrongly, the advanced task it belongs to gets at most 1 point.
