---
title: A hypervisor of your own
description: The lab on a hypervisor of your own instead of smartlearn, with the script for Hyper-V and hints for VMware, VirtualBox and Proxmox.
sidebar:
  order: 6
---

:::goals
After this chapter you can

- decide whether your computer can carry the lab,
- create the three VMs with Hyper-V,
- turn on nested virtualization in VMware, VirtualBox and Proxmox.
:::

## Requirements

The default way of the course is smartlearn. A hypervisor of your own makes sense if you want to work outside school without access to smartlearn. This way is at your own risk, and your teacher mainly supports the default way.

Your computer needs at least 32 GB of RAM, better 48 GB, an x86 CPU with virtualization and about 200 GB of free disk space. A Mac with an Apple processor is not suitable because the lab is tested on x86 processors.

Whatever the hypervisor, the same requirements apply as on smartlearn:

1. three VMs with the sizes from [chapter 0.2](../lab/)
2. nested virtualization on both nodes
3. one shared network with fixed addresses from which the VMs reach the internet
4. Ubuntu Server 26.04 with the settings from chapter 0.2

## Hyper-V

On Windows 11 Pro, Education and Enterprise, Hyper-V is the easiest way. Turn on Hyper-V in the Windows features, restart and download the ISO of Ubuntu Server 26.04 LTS from [ubuntu.com](https://ubuntu.com/download/server). The script `lab/hyperv/new-lab.ps1` then creates an internal network with NAT and the three VMs. Run it in a PowerShell as administrator, with your personal code and the path to the ISO.

```powershell
powershell -ExecutionPolicy Bypass -File new-lab.ps1 -Code mmuster -Iso "$env:USERPROFILE\Downloads\ubuntu-26.04-live-server-amd64.iso"
```

The script gives the front-end 16 GB of RAM, the nodes 8 GB and every VM four virtual CPUs. It turns on nested virtualization along with the fixed memory it requires and the Secure Boot certificate Ubuntu needs.

::code{file="lab/hyperv/new-lab.ps1" lines="45-49"}

At the end the script prints the addresses on the network 192.168.42.0/24 that you enter when you install Ubuntu. Windows 11 Home does not include Hyper-V.

## VMware

In VMware Workstation you turn on nested virtualization for both nodes in the VM settings, under "Processors" with "Virtualize Intel VT-x/EPT or AMD-V/RVI". On ESXi the option is called "Expose hardware assisted virtualization to the guest OS".

On Windows the option only works while the Windows hypervisor is not running. If VMware reports "Virtualized Intel VT-x/EPT is not supported on this platform" at startup, memory integrity, WSL 2 or Docker Desktop are using that hypervisor. Hyper-V or smartlearn is the better way in that case.

## VirtualBox

In VirtualBox the option is called "Enable Nested VT-x/AMD-V" and sits under "System" and "Processor". On the command line you turn it on with `VBoxManage` while the VM is off. VirtualBox on Windows has the same limitation as VMware.

```bash
VBoxManage modifyvm "mmuster-node1" --nested-hw-virt on
```

## Proxmox

In Proxmox VE you set the type under "Hardware" and "Processors" to `host` for both nodes. The VM then sees the CPU with all its features, virtualization included. The following file on the Proxmox host shows whether it allows nested virtualization. It has to contain `Y` or `1`, and on AMD processors the path says `kvm_amd`.

```bash
cat /sys/module/kvm_intel/parameters/nested
```

::::exercise[Lab]
If you use a hypervisor of your own, create the three VMs, install Ubuntu as described in chapter 0.2 and check nested virtualization on both nodes.

:::solution
`grep -cE 'vmx|svm' /proc/cpuinfo` prints a number greater than zero on both nodes. If it prints zero, the option is off in the hypervisor, or the Windows hypervisor runs in the background on Windows.
:::
::::
