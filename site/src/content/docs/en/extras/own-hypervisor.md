---
title: A hypervisor of your own
description: The lab on a hypervisor of your own instead of smartlearn, with the script for Hyper-V and hints for VMware, VirtualBox and Proxmox.
sidebar:
  order: 1
---

:::goals
After this chapter you can:

- Decide whether your PC can carry the lab
- Create the three VMs with Hyper-V
- Set up nested virtualization and the lab network in VMware, VirtualBox and Proxmox
:::

## Requirements

This supplement is not part of the default way of the course, which runs on smartlearn. A hypervisor of your own makes sense if you want to work outside school without access to smartlearn. This way is at your own risk, and your instructor mainly supports the default way.

Your PC needs at least 48 GB of RAM, an x86 CPU with virtualization and about 200 GB of free disk space. The three VMs take 32 GB of RAM between them as fixed memory, 16 GB for the front-end and 8 GB for each node. The operating system of your PC needs the rest. A Mac with an Apple processor is not suitable because the lab is tested on x86 processors.

Whatever the hypervisor, the same requirements apply as on smartlearn:

1. Three VMs with the sizes from [chapter 0.2](../../start/lab/)
2. Nested virtualization on both nodes
3. The lab network 192.168.210.0/24 with NAT to the internet, because the fixed addresses from chapter 0.3 lie in this network
4. Ubuntu Server 26.04 with the settings from chapter 0.2

The address of the gateway in the lab network depends on the hypervisor, and the sections below name it. As DNS you can enter a public resolver such as 9.9.9.9, which the script for Hyper-V names as well.

You need no client as on smartlearn, your PC takes its role. You log in to the servers over SSH directly from your PC and open the web interfaces in its browser. Wherever the course mentions the client, read it as your PC.

## Hyper-V

