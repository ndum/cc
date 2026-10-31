---
title: Course overview
description: How the course works, the case of Wolkenwerk Bern, the four implementation proofs with their two hand-ins and the rules for AI tools.
sidebar:
  order: 1
---

:::assignment
Simone Wyss writes to you on your first day. "Welcome to Wolkenwerk Bern. The three servers are in the rack, nothing is connected yet. Our members are waiting for a cloud they can trust with their data. From today on, you are our platform team."
:::

:::goals
After this chapter you can

- explain how the course is organized and how you learn with it,
- name the members of Wolkenwerk Bern and what they need,
- describe how the four implementation proofs and the two hand-ins make up your grade,
- use AI tools the way the course rules require.
:::

## Learning in this course

The course is built for self-study. Class time starts with a short input, and most of the time you work in your own lab. Whatever you do not finish in class, you continue at home. A few lessons of self-study come on top, mostly for the theory in part 1 and part 6.

Every chapter starts with an assignment from Simone Wyss. The learning goals follow, then the explanation with figures and commands, and at the end tasks in your lab. Many chapters have a check script that tells you whether your lab is in the expected state. Every part ends with a page that lists its competences.

The course has seven parts:

1. Part 0 Getting started with the lab and the tools
2. Part 1 Cloud basics
3. Part 2 Building IaaS with OpenNebula
4. Part 3 Tenants and self-service
5. Part 4 Platform as code with OpenTofu, Kubernetes and GitOps
6. Part 5 Observability, scaling and AI
7. Part 6 Operations with security, backup, SLAs and cost

## The case

Wolkenwerk Bern is a young cooperative. Small organizations in the region founded it because they want a cloud whose data stays in Switzerland and under their own control, at a price a small organization can afford. The cooperative and all people in it are fictional.

The first four members need different things. Praxis Rosenweg, a medical practice, keeps patient data and is bound by professional secrecy. Treuhand Aaregg, a fiduciary office, has far more work at the end of each month and during tax season. Veloatelier Matte, a bike shop, sells through a web shop that gets overrun on spring Saturdays. Gemeinde Hinterbüel, a small municipality, needs reliable counter services on a fixed budget. In part 6 a fifth member joins, and you design it yourself.

## The target architecture

By the end of the course you run a cloud in four layers. At the bottom are your three lab VMs on SmartLearn or Hyper-V. On them OpenNebula provides the infrastructure, with tenants, quotas and an internal network for your members' VMs. With OpenTofu you create two VMs in it that run the Kubernetes cluster k3s. That cluster carries the services of the platform. Argo CD deploys the members' apps from a Git repo, Prometheus and Loki watch everything, and Ollama offers a local language model that suggests a cause and an action when an alert fires. At the top, the members use this cloud.

![The target architecture of the course. Four layers on top of each other with a column for automation next to them. The infrastructure is the front-end and two nodes with Ubuntu on SmartLearn or Hyper-V. On it, OpenNebula provides the IaaS with oned, Sunstone, tenants and networks, and the VMs run with KVM on the nodes. Above that runs the platform k3s with Argo CD, the apps of the members, Prometheus, Loki, Ollama, Grafana with Alertmanager and the AI triage. At the top, the members of Wolkenwerk Bern use the cloud. Ansible with OneDeploy builds the IaaS, OpenTofu creates the VMs of k3s, and Argo CD pulls the apps from the Git repo. On the left, each layer shows the part of the course that builds it.](../../../../assets/figures/en/p0c1-architecture.svg)

Every part of the course builds a layer or extends one, and the figure names the parts on the left of each layer. On the right you see which tool builds a layer automatically. The preparation script sets up the lab VMs, Ansible with OneDeploy the IaaS, OpenTofu the VMs of k3s, and Argo CD pulls the apps from the Git repo.

## Assessment

Your grade comes from four implementation proofs. You hand in UN1 and UN2 together at the end of block 4 and get your first grade for them. UN3 and UN4 follow at the end of block 6 and make up the second grade. Both grades count the same. Block 7 is reserved for the mock exam and its discussion. [Assessment](../../assessment/) has the details.

Every proof is individual work. You show it either in a screencast of at most ten minutes or live in class, and you hand in your repo with it. Your environment carries your personal values such as host names and networks, which you generate in [chapter 0.2](../lab/). Every lab therefore looks a little different, and a copied solution stands out.

## AI tools

You may use AI assistants to write code, configuration and scripts. Two rules apply. First, the README of every proof states what you used an AI assistant for. Second, you must be able to explain everything you hand in. Your teacher asks questions during the showing, and a solution you cannot explain does not count as yours.

From part 5 on, the course itself runs a local language model on your platform. There you learn what a small model can do in operations and where it gets things wrong.

::::exercise[Warm-up]
Read the description of the four members again. For each member, write one sentence on what it needs most from a cloud.

:::solution
Praxis Rosenweg needs strict separation from the other members and data that never leaves Switzerland. Treuhand Aaregg needs computing power that grows at the end of the month and shrinks again afterwards. Veloatelier Matte needs a web shop that scales on its own under load. Gemeinde Hinterbüel needs reliable services and a bill that fits its budget.
:::
::::
