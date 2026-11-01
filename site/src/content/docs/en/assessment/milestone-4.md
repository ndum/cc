---
title: Milestone 4 · A member of your own
description: The assignment of the fourth milestone with a member of your own, the required functions, the course of the screencast, the content of the hand-in and the rubric.
---

:::assignment
"The fifth organization said yes," writes Simone Wyss. "Now we need everything the board asked for. An assessment of the protection needs, an SLA, a price, and that it runs securely and backed up on our platform. And if something goes wrong for them, I want an honest report afterwards."
:::

Milestone 4 covers part 6. You design a fifth member of Wolkenwerk Bern yourself, assess its protection needs, set service levels and a price, and bring it onto your hardened platform with backups. You handle an incident of this member with the triage service and write a postmortem. Milestone 4 is individual work and belongs with milestone 3 to hand-in 2.

## Your member

You choose the member freely. It should be a small organization from the region that fits a cooperative like Wolkenwerk, with a service on a VM and an application in the cluster. If no idea comes to mind, the list helps.

| Idea | What it needs |
|---|---|
| Daycare center | registrations with children's data, a website for parents |
| Music school | timetable and billing, peaks at the start of each semester |
| Physiotherapy practice | appointments and treatment notes under professional secrecy |
| Neighborhood association | website and member list, small budget |
| Bakery with orders | orders until 6 p.m., peaks before holidays |
| Architecture firm | large plans, backups matter more than availability |

The application in the cluster must meet the profile `restricted`, for example a static website with `nginxinc/nginx-unprivileged` or a small app of your own. The VM may have at most 1 GB of memory, since the nodes have no more free next to k3s. In the lab, a VM with 1 GB ran next to the k3s server, and the node swapped around 200 MB for it.

## Required functions

Everything runs in your own lab with your personal parameters from chapter 0.3.

1. The front-end is hardened, the Grafana password comes from Git as a SealedSecret, and all members run with the profile `restricted`.
2. k3s runs with etcd, a timer copies the snapshots to the front-end, and you have restored the cluster from a snapshot.
3. Your member has a group in OpenNebula with an admin, VDC, quota and prices, and a VM with at most 1 GB.
4. A backup job backs up the VM every night, and you have restored it from a backup.
5. Your member has a namespace from the template with its application, through a pull request in Gitea and Argo CD.
6. An alert rule with the label `triage: "true"` watches the application. You fire the alert through Git, decide on the triage service's proposal and fix the fault.
7. The model writes a draft postmortem of this incident, and you correct it.
8. The check `operations` is green.

## Explanations and decisions

In the README of milestone 4 and in the screencast you explain

- your member, its services and its protection needs for confidentiality, integrity and availability, and which service runs on a VM or in the cluster and why,
- your SLA with availability, support hours, RPO and RTO, justified with your lab's architecture and the measured restore times,
- your cost model with the monthly price, the comparison with showback and a right-sizing proposal,
- your backup concept and how far it meets the 3-2-1 rule,
- what in the draft postmortem was right, what was wrong and what you corrected.

Decisions of your own earn more points than values taken over. If you deviate from the course values, for example for backup schedules or quotas, you justify it.

## Screencast

The screencast lasts at most ten minutes in a single take. A suggestion for its course.

| Minutes | What you show |
|---|---|
| 0 to 1 | `/etc/cc-lab.env`, the report of the check `operations` with its hash, your member in two sentences |
| 1 to 2 | hardening, the SealedSecret, a pod without security settings being rejected |
| 2 to 4 | group, quota and VM in OpenNebula, the backup job, the restored VM |
| 4 to 5 | snapshots on the front-end, the cluster restore with its measured time |
| 5 to 7 | pull request, application in the namespace, alert, proposal and decision, fix through Git |
| 7 to 8 | draft and corrected postmortem |
| 8 to 10 | SLA, cost model and two or three decisions of your own |

You may restore the cluster before recording and show its traces in the screencast, such as the snapshot, the times and the state afterwards. If you show milestone 4 live in class, the same course applies.

## Hand-in

The folder `un4/` of your hand-in repo holds

- `README.md` with member, protection needs, SLA, cost model, backup concept, your decisions and your use of AI,
- `platform/`, a copy of your repo `platform` from Gitea without the folder `.git`, without state and without passwords, SealedSecrets may stay in,
- `postmortem-entwurf.md` from the model and `postmortem.md` with your correction,
- `audit.jsonl`, the audit log of the triage service,
- the screencast or a link to it.

You do not hand in the k3s token, the Sealed Secrets key or the backups. You put the reports of the checks in `reports/`. How the repo is structured and how you set a tag is described in the [overview](../).

## Rubric

| Criterion | Points |
|---|---|
| Hardening, SealedSecret, profile `restricted` | 2 |
| etcd, snapshots on the front-end, cluster restored | 3 |
| Member in OpenNebula with quota, VM, backup job and restore | 3 |
| Namespace with application through a pull request | 3 |
| Alert with triage, decision and fix through Git | 3 |
| Postmortem corrected | 2 |
| Check `operations` | 2 |
| **Functions** | **18** |
| Member and protection needs justified | 3 |
| SLA with RPO, RTO and honest availability | 3 |
| Cost model and right-sizing | 3 |
| Backup concept and critical assessment of the model | 3 |
| **Explanations and decisions** | **12** |
| **Total** | **30** |

The functions make up 60 % of the points, the explanations and decisions 40 %. Your instructor calculates the grade of hand-in 2 from the points of milestones 3 and 4 according to the school's rules.
