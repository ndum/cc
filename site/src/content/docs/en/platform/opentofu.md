---
title: OpenTofu with OpenNebula
description: Making room on the nodes, installing OpenTofu, kubectl and Helm, and creating, changing and rebuilding two VMs from code with a provider, data sources, variables, outputs and state.
sidebar:
  order: 2
---

:::assignment
"Start with the two machines for the containers," Simone Wyss writes. "Once you have thrown them away and rebuilt them within ten minutes, I'll believe you about the code."
:::

:::goals
After this chapter you can

- explain why the VMs of parts 2 and 3 have to make room for the cluster,
- set up OpenTofu with the provider for OpenNebula,
- identify providers, data sources, variables, resources and outputs in a configuration,
- create, change, replace and delete VMs with `tofu plan` and `tofu apply`,
- explain why the state holds secrets and stays out of Git.
:::

## Room on the nodes

The Kubernetes cluster of part 4 runs on two VMs with 6 GB of memory each, one per node. It needs that much by part 5 at the latest, when Prometheus, Loki and a local language model join. Each node has 8 GB, and OpenNebula reports 7.2 GB of it for VMs. `onehost list` shows this in the column `ALLOCATED_MEM`.

OpenNebula reserves the full memory of a VM's template on its node, even when the VM does not use it at the moment. With the cluster in place, each node has 1.2 GB left, enough for a single VM with 1 GB. The three web servers of part 2 plus the practice's VMs and the fiduciary office's service of part 3 take 6 GB together. With them running the cluster does not start, because OpenNebula finds no node with 6 GB free.

![The memory of a node. A bar shows the 8 GB of one node. The host keeps 0.8 GB, and OpenNebula reports the remaining 7.2 GB for VMs. The k3s VM reserves 6 GB of that, the server on one node and the agent on the other. That leaves 1.2 GB free. Notice that only one more VM with 1 GB fits next to it, because OpenNebula reserves the full memory of every VM.](../../../../assets/figures/en/p4c2-memory.svg)

So you clean up before this chapter. Record the milestone 1 screencast first, because afterwards the VMs it shows are gone. The groups, quotas, prices and templates of part 3 stay, you only remove the running VMs.

```bash
oneflow list
oneflow delete <service-id>
onevm list
for id in $(onevm list -l ID --no-header); do onevm terminate "$id"; done
onehost list
```

First you remove the fiduciary office's service, otherwise OneFlow starts its VM again right away. Then the loop terminates every VM that `onevm list` shows, whatever names you gave them in parts 2 and 3. `oneadmin` may terminate the VMs of every member. At the end, `onehost list` shows `0K / 7.2G` on both nodes.

:::note[Showing milestone 1 live]
If you show milestone 1 live in class instead of in a screencast, take the cluster off the nodes for the demo. `onevm undeploy k3s-server` and `onevm undeploy k3s-agent` stop the VMs and release their memory and CPU while keeping their disks. Then you start the members' VMs again with the commands of part 3, show milestone 1 and terminate them. `onevm resume` brings the cluster back. In the lab, `undeploy` took a little under two minutes, and after `resume` the web shop of chapter 4.4 answered again after about 45 seconds. `onevm poweroff` is not enough, a VM that is powered off keeps its place on the node.
:::

## Tools

The front-end needs three tools. OpenTofu creates the VMs, kubectl talks to Kubernetes, and Helm installs packages into Kubernetes. The script takes all three from their official package repositories, so `apt upgrade` updates them later.

::code{file="platform/install-tools.sh"}

```bash
sudo ~/cc/platform/install-tools.sh
```

In the lab these were OpenTofu 1.13.2, kubectl 1.36.6 and Helm 4.3.0. OpenTofu is a fork of Terraform under the Linux Foundation with the open source license MPL 2.0. The language and most providers are the same, so if you can read Terraform you can read OpenTofu.

## The platform repo

The code of the platform lives in a repo of its own. Its template is `platform/repo` in the course repo. You copy it to `~/platform` and turn it into a Git repo in chapter 4.4.

```bash
cp -r ~/cc/platform/repo ~/platform
cd ~/platform/tofu
ls
```

The folder `tofu/` holds the configuration, split into files. OpenTofu reads every `.tf` file of a folder together, the split is only for clarity.

| File | Content |
|---|---|
| `versions.tf` | the OpenTofu version and the providers |
| `variables.tf` | the variables with description and default |
| `main.tf` | provider, data sources and resources |
| `outputs.tf` | values OpenTofu prints after an apply |
| `k3s.sh.tftpl` | the start script of the VMs, the topic of chapter 4.3 |
| `.terraform.lock.hcl` | the exact versions and checksums of the providers |

## Providers

A provider translates blocks of code into calls of an API. The provider `opennebula/opennebula` talks to the XML-RPC interface of OpenNebula on port 2633, the same one the CLI and Sunstone use. `random` generates random values.

::code{file="platform/repo/tofu/versions.tf"}

`~> 1.5` means 1.5 or newer, but not 2.0. Which version `tofu init` actually fetches is recorded in `.terraform.lock.hcl`. This file belongs in Git so that everyone works with the same providers. The OpenNebula user and password are not in the code. The provider reads them from environment variables, which you set from your file `~/.one/one_auth` of chapter 2.2.

