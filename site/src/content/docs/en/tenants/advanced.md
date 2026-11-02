---
title: Advanced tasks
description: A OneFlow service for the fiduciary office that grows by load and by schedule, a monthly showback report with the cost coverage, and the effects of a failed node with a proposal for placing the VMs.
sidebar:
  order: 5
  badge:
    text: Advanced
    variant: note
---

:::assignment
"Before all four members move to the cloud, the board has three more concerns," Beat Kläy writes. "The fiduciary office needs more power at the end of the month and does not want to call us every time. Every month a report should show what the members cost and whether that covers our own costs. And I would like to know what the members notice when a node fails. How should we spread the VMs so that a failure hits as little as possible?"
:::

:::goals
After this chapter you can:

- Tell elasticity and self-service apart
- Design a OneFlow service with roles and elasticity rules
- Match rules by load and by schedule to each other and to the quota
- Schedule a recurring job with a systemd timer
- Calculate the cooperative's cost coverage from the showback
- Assess what a failed node means for the members
- Propose a placement strategy for the VMs and weigh it against an alternative
:::

## Scope and grading

The three tasks in this chapter are the advanced tasks of [milestone 1](../../assessment/milestone-1/). Neither the base nor part 4 depends on them. Unlike the chapters before it, this one gives you no recipe to follow. You design a solution of your own, build it in your lab and justify your decisions. The concept sections explain what you need to know for the design. Each task then states its goal, the requirements for your solution, what the showing covers and where to look in the documentation.

