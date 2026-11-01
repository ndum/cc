---
title: UN3 Observability, scaling and AI
description: The assignment of the third implementation proof with the required functions, the course of the screencast, the content of the hand-in and the rubric.
---

:::assignment
"Before the season the board wants to see three things," Simone Wyss writes. "That you notice when the web shop suffers before customers do. That it grows along on Saturdays. And how good our own language model really is in operations."
:::

UN3 covers part 5. You monitor the platform and the web shop, set an SLO with an alert, let the shop grow under load, run a local model and use it in triage with approval. UN3 is individual work and belongs with UN4 to hand-in 2 at the end of block 6.

## Required functions

Everything runs in your own lab with your personal parameters from chapter 0.3.

1. kube-prometheus-stack, Loki and Alloy come through Argo CD from your platform repo, and the Grafana password is not in Git.
2. Prometheus scrapes the OpenNebula exporters on the front-end and the nodes and the web shop, and all targets are `up`.
3. A dashboard shows OpenNebula, the four golden signals of the web shop and the members against their quota. You designed at least one panel yourself.
4. You find the error of a deployment with LogQL in Loki.
5. The web shop SLO is stored as a rule, and you fire the alert through Git and end it again.
6. The web shop grows under load with the HPA and shrinks again, and you show the load test in the dashboard.
7. Ollama runs with a model, you measured the tokens per second, and one member has access while another does not.
8. The triage service receives an alert, you review the proposal and decide, the audit log shows your decision, and the check `observability` is green.

## Explanations and decisions

In the README of UN3 and in the screencast you explain

- the path of a metric from the exporter to the dashboard and the path of an alert to the triage service, with a drawing of your own,
- your SLO, its error budget and why the alert has two time windows,
- how you tuned the HPA, limits and quota and where the bottleneck was in the load test,
- the measured speed of the model and what it depends on,
- the quality of the proposals with at least two examples, with what was right, what was wrong and how you decided,
- the safeguards of the triage service and whether you would let an action run on its own.

If you deviate from the course values, for example for the SLO, the HPA or the model, you justify it. Decisions of your own earn more points than values taken over.

## Screencast

The screencast lasts at most ten minutes in a single take. A suggestion for its course.

| Minutes | What you show |
|---|---|
| 0 to 1 | `/etc/cc-lab.env`, the report of the check `observability` with its hash and your drawing |
| 1 to 3 | targets in Prometheus, your dashboard, a PromQL query |
| 3 to 4 | troubleshooting with LogQL |
| 4 to 6 | load test with the HPA in the dashboard, how you tuned limits and quota |
| 6 to 8 | SLO, alert, proposal of the triage service, your decision, audit log |
| 8 to 9 | measurement of the model, access of the members |
| 9 to 10 | two or three decisions of your own |

Depending on the traffic of the last hour, the burn rate alert takes ten minutes or more. Fire it before recording and show its course in Prometheus in the screencast. If you show UN3 live in class, the same course applies.

## Hand-in

The folder `un3/` of your hand-in repo holds

- `README.md` with drawing, explanations, decisions, the assessment of the proposals and your use of AI,
- `platform/`, a copy of your repo `platform` from Gitea without the folder `.git`, without state and without passwords,
- `audit.jsonl`, the audit log of the triage service,
- the screencast or a link to it.

You put the reports of the checks in `reports/`. How the repo is structured and how you set a tag is described in the [overview](../).

## Rubric

| Criterion | Points |
|---|---|
| Stack from Git, OpenNebula and web shop targets `up` | 3 |
| Dashboard with a panel of your own, troubleshooting with LogQL | 3 |
| SLO with an alert, fired and ended | 3 |
| Web shop grows and shrinks under load | 3 |
| Model measured, members' access controlled | 2 |
| Triage with decision and audit log, check `observability` | 4 |
| **Functions** | **18** |
| Drawing with the paths of metric and alert | 3 |
| SLO, error budget and burn rate justified | 3 |
| HPA, limits, quota and bottleneck justified | 3 |
| Quality of the model and safeguards critically assessed | 3 |
| **Explanations and decisions** | **12** |
| **Total** | **30** |

The functions make up 60 % of the points, the explanations and decisions 40 %. Your teacher calculates the grade of hand-in 2 from the points of UN3 and UN4 according to the school's rules.
