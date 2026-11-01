---
title: Personal parameters
description: Your personal code, the generator for your values, what each value means and where it appears in the course, and the file /etc/cc-lab.env on all three VMs.
sidebar:
  order: 3
---

:::assignment
"Every installation of ours should be unique," Simone Wyss writes. "If we build a second site later, names and networks must not get in each other's way. Can you name your lab so it is recognizable at a glance?"
:::

:::goals
After this chapter you can

- explain what the personal parameters are for,
- generate your parameters with the generator,
- explain every value in `/etc/cc-lab.env` and say where it appears in the course,
- store the file on all three VMs and check it.
:::

## Purpose of the parameters

Every lab in the course is a little different. A personal code determines the names and addresses of your VMs, the internal network of your cloud and the identifier of its VXLAN network. These values stay with you for the whole course. The scripts read them, the chapters use them in their commands, and every milestone shows them. Your instructor can recompute them from your code at any time, so a solution copied from another lab stands out.

Your instructor gives you the code, usually your short name. It starts with a letter and consists of 2 to 16 lower case letters or digits. Keep the same code for the whole course.

## The generator

Enter your code and the name of the network interface of your VMs. The calculation runs only in your browser, nothing leaves this page. Your input is still there the next time you visit.

<cc-params></cc-params>

The result shows the addresses of your three VMs, a netplan file for each VM and the content of the file `/etc/cc-lab.env`. Below it are your personal values for the four milestones. Until a milestone you work with the values of the chapters, only the milestone asks for your own.

## The values

| Value | Meaning | Where it appears |
|---|---|---|
| `CC_CODE` | your personal code | in every report of the checks |
| `CC_LANG` | language of the reports, `de` or `en` | check scripts |
| `CC_FE_HOST`, `CC_NODE1_HOST`, `CC_NODE2_HOST` | names of the three VMs, built from the code | host names, `/etc/hosts`, Ansible inventory |
| `CC_FE_IP`, `CC_NODE1_IP`, `CC_NODE2_IP` | addresses of the three VMs on the lab network, derived from the code | netplan, `/etc/hosts`, inventory, web interface |
| `CC_GUEST_NET` | internal network for the VMs of your cloud | gateway on the front-end, network in OpenNebula from chapter 2.3 |
| `CC_GUEST_GATEWAY` | address of the front-end on the internal network | gateway, network in OpenNebula |
| `CC_GUEST_FIRST`, `CC_GUEST_SIZE` | first address and number of addresses for the VMs of the cloud | address range of the network in OpenNebula |
| `CC_VNI`, `CC_VXLAN_GROUP` | identifier and multicast group of your VXLAN network | gateway on the front-end, network in OpenNebula |
| `CC_K3S_SERVER_IP`, `CC_K3S_AGENT_IP` | fixed addresses of the two VMs for Kubernetes | part 4 |

The internal network always lies within 172.16.0.0/12, and the VXLAN identifier between 1000 and 9999. The addresses of the three VMs lie next to each other between 192.168.210.20 and 192.168.210.199. Since every environment on smartlearn has its own lab network, two people may have the same addresses.

The address range for the VMs runs from `.10` to `.209`, so it also holds the fixed addresses `.110` and `.111` for Kubernetes. OpenNebula gives a VM without a requested address the first free address from `.10` on, so the VMs of parts 2 and 3 stay well below. OpenTofu explicitly asks for `.110` and `.111` for the two Kubernetes VMs. If one of them were taken already, `tofu apply` would stop with a message.

## Setting the addresses

Without an address you cannot reach a VM over SSH yet. So you set the addresses on the smartlearn console, each VM with its own. Ubuntu manages the network with netplan, which reads its settings from YAML files in `/etc/netplan/`.

1. Check the name of the network interface with `ip -br link`. If the generator shows another name, correct it there.
2. Create the file. Minimal Ubuntu has no editor yet, so you write it with `tee`. After the first line paste the content the generator shows for this VM and finish with a line `EOF`.
3. Protect the file and apply the settings with `netplan try`. Confirm with Enter. Without a confirmation netplan restores the old settings after two minutes.
4. Check the address, the route through the gateway and a connection to the internet. Minimal Ubuntu has no `ping`, but it has `curl`.

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

The file name starts with `60` so that it is read after a file `50-cloud-init.yaml`, if there is one, and overrides its settings for the same interface. YAML needs indentation with spaces, a tab causes an error.

| Symptom | Cause | What helps |
|---|---|---|
| `netplan try` reports an error in the file | indentation with a tab or a line indented wrongly | look at the file with `cat -A`, tabs show up as `^I` |
| `ip -br addr` shows two addresses | DHCP from `50-cloud-init.yaml` for another interface | check the interface name in the generator |
| `ip route` shows no line `default via 192.168.210.1` | the route is missing in the file or the interface is wrong | compare the file and `ip -br addr` with the generator |
| `curl` reports "Could not resolve host" | DNS is missing | `resolvectl status` shows the DNS, it must be 192.168.210.1 |
| `curl` waits and gives up | no way to the internet | check address and gateway, otherwise ask your instructor |

## The file on the VMs

Create the file `/etc/cc-lab.env` with the same content on all three VMs. SSH works by now. You write the file with `tee` again, paste the output of the generator and finish with `EOF`. An editor, nano, only comes with the preparation script in chapter 0.4.

```bash
sudo tee /etc/cc-lab.env <<'EOF'
<content from the generator>
EOF
```

After that, `cat /etc/cc-lab.env` shows the same lines on every VM. If a value turns out to be wrong later, for example because you mistyped an address, fix the file on all three VMs and run the preparation script from [chapter 0.4](../prepare/) again.

:::note
The documentation of every milestone starts with the content of `/etc/cc-lab.env`, and every screencast of the advanced tasks starts with `cat /etc/cc-lab.env`. It shows your instructor that the screenshots and the showing come from your lab.
:::

::::exercise[Lab]
Generate your parameters, set its address on each of the three VMs, create `/etc/cc-lab.env` on all three and explain three of the values to a classmate in your own words.

:::solution
The file has 16 lines and is the same on all three VMs. The host names start with your code, the internal network lies within 172.16.0.0/12 and ends in `.0/24`, and the VXLAN identifier lies between 1000 and 9999.
:::
::::
