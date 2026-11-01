---
title: Competence grid for part 4
description: What you can do after part 4 and how to check it yourself.
sidebar:
  label: Competence grid
  order: 6
---

Use this grid to judge whether you can build your platform from code and explain it. Read each row and solve the task next to it without looking anything up. If it comes easily, you have reached the goal. If not, the link in the last column takes you to the right place. Within the Swiss framework curriculum, part 4 mainly serves the competences B12.3 (target configurations), B12.4 (configuration management) and B14.1 (introducing software and releases), and with the web shop it prepares part 5.

| I can … | Task | Look up |
|---|---|---|
| tell declarative and imperative descriptions apart | Explain what a second run does with `onetemplate instantiate` and with an OpenTofu block. | [Infrastructure as code](../iac/#declarative-and-imperative) |
| explain state, drift and idempotence | Explain why the state stays out of Git and what happens without it. | [Infrastructure as code](../iac/#state) |
| manage VMs with OpenTofu | Rebuild the two cluster VMs with `tofu destroy` and `tofu apply` and show a plan without changes. | [OpenTofu with OpenNebula](../opentofu/#changing-replacing-and-rebuilding) |
| justify the room the cluster needs | Work out why only one small VM fits next to the cluster on each node. | [OpenTofu with OpenNebula](../opentofu/#room-on-the-nodes) |
| set up a Kubernetes cluster from code | Explain how the start script installs k3s on server and agent. | [Kubernetes as code](../kubernetes/#the-start-script) |
| justify the address ranges and routing of the cluster | Justify the ranges `10.52.0.0/16` and `10.53.0.0/16` and the host-gw routing. | [Kubernetes as code](../kubernetes/#address-ranges) |
| explain GitOps | Name the four principles and the difference from a rollout by a pipeline. | [GitOps with Argo CD](../gitops/#gitops) |
| roll out an application with Argo CD | Change the number of web shop pods through Git and show self-heal. | [GitOps with Argo CD](../gitops/#showing-reconciliation) |
| justify where the Git server runs | Explain why Gitea runs on the front-end and not in the cluster. | [GitOps with Argo CD](../gitops/#gitea-on-the-front-end) |
| limit and separate namespaces with a template | Show the municipality's quota at its limit and the separation by the NetworkPolicy. | [Platform templates](../templates/#at-the-limit) |
| handle a request as a pull request | Add a member by pull request and explain what you look for in the review. | [Platform templates](../templates/#the-municipalitys-request) |

With this part you complete [milestone 2](../../assessment/milestone-2/). You hand in milestones 1 and 2 together as hand-in 1. In part 5 you watch the web shop, let it grow under load and run a local language model.
