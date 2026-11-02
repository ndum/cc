---
title: Milestone 3 · Observability, scaling and AI
description: The assignment of the third milestone with the seven base requirements, the three advanced tasks with the local language model, the showing, the content of the hand-in and the rubric.
---

:::assignment
"Before the season the board wants to see three things," Simone Wyss writes. "That you notice when the web shop suffers before customers do. That it grows with the load on Saturdays. And how good our own language model really is in operations."
:::

Milestone 3 covers part 5. In the base you monitor the platform and the web shop, set an SLO with an alert and let the shop grow under load. In the advanced tasks you run a local language model, use it in triage with approval and improve the questions you ask it. Milestone 3 is individual work and belongs with milestone 4 to hand-in 2.

## Base

Everything runs in your own lab with your personal parameters from chapter 0.3. The base has seven requirements.

1. The charts kube-prometheus-stack, Loki and Alloy come from your platform repo through Argo CD, and the Grafana password is not in Git.
2. The OpenNebula exporters are installed, and every target in Prometheus is `up`.
3. The course dashboard runs, and you designed at least one panel in it yourself.
4. You find the fault of a deployment with LogQL in Loki.
5. The web shop SLO is stored as a rule with the target from your [personal values](../../start/parameters/), and you fire the alert through Git and end it again.
6. The web shop grows under load with the HPA up to your personal maximum and shrinks again, and you show the load test in the dashboard.
7. A drawing of your own shows the path of a metric from the exporter to the dashboard and the path of an alert, and the check `m3` is green.

The documentation has a screenshot for each requirement with one or two sentences about it, plus the report of the check `m3` and your drawing. Depending on the traffic of the last hour, the burn rate alert takes ten minutes or more. The HPA only shrinks after five minutes. Leave time for these waits when you take the screenshots.

## Advanced tasks

The three advanced tasks are about the local language model. Plan four to six hours. Each task is worth 0 to 3 points by the [levels of the advanced tasks](../#levels-of-the-advanced-tasks).

### A · A local language model

Ollama runs with `llama3.2:3b` on your platform. You measure the tokens per second and explain what they depend on. One member has access to the model, another does not. [Chapter 5.5](../../observability/ai/) shows the way.

### B · Triage with approval

The triage service receives alerts and proposes a cause and an action. You approve one proposal and reject another, and the audit log shows both decisions. In the documentation you assess both proposals critically and record what was right and what was wrong in them. [Chapter 5.6](../../observability/triage/) shows the service and its safeguards.

### C · Better questions to the model

With `EXTRA_INSTRUCTIONS` you extend the question the triage service asks the model. You compare the proposals for the same alert before and after and record the measured result, for example the duration and whether the proposed action fits the fault. [Chapter 5.6](../../observability/triage/) describes the question to the model.

## Showing the advanced tasks

You show the advanced tasks live in class or in a screencast of at most ten minutes. For a live showing you book a slot with your instructor yourself. It must take place by hand-in 2. The screencast starts with `cat /etc/cc-lab.env` and the report of the check `m3` with its hash and your two questions, which you answer during the showing. The burn rate alert takes ten minutes or more to fire. Trigger it for the triage before the showing and show its history in Prometheus.

## Hand-in

The folder `m3/` of your hand-in repo holds the documentation with the screenshots and the drawing, and `platform/`, a copy of your repo `platform` from Gitea without the `.git` folder, without state and without passwords. Task B adds `audit.jsonl`, the audit log of the triage service, and the showing adds the screencast or a link to it.

You put the reports of the checks in `reports/`. The [overview](../) describes how the repo is structured and how you set a tag.

## Rubric

| Base requirement | Points |
|---|---|
| Stack from Git, Grafana password not in Git | 3 |
| Exporters installed, all targets `up` | 3 |
| Course dashboard with a panel of your own | 3 |
| Troubleshooting with LogQL | 3 |
| SLO with your personal target, alert fired through Git and ended | 3 |
| HPA with your personal maximum, load test in the dashboard | 3 |
| Drawing with the paths of metric and alert, check `m3` | 3 |
| **Base** | **21** |

| Advanced task | Points |
|---|---|
| A · Local language model measured, access controlled | 3 |
| B · Triage with an approval and a rejection, critically assessed | 3 |
| C · Better questions with a measured comparison | 3 |
| **Advanced** | **9** |

Milestone 3 is worth up to 30 points in total. A base requirement gets 3 points when the report and a screenshot prove it, and 1 point when it is only partly met. If you leave one of the two questions unanswered or answer it wrongly, the advanced task it belongs to gets at most 1 point.
