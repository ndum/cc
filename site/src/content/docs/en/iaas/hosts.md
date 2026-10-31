---
title: Operating hosts
description: The states of a host, capacity with real and allocated usage, overcommitment, migration with and without interruption, maintenance of a node and what happens when a node fails.
sidebar:
  order: 5
---

:::assignment
"Next week node 1 gets more memory," Simone Wyss writes. "The practice must not notice anything. And what actually happens when a node simply fails?"
:::

:::goals
After this chapter you can

- read and change the states of a host,
- tell real from allocated capacity and explain overcommitment,
- move VMs to another node with and without interruption,
- empty a node for maintenance and put it back into service,
- describe what happens to its VMs when a node fails.
:::

## States of a host

`onehost list` shows the state of every node in the column `STAT`.

| State | Meaning | Command |
|---|---|---|
| `on` | monitored and ready for new VMs | `onehost enable` |
| `dsbl` | monitored, running VMs stay, no new VMs are added | `onehost disable` |
| `off` | no longer monitored, for nodes that are switched off | `onehost offline` |
| `err` | monitoring reports an error, often a missing SSH connection | |

## Capacity and overcommitment

`onehost show` lists two values for memory and CPU. `USED (ALLOCATED)` is what the templates of the running VMs reserve, `USED (REAL)` is what they actually use. Three VMs from the template `ubuntu` reserve 3 GB but use about 2 GB when idle. OpenNebula counts CPU in hundredths of a core, so a node with four cores has 400. A VM with `CPU = "0.5"` reserves 50 of them.

```bash
onehost show <node> | sed -n '/HOST SHARES/,/LOCAL SYSTEM/p'
```

The scheduler plans with the reserved capacity. Once a node is fully reserved, no further VM starts there, even if it actually has room left. With the values `RESERVED_CPU` and `RESERVED_MEM` on the host, the platform team can adjust the capacity. A positive value keeps a reserve free, a negative value allows overcommitment. Overcommitment relies on the fact that VMs rarely all work at full load at the same time, and it lowers the cost. If they do all work at once, all of them slow down. Overcommitting memory is riskier than overcommitting CPU, because missing memory makes VMs crash instead of just slowing them down.

## Migration

`onevm migrate` moves a VM to another node. Without further options OpenNebula pauses the VM briefly, copies its memory and disk and lets it continue on the target. With `--live` the VM keeps running during the migration, and only the last part of its memory is transferred in a very short moment. In the lab, migrating a small VM took 7 seconds without the option and 10 seconds with `--live`.

```bash
onevm migrate --live web-1 <other-node>
onevm list
```

## Maintenance of a node

For maintenance you empty a node and then put it back into service. `onehost flush` disables the node and marks its VMs for rescheduling, after which the scheduler moves them to the other nodes. In `onevm list` these VMs briefly carry an asterisk in front of their names. In the lab three VMs had moved after about 10 seconds.

```bash
onehost flush <node>
onevm list
onehost offline <node>
```

After the maintenance you start the node again and release it with `onehost enable`. New VMs then land on both nodes again. The moved VMs stay where they are until you bring them back yourself.

Maintenance only works if the remaining nodes have enough capacity for all VMs. With two nodes, each one must be able to carry all VMs alone. Whoever plans such a reserve keeps it free for maintenance and failures and includes it in the cost.

## Failure of a node

When a node fails, its VMs stop running. After a while `onehost list` shows the node as `err` and its VMs as `unkn`. In the lab the disks of running VMs sit in the `system` datastore of the node itself. As long as the node is down, nobody can reach these disks, and the VMs cannot be started on another node.

A cloud that survives failures therefore needs shared storage that all nodes can reach, such as Ceph or an NFS server, and a rule that automatically restarts the VMs of a failed node on another one. OpenNebula offers hooks for that. The lab deliberately lacks both so that it gets by with three VMs. In part 6 this gap is part of the availability assessment.

::::exercise[Maintenance]
Start two VMs from the template `ubuntu`, empty the node they run on, take it offline and put it back into service. Finally move one VM back live. Write down the commands in the right order.

:::solution
1. `onetemplate instantiate ubuntu --name web-2` and `--name web-3`, then `onevm list` for the nodes
2. `onehost flush <node>` and wait until `onevm list` shows no asterisk anymore
3. `onehost offline <node>`
4. `onehost enable <node>` after the maintenance
5. `onevm migrate --live web-2 <node>`
:::
::::

::::exercise[Capacity]
Gemeinde Hinterbüel wants to know whether two nodes are enough when one is down for maintenance. Use `onehost show` to work out how many VMs from the template `ubuntu` fit on a single node, and explain whether overcommitting memory would be a good idea.

:::solution
A node with 7.2 GB and 400 hundredths of CPU carries seven VMs with 1 GB and 50 hundredths each, so memory sets the limit. Spread over both nodes there must therefore be no more than seven if one node alone has to carry all of them. Overcommitting memory would be risky, because VMs crash when memory runs out, and during maintenance all of them run on one node.
:::
::::
