---
title: SLA and operations concept
description: What an SLA covers, which availability the platform can honestly promise, an operations concept for a small cooperative and a postmortem drafted by the local model.
sidebar:
  order: 3
---

:::assignment
"The new organization wants an SLA before it signs," writes Simone Wyss. "What can we honestly promise? And please write down how we actually organize operations. After last Saturday, the board would also like a short report on what happened."
:::

:::goals
After this chapter you can:

- Name the parts of an SLA and draft one for a member
- Derive from the architecture which availability is realistic
- Write an operations concept for a small organization
- Write a blameless postmortem
- Check a language model's draft against the facts
:::

## SLA, SLO and SLI

Chapter 5.3 set an SLO for the web shop, 99.5 % of requests without a server error over seven days. An SLO is an internal goal of the platform team. A service level agreement (SLA) is an agreement with the member, and missing it has consequences, such as a credit. The SLA is therefore looser than the SLO. That leaves room to notice and fix a missed SLO before the SLA breaks.

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

Percentages sound alike but differ a lot. The table converts them into allowed downtime.

| Availability | per 30 days | per year |
|---|---|---|
| 99 % | 7.2 hours | 3.65 days |
| 99.5 % | 3.6 hours | 1.83 days |
| 99.9 % | 43 minutes | 8.8 hours |

What the platform can promise follows from its architecture. The lab has one front-end, one k3s server and two nodes. If the k3s server fails, the web shop is down until the VM is rebuilt. In the lab that took a good ten minutes until the web shop ran again, with the whole stack and provided someone reacts at once. If a node fails, its VMs are gone until it runs again or they are recreated on the other node. And the platform team of a small cooperative works office hours. Without an on-call service, an outage on Saturday evening gets fixed on Monday.

Honest promises are therefore along the lines of 99 % during office hours with a response time of four hours. More takes more effort, such as three k3s servers, an on-call service or a second data center, and it costs accordingly. Chapter 6.4 works out the price.

## The operations concept

An operations concept describes how operations are organized, so they do not depend on one person's memory. A few pages are enough for Wolkenwerk.

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

Instructions for a recurring incident are called a runbook. A runbook describes symptoms, first checks and measures, for example for the alert `WebshopErrorBudgetBurn`. A good runbook can be followed by someone who did not build the system.

## An alert for a new member

:::note[Advanced task]
This section belongs to the advanced task of milestone 4 with a member of your own. You do not need it for the base.
:::

Since chapter 6.1, Alertmanager sends not only the web shop's alerts to the triage service but every alert with the label `triage: "true"`. A new member therefore brings its own rules, as a `PrometheusRule` in its folder of the platform repo. The example watches the app `web` of a daycare center in the namespace `kita`.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: kita
spec:
  groups:
    - name: kita
      rules:
        - alert: KitaWebDown
          expr: kube_deployment_status_replicas_available{namespace="kita", deployment="web"} < 1
          for: 2m
          labels:
            severity: critical
            triage: "true"
          annotations:
            summary: The daycare website has no running pod
