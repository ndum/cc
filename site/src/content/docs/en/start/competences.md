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
| explain how the course is organized and how my grade comes together | Name the four milestones and the two hand-ins. | [Course overview](../overview/#assessment) |
| name the members of Wolkenwerk Bern and their needs | For each member, name the need that sets it apart from the others. | [Course overview](../overview/#the-case) |
| use AI tools according to the course rules | Name the two rules for AI assistants in the milestones. | [Course overview](../overview/#ai-tools) |
| describe the three VMs of the lab and their two networks | Draw the lab with front-end, nodes, lab network and internal network from memory. | [The lab](../lab/#two-networks) |
| check whether a VM supports nested virtualization | Show on a node that the CPU offers `vmx` or `svm`. | [The lab](../lab/#nested-virtualization) |
| generate and explain my personal parameters | Show `/etc/cc-lab.env` on all three VMs and explain where `CC_GUEST_NET` and `CC_VNI` appear in the course. | [Personal parameters](../parameters/#the-values) |
| prepare a VM for its role | Run `prepare.sh` on a node again and explain what it checks. | [Preparing the VMs](../prepare/#the-preparation-script) |
| check the gateway of the internal network | Explain the output of `sudo cc-gateway status`. | [Preparing the VMs](../prepare/#the-gateway) |
| reach all VMs over SSH without a password | Log in to the front-end with `ssh` and the name from your SSH configuration, then from there to a node. | [Tools](../tools/#ssh-from-the-front-end-to-the-nodes) |
| run a check and read its report | Run the check `start` and explain what the hash at the end proves and what it does not. | [Tools](../tools/#the-first-check) |
| record a screencast that follows the rules of the milestones | List what is visible in the first 30 seconds of a screencast. | [Tools](../tools/#screencasts) |

For part 2 you need three prepared VMs that the check `start` confirms without a single `[!!]`.
