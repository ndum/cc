---
title: Competence grid for part 3
description: What you can do after part 3 and how to check it yourself.
sidebar:
  label: Competence grid
  order: 6
---

Use this grid to judge whether your cloud is ready for several members and whether you understand it. Read each row and solve the task next to it without looking anything up. If it comes easily, you have reached the goal. If not, the link in the last column takes you to the right place. In the Swiss framework curriculum, part 3 mainly relates to the competences B12.3 (target configurations) and B14.2 (monitoring in operations) and prepares for the cost questions of part 6.

| I can … | Task | Look up |
|---|---|---|
| explain multi-tenancy with groups, group admins and VDCs | Draw the four members with their groups, the VDC and the cluster. | [Users, groups and VDCs](../groups/#multi-tenancy) |
| create members and show their separation | Show as `velo-admin` that the bike shop does not see the practice's VMs. | [Users, groups and VDCs](../groups/#working-as-a-member) |
| read an ACL | Explain the rule `@100 VM+IMAGE+TEMPLATE+DOCUMENT/* CREATE` part by part. | [Users, groups and VDCs](../groups/#acls) |
| set quotas and show their limit | Set a quota and show the message when it is reached. | [Quotas](../quotas/#at-the-limit) |
| tell showback from chargeback | Explain the difference in two sentences for the board. | [Showback](../showback/#showback-and-chargeback) |
| calculate the cost of a VM | Work out the cost of a VM per hour and per month from its prices. | [Showback](../showback/#the-cost-of-a-vm) |
| set up self-service with shared templates | Show what a group admin may change on the template `ubuntu` and what not. | [Self-service](../self-service/#the-limits-of-a-member) |
| describe a service with OneFlow (advanced) | Explain role, cardinality, `min_vms`, `max_vms` and `cooldown` using the fiduciary office's service. | [Elasticity with OneFlow](../oneflow/#services-and-roles) |
| write and observe elasticity rules (advanced) | Show how the service grows under load and explain why it does not grow to three VMs. | [Elasticity with OneFlow](../oneflow/#growing-under-load) |
| use elasticity by schedule (advanced) | Write a rule that sets the service to two VMs every Monday at 7 a.m. | [Elasticity with OneFlow](../oneflow/#growing-by-schedule) |

With this part you complete [milestone 1](../../assessment/milestone-1/). Rows marked as advanced belong to an advanced task, not to the base. In part 4 you build a platform as code on top of this cloud.