```

Name the file something like `members/kita/alerts.yaml` and list it under `resources` in the member's `kustomization.yaml`. The metric carries the labels `namespace` and `deployment`. The triage service builds its target from them, here `kita/web`, and fetches the log lines of that namespace.

You fire the alert through Git by setting `replicas: 0` in the app and pushing. In the course lab the alert came two minutes after the last pod was gone. The triage service proposed a restart, and the team rejected it, because a restart starts no pod while Git asks for zero. The fault is only fixed once `replicas: 1` is back in Git.

Since chapter 5.6 the service may only touch `velo/webshop`. For a new member the context therefore says `(deployment not readable)`, and an approval would fail with `is not in ALLOWED_TARGETS`. If you want it to read and restart the deployment, extend `ALLOWED_TARGETS` in `ai/triage.yaml` and create a `Role` with a `RoleBinding` in the member's namespace, as in `ai/triage-rbac.yaml`. Whether that makes sense is your decision, based on the member's protection needs.

## Postmortems

:::note[Advanced task]
The postmortem drafted by the local model is one of the advanced tasks of milestone 4. You do not need it for the base.
:::

After an incident, the team writes a postmortem. It records what happened, what the impact was, which causes contributed and which measures prevent a repeat. The practice comes from running large services, and Google's [book on site reliability engineering](https://sre.google/sre-book/postmortem-culture/) describes it at length. A postmortem does not look for culprits. It assumes that everyone involved acted reasonably with the information they had, and asks which systems and processes made the failure possible.

The timeline is the most important part, and it is tedious to collect. At Wolkenwerk the facts are in three places, the alerts in Prometheus, the decisions in the triage service's audit log and the changes in Git. The course script collects them and builds the timeline itself, without the model. The local model from chapter 5.5 only writes the text around it.

::code{file="case/postmortem/postmortem.py" lines="94-103"}

The question to the model asks for a blameless postmortem based only on the facts supplied. If a fact is missing, the model is to say so instead of guessing.

::code{file="case/postmortem/postmortem.py" lines="118-125"}

```bash
~/cc/case/postmortem/postmortem.py --hours 1 > ~/postmortem-entwurf.md
```

In the lab, an incident ran as in chapter 5.3. `FAIL_PERCENT` was set to 60 through Git, the alert came a few minutes after the change took effect, the triage service proposed a restart, the team rejected it and took back the change with `git revert`. The model needed 33 seconds for the draft. The timeline was correct, since it came from the data. The model's text, on the other hand, contained several errors.

- It stated about one hour of downtime, while the errors lasted around ten minutes.
- It blamed the switch to etcd for a delay of the snapshots that never happened.
- It praised that switch as a gain in stability, without any fact showing it.
- It invented owners such as "Teamleiter A" and listed measures under "what went badly".
- It took the right cause, `FAIL_PERCENT` at 60, from the triage service's proposal.

A second draft covering half an hour stated 13 minutes of impact and wrote in the next sentence that users noticed no failures, although 60 % of requests failed. A draft saves typing, but every statement has to be checked against the timeline. Passing it on unchecked spreads claims that look like a report.

::::exercise[SLA]
Draft a one-page SLA for one of the four members, for example the fiduciary office. Justify the availability with the architecture of your lab and the support hours with the means of a small cooperative. If you do the advanced task of milestone 4, write the SLA for your own member and base it on the restore time you measured in chapter 6.2.

:::solution
A good SLA names the service and its limits, an availability with period and exceptions, such as 99 % per month during office hours excluding announced maintenance, support hours with response times, RPO and RTO from chapter 6.2, the location of the data in Switzerland, the member's duties and a consequence when missed. The reasoning mentions the single k3s server and the missing on-call service. A promise above 99.9 % without more servers and on-call would not be honest.
:::
::::

::::exercise[Postmortem]
This exercise belongs to the advanced tasks of milestone 4. Trigger an incident as in chapter 5.3, decide on the triage service's proposal, fix the fault through Git and let the model write a draft. Correct it and mark every change.

:::solution
The draft holds a timeline with commit, alert, proposal, decision and revert. The correction checks every number and every cause against that timeline, removes invented people and facts and adds measures with a role as owner, such as reviewing environment variables in the pull request. The finished postmortem names no guilty person.
:::
::::

::::exercise[Operations concept]
Write Wolkenwerk's operations concept on at most two pages and add a runbook for the alert `WebshopErrorBudgetBurn`.

:::solution
The concept covers roles, operating hours, monitoring, incidents, changes, security, data backup, documentation and cost. The runbook names the symptoms, the queries in Prometheus and Loki from part 5, a look at the latest commits in Gitea and, as the measure, usually `git revert` rather than a restart.
:::
::::
