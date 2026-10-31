---
title: Images, templates and context
description: Datastores and images from the marketplace, a template for small Ubuntu VMs, contextualization with network, SSH key and host name, and your first VM in the cloud.
sidebar:
  order: 4
---

:::assignment
"Praxis Rosenweg would like a first test machine," Simone Wyss writes. "Ubuntu, small, on the internal network and without anyone on our side setting it up by hand. Can that be done in a few minutes?"
:::

:::goals
After this chapter you can

- tell datastores, images and templates apart,
- bring an image from the marketplace into your cloud,
- read and adapt a VM template,
- explain how contextualization sets up a VM at its first boot,
- start a VM, log in over SSH and pass the check of this part.
:::

## Datastores and images

An image is a disk that VMs boot from, such as a prepared Ubuntu. Images live in a datastore. OneDeploy created three datastores. `default` holds the images, `system` the disks of running VMs, and `files` smaller files such as scripts. When a VM starts, the transfer driver `ssh` copies its image into the `system` datastore of the node. The VM works on that copy, and the image in the datastore stays unchanged.

The OpenNebula marketplace provides ready-made images. `onemarketapp export` brings an image into your datastore, and OpenNebula creates a simple template for it.

```bash
onemarketapp list | grep -i ubuntu
onemarketapp export "Ubuntu Minimal 26.04" ubuntu-26.04 --datastore default
oneimage list
```

The image is ready as soon as `oneimage list` shows `rdy` in the column `STAT`.

## Templates

A template describes a VM from which you can start any number of VMs. The course provides the template `ubuntu` for small VMs on the internal network.

::code{file="lab/iaas/ubuntu.tpl"}

`CPU` is the share of a physical core the scheduler reserves for the VM. `VCPU` is the number of CPUs the VM sees. With `CPU = "0.5"` and `VCPU = "1"`, twice as many VMs fit on a node as it has cores, as long as not all of them compute at full speed at once. `CPU_MODEL` with `host-passthrough` shows the VM the real CPU, as chapter 1.3 explains. `DISK` names the image, `NIC` the network. The next section explains the `CONTEXT` block.

```bash
onetemplate create ~/cc/lab/iaas/ubuntu.tpl
onetemplate list
```

## Contextualization

An image is the same for every VM, but each VM needs its own address, its name and the keys of its users. OpenNebula hands these details to the VM at boot. It attaches them as a small virtual CD drive, and the package `one-context` in the image reads them at the first boot and sets up the VM accordingly. This principle is called contextualization.

| Setting | Effect in the VM |
|---|---|
| `NETWORK = "YES"` | address, gateway, DNS and MTU from the network `cc-net` |
| `SSH_PUBLIC_KEY` | the public key in root's `authorized_keys` |
| `SET_HOSTNAME` | the host name, here the name of the VM |
| `START_SCRIPT` | a script that runs at boot, used for k3s in part 4 |

`$USER[SSH_PUBLIC_KEY]` takes the key from the user who starts the VM. So that you can log in from the front-end, you store the front-end's key with `oneadmin`.

```bash
printf 'SSH_PUBLIC_KEY="%s"\n' "$(cat ~/.ssh/id_ed25519.pub)" > /tmp/key.tpl
oneuser update oneadmin --append /tmp/key.tpl
```

## Your first VM

Now you start a VM from the template and log in. It usually runs after a few seconds, and SSH is ready after about half a minute.

```bash
onetemplate instantiate ubuntu --name web-1
onevm list
onevm show web-1 | grep -E 'IP=|HOST'
ssh root@<address-of-the-vm>
```

Inside the VM, `hostname`, `ip -br addr` and `ip link show eth0` show what contextualization has set up. `curl -I https://ubuntu.com` checks whether the VM reaches the internet through the gateway. In Sunstone a click on the VM and then on the console icon opens its screen in the browser.

The check of this part covers the network, the template, a running VM, the SSH login, its host name and internet access.

```bash
python3 ~/cc/checks/check.py iaas
```

::::exercise[Lab]
Get the image, create the template, start the VM `web-1` and upload the report of the check `iaas` to your hand-in repo.

:::solution
The check ends with "11 of 11 checks passed". Inside the VM, `hostname` shows the name `web-1`, `ip -br addr` an address from your internal network and `ip link show eth0` the MTU 1450.
:::
::::

::::exercise[Adapting a template]
Treuhand Aaregg needs a larger VM with two CPUs and 2 GB of memory at the end of the month. Create a copy of the template named `ubuntu-medium` and start a VM from it. According to `onehost list`, how many such VMs fit on one node?

:::solution
`onetemplate clone ubuntu ubuntu-medium`, then `onetemplate update ubuntu-medium` with `CPU = "1"`, `VCPU = "2"` and `MEMORY = "2048"`. A node with 7.2 GB of memory and four cores carries three such VMs, so memory sets the limit, not the CPU.
:::
::::
