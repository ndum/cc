---
title: Showback
description: Cost per resource in the template, the calculation with oneshowback, a simple cost model for the cooperative and the difference between showback and chargeback.
sidebar:
  order: 3
---

:::assignment
"The board wants to know what every member uses," Beat Kläy writes. "We don't charge anything yet, but every member should see its costs."
:::

:::goals
After this chapter you can

- tell showback and chargeback apart,
- store prices per resource in a template,
- calculate and read the costs of the members with `oneshowback`,
- work out the cost of a VM per hour and per month yourself.
:::

## Showback and chargeback

Whoever shares a cloud wants to know who uses how much of it. The FinOps Foundation distinguishes two ways. Showback shows every unit what it has used, without any money changing hands. Chargeback charges this usage to the unit's budget. Showback is the first step, because only when the numbers are right and everybody understands them can you base an invoice on them. Whether an organisation introduces chargeback afterwards depends on its accounting.

Wolkenwerk Bern starts with showback. The members see their costs every month, and the board decides later how the cooperative charges them.

## Prices in the template

OpenNebula calculates with three prices per hour that are stored in the template. `CPU_COST` applies per CPU of the template, `MEMORY_COST` per MB of memory and `DISK_COST` per MB of disk. The prices in the lab are invented for the case and meant in Swiss francs.

::code{file="lab/tenants/costs.tpl"}

```bash
onetemplate update ubuntu --append ~/cc/lab/tenants/costs.tpl
onetemplate show ubuntu | grep COST
```

A VM takes the prices from the template when it starts. VMs started before therefore cost nothing. A reboot with `onevm reboot` is not enough. In the lab you terminate the members' VMs with `onevm terminate` after adding the prices and start them again from the template.

## Calculating costs

`oneshowback calculate` calculates the costs of all VMs from their running time and stores them per month. OpenNebula ships the timer `opennebula-showback.timer` for this, which starts the calculation every day. For the exercises you start it yourself so that you do not have to wait until midnight. `oneshowback list` then shows owner, group, month, hours, running time and cost per VM. With `-g` you only see one member.

```bash
oneshowback calculate
oneshowback list
oneshowback list -g treuhand
oneshowback list --csv > ~/cc-lab/showback.csv
```

A group admin only sees the VMs of its own group with `oneshowback list`. So every member can check its own costs without seeing those of the others.

## The cost of a VM

A VM from the template `ubuntu` has 0.5 CPU, 1024 MB of memory and a disk of 3584 MB. Per hour it costs

```text
0.5 × 0.05 + 1024 × 0.00002 + 3584 × 0.000001 = 0.025 + 0.0205 + 0.0036 ≈ 0.049
```

Over 30 days with 720 hours that makes about 35 francs. The cost depends on the running time, a stopped VM costs nothing in this model. That is why it pays for the members to stop VMs they do not need.

In the end the prices have to cover the cooperative's costs. These include the hardware over its lifetime, power, licences, backup and the work of the platform team, including the reserve for maintenance from chapter 2.5. A simple approach divides the yearly costs by the capacity that can be sold in a year. Chapter 6.4 calculates with all costs, and in the advanced task of milestone 4 also for a member of your own.

::::exercise[Lab]
Add the prices to the template. As `praxis-admin`, terminate the VM `praxis-1` with `onevm terminate` and start it again from the template under the same name. Also start the VM `treuhand-1` as `treuhand-admin`. Calculate the showback after one hour, and carry on with chapter 3.4 in the meantime. Export the list as CSV to your hand-in repo.

:::solution
`onetemplate show ubuntu` shows `CPU_COST`, `MEMORY_COST` and `DISK_COST`. After `oneshowback calculate`, `oneshowback list` lists the new VMs with about one hour and costs around 0.05. The old VMs without prices appear with cost 0.
:::
::::

::::exercise[Cost model]
The two nodes cost 7,000 francs together and run for five years. Power, backup and work cost 6,000 francs a year. On average 10 VMs from the template `ubuntu` are in use. Do the lab prices cover the costs? What would you propose to the board?

:::solution
The costs per year are 7,000 / 5 + 6,000 = 7,400 francs. 10 VMs at 35 francs a month bring in 4,200 francs a year. So the prices cover only a little more than half. Either the prices rise to about 1.8 times, or utilisation has to grow. A fixed base fee per member for the work of the platform team would be another option.
:::
::::
