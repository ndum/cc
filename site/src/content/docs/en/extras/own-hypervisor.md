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
- Turn on nested virtualization in VMware, VirtualBox and Proxmox
:::

## Requirements

This supplement is not part of the default way of the course, which runs on smartlearn. A hypervisor of your own makes sense if you want to work outside school without access to smartlearn. This way is at your own risk, and your instructor mainly supports the default way.

Your PC needs at least 32 GB of RAM, better 48 GB, an x86 CPU with virtualization and about 200 GB of free disk space. A Mac with an Apple processor is not suitable because the lab is tested on x86 processors.

Whatever the hypervisor, the same requirements apply as on smartlearn:

1. Three VMs with the sizes from [chapter 0.2](../../start/lab/)
2. Nested virtualization on both nodes
3. One shared network with fixed addresses from which the VMs reach the internet
4. Ubuntu Server 26.04 with the settings from chapter 0.2

You need no client as on smartlearn, your PC takes its role. You log in to the servers over SSH directly from your PC and open the web interfaces in its browser. Wherever the course mentions the client, read it as your PC.

## Hyper-V

On Windows 11 Pro, Education and Enterprise, Hyper-V is the easiest way. Turn on Hyper-V in the Windows features, restart and download the ISO of Ubuntu Server 26.04 LTS from [ubuntu.com](https://ubuntu.com/download/server). Microsoft's [guide to installing Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/get-started/install-hyper-v?pivots=windows) shows how to turn it on. The script `lab/hyperv/new-lab.ps1` then creates an internal network with NAT and the three VMs. Run it in a PowerShell as administrator, with your personal code and the path to the ISO.

```powershell
powershell -ExecutionPolicy Bypass -File new-lab.ps1 -Code mmuster -Iso "$env:USERPROFILE\Downloads\ubuntu-26.04-live-server-amd64.iso"
```

The script gives the front-end 16 GB of RAM, the nodes 8 GB and every VM four virtual CPUs. It turns on nested virtualization, which requires fixed memory, and picks the Secure Boot template for third-party systems, without which Ubuntu does not start. Microsoft's [guide to nested virtualization](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/enable-nested-virtualization) lists what else it needs under Hyper-V.

::code{file="lab/hyperv/new-lab.ps1" lines="48-52"}

The script creates the lab network 192.168.210.0/24 with NAT, and your PC itself is the gateway 192.168.210.1. At the end it prints the addresses from your code, the same as the generator in chapter 0.3, which you enter when you install Ubuntu. Under Hyper-V no DNS answers on .1, so enter the DNS the script names. Windows 11 Home does not include Hyper-V.

## VMware

In VMware Workstation you turn on nested virtualization for both nodes in the VM settings, under "Processors" with "Virtualize Intel VT-x/EPT or AMD-V/RVI". The [VMware Workstation Pro documentation](https://techdocs.broadcom.com/us/en/vmware-cis/desktop-hypervisors/workstation-pro/26H1/using-vmware-workstation-pro/configuring-virtual-machine-hardware-settings/configuring-virtual-machine-processor-settings.html) explains the option. On ESXi the option is called "Expose hardware assisted virtualization to the guest OS".

On Windows the option only works while the Windows hypervisor is not running. If VMware reports "Virtualized Intel VT-x/EPT is not supported on this platform" at startup, memory integrity, WSL 2 or Docker Desktop are using that hypervisor. Hyper-V or smartlearn is the better way in that case.

## VirtualBox

In VirtualBox the option is called "Enable Nested VT-x/AMD-V" and sits under "System" and "Processor". On the command line you turn it on with `VBoxManage` while the VM is off. The [VirtualBox manual](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/AdvancedTopics.html#nested-virt) describes both ways. VirtualBox on Windows has the same limitation as VMware.

```bash
VBoxManage modifyvm "mmuster-node1" --nested-hw-virt on
```

## Proxmox

In Proxmox VE you set the type under "Hardware" and "Processors" to `host` for both nodes. The VM then sees the CPU with all its features, virtualization included. The following file on the Proxmox host shows whether it allows nested virtualization. It has to contain `Y` or `1`, and on AMD processors the path says `kvm_amd`. The [page on nested virtualization](https://pve.proxmox.com/wiki/Nested_Virtualization) in the Proxmox VE wiki covers the settings on the host and in the VM.

```bash
cat /sys/module/kvm_intel/parameters/nested
```

::::exercise[Lab]
If you use a hypervisor of your own, create the three VMs, install Ubuntu as described in chapter 0.2 and check nested virtualization on both nodes.

:::solution
`grep -cE 'vmx|svm' /proc/cpuinfo` prints a number greater than zero on both nodes. If it prints zero, the option is off in the hypervisor, or the Windows hypervisor runs in the background on Windows.
:::
::::
