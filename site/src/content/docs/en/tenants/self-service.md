---
title: Self-service
description: The Sunstone views for members and group admins, shared templates and private copies, users in a group and what a member may change on its own.
sidebar:
  order: 4
---

:::assignment
"Praxis Rosenweg has a new medical assistant who needs a test VM now and then," Simone Wyss writes. "Can the practice set that up itself without us having to do anything?"
:::

:::goals
After this chapter you can:

- Explain what self-service means in a cloud and why it is one of the characteristics of a cloud
- Tell the Sunstone views for members and group admins apart
- Create users and derive templates of your own as a group admin
- Explain what a member may change and what it may not
- Explain what a service catalog is and who maintains it
:::

## Self-service

In [chapter 1.1](../../basics/characteristics/), **on-demand self-service** is one of the five characteristics of a cloud. The NIST definition in [SP 800-145](https://csrc.nist.gov/pubs/sp/800/145/final) requires that consumers can provision computing power and storage on their own and as needed, without any human interaction on the provider's side. So a member gets resources when it needs them, without waiting for the platform team to work through a ticket.

The platform team sets the framework with the groups, the VDC and the quotas from chapters 3.1 and 3.2, and with shared templates. Within this framework the members act on their own.

## Duties of the platform team and the members

Self-service redistributes the work between the platform team and the members. The split follows the shared responsibility for IaaS from [chapter 1.2](../../basics/models/#shared-responsibility). The platform team runs the nodes, the network, the datastores and OpenNebula itself. It creates the members, sets their quotas and prices and maintains the shared templates and images. The member is responsible for whatever runs inside a VM. It creates its users, starts and deletes its VMs, keeps their operating system up to date and backs up its data. The line runs at the hypervisor, with the platform team below it and the member above it.

For the platform team this means fewer individual requests and more time spent on good defaults. A mistake in a shared template affects every member at once.

## Sunstone views

Sunstone does not show everybody the same thing. The template of a user's group defines which view they get. `onegroup create` set these values for the members.

```text
FIREEDGE=[
  DEFAULT_VIEW="cloud",
  GROUP_ADMIN_DEFAULT_VIEW="groupadmin",
  GROUP_ADMIN_VIEWS="groupadmin",
  VIEWS="cloud" ]
```

Sunstone shows these values under "System › Groups" in the "Info" tab of the group.

![The group praxis in Sunstone. Among its attributes is the FIREEDGE section with the view cloud for the users of the group and groupadmin for its admins.](../../../../assets/screenshots/sunstone-group-views.png)

| View | For | What it shows |
|---|---|---|
| `cloud` | users of a member | dashboard, VMs, templates, services, marketplace and their own account |
| `user` | users who need more, not assigned in the lab | in addition images, networks, security groups and backups, but no users and no service templates |
| `groupadmin` | group admins | in addition images, networks, users of the group, service templates, security groups and backups |
| `admin` | the platform team | everything, including hosts, clusters, datastores and VDCs |

OpenNebula 7.4 ships these four views, and the [views documentation](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/fireedge_sunstone_views/) describes them. The view `cloud` is meant for end users who only start VMs from ready-made templates.

The views live on the front-end in `/etc/one/fireedge/sunstone/views/`. Every view is a folder with one file per tab. If you want to take a tab away from a view, you adapt these files. If a group has no values of its own, the assignment in `sunstone-views.yaml` in the same folder applies. There the group `oneadmin` gets all four views and everybody else gets `user` and `cloud`.

Open Sunstone in the browser of the client (the Kali VM on smartlearn, or your PC if you run your own hypervisor) at the address of your front-end as in [chapter 2.2](../../iaas/installation/#checking), so for the code `mmuster` at `http://192.168.210.137:2616/`. If you are still logged in as `oneadmin` from the earlier chapters, log out first or open a private Firefox window with Ctrl+Shift+P. The browser keeps only one Sunstone login per address, and a private window has a login of its own. Then log in as `praxis-admin`. Its password is in `~/cc-lab/tenants/praxis-admin.pass` on the front-end. `cat ~/cc-lab/tenants/praxis-admin.pass` prints it, and Ctrl+Shift+C copies it in the client's terminal. You see the view `groupadmin` with the practice's VMs and the template `ubuntu`. Hosts and datastores are missing because they remain the platform team's business.

![Sunstone as praxis-admin in the view groupadmin, which the menu calls Admin group. Under Instances › VMs only the practice's VM praxis-1 appears. The menu has no Infrastructure section with the hosts, and Storage lists Images, Files, Backups and Apps but no datastores. The card still names the node of the VM as its host. The user praxis-admin and the group praxis appear at the bottom left. The picture was taken in part 6, which is why only praxis-1 is running.](../../../../assets/screenshots/sunstone-groupadmin-vms.png)

## ACLs behind the views

A view only hides tabs and buttons, which makes the interface easier to use. It is not a security boundary, because for every action Sunstone calls the same OpenNebula API as the CLI. Only the API decides whether a request is allowed.

OpenNebula checks every request in a fixed order, as the [documentation on permissions and ACLs](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/chmod/) describes. The user `oneadmin` and the group `oneadmin` may do anything. For VMs, networks, images, templates and documents, the object's permissions for owner, group and others come next, such as the `chmod 604` of the template `ubuntu`. If they do not settle it, OpenNebula walks through the ACLs from chapter 3.1 until a rule allows the request. ACLs only grant rights and never take any away. If no rule allows the request, OpenNebula refuses it.

To stop a member from doing something, you therefore change the ACLs or the permissions of the objects. A tab missing from a view does not stop anyone who uses the CLI or the API.

![Roles and views in Sunstone. On the left is the platform team as oneadmin with the view admin. It runs the nodes, networks and datastores, creates the members with their admins, sets quotas and prices and maintains the shared template ubuntu. On the right is the member praxis. Its group admin praxis-admin has the view groupadmin and creates the users of the group, manages all VMs of the group, sets the quotas of their users and copies templates, but may not change the template ubuntu. The medical assistant praxis-mpa has the view cloud. This account starts VMs from ready-made templates and at most adjusts size and disks, and these VMs count against the group's quota. Look at the line at the bottom. A view only hides tabs. Permissions and ACLs decide whether a request is allowed.](../../../../assets/figures/en/p3c4-roles.svg)

## Users in the group

A member's group admin creates the member's users. New users land in the admin's group, and their VMs count against the group's quota. The [users documentation](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/manage_users/#adding-users) describes `oneuser create`.

With `praxis-1` and `praxis-2` the practice's quota from chapter 3.2 is full. So that the medical assistant can start a VM in a moment, first delete `praxis-2` as `praxis-admin`. Sunstone sets the CPU of a new VM to 1, which then just fits next to `praxis-1` into the practice's 1.5 CPU.

```bash
ONE_AUTH=~/cc-lab/tenants/praxis.auth onevm terminate praxis-2
```

`read` takes the password of the MPA without showing it, so it appears neither on the screen nor in the shell history. Type it after this command and confirm with Enter.

```bash
read -rsp "Password for praxis-mpa: " pw; echo
```

The following block creates the MPA as `praxis-admin` with this password and then removes the variable.

```bash
export ONE_AUTH=~/cc-lab/tenants/praxis.auth
oneuser create praxis-mpa "$pw"
oneuser list
unset ONE_AUTH pw
```

Then log out of Sunstone as `praxis-admin` and log in as `praxis-mpa` with the password you have just typed. The medical assistant gets the view `cloud`. Start a VM from the template `ubuntu` there and name it `mpa-1`. As the group admin, `praxis-admin` sees and manages this VM as well.

```bash
ONE_AUTH=~/cc-lab/tenants/praxis.auth onevm list
```

The list shows `mpa-1` with the owner `praxis-mpa`. Capture it in `7-self-service.png` for requirement 7 of milestone 1 and copy the picture into the folder `m1/` of your hand-in repo as in [chapter 3.1](../groups/). Then delete the VM again.

```bash
ONE_AUTH=~/cc-lab/tenants/praxis.auth onevm terminate mpa-1
```

## The service catalog

A **service catalog** is the list of services a provider offers ready-made, each with a defined scope, price and owner. Whoever needs something picks it from the catalog instead of describing a wish in free form. For the provider this means it only runs what it has tested and documented.

In OpenNebula the shared templates form this catalog. The template `ubuntu` fixes image, size, network and context, and since chapter 3.3 it carries its price as well. The OneFlow service templates from [chapter 3.5](../advanced/#services-and-roles) add services made of several VMs. According to the [Cloud View documentation](https://docs.opennebula.io/7.4/product/control_plane_configuration/graphical_user_interface/cloud_view/), users there select one of the templates the administrators prepared and at most adjust capacity and disks before they start it. The catalog is the interface between the platform team and the members. Every entry is a promise to maintain it, so the platform team only adds what it can actually run.

## The limits of a member

The template `ubuntu` belongs to `oneadmin`, and `chmod 604` lets the members only use it. An attempt to change it fails with this message:

```text
[one.template.update] User [2] : Not authorized to perform MANAGE TEMPLATE [1].
```

The members may create templates of their own, though, because their group has allowed it since chapter 3.1. If the practice needs a larger VM, it copies the template and changes the copy. The [VM template documentation](https://docs.opennebula.io/7.4/product/virtual_machines_operation/virtual_machines/vm_templates/#cloning-templates) describes both steps. The following block does both as `praxis-admin` and gives the copy 2 GB of memory. With `--append`, `onetemplate update` changes only the values from the file and opens no editor. The rest of the template stays as it is. At first only its owner may use and manage a new template, because the mask `DEFAULT_UMASK` in the OpenNebula configuration leaves it the permissions `600` out of the box. The [permissions documentation](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/chmod/) explains this mask. With `chmod 640` the other users of the practice, such as the medical assistant, may use the copy as well. Other members still may not use it. `onetemplate show` then shows owner, group and memory.

```bash
export ONE_AUTH=~/cc-lab/tenants/praxis.auth
onetemplate clone ubuntu praxis-gross
echo 'MEMORY = "2048"' > /tmp/praxis-gross.tpl
onetemplate update praxis-gross --append /tmp/praxis-gross.tpl
onetemplate chmod praxis-gross 640
onetemplate show praxis-gross | grep -E '^(USER|GROUP) |MEMORY='
unset ONE_AUTH
```

The copy belongs to the practice. Apart from the memory and the permissions, it takes over everything from `ubuntu`, including the prices from chapter 3.3. Whatever the practice puts in it is still limited by its quota. The platform team only has to maintain a few shared templates, networks and images, and the members set up everything else themselves within their quota.

Under "Templates › VM Templates", `oneadmin` sees the templates of the platform team and the copies of the members side by side.

![The templates in Sunstone, logged in as oneadmin. The copy praxis-gross belongs to praxis-admin and the group praxis. In the picture it still has the 1 GB of memory of ubuntu, without the change to 2 GB. The templates ubuntu and ubuntu-medium belong to oneadmin, and OpenNebula created ubuntu-26.04 when the image was exported from the marketplace.](../../../../assets/screenshots/sunstone-templates.png)

## The check of milestone 1

Part 3 completes milestone 1. Its check `m1` runs the check `tenants` of this part, which tests the groups with their admins and quotas and the VDC `wolkenwerk`. It also tests the sharing and the prices of the template `ubuntu`, the showback and the user `praxis-mpa`. On top of that, `m1` tests the municipality's quota from your personal values, looks for traces of the advanced tasks and draws two questions that you answer in the showing of the advanced tasks. Run it only after you have calculated the showback of chapter 3.3. Until then the showback has no costs yet, and the check reports `[!!]` there. The check always works as `oneadmin`, even if `ONE_AUTH` is still set in your shell.

```bash
python3 ~/cc/checks/check.py m1
```

The three lines marked `[+!!]` or `[+ok]` belong to advanced tasks A and B in chapter 3.5 and do not count for the base. If the line for the municipality reports `[!!]`, the hint below it names the values the check found. Then fix the line in your copy of `set-quotas.sh` from [chapter 3.2](../quotas/#the-quotas-of-the-members) and run the copy again. Without your personal values and the questions, `python3 ~/cc/checks/check.py tenants` checks only this part with its 20 base checks.

Like every other report, the check saves this one in `~/cc-reports/`. As in [chapter 0.5](../../start/tools/#uploading-the-report-and-screenshots), the following block first fetches whatever is new in the repo with `git pull`. Then it puts the report into the folder `reports/` of your hand-in repo and uploads it together with the screenshots of part 3 in `m1/`.

```bash
source /etc/cc-lab.env
cd ~/cc-$CC_CODE
git pull
cp ~/cc-reports/m1-*.txt reports/
git add reports m1
git commit -m "Milestone 1"
git push
```

::::exercise[Lab]
Delete the VM `praxis-2` as `praxis-admin` so that the practice's quota has room. Create the user `praxis-mpa`, log in to Sunstone as this user in the browser of the client and start the VM `mpa-1`. As `praxis-admin`, check that you can see it. Capture that in `7-self-service.png` for requirement 7 of milestone 1, then delete the VM. Finally run the check `m1` and add its report to your hand-in repo along with the screenshots of part 3.

:::solution
`onevm terminate praxis-2` gives one VM, 0.5 CPU and 1024 MB of its quota back to the practice. `oneuser create` creates the user `praxis-mpa` in the group `praxis`. In Sunstone the view `cloud` shows the template `ubuntu`, and the VM only starts as long as the practice's quota has room. As `praxis-admin`, `onevm list` shows the VM `mpa-1` with the owner `praxis-mpa`, and `onevm terminate mpa-1` deletes it. Without advanced tasks the report of `m1` ends with "21 of 21 base checks passed" and "0 of 3 checks of the advanced tasks passed, they do not count for the base". Your hand-in repo then holds the report in `reports/` and `5-trennung.png`, `6-quota.png`, `7-showback.png` and `7-self-service.png` in `m1/`.
:::
::::

::::exercise[Setting the frame]
Gemeinde Hinterbüel wants its users to start VMs but not upload images of their own. How do you implement that?

:::solution
The group `gemeinde` only gets the resources `VM+TEMPLATE+DOCUMENT`, without `IMAGE`. For an existing group you delete the group's ACL with `oneacl delete` and create it again without `IMAGE`. The view `cloud` has no tab for images anyway, but the ACL also prevents uploads through the CLI.
:::
::::

::::exercise[Responsibility]
The practice wants its medical assistant to have at most one VM at a time. It would also like a Windows template for all members. Who implements what, and with which tools?

:::solution
The limit for the medical assistant is a user quota with `VMS = 1`. `praxis-admin` sets it with `oneuser quota praxis-mpa`, because a group admin may manage the users of their group. A template for all members belongs in the shared catalog and so with the platform team. It decides whether it can maintain the image and cover the licenses, creates the template as `oneadmin` and shares it with `chmod 604`. The practice could create a template of its own, but that template would belong to the practice and not to the catalog the platform team maintains.
:::
::::
