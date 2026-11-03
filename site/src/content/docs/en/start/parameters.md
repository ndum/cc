---
title: Personal parameters
description: Your personal code, the name of the network interface, the generator for your values, the addresses of the three servers, the file /etc/cc-lab.env and the meaning of every value.
sidebar:
  order: 3
---

:::assignment
"Every installation of ours should be unique," Simone Wyss writes. "If we build a second site later, names and networks must not get in each other's way. Can you name your lab so it is recognizable at a glance?"
:::

:::goals
After this chapter you can:

- Explain what the personal parameters are for
- Find the name of a server's network interface
- Generate your parameters with the generator
- Give the three servers their addresses and log in from the client over SSH
- Store the file `/etc/cc-lab.env` on all three servers
- Explain every value in `/etc/cc-lab.env` and say where it appears in the course
:::

## Purpose of the parameters

Every lab in the course is a little different. A personal code determines the names and addresses of your servers, the internal network of your cloud and the identifier of its VXLAN. The scripts of the course read these values, the chapters use them in their commands and the milestones show them. Your instructor can recompute them from your code at any time, so a solution copied from another lab stands out.

Your instructor gives you the code, usually your short name. It starts with a letter and consists of 2 to 16 lower case letters or digits. Keep the same code for the whole course.

## The steps

It takes five steps until your three servers are reachable and know their parameters. You do the first two once and the other three for every server.

1. Read the name of the network interface on the console of one server
2. Enter your code and the interface in the generator
3. Type the two commands for a temporary address on the console of the server
4. Log in from the client over SSH and make the address permanent with netplan
5. Create the file `/etc/cc-lab.env` in the same SSH session