On Windows 11 Pro, Education and Enterprise, Hyper-V is the easiest way. Turn on Hyper-V in the Windows features, restart and download the ISO of Ubuntu Server 26.04 LTS from [ubuntu.com](https://ubuntu.com/download/server). Microsoft's [guide to installing Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/get-started/install-hyper-v?pivots=windows) shows how to turn it on. The script `lab/hyperv/new-lab.ps1` from the course repo then creates an internal network with NAT and the three VMs. Open a PowerShell as administrator, download the script from GitHub into your Downloads folder and run it with your personal code and the path to the ISO.

```powershell
cd $env:USERPROFILE\Downloads
Invoke-WebRequest https://raw.githubusercontent.com/ndum/cc/main/lab/hyperv/new-lab.ps1 -OutFile new-lab.ps1 -UseBasicParsing
powershell -ExecutionPolicy Bypass -File new-lab.ps1 -Code mmuster -Iso "$env:USERPROFILE\Downloads\ubuntu-26.04-live-server-amd64.iso"
```

After `-Iso` put the name of the file you downloaded. Once Ubuntu publishes a point release such as 26.04.1, the ISO is called something like `ubuntu-26.04.1-live-server-amd64.iso`.

The script gives the front-end 16 GB of RAM, the nodes 8 GB and every VM four virtual CPUs. It turns on nested virtualization, which requires fixed memory, and picks the Secure Boot template for third-party systems, without which Ubuntu does not start. Microsoft's [guide to nested virtualization](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/enable-nested-virtualization) lists what else it needs under Hyper-V.

::code{file="lab/hyperv/new-lab.ps1" lines="48-52"}

The script creates the lab network 192.168.210.0/24 with NAT, and your PC itself is the gateway 192.168.210.1. At the end it prints the addresses from your code, the same as the generator in chapter 0.3, which you enter when you install Ubuntu. Under Hyper-V no DNS answers on .1, so enter the DNS the script names. Windows 11 Home does not include Hyper-V.

## VMware

In VMware Workstation you turn on nested virtualization for both nodes in the VM settings, under "Processors" with "Virtualize Intel VT-x/EPT or AMD-V/RVI". The [VMware Workstation Pro documentation](https://techdocs.broadcom.com/us/en/vmware-cis/desktop-hypervisors/workstation-pro/26H1/using-vmware-workstation-pro/configuring-virtual-machine-hardware-settings/configuring-virtual-machine-processor-settings.html) explains the option. On ESXi the option is called "Expose hardware assisted virtualization to the guest OS".

On Windows the option only works while the Windows hypervisor is not running. If VMware reports "Virtualized Intel VT-x/EPT is not supported on this platform" at startup, memory integrity, WSL 2 or Docker Desktop are using that hypervisor. Hyper-V or smartlearn is the better way in that case.

For the lab network you use the NAT network VMnet8, which VMware Workstation creates when you install it. In the "Virtual Network Editor" under "Edit" you set its subnet to 192.168.210.0 with the mask 255.255.255.0, and you set the network adapter of the three VMs to "NAT". In this network your PC has the address .1 and the NAT device of VMware the address .2, according to VMware's [conventions for addresses](https://techdocs.broadcom.com/us/en/vmware-cis/desktop-hypervisors/workstation-pro/26H1/using-vmware-workstation-pro/configuring-network-connections/assigning-ip-addresses-in-host-only-networks-and-nat-configurations/dhcp-conventions-for-assigning-ip-addresses-in-host-only-and-nat-networks.html). When you install Ubuntu you therefore enter 192.168.210.2 as the gateway, not .1 as with the other hypervisors. The addresses from .128 up belong to the range of VMware's DHCP server. If the addresses from your code fall into this range, do not attach another VM with DHCP to VMnet8.

## VirtualBox

In VirtualBox the option is called "Enable Nested VT-x/AMD-V" and sits under "System" and "Processor". On the command line you turn it on with `VBoxManage` while the VM is off. The [VirtualBox manual](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/AdvancedTopics.html#nested-virt) describes both ways. VirtualBox on Windows has the same limitation as VMware.

```bash
VBoxManage modifyvm "mmuster-node1" --nested-hw-virt on
```

For the lab network you create a NAT network with the range 192.168.210.0/24.

```bash
VBoxManage natnetwork add --netname cc-lab --network "192.168.210.0/24" --enable
```

Then, in the settings of each VM under "Network", choose "NAT Network" for "Attached to" and the network `cc-lab`. Unless you configure it otherwise, the gateway gets the address 192.168.210.1 in this network, as the manual describes in its section on the [NAT network](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html#network_nat_service).

## Proxmox

In Proxmox VE you set the type under "Hardware" and "Processors" to `host` for both nodes. The VM then sees the CPU with all its features, virtualization included. The following file on the Proxmox host shows whether it allows nested virtualization. It has to contain `Y` or `1`, and on AMD processors the path says `kvm_amd`. The [page on nested virtualization](https://pve.proxmox.com/wiki/Nested_Virtualization) in the Proxmox VE wiki covers the settings on the host and in the VM.

```bash
cat /sys/module/kvm_intel/parameters/nested
```

For the lab network you create a bridge without a physical port on the Proxmox host, such as `vmbr1` with the address 192.168.210.1/24, and attach the three VMs to it. You turn on forwarding and masquerading in `/etc/network/interfaces`, as the section [Masquerading (NAT) with iptables](https://pve.proxmox.com/wiki/Network_Configuration#sysadmin_network_masquerading) in the Proxmox VE wiki shows. The gateway of the VMs is then 192.168.210.1.

::::exercise[Lab]
If you use a hypervisor of your own, create the three VMs, install Ubuntu as described in chapter 0.2 and check nested virtualization on both nodes.

:::solution
`grep -cE 'vmx|svm' /proc/cpuinfo` prints a number greater than zero on both nodes. If it prints zero, the option is off in the hypervisor, or the Windows hypervisor runs in the background on Windows.
:::
::::
