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
| explain what a quota limits under overcommitment and what it does not | Explain why the practice's VM can be sluggish even though all members stay within their quotas. | [Quotas](../quotas/#quotas-and-overcommitment) |
| tell showback from chargeback | Explain the difference in two sentences for the board. | [Showback](../showback/#showback-and-chargeback) |
| calculate the cost of a VM | Work out the cost of a VM per hour and per month from its prices. | [Showback](../showback/#the-cost-of-a-vm) |
| create users as a group admin and tell the Sunstone views apart | Show the practice's users with `oneuser list` as `praxis-admin`. Explain which view `praxis-mpa` gets in Sunstone and why a missing tab forbids nothing. | [Self-service](../self-service/#users-in-the-group) |
| set up self-service with shared templates | Show what a group admin may change on the template `ubuntu` and what not. | [Self-service](../self-service/#the-limits-of-a-member) |
| describe a service with OneFlow (advanced) | Explain role, cardinality, `min_vms`, `max_vms` and `cooldown` using your service for the fiduciary office. | [Advanced tasks](../advanced/#services-and-roles) |
| justify elasticity rules by load (advanced) | Explain why a role with one VM at full load and one idle VM does not grow any further at a threshold of 60%. | [Advanced tasks](../advanced/#rules-by-load) |
| use elasticity by schedule (advanced) | Write a rule that sets the service to two VMs every Monday at 7 a.m. | [Advanced tasks](../advanced/#rules-by-schedule) |
| plan a monthly report with a timer (advanced) | Explain when your timer elapses and what happens if the front-end is off at that moment. | [Advanced tasks](../advanced/#timers-in-systemd) |
| calculate the cost coverage from the showback (advanced) | Calculate the cooperative's cost coverage from the showback of one month and state your assumptions. | [Advanced tasks](../advanced/#cost-coverage) |
| assess the consequences of a node failure (advanced) | Explain what happens to the members' VMs when a node fails and why they do not start on the other node in the lab. | [Advanced tasks](../advanced/#consequences-of-a-failure) |
| propose a placement of the VMs (advanced) | Justify for Wolkenwerk whether packing or striping fits better. Name what a VM group with `ANTI_AFFINED` changes about it. | [Advanced tasks](../advanced/#placement-and-failures) |

With this part you complete [milestone 1](../../assessment/milestone-1/). Upload the screenshots of part 3 and the report of the check `m1` from [chapter 3.4](../self-service/#the-check-of-milestone-1) to your hand-in repo before chapter 4.2, because there you remove the VMs the screenshots show. Rows marked as advanced belong to an advanced task in [chapter 3.5](../advanced/), not to the base. In part 4 you build a platform as code on top of this cloud.
