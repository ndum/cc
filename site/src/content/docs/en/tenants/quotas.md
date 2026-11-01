---
title: Quotas
description: Quotas for groups and users, the kinds of quotas in OpenNebula, the values for the four members and what happens at the limit.
sidebar:
  order: 2
---

:::assignment
"Gemeinde Hinterbüel has a fixed budget," Beat Kläy writes. "It must not use more than it pays for. And Treuhand Aaregg needs more than the others at the end of the month."
:::

:::goals
After this chapter you can

- explain why a cloud needs quotas,
- tell the kinds of quotas in OpenNebula apart,
- set quotas for groups and read their usage,
- describe what happens at the limit of a quota.
:::

## The purpose of quotas

Without a limit one member could fill all nodes, and the others would not get a VM anymore. A quota sets how many resources a group or a user may take at most. It protects the other members, and it makes costs predictable because nobody uses more than agreed. The sum of all quotas may be larger than the cloud. That is overcommitment as in chapter 2.5 and works as long as not everyone uses up their quota at the same time.

## Kinds of quotas

`onegroup show` lists four kinds of quotas with usage and limit for every group.

| Kind | Limits | Example |
|---|---|---|
| VM | number of VMs, CPU, memory and disk size, also for running VMs only | at most 2 VMs with 2048 MB together |
| Datastore | number and size of images in a datastore | at most 20 GB of own images |
| Network | number of addresses from a network | at most 5 addresses from `cc-net` |
| Image | how many running VMs use an image at the same time | |

Quotas exist for groups and for single users. A group quota limits the whole member, a user quota only that user within the group. A dash in the output means that no limit is set.

## The quotas of the members

The members pay different amounts and need different amounts. The fiduciary office needs room for up to three VMs for its service from chapter 3.5.

| Member | Group | VMs | CPU | Memory |
|---|---|---|---|---|
| Praxis Rosenweg | `praxis` | 2 | 1 | 2048 MB |
| Treuhand Aaregg | `treuhand` | 4 | 2 | 4096 MB |
| Veloatelier Matte | `velo` | 2 | 1 | 2048 MB |
| Gemeinde Hinterbüel | `gemeinde` | 2 | 1 | 2048 MB |

The script `lab/tenants/set-quotas.sh` sets these values. For every group it writes a small file with the quota and passes it to `onegroup quota`.

::code{file="lab/tenants/set-quotas.sh"}

```bash
~/cc/lab/tenants/set-quotas.sh
onegroup show praxis | sed -n '/VMS USAGE/,/DATASTORE/p'
```

The CPU of the quota counts like `CPU` in the template. A VM from the template `ubuntu` needs 0.5 of it, so two VMs fill the practice's quota.

## At the limit

OpenNebula checks the quota before it creates a VM. If it is used up, it rejects the request right away, and no VM is created. In the lab the third VM of the practice reported

```text
[one.template.instantiate] User [2] : group [100] limit of 2 reached for VMS quota in VM.
```

The message names the user, the group, the limit and which quota is reached. The member then deletes a VM or asks the platform team for a larger quota. A quota only applies to new requests. If the platform team lowers it below the current usage, the VMs keep running, but no new ones are added.

::::exercise[Lab]
Set the quotas of the four members. As `praxis-admin`, start the VM `praxis-2` next to `praxis-1` from chapter 3.1, then a third VM `praxis-3`. Write down the message and show the usage with `onegroup show praxis`.

:::solution
`set-quotas.sh` reports the values of all four members. `praxis-2` starts, the third VM fails with "limit of 2 reached for VMS quota in VM". `onegroup show praxis` shows `2 / 2` for the VMs and `2048M / 2G` for the memory, and the CPU is used up as well.
:::
::::

::::exercise[Planning a quota]
The bike shop would like a VM with 2 CPU and 2048 MB of memory from a template of its own for Saturdays. Does that fit into its quota? Which quota would you propose, and what does it mean for the other members?

:::solution
No, the bike shop's quota only allows 1 CPU. For this VM and a small one next to it, it would need at least 2.5 CPU and 3072 MB. The quotas of all members would then add up to 6.5 CPU and 11 GB. Both nodes together carry that, but a single node during maintenance no longer does.
:::
::::
