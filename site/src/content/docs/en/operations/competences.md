---
title: Competence grid for part 6
description: What you can do after part 6 and how to check it yourself.
sidebar:
  label: Competence grid
  order: 5
---

Use this grid to judge whether you can run your platform securely, recoverably and economically. Read each row and solve the task next to it without looking anything up. If it comes easily, you have reached the goal. If not, the link in the last column takes you to the right place. Within the Swiss framework curriculum, part 6 mainly serves the competences B9.2 (determining protection needs), B13.1 (backup and restore concepts), B13.5 (service levels), B14.7 (billing ICT services) and B15.1 (energy and resource efficiency).

| I can … | Task | Look up |
|---|---|---|
| assess a member's protection needs | Rate the fiduciary office for confidentiality, integrity and availability and justify each level. | [Security](../security/#protection-needs) |
| harden a server | Name the three measures of the hardening script and what they protect against. | [Security](../security/#hardening-the-front-end) |
| require a security profile for pods | List what a pod has to specify for the profile `restricted`. | [Security](../security/#pod-security-admission) |
| store secrets safely in Git | Explain who can decrypt a SealedSecret and what happens without its key. | [Security](../security/#secrets-in-git) |
| set RPO and RTO | Set RPO and RTO for the web shop and say which backup meets them. | [Backup and restore](../backup/#rpo-and-rto) |
| tell what Git covers | Name three things that are missing from Git after a rebuild. | [Backup and restore](../backup/#the-limits-of-git) |
| restore the cluster from a snapshot (advanced) | Describe the steps and what remains to be done afterwards. | [Backup and restore](../backup/#restoring-the-cluster) |
| back up and restore VMs | Back up a VM and restore it as a new VM. | [Backup and restore](../backup/#vms-in-opennebula) |
| promise an honest availability | Use the lab architecture to explain why 99.9 % is not realistic. | [SLA and operations concept](../sla/#availability-in-numbers) |
| write and check a postmortem (advanced) | Check a draft of the model against its timeline and correct it. | [SLA and operations concept](../sla/#postmortems) |
| calculate full cost and derive a price | Work out the share of the cost a member with 1 CPU and 2 GB carries. | [Cost and resource efficiency](../cost/#a-price-for-the-new-member) |
| adjust resources based on measurements | Compare requests and use of a namespace and propose new values. | [Cost and resource efficiency](../cost/#right-sizing) |

With this part you complete [milestone 4](../../assessment/milestone-4/) and have covered the content of the course. Rows marked as advanced belong to an advanced task, not to the base.
