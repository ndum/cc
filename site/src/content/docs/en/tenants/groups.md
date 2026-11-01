---
title: Users, groups and VDCs
description: Multi-tenancy in OpenNebula with one group per member, group admins, a virtual data center for the cooperative and the ACLs that decide who may do what.
sidebar:
  order: 1
---

:::assignment
"From next month all four members want to get going," Simone Wyss writes. "But Praxis Rosenweg must not see anything of the bike shop's web shop, and the other way round. And I don't want a phone call for every new VM."
:::

:::goals
After this chapter you can

- explain what multi-tenancy means in a cloud,
- tell users, groups and group admins in OpenNebula apart,
- create a group with an admin for every member,
- set up a virtual data center (VDC) and justify it,
- read an ACL.
:::

## Multi-tenancy

So far you have worked alone as `oneadmin` and see everything. A cloud for several organisations needs multi-tenancy. Several tenants share the same hardware but only see their own VMs, images and templates. Every tenant manages its own people, and the platform team decides which resources it may use and how much of them.

OpenNebula builds this from three building blocks.

| Building block | What it decides | In the lab |
|---|---|---|
| Group | who belongs together and shares resources apart from the others | one group per member |
| Group admin | who may create users in a group and manage all VMs of the group | `praxis-admin`, `treuhand-admin` and so on |
| VDC | which clusters, hosts, networks and datastores a group may use | the VDC `wolkenwerk` for all members |

A VDC (virtual data center) is a slice of the infrastructure that OpenNebula assigns to one or more groups. Within it the groups only see their own objects, even though they share the same nodes.

![Groups, group admins and the VDC of the members. At the top the VDC wolkenwerk holds the four groups praxis, treuhand, velo and gemeinde, one per member. Every group has a group admin such as praxis-admin who creates the users of the group. Every group may create VMs, images, templates and documents and only sees its own objects. At the bottom is cluster 0 with node 1, node 2, the network cc-net and the datastores. The platform team assigns it to the VDC, so all four groups share the same nodes.](../../../../assets/figures/en/p3c1-tenants.svg)

## Groups and group admins

`onegroup create` creates a group and, if you like, an admin with it. `--resources` decides which objects the members of the group may create themselves. In the lab these are VMs, images, templates and documents. OneFlow in chapter 3.5 needs documents, because a service is a document for OpenNebula.

The script `lab/tenants/make-tenants.sh` creates the four members. It generates random passwords for the group admins and stores them in `~/cc-lab/tenants/`, where only your user can read them.

::code{file="lab/tenants/make-tenants.sh"}

```bash
~/cc/lab/tenants/make-tenants.sh
onegroup list
oneuser list
```

Every new group first lands in the VDC `default`, which grants all clusters to all groups. The script takes the members out of it and gathers them in the VDC `wolkenwerk`. It assigns cluster 0 to the VDC, which holds both nodes, the network `cc-net` and the datastores. Finally it releases the template `ubuntu` and its image for everybody to use with `chmod 604`. The first digit 6 lets the owner use and manage, the 0 gives the group `oneadmin` nothing extra, and the 4 lets everybody else use it.

## Working as a member

To see what a member sees, you log in as its admin. The CLI reads user and password from the file that `ONE_AUTH` points to. The loop creates such a file for all four admins, you need them in the next chapters.

```bash
for m in praxis treuhand velo gemeinde; do
  printf '%s-admin:%s\n' "$m" "$(cat ~/cc-lab/tenants/$m-admin.pass)" > ~/cc-lab/tenants/$m.auth
done
chmod 600 ~/cc-lab/tenants/*.auth
export ONE_AUTH=~/cc-lab/tenants/praxis.auth
onetemplate list
onevnet list
onevm list
unset ONE_AUTH
```

The practice sees the template `ubuntu` and the network `cc-net`, but no VMs of `oneadmin`. So that it can log in to its VMs over SSH, `praxis-admin` needs a public key too, because the context takes it from the user who starts the VM. As `oneadmin` you store it as in chapter 2.4.

```bash
printf 'SSH_PUBLIC_KEY="%s"\n' "$(cat ~/.ssh/id_ed25519.pub)" > /tmp/key.tpl
oneuser update praxis-admin --append /tmp/key.tpl
```

When the practice now starts a VM, the bike shop does not see it. In the lab `onevm list` as `velo-admin` showed no VM at all while two VMs of the practice were running.

## ACLs

Groups and VDCs rest on ACLs (access control lists). Every rule says who may work on which resources with which rights. `oneacl list` shows them as a table of letters, `oneacl create` adds a new rule.

```text
@100 VM+IMAGE+TEMPLATE+DOCUMENT/* CREATE
```

`@100` is the group with the number 100, `VM+IMAGE+TEMPLATE+DOCUMENT` are the resources, `/*` means all objects of that kind, and `CREATE` is the right. `onegroup create` made this rule from `--resources`. In `oneacl list` the same rule reads `V--I-T---O---------` with the operation `---c`. If a resource was forgotten, you add it with a rule of your own instead of creating the group again.

::::exercise[Lab]
Create the four members, log in as `praxis-admin` and start the VM `praxis-1` from the template `ubuntu`. Show as `velo-admin` that the bike shop does not see this VM.

:::solution
After `make-tenants.sh`, `onegroup list` shows the groups `praxis`, `treuhand`, `velo` and `gemeinde`. As `praxis-admin`, `onetemplate instantiate ubuntu --name praxis-1` starts the VM, and `onevm list` shows it with the owner `praxis-admin` and the group `praxis`. With the auth file of `velo-admin`, `onevm list` stays empty.
:::
::::

::::exercise[Group or VDC]
Gemeinde Hinterbüel wants to buy a node of its own later that only it uses. Is a group of its own enough for that, or does it need a VDC of its own? Explain.

:::solution
A group only separates the objects, the municipality's VMs could still run on any node. A VDC of its own with only the new node assigned makes sure the municipality's VMs run only there. So it needs both, the group for the objects and the VDC for the infrastructure.
:::
::::
