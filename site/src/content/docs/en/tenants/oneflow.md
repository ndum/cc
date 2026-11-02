---
title: Elasticity with OneFlow
description: Services with roles in OneFlow, cardinality, elasticity rules by load and by schedule, OneGate and a service for the fiduciary office that grows at the end of the month.
sidebar:
  order: 5
  badge:
    text: Advanced
    variant: note
---

:::assignment
"At the end of the month we run the accounting of all our clients," Treuhand Aaregg writes. "Then we need more computing power, and for the rest of the month hardly any. We don't want to call every time."
:::

:::goals
After this chapter you can:

- Tell elasticity and self-service apart
- Describe and create a service with roles in OneFlow
- Write elasticity rules by load and by schedule
- Observe and explain how a service grows under load and shrinks again
:::

:::note[Advanced chapter]
This chapter belongs to the advanced tasks of milestone 1. You do not need it for the base, and part 4 does not rely on the fiduciary office's service.
:::

## Elasticity

Rapid elasticity is another characteristic from chapter 1.1. Resources grow with the load and shrink again, ideally without anyone stepping in. Self-service from chapter 3.4 means that a member can start a VM itself. Elasticity means that the system adjusts the number of VMs on its own, following rules.

## Services and roles

OneFlow manages services made of several VMs. A service consists of roles, such as a database and several application servers, and every role starts its VMs from a template. The cardinality is the number of VMs of a role. `min_vms` and `max_vms` limit it, and the elasticity rules change it within these limits.

The script `lab/tenants/make-service.sh` writes the service template of the fiduciary office. It has one role `app` from the template `ubuntu` that starts with one VM and grows to three at most.

::code{file="lab/tenants/make-service.sh" lines="13-32"}

| Setting | Meaning |
|---|---|
| `cardinality` | number of VMs at the start |
| `min_vms`, `max_vms` | limits within which the rules change the cardinality |
| `cooldown` | seconds after a change during which no further rule applies |
| `expression` | condition on monitoring values, here the CPU load of the VMs in percent |
| `period`, `period_number` | how long the condition has to hold, here two or four periods of 30 seconds |
| `type`, `adjust` | what happens, `CHANGE` with `1` means one VM more |

## Starting the service

As `oneadmin` you create the service template and release it to the members for use. The fiduciary office should instantiate it itself so that the service belongs to it and counts against its quota. You also add your public key to `treuhand-admin`, as you did for `praxis-admin` in chapter 3.1. Each time a VM of the service starts, the context takes the key from the user who started the service.

```bash
~/cc/lab/tenants/make-service.sh > ~/cc-lab/treuhand-service.json
oneflow-template create ~/cc-lab/treuhand-service.json
oneflow-template chmod treuhand-buchhaltung 604
printf 'SSH_PUBLIC_KEY="%s"\n' "$(cat ~/.ssh/id_ed25519.pub)" > /tmp/key.tpl
oneuser update treuhand-admin --append /tmp/key.tpl

printf 'treuhand-admin:%s\n' "$(cat ~/cc-lab/tenants/treuhand-admin.pass)" > ~/cc-lab/tenants/treuhand.auth
chmod 600 ~/cc-lab/tenants/treuhand.auth
export ONE_AUTH=~/cc-lab/tenants/treuhand.auth
oneflow-template instantiate treuhand-buchhaltung
oneflow list
unset ONE_AUTH
```

If the group lacks the right to create documents, OneFlow reports `Not authorized to perform CREATE DOCUMENT`. Chapter 3.1 shows how to add that right with an ACL. After about a minute the service is `RUNNING` with one VM. The VM carries your key because you added it to `treuhand-admin` above.

## Growing under load

Create load in the service's VM and watch the service on the front-end.

```bash
ssh root@<address-of-the-vm> 'nohup sh -c "yes > /dev/null" >/dev/null 2>&1 &'
watch -n 10 oneflow show <service>
```

In the lab the role grew from one to two VMs after about 155 seconds. The rule asks for two periods of 30 seconds above 60%. On top of that come the start of the VM and the time until monitoring delivers new values. After that the service was in the state `COOLDOWN`. Once the load was stopped with `pkill yes`, it shrank back to one VM after about 345 seconds. The rule for shrinking is deliberately slower so that the service does not flip back and forth. OneFlow takes the CPU load as the average of the VMs of a role. One VM under full load and one idle VM average 50%, which is why the service does not grow any further.

The CPU value comes from OpenNebula's monitoring. Applications can also report values of their own through OneGate, such as the length of a queue, and the rules can use these values. For that the VM needs a token in its context and the address of OneGate.

## Growing by schedule

The fiduciary office knows in advance when the load comes. Instead of waiting for the load, a rule by schedule can set the cardinality. `recurrence` is an expression in cron format.

```json
"scheduled_policies": [
  { "type": "CARDINALITY", "adjust": 3, "recurrence": "0 6 28 * *" },
  { "type": "CARDINALITY", "adjust": 1, "recurrence": "0 20 3 * *" }
]
```

These rules set the role to three VMs on the 28th of every month at 6 a.m. and back to one on the 3rd of the following month at 8 p.m. In the lab, such a rule firing every two minutes set the cardinality from one to two right on time. Rules by load and by schedule can be combined. The schedule then covers the known peak at the end of the month, and the rule by load steps in when the load rises unexpectedly.

Every new VM counts against the fiduciary office's quota. With four VMs, 2 CPU and 4096 MB its quota from chapter 3.2 is enough for the three VMs of the service and one more VM. If `max_vms` were above the quota, OpenNebula would reject the additional VMs as in chapter 3.2. Quota and `max_vms` therefore have to match.

::::exercise[Lab]
Instantiate the service as `treuhand-admin` and create load. Write down the time until the second VM appears and, after stopping the load, the time until the service shrinks. Finally run the check of this part.

```bash
python3 ~/cc/checks/check.py tenants
```

:::solution
After two to three minutes, `oneflow show` shows "Role app scaling up from 1 to 2 nodes" in the log and the state `COOLDOWN`. Once the load is stopped, "scaling down" follows after five to six minutes. The check reports "19 of 19 base checks passed" and "2 of 2 checks of the advanced tasks passed".
:::
::::

::::exercise[Designing rules]
Veloatelier Matte has a lot of traffic in its web shop every Saturday from 9 a.m. to 5 p.m. and unexpected peaks on sale days. Design the rules for a service with a role `web`. Justify your values for `min_vms` and `max_vms` as well as the quota.

:::solution
A rule by schedule sets the cardinality to two every Saturday at 8:30 a.m. (`"30 8 * * 6"`) and a second one back to one at 5:30 p.m. (`"30 17 * * 6"`). A rule by load adds one VM at `CPU > 70` over two periods, and another removes one at `CPU < 20` over four periods. `min_vms` is 1 and `max_vms` is 3. The bike shop's quota therefore has to allow at least three VMs, more than the two from chapter 3.2.
:::
::::
