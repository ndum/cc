---
title: Competence grid for part 2
description: What you can do after part 2 and how to check it yourself.
sidebar:
  label: Competence grid
  order: 6
---

Use this grid to judge whether your IaaS is running and you understand it. Read each row and solve the task next to it without looking anything up. If it comes easily, you have reached the goal. If not, the link in the last column takes you to the right place. Within the Swiss framework curriculum, part 2 mainly serves the competences B12.1 (system architecture), B12.2 (network architecture), B12.3 (target configurations) and B14.2 (monitoring in operations).

| I can … | Task | Look up |
|---|---|---|
| assign the building blocks of OpenNebula to the front-end and the nodes | Draw the building blocks with the drivers and the paths between them. | [Architecture](../architecture/#the-building-blocks) |
| describe the path of a VM from request to start | Explain the five steps with the building block involved. | [Architecture](../architecture/#the-path-of-a-vm) |
| explain Ansible and OneDeploy and install OpenNebula | Show `onehost list` with two nodes `on` and explain what a second run of OneDeploy would change. | [Installation](../installation/) |
| assign the installed services and their ports | Match three ports from `sudo ss -ltnp` to a service. | [Installation](../installation/#the-installed-services) |
| create the internal network and explain VXLAN | Explain why the VMs have an MTU of 1450 and how the gateway belongs to the network. | [Virtual networks](../networks/#vxlan) |
| read and adapt a template | Explain `CPU`, `VCPU` and `CPU_MODEL` in the template `ubuntu`. | [Images, templates and context](../images/#templates) |
| explain contextualization | Name four context settings and their effect in the VM. | [Images, templates and context](../images/#contextualization) |
| start and check a VM | Start a VM, log in over SSH and show the report of the check `iaas`. | [Images, templates and context](../images/#your-first-vm) |
| tell real from allocated capacity | Read both values in `onehost show` and explain the difference. | [Operating hosts](../hosts/#capacity-and-overcommitment) |
| empty a node for maintenance | Show the commands for maintenance and the return of a node. | [Operating hosts](../hosts/#maintenance-of-a-node) |
| explain the consequences of a node failure in the lab | Explain why the VMs of a failed node do not start elsewhere. | [Operating hosts](../hosts/#failure-of-a-node) |

In part 3 you split this cloud among the members and complete milestone 1.
