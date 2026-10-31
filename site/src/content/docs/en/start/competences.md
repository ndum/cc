---
title: Competence grid for part 0
description: What you can do after part 0 and how to check it yourself.
sidebar:
  label: Competence grid
  order: 4
---

Use this grid to judge whether you are ready for the next parts. Read each row and solve the task next to it without looking anything up. If it comes easily, you have reached the goal. If not, the link in the last column takes you to the right place.

| I can … | Task | Look up |
|---|---|---|
| explain how the course is organized and how my grade comes together | Name the four implementation proofs, the two hand-ins and what happens in block 7. | [Course overview](../overview/#assessment) |
| name the members of Wolkenwerk Bern and their needs | For each member, name the need that sets it apart from the others. | [Course overview](../overview/#the-case) |
| use AI tools according to the course rules | Name the two rules for AI assistants in the proofs. | [Course overview](../overview/#ai-tools) |
| check whether a VM supports nested virtualization | Show on a node that the CPU offers `vmx` or `svm`. | [Setting up the lab](../lab/#nested-virtualization-on-windows) |
| generate and store my personal parameters | Show `/etc/cc-lab.env` on all three VMs and explain two of the values. | [Setting up the lab](../lab/#personal-parameters) |
| prepare a VM for its role | Run `prepare.sh` on a node again and explain what it checks. | [Setting up the lab](../lab/#preparing-each-vm) |
| reach all VMs over SSH without a password | Log in to the front-end with `ssh` and the name from your SSH configuration, then from there to a node. | [Tools](../tools/#ssh-from-the-front-end-to-the-nodes) |
| run a check and read its report | Run the check `start` and explain what the hash at the end proves and what it does not. | [Tools](../tools/#the-first-check) |
| record a screencast that follows the rules of the proofs | List what is visible in the first 30 seconds of a screencast. | [Tools](../tools/#screencasts) |

For part 2 you need three prepared VMs that the check `start` confirms without a single `[!!]`.
