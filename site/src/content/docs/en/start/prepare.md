---
title: Preparing the VMs
description: Sudo without a password, Git and the course repo on the three servers, the preparation script for the front-end and the nodes, what it sets up and how you check the gateway.
sidebar:
  order: 4
---

:::assignment
"The servers have names and addresses now," Simone Wyss writes. "What is still missing before the cloud goes on them?"
:::

:::goals
After this chapter you can:

- Allow your user sudo without a password on the servers
- Get the course repo onto the servers
- Prepare each server for its role with the preparation script
- Explain what the script sets up on the front-end and the nodes
- Check the gateway of the internal network
:::

## Sudo without a password

For every step of this chapter you log in to the servers from the client over SSH. In chapter 2.2 Ansible runs commands as administrator without asking for a password, so allow your user sudo without a password on each of the three servers. The command asks for the password one last time.

```bash
echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$USER
```

After that, `sudo -n true` runs without asking.

## The course repo

The scripts of the course live in the course repo. The minimal installation of Ubuntu has no Git, so you install it first. Then you clone the course repo into your home directory on each of the three servers.

```bash
sudo apt install -y git
git clone https://github.com/ndum/cc.git
```

## The preparation script

The script `lab/prepare.sh` prepares a server for its role and reads your parameters from `/etc/cc-lab.env`. You run it on every server with the matching role, `fe` on the front-end, `node1` and `node2` on the nodes.

```bash
sudo ./cc/lab/prepare.sh node1
```

On every server the script sets the host name, adds the names of all three servers to `/etc/hosts` and installs rsyslog.

::code{file="lab/prepare.sh" lines="47-59"}

On the nodes it checks that CPU virtualization comes through and names the network interface OpenNebula needs later. On the front-end it installs acl and nftables and takes Node.js from the package source of OpenNebula. It also sets up the gateway for the internal network as the service `cc-gateway`, which runs at every boot.

The script may run several times, it only changes what is not right yet. If it stops with an error, the message says what is missing, for example a wrong address in `/etc/cc-lab.env` or a node without nested virtualization.

## The gateway

The service `cc-gateway` connects the front-end to the internal network of your cloud. It creates the VXLAN with your identifier, gives the front-end the gateway address in it and forwards the traffic of the cloud to the internet with NAT. `cc-gateway status` shows its state.

```bash
sudo cc-gateway status
```

The output names the gateway on `cc-br`, the VXLAN with identifier and multicast group, the forwarding and the NAT rule with your internal network.

On smartlearn you can take a snapshot of every VM. A snapshot of the three servers at the end of this chapter brings you back to the prepared lab if something goes wrong later.

::::exercise[Lab]
Allow sudo without a password, get the course repo onto all three servers and run `prepare.sh` with the right role, first on the nodes, then on the front-end. Write down the network interface the script names on the nodes.

:::solution
On every server the script ends with the section "Done". On the nodes it names the same interface you entered in the generator in chapter 0.3. `sudo cc-gateway status` on the front-end shows the gateway, the VXLAN identifier and the NAT rule with the values from `/etc/cc-lab.env`. You run the full check at the end of [chapter 0.5](../tools/), because it also tests the SSH connection from the front-end to the nodes.
:::
::::
