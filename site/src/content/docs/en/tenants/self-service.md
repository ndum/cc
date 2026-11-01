---
title: Self-service
description: The Sunstone views for members and group admins, shared templates, own copies and users, and what a member may change itself.
sidebar:
  order: 4
---

:::assignment
"Praxis Rosenweg has a new medical assistant who needs a test VM now and then," Simone Wyss writes. "Can the practice set that up itself without us having to do anything?"
:::

:::goals
After this chapter you can

- explain what self-service means in a cloud and why it is one of the characteristics of a cloud,
- tell the Sunstone views for members and group admins apart,
- create users and derive templates of your own as a group admin,
- explain what a member may change and what it may not.
:::

## Self-service

In chapter 1.1 on-demand self-service is one of the five characteristics of a cloud. A member gets resources itself when it needs them, without asking the platform team. The platform team sets the frame with the groups, VDC and quotas of chapters 3.1 and 3.2 and with shared templates. Within this frame the members act on their own.

## Sunstone views

Sunstone does not show everybody the same. Which view someone gets is stored in the template of their group. `onegroup create` set these values for the members.

```text
FIREEDGE=[
  DEFAULT_VIEW="cloud",
  GROUP_ADMIN_DEFAULT_VIEW="groupadmin",
  GROUP_ADMIN_VIEWS="groupadmin",
  VIEWS="cloud" ]
```

| View | For | What it shows |
|---|---|---|
| `cloud` | users of a member | dashboard, VMs, templates, services, marketplace and their own account |
| `groupadmin` | group admins | in addition images, networks, users of the group, service templates, security groups and backups |
| `admin` | the platform team | everything, including hosts, clusters, datastores and VDCs |

The views live on the front-end in `/etc/one/fireedge/sunstone/views/`. Every view is a folder with one file per tab. If you want to take a tab away from a view, you adapt these files.

Log in to Sunstone at `http://<front-end>:2616` as `praxis-admin`. You see the view `groupadmin` with the practice's VMs and the template `ubuntu`. Hosts and datastores are missing, they stay with the platform team.

## Users in the group

A group admin creates the users of its member itself. New users land in its group and count against its quota.

```bash
export ONE_AUTH=~/cc-lab/tenants/praxis.auth
oneuser create praxis-mpa "<password>"
oneuser list
unset ONE_AUTH
```

The medical assistant then logs in to Sunstone, gets the view `cloud` and starts VMs from the template `ubuntu`. The group admin sees and manages these VMs as well.

## The limits of a member

The template `ubuntu` belongs to `oneadmin`, and thanks to `chmod 604` the members may only use it. An attempt to change it fails.

```text
[one.template.update] User [2] : Not authorized to perform MANAGE TEMPLATE [1].
```

The members may create templates, though, since their group allows it from chapter 3.1. If the practice needs a larger VM, it copies the template and changes its copy.

```bash
onetemplate clone ubuntu praxis-gross
onetemplate update praxis-gross
```

The copy takes over everything, including the prices from chapter 3.3, and belongs to the practice. Whatever it puts in there is still limited by its quota. This splits the work. The platform team maintains a few shared templates, networks and images, and the members set themselves up within their quota.

::::exercise[Lab]
As `praxis-admin`, create the user `praxis-mpa`, log in with it in Sunstone and start a VM. Check as `praxis-admin` that you see it, and delete it.

:::solution
`oneuser create praxis-mpa <password>` creates the user in the group `praxis`. In Sunstone the view `cloud` shows the template `ubuntu`, and the VM only starts as long as the practice's quota has room. As `praxis-admin`, `onevm list` shows the VM with the owner `praxis-mpa`, and `onevm terminate` deletes it.
:::
::::

::::exercise[Setting the frame]
Gemeinde Hinterbüel wants its users to start VMs but not upload images of their own. How do you implement that?

:::solution
The group `gemeinde` only gets the resources `VM`, `TEMPLATE` and `DOCUMENT` instead of `IMAGE` as well. For an existing group you delete the group's ACL with `oneacl delete` and create it again without `IMAGE`. The view `cloud` has no tab for images anyway, but the ACL also prevents uploads through the CLI.
:::
::::
