---
title: Competence grid for part 6
description: What you can do after part 6 and how to check it yourself.
sidebar:
  label: Competence grid
  order: 6
---

Use this grid to judge whether you can run your platform securely, recoverably and economically. Read each row and solve the task next to it without looking anything up. If it comes easily, you have reached the goal. If not, the link in the last column takes you to the right place. Within the Swiss framework curriculum, part 6 mainly serves the competences B9.2 (determining protection needs), B13.1 (backup and restore concepts), B13.5 (service levels), B14.7 (billing ICT services) and B15.1 (energy and resource efficiency).

| I can … | Task | Look up |
|---|---|---|
| assess a member's protection needs | Rate the fiduciary office for confidentiality, integrity and availability and justify each level. | [Security](../security/#protection-needs) |
| harden a server | Name the three measures of the hardening script and what they protect against. | [Security](../security/#hardening-the-front-end) |
| explain how TLS protects a connection | Explain what `Verify return code: 0 (ok)` from `openssl s_client` confirms and why code 19 appears without `-CAfile`. | [Security](../security/#transport-encryption) |
| check the rights of a ServiceAccount | Show with `kubectl auth can-i` what Prometheus may do in the namespace `velo`. Then explain why it has a ClusterRole and not a Role. | [Security](../security/#rights-on-the-platform) |
| require a security profile for pods | List what a pod has to specify for the profile `restricted`. | [Security](../security/#pod-security-admission) |
| store secrets safely in Git | Explain who can decrypt a SealedSecret and what happens without its key. | [Security](../security/#secrets-in-git) |
| set RPO and RTO | Set RPO and RTO for the web shop and say which backup meets them. | [Backup and restore](../backup/#rpo-and-rto) |
| tell what Git covers | Name three things that Git does not bring back after a rebuild. | [Backup and restore](../backup/#the-limits-of-git) |
| back up the cluster with snapshots | Name what a restore of the cluster needs besides the snapshot and where the copies are kept. | [Backup and restore](../backup/#saving-the-snapshots) |
| back up and restore VMs | Back up a VM and restore it as a new VM. | [Backup and restore](../backup/#vms-in-opennebula) |
| promise an honest availability | Use the lab architecture to explain why 99.9% is not realistic. | [SLA and operations concept](../sla/#availability-in-numbers) |
| explain the purpose and structure of a postmortem | Name the parts of a postmortem and explain why it looks for no culprits. | [SLA and operations concept](../sla/#postmortems) |
| calculate full cost and derive a price | Work out the share of the cost a member with 1 CPU and 2 GB carries. | [Cost and resource efficiency](../cost/#a-price-for-the-new-member) |
| adjust resources based on measurements | Compare requests and use of a namespace and propose new values. | [Cost and resource efficiency](../cost/#right-sizing) |
| onboard a new member with alert and triage (advanced) | List what a new member gets in OpenNebula and in the cluster. Then explain the path of its alert to the triage service. | [Advanced tasks](../advanced/#a-member-on-two-layers) |
| restore the cluster from a snapshot (advanced) | Describe the steps and what remains to be done afterwards. | [Advanced tasks](../advanced/#restoring-from-a-snapshot) |
| write and check a postmortem (advanced) | Check a draft of the model against its timeline and correct it. | [Advanced tasks](../advanced/#a-postmortem-from-data) |

With this part you complete [milestone 4](../../assessment/milestone-4/) and have covered the content of the course. Rows marked as advanced belong to an advanced task from [chapter 6.5](../advanced/) and are not part of the base. You hand in milestone 4 together with milestone 3 as hand-in 2. The [exam](../../assessment/exam/) follows towards the end of the module.
