---
title: Personal parameters
description: Your personal code, the generator for your values, the addresses of the three servers, the file /etc/cc-lab.env and the meaning of every value.
sidebar:
  order: 3
---

:::assignment
"Every installation of ours should be unique," Simone Wyss writes. "If we build a second site later, names and networks must not get in each other's way. Can you name your lab so it is recognizable at a glance?"
:::

:::goals
After this chapter you can:

- Explain what the personal parameters are for
- Store the file `/etc/cc-lab.env` on all three servers with the generator
- Give the three servers their addresses and log in from the client over SSH
- Explain every value in `/etc/cc-lab.env` and say where it appears in the course
:::

## Purpose of the parameters

Every lab in the course is a little different. A personal code determines the names and addresses of your servers, the internal network of your cloud and the identifier of its VXLAN. The scripts of the course read these values, the chapters use them in their commands and the milestones show them. Your instructor can recompute them from your code at any time, so a solution copied from another lab stands out.

Your instructor gives you the code, usually your short name. Keep the same code for the whole course.

## The addresses in the lab

The smartlearn template starts the three servers with default addresses, the front-end with 192.168.210.137, node 1 with .138 and node 2 with .139. At these addresses you reach them from the client over SSH. Then each server gets its address from your code, because the scripts and checks of the course expect it.

Ubuntu manages the network with netplan, which reads its settings from YAML files in `/etc/netplan/`. On smartlearn the address of a server lives in `00-eth0.yaml` together with gateway and DNS. The [guide to static IP addresses](https://netplan.readthedocs.io/en/1.2/using-static-ip-addresses/) for netplan 1.2, the version in Ubuntu 26.04, shows how such a file sets a fixed address. The generator's second block replaces only the address in this file and `netplan apply` applies it at once. From that moment the server only answers at its new address, so an SSH session at the old one freezes. Because the address is in the file, it also holds after every reboot.

## The generator

Open this page in the browser of the client, so you can copy the blocks and paste them into the terminal of the client. Enter your code. The calculation runs only in the browser, nothing leaves this page. Your code is still there the next time you visit.

<cc-params></cc-params>

## Setting the addresses

The two blocks of the generator are the same for all three servers. Work through the servers in turn, first the front-end and then the two nodes.

1. In the terminal of the client, log in at the server's default address, for the front-end with `ssh cc@192.168.210.137`. The first time, you confirm the server's key with `yes`, then it asks for the password of the user `cc`, which your instructor gives you.
2. Paste the first block and start it with Enter. It creates the file `/etc/cc-lab.env`, from which the scripts of the course read your values. `sudo` asks for your password.
3. Paste the second block and start it with Enter. It writes the new address into `00-eth0.yaml` and logs you out. Two seconds later the server takes on its new address.

`netplan apply` takes away the old address your session runs on. Run directly in the session, the command would leave the session frozen. That is why `systemd-run` starts it as a service of its own that waits two seconds first. In that time `exit` logs you out. The [systemd-run manual page](https://manpages.ubuntu.com/manpages/resolute/man1/systemd-run.1.html) describes such services.

Once all three servers have moved, log in at the new address of the front-end from the table as a test.

If the generator gives you exactly the default addresses, the second block leaves the address as it is and you log in again at the same address. If a value turns out to be wrong later, create the file again with the first block on all three servers and run the preparation script from [chapter 0.4](../prepare/) once more.

| Symptom | Cause | What helps |
|---|---|---|
| `ssh` to the default address stops with "No route to host" or "Connection timed out" | The server is not running or already has its new address | Check on smartlearn that the VM runs, otherwise try the new address |
| The new address does not answer | The address in `00-eth0.yaml` is wrong | Log in on the server's console on smartlearn and check `ip -br addr` and `cat /etc/netplan/00-eth0.yaml` |
| `ssh` reports "REMOTE HOST IDENTIFICATION HAS CHANGED" | The server was set up again and the client still has the old key | Run `ssh-keygen -R <address>` on the client and log in again |

:::selfhost
A hypervisor of your own has no default addresses and no file `00-eth0.yaml`, so the second block does not fit there. Give every server its new address from the generator's table as a fixed address with the mask /24, most easily while installing Ubuntu as in the chapter [Own hypervisor](../../extras/own-hypervisor/). Gateway and DNS come from your network. Later a file in `/etc/netplan/` along the guide above works too, `ip -br link` shows you the name of the network interface. Then log in to every server and paste only the first block.
:::

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

The internal network always lies within 172.16.0.0/12, and the VXLAN identifier between 1000 and 9999. The addresses of the three servers lie next to each other between 192.168.210.20 and 192.168.210.199. Every environment on smartlearn has a lab network of its own, so two people may have the same addresses.

:::details[Address range on the internal network]
On the internal network the address range for the VMs runs from `.10` to `.209`, so it also holds the fixed addresses `.110` and `.111` for Kubernetes. OpenNebula gives a VM without a requested address the first free address from `.10` on, which keeps the VMs of parts 2 and 3 well below. OpenTofu explicitly asks for `.110` and `.111` for the two Kubernetes VMs. If one of them were taken already, `tofu apply` would stop with a message.
:::

## Your values for the milestones

The table at the end of the generator lists your personal values for the four milestones, such as the quota of the municipality in milestone 1 or the time of the backup job in milestone 4. In the chapters you work with the values they give, only the milestone asks for your own. The generator shows them again whenever you enter your code.

:::note
A copy of `/etc/cc-lab.env` lies in your hand-in repo, and a screencast of the advanced tasks starts with the command `cat /etc/cc-lab.env`. It shows your instructor that the screenshots and the showing come from your lab.
:::

::::exercise[Lab]
Generate your parameters, create `/etc/cc-lab.env` on all three servers and give them their new addresses. Then explain three of the values to a classmate in your own words.

:::solution
The file has 16 lines and is the same on all three servers. The host names start with your code, the internal network lies within 172.16.0.0/12 and ends in `.0/24`, and the VXLAN identifier lies between 1000 and 9999. `ssh cc@<address>` works from the client at the new address of every server, also after a reboot.
:::
::::
