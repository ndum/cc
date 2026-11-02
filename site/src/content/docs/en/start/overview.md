---
title: Course overview
description: How the course works, the case of Wolkenwerk Bern, the four milestones with their two hand-ins and the rules for AI tools.
sidebar:
  order: 1
---

:::assignment
Simone Wyss writes to you on your first day. "Welcome to Wolkenwerk Bern. The three servers are in the rack, nothing is connected yet. Our members are waiting for a cloud they can trust with their data. From today on, you are our platform team."
:::

:::goals
After this chapter you can:

- Describe what you build and learn in this module
- Explain how the course is organized and how you learn with it
- Name the members of Wolkenwerk Bern and what they need
- Describe how the base and the advanced tasks of the four milestones make up your grade
- Use AI tools the way the course rules require
:::

## The module at a glance

In this module you build a small cloud in your own lab and run it the way a platform team would. You start with three empty Ubuntu servers. By the end they run the apps of five members, with monitoring, backups and a price for every member. The theory of cloud computing sits in the chapter where your lab needs it.

| Part | What you do | Result |
|---|---|---|
| 0 Getting started | You meet the case, generate your personal parameters and prepare the three servers and your tools from the client. | prepared servers and a hand-in repo |
| 1 Cloud basics | You learn the characteristics of a cloud, the service and deployment models, the rules on data protection and sovereignty, and virtualization with KVM. | protection needs of the members and verified virtualization on the nodes |
| 2 Building IaaS | You install OpenNebula with Ansible, bring the nodes into service as hosts, set up networks, images and templates, and start your first VMs. | a running IaaS cloud |
| 3 Tenants and self-service | You split the cloud into groups with quotas, charge usage back with showback, give the members self-service and let a service grow with OneFlow. | four members with their own resources, milestone 1 |
| 4 Platform as code | You create a Kubernetes cluster with OpenTofu, roll out the web shop from Git with Argo CD and give the members namespaces from a template. | a platform you can rebuild from code, milestone 2 |
| 5 Observability, scaling and AI | You monitor everything with Prometheus, Grafana and Loki, set an SLO, let the web shop scale on its own and run a local language model that sorts alerts. | a monitored platform, milestone 3 with the local language model in the advanced tasks |
| 6 Operations | You harden the platform, back it up and restore it, write an SLA, work out the cost and put a fifth member of your own design into service. | a cloud ready for operation, milestone 4 |

Each part adds a layer of the [target architecture](#the-target-architecture). The milestones close parts 3, 4, 5 and 6, and your grade comes from them.

## Learning in this course

The course is built for self-study. Class time starts with a short input, and most of the time you work in your own lab. Whatever you do not finish in class, you continue at home. Your instructor decides how class time and self-study are split.

Every chapter starts with an assignment from Simone Wyss. The learning goals follow, then the explanation with figures and commands, and at the end tasks in your lab. Many chapters have a check script that tells you whether your lab is in the expected state. Every part ends with a page that lists its competences.

## The case

Wolkenwerk Bern is a young cooperative. Small organizations in the region founded it because they want a cloud whose data stays in Switzerland and under their own control, at a price a small organization can afford. The cooperative and all people in it are fictional.

The first four members need different things. Praxis Rosenweg, a medical practice, keeps patient data and is bound by professional secrecy. Treuhand Aaregg, a fiduciary office, has far more work at the end of each month and during tax season. Veloatelier Matte, a bike shop, sells through a web shop that gets overrun on spring Saturdays. Gemeinde Hinterbüel, a small municipality, needs reliable counter services on a fixed budget. In part 6 a fifth member joins, and you design it yourself.

## The target architecture

By the end of the course you run a cloud in four layers. At the bottom are your three servers on smartlearn. On them OpenNebula provides the infrastructure, with tenants, quotas and an internal network for your members' VMs. With OpenTofu you create two VMs in it that run the Kubernetes cluster k3s. That cluster carries the services of the platform. Argo CD deploys the members' apps from a Git repo, Prometheus and Loki watch everything, and Ollama offers a local language model that suggests a cause and an action when an alert fires. At the top, the members use this cloud. The figure leaves out the client because it is not part of the cloud. You work on every layer from it.

![The target architecture of the course. Four layers on top of each other. The infrastructure is the front-end and two nodes with Ubuntu on smartlearn, set up with prepare.sh. On it OpenNebula provides the IaaS with oned, Sunstone, tenants and networks, installed with Ansible and OneDeploy, and the VMs run with KVM on the nodes. Above that runs the platform k3s, created by OpenTofu, with Argo CD, the web shop, Ollama, the AI triage, Prometheus, Grafana and Loki, and Argo CD pulls the apps from a Git repo. At the top the members of Wolkenwerk Bern use the cloud. Every layer names the parts of the course that build it.](../../../../assets/figures/en/p0c1-architecture.svg)

Every part of the course builds a layer or extends one. The header line of each layer names the parts that build it and, on the right, the tool that creates it. The preparation script sets up the servers, Ansible with OneDeploy the IaaS, OpenTofu the VMs of k3s, and Argo CD pulls the apps from a Git repo.

## Assessment

Your grade comes from four milestones. You hand in milestones 1 and 2 together and get your first grade for them. Milestones 3 and 4 make up the second grade. Both grades count the same. Your instructor announces the dates. [Assessment](../../assessment/) has the details.

Every milestone is individual work in two parts. You prove the base with documentation with screenshots and the check report in your hand-in repo. A complete base gives you a 4.5. You show the advanced tasks live in class or in a screencast of at most ten minutes, and they take you up to a 6. Your environment carries your [personal parameters](../parameters/) such as host names and networks. Every lab therefore looks a little different, and a copied solution stands out.

## AI tools

You may use AI assistants to write code, configuration and scripts. Two rules apply. First, the documentation of every milestone states what you used an AI assistant for. Second, you must be able to explain everything you hand in. Your instructor asks questions during the showing, and a solution you cannot explain does not count as yours.

From part 5 on, the course itself runs a local language model on your platform. There you put a small model to work in operations and check where its suggestions hold and where they do not.

::::exercise[Warm-up]
Read the description of the four members again. For each member, write one sentence on what it needs most from a cloud.

:::solution
Praxis Rosenweg needs strict separation from the other members and data that never leaves Switzerland. Treuhand Aaregg needs computing power that grows at the end of the month and shrinks again afterwards. Veloatelier Matte needs a web shop that scales on its own under load. Gemeinde Hinterbüel needs reliable services and a bill that fits its budget.
:::
::::
