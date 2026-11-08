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

It takes five steps until your three servers have addresses of their own and know their parameters. You do the first one once and the other four for every server. On smartlearn you need no console for this, because the template already gives every server a default address at which you reach it from the client over SSH.

1. Enter your code in the generator
2. Log in from the client at the default address of the server and check the network interface
3. Change the address in `/etc/netplan/00-eth0.yaml` to the address from the generator
4. Log in again at the new address
5. Create the file `/etc/cc-lab.env`

The next two sections explain what happens on the servers along the way. Then come the generator and the work with its blocks. With a hypervisor of your own, steps 2 to 4 of this list differ, the box "Own hypervisor" at the end of [Setting the addresses](#setting-the-addresses) describes them.

## The network interface

Every server connects to the lab network through a network interface. Ubuntu names it after the virtual network card the hypervisor gives the VM. You check it on every server as soon as you are logged in.

```bash
ip -br link
```

The output has one line per interface. `lo` is the interface the server uses to talk to itself. The second line is the one you need, its name comes first. On smartlearn it is `eth0` on all three servers.

## Addresses with netplan

The smartlearn template starts the three servers with fixed default addresses. They are the same in every environment, so each server first gets its own address from the generator.

| Server | Default address |
|---|---|
| Front-end | 192.168.210.137 |
| Node 1 | 192.168.210.138 |
| Node 2 | 192.168.210.139 |

Ubuntu manages the network with netplan, which reads its settings from YAML files in `/etc/netplan/`. On smartlearn the address of a server, with its route and DNS, lives in `00-eth0.yaml`, named after its interface. The [guide to static IP addresses](https://netplan.readthedocs.io/en/1.2/using-static-ip-addresses/) for netplan 1.2, the version in Ubuntu 26.04, shows how such a file sets a fixed address. Minimal Ubuntu has no editor yet, so a block of the generator changes the address in this file with `sed` and shows it with `grep`, and `netplan apply` applies it at once.

From that moment the server only answers at its new address, so an SSH session that runs on the old address freezes. You end it and log in again at the new address. The file also applies after a reboot, so the address stays.

:::caution[No second netplan file]
On smartlearn you only change the address in `/etc/netplan/00-eth0.yaml`. Do not add another file to `/etc/netplan/` there, such as `60-cc-lab.yaml`. Next to `00-eth0.yaml` with its fixed address, the server would then have two settings for the same interface, and its network gets confused.
:::

## The generator

Open this page in the browser of the client, so you can copy the output of the generator and paste it into the terminal of the client. Enter your code. You only need the name of the network interface with a hypervisor of your own, on smartlearn you leave the field empty. The calculation runs only in the browser, nothing leaves this page. Your input is still there the next time you visit.

The generator first shows the addresses of your three servers. Then come four blocks for every server, the login at the default address, the change of the address, the login at the new address and the file `/etc/cc-lab.env`. Your values for the milestones are at the very bottom.

<cc-params></cc-params>

## Setting the addresses

Work through the servers one at a time, first the front-end and then the two nodes. For each server you go through its four blocks in the generator from top to bottom.

1. Open a terminal on the client and log in at the server's default address with its first block. The first time, SSH asks whether you trust the server's key. After `yes` the server asks for your user's password.
2. Check with `ip -br link` that the interface is called `eth0`.
3. Paste the second block into the SSH session and start it with Enter. `sudo` asks for your password. The output of `grep` shows your new address next to gateway and DNS on 192.168.210.1. Then the session freezes. End it with Enter followed by the characters `~` and `.`, or close the terminal. If your addresses are exactly the default addresses, the session keeps running and you log out with `exit`.
4. Log in at the new address with the third block. Here too SSH asks about the key the first time.
5. Check the address, the route through the gateway and the connection to the internet. Minimal Ubuntu has no `ping`, but it has `curl`.

```bash
ip -br addr
ip route
curl -sI https://ubuntu.com | head -1
```

Then stay in this session, in the next section the fourth block creates the file with your values.

| Symptom | Cause | What helps |
|---|---|---|
| `ssh` to the default address reports "Connection timed out" | The server is not running or has another address | Check on smartlearn that the VM runs, look at `ip -br addr` on its console |
| `grep` still shows the default address | You pasted the block of another server, or the address is written differently in the file. If the generator gives you exactly the default address, this is correct | Look at the file with `cat /etc/netplan/00-eth0.yaml` and paste the block of the right server |
| The new address does not answer | The file has an error or the address is wrong | Log in on the smartlearn console, check `ip -br addr` and `/etc/netplan/00-eth0.yaml` |
| `ssh` reports "REMOTE HOST IDENTIFICATION HAS CHANGED" | The server was set up again and the client still has the old key | Run `ssh-keygen -R <address>` on the client and log in again |
| `ip route` shows no line `default via 192.168.210.1` | The route is missing in the file | Look at the file with `cat`, ask your instructor |
| `curl` reports "Could not resolve host" | The DNS is missing | `resolvectl status` shows the DNS, on smartlearn it must be 192.168.210.1 |
| `curl` waits and gives up | No way to the internet | Check address and gateway, otherwise ask your instructor |

:::selfhost
On a hypervisor of your own a server has no default address, and its netplan file has a different name depending on the installation, so adapt the steps to your installation. If you entered the addresses while installing Ubuntu, just run the three commands above to check address, route and internet.

Otherwise read the interface name with `ip -br link` on the console of each server and enter it in the generator. Under "Own hypervisor" it then shows two console commands per server that set a temporary address until the next reboot. Then log in from your PC over SSH at that address and paste the netplan block. It writes the file `60-cc-lab.yaml`, which netplan reads after a file `50-cloud-init.yaml` if there is one, protects it with `chmod 600` and applies it with `netplan try`. `netplan try` waits for Enter and restores the old settings after two minutes without a confirmation. With a wrong interface name the server gets no address.
:::

## The file on the servers

Stay in the SSH session at the new address. The server's fourth block creates the file `/etc/cc-lab.env`, from which the scripts of the course read your values. It is the same on all three servers. Paste it and start it with Enter, `sudo` asks for your password again in the new session. Then check the file with `cat /etc/cc-lab.env`. Then log out with `exit` and move on to the next server.

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
The file has 16 lines and is the same on all three servers. The host names start with your code, the internal network lies within 172.16.0.0/12 and ends in `.0/24`, and the VXLAN identifier lies between 1000 and 9999. `ssh cc@<address>` works from the client at the new address of every server, also after a reboot, and the default addresses no longer answer unless they are your own addresses.
:::
::::
