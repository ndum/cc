---
title: Setting up the lab
description: Three virtual machines on SmartLearn, with Hyper-V or another hypervisor, Ubuntu 26.04, your personal parameters and the script that prepares every VM.
sidebar:
  order: 2
---

:::assignment
Simone Wyss sends you the list of hardware. "Three servers, one to manage things and two to do the work. Please prepare them so we can install the cloud on them next week. And give them names we can remember."
:::

:::goals
After this chapter you can

- provide three VMs for the lab in one of three ways,
- check whether a VM supports nested virtualization,
- install Ubuntu Server 26.04 with a fixed address,
- generate your personal parameters and store them on the VMs,
- prepare each VM with the course's preparation script.
:::

## The lab at a glance

Your lab consists of three virtual machines. The front-end will manage the cloud, and the two nodes run the virtual machines of your members. Since the nodes run VMs of their own, they need nested virtualization. The VM has to pass the virtualization features of the CPU on to its own operating system.

| VM | Role | vCPU | RAM | Disk |
|---|---|---:|---:|---:|
| Front-end | management, web interface, gateway | 4 | 16 GB | 100 GB |
| Node 1 | runs VMs | 4 | at least 8 GB | 50 GB |
| Node 2 | runs VMs | 4 | at least 8 GB | 50 GB |

All three VMs share one network and have fixed IP addresses. The VMs of your cloud later get an internal network of their own that only your three VMs know about. The front-end connects that network to the internet through NAT. This way the lab works on any hypervisor, even one that does not allow foreign MAC addresses on its network.

## Three ways to get the VMs

There are three ways to set up the lab. Pick one and stay with it for the whole course.

1. SmartLearn. Your teacher provides the three VMs with fixed addresses and nested virtualization turned on. This is the recommended way because it does not depend on your laptop.
2. Hyper-V on Windows 11 Pro, Education or Enterprise. The course includes a script that creates the three VMs. Your laptop needs at least 32 GB of RAM.
3. Another hypervisor such as VMware Workstation, VirtualBox or Proxmox. This works, but at your own risk, and the course does not describe it step by step.

A Mac with an Apple processor is not suitable because the lab is tested on x86 processors. Use SmartLearn in that case.

## Nested virtualization on Windows

Windows 11 often runs its own hypervisor in the background. Memory integrity in Windows Security, Credential Guard, WSL 2 and Docker Desktop all depend on it. As long as it runs, VMware Workstation and VirtualBox cannot pass the virtualization features of the CPU on to their VMs. VMware then reports "Virtualized Intel VT-x/EPT is not supported on this platform" at startup.

Hyper-V does not have this problem because it is that hypervisor. On Windows 11 Pro, Education or Enterprise, Hyper-V is therefore the easier local way. Windows 11 Home does not include Hyper-V.

You check inside the VM whether it sees the virtualization features. The number has to be greater than zero.

```bash
grep -cE 'vmx|svm' /proc/cpuinfo
```

## Creating the VMs with Hyper-V

If you go with Hyper-V, first turn on Hyper-V in the Windows features and restart the laptop. Download the ISO of Ubuntu Server 26.04 LTS from [ubuntu.com](https://ubuntu.com/download/server). The script `lab/hyperv/new-lab.ps1` from the course repo then creates an internal network with NAT and the three VMs. Run it in a PowerShell as administrator, with your personal code from the section [Personal parameters](#personal-parameters) and the path to the ISO.

```powershell
powershell -ExecutionPolicy Bypass -File new-lab.ps1 -Code mmuster -Iso "$env:USERPROFILE\Downloads\ubuntu-26.04-live-server-amd64.iso"
```

The script gives the nodes 8 GB of RAM, the front-end 16 GB and every VM four virtual CPUs. It turns on nested virtualization along with the fixed memory it requires and the Secure Boot certificate Ubuntu needs. At the end it prints the addresses you enter when you install Ubuntu.

::code{file="lab/hyperv/new-lab.ps1" lines="45-49"}

## Installing Ubuntu

Install Ubuntu Server 26.04 LTS on all three VMs with these settings:

1. the variant "Ubuntu Server (minimized)"
2. a fixed IPv4 address with gateway and DNS, the values from your teacher on SmartLearn, the values from the script with Hyper-V
3. the same user name on all three VMs, for example `cc`
4. the box "Install OpenSSH server" checked
5. no additional snaps

After the installation, log in to every VM with SSH. Ansible in chapter 2.2 needs to run commands as administrator without a password, so you allow your user to use sudo without a password on every VM.

```bash
echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$USER
```

If your hypervisor supports snapshots, now is a good time for the first one. It takes you back to a fresh installation at any time.

## Personal parameters

Every lab in the course is a little different. A personal code from your teacher determines your host names, your internal network and the identifier of your VXLAN network. Enter your code and the addresses of your three VMs below. The calculation runs only in your browser, nothing leaves this page.

<cc-params></cc-params>

The result is the content of the file `/etc/cc-lab.env`. Create it with the same content on all three VMs, for example with `sudo nano /etc/cc-lab.env`. The preparation script and the check scripts read their values from this file.

## The course repo on the VMs

The scripts of the course live in the course repo. Clone it into your home directory on each of the three VMs.

```bash
git clone https://github.com/ndum/cc.git
```

## Preparing each VM

The script `lab/prepare.sh` prepares a VM for its role. Run it on every VM with the matching role, `fe` on the front-end and `node1` and `node2` on the nodes.

```bash
sudo ./cc/lab/prepare.sh node1
```

On every VM the script sets the host name, adds the names of all three VMs to `/etc/hosts` and installs rsyslog. On the nodes it checks that the CPU virtualization arrives and names the network interface OpenNebula will need later. On the front-end it sets up the gateway for the internal network as the service `cc-gateway`, which runs at every boot.

::code{file="lab/prepare.sh" lines="46-57"}

The script may run as often as you like. It changes only what is not yet right. If it stops with an error, the message says what is missing, such as a wrong address in `/etc/cc-lab.env` or a node VM without nested virtualization.

:::note
The service `cc-gateway` connects the front-end to the internal network of your cloud. `sudo cc-gateway status` shows at any time whether the gateway, the VXLAN network and the NAT rule are in place.
:::

::::exercise[Lab]
Set up the three VMs in the way you chose, generate your personal parameters, create `/etc/cc-lab.env` and run `prepare.sh` on all three VMs with the right role. Write down the network interface the script reports on the nodes.

:::solution
On every VM the script ends with the section "Done". On the front-end, `sudo cc-gateway status` shows your gateway, the VXLAN identifier and the NAT rule with your internal network. You run the full check at the end of [chapter 0.3](../tools/) because it also checks the SSH connection from the front-end to the nodes.
:::
::::
