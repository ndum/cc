---
title: Installation with OneDeploy
description: Ansible and OneDeploy on the front-end, the inventory of your lab, a run that installs OpenNebula 7.4 on three VMs, and how to read a run that stops.
sidebar:
  order: 2
---

:::assignment
"The board chose OpenNebula," Simone Wyss writes. "The software is free, it comes from Europe and it runs on our three servers. Can you install it in a way we can repeat any time we add a server?"
:::

:::goals
After this chapter you can

- explain how Ansible works with an inventory and playbooks,
- set up OneDeploy on the front-end,
- generate and read the inventory of your lab,
- install OpenNebula 7.4 with one run of OneDeploy,
- read the message of a run that stopped and fix the problem.
:::

## Ansible and OneDeploy

Ansible sets up servers over SSH. An inventory lists the servers and their groups, and a playbook describes steps that Ansible runs on those servers. Ansible describes the target state, not the individual commands. A second run therefore changes only what is not yet right.

OneDeploy is the collection of playbooks the OpenNebula project uses to build a cloud from a front-end and several nodes. The course uses the version `release-1.4.1`, which it is tested with. Ansible runs on the front-end and sets up the front-end itself and both nodes from there.

## Setting up OneDeploy

The script `lab/one-deploy/install.sh` installs Ansible from the Ubuntu packages, fetches OneDeploy at the course version into `~/cc-lab/one-deploy` and installs the Ansible collections OneDeploy needs.

```bash
~/cc/lab/one-deploy/install.sh
```

::code{file="lab/one-deploy/install.sh" lines="15-22"}

## The inventory

The inventory describes your lab for OneDeploy. The script `make-inventory.sh` writes it from your personal parameters, and on its first run it creates a random password for the user `oneadmin`, the administrator of OpenNebula. The password then lives in `~/cc-lab/oneadmin.pass`.

```bash
~/cc/lab/one-deploy/make-inventory.sh > ~/cc-lab/inventory.yml
```

::code{file="lab/one-deploy/make-inventory.sh" lines="18-42"}

The group `frontend` holds the front-end, the group `node` the two nodes. Since Ansible runs on the front-end, it reaches it locally instead of over SSH, which is what `ansible_connection: local` says. Values under `vars` apply to all of them. `one_version` sets the version of OpenNebula, and `ds` with `mode: ssh` means the nodes receive images over SSH, so no shared storage is needed. You create the networks for your members' VMs yourself in chapter 2.3, which is why the inventory has none yet.

Before you install, check that Ansible reaches all three VMs.

```bash
cd ~/cc-lab/one-deploy
ansible -i ../inventory.yml all -m ping
```

## Installing OpenNebula

A run of OneDeploy takes ten to twenty minutes. It sets up the package sources, installs the database, the service `oned`, the scheduler and the web interface FireEdge on the front-end and KVM with libvirt on the nodes. At the end it registers the nodes as hosts.

```bash
cd ~/cc-lab/one-deploy
ansible-playbook -i ../inventory.yml opennebula.deploy.main | tee ../deploy.log
```

The output ends with the section `PLAY RECAP` and one line per VM. After a successful installation every line shows `failed=0`.

## Reading a run that stopped

When a run stops, a line further up starts with `fatal:` and the name of the VM, with the message below it. Above that, Ansible shows the task that failed and the file it comes from. Read the message first, then the task. Most of the time the message already explains the problem.

While this course was being developed, the run stopped four times, and each of those stops is handled by the preparation script from [chapter 0.2](../../start/lab/) today:

| Message | Cause | How the course handles it |
|---|---|---|
| `Please make sure each cluster member can resolve all Front-end hostnames` | The VMs did not know each other's names. | `prepare.sh` writes all names to `/etc/hosts`, and the inventory sets `ensure_hosts`. |
| `Could not find the requested service rsyslog.service` | The minimal Ubuntu 26.04 image does not include rsyslog. | `prepare.sh` installs rsyslog on all VMs. |
| `opennebula-fireedge ... Depends nodejs (<= 21)` | Ubuntu offers a newer Node.js than the web interface accepts. | `prepare.sh` makes Node.js come from the OpenNebula repository. |
| `Failed to set permissions on the temporary files Ansible needs to create when becoming an unprivileged user` | On the front-end Ansible switches to the user `oneadmin` and needs the package acl for that. | `prepare.sh` installs acl on the front-end. |

After a fix, simply start the run again. Since Ansible describes the target state, it skips everything that is already right.

## Checking

`onehost list` shows whether OpenNebula runs and both nodes are ready. Run it as the user `oneadmin`. The column `STAT` has to show `on` for both nodes.

```bash
sudo -iu oneadmin onehost list
```

You reach the web interface in the browser on port 2616 of the front-end, for example `http://192.168.42.10:2616/`. Log in as `oneadmin` with the password from `~/cc-lab/oneadmin.pass`.

The check of this chapter covers the service, the version, both hosts and the web interface.

```bash
python3 ~/cc/checks/check.py install
```

::::exercise[Lab]
Install OpenNebula 7.4 with OneDeploy, check the hosts with `onehost list`, log in to the web interface and upload the report of the check `install` to your hand-in repo.

:::solution
The check ends with "8 of 8 checks passed". `onehost list` shows both nodes with `on` in the column `STAT`. If it shows `err` instead, `onehost show` with the host's name explains why in the section `MONITORING`, often a missing SSH connection from the front-end to the node.
:::
::::
