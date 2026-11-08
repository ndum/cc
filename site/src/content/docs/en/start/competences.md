---
title: Competence grid for part 0
description: What you can do after part 0 and how to check it yourself.
sidebar:
  label: Competence grid
  order: 7
---

Use this grid to judge whether you are ready for the next parts. Read each row and solve the task next to it without looking anything up. If it comes easily, you have reached the goal. If not, the link in the last column takes you to the right place.

| I can … | Task | Look up |
|---|---|---|
| explain how the course is organized and how my grade comes together | Name the two hand-ins and the weight of the exam, and work out grade 1 for a complete base. | [Course overview](../overview/#assessment) |
| name the members of Wolkenwerk Bern and their needs | For each member, name the need that sets it apart from the others. | [Course overview](../overview/#the-case) |
| use AI tools according to the course rules | Name the two rules for AI assistants in the milestones and say what the exam does not allow. | [Course overview](../overview/#ai-tools) |
| describe the VMs of the lab and their two networks | Draw the lab with front-end, nodes, client, lab network and internal network from memory. | [The lab](../lab/#two-networks) |
| explain why I need the client on smartlearn | Explain why you work over SSH from the client on smartlearn and only need a server's console when it no longer answers. | [The lab](../lab/#the-client) |
| check whether a VM supports nested virtualization | Show on a node that the CPU offers `vmx` or `svm`. | [The lab](../lab/#nested-virtualization) |
| give the servers their addresses | Explain where netplan keeps the address of a server and why the SSH session hangs after `netplan apply`. | [Personal parameters](../parameters/#the-addresses-in-the-lab) |
| generate and explain my personal parameters | Show `/etc/cc-lab.env` on all three servers and explain where `CC_GUEST_NET` and `CC_VNI` appear in the course. | [Personal parameters](../parameters/#the-values) |
| prepare a server for its role | Run `prepare.sh` on a node again and explain what it checks. | [Preparing the VMs](../prepare/#the-preparation-script) |
| check the gateway of the internal network | Explain the output of `sudo cc-gateway status`. | [Preparing the VMs](../prepare/#the-gateway) |
| reach all servers from the client over SSH without a password | Log in to the front-end from the client with `ssh` and the name from your SSH configuration, then from there to a node. | [Tools](../tools/#ssh-from-the-front-end-to-the-nodes) |
| create my hand-in repo and share it | Name the folders of your hand-in repo and say what proves the base of a milestone. | [Tools](../tools/#the-hand-in-repo) |
| run a check and read its report | Run the check `start` and explain what the hash at the end proves and what it does not. | [Tools](../tools/#the-first-check) |
| record a screencast of the advanced tasks that follows the rules of the milestones | List what is visible in the first 30 seconds of a screencast. | [Tools](../tools/#screencasts) |

For part 2 you need three prepared servers that the check `start` confirms without a single `[!!]`. That check is also the first requirement of [milestone 1](../../assessment/milestone-1/).