Plan four to six hours for all three tasks together. You may also pick only some of them. You show them live in class or in a screencast of at most ten minutes, as the milestone page describes under [showing the advanced tasks](../../assessment/milestone-1/#showing-the-advanced-tasks), and you answer the two questions from the check `m1` in the same showing. You may use AI assistants under the [rules of the course](../../start/overview/#ai-tools). Note in your documentation what you used them for, and be ready to explain every line of your solution in the showing.

Each task is worth 0 to 3 points by the [levels of the advanced tasks](../../assessment/#levels-of-the-advanced-tasks). A solution that runs earns 1 point. If you explain it with the values and outputs of your own lab, it earns 2. For 3 points you add a decision of your own and weigh it against an alternative. The concept sections point out trade-offs that make good material for such a decision.

## Elasticity

Elasticity is one of the [five characteristics of a cloud](../../basics/characteristics/#the-five-characteristics-according-to-nist), which NIST calls rapid elasticity. Resources grow with the load and shrink again, ideally without anyone stepping in. With the self-service of chapter 3.4 a member starts a VM itself when it needs one. With elasticity the system adjusts the number of VMs on its own, following rules that someone set in advance.

For the fiduciary office this means that nobody has to start a VM by hand at the end of the month. In return the rules have to grow the service in time and shrink it again afterwards. Every VM that runs longer than needed shows up in the fiduciary office's showback.

## Services and roles

OneFlow manages services made of several VMs in OpenNebula. A service consists of roles, such as a database and several application servers, and each role starts its VMs from a VM template. The cardinality is the number of VMs in a role. If a role has elasticity rules, `min_vms` and `max_vms` limit its cardinality, and the rules only change it within these limits.

A service template describes the structure of a service, and instantiating the template creates the service. You create service templates with the CLI `oneflow-template` or in Sunstone. These are the main settings of a role.

| Setting | Meaning |
|---|---|
| `template_id` | number of the VM template the role starts its VMs from |
| `cardinality` | number of VMs at the start |
| `min_vms`, `max_vms` | limits within which the rules change the cardinality |
| `elasticity_policies` | rules by load |
| `scheduled_policies` | rules by schedule |
| `cooldown` | seconds after a change during which no further rule applies |

OpenNebula stores service templates and services as documents, so a group needs the right to create documents, which the members have had since [chapter 3.1](../groups/#groups-and-group-admins). Like VM templates, service templates carry permissions for owner, group and others.

The VMs of a service belong to the owner of the service and count against the quota of the owner's group. If `treuhand-admin` instantiates the service, it uses up the fiduciary office's quota. Each VM of the service takes its SSH key from the user who started the service, just as in chapter 2.4.

Who creates the service template is another open question. If the platform team creates and shares it, the template becomes part of the [catalog](../self-service/#the-service-catalog) from chapter 3.4. The platform team then maintains it, and other members can use it too. If the fiduciary office creates it, the template belongs to the office, which adjusts the rules itself and is responsible for them.

## Rules by load

A rule by load checks an expression over values of a role's VMs, such as `CPU > 75`. The values come from OpenNebula's monitoring, and `CPU` is the percentage of one CPU that the VM is using. If the expression holds for `period_number` consecutive periods of `period` seconds, the rule changes the cardinality. `type` and `adjust` define the change, for example one VM more with `CHANGE` and `1`, or a share of the current number with `PERCENTAGE_CHANGE`.

OneFlow evaluates an expression with the average over all running VMs of the role. One VM at full load and one idle VM average 50%. With a higher threshold, a role with two VMs therefore stops growing as long as only one of them is busy. Whether that suits the fiduciary office depends on how its load spreads over the VMs.

After every change the service waits in the state `COOLDOWN`. During that time no other rule applies, not even one of another role. `cooldown` in the role sets the duration. Without it, the default from `/etc/one/oneflow-server.conf` applies.

A new VM takes time. The expression has to hold for all periods before the VM starts, and monitoring delivers new values only after a delay. In the course lab the second VM ran about two and a half minutes after the load began, with a rule over two periods of 30 seconds. Without load, the service shrank back after almost six minutes because the rule for shrinking was deliberately slower. A slow rule for shrinking keeps the service from flipping back and forth when the load wavers briefly. In return the fiduciary office pays for the extra VM a little longer.

Besides CPU, an expression can use values that an application reports itself, such as the length of a queue. The VM reports them through OneGate, which requires a token in its context and a network path to OneGate. In the lab OneGate listens only locally on the front-end, as the [list of services](../../iaas/installation/#the-installed-services) in chapter 2.2 shows. CPU is enough for the task.

## Rules by schedule

The fiduciary office knows in advance when its load comes. A rule by schedule changes the cardinality at a set time without waiting for the load. `recurrence` sets a recurring time as an expression in cron format, and `start_time` sets a single point in time. As with the rules by load, `type` and `adjust` define the change, and with `CARDINALITY` a rule sets the number of VMs to a fixed value. In the lab a rule that fired every two minutes triggered right at the next even minute and took the role from one VM to two.

Rules by schedule and by load can be combined in one role. The schedule covers the known peak at the end of the month, and the rule by load catches unexpected peaks. Both change the same cardinality, so check whether your rule for shrinking takes away what the schedule has just added while the load has not arrived yet. Also think about which days count as the end of the month for the fiduciary office and when the service should be small again.

## Quota and capacity

Every VM of the service counts against the [fiduciary office's quota](../quotas/#the-quotas-of-the-members) of four VMs, 2 CPU and 4096 MB. The office's other VMs share that quota, such as `treuhand-1` from chapter 3.3. If a rule tries to start more VMs than the quota allows, OpenNebula rejects the additional VMs as in chapter 3.2. `max_vms`, the size of the VMs and the quota therefore have to fit together.

The quota only limits what the fiduciary office may reserve. Whether the nodes actually have the room is a separate question, which chapter 3.2 covers under [quotas and overcommitment](../quotas/#quotas-and-overcommitment). From chapter 4.2 on, the Kubernetes cluster takes up the nodes as well.

## Timers in systemd

Ubuntu 26.04 on the lab servers comes without cron, so recurring jobs are scheduled with systemd timers. A timer is a unit whose name ends in `.timer`. When it elapses, it starts another unit, by default the service with the same name ending in `.service`, and that service runs your script.

`OnCalendar=` sets when a timer elapses, using a calendar expression. The shorthand `monthly`, for example, means the first of every month at midnight, and `systemd-analyze calendar` shows when an expression applies next. With `Persistent=` systemd stores the time of the last run on disk. If the server was off at the scheduled time, systemd catches up on the run after the next boot. Without this option the run is skipped.

Besides system units, systemd has units of individual users. A system unit runs even when nobody is logged in, and `User=` sets the user its service runs as. Without further settings, a user's units only run while that user is logged in. `loginctl enable-linger` changes that.

The service needs access to the OpenNebula CLI. The CLI authenticates with the file `~/.one/one_auth` of the user it runs as, as [chapter 2.2](../../iaas/installation/#the-cli-as-your-user) shows. This file holds the password of `oneadmin` and belongs neither in your script nor in your hand-in repo.

`systemctl list-timers` lists the timers with their last and next run. The output of your script goes to the journal, where `journalctl` with the name of the service shows it.

## The monthly report

OpenNebula ships its own timer `opennebula-showback.timer`, which calculates the showback every day. `systemctl list-timers` shows when it runs. Your report can build on that calculation or calculate the past month itself. If your timer runs at the same time as OpenNebula's, it is open which one finishes first. If your script calculates on its own, it repeats work that OpenNebula already does. The [showback documentation](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/) recommends calculating only the missing months in large deployments because the calculation is expensive, and it says to run `oneshowback calculate` as `oneadmin`.

`oneshowback list` selects the months with `-s` and `-e`, prints CSV with `--csv` and limits the list to one group with `-g`. If the range includes the current month, OpenNebula calculates the costs up to today.

A report has to be repeatable. If your script runs twice for the same month, for example after a reboot, it should produce the same file without duplicate lines. A file name with year and month shows at a glance which month a file covers.

## Cost coverage

The prices in the template `ubuntu` are made up for the case. Whether they cover the cooperative's costs only shows when you compare them with all costs of a month. According to [chapter 3.3](../showback/#the-cost-of-a-vm), these include the hardware over its lifetime, power, licenses, backup, the work of the platform team and the reserve for maintenance from chapter 2.5. The cost coverage is the ratio of the showback total of a month to these costs. Below 100%, the prices do not cover the costs, even if the cooperative actually charged them.

The lab's numbers are small. Only a few VMs run in the lab, most of them for a few days at best, so a month in the lab says little about a month in production. You therefore make assumptions, for example about how many VMs run on average or what the cooperative spends in a year, and you state them openly. The exercise "Cost model" in chapter 3.3 gives values you can take over or replace with your own. You can also work out how many VMs would have to run on average for the prices to cover the costs.

If the coverage falls short, the cooperative can raise the prices, aim for more utilization or ask each member for a fixed fee for the work of the platform team. Each of these options affects the members differently, for example the municipality with its fixed budget.

## Consequences of a failure

When a node fails, its VMs stop running. After a while `onehost list` shows the node as `err` and `onevm list` shows its VMs as `unkn`, as [chapter 2.5](../../iaas/hosts/#failure-of-a-node) describes. If one of these VMs belongs to a OneFlow service, OneFlow sets the service to `WARNING`. In the lab the disks of running VMs live in the `system` datastore of the node itself, and nobody can reach them while the node is down.

OpenNebula ships a script that can run as a hook when a host enters the state `ERROR`. With `-m` it moves the host's VMs to another host, but only if their disks are on shared storage such as NFS or Ceph. It skips VMs on local datastores, which start again once their host is back. With `-r` the script deletes the VMs and creates them again, and their state is lost. That can be acceptable for a VM without data of its own, while a VM that holds data loses what it stored.

Before such a script starts VMs elsewhere, it has to make sure that the failed host is really off. Without this fencing, a short network error can leave the same VM running on two hosts. How fast a host counts as failed depends on the monitoring intervals in `/etc/one/monitord.conf`. With `-p` the script waits a few monitoring cycles, and a host that comes back within them keeps its VMs.

The lab deliberately has neither shared storage nor this hook, so that three servers are enough. A failure therefore hits the members until the node runs again.

## Placement and failures

The scheduler decides where a new VM runs, following the rules from [chapter 2.5](../../iaas/hosts/#placement-by-the-scheduler). In the lab, striping spreads the VMs over both nodes. Packing fills one node first so that empty nodes can be switched off, but then a failure hits more VMs at once. The policy in `/etc/one/schedulers/rank.conf` applies to every VM without a rule of its own. With `SCHED_RANK` and `SCHED_REQUIREMENTS` in a template, single members or services get their own rules.

Striping goes by the number of running VMs on a node, so whether two VMs of the same service end up on different nodes also depends on the other VMs. VM groups give you a firm separation. A VM group puts VMs into roles and defines for each role whether its VMs belong on the same host (`AFFINED`) or on different hosts (`ANTI_AFFINED`). These roles are a concept of their own and not the roles of OneFlow. The scheduler enforces the rules of a VM group strictly. If it finds no host that fits, the VM stays `pend`. With two nodes, a role with `ANTI_AFFINED` therefore runs at most two VMs at a time, and only one during a failure.

Then there is the reserve. With two nodes, each one has to carry all VMs on its own during maintenance, as chapter 2.5 shows under [maintenance of a node](../../iaas/hosts/#maintenance-of-a-node), and a failure demands the same without warning. The quotas of the four members add up to more than a single node can carry. If all members use their full quota, not every VM finds room after a failure. A placement proposal therefore also says which members get priority. How much each member depends on availability shows in its [protection needs](../../basics/sovereignty/#protection-needs) from chapter 1.4.

## Task A · Elasticity with OneFlow

The fiduciary office gets a OneFlow service that provides more power at the end of the month without anyone stepping in. It grows by schedule ahead of the known peak and by load during unexpected peaks. Afterwards it shrinks again so that it does not cost the office more than necessary.

Your solution meets these requirements:

1. A OneFlow service runs in the group `treuhand`, and its VMs count against the fiduciary office's quota.
2. A role of the service grows under load and shrinks again without load, within fixed limits.
3. A rule by schedule enlarges the role before the end of the month and reduces it again afterwards.
4. The limits of the role fit the fiduciary office's quota, also next to its other VMs.

In the showing you show:

- The service with its roles and rules
- The role growing under load and shrinking after the load ends, with the times from your lab
- How you checked that the rule by schedule fires
- Why you chose these thresholds, periods and limits

The OpenNebula 7.4 documentation covers the structure of a service template and the commands `oneflow-template` and `oneflow` in [OneFlow Services Management](https://docs.opennebula.io/7.4/product/virtual_machines_operation/multi-vm_workflows/appflow_use_cli/). Rules by load and by schedule, their expressions and the states of a service are in [OneFlow Services Auto-scaling](https://docs.opennebula.io/7.4/product/virtual_machines_operation/multi-vm_workflows/appflow_elasticity/), and the monitoring values of a VM are in [Resource Metrics](https://docs.opennebula.io/7.4/product/cloud_system_administration/resource_monitoring/metrics/). The server's defaults and log files are in [OneFlow Configuration](https://docs.opennebula.io/7.4/product/operation_references/opennebula_services_configuration/oneflow/). If OneFlow does not answer, check the service `opennebula-flow` from [chapter 2.2](../../iaas/installation/#the-installed-services).

As a member you work with the file that `ONE_AUTH` points to, as in [chapter 3.1](../groups/#working-as-a-member), or in Sunstone with the view `groupadmin` from chapter 3.4. `oneflow show` lists the roles, their VMs and the service log with every change of the cardinality. To create load in a VM of the service, run a process that keeps the CPU fully busy, such as `yes`. Start the load before the showing, since growing takes a few minutes. For the rule by schedule, think about how to prove that it fires without waiting for the end of the month.

## Task B · Showback as a report

The board wants to see every month what the members have cost, without anyone having to remember it. A script of your own creates the report, and a systemd timer of your own starts it every month. From the report you calculate whether the prices cover the cooperative's costs.

Your solution meets these requirements:

1. A script of your own stores the showback of the past month as a CSV file whose name gives the month.
2. A systemd timer of your own starts the script once a month. Its name contains `showback` and does not start with `opennebula-`.
3. If the script runs a second time for the same month, it produces the same file without duplicate lines.
4. From the report you calculate the cost per member and the cooperative's cost coverage, with your assumptions stated.

In the showing you show:

- The timer with its last and next run
- A run you start by hand and the file it stores
- The cost coverage with your assumptions and a proposal to the board

The OpenNebula 7.4 [showback documentation](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/) covers `oneshowback calculate` and `oneshowback list` with their options. For the units, the Ubuntu 26.04 manual pages on [systemd.timer](https://manpages.ubuntu.com/manpages/resolute/man5/systemd.timer.5.html), [systemd.service](https://manpages.ubuntu.com/manpages/resolute/man5/systemd.service.5.html) and the calendar expressions in [systemd.time](https://manpages.ubuntu.com/manpages/resolute/man7/systemd.time.7.html) help. [Chapter 3.3](../showback/) explains prices, showback and the CSV export, and its exercise "Cost model" works through the coverage with simple numbers. You can write the script in Bash or Python, for example, since both are available on the front-end.

If your lab did not run yet in the past month, the report for that month is empty. Plan how to show a report with data in the showing, for example one for the current month. If the file is missing after a run, `journalctl` shows what your service printed.

## Task C · Failure of a node

Beat Kläy wants to know what the members notice when a node fails. You switch off a node without warning, observe what happens to the members' VMs and bring the lab back into service afterwards. From your observations you derive a proposal for how Wolkenwerk should place its VMs.

Your solution meets these requirements:

1. Before the failure, VMs of several members run on both nodes, and you record which VM runs where.
2. You switch a node off hard and record with times what OpenNebula then shows for nodes, VMs and services.
3. After you switch the node back on, all VMs run again, and you record what you had to do for that.
4. Your placement proposal builds on your observations. It names a strategy or rule, an alternative and the trade-off for the four members.

In the showing you show:

- How the VMs were spread before the failure
- The state of nodes and VMs during the failure with the times you measured
- What you had to do after switching the node back on
- Your proposal with its alternative and trade-off

[Chapter 2.5](../../iaas/hosts/) covers the states of hosts and VMs, the scheduler, maintenance and the failure of a node, and [chapter 3.2](../quotas/#quotas-and-overcommitment) covers quotas and overcommitment. In the OpenNebula 7.4 documentation you find the scheduling policies under [Rank Scheduler](https://docs.opennebula.io/7.4/product/cloud_system_administration/scheduler/rank_scheduler/), the rules for VM groups under [VM Groups (Affinity)](https://docs.opennebula.io/7.4/product/cloud_system_administration/capacity_planning/affinity/) and the hook for failed hosts under [VM HA](https://docs.opennebula.io/7.4/product/control_plane_configuration/high_availability/vm_ha/).

A real failure comes without warning, so switch off the node's VM without shutting down Ubuntu inside it. Take a snapshot of all three servers first, as [chapter 0.4](../../start/prepare/) recommends, so that you can get back if a VM no longer starts afterwards. Watch `onehost list` and `onevm list` at short intervals and write down the times. If the service from task A is running, watch it as well. Chapter 2.5 lists the commands that change the state of a VM under [life cycle of a VM](../../iaas/hosts/#life-cycle-of-a-vm). If you show the task after chapter 4.2, mind the note on the Kubernetes cluster on the milestone page. If you put part of your proposal into practice, for example for the VMs of one member, you can show its effect in the showing.
