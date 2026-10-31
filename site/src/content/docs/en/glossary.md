---
title: Glossary
description: The terms of the course in one or two sentences, with the chapter that introduces them.
---

The glossary explains the terms of the course briefly and points to the chapter that introduces them. Many cloud terms stay in English on the German pages as well, such as front-end, inventory or playbook, so you recognize them in documentation, error messages and tools.

| Term | Meaning | Chapter |
|---|---|---|
| Ansible | A tool that brings servers into a described target state over SSH. A second run changes only what is not yet right. | [2.2](../iaas/installation/) |
| Front-end | The VM on which OpenNebula manages the cloud, with the service `oned`, the scheduler and the web interface. In the course it is also the gateway of the internal network. | [0.2](../start/lab/) |
| Gateway | The machine through which the VMs of a network reach other networks. In the course the front-end forwards the traffic of the internal network to the internet with NAT. | [0.2](../start/lab/) |
| Hash | A short checksum that changes as soon as the content changes. The check report ends with the hash of its content. | [0.5](../start/tools/) |
| Inventory | The file in which Ansible finds the servers and their groups, along with values for all of them or for single ones. | [2.2](../iaas/installation/) |
| Node | A VM on which OpenNebula runs the virtual machines of the members. The course has two nodes with KVM. | [0.2](../start/lab/) |
| KVM | The hypervisor in the Linux kernel. It uses the virtualization features of the CPU and runs the VMs on the nodes. | [0.2](../start/lab/) |
| NAT | Network address translation replaces the source address of packets so that machines on an internal network reach the internet through a single address. | [0.2](../start/lab/) |
| Nested virtualization | A VM passes the virtualization features of the CPU on to its own operating system, so VMs can run inside it. | [0.2](../start/lab/) |
| OneDeploy | The collection of Ansible playbooks the OpenNebula project uses to install a cloud from a front-end and nodes. | [2.2](../iaas/installation/) |
| OpenNebula | A free platform for private clouds. It manages nodes, networks, storage and virtual machines and assigns them to tenants. | [2.2](../iaas/installation/) |
| Personal parameters | The values of your lab that come from your personal code, such as host names, the internal network and the VXLAN identifier. They live in `/etc/cc-lab.env`. | [0.3](../start/parameters/) |
| Playbook | A file that describes which steps Ansible runs on which servers. | [2.2](../iaas/installation/) |
| SSH key | A pair of a private and a public key that lets you log in to a server without a password. | [0.5](../start/tools/) |
| VXLAN | A way to carry a network for VMs inside UDP packets across an existing network. In the course it connects the VMs of your cloud through the front-end and the nodes. | [0.2](../start/lab/) |
