---
title: Competence grid for part 5
description: What you can do after part 5 and how to check it yourself.
sidebar:
  label: Competence grid
  order: 7
---

Use this grid to judge whether you can observe your platform, scale it and support it with a local model. Read each row and solve the task next to it without looking anything up. If it comes easily, you have reached the goal. If not, the link in the last column takes you to the right place. Within the Swiss framework curriculum, part 5 mainly serves the competences B14.2 (monitoring in operations), B13.5 (service levels) and B4.2 (applying current technologies).

| I can … | Task | Look up |
|---|---|---|
| name the four golden signals | Match each signal with a metric of the web shop. | [Metrics with Prometheus](../metrics/#the-purpose-of-monitoring) |
| add targets to Prometheus | Show how the OpenNebula exporters and the web shop become targets. | [Metrics with Prometheus](../metrics/#opennebula-as-a-target) |
| write PromQL queries | Write a query for requests per second by status code. | [Metrics with Prometheus](../metrics/#promql) |
| search logs with LogQL | Find the error lines of the web shop and count them per pod. | [Logs with Loki](../logs/#logql) |
| explain SLI, SLO and error budget | Calculate a Saturday's error budget for the web shop SLO. | [Alerts and SLOs](../slo/#sli-slo-and-sla) |
| justify a burn rate alert | Explain why the alert needs two time windows. | [Alerts and SLOs](../slo/#burn-rate) |
| set up and limit autoscaling | Check whether `maxReplicas` with a pod's limit and the headroom for a rollout fits into the quota. | [Autoscaling](../autoscaling/#limits) |
| evaluate a load test | Explain why more pods did not bring more throughput in the lab. | [Autoscaling](../autoscaling/#the-bottleneck-elsewhere) |
| run and measure a local model (advanced) | Measure the tokens per second and explain what they depend on. | [A local AI service](../ai/#speed) |
| control access to the model (advanced) | Give one member access and show that another has none. | [A local AI service](../ai/#inference-as-load) |
| review a proposal of the model (advanced) | Assess a proposal of the triage service and decide with reasons. | [AI triage with approval](../triage/#in-the-lab) |
| assess the risks of a model in operations (advanced) | Name the safeguards of the triage service and what they protect against. | [AI triage with approval](../triage/#safeguards) |

With this part you complete [milestone 3](../../assessment/milestone-3/). Rows marked as advanced belong to an advanced task and are not part of the base. Part 6 is about security, backup, service levels and cost. As an advanced task there, you bring a member of your own onto the platform.
