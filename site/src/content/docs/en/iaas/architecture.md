---
title: Architecture of OpenNebula
description: The building blocks of OpenNebula on the front-end and the nodes, the objects you work with and the ways you access the cloud.
sidebar:
  order: 1
---

:::assignment
"Before you install anything, I want to understand what we are running," Simone Wyss writes. "What runs where, and who talks to whom? If something fails at night, the platform team has to know."
:::

:::goals
After this chapter you can:

- Name the building blocks of OpenNebula and assign them to the front-end or the nodes
- Explain how a request travels from the web interface to a running VM
- Tell the objects of OpenNebula apart
- Name the three ways you operate OpenNebula
:::

## The building blocks

OpenNebula consists of a front-end that manages the cloud and nodes that run the VMs. The nodes need no OpenNebula service of their own. The front-end controls them over SSH with small driver programs.

![The building blocks of OpenNebula. Three areas side by side. On the left Sunstone, the CLI and OpenTofu reach the front-end through the API. In the middle oned on the front-end manages all objects, stores them in MariaDB, lets the scheduler pick nodes and receives states from onemonitord. The drivers for hosts, VMs, transfer, networks and datastores carry out the jobs. On the right the nodes work with libvirt and KVM, and the drivers reach them over SSH.](../../../../assets/figures/en/p2c1-architecture.svg)

The core is the service `oned`. It accepts all requests through its API, manages the state of every object and stores it in a database, MariaDB in the course. The scheduler is a driver of `oned` and picks a node with enough free capacity for every new VM. `onemonitord` regularly queries the state of the nodes and VMs.

Drivers do the actual work. `oned` calls them for each kind of job:

| Driver | Job | In the lab |
|---|---|---|
| IM (Information Manager) | record the state and capacity of the hosts | KVM nodes |
| VMM (Virtual Machine Manager) | start, stop and move VMs | libvirt with KVM |
| TM (Transfer Manager) | bring disks to the node and back | `ssh`, copies over SSH |
| VNM (Virtual Network Manager) | set up networks on the nodes | `vxlan` from chapter 2.3 |
| DS (Datastore) | store and manage images | `fs` on the front-end |

## The path of a VM

When you start a VM in Sunstone, Sunstone sends the request to the API of `oned`. `oned` creates the VM in the database, and the scheduler picks a node. The TM driver copies the image over SSH to the datastore on that node, and the VNM driver sets up the network there. Finally the VMM driver has libvirt start the VM with KVM. From then on `onemonitord` keeps reporting its state. Chapter 2.2 shows which services and ports run on the front-end for this.

## The objects

In OpenNebula you work with objects. Each has a number, a name, an owner, a group and permissions.

| Object | Meaning | CLI |
|---|---|---|
| Host | a node on which VMs run | `onehost` |
| Cluster | a group of hosts with their networks and datastores | `onecluster` |
| Datastore | a place to store images or the disks of running VMs | `onedatastore` |
| Image | a disk that VMs boot from | `oneimage` |
| Virtual network | a network with an address range for the VMs | `onevnet` |
| Template | the description of a VM from which you start VMs | `onetemplate` |
| VM | a running or stopped virtual machine | `onevm` |
| User and group | who may do what and who owns it | `oneuser`, `onegroup` |

## Access

You access OpenNebula in three ways, and all three talk to the same API of `oned`. The web interface Sunstone is good for exploring and for the members. The CLI on the front-end is the fastest way for the platform team and for scripts. Tools such as OpenTofu use the API directly. From part 4 on you create VMs from code with OpenTofu.

::::exercise[Classifying]
Assign the building blocks `oned`, KVM, MariaDB, scheduler, libvirt, Sunstone, `onemonitord` and datastore 0 with the disks of running VMs to the front-end or the nodes.

:::solution
`oned`, MariaDB, the scheduler, Sunstone and `onemonitord` run on the front-end. KVM and libvirt run on the nodes. Datastore 0 with the disks of running VMs is on the nodes as well, because the transfer driver `ssh` copies the disks there.
:::
::::

::::exercise[The path of a VM]
Describe in five steps what happens between clicking "Create" in Sunstone and the running VM. Name the building block involved in each step.

:::solution
1. Sunstone sends the request to the API of `oned`.
2. `oned` creates the VM in MariaDB.
3. The scheduler picks a node with enough capacity.
4. The TM driver copies the image to the node, the VNM driver sets up the network.
5. The VMM driver has libvirt start the VM with KVM, and `onemonitord` reports its state.
:::
::::
