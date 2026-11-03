---
title: Operations and a member of your own (Milestone 4)
description: The assignment of the fourth milestone with the seven base requirements, the three advanced tasks with a member of your own, the showing, the content of the hand-in and the rubric.
---

:::assignment
"The fifth organization said yes," writes Simone Wyss. "Now we need everything the board asked for. An assessment of the protection needs, an SLA and a price. It has to run securely and with backups on our platform. And if something goes wrong for them, I want an honest report afterwards."
:::

Milestone 4 covers part 6. In the base you harden the platform, back up the cluster and the VMs and restore a VM. In the advanced tasks you design a fifth member of Wolkenwerk Bern yourself, bring it onto your platform, give it an SLA and a price, and write a postmortem after an incident. Milestone 4 belongs with milestone 3 to hand-in 2.

## Base

Everything runs in your own lab with your personal parameters from chapter 0.3. The base has seven requirements.

1. The front-end is hardened with the firewall, and SSH accepts keys only.
2. The Grafana password comes from Git as a SealedSecret.
3. The members' namespaces run with the Pod Security profile `restricted`, and you show a rejected pod.
4. The k3s cluster runs with etcd and snapshots, and a timer copies the snapshots to the front-end.
5. The backup datastore exists, and a backup job backs up a VM every night at the time from your [personal values](../../start/parameters/#your-values-for-the-milestones) and keeps as many backups as they ask for.
6. You have restored the VM from its backup.
7. The check `m4` is green.

You prove the base with the report of the check `m4` and one screenshot per requirement, each with a file name that starts with the number of its requirement. `python3 ~/cc/checks/check.py m4` writes the report on the front-end. For the backup, the VM `praxis-1` from chapter 6.2 is enough. If you do advanced task A, it can be the VM of your own member instead.

## Advanced tasks

Plan four to six hours for the three advanced tasks. Each one is worth 0 to 3 points by the [levels of the advanced tasks](../#levels-of-the-advanced-tasks). Every task you do needs [documentation in five parts](../#documenting-the-advanced-tasks). Tasks B and C build on the member from task A. The concepts and the requirements of each task are in [chapter 6.5](../../operations/advanced/).

### A member of your own (Task A)

You design a fifth member of Wolkenwerk with its protection needs and bring it onto both layers of your platform, with a group, quota and VM in OpenNebula and a namespace from the template with its application in the cluster. An alert of the application reaches your triage service from advanced task B of milestone 3. You fire it through Git, decide on the proposal and fix the fault. Ideas for the member and the requirements are in [chapter 6.5](../../operations/advanced/#a-member-of-your-own-task-a).

### Cluster restore and SLA (Task B)

You restore the cluster from an etcd snapshot and measure the time until it runs again. Based on that time and the architecture of your lab you write an SLA for your member with availability, support hours, RPO and RTO. You may do the restore before the showing and show its traces there, such as the snapshot, the times and the state afterwards. The requirements are in [chapter 6.5](../../operations/advanced/#cluster-restore-and-sla-task-b), the parts of an SLA in [chapter 6.3](../../operations/sla/).

### Postmortem and cost model (Task C)

For the incident from task A you build a timeline from the data without the model. From it the local model drafts a postmortem, which you correct. You record what was right, what was wrong and what you changed. You also work out a cost model for your member with the monthly price, a comparison with the showback and a right-sizing proposal. The requirements are in [chapter 6.5](../../operations/advanced/#postmortem-and-cost-model-task-c), the full cost in [chapter 6.4](../../operations/cost/).

## Showing the advanced tasks

You show the advanced tasks live in class or in a screencast of at most ten minutes. For a live showing you book a slot with your instructor yourself. It must take place by hand-in 2. The screencast starts with `cat /etc/cc-lab.env` and the report of the check `m4` with its hash and your two questions, which you answer during the showing.

## Hand-in

The folder `m4/` of your hand-in repo holds the screenshots of the base. The advanced tasks add their documentation and `platform/`, a copy of your repo `platform` from Gitea without the `.git` folder, state, tokens or passwords. SealedSecrets may stay in it. Task A adds the audit log of your triage service, task C adds `postmortem-entwurf.md` from the model and `postmortem.md` with your correction, and the showing adds the screencast or a link to it. Add scripts of your own, for example for the timeline, if they are not in the platform repo.

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
| Check `m4` green | 3 |
| **Base** | **21** |

| Advanced task | Points |
|---|---|
| A member of your own end to end with alert and decision (Task A) | 3 |
| Cluster from a snapshot with the measured time, SLA for the member (Task B) | 3 |
| Postmortem corrected, cost model for the member (Task C) | 3 |
| **Advanced** | **9** |

Milestone 4 is worth up to 30 points in total. A base requirement gets 3 points when the report and a screenshot prove it, and 1 point when it is only partly met. If you leave one of the two questions unanswered or answer it wrongly, the advanced task it belongs to gets at most 1 point. Without documentation an advanced task gets at most 1 point.
