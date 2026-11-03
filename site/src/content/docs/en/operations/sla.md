---
title: SLA and operations concept
description: What an SLA covers, which availability the platform can honestly promise, an operations concept for a small cooperative and blameless postmortems.
sidebar:
  order: 3
---

:::assignment
"The new organization wants an SLA before it signs," writes Simone Wyss. "What can we honestly promise? And please write down how we actually organize operations. After last Saturday, the board would also like to know how we learn from an incident without looking for someone to blame."
:::

:::goals
After this chapter you can:

- Name the parts of an SLA and draft one for a member
- Derive from the architecture which availability is realistic
- Write an operations concept for a small organization
- Explain the purpose and structure of a blameless postmortem
:::

## SLA, SLO and SLI

Chapter 5.3 set an SLO for the web shop, 99.5% of requests without a server error over seven days. An SLO is an internal goal of the platform team. A **service level agreement** (SLA), by contrast, is an agreement with the member, and missing it has consequences, such as a credit. The SLA is therefore set looser than the SLO. A missed SLO can then be noticed and fixed before the SLA breaks.

An SLA covers more than a percentage.

| Part | Content |
|---|---|
| Service | which service, with which resources and limits |
| Availability | target, measurement, period and what does not count, such as announced maintenance |
| Support | hours, channel, response time by urgency |
| Data backup | RPO and RTO from chapter 6.2, retention of backups |
| Security and data protection | location of the data, safeguards, reporting of incidents |
| Member duties | such as secure applications, a contact person, reporting faults |
| Reporting and consequences | monthly report, credit or right to terminate when missed |

## Availability in numbers

99% and 99.9% sound alike but allow very different amounts of downtime. The table shows how much downtime each value allows.

| Availability | per 30 days | per year |
|---|---|---|
| 99% | 7.2 hours | 3.65 days |
| 99.5% | 3.6 hours | 1.83 days |
| 99.9% | 43 minutes | 8.8 hours |

What the platform can promise follows from its architecture. The lab has one front-end, one k3s server and two nodes. If the k3s server fails, the web shop is down until the VM is rebuilt. In the lab, with the whole stack, it took just under five minutes until the web shop ran again. That assumes someone reacts at once. If a node fails, its VMs are gone until it runs again or they are recreated on the other node. On top of that, the platform team of a small cooperative works office hours. Without an on-call service, an outage on Saturday evening only gets fixed on Monday.

Honest promises are therefore along the lines of 99% during office hours with a response time of four hours. More takes more effort, such as three k3s servers, an on-call service or a second data center, and it costs accordingly. Chapter 6.4 works out the price.

## The operations concept

An **operations concept** describes how operations are organized, so they do not depend on one person's memory. A few pages are enough for Wolkenwerk.

| Topic | Content at Wolkenwerk |
|---|---|
| Roles | platform team, a contact person per member, the board for exceptions |
| Operating hours | support Monday to Friday during office hours, on call only by agreement |
| Monitoring | Prometheus and Alertmanager from part 5, an SLO per service |
| Incidents | detect, assess, fix, inform, postmortem |
| Changes | only through pull requests in Gitea, maintenance window on Tuesday evening |
| Security | hardening, updates, rights from chapter 6.1 |
| Data backup | snapshots, backups and a restore drill every quarter |
| Documentation | README in the platform repo, instructions for recurring incidents |
| Cost | monthly showback from chapter 3.3, full cost from chapter 6.4 |

Instructions for a recurring incident are called a **runbook**. A runbook describes symptoms, first checks and measures, for example for the alert `WebshopErrorBudgetBurn`. A good runbook can be followed by someone who did not build the system.

The time from the start of an incident until the service runs again is the time to restore. Its mean over many incidents is the **MTTR** (mean time to restore). The figure shows the phases of an incident on a timeline.

![The timeline of an incident. An incident on a timeline in five phases. After the incident starts, Prometheus detects it and sends an alert. The team then assesses the incident with the logs in Loki and the latest commits in Git and fixes it with git revert, which Argo CD rolls out, until the service runs again. It then informs the affected members and later writes a blameless postmortem with a timeline and measures. Below the axis are the time to the alert and the time to restore. The mean of the time to restore over many incidents is the MTTR.](../../../../assets/figures/en/p6c3-incident.svg)

## Postmortems

After an incident, the team writes a **postmortem**. It records what happened, what the impact was, which causes contributed and which measures prevent a repeat. Postmortems come from the operation of large services, and Google's [book on site reliability engineering](https://sre.google/sre-book/postmortem-culture/) describes them at length. A postmortem does not look for culprits. It assumes that everyone involved acted reasonably with the information they had, and asks which systems and processes made the failure possible.

The timeline is the most important part, and it is tedious to collect. At Wolkenwerk the alerts are in Prometheus and the changes in Git. Every measure names a role as its owner rather than a person. Advanced task C in [chapter 6.5](../advanced/#a-postmortem-from-data) shows how the local model drafts a postmortem from such a timeline and where it goes wrong.

::::exercise[SLA]
Draft a one-page SLA for one of the four members, for example the fiduciary office. Justify the availability with the architecture of your lab and the support hours with the means of a small cooperative. If you do advanced task B from chapter 6.5, write the SLA for your own member and base it on the restore time you measured.

:::solution
A good SLA names the service and its limits, an availability with period and exceptions, such as 99% per month during office hours excluding announced maintenance, support hours with response times, RPO and RTO from chapter 6.2, the location of the data in Switzerland, the member's duties and a consequence when missed. The reasoning mentions the single k3s server and the missing on-call service. A promise of 99.9% without more servers and an on-call service would not be honest.
:::
::::

::::exercise[Operations concept]
Write Wolkenwerk's operations concept on at most two pages and add a runbook for the alert `WebshopErrorBudgetBurn`.

:::solution
The concept covers roles, operating hours, monitoring, incidents, changes, security, data backup, documentation and cost. The runbook names the symptoms, the queries in Prometheus and Loki from part 5, a look at the latest commits in Gitea and, as the measure, usually `git revert` rather than a restart.
:::
::::
