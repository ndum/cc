---
title: Virtualization
description: Type 1 and type 2 hypervisors, KVM, QEMU and libvirt, CPU support, nested virtualization, CPU models and the difference between VMs and containers.
sidebar:
  order: 3
---

:::assignment
"Our servers are VMs themselves, and VMs are supposed to run on them?" Simone Wyss asks. "And the bike shop keeps talking about containers. Can you take that apart for me before I have to explain it at the general assembly?"
:::

:::goals
After this chapter you can

- tell type 1 and type 2 hypervisors apart,
- explain how KVM, QEMU and libvirt work together,
- check the virtualization features of a CPU,
- explain nested virtualization and the role of the CPU model,
- compare VMs and containers.
:::

## Hypervisors

A hypervisor splits a physical computer into several virtual machines. Each VM gets its own virtual CPUs, memory, disks and network cards and runs a complete operating system on them.

A type 1 hypervisor runs directly on the hardware. Examples are VMware ESXi, Hyper-V and KVM. A type 2 hypervisor runs as a program inside an ordinary operating system, like VirtualBox or VMware Workstation. Type 1 is the norm in data centers because it takes fewer detours and manages the hardware directly.

## KVM, QEMU and libvirt

Three building blocks work together on the nodes of your lab. KVM (Kernel-based Virtual Machine) is part of the Linux kernel and turns Linux into a type 1 hypervisor. It uses the virtualization features of the CPU so that the code of a VM runs directly on the processor. QEMU provides each VM with the remaining devices, such as disks, network cards and the console, and runs as a separate process per VM. libvirt manages the VMs of a machine through one common interface. OpenNebula talks to libvirt on every node, libvirt starts QEMU, and QEMU uses KVM.

## CPU support

Modern processors have dedicated instructions for virtualization, called VT-x at Intel and AMD-V at AMD. On top come features that translate the memory of VMs quickly, EPT at Intel and NPT at AMD. Linux shows these features as the flags `vmx` and `svm` in `/proc/cpuinfo`. Without them QEMU would have to emulate every instruction of the VM in software, and the VM would be many times slower.

```bash
lscpu | grep -iE 'virtualization|model name'
```

## Nested virtualization

In your lab the hypervisors stack up. smartlearn runs your nodes as VMs, and on the nodes KVM runs the VMs of your cloud. For this to work, the outer hypervisor has to pass the virtualization features of the CPU on to the nodes. This principle is called nested virtualization. It costs some performance, especially when a VM switches to the hypervisor often, but it is good enough for a lab. In production the nodes of a cloud run directly on the hardware.

## CPU models

A hypervisor does not necessarily show a VM the real CPU. It can present a generic model that looks the same on many machines. That makes it easier to move a running VM to another node with a different CPU. The price is missing instructions. QEMU's generic model, for example, lacks the vector instructions AVX2 that programs use for computations.

While this course was being developed, a language model with three billion parameters ran in a VM with the generic model and managed 2.2 tokens per second. With the CPU model `host-passthrough`, which shows the VM the real CPU, it reached 19.4 tokens per second, about eight times more. The course therefore uses `host-passthrough` for the VMs that run the language model in part 5.

## VMs and containers

A container is a process with its own view of the file system, network and processes. It shares the kernel with the machine it runs on and only brings the programs and libraries of its application. A VM, in contrast, brings a complete operating system with its own kernel.

| Property | VM | Container |
|---|---|---|
| Kernel | its own | shared with the machine |
| Start | seconds to minutes | usually under a second |
| Size | gigabytes | often megabytes |
| Isolation | strong, through the hypervisor | weaker, through kernel features |
| Typical for | whole servers, different operating systems, tenants | single applications and their parts |

The course uses both. OpenNebula gives the members VMs because the separation between tenants should be strong. The bike shop's web shop runs in containers on Kubernetes, and Kubernetes itself runs in two VMs from OpenNebula.

::::exercise[Lab]
Run `lscpu` on a node and on the front-end. Which virtualization does `lscpu` report, and which CPU model does the VM see?

:::solution
`lscpu` shows `VT-x` or `AMD-V` under "Virtualization" when nested virtualization is turned on. "Model name" shows the model the outer hypervisor presents to the VM. On smartlearn and with Hyper-V this is usually the real CPU of the server.
:::
::::

::::exercise[Classifying]
Treuhand Aaregg wants to run its accounting software for Windows, and the bike shop wants its web shop in several copies. Who gets a VM, who gets containers, and why?

:::solution
The fiduciary office gets a VM because its software needs its own operating system and containers share the kernel of the machine. The bike shop gets containers on Kubernetes because the web shop needs copies that start quickly and grow and shrink with the load.
:::
::::
