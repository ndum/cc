---
title: The lab
description: The three VMs of your lab on smartlearn, their roles and networks, what they need to offer and how to set up Ubuntu 26.04 on them.
sidebar:
  order: 2
---

:::assignment
Simone Wyss sends you the list of hardware. "Three servers, one to manage things and two to do the work. Please prepare them so we can install the cloud on them next week."
:::

:::goals
After this chapter you can

- describe the three VMs of the lab and their roles,
- tell the two networks of the lab apart,
- check whether a VM offers nested virtualization,
- set up Ubuntu Server 26.04 the way the course expects.
:::

## The three VMs

Your lab consists of three virtual machines. The front-end will manage the cloud, and the two nodes run the virtual machines of your members.

| VM | Role | vCPU | RAM | Disk |
|---|---|---:|---:|---:|
| Front-end | management, web interface, gateway | 4 | 16 GB | 100 GB |
| Node 1 | runs VMs | 4 | at least 8 GB | 50 GB |
| Node 2 | runs VMs | 4 | at least 8 GB | 50 GB |

![The lab with three VMs and two networks. The front-end and two nodes sit on the lab network with fixed addresses. VMs of the cloud run on every node. These VMs and the front-end share an internal VXLAN network. The front-end is its gateway and forwards its traffic to the internet with NAT.](../../../../assets/figures/en/p0c2-lab.svg)

## Two networks

All three VMs sit on the lab network with fixed IP addresses. You reach the VMs through this network, and the front-end and the nodes talk to each other over it.

The VMs of your cloud get a second, internal network that only your three VMs know about. It runs as VXLAN on top of the lab network. The front-end is the gateway of this network and connects it to the internet through NAT. This way the lab works on any hypervisor, even one that does not allow foreign MAC addresses on its network.

## smartlearn

Your teacher provides the three VMs on smartlearn, with fixed addresses on a shared network and with nested virtualization. This is the default way of the course, and all instructions assume it. If you prefer to run the VMs on a hypervisor of your own, the supplement [A hypervisor of your own](../../extras/own-hypervisor/) has the hints you need.

## Nested virtualization

The nodes will run VMs of their own. They therefore need nested virtualization, so the VM has to pass the virtualization features of the CPU on to its own operating system. You check inside the VM whether that works. The number has to be greater than zero.

```bash
grep -cE 'vmx|svm' /proc/cpuinfo
```

## Setting up Ubuntu

All three VMs run Ubuntu Server 26.04 LTS. If you install Ubuntu yourself, use these settings:

1. the variant "Ubuntu Server (minimized)"
2. a fixed IPv4 address with gateway and DNS
3. the same user name on all three VMs, for example `cc`
4. the box "Install OpenSSH server" checked
5. no additional snaps

In chapter 2.2 Ansible runs commands as administrator without asking for a password. Log in to every VM over SSH and allow your user to use sudo without a password.

```bash
echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$USER
```

If your VMs support snapshots, now is a good time for the first one. It takes you back to a fresh installation at any time.

::::exercise[Lab]
Log in to all three VMs, check nested virtualization on both nodes and set up sudo without a password. Write down the IP addresses of the three VMs, you need them in the next chapter.

:::solution
`grep -cE 'vmx|svm' /proc/cpuinfo` prints a number greater than zero on both nodes, usually 4 or 8 with four vCPUs. After that, `sudo -n true` runs without asking.
:::
::::
