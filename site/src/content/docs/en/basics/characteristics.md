---
title: Characteristics of a cloud
description: Cloud as an operating model rather than a place, the five characteristics according to NIST with examples from the lab, and why a small private cloud is a cloud too.
sidebar:
  order: 1
---

:::assignment
Beat Kläy, the president of the board, writes to you before the next meeting. "I ran servers for a municipality for thirty years. Please explain what is different about a cloud compared with a well-run data center. Keep it short, I want to show it to the board on one page."
:::

:::goals
After this chapter you can:

- Explain why cloud is an operating model and not a place
- Name the five characteristics of a cloud according to NIST and explain them with examples
- Check whether an offering meets these characteristics
- Argue why the private cloud of Wolkenwerk Bern is a cloud as well
:::

## Cloud as an operating model

In everyday language "cloud" sounds like a distant data center of a large provider. In the field, something else matters. A cloud is a way of providing and using IT resources. Computing power, storage and network sit in a shared pool, and whoever needs them takes them, uses them as long as needed and gives them back.

A well-run data center can have the same hardware as a cloud. The difference lies in how you get a resource. In classic operations someone files a request, the operations team orders or sets up a server, and after days or weeks it is ready. In a cloud the user provisions the resource themselves, within minutes, through a web interface or an API.

## The five characteristics according to NIST

The most widely cited definition comes from the US National Institute of Standards and Technology (NIST), published in 2011 as [Special Publication 800-145](https://csrc.nist.gov/pubs/sp/800/145/final). It names five characteristics a cloud has to meet.

| Characteristic | Meaning | In the lab |
|---|---|---|
| On-demand self-service | Users provision resources themselves, without a person at the provider having to step in. | A member starts a VM from a template in Sunstone (chapter 3.4). |
| Broad network access | Resources are reachable over the network with standard protocols, from different devices. | Web interface, OpenNebula API, SSH to the VMs |
| Resource pooling | Resources form a shared pool for several tenants, who do not need to know which hardware their VM runs on. | The scheduler spreads VMs across the nodes, and the members are tenants (chapter 3.1). |
| Rapid elasticity | Resources grow and shrink quickly with demand, partly on their own. | The web shop scales under load (chapter 5.4), and OneFlow grows services (chapter 3.5). |
| Measured service | Usage is measured and visible to both provider and users. | Showback per member (chapter 3.3), metrics in Prometheus (chapter 5.1) |

If one of the characteristics is missing, it is strictly speaking not a cloud. A virtualization platform on which only the operations team creates VMs is efficient virtualization, but not a cloud, because self-service is missing.

## Size does not matter

The definition says nothing about size and nothing about who owns the hardware. The three servers of Wolkenwerk Bern form a cloud as soon as the members provision resources themselves, several members share the pool, usage is measured and services grow with the load. These are exactly the characteristics you build step by step in the course. Part 2 creates the pool and the network access, part 3 the self-service and the measurement, parts 4 and 5 the elasticity.

::::exercise[Classifying]
Match each statement to one of the five characteristics.

1. "Treuhand Aaregg sees every month how many CPU hours it used."
2. "Praxis Rosenweg starts a new VM on a Sunday evening without calling anyone."
3. "On Saturday the web shop runs eight copies instead of two."
4. "The municipality does not know which node its VM runs on, and it does not need to."
5. "The members reach their VMs from the office and from home."

:::solution
1. Measured service
2. On-demand self-service
3. Rapid elasticity
4. Resource pooling
5. Broad network access
:::
::::

::::exercise[Briefing]
Write five sentences for Beat Kläy, one per characteristic, explaining what sets Wolkenwerk Bern apart from a classic data center.

:::solution
Members get their servers themselves and within minutes instead of through a request. They reach everything over the network with standard protocols. The three servers form a shared pool that the members share. Whoever needs more capacity gets it at short notice and gives it back afterwards. Every member sees its usage and pays accordingly.
:::
::::
