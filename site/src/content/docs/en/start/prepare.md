---
title: Preparing the VMs
description: Git and the course repo on the VMs, the preparation script for front-end and nodes, what it sets up and how you check the gateway.
sidebar:
  order: 4
---

:::assignment
"The servers have names and addresses now," Simone Wyss writes. "What is still missing before the cloud goes on them?"
:::

:::goals
After this chapter you can

- get the course repo onto the VMs,
- prepare each VM for its role with the preparation script,
- explain what the script sets up on the front-end and the nodes,
- check the gateway of the internal network.
:::

## The course repo

The scripts of the course live in the course repo. The minimal installation of Ubuntu does not include Git, so you install it first. Then you clone the course repo into your home directory on each of the three VMs.

```bash
sudo apt install -y git
git clone https://github.com/ndum/cc.git
```

## The preparation script

The script `lab/prepare.sh` prepares a VM for its role. It reads your parameters from `/etc/cc-lab.env`. Run it on every VM with the matching role, `fe` on the front-end and `node1` and `node2` on the nodes.

```bash
sudo ./cc/lab/prepare.sh node1
```

On every VM the script sets the host name, adds the names of all three VMs to `/etc/hosts` and installs rsyslog.

::code{file="lab/prepare.sh" lines="47-59"}

On the nodes it checks that the CPU virtualization arrives and names the network interface OpenNebula will need later. On the front-end it installs acl and nftables, makes Node.js come from the OpenNebula package source and sets up the gateway for the internal network as the service `cc-gateway`, which runs at every boot.

The script may run as often as you like. It changes only what is not yet right. If it stops with an error, the message says what is missing, such as a wrong address in `/etc/cc-lab.env` or a node without nested virtualization.

## The gateway

The service `cc-gateway` connects the front-end to the internal network of your cloud. It creates a VXLAN network with your identifier, gives the front-end the gateway address in it and forwards the traffic of the cloud to the internet with NAT. `cc-gateway status` shows its state.

```bash
sudo cc-gateway status
```

The output names the gateway on `cc-br`, the VXLAN network with identifier and multicast group, forwarding and the NAT rule with your internal network.

::::exercise[Lab]
Get the course repo onto all three VMs and run `prepare.sh` with the right role, first on the nodes, then on the front-end. Write down the network interface the script reports on the nodes.

:::solution
On every VM the script ends with the section "Done". On the nodes it names the interface, usually `ens160` or `eth0` on smartlearn. On the front-end, `sudo cc-gateway status` shows the gateway, the VXLAN identifier and the NAT rule with the values from `/etc/cc-lab.env`. You run the full check at the end of [chapter 0.5](../tools/) because it also checks the SSH connection from the front-end to the nodes.
:::
::::
