---
title: Personal parameters
description: Your personal code, the name of the network interface, the generator for your values, the addresses of the three servers and the file /etc/cc-lab.env with the meaning of every value.
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
- Explain every value in `/etc/cc-lab.env` and say where it appears in the course
- Store the file on all three servers and check it
:::

## Purpose of the parameters

Every lab in the course is a little different. A personal code determines the names and addresses of your servers, the internal network of your cloud and the identifier of its VXLAN. The scripts of the course read these values, the chapters use them in their commands and the milestones show them. Your instructor can recompute them from your code at any time, so a solution copied from another lab stands out.

Your instructor gives you the code, usually your short name. It starts with a letter and consists of 2 to 16 lower case letters or digits. Keep the same code for the whole course.

## The network interface

For every server the generator writes the commands and the file that give the server its address. They contain the name of the network interface that connects the server to the lab network. Ubuntu names it after the virtual network card the hypervisor gives the VM, so you read it off your own servers.

Log in to one of the servers on the smartlearn console and enter this command.

```bash
ip -br link
```

The output has one line per interface. `lo` is the interface the server uses to talk to itself. The second line is the one you need, its name comes first. The three servers of one environment use the same name.

Enter exactly this name in the generator. Names from examples such as `ens160` or `eth0` only fit if your servers happen to use them too. With a wrong name the server gets no address, and you cannot reach it over SSH.

## The generator

Open this page in the browser of the client, so you can copy the output of the generator and paste it into the terminal of the client. Enter your code and the name of the network interface. The calculation runs only in the browser, nothing leaves this page. Your input is still there the next time you visit.

<cc-params></cc-params>

The result starts with the addresses of your three servers. For every server two commands for its console and a netplan file follow, then the content of the file `/etc/cc-lab.env`. A table at the end lists your personal values for the four milestones. In the chapters you work with the values they give, only the milestone asks for your own.

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

## Setting the addresses

Without an address you cannot reach a server over SSH, and its smartlearn console does not let you paste. So you first give every server a temporary address on its console by typing the two commands the generator shows for it. The first one brings the interface up, the second one gives it the address.

```bash
sudo ip link set <interface> up
sudo ip addr add <address>/24 dev <interface>
```

The temporary address lasts until the next reboot. From now on you work on the client. Open a terminal there and log in with your user and the address of the server. The first time, SSH asks whether you trust the server's key. After `yes` the server asks for your user's password.

```bash
ssh cc@<address>
```

To make the address survive a reboot, you put it into the network settings. Ubuntu manages the network with netplan, which reads its settings from YAML files in `/etc/netplan/`. Minimal Ubuntu has no editor yet, so you write the file with `tee`.

1. Copy the file for this server from the generator. In the SSH session, paste it after the first line of the command below and finish with a line `EOF`.
2. Protect the file and apply the settings with `netplan try`. Confirm with Enter. Without a confirmation, for example because the SSH connection drops, netplan restores the old settings after two minutes.
3. Check the address, the route through the gateway and the connection to the internet. Minimal Ubuntu has no `ping`, but it has `curl`.

```bash
sudo tee /etc/netplan/60-cc-lab.yaml <<'EOF'
<content from the generator>
EOF
sudo chmod 600 /etc/netplan/60-cc-lab.yaml
sudo netplan try
ip -br addr
ip route
curl -sI https://ubuntu.com | head -1
```

Repeat this for the other two servers. The file name starts with `60` so that netplan reads it after a file `50-cloud-init.yaml`, if there is one, and its settings win for the same interface. YAML needs indentation with spaces, a tab causes an error.

:::selfhost
If you entered the addresses while installing Ubuntu, skip the two console commands and the netplan file. Only run the last three commands to check address, route and internet.
:::

| Symptom | Cause | What helps |
|---|---|---|
| `ssh` waits and reports "Connection timed out" | The server has no address or the interface is wrong | Check `ip -br addr` on the console and repeat the two commands with the name from `ip -br link` |
| `netplan try` reports an error in the file | Indentation with a tab or a line indented wrongly | Look at the file with `cat -A`, tabs show up as `^I` |
| `ip -br addr` shows two addresses | DHCP from `50-cloud-init.yaml` for another interface | Check the interface name in the generator |
| `ip route` shows no line `default via 192.168.210.1` | The route is missing in the file or the interface is wrong | Compare the file and `ip -br addr` with the generator |
| `curl` reports "Could not resolve host" | The DNS is missing | `resolvectl status` shows the DNS, on smartlearn it must be 192.168.210.1 |
| `curl` waits and gives up | No way to the internet | Check address and gateway, otherwise ask your instructor |

## The file on the servers

Create the file `/etc/cc-lab.env` with the same content on all three servers. Log in to each server from the client over SSH, write the file with `tee` again, paste the output of the generator and finish with `EOF`. An editor, nano, only comes with the preparation script in chapter 0.4.

```bash
sudo tee /etc/cc-lab.env <<'EOF'
<content from the generator>
EOF
```

After that, `cat /etc/cc-lab.env` shows the same lines on every server. If a value turns out to be wrong later, for example because you mistyped an address, fix the file on all three servers and run the preparation script from [chapter 0.4](../prepare/) again.

:::note
The documentation of every milestone starts with the content of `/etc/cc-lab.env`, and a screencast of the advanced tasks starts with the command `cat /etc/cc-lab.env`. It shows your instructor that the screenshots and the showing come from your lab.
:::

::::exercise[Lab]
Generate your parameters and give each of the three servers its address. Create `/etc/cc-lab.env` and explain three of the values to a classmate in your own words.

:::solution
The file has 16 lines and is the same on all three servers. The host names start with your code, the internal network lies within 172.16.0.0/12 and ends in `.0/24`, and the VXLAN identifier lies between 1000 and 9999. `ssh cc@<address>` works from the client on every server, also after a reboot.
:::
::::
