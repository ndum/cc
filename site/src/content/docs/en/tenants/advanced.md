---
title: Advanced tasks
description: A OneFlow service for the fiduciary office that grows by load and by schedule, a monthly showback report with the cost coverage, and the effects of a failed node with a proposal for placing the VMs.
tableOfContents:
  maxHeadingLevel: 2
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

This chapter gives you no recipe to follow. You design a solution of your own, build it in your lab and justify your decisions. The concept sections explain what you need to know for that. They also point out trade-offs that make good material for a decision of your own.

- The three tasks are the advanced tasks of [milestone 1](../../assessment/milestone-1/). Neither the base nor part 4 depends on them.
- Plan four to six hours for all three together. You may also pick only some of them.
- You show them live in class or in a screencast of at most ten minutes, as the milestone page describes under [showing the advanced tasks](../../assessment/milestone-1/#showing-the-advanced-tasks). In the same showing you answer the two questions from the check `m1`.
- Every task needs [documentation in five parts](../../assessment/#documenting-the-advanced-tasks)
- Each task is worth 0 to 3 points by the [levels of the advanced tasks](../../assessment/#levels-of-the-advanced-tasks), and at most 1 point without documentation
- You may use AI assistants under the [rules of the course](../../start/overview/#ai-tools). In the showing you explain every line of your solution yourself.

## Elasticity

**Elasticity** is one of the [five characteristics of a cloud](../../basics/characteristics/#the-five-characteristics-according-to-nist), which NIST calls rapid elasticity. Resources grow with the load and shrink again without anyone stepping in. With the self-service of chapter 3.4 a member starts a VM itself, while with elasticity the system changes the number of VMs by fixed rules. For the fiduciary office these rules have to grow the service in time and shrink it again, because every VM that runs longer than needed shows up in the office's showback.

## Services and roles

OneFlow manages services made of several VMs, organized in roles such as a database or several application servers. Each role starts its VMs from a VM template, and the number of these VMs is the role's **cardinality**. A **service template** describes the structure, and instantiating it creates the service. You create service templates with `oneflow-template` or in Sunstone and describe each role in them mainly with these settings.

| Setting | Meaning |
|---|---|
| `template_id` | number of the VM template the role starts its VMs from |
| `cardinality` | number of VMs at the start |
| `min_vms`, `max_vms` | limits within which the rules change the cardinality |
| `elasticity_policies` | rules by load |
| `scheduled_policies` | rules by schedule |
| `cooldown` | seconds after a change during which no further rule applies |

:::details[Permissions, quota and the owner of the service template]
OpenNebula stores service templates and services as documents. The members have had the right to create documents since [chapter 3.1](../groups/#groups-and-group-admins). Like VM templates, service templates carry permissions for owner, group and others. The VMs of a service belong to its owner, count against the quota of the owner's group and take the owner's SSH key, just as in chapter 2.4. A service that `treuhand-admin` instantiates therefore uses up the fiduciary office's quota. Who creates the service template is still open.

| Service template by | Consequence |
|---|---|
| The platform team | part of the [catalog](../self-service/#the-service-catalog) from chapter 3.4, maintained by the platform team and open to other members as well |
| The fiduciary office | belongs to the office, which adjusts its rules itself and is responsible for them |
:::

## Rules by load

A rule by load checks an expression such as `CPU > 75` over the VMs of a role. If the expression holds for a while, the rule changes the cardinality. OneFlow takes the average over all running VMs of the role and checks the rules only every 90 seconds.

:::details[Expression, periods, cooldown and measurements from the lab]
`CPU` is the load of one CPU in percent, taken from the monitoring. Values that an application reports itself through OneGate, such as the length of a queue, are possible too. For that the VM needs a token in its context and a network path to OneGate, which in the lab listens only locally on the front-end, as the [list of services](../../iaas/installation/#the-installed-services) in chapter 2.2 shows. CPU is enough for the task. If the expression holds for `period_number` consecutive periods of `period` seconds, `type` and `adjust` change the cardinality, for example by one VM with `CHANGE` and `1` or by a share with `PERCENTAGE_CHANGE`.

Because OneFlow takes the average, one VM at full load and one idle VM average 50%. With a higher threshold the role therefore stops growing as long as only one of them is busy. Whether that suits the fiduciary office depends on how its load spreads. After every change the service stands in the state `COOLDOWN`, and no rule applies, not even one of another role. `cooldown` sets the duration, otherwise the default from `/etc/one/oneflow-server.conf` applies.

In the same file, `:autoscaler_interval:` sets the 90 seconds. A shorter period therefore acts like one of 90 seconds, and the monitoring adds a delay of its own. In the lab the second VM ran about two and a half minutes after the load began, with a rule over two periods of 30 seconds. Without load the service shrank back after almost six minutes because the rule for shrinking was deliberately slower. That keeps the service from flipping back and forth when the load wavers briefly, but the fiduciary office pays for the extra VM a little longer.
:::

## Rules by schedule

A rule by schedule changes the cardinality at a set time without waiting for the load, recurring with `recurrence` as an expression in cron format or once with `start_time`. In one role, the schedule covers the known peak at the end of the month and the rule by load catches unexpected peaks.

:::details[Kind of change, measurement from the lab and interplay with the load]
`type` and `adjust` define the change, and `CARDINALITY` sets a fixed number of VMs. In the lab a rule that fired every two minutes triggered at the first check after the even minute and took the role from one VM to two. A rule by schedule therefore acts up to 90 seconds after its time.

Since both rules change the same cardinality, check whether your rule for shrinking takes away what the schedule has just added while the load has not arrived yet. Also decide which days count as the end of the month for the fiduciary office and when the service should be small again.
:::

## Quota and capacity

Every VM of the service counts against the [fiduciary office's quota](../quotas/#the-quotas-of-the-members) of four VMs, 2 CPU and 4096 MB, next to the office's other VMs such as `treuhand-1` from chapter 3.3. `max_vms`, the size of the VMs and the quota therefore have to fit together.

:::details[A service beyond the quota and room on the nodes]
OpenNebula rejects VMs beyond the quota as in chapter 3.2, and the service then stands in `FAILED_SCALING`. None of its rules applies any more until the quota has room again and someone runs `oneflow recover`. The quota does not tell you whether the nodes actually have the room, as chapter 3.2 shows under [quotas and overcommitment](../quotas/#quotas-and-overcommitment). From chapter 4.2 on, the Kubernetes cluster takes up the nodes as well.
:::

## Timers in systemd

Ubuntu 26.04 on the lab servers comes without cron. Recurring jobs are scheduled with systemd timers, units whose names end in `.timer` and that start the service of the same name ending in `.service` by default when they elapse. That service runs your script.

:::details[Time, kind of unit and the sign-in of the CLI]
`OnCalendar=` sets the time with a calendar expression, and `monthly`, for example, means the first of every month at midnight. `systemd-analyze calendar` shows when an expression applies next. With `Persistent=` systemd catches up after the next boot on a run that the switched-off server missed. Without this option the run is skipped.

| Kind | Runs | User of the service |
|---|---|---|
| System unit | even when nobody is logged in | set with `User=` |
| User unit | only while that user is logged in, unless `loginctl enable-linger` is set | that user |

In the service, the OpenNebula CLI authenticates with `~/.one/one_auth` of the user the service runs as, as [chapter 2.2](../../iaas/installation/#the-cli-as-your-user) shows. `systemctl list-timers` lists the timers with their last and next run, and `journalctl` with the name of the service shows the output of your script.
:::

:::caution[No passwords in Git]
`~/.one/one_auth` holds the password of `oneadmin`. Your script and units go into the hand-in repo as files of the task. So never write the password into any of these files, and never copy `one_auth` into the repo.
:::

## The monthly report

OpenNebula ships the timer `opennebula-showback.timer`, which calculates the showback every day. `systemctl list-timers` shows when it runs.

| Path for your report | Drawback |
|---|---|
| Build on OpenNebula's calculation | if your timer runs at the same time as OpenNebula's, it is open which one finishes first |
| Calculate it yourself | your script repeats work that OpenNebula already does |

:::details[Commands, options and a second run]
According to the [showback documentation](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/) you run `oneshowback calculate` as `oneadmin`, and with many VMs only for the missing months, because the calculation is expensive. `oneshowback list` selects the months with `-s` and `-e`, prints CSV with `--csv` and limits itself to one group with `-g`. If the range includes the current month, OpenNebula calculates up to today. If your script runs twice for the same month, for example after a reboot, it should produce the same file without duplicate lines. Year and month in the file name show which month it covers.
:::

## Cost coverage

The prices in the template `ubuntu` are made up for the case. Whether they cover the cooperative's costs shows in the **cost coverage**, the ratio of the showback total of a month to all costs of that month. Below 100%, the prices do not cover the costs, even if the cooperative actually charged them.

:::details[Costs, assumptions and options when the coverage falls short]
According to [chapter 3.3](../showback/#the-cost-of-a-vm), the costs include the hardware over its lifetime, power, licenses, backup, the work of the platform team and the reserve for maintenance from chapter 2.5.

A month in the lab, with few VMs that have often run for only a few days, says little about production. State your assumptions openly, for example how many VMs run on average or what the cooperative spends in a year. The exercise "Cost model" in chapter 3.3 gives values for that. You can also work out how many VMs would have to run on average for the prices to cover the costs. If the coverage falls short, the cooperative can raise the prices, aim for more utilization or ask each member for a fixed fee for the work of the platform team. Each option affects the members differently, for example the municipality with its fixed budget.
:::

## Consequences of a failure

When a node fails, `onehost list` shows it as `err` after a while, and `onevm list` shows its VMs as `unkn`, as [chapter 2.5](../../iaas/hosts/#failure-of-a-node) describes. Nobody can reach their disks in the node's `system` datastore while the node is down. Whoever starts the VMs of a failed node elsewhere first has to make sure that the node is really off. Without this **fencing**, a short network error can leave the same VM running on two hosts. The lab deliberately has neither shared storage nor a hook for failed hosts, so that three servers are enough. A failure therefore hits the members until the node runs again.

:::details[The hook for failed hosts and the behavior of OneFlow]
OpenNebula ships a script that can run as a hook when a host enters the state `ERROR`. Its options decide what happens to the VMs.

| Option | Effect |
|---|---|
| `-m` | moves the VMs to another host, but only with shared storage such as NFS or Ceph, while VMs on local datastores only start again with their host |
| `-r` | deletes the VMs and creates them again, so their state is lost, which can be acceptable for VMs without data of their own |
| `-p` | waits a few monitoring cycles, and a host that comes back within them keeps its VMs |

How fast a host counts as failed depends on the monitoring intervals in `/etc/one/monitord.conf`.

OneFlow does not know the state of the nodes. Until OpenNebula detects the failure after a few minutes, it still reports the node's VMs as running, so the rules of a service work with wrong values. If the load seems to drop, OneFlow shrinks the role by terminating its oldest VMs, even a healthy VM on the other node. Once a VM shows `unkn`, the service changes to the state `WARNING`, in which OneFlow neither evaluates rules nor replaces VMs. In the lab the service of the fiduciary office was left without a single working VM for several minutes. If you bring a VM back on the other node with `onevm recover --recreate`, its old folder stays in the system datastore of the failed node. Clean it up yourself once the node is back, because OpenNebula no longer knows about it.
:::

## Placement and failures

The scheduler decides where a new VM runs, following the rules from [chapter 2.5](../../iaas/hosts/#placement-by-the-scheduler). The policy in `/etc/one/schedulers/rank.conf` applies to every VM without a rule of its own, and `SCHED_RANK` and `SCHED_REQUIREMENTS` in a template give single members or services their own rules.

| Rule | Effect | During a failure |
|---|---|---|
| Striping, set in the lab | spreads the VMs over the nodes by their number of running VMs, so whether two VMs of one service end up apart also depends on the other VMs | hits fewer VMs |
| Packing | fills one node first so that empty nodes can be switched off | hits more VMs at once |
| VM group with `ANTI_AFFINED` | keeps the VMs of a VM group role strictly on different hosts, so with two nodes at most two of them run | only one VM of the role keeps running |

:::details[VM groups and the reserve of the nodes]
A VM group puts VMs into roles of its own, which have nothing to do with the roles of OneFlow. For each role it defines whether its VMs belong on the same host (`AFFINED`) or on different hosts (`ANTI_AFFINED`). The scheduler enforces this strictly. Without a host that fits, the VM stays `pend`.

Then there is the reserve. With two nodes, each one has to carry all VMs on its own, during [maintenance](../../iaas/hosts/#maintenance-of-a-node) with warning and during a failure without. The quotas of the four members add up to more than one node can carry. If all members use their full quota, not every VM finds room after a failure. A placement proposal therefore also says which members get priority. How much they depend on availability shows in their [protection needs](../../basics/sovereignty/#protection-needs) from chapter 1.4.
:::

## Elasticity with OneFlow (Task A)

The fiduciary office needs more power at the end of the month without anyone stepping in. Its OneFlow service grows by schedule ahead of the known peak and by load during unexpected peaks, then shrinks again.

![The OneFlow service of the fiduciary office. In the target state of task A, OneFlow on the front-end at the top reads the roles and rules of your service template. Rules by schedule follow the system clock, and rules by load follow the CPU that monitoring measures for every VM. Based on these values OneFlow changes the cardinality of a role. At the bottom the service runs in the group treuhand. Some of its VMs always run, and more VMs join by load or by schedule and leave again afterwards. Next to them runs treuhand-1, another VM of the group. Notice the lines below the VMs. The role stays between min_vms and max_vms, and all VMs of the service fit into the quota of the fiduciary office together with treuhand-1.](../../../../assets/figures/en/p3c5-oneflow.svg)

| Starting point | Result |
|---|---|
| From the base you have the group `treuhand` with its admin `treuhand-admin`, its quota and the VM `treuhand-1` from chapter 3.3, along with the template `ubuntu` and the network `cc-net`. OneFlow has been running on the front-end since chapter 2.2, but you have not created a service yet. Unlike `praxis-admin` in chapter 3.1, `treuhand-admin` has no SSH key yet. | A service with at least one role runs in the group `treuhand`. Its number of VMs rises under load and before the end of the month and falls again afterwards, without going beyond the fiduciary office's quota. |

### Approach

1. Plan the roles of the service and their limits so that they fit the fiduciary office's quota.
2. Write a service template with rules by load and by schedule.
3. Start the service as the office's admin and check that it runs.
4. Create load in a VM of the service and watch the role grow and shrink again.
5. Prove that the rule by schedule fires without waiting for the end of the month.
6. Record values, times and your decision for the documentation.

### Requirements

1. A OneFlow service runs in the group `treuhand`, and its VMs count against the fiduciary office's quota.
2. A role grows under load and shrinks again without load, within fixed limits.
3. A rule by schedule enlarges the service before the end of the month and reduces it afterwards, in the same role or in one of its own.
4. The limits of the role fit the fiduciary office's quota, also next to its other VMs.

### Showing

- The service with its roles and rules
- The growth under load and the shrinking afterwards, with the times from your lab
- How you prove that the rule by schedule fires
- Why you chose these thresholds, periods and limits

:::details[Notes from the lab]
- `oneflow show` lists the roles, their VMs and every change of the cardinality in the service log
- Create load in a VM of the service with a process that keeps the CPU fully busy, such as `yes`. Start it before the showing, since growing takes a few minutes.
- If OneFlow does not answer, check the service `opennebula-flow` from [chapter 2.2](../../iaas/installation/#the-installed-services)
:::

:::details[Sources]
- [OneFlow Services Management](https://docs.opennebula.io/7.4/product/virtual_machines_operation/multi-vm_workflows/appflow_use_cli/) with the structure of a service template and the commands `oneflow-template` and `oneflow`
- [OneFlow Services Auto-scaling](https://docs.opennebula.io/7.4/product/virtual_machines_operation/multi-vm_workflows/appflow_elasticity/) with the rules by load and by schedule, their expressions and the states of a service
- [Resource Metrics](https://docs.opennebula.io/7.4/product/cloud_system_administration/resource_monitoring/metrics/) with the monitoring values of a VM
- [OneFlow Configuration](https://docs.opennebula.io/7.4/product/operation_references/opennebula_services_configuration/oneflow/) with the server's defaults and its log files
- [Chapter 3.1](../groups/#working-as-a-member) for working as a member with `ONE_AUTH`, and in Sunstone the view `groupadmin` from chapter 3.4
:::

## Showback as a report (Task B)

The board wants to see every month what the members have cost, without anyone having to remember it. A script and a timer of your own store the report, and from it you calculate the cooperative's cost coverage.

![The monthly showback report. In the target state of task B, your timer on the front-end at the top starts your service, a systemd unit, once a month. The service runs your script, which queries the showback of OpenNebula and stores the report of the past month as a CSV file with the month in its name. Next to it, the timer opennebula-showback.timer that OpenNebula ships calculates the showback every day. At the bottom you calculate the cost coverage from the report and the costs of a month, the showback total divided by all costs. The costs rest on your assumptions. From this you make a proposal to the board. Notice that two timers work on the showback, yours and the one of OpenNebula.](../../../../assets/figures/en/p3c5-report.svg)

| Starting point | Result |
|---|---|
| Since chapter 3.3 the template `ubuntu` has carried prices. There you calculated the showback by hand and exported it as CSV. OpenNebula calculates it every day with its own timer `opennebula-showback.timer`, but you have neither a timer of your own nor a monthly report yet. | A systemd timer of your own starts your script once a month, and the script stores the showback of the past month as a CSV file. From a report with data you calculate the cost per member and the cooperative's cost coverage. |

### Approach

1. Try out by hand how to calculate the showback of a single month and print it as CSV.
2. Write the script for the report of the past month so that a second run produces the same file.
3. Create the systemd service and timer and decide which user they run as and when.
4. Start a run by hand and check the file and the next run of the timer.
5. Calculate the cost per member and the cost coverage from a report with data.
6. Record values, assumptions and your decision for the documentation.

### Requirements

1. A script of your own stores the showback of the past month as a CSV file whose name gives the month.
2. A systemd timer of your own starts the script once a month. Its name contains `showback` and does not start with `opennebula-`.
3. If the script runs a second time for the same month, it produces the same file without duplicate lines.
4. From the report you calculate the cost per member and the cooperative's cost coverage, with your assumptions stated.

### Showing

- The timer with its last and next run
- A run you start by hand and the file it stores
- The cost coverage with your assumptions and a proposal to the board

:::details[Notes from the lab]
- You can write the script in Bash or Python, for example, since both are available on the front-end
- If your lab did not run yet in the past month, the report for that month is empty. Plan how to show a report with data in the showing, for example one for the current month.
- If the file is missing after a run, `journalctl` shows what your service printed
:::

:::details[Sources]
- The OpenNebula 7.4 [showback documentation](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/) on `oneshowback calculate` and `oneshowback list` with their options
- The Ubuntu 26.04 manual pages on [systemd.timer](https://manpages.ubuntu.com/manpages/resolute/man5/systemd.timer.5.html), [systemd.service](https://manpages.ubuntu.com/manpages/resolute/man5/systemd.service.5.html) and the calendar expressions in [systemd.time](https://manpages.ubuntu.com/manpages/resolute/man7/systemd.time.7.html)
- [Chapter 3.3](../showback/) on prices, showback and the CSV export, with its exercise "Cost model" as a simple calculation of the coverage
:::

## Failure of a node (Task C)

Beat Kläy wants to know what the members notice when a node fails. You switch off a node without warning, observe what happens and derive a proposal for how Wolkenwerk should place its VMs.

![The failure of a node. In the target state of task C, node 1 and node 2 at the bottom run VMs of several members, and the disks of these VMs live in the system datastore of their node. In the example node 2 has been switched off hard. Its VMs and disks can no longer be reached, while node 1 keeps running. At the top, monitoring on the front-end checks the nodes regularly and gets no answer from node 2 anymore. On the right you record the states with times in your log. Your proposal with a rule, an alternative and the trade-off builds on this log and decides how the scheduler places new VMs on the nodes. Notice that the disks stay on the failed node. As long as it is off, nobody can reach them.](../../../../assets/figures/en/p3c5-failure.svg)

| Starting point | Result |
|---|---|
| From the base the VMs `web-1` to `web-3` from part 2 and `praxis-1` and `treuhand-1` from part 3 are running, and the scheduler spreads them over both nodes by striping. Their disks live in the `system` datastore of their node, and the lab has neither shared storage nor a hook for failed hosts. So far you know a failure only from the description in chapter 2.5. | All VMs run again after a hard failure. Your log records with times what OpenNebula showed for nodes, VMs and services in between and what you had to do. Your placement proposal builds on it, with an alternative and the trade-off for the four members. |

### Approach

1. Spread VMs of several members over both nodes and record which VM runs where.
2. Take a snapshot of all three servers and prepare how you will record states with times.
3. Switch one node off hard and watch nodes, VMs and services until OpenNebula reports the failure.
4. Switch the node back on and get all VMs running again.
5. Derive a placement proposal from your observations and weigh it against an alternative.
6. Record times, steps and your decision for the documentation.

:::caution[Snapshot before the failure]
Take a snapshot of all three servers before you switch the node off hard, as [chapter 0.4](../../start/prepare/) recommends. It gets you back if a VM no longer starts afterwards.
:::

### Requirements

1. Before the failure, VMs of several members run on both nodes, and you record which VM runs where.
2. You switch a node off hard and record with times what OpenNebula then shows for nodes, VMs and services.
3. After you switch the node back on, all VMs run again, and you record what you had to do for that.
4. Your placement proposal builds on your observations. It names a strategy or rule, an alternative and the trade-off for the four members.

### Showing

- How the VMs were spread before the failure
- The state of nodes and VMs during the failure with the times you measured
- What you had to do after switching the node back on
- Your proposal with its alternative and trade-off

:::details[Notes from the lab]
- A real failure comes without warning. Switch off the node's VM without shutting down Ubuntu inside it.
- Watch `onehost list` and `onevm list` at short intervals and write down the times. If the service from task A is running, watch it as well.
- If you show the task after chapter 4.2, mind the note on the Kubernetes cluster under [showing the advanced tasks](../../assessment/milestone-1/#showing-the-advanced-tasks) on the milestone page
- If you put part of your proposal into practice, for example for the VMs of one member, you can show its effect in the showing
:::

:::details[Sources]
- [Chapter 2.5](../../iaas/hosts/) with the states of hosts and VMs, the scheduler, maintenance and the failure of a node
- The section [life cycle of a VM](../../iaas/hosts/#life-cycle-of-a-vm) in chapter 2.5 with the commands that change the state of a VM
- [Chapter 3.2](../quotas/#quotas-and-overcommitment) on quotas and overcommitment
- [Rank Scheduler](https://docs.opennebula.io/7.4/product/cloud_system_administration/scheduler/rank_scheduler/) with the scheduling policies
- [VM Groups (Affinity)](https://docs.opennebula.io/7.4/product/cloud_system_administration/capacity_planning/affinity/) with the rules for VM groups
- [VM HA](https://docs.opennebula.io/7.4/product/control_plane_configuration/high_availability/vm_ha/) with the hook for failed hosts
:::