The output of the generator follows this order. The section [The values](#the-values) at the end explains what each value means.

## The network interface

The commands from the generator contain the name of the network interface that connects a server to the lab network. Ubuntu names it after the virtual network card the hypervisor gives the VM, so you read it off your own servers. You already noted it in chapter 0.2.

If you no longer have it, log in to one of the servers on the smartlearn console and enter this command.

```bash
ip -br link
```

The output has one line per interface. `lo` is the interface the server uses to talk to itself. The second line is the one you need, its name comes first. The three servers of one environment use the same name.

## The generator

Open this page in the browser of the client, so you can copy the output of the generator and paste it into the terminal of the client. Enter your code and the name of the network interface. The calculation runs only in the browser, nothing leaves this page. Your input is still there the next time you visit.

:::caution[Name of the network interface]
Enter exactly the name that `ip -br link` shows on your servers. The generator puts it unchanged into the commands for the console and for netplan. Names from examples such as `ens160` or `eth0` only fit if your servers happen to use them too. With a wrong name the server gets no address, and you cannot reach it over SSH.
:::

<cc-params></cc-params>

## Setting the addresses

Work through the servers one at a time, first on the console and then from the client over SSH.

:::selfhost
If you entered the addresses while installing Ubuntu, skip the console and the netplan block. In the SSH session, just run the three commands at the end of this section to check address, route and internet.
:::

### On the console

Without an address you cannot reach a server over SSH, and its smartlearn console does not let you paste. So you type the two commands the generator shows for this server. The first one brings the interface up, the second one gives it the address. This address is temporary and only lasts until the next reboot.

### Over SSH with netplan

From now on you work on the client. Open a terminal there and log in with your user and the address of the server. The first time, SSH asks whether you trust the server's key. After `yes` the server asks for your user's password.

```bash
ssh cc@<address>
```

To make the address survive a reboot, you put it into the network settings. Ubuntu manages the network with netplan, which reads its settings from YAML files in `/etc/netplan/`. Minimal Ubuntu has no editor yet, so the generator's block for the SSH session writes the file with `tee`, protects it with `chmod 600` and applies the settings with `netplan try`.

Copy the block of the server you are logged in to, paste it into the SSH session and start it with Enter. The first `sudo` of a session asks for your password. `netplan try` then waits for you to confirm with Enter. Without a confirmation, for example because the SSH connection drops, netplan restores the old settings after two minutes. Then check the address, the route through the gateway and the connection to the internet. Minimal Ubuntu has no `ping`, but it has `curl`.

```bash
ip -br addr
ip route
curl -sI https://ubuntu.com | head -1
```

The file name starts with `60` so that netplan reads it after a file `50-cloud-init.yaml`, if there is one, and its settings win for the same interface.

| Symptom | Cause | What helps |
|---|---|---|
| `ssh` waits and reports "Connection timed out" | The server has no address or the interface is wrong | Check `ip -br addr` on the console and repeat the two commands with the name from `ip -br link` |
| `netplan try` reports an error in the file | Indentation with a tab or a line indented wrongly | Look at the file with `cat -A`, tabs show up as `^I` |
| `ip -br addr` shows two addresses | DHCP from `50-cloud-init.yaml` for another interface | Check the interface name in the generator |
| `ip route` shows no line `default via 192.168.210.1` | The route is missing in the file or the interface is wrong | Compare the file and `ip -br addr` with the generator |
| `curl` reports "Could not resolve host" | The DNS is missing | `resolvectl status` shows the DNS, on smartlearn it must be 192.168.210.1 |
| `curl` waits and gives up | No way to the internet | Check address and gateway, otherwise ask your instructor |

## The file on the servers

Stay in the same SSH session. The last block of the generator creates the file `/etc/cc-lab.env`, from which the scripts of the course read your values. It is the same on all three servers. Paste it, start it with Enter and check the file with `cat /etc/cc-lab.env`. Then log out with `exit` and move on to the next server.

If a value turns out to be wrong later, for example because you mistyped an address, fix the file on all three servers and run the preparation script from [chapter 0.4](../prepare/) again.

## The values

| Value | Meaning | Where it appears |
|---|---|---|
| `CC_CODE` | Your personal code | In every report of the checks |
| `CC_LANG` | Language of the reports, `de` or `en` | Check scripts |
| `CC_FE_HOST`, `CC_NODE1_HOST`, `CC_NODE2_HOST` | Names of the three servers, built from the code | Host names, `/etc/hosts`, Ansible inventory |
| `CC_FE_IP`, `CC_NODE1_IP`, `CC_NODE2_IP` | Addresses of the three servers on the lab network, derived from the code | netplan, `/etc/hosts`, inventory, web interface |
| `CC_GUEST_NET` | Internal network for the VMs of your cloud | Gateway on the front-end, network in OpenNebula from chapter 2.3 |
| `CC_GUEST_GATEWAY` | Address of the front-end on the internal network | Gateway, network in OpenNebula |
| `CC_GUEST_FIRST`, `CC_GUEST_SIZE` | First address and number of addresses for the VMs of the cloud | Address range of the network in OpenNebula |
| `CC_VNI`, `CC_VXLAN_GROUP` | Identifier (VNI) and multicast group of your VXLAN | Gateway on the front-end, network in OpenNebula |
| `CC_K3S_SERVER_IP`, `CC_K3S_AGENT_IP` | Fixed addresses of the two Kubernetes VMs on the internal network | Part 4 |

The internal network always lies within 172.16.0.0/12, and the VXLAN identifier between 1000 and 9999. The addresses of the three servers lie next to each other between 192.168.210.20 and 192.168.210.199. Every environment on smartlearn has a lab network of its own, so two people may have the same addresses. The client has 192.168.210.10 in every environment.

On the internal network the address range for the VMs runs from `.10` to `.209`, so it also holds the fixed addresses `.110` and `.111` for Kubernetes. OpenNebula gives a VM without a requested address the first free address from `.10` on, which keeps the VMs of parts 2 and 3 well below. OpenTofu explicitly asks for `.110` and `.111` for the two Kubernetes VMs. If one of them were taken already, `tofu apply` would stop with a message.

## Your values for the milestones

The table at the end of the generator lists your personal values for the four milestones, such as the quota of the municipality in milestone 1 or the time of the backup job in milestone 4. In the chapters you work with the values they give, only the milestone asks for your own. The generator shows them again whenever you enter your code.

:::note
A copy of `/etc/cc-lab.env` lies in your hand-in repo, and a screencast of the advanced tasks starts with the command `cat /etc/cc-lab.env`. It shows your instructor that the screenshots and the showing come from your lab.
:::

::::exercise[Lab]
Generate your parameters and give each of the three servers its address. Create `/etc/cc-lab.env` and explain three of the values to a classmate in your own words.

:::solution
The file has 16 lines and is the same on all three servers. The host names start with your code, the internal network lies within 172.16.0.0/12 and ends in `.0/24`, and the VXLAN identifier lies between 1000 and 9999. `ssh cc@<address>` works from the client on every server, also after a reboot.
:::
::::
