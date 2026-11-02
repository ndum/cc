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
After this chapter you can:

- Describe the three VMs of the lab and their roles
- Tell the two networks of the lab apart
- Check whether a VM offers nested virtualization
- Set up Ubuntu Server 26.04 the way the course expects
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

All three VMs sit on the lab network 192.168.210.0/24 with fixed IP addresses derived from your personal code. You reach the VMs through this network, and the front-end and the nodes talk to each other over it.

The VMs of your cloud get a second, internal network that only your three VMs know about. It runs as VXLAN on top of the lab network. The front-end is the gateway of this network and connects it to the internet through NAT. This way the lab works on any hypervisor, even one that does not allow foreign MAC addresses on its network.

## smartlearn

Your instructor provides an environment of your own on smartlearn with the three VMs and nested virtualization. The environment has a lab network of its own, 192.168.210.0/24, with gateway and DNS on 192.168.210.1 and access to the internet. No other lab shares this network. You set the addresses of your VMs yourself in [chapter 0.3](../parameters/#setting-the-addresses). This is the default way of the course, and all instructions assume it. If you prefer to run the VMs on a hypervisor of your own, the supplement [A hypervisor of your own](../../extras/own-hypervisor/) has the hints you need.

## Nested virtualization

The nodes will run VMs of their own. They therefore need nested virtualization, so the VM has to pass the virtualization features of the CPU on to its own operating system. You check inside the VM whether that works. The number has to be greater than zero.

```bash
grep -cE 'vmx|svm' /proc/cpuinfo
```

## Setting up Ubuntu

All three VMs run Ubuntu Server 26.04 LTS. If you install Ubuntu yourself, use these settings:

1. The variant "Ubuntu Server (minimized)"
2. The fixed IPv4 address from your personal parameters, see chapter 0.3
3. The same user name on all three VMs, for example `cc`
4. The box "Install OpenSSH server" checked
5. No additional snaps

In chapter 2.2 Ansible runs commands as administrator without asking for a password. Log in to every VM over SSH and allow your user to use sudo without a password.

```bash
echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$USER
```

If your VMs support snapshots, now is a good time for the first one. It takes you back to a fresh installation at any time.

::::exercise[Lab]
Log in to all three VMs on the smartlearn console, check nested virtualization on both nodes and set up sudo without a password. Write down the name of the network interface that `ip -br link` shows, you need it in the next chapter.

:::solution
`grep -cE 'vmx|svm' /proc/cpuinfo` prints a number greater than zero on both nodes, usually 4 or 8 with four vCPUs. After that, `sudo -n true` runs without asking. Besides `lo`, `ip -br link` shows one interface, usually `ens160` or `eth0`.
:::
::::
