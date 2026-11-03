---
title: Tools and hand-in repo
description: SSH keys and an SSH configuration on the client, the key from the front-end to the nodes, the hand-in repo on GitLab or GitHub, the first check with its report and the rules for screencasts.
sidebar:
  order: 5
---

:::assignment
"Before we go on, the board wants to know how we keep track of what we build," Simone Wyss writes. "Could you set up a repo where every step can be followed? And please no typing a password every time, nobody keeps that up for long."
:::

:::goals
After this chapter you can:

- Reach the servers from the client without a password using an SSH key and an SSH configuration
- Reach the nodes from the front-end without a password
- Create your hand-in repo and share it with your instructor
- Run the check of a chapter and read its report
- Record a screencast of the advanced tasks that meets the rules of the milestones
:::

## SSH keys

An SSH key consists of two files. The private key stays on the client, the public key goes onto every server. When you log in, the client uses the private key to prove that it matches the public one, and no password crosses the network.

Create the key in the terminal of the client. The passphrase protects the private key in case someone copies the file.

```bash
ssh-keygen -t ed25519 -C "cc-lab"
```

`ssh-copy-id` copies the public key from `~/.ssh/id_ed25519.pub` to a server. It asks for the password one last time and adds the key to `~/.ssh/authorized_keys` on the server. The [OpenSSH guide](https://ubuntu.com/server/docs/how-to/security/openssh-server/) in the Ubuntu Server documentation shows both steps as well.

```bash
ssh-copy-id cc@<address>
```

:::selfhost
Without a client you work on your PC. Windows 11, macOS and Linux ship with OpenSSH, and on Windows you create the key in PowerShell with the same command. Microsoft's [guide to key-based authentication](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement) explains how OpenSSH handles keys on Windows. Windows has no `ssh-copy-id`. There this PowerShell command appends the public key to `~/.ssh/authorized_keys` on the server.

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh cc@<address> "umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys"
```

On Windows the SSH configuration of the next section lives in `%USERPROFILE%\.ssh\config`.
:::

## An SSH configuration

So that you do not have to remember addresses, create the file `~/.ssh/config` on the client, for example with `nano ~/.ssh/config`. After that, `ssh mmuster-fe` is all you type. Replace the names and addresses with your own from `/etc/cc-lab.env`. The [ssh_config manual page](https://manpages.ubuntu.com/manpages/resolute/man5/ssh_config.5.html) describes every entry this file can hold.

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

From part 2 on you mostly work on the front-end. From there Ansible sets up the nodes and the check scripts test them, so the front-end needs a key of its own that is registered on the nodes. Ansible sets up the front-end itself locally, without SSH.

Log in to the front-end, create a key without a passphrase there and copy it to both nodes. `ssh-copy-id` asks once for the node's password, after SSH has you confirm that you know the node.

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
ssh-copy-id mmuster-node1
ssh-copy-id mmuster-node2
```

After that, `ssh mmuster-node1 hostname` prints the node's name without asking for a password.

## The hand-in repo

For your milestones you create a private repo, either on your school's GitLab or on GitHub. Name it `cc-` followed by your code, for example `cc-mmuster`, and give your instructor read access. The repo holds the reports of the checks, a copy of `/etc/cc-lab.env` and the screenshots of the base for every milestone. For the advanced tasks their documentation, your code and your screencast or a link to it go there too. [Assessment](../../assessment/) describes the exact layout.

Clone the repo onto the front-end, where most of the files come from. To let the front-end reach GitLab or GitHub, add its public key to your account. `cat ~/.ssh/id_ed25519.pub` on the front-end shows it. Copy it in the terminal of the client and paste it into the settings of your account in the browser of the client. The guides of [GitLab](https://docs.gitlab.com/user/ssh/) and [GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account) show where that setting is.

```bash
git clone git@github.com:mmuster/cc-mmuster.git
```

## The first check

The check script tells you whether your lab is ready. It runs on the front-end and checks names and addresses, the gateway and the SSH connection to the nodes. On every node it checks Ubuntu, CPU virtualization and rsyslog.

```bash
python3 ~/cc/checks/check.py start
```

Each line of the report starts with `[ok]` or `[!!]`. Below a line with `[!!]` there is a hint on where to look. The script saves the report in `~/cc-reports/` and ends it with a hash over the whole report. Editing the report by hand afterwards breaks the hash. Since the script is public, though, the hash does not prove that the check really ran. Your screenshots and the showing of the advanced tasks do.

::code{file="checks/check.py" lines="772-777"}

Copy the report into the folder `reports/` of your hand-in repo, commit it and push it.

## Screencasts

You prove the base of a milestone with the check report and screenshots, it needs no screencast. You show the advanced tasks either live in class or in a screencast. Screencasts follow these rules:

1. At most ten minutes, one recording without cuts
2. First `cat /etc/cc-lab.env` and the report of the milestone check with its hash and your two questions
3. Then the advanced tasks, live in your lab
4. Your answers to the two questions and your own decisions with the reasons behind them
5. Audio with your voice, so your instructor hears how you explain

You record the screencast on your PC, where smartlearn runs in the browser. On Windows the Snipping Tool or OBS Studio does that, on macOS the built-in screen recording. Put the screencast into your hand-in repo or onto storage such as OneDrive and add the link to the documentation of the advanced tasks.

::::exercise[Lab]
Set up SSH with a key and a configuration on the client and connect the front-end to the nodes. Create your hand-in repo and upload the report of the check `start`.

:::solution
The check ends with a line like "22 of 22 base checks passed" and a hash. If an SSH connection is missing, the report shows `[!!] SSH without password to` and the node's name. In that case the front-end's key is missing on that node.
:::
::::
