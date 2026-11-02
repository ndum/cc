---
title: Milestone 1 · IaaS for Wolkenwerk
description: The assignment of the first milestone with the seven base requirements, the three advanced tasks, the showing, the content of the hand-in and the rubric.
---

:::assignment
"The four members are to work on our own cloud from next month," Simone Wyss writes. "Show the board that it runs, that every member only sees its own machines, what it uses and how the fiduciary office gets more power at the end of the month."
:::

Milestone 1 covers parts 0 to 3. In the base you build the IaaS for Wolkenwerk Bern in your lab and split it among the four members. In the advanced tasks you let a service grow elastically, automate the showback and work out what a node failure means for the members. Milestone 1 is individual work and belongs with milestone 2 to hand-in 1.

## Base

Everything runs in your own lab with your personal parameters from chapter 0.3. The base has seven requirements.

1. The three VMs are prepared, and the check `start` is green.
2. OpenNebula 7.4 runs with both nodes, and the check `install` is green.
3. The network `cc-net` is created from your parameters, a VM from the template `ubuntu` runs with SSH and internet access, and the check `iaas` is green.
4. You empty a node for maintenance, put it back into service and move a VM live.
5. The four members have groups with admins in the VDC `wolkenwerk`, and one member does not see the VMs of another.
6. The members' quotas are set, the municipality has the quota from your [personal values](../../start/parameters/), and you show the message at the limit.
7. The template `ubuntu` has prices, the showback of a month exists as CSV, and a user of a member starts a VM in self-service.

The documentation has a screenshot for each requirement with one or two sentences about it, plus the report of the check `m1`, which `python3 ~/cc/checks/check.py m1` writes on the front-end. Take the screenshots before you start chapter 4.2. In that chapter you remove the VMs of parts 2 and 3 because the Kubernetes cluster needs the room.

## Advanced tasks

Plan four to six hours for the three advanced tasks. Each one is worth 0 to 3 points by the [levels of the advanced tasks](../#levels-of-the-advanced-tasks). [Chapter 3.5](../../tenants/advanced/) explains the concepts behind them and lists the requirements for your solution to each task.

### A · Elasticity with OneFlow

The fiduciary office runs a OneFlow service that grows by load and by schedule and shrinks again afterwards. You show the service growing under load and shrinking again without load, and you justify the rules you set. [Task A in chapter 3.5](../../tenants/advanced/#task-a--elasticity-with-oneflow) lists the requirements. Start the load before the showing, since growing takes a few minutes.

### B · Showback as a report

A script and a systemd timer of your own store the showback of the past month as CSV. OpenNebula 7.4 already ships the timer `opennebula-showback.timer`, which calculates the showback daily. Give your timer a name that contains `showback` but does not start with `opennebula-`. From the CSV you calculate whether the prices cover the cooperative's costs. [Task B in chapter 3.5](../../tenants/advanced/#task-b--showback-as-a-report) lists the requirements, and [chapter 3.3](../../tenants/showback/) explains prices and showback.

### C · Failure of a node

You power off a node and show what happens to the members' VMs. From that you derive a proposal for placing the VMs, for example packing or striping, and justify it for the members of Wolkenwerk. [Task C in chapter 3.5](../../tenants/advanced/#task-c--failure-of-a-node) lists the requirements, and [chapter 2.5](../../iaas/hosts/) covers the scheduler, maintenance and failure.

## Showing the advanced tasks

You show the advanced tasks live in class or in a screencast of at most ten minutes. For a live showing you book a slot with your instructor yourself. It must take place by hand-in 1. The screencast starts with `cat /etc/cc-lab.env` and the report of the check `m1` with its hash and your two questions, which you answer during the showing.

After chapter 4.2 the Kubernetes cluster takes up the nodes. If you demonstrate task A or C live after that, take the cluster off the nodes for a while first. [Chapter 4.2](../../platform/opentofu/#room-on-the-nodes) explains how.

## Hand-in

The folder `m1/` of your hand-in repo holds the documentation with the screenshots, the showback as CSV and your adapted scripts and templates, if you changed any. Task B adds the script and the timer units, and the showing adds the screencast or a link to it.

You put the reports of the checks in `reports/`. The [overview](../) describes how the repo is structured and how you set a tag.

## Rubric

| Base requirement | Points |
|---|---|
| Three prepared VMs, check `start` | 3 |
| OpenNebula with both nodes, check `install` | 3 |
| Network, template and VM with SSH and internet, check `iaas` | 3 |
| Maintenance of a node with migration | 3 |
| Members with groups, admins and VDC, separation shown | 3 |
| Quotas with the municipality's personal values, limit shown | 3 |
| Prices, showback as CSV and self-service | 3 |
| **Base** | **21** |

| Advanced task | Points |
|---|---|
| A · Elasticity with OneFlow | 3 |
| B · Showback as a report with cost coverage | 3 |
| C · Failure of a node and a placement proposal | 3 |
| **Advanced** | **9** |

Milestone 1 is worth up to 30 points in total. A base requirement gets 3 points when the report and a screenshot prove it, and 1 point when it is only partly met. If you leave one of the two questions unanswered or answer it wrongly, the advanced task it belongs to gets at most 1 point.
