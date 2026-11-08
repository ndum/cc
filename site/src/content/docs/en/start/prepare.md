---
title: Preparing the VMs
description: SSH with a key and a configuration on the client, sudo without a password, the course repo and the preparation script on every server, the key from the front-end to the nodes and the check start.
sidebar:
  order: 4
---

:::assignment
"The servers have their addresses now," Simone Wyss writes. "What is still missing before the cloud goes on them? And please no typing a password every time, nobody keeps that up for long."
:::

:::goals
After this chapter you can:

- Reach the servers from the client without a password using an SSH key and an SSH configuration
- Prepare each server for its role with the preparation script
- Explain what the script sets up on the front-end and the nodes
- Reach the nodes from the front-end without a password
- Run the check `start` and read its report
:::

## SSH from the client

An SSH key consists of two files. The private key stays on the client, the public key goes onto every server. When you log in, the client uses the private key to prove that it matches the public one, and no password crosses the network.

Create the key in the terminal of the client. Confirm the location with Enter. You may leave the passphrase empty in the lab, otherwise SSH asks for it at every login.

```bash
ssh-keygen -t ed25519 -C "cc-lab"
```

The following block adds your three servers with their host name, new address and the user `vmadmin` to the file `~/.ssh/config`. Then it copies your public key to every server with `ssh-copy-id`. The generator still knows your code from chapter 0.3. Paste the block into the terminal of the client. `ssh-copy-id` asks for the password of `vmadmin` for every server. If the client does not know the new address of a server yet, it first asks whether you trust its key. If it fails for one server, run `ssh-copy-id` again for that server only, for example `ssh-copy-id mmuster-fe`.

<cc-params part="ssh"></cc-params>

After that, `ssh` with the server's name is all you type, for example `ssh mmuster-fe`, without an address and without a password. The [ssh_config manual page](https://manpages.ubuntu.com/manpages/resolute/man5/ssh_config.5.html) describes every entry of the file, and the [OpenSSH guide](https://ubuntu.com/server/docs/how-to/security/openssh-server/) in the Ubuntu Server documentation shows keys and `ssh-copy-id`.

:::selfhost
Without a client you work on your PC. Windows 11, macOS and Linux ship with OpenSSH, and on Windows you create the key in PowerShell with the same command. Microsoft's [guide to key-based authentication](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement) explains how OpenSSH handles keys on Windows. The generator's block runs in the shell of Linux and macOS. On Windows you add the three hosts to `%USERPROFILE%\.ssh\config` with an editor. Windows has no `ssh-copy-id`, there this PowerShell command appends the public key to `~/.ssh/authorized_keys` on each server.

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh vmadmin@<address> "umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys"
```
:::

## Preparing every server

Work through the servers in turn, the two nodes first and the front-end last, since the next steps run there. Log in, for example with `ssh mmuster-node1`, and paste this block. It is the same on all three servers. If `sudo` asks for the password, this is the last time.

```bash
echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$USER
sudo apt update && sudo apt install -y git
git clone https://github.com/ndum/cc.git
```

The first line allows your user sudo without a password, because in chapter 2.2 Ansible runs commands as administrator without asking for one. On smartlearn `vmadmin` may do that already. The line makes it independent of the template, also on a hypervisor of your own. The [sudoers manual page](https://manpages.ubuntu.com/manpages/resolute/man5/sudoers-rs.5.html) of Ubuntu 26.04 explains what such a line allows. The minimal installation of Ubuntu has no Git, so the second line installs it. `git clone` puts the course repo into a new folder `cc` in your home directory, as the [Git documentation](https://git-scm.com/docs/git-clone) describes.

Then run the preparation script with the role of the server, `node1`, `node2` or `fe`. Log out and in again afterwards, only then does the prompt show the new host name.

```bash
sudo ~/cc/lab/prepare.sh node1
```

## The preparation script

The script `lab/prepare.sh` reads your parameters from `/etc/cc-lab.env`. On every server it sets the host name, adds the names of all three servers to `/etc/hosts` and installs rsyslog.

::code{file="lab/prepare.sh" lines="47-59"}

On the nodes it checks that CPU virtualization comes through and names the network interface OpenNebula needs later. If a node has no swap yet, the script creates the file `/swapfile` with 2 GB and adds it to `/etc/fstab`. OpenNebula hands out the whole memory of a node to VMs, although the node itself needs part of it. When memory runs out and there is no swap, the kernel kills the largest VM, as [chapter 6.2](../../operations/backup/#vms-in-opennebula) shows. On the front-end it installs acl and nftables and pins Node.js to the package source of OpenNebula for later. It also sets up the gateway for the internal network as the service `cc-gateway`, which runs at every boot.

The script may run several times, it only changes what is not right yet. If it stops with an error, the message says what is missing, for example a wrong address in `/etc/cc-lab.env` or a node without nested virtualization.

## The gateway

The service `cc-gateway` connects the front-end to the internal network of your cloud. It creates the VXLAN with your identifier, gives the front-end the gateway address in it and forwards the traffic of the cloud to the internet with NAT. The script shows its state at the end on the front-end, later this command shows it.

```bash
sudo cc-gateway status
```

The output names the gateway on `cc-br`, the VXLAN with identifier and multicast group, the forwarding and the NAT rule with your internal network. That rule lives in the nftables table `cc_gateway`. The [NAT guide](https://wiki.nftables.org/wiki-nftables/index.php/Performing_Network_Address_Translation_%28NAT%29) in the nftables wiki explains rules of this kind.

## SSH from the front-end to the nodes

From part 2 on you mostly work on the front-end. From there Ansible sets up the nodes and the check scripts test them, so the front-end needs a key of its own that is registered on the nodes. Ansible sets up the front-end itself locally, without SSH.

Log in to the front-end with `ssh mmuster-fe` and paste this block. It creates a key without a passphrase there and copies it to both nodes, whose names it reads from `/etc/cc-lab.env`. `ssh-copy-id` asks for every node whether you trust it, and for the password of `vmadmin`.

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
. /etc/cc-lab.env
ssh-copy-id $CC_NODE1_HOST
ssh-copy-id $CC_NODE2_HOST
```

After that, `ssh $CC_NODE1_HOST hostname` prints the node's name without asking for a password.

## The check `start`

The check script tells you on the front-end whether your lab is ready. It checks names and addresses, sudo without a password, the gateway and the SSH connection to the nodes. On every node it checks Ubuntu, CPU virtualization, rsyslog, sudo and swap.

```bash
python3 ~/cc/checks/check.py start
```

Each line of the report starts with `[ok]` or `[!!]`. Below a line with `[!!]` there is a hint on where to look. The script saves the report in `~/cc-reports/` and ends it with a hash over the whole report. Editing the report by hand afterwards breaks the hash. Since the script is public, though, the hash does not prove that the check really ran. Your screenshots and the showing of the advanced tasks do.

::code{file="checks/check.py" lines="792-797"}

In chapter 0.5 you upload the report to your hand-in repo. On smartlearn you can take a snapshot of every VM. A snapshot of the three servers after the green check brings you back to the prepared lab if something goes wrong later.

::::exercise[Lab]
Set up SSH on the client and prepare the three servers, the nodes first and then the front-end. Then connect the front-end to the nodes and run the check `start`.

:::solution
On every server the script ends with the section "Done", on the front-end it shows the gateway with VXLAN identifier and NAT rule before that. The check ends with a line like "27 of 27 base checks passed" and a hash. If an SSH connection is missing, the report shows `[!!] SSH without password to` and the node's name. In that case the front-end's key is missing on that node.
:::
::::
