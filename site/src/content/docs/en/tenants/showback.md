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
After this chapter you can:

- Tell showback and chargeback apart
- Store prices per resource in a template
- Calculate and read the costs of the members with `oneshowback`
- Work out the cost of a VM per hour and per month yourself
- Check with a simple cost model whether the prices cover the costs
:::

## Showback and chargeback

Anyone who shares a cloud wants to know who uses how much of it. There are two approaches. **Showback** shows every business unit what it has used, without any money changing hands. **Chargeback** charges this usage to the unit's budget. Showback comes first, because only when the numbers are right and everybody understands them can you base an invoice on them. Whether an organization introduces chargeback afterwards depends on its accounting.

Wolkenwerk Bern starts with showback. The members see their costs every month, and the board decides later how the cooperative charges them.

## Prices in the template

OpenNebula works with three hourly prices stored in the template. `CPU_COST` applies per CPU of the template, `MEMORY_COST` per MB of memory and `DISK_COST` per MB of disk. The prices in the lab are made up for the case and are meant in Swiss francs. The [showback documentation](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/#set-the-vm-cost) describes how to set the prices of a template. The template `ubuntu` belongs to `oneadmin`, so you add the prices as `oneadmin`, without `ONE_AUTH`.

::code{file="lab/tenants/costs.tpl"}

```bash
onetemplate update ubuntu --append ~/cc/lab/tenants/costs.tpl
onetemplate show ubuntu | grep COST
```

A VM takes the prices from the template when it starts. VMs that were started earlier therefore cost nothing, and a reboot with `onevm reboot` does not change that. In the lab you therefore terminate `praxis-1` as `praxis-admin` and start it again from the template under the same name. The old VM counts against the practice's quota until it is completely gone, which takes a few seconds. So check with `onevm list` that `praxis-1` has disappeared from the list before you start it again.

```bash
ONE_AUTH=~/cc-lab/tenants/praxis.auth onevm terminate praxis-1
ONE_AUTH=~/cc-lab/tenants/praxis.auth onevm list
```

Once `praxis-1` is missing from the list, start it again. In addition, the fiduciary office starts its first VM `treuhand-1`, so that a second member has costs as well.

```bash
ONE_AUTH=~/cc-lab/tenants/praxis.auth onetemplate instantiate ubuntu --name praxis-1
ONE_AUTH=~/cc-lab/tenants/treuhand.auth onetemplate instantiate ubuntu --name treuhand-1
```

## Calculating costs

`oneshowback calculate` calculates the costs of all VMs from their running time and stores them per month. OpenNebula ships the timer `opennebula-showback.timer`, which runs this calculation every day. For the exercises you start it yourself so that you do not have to wait until midnight. `oneshowback list` then shows owner, group, month, hours, running time and cost per VM. With `-g` you only see one member. The [guide to the monthly reports](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/#calculate-monthly-reports) shows how to calculate and retrieve single months. According to the guide the calculation runs as `oneadmin`, so you run this block without `ONE_AUTH` as well.

```bash
oneshowback calculate
oneshowback list
oneshowback list -g treuhand
oneshowback list --csv > ~/cc-lab/showback.csv
```

You can repeat the calculation at any time, and OpenNebula then calculates the current month up to today. A few minutes of running time are enough for the check and the screenshot of milestone 1. In the lab, `oneshowback list` showed `0.01` each for `praxis-1` and `treuhand-1` after a little more than ten minutes. The amounts in the picture below and in the solution of the exercise come from a calculation after about an hour. To see them yourself, calculate the showback again later, for example while you work on chapter 3.4.

With `oneshowback list` a group admin only sees the VMs of their own group. Each member can therefore check its own costs without seeing those of the others.

Sunstone shows the costs in the "Showback" tab of a group.

![The Showback tab of the group praxis in Sunstone. The top shows the costs per month, the bottom the costs and hours of each VM. The lab had only run for about an hour with prices, so the amounts are small. The VM praxis-1 cost 0.05 francs in that hour, which matches the calculation in the next section.](../../../../assets/screenshots/sunstone-showback.png)

## The cost of a VM

A VM from the template `ubuntu` has 0.5 CPU, 1024 MB of memory and a disk of 3584 MB. Per hour it costs

```text
0.5 × 0.05 + 1024 × 0.00002 + 3584 × 0.000001 = 0.025 + 0.0205 + 0.0036 ≈ 0.049
```

Over 30 days, or 720 hours, that comes to about 35 francs. The cost follows the time a VM holds resources on a host. A VM switched off with `onevm poweroff` therefore keeps costing. Only `onevm undeploy` takes it off the host, and then it costs nothing in this model. It pays for the members to take VMs they do not need for a while off the host that way.

![The showback calculation. At the top left the accounting of OpenNebula supplies the running time of the VM treuhand-1, 720 hours in one month. Next to it are the hourly prices from the template ubuntu. oneshowback calculate turns these into CPU hours, MB hours of memory and MB hours of disk and multiplies them by CPU_COST, MEMORY_COST and DISK_COST. That gives 18.00, 14.75 and 2.58 francs, together 35.33 francs for the VM in one month. At the bottom right, oneshowback list -g treuhand lists the cost of every VM of the group, and together they make up the member's showback. A group admin only sees the VMs of their own group. Notice that every row uses the same 720 hours, the time in which the VM holds resources on a host.](../../../../assets/figures/en/p3c3-showback.svg)

In the end the prices have to cover the cooperative's costs. These include the hardware over its lifetime, power, licenses, backup and the work of the platform team, as well as the reserve for maintenance from chapter 2.5. A simple approach divides the yearly costs by the capacity that can be sold in a year. Chapter 6.4 works with all the costs, and advanced task C of milestone 4 does the same for a member of your own. In [advanced task B](../advanced/#showback-as-a-report-task-b) you work out from a monthly report how far the prices cover the cooperative's costs.

::::exercise[Lab]
Add the prices to the template. As `praxis-admin`, terminate the VM `praxis-1` and start it again from the template under the same name. Also start the VM `treuhand-1` as `treuhand-admin`. Calculate the showback after a few minutes and export the list as CSV to `~/cc-lab/showback.csv`. Capture the output of `oneshowback list` and `cat ~/cc-lab/showback.csv` in `7-showback.png` for requirement 7 of milestone 1, and copy the picture into the folder `m1/` of your hand-in repo as in [chapter 3.1](../groups/). After about an hour you can calculate the showback again and compare the amounts with the solution. Carry on with chapter 3.4 in the meantime.

:::solution
`onetemplate show ubuntu` shows `CPU_COST`, `MEMORY_COST` and `DISK_COST`. After a few minutes, `oneshowback list` shows small amounts for the new VMs, `0.01` each after a little more than ten minutes in the lab. After about an hour it lists the new VMs with about one hour and costs around `0.05`. The old VMs without prices appear with cost 0.
:::
::::

::::exercise[Cost model]
The two nodes cost 7,000 francs together and run for five years. Power, backup and work cost 6,000 francs a year. On average 10 VMs from the template `ubuntu` are in use. Do the lab prices cover the costs? What would you propose to the board?

:::solution
The costs per year are 7,000 / 5 + 6,000 = 7,400 francs. 10 VMs at 35 francs a month bring in 4,200 francs a year. So the prices cover only a little more than half. Either the prices go up to about 1.8 times their current level, or utilization has to grow. A fixed base fee per member for the work of the platform team would be another option.
:::
::::
