---
title: Course overview
description: How the course works, the case of Wolkenwerk Bern, the four milestones with their two hand-ins, the exam and the rules for AI tools.
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
- Describe how the four milestones, with their base and advanced tasks, and the exam make up your grade
- Use AI tools the way the course rules require
:::

## The module at a glance

In this module you build a small cloud in your own lab and run it the way a platform team would. You start with three empty Ubuntu servers. By the end they run the members' apps, with monitoring, backups and a price for every member. The theory of cloud computing sits in the chapter where your lab needs it.

| Part | What you do | Result |
|---|---|---|
| 0 Getting started | You meet the case, generate your personal parameters and prepare the three servers and your tools from the client. | prepared servers and a hand-in repo |
| 1 Cloud basics | You learn the characteristics of a cloud, the service and deployment models, the rules on data protection and sovereignty, and virtualization with KVM. | protection needs of the members and verified virtualization on the nodes |
| 2 Building IaaS | You install OpenNebula with Ansible, bring the nodes into service as hosts, set up networks, images and templates, and start your first VMs. | a running IaaS cloud |
| 3 Tenants and self-service | You split the cloud into groups with quotas, make usage visible with showback and give the members self-service. In the advanced tasks you let a service grow with OneFlow. | four members with their own resources, milestone 1 |
| 4 Platform as code | You create a Kubernetes cluster with OpenTofu, roll out the web shop from Git with Argo CD and give the members namespaces from a template. | a platform you can rebuild from code, milestone 2 |
| 5 Observability, scaling and AI | You monitor everything with Prometheus, Grafana and Loki, set an SLO and let the web shop scale on its own. In the advanced tasks you run a local language model that sorts alerts. | a monitored platform, milestone 3 with the local language model in the advanced tasks |
| 6 Operations | You harden the platform, back it up and restore it, write an SLA and work out the cost. In the advanced tasks you put a fifth member of your own design into service. | a cloud ready for operation, milestone 4 |

Each part adds a layer of the [target architecture](#the-target-architecture). The milestones close parts 3, 4, 5 and 6. They make up grade 1, which together with the exam gives your module grade.

## Learning in this course

The course is built for self-study. Class time starts with a short input, and most of the time you work in your own lab. Whatever you do not finish in class, you continue at home. Your instructor decides how class time and self-study are split.

Every chapter starts with an assignment from the cooperative, usually from Simone Wyss. The learning goals follow, then the explanation with figures and commands, and at the end tasks in your lab. Many chapters have a check script that tells you whether your lab is in the expected state. Every part ends with a page that lists its competences.

## The case

Wolkenwerk Bern is a young cooperative. Small organizations in the region founded it because they want a cloud whose data stays in Switzerland and under their own control, at a price a small organization can afford. Most assignments come from Simone Wyss, the managing director. Beat Kläy, the president of the board, brings in the board's questions. The cooperative and all people in it are fictional.

The first four members need different things. Praxis Rosenweg, a medical practice, keeps patient data and is bound by professional secrecy. Treuhand Aaregg, a fiduciary office, has far more work at the end of each month and during tax season. Veloatelier Matte, a bike shop, sells through a web shop that gets overrun on spring Saturdays. Gemeinde Hinterbüel, a small municipality, needs reliable counter services on a fixed budget. In the advanced tasks of part 6 a fifth member joins, and you design it yourself.

## The target architecture

By the end of the course you run a cloud in four layers. At the bottom are your three servers on smartlearn. On them OpenNebula provides the infrastructure, with tenants, quotas and an internal network for your members' VMs. With OpenTofu you create two VMs in it that run the Kubernetes cluster k3s. That cluster carries the services of the platform. Argo CD deploys the members' apps from a Git repo, and Prometheus and Loki watch everything. The advanced tasks add a local language model that suggests a cause and an action when an alert fires. At the top, the members use this cloud. The figure leaves out the client because it is not part of the cloud. You work on every layer from it.

![The target architecture of the course. Four layers on top of each other. The infrastructure is the front-end and two nodes with Ubuntu on smartlearn or a hypervisor of your own, set up with prepare.sh. On it OpenNebula provides the IaaS with oned, Sunstone, tenants and networks, installed with Ansible and OneDeploy, and the VMs run with KVM on the nodes. Above that runs the platform k3s, created by OpenTofu, with Argo CD, Prometheus, Grafana, Loki, the web shop, Ollama and the AI triage, and Argo CD pulls the apps from a Git repo. Ollama and the AI triage are marked as advanced because you build them in the advanced tasks of part 5. At the top the members of Wolkenwerk Bern use the cloud, and you design the fifth member in an advanced task of milestone 4. Every layer names the parts of the course that build it.](../../../../assets/figures/en/p0c1-architecture.svg)

Every part of the course builds a layer or extends one. The header line of each layer names the parts that build it and, on the right, the tool that creates it. The preparation script sets up the servers, Ansible with OneDeploy the IaaS, OpenTofu the VMs of k3s, and Argo CD pulls the apps from a Git repo.

## Assessment

Your module grade is made up of two grades. Grade 1 comes from the four milestones and counts 60%. You hand in milestones 1 and 2 together, and milestones 3 and 4 as well, and grade 1 is the average of the grades of these two hand-ins. Grade 2 comes from an individual open-book exam of 60 minutes towards the end of the module and counts 40%. Your instructor announces the dates. [Assessment](../../assessment/) has the details.

Every milestone has two parts. You prove the base with the check report and screenshots in your hand-in repo. A complete base takes grade 1 to a 4.5. You document the advanced tasks and show them live in class or in a screencast of at most ten minutes, and they take you up to a 6. You may work in a team, but you build your lab yourself and hand in on your own. Your environment carries your [personal parameters](../parameters/) such as host names and networks. Every lab therefore looks a little different, and a copied solution stands out.

## AI tools

You may use AI assistants to write code, configuration and scripts. Two rules apply. First, the documentation of your advanced tasks states what you used an AI assistant for. Second, you must be able to explain everything you hand in. In a live showing your instructor asks questions, in a screencast you answer the two questions from the check, and a solution you cannot explain does not count as yours.

In the exam you may ask AI assistants. AI agents are not allowed there, that is programs that run commands, change files or reach your lab on their own.

In the advanced tasks of part 5 you run a local language model on your platform. There you put a small model to work in operations and check where its suggestions hold and where they do not.

::::exercise[Warm-up]
Read the description of the four members again. For each member, write one sentence on what it needs most from a cloud.

:::solution
Praxis Rosenweg needs strict separation from the other members and data that never leaves Switzerland. Treuhand Aaregg needs computing power that grows at the end of the month and shrinks again afterwards. Veloatelier Matte needs a web shop that scales on its own under load. Gemeinde Hinterbüel needs reliable services and a bill that fits its budget.
:::
::::
