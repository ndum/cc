---
title: Service and deployment models
description: IaaS, PaaS and SaaS with shared responsibility, private, community, public and hybrid cloud, and where Wolkenwerk Bern stands among them.
sidebar:
  order: 2
---

:::assignment
"Praxis Rosenweg asks whether it has to take care of the updates of its servers itself," Simone Wyss writes. "And the municipality wants to know whether we are a public cloud. What do we tell them?"
:::

:::goals
After this chapter you can:

- Tell the service models IaaS, PaaS and SaaS apart
- Say who is responsible for what in each service model
- Explain the deployment models private, community, public and hybrid cloud
- Place Wolkenwerk Bern and its services in these models
:::

## Service models

The service models describe which part of the stack, from the hardware up to the application, the provider delivers and which part the users run themselves. NIST distinguishes three models.

| Model | The provider delivers | The users run | Example at Wolkenwerk Bern |
|---|---|---|---|
| Infrastructure as a Service (IaaS) | computing power, storage, network, virtualization | operating system, runtime, application, data | VMs from OpenNebula for the members |
| Platform as a Service (PaaS) | additionally the operating system, runtime and tools | application and data | the Kubernetes platform to which the bike shop deploys its web shop |
| Software as a Service (SaaS) | the finished application | only their data and settings | the local language model as a service with an API |

With every step the provider takes on more work, and the users give up more control. The practice can set up a VM from IaaS any way it likes, but it has to take care of operating system updates itself. On a PaaS the platform team handles these updates, and in return it decides which runtimes and versions are available.

## Shared responsibility

The figure shows the layers of an IT service and who runs them in each model. This split is called the shared responsibility model. Data and the access to it stay with the users in every model. Even when an application comes as SaaS, the users decide who sees which data in it.

![Shared responsibility in the service models. Four columns for running it yourself, IaaS, PaaS and SaaS show nine layers from network and hardware up to data and access. Running it yourself, the users operate every layer. With IaaS the provider takes over network, storage, servers and virtualization, with PaaS also the operating system, middleware and runtime, with SaaS the application as well. Data and access always stay with the users.](../../../../assets/figures/en/p1c2-responsibility.svg)

## Deployment models

The deployment models describe who may use a cloud and who owns it.

| Model | Who uses it | Typical setting |
|---|---|---|
| Private cloud | a single organization | own hardware in its own data center or at a service provider |
| Community cloud | several organizations with shared requirements | a group of hospitals, municipalities or universities |
| Public cloud | the public, all customers of a provider | large providers with data centers on several continents |
| Hybrid cloud | one organization combining two or more of these models | an own private cloud that adds resources from a public cloud at peak times |

Wolkenwerk Bern is a community cloud. The members share one infrastructure because they have similar requirements. They want their data in Switzerland and under their own control, and none of them could run such a cloud alone. Technically a community cloud looks like a private cloud. The difference is that several organizations use it and govern it together.

## Public clouds

Public clouds offer hundreds of services worldwide, available at once and billed by usage. For many organizations they are the easiest way into the cloud. This course deliberately does not rebuild a public cloud. You get to know the services underneath by running them yourself. Once you have built a cloud of your own, you can better judge what the offerings of the large providers can do and where their limits are.

::::exercise[Responsibility]
Praxis Rosenweg gets a VM from OpenNebula from Wolkenwerk Bern and runs its practice software on it. Who is responsible for each of the following, the practice or the platform team?

1. Security updates for Ubuntu inside the VM
2. A faulty memory module in a node
3. Who sees which patient data in the practice software
4. The backup of the VM images
5. The firewall rules inside the VM

:::solution
1. The practice, with IaaS the operating system in the VM belongs to the users
2. The platform team, the provider delivers the hardware
3. The practice, data and access always stay with the users
4. A matter of agreement, the platform team usually offers backups of the images as a service. Without an agreement the practice is responsible for its own data
5. The practice, the platform team only handles the network outside the VM
:::
::::

::::exercise[Classifying]
Gemeinde Hinterbüel asks whether Wolkenwerk Bern is a public cloud. Answer in three sentences and name the right deployment model with a reason.

:::solution
No, the cloud of Wolkenwerk Bern is open only to the members of the cooperative. Since several organizations with shared requirements use and support it together, it is a community cloud. Technically it works like a private cloud.
:::
::::
