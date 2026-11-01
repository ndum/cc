---
title: Milestone 1 · IaaS for Wolkenwerk
description: The assignment of the first milestone with the required functions, the course of the screencast, the content of the hand-in and the rubric.
---

:::assignment
"The four members are to work on our own cloud from next month," Simone Wyss writes. "Show the board that it runs, that every member only sees its own machines, what it uses and how the fiduciary office gets more power at the end of the month."
:::

Milestone 1 covers part 2 and part 3. In your lab you build the IaaS for Wolkenwerk Bern, split it among the four members and explain your decisions. Milestone 1 is individual work and belongs with milestone 2 to hand-in 1.

## Required functions

Everything runs in your own lab with your personal parameters from chapter 0.3.

1. OpenNebula 7.4 runs with two nodes, the check `install` is green.
2. The network `cc-net` is created from your parameters, a VM from the template `ubuntu` runs with SSH and internet access, the check `iaas` is green.
3. You empty a node for maintenance, put it back into service and move a VM live.
4. The four members have groups with admins in the VDC `wolkenwerk`, and one member does not see the VMs of another.
5. The members' quotas are set, and you show the message at the limit.
6. The template `ubuntu` has prices, the showback of a month is in your hand-in repo as CSV.
7. A user of a member starts a VM in self-service.
8. The fiduciary office runs its service in OneFlow itself, it grows under load and shrinks again, the check `tenants` is green.

## Explanations and decisions

In the README of milestone 1 and in the screencast you explain

- the architecture of your lab with a drawing of your own of front-end, nodes, networks, groups and VDC,
- why the VMs need VXLAN and an MTU of 1450,
- how groups, VDC and ACLs separate the members,
- how you set quotas and prices and whether the prices cover the cooperative's costs,
- why your elasticity rules are the way they are,
- what happens in the lab when a node fails and what higher availability would need.

If you deviate from the course values, for example for quotas, prices or rules, you justify it. Decisions of your own earn more points than values taken over.

## Screencast

The screencast lasts at most ten minutes in a single take. A suggestion for its course.

| Minutes | What you show |
|---|---|
| 0 to 1 | `/etc/cc-lab.env` and the reports of the checks `install`, `iaas` and `tenants` with their hash |
| 1 to 3 | architecture using your drawing, `onehost list`, `onevnet show cc-net` |
| 3 to 4 | maintenance of a node with migration |
| 4 to 6 | members, separation, quota at the limit, self-service |
| 6 to 7 | showback and your cost calculation |
| 7 to 9 | the fiduciary office's service under load |
| 9 to 10 | two or three decisions of your own |

Best start the service under load before recording, growing takes a few minutes. Record the screencast before you start part 4. In chapter 4.2 you remove the VMs of parts 2 and 3, because the Kubernetes cluster needs their room. If you show milestone 1 live in class, the same course applies, and [chapter 4.2](../../platform/opentofu/#room-on-the-nodes) shows how to take the cluster off the nodes for a while.

## Hand-in

The folder `un1/` of your hand-in repo holds

- `README.md` with drawing, explanations, decisions and your use of AI,
- the showback as CSV,
- your adapted scripts and templates, if you changed any,
- the screencast or a link to it.

You put the reports of the checks in `reports/`. How the repo is structured and how you set a tag is described in the [overview](../).

## Rubric

| Criterion | Points |
|---|---|
| OpenNebula with two nodes, check `install` | 2 |
| Network, template and VM, check `iaas` | 3 |
| Maintenance of a node with migration | 2 |
| Members with groups, admins and VDC, separation shown | 3 |
| Quotas set, limit shown | 2 |
| Showback with prices and CSV | 2 |
| Self-service and the fiduciary office's service with elasticity, check `tenants` | 4 |
| **Functions** | **18** |
| Architecture with a drawing of your own | 3 |
| VXLAN, MTU and separation of the members explained | 3 |
| Quotas, prices and cost coverage justified | 3 |
| Elasticity rules and consequences of a node failure justified | 3 |
| **Explanations and decisions** | **12** |
| **Total** | **30** |

The functions make up 60 % of the points, the explanations and decisions 40 %. Your instructor calculates the grade of hand-in 1 from the points of milestones 1 and 2 according to the school's rules.
