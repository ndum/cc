---
title: Cost and resource efficiency
description: A full cost calculation for Wolkenwerk with hardware, power and labor, a price for a new member, right-sizing with Prometheus and idle resources.
sidebar:
  order: 4
---

:::assignment
"What does running the platform really cost us, and what do we charge the new member?" asks Beat Kläy. "The showback prices were a start. I'd like to see a calculation that includes everything, and to know whether we are wasting resources."
:::

:::goals
After this chapter you can

- calculate the full cost of a small cloud from hardware, power and labor,
- derive and justify a price for a member,
- compare reserved and used resources with Prometheus,
- adjust requests and limits based on measurements,
- find idle resources and estimate their cost.
:::

## Full cost

Chapter 3.3 put hourly prices for CPU, memory and disk into the template. With them, a VM with half a CPU and 1 GB cost around 35 francs a month. The prices were invented for the case. Only a calculation that includes all costs shows whether they cover them. The exercise in chapter 3.3 used simplified numbers, without the front-end and with little labor. Here every item is included, so the total comes out much higher.

| Item | Assumption | per year |
|---|---|---|
| Hardware | two nodes for 7,000 and a front-end for 2,000 francs, five years | 1,800 francs |
| Power | 300 watts on average, 2,628 kWh at 31.5 centimes | 828 francs |
| Labor | 10 % of a full-time position at 130,000 francs including social charges | 13,000 francs |
| Other | internet, rack space, offsite copy of the backups | 1,500 francs |
| **Total** | | **17,128 francs** |

Except for the electricity price, the numbers are assumptions for the case. The electricity price is the 2026 tariff of Energie Wasser Bern for a small business in profile C2, from [ElCom's open data](https://energy.ld.admin.ch/elcom/electricityprice/observation/351-519-C2-standard-2026). The Swiss median for the same profile is 25.1 centimes.

Labor makes up three quarters of the cost, power less than 5 %. That is typical for small platforms. Whoever wants to save here saves working time, through automation with OpenTofu and GitOps, through self-service and through a few well-documented procedures.

## A price for the new member

The simplest split follows the reserved resources. Together the nodes have 8 CPUs and 14.4 GB that OpenNebula can allocate. A new member with a namespace with 1 CPU and 1 GB in its quota and a VM with half a CPU and 1 GB reserves 1.5 of 8 CPUs, or 18.8 %, and 2 of 14.4 GB, or 13.9 %. On average that is 16.3 % of the cost.

```text
17,128 × 0.163 ≈ 2,795 francs per year ≈ 233 francs per month
```

With the prices from chapter 3.3, the same member cost around 86 francs a month, 35 for the VM and 51 for the namespace, calculated with the same prices per CPU and MB. The showback prices cover only a good third. They are not wrong, though, since they show consumption, not the price. A proposal to the board could combine a base fee per member for the labor with consumption billed by showback. Whether Wolkenwerk actually charges the members or only shows them the cost is the cooperative's decision. The FinOps Foundation distinguishes showback and chargeback for this.

The calculation assumes the platform is fully booked. In fact, the k3s VMs alone take 12 of the 14.4 GB. What the members do not buy, the others carry.

## Right-sizing

A quota and a pod's requests reserve resources, even if the pod never uses them. Right-sizing means adjusting the reservation to the measured use. Prometheus knows both. The first query shows the requests per namespace, the second the 95th percentile of the actual use over the last hour.

```text
sum by (namespace) (kube_pod_container_resource_requests{resource="cpu"})

quantile_over_time(0.95,
  sum by (namespace) (rate(container_cpu_usage_seconds_total{container!=""}[5m]))[1h:1m])
```

For memory the highest value counts, because a container that exceeds its limit is killed.

```text
sum by (namespace) (kube_pod_container_resource_requests{resource="memory"}) / 2^20

sum by (namespace) (max_over_time(container_memory_working_set_bytes{container!=""}[1h])) / 2^20
```

In the lab, after a load test, the picture looked like this.

| Namespace | CPU reserved | CPU used, p95 | Memory reserved | Memory used, max |
|---|---|---|---|---|
| velo | 0.3 | 0.55 | 384 MiB | 197 MiB |
| ai | 1.02 | 0.22 | 2,112 MiB | 3,391 MiB |
| probe | 0.05 | 0 | 64 MiB | 21 MiB |

The measurement comes from the course lab. There the own member from milestone 4 is called `probe`, in your lab you see the namespace of your member instead.

The numbers say different things. For the web shop, use was above the requests because the HPA scales the pods by utilization of the requests. There the requests are a tool for scaling, not a mistake. Ollama reserved four times more CPU than it needed, but a third too little memory. With the model loaded it used 3.3 GiB against a request of 2 GiB. When memory gets tight on the node, Kubernetes first evicts pods that use more than they reserved. A better request would be about 0.5 CPU and 3.5 GiB of memory. The change belongs in `ai/ollama.yaml` and thus in a pull request.

One hour is too short for such decisions. A Saturday in spring looks different from a Tuesday in January. Grafana shows the same queries over weeks, and only then is a change worthwhile.

## Idle resources

Whatever runs and does nothing still costs. Typical are VMs that keep running after a test, old images and backups nobody needs anymore, and namespaces of finished projects. OpenNebula and Kubernetes show them.

```bash
onevm list
oneimage list
kubectl top pods -A --sort-by=cpu | tail
```

In the lab, a VM with 1 GB of memory used 253 MB when idle. The node still had to hold the whole GB and swapped around 200 MB to disk for it. A VM that is only needed during the day can be taken off the node at night with `onevm undeploy` from chapter 4.2. It then only occupies its disk.

Power also depends on utilization. An idle server draws a large part of its peak power, so two half-empty nodes use more than one full one. A small cooperative can change little about its hardware, but it can remove unused VMs and use showback to get the members to clean up their own.

## Outlook

OpenCost calculates the cost of a cluster per namespace, deployment and pod, with prices per CPU and GB, and shows unused reservations. It runs in the cluster and reads from Prometheus. For the course, the queries above and the calculation in a table are enough.

::::exercise[Cost model]
Create the cost model for your member from milestone 4. Calculate with the full cost above or with assumptions of your own, justified, and compare the result with the showback from chapter 3.3.

:::solution
The model names the member's resources from quota and VM, its share of capacity, the monthly price from the full cost and the amount from showback. It explains the difference with the labor missing in showback and proposes a way of billing, such as a base fee plus consumption. Assumptions of your own are allowed if they are justified.
:::
::::

::::exercise[Right-sizing]
Compare requests and use of the namespaces in your lab over at least one day and adjust one request through a pull request. Justify the new value.

:::solution
The queries show reservation and use per namespace. A good candidate is Ollama with too much CPU and too little memory. The new value lies a little above the measured maximum for memory and close to the 95th percentile for CPU. For the web shop the requests stay small, because the HPA calculates with them.
:::
::::

::::exercise[Cleaning up]
Look for unused VMs, images, backups and namespaces in your lab. Estimate what they cost per year by the calculation above, and clean up what nobody needs.

:::solution
`onevm list`, `oneimage list` and `kubectl get ns` show the candidates, such as VMs from tests, backup images of old VMs and templates from `oneimage restore`. A VM with half a CPU and 1 GB takes about 6 % of the CPU and 7 % of the memory, which by the full cost comes to about 1,100 francs a year. Delete only what nobody needs anymore and what does not serve as a backup.
:::
::::
