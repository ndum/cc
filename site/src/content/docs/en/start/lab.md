---
title: The lab
description: The three servers and the client of your lab on smartlearn, their roles and networks, what the nodes need to offer and how to set up Ubuntu 26.04 on VMs of your own.
sidebar:
  order: 2
---

:::assignment
Simone Wyss sends you the list of hardware. "Three servers, one to manage things and two to do the work. Please prepare them so we can install the cloud on them next week."
:::

:::goals
After this chapter you can:

- Describe the VMs of the lab and their roles
- Explain why you need the client on smartlearn
- Tell the two networks of the lab apart
- Check whether a VM offers nested virtualization
- Set up Ubuntu Server 26.04 on a hypervisor of your own the way the course expects
:::

## The VMs of the lab

Your lab consists of three servers and a client. The front-end will manage the cloud, the two nodes run the VMs of your members, and the client is where you work.

| VM | Role | vCPU | RAM | Disk |
|---|---|---:|---:|---:|
| Front-end | Management, web interface, gateway | 4 | 16 GB | 100 GB |
| Node 1 | Runs VMs | 4 | at least 8 GB | 50 GB |
| Node 2 | Runs VMs | 4 | at least 8 GB | 50 GB |
| Client | Kali Linux with a browser and a terminal | 2 | 8 GB | |

![The lab with three servers, the client and two networks. The front-end, two nodes and the client sit on the lab network. From the client you reach the servers over SSH and their web interfaces in the browser. VMs of the cloud run on every node. These VMs and the front-end share an internal VXLAN network. The front-end is its gateway and forwards its traffic to the internet with NAT.](../../../../assets/figures/en/p0c2-lab.svg)

## The client

On smartlearn you always work on the client. It is a VM with the Kali Linux desktop on the same lab network as the three servers, with the fixed address 192.168.210.10. In its browser you open this course, the generator and later every web interface. In its terminal you log in to the servers over SSH.

On the client you can copy commands from the course and paste them into the terminal. The consoles of the servers on smartlearn do not allow pasting. The smartlearn template, however, already gives every server a default address at which you reach it from the client over SSH, so you only need a server's console when it no longer answers over SSH.

Your instructor sets up the client in the template. If `ip -br addr` in the client's terminal shows no address in 192.168.210.0/24, set it yourself with `nmcli`. The first command lists the connections, on Kali the wired one is usually called "Wired connection 1". The [NetworkManager reference manual](https://networkmanager.dev/docs/api/latest/nmcli.html) covers every `nmcli` command.

```bash
nmcli connection show
sudo nmcli connection modify "Wired connection 1" ipv4.method manual ipv4.addresses 192.168.210.10/24 ipv4.gateway 192.168.210.1 ipv4.dns 192.168.210.1
sudo nmcli connection up "Wired connection 1"
```

With a hypervisor of your own you need no client. Your PC takes its role. You log in to the servers over SSH directly from your PC and open the web interfaces in its browser. Wherever the course mentions the client, read it as your PC.

## Two networks

All VMs sit on the lab network 192.168.210.0/24. The three servers have fixed addresses there, derived from your personal code. You reach the servers from the client through this network, and the front-end and the nodes talk to each other over it as well.

The VMs of your cloud get a second, internal network that only your three servers know about. It is a VXLAN (Virtual Extensible LAN), which wraps the Ethernet frames of the VMs in UDP packets and sends them across the lab network from server to server. The hypervisor underneath only sees UDP packets between the servers, so the internal network works even where it does not allow foreign MAC addresses. Chapter 2.3 explains the details. The front-end is the gateway of the internal network and connects it to the internet through NAT.

## smartlearn

Your instructor provides an environment of your own on smartlearn with the three servers, the client and nested virtualization. Ubuntu is already installed on the servers. The environment has a lab network of its own, 192.168.210.0/24, with gateway and DNS on 192.168.210.1 and access to the internet. No other lab shares this network. You set the addresses of the servers yourself in [chapter 0.3](../parameters/#setting-the-addresses).

All instructions of the course assume smartlearn. If you prefer to run the VMs on a hypervisor of your own, the supplement [A hypervisor of your own](../../extras/own-hypervisor/) has the hints you need. Sections that only apply there sit in a closed box labeled "Own hypervisor". On smartlearn you leave it closed and read on.

## Nested virtualization

The nodes will run VMs of their own, so they need nested virtualization. The VM has to pass the virtualization features of the CPU on to its own operating system. On a node you check this with the following command, and the number has to be greater than zero.

```bash
grep -cE 'vmx|svm' /proc/cpuinfo
```

## Setting up Ubuntu

All three servers run Ubuntu Server 26.04 LTS.

:::selfhost
If you install Ubuntu yourself, choose these settings during the installation:

1. The variant "Ubuntu Server (minimized)"
2. The fixed IPv4 address from your personal parameters in chapter 0.3, with the gateway 192.168.210.1 and a DNS server your hypervisor offers
3. The same user name on all three VMs, for example `cc`
4. The box "Install OpenSSH server" checked
5. No additional snaps

Ubuntu's [installation guide](https://canonical-subiquity.readthedocs-hosted.com/en/latest/tutorial/screen-by-screen.html) walks through the installer screen by screen.

Then take a snapshot of every VM. It brings you back to a fresh installation at any time.
:::

::::exercise[Lab]
Open this course in the browser of the client. Then log in to the two nodes over SSH in the terminal of the client, at their default addresses 192.168.210.138 and 192.168.210.139 from [chapter 0.3](../parameters/#the-addresses-in-the-lab), and check nested virtualization there.

:::solution
`grep -cE 'vmx|svm' /proc/cpuinfo` prints a number greater than zero on both nodes, usually 4 or 8 with four vCPUs.
:::
::::