```bash
export OPENNEBULA_USERNAME=oneadmin
export OPENNEBULA_PASSWORD=$(cut -d: -f2- ~/.one/one_auth)
```

## The configuration

::code{file="platform/repo/tofu/main.tf"}

| Block | Meaning |
|---|---|
| `provider` | how OpenTofu reaches OpenNebula |
| `resource "random_password"` | a random token the cluster nodes use to join |
| `locals` | values used more than once, here the two VMs with address and role |
| `data` | something that already exists and is only read, here the network `cc-net` and the image `ubuntu-26.04` of part 2 |
| `resource "opennebula_virtual_machine"` | the VMs, one per entry of `local.nodes` thanks to `for_each` |

A data source connects the code with what you built by hand without taking it over. OpenTofu reads the ID of `cc-net` but never creates or deletes the network.

The addresses of the VMs come from your personal parameters, `CC_K3S_SERVER_IP` and `CC_K3S_AGENT_IP` in `/etc/cc-lab.env`. A small script writes them to `terraform.tfvars`, the file OpenTofu reads variables from.

```bash
./make-tfvars.sh > terraform.tfvars
cat terraform.tfvars
```

## Init, plan and apply

`tofu init` downloads the providers into the folder `.terraform`. Without this step, `plan` and `apply` stop with "Inconsistent dependency lock file", in every new copy of the repo as well.

```bash
tofu init
tofu plan
tofu apply
```

The plan shows three resources with `+`, the token and two VMs. For the token it shows `result = (sensitive value)`. OpenTofu hides secrets in its output but stores them in the state. After `yes`, OpenTofu creates the VMs, in the lab within ten seconds and one on each node. At the end it prints the outputs. The addresses below come from the course lab, yours show your own `cc-net` network with the endings `.110` and `.111`.

```text
Outputs:

api = "https://172.28.217.110:6443"
ips = {
  "k3s-agent" = "172.28.217.111"
  "k3s-server" = "172.28.217.110"
}
```

## Reading the state

```bash
tofu state list
tofu state show 'opennebula_virtual_machine.k3s["k3s-server"]'
tofu output
```

`tofu state list` shows the three resources OpenTofu manages, and `tofu state show` lists every attribute of a VM as OpenNebula reports it. The state lives in `terraform.tfstate`. Open the file and you find the token in plain text. That is why the `.gitignore` of the repo excludes the state and the folder `.terraform`.

## Changing, replacing and rebuilding

Renaming a VM by hand creates drift. In the lab, the next plan looked like this.

```bash
onevm rename k3s-agent handarbeit
tofu plan
```

```text
  # opennebula_virtual_machine.k3s["k3s-agent"] will be updated in-place
      ~ name                   = "handarbeit" -> "k3s-agent"
Plan: 0 to add, 1 to change, 0 to destroy.
```

`tofu apply` renames it back. Some changes cannot be made to a running VM. Then OpenTofu replaces it and shows `-/+`. With `-replace` you force a single VM to be replaced, for example after its start script went wrong.

```bash
tofu apply -replace='opennebula_virtual_machine.k3s["k3s-agent"]'
```

The full rebuild tells you the most. `tofu destroy` deletes everything in the state, and `tofu apply` builds it again.

```bash
tofu destroy
tofu apply
```

The network and the image stay, because the code only reads them. In the lab, both VMs were ready about two minutes after the rebuild, with Kubernetes on them. Chapter 4.3 shows how the start script does that.

::::exercise[Lab]
Clean up the nodes, install the tools and create the two VMs with OpenTofu. Show with `tofu plan` that no changes are left.

:::solution
After the cleanup, `onehost list` shows `0K / 7.2G` on both nodes. `tofu apply` creates `k3s-server` and `k3s-agent` with the addresses of your parameters, and `onevm list` shows both with 6G on different nodes. A second `tofu plan` reports "No changes. Your infrastructure matches the configuration."
:::
::::

::::exercise[Drift]
Create drift by changing one of the two VMs in Sunstone or with the CLI. Show it with `tofu plan` and fix it. Which change made by hand would OpenTofu not notice?

:::solution
A new name, as above, shows up as `~ name` in the plan, and `tofu apply` reverts it. OpenTofu only compares the attributes the provider knows, though. Whatever someone changes inside the VM, such as installing a package over SSH or deleting a file, stays invisible. The start script takes care of the inside of the VMs, and in the cluster Argo CD takes over in chapter 4.4.
:::
::::

::::exercise[Variable]
The fiduciary office asks whether the cluster could do with less memory so that one of its VMs fits next to it again. Where do you change that, and what follows from it?

:::solution
`variables.tf` has the variable `memory` set to 6144. In `terraform.tfvars` you set, for example, `memory = 5120`, and the plan shows a change on both VMs. Each node would then have 2.2 GB free, enough for two small VMs. In part 5, however, Prometheus, Loki and the local model need the memory. In the test, the server sat at 3.4 GB with everything running, and the model used 2.7 GB on the agent. The decision and its reasons go into the documentation.
:::
::::
