---
title: Tools and hand-in repo
description: SSH keys and an SSH configuration, the key from the front-end to the nodes, the hand-in repo on GitLab or GitHub, the first check with its report and the rules for screencasts.
sidebar:
  order: 5
---

:::assignment
"Before we go on, the board wants to know how we keep track of what we build," Simone Wyss writes. "Could you set up a repo where every step can be followed? And please no typing a password every time, nobody keeps that up for long."
:::

:::goals
After this chapter you can

- reach your VMs without a password using an SSH key and an SSH configuration,
- reach the nodes from the front-end without a password,
- create your hand-in repo and share it with your instructor,
- run the check of a chapter and read its report,
- record a screencast of the advanced tasks that meets the rules of the milestones.
:::

## SSH keys

An SSH key consists of two files. The private key stays on your laptop, and the public key goes onto every VM. When you log in, your laptop uses the private key to prove that it matches the public one, and no password ever crosses the network.

Windows 11, macOS and Linux ship with OpenSSH. Create a key in the terminal or in PowerShell. The passphrase protects the private key in case someone copies the file.

```bash
ssh-keygen -t ed25519 -C "cc-lab"
```

You add the public key from `~/.ssh/id_ed25519.pub` to the file `~/.ssh/authorized_keys` on every VM. On macOS and Linux, `ssh-copy-id` does that for you. On Windows, copy the content of the file and paste it into the file on the VM with an editor.

## An SSH configuration

So that you do not have to remember addresses, create the file `~/.ssh/config` on your laptop, on Windows `%USERPROFILE%\.ssh\config`. After that, `ssh mmuster-fe` is all you type. Replace the names and addresses with your own from `/etc/cc-lab.env`.

```text
Host mmuster-fe
  HostName 192.168.210.137
  User cc

Host mmuster-node1
  HostName 192.168.210.138
  User cc

Host mmuster-node2
  HostName 192.168.210.139
  User cc
```

## SSH from the front-end to the nodes

From part 2 on you mostly work on the front-end. From there Ansible sets up the nodes, and the check scripts test them. Ansible sets up the front-end itself locally, without SSH. The front-end therefore needs a key of its own that is registered on the nodes. Log in to the front-end, create a key without a passphrase and copy it to both nodes. `ssh-copy-id` asks once for the node's password and has you confirm that you know the node.

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
ssh-copy-id mmuster-node1
ssh-copy-id mmuster-node2
```

After that, `ssh mmuster-node1 hostname` has to print the node's name without asking for a password.

## The hand-in repo

For your milestones you create a private repo, either on your school's GitLab or on GitHub. Name it `cc-` followed by your code, for example `cc-mmuster`, and give your instructor read access. The repo holds your code, the reports of the checks, a copy of `/etc/cc-lab.env`, documentation with screenshots for every milestone and, for the advanced tasks, your screencast or a link to it. [Assessment](../../assessment/) describes the exact layout.

Clone the repo onto the front-end, where most of the files come from. To reach GitLab or GitHub from the VM, add the front-end's public key to your account there.

```bash
git clone git@github.com:mmuster/cc-mmuster.git
```

## The first check

Now you check whether your lab is ready. The check script runs on the front-end. It checks names and addresses, the gateway, the SSH connection to the nodes and, on every node, Ubuntu, CPU virtualization and rsyslog.

```bash
python3 ~/cc/checks/check.py start
```

Each line of the report starts with `[ok]` or `[!!]`. Below a line with `[!!]` there is a hint on where to look. The script saves the report in `~/cc-reports/`, and it ends with a hash that covers the whole report. Editing the report by hand afterwards breaks the hash. Since the script is public, though, the hash does not prove that the check really ran. Your screenshots and the showing of the advanced tasks are the proof.

::code{file="checks/check.py" lines="161-166"}

Copy the report into the folder `reports/` of your hand-in repo, commit it and push it.

## Screencasts

You prove the base of a milestone with documentation and screenshots, so it needs no screencast. You show the advanced tasks either live in class or in a screencast. Screencasts follow these rules:

1. at most ten minutes, one recording without cuts
2. first `cat /etc/cc-lab.env` and the report of the milestone check with its hash and your two questions
3. then the advanced tasks, live in your lab
4. your answers to the two questions and your own decisions with the reasons behind them
5. audio with your voice, so your instructor hears how you explain

On Windows you record with the Snipping Tool or with OBS Studio, on macOS with the built-in screen recording. Put the screencast into your hand-in repo or onto storage such as OneDrive and add the link to the documentation of the milestone.

::::exercise[Lab]
Set up SSH with a key and a configuration, connect the front-end to the nodes, create your hand-in repo and upload the report of the check `start`.

:::solution
The check ends with a line like "20 of 20 checks passed" and a hash. If an SSH connection is missing, the report shows `[!!] SSH without password to` and the node's name. In that case the front-end's key is missing on that node.
:::
::::
