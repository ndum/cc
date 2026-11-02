---
title: Infrastructure as code
description: Declarative and imperative, desired state, state, plan and apply, drift and idempotence, and why the platform team describes its infrastructure as code.
sidebar:
  order: 1
---

:::assignment
"Veloatelier Matte wants to run its web shop on containers," Simone Wyss writes. "And I heard you spent another evening last week setting up VMs by hand. I want a platform you can rebuild from code at any time."
:::

:::goals
After this chapter you can:

- Tell declarative and imperative descriptions of infrastructure apart
- Explain desired state, actual state and the state file
- Describe the steps of plan and apply
- Explain drift and idempotence with an example from the lab
:::

## Click path and code

In part 2 you created the network `cc-net`, the template `ubuntu` and the first VMs with CLI commands, one step after the other. That worked as long as you were alone and remembered the order. It gets hard when someone else has to build the same environment, when nobody knows after an error what already exists, or when you want to know six months later why a VM has 6 GB.

Infrastructure as code (IaC) describes infrastructure in files kept in Git. A tool reads the files and makes the infrastructure match them. The files are then the build instructions, the documentation and the history at once. Whoever wants to know why the VM has 6 GB finds the line, and the Git history shows the commit with its reason.

## Declarative and imperative

An imperative description says what to do and in which order. The commands of part 2 are imperative.

```bash
onevnet create cc-net.tpl
onetemplate create ubuntu.tpl
onetemplate instantiate ubuntu --name web-1
```

Run them a second time and the first one fails because `cc-net` already exists, while the third one creates a second VM with the same name. The script knows nothing about the state it finds.

A declarative description says what the result should look like. The tool compares this desired state with the actual state and works out what it has to do. In the next chapter you describe the two VMs of the Kubernetes cluster this way.

```hcl
resource "opennebula_virtual_machine" "k3s" {
  for_each = local.nodes
  name     = each.key
  memory   = 6144
}
```

If a VM is missing, OpenTofu creates it. If a VM has too little memory, OpenTofu changes it. If everything matches, OpenTofu does nothing.

| | Imperative | Declarative |
|---|---|---|
| Describes | the steps | the result |
| Second run | repeats the steps | changes only what differs |
| Order | set by a person | derived by the tool from dependencies |
| Examples | shell scripts, CLI commands | OpenTofu, Kubernetes manifests |

Ansible from chapter 2.2 sits in between. A playbook is a list of steps, but most of its modules are declarative, for example "this package is installed".

## State

OpenTofu has to know which object in OpenNebula belongs to which block in the code. It keeps this mapping in its state, in the lab the file `terraform.tfstate`. It records, for example, that the block `opennebula_virtual_machine.k3s["k3s-server"]` is the VM with ID 11.

The state is sensitive. It holds every attribute of the objects, secrets included, such as the token the k3s nodes use to join each other. So it does not go into Git. If it gets lost, OpenTofu no longer knows its VMs and would create new ones on the next run. Teams therefore keep the state in shared storage with a lock, so that two people cannot change things at the same time. In the lab you work alone and the state stays a file on the front-end.

## Plan and apply

Working with OpenTofu has two steps.

1. `tofu plan` reads the code, the state and the actual state and shows what would change, without doing anything. `+` means create, `~` change, `-` delete and `-/+` replace.
2. `tofu apply` builds the same plan, asks for confirmation and carries it out.

The plan is where you catch mistakes. If it shows `-/+` for a VM you only meant to rename, you stop. Teams show the plan in a pull request before anyone applies it.

![Plan and apply with the state. The code in Git on the left is the desired state, and OpenNebula on the right holds the actual state. tofu plan reads the code, the state in terraform.tfstate and the actual state, and only shows what would change. tofu apply reads the code, changes the VMs through the OpenNebula API and then writes the state. On the far right someone changes a VM by hand in Sunstone or with the CLI. Notice that only apply changes anything, and that the next plan catches this drift because it reads the actual state.](../../../../assets/figures/en/p4c1-plan-apply.svg)

## Drift and idempotence

Drift is a difference between the actual state and the code, for example because someone changed a VM by hand in Sunstone. `tofu plan` makes drift visible and `tofu apply` reverts it.

The lab had drift that nobody caused. When OpenNebula starts a VM, it sets the machine type `q35` itself. The code did not name one, so every later plan wanted to remove the value. Only after adding `machine = "q35"` to the code did `tofu plan` report "No changes". Values that a platform adds on its own belong in the code. Otherwise you learn to skim over plans with changes.

An operation is idempotent if running it a second time changes nothing. `tofu apply` without a change in the code is idempotent, the commands above are not. Idempotence is what lets you run the same code as often as you like, in the lab, in the exam and after an outage.

::::exercise[Click path versus code]
Take your commands from chapters 2.3 and 2.4. In a table, write down for each step what happens when you run it a second time and how a declarative description would express the same step.

:::solution
`onevnet create` and `onetemplate create` fail the second time because the name is taken. `onetemplate instantiate` creates another VM, since OpenNebula allows duplicate VM names. Declaratively, each step would be a block with the desired result, such as a network `cc-net` with an address range, a template `ubuntu` and exactly one VM `web-1`. A second run would find everything in place and do nothing.
:::
::::

::::exercise[Lost state]
A colleague deletes `terraform.tfstate` by accident. The VMs keep running. What does the next `tofu plan` show, and what would a `tofu apply` lead to?

:::solution
Without state, OpenTofu knows no objects and plans to create all VMs again. An apply would start two more VMs with the same fixed addresses, which are already in use, so it would fail or cause conflicts on the network. The right fix is to map the existing VMs back to the code with `tofu import` or to restore the state from a backup. That is why the state needs a backup but stays out of Git.
:::
::::
