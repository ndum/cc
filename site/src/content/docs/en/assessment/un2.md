---
title: UN2 Platform as code
description: The assignment of the second implementation proof with the required functions, the course of the screencast, the content of the hand-in and the rubric.
---

:::assignment
"The board wants to see that you can rebuild the platform at any time," Simone Wyss writes. "Throw it away in front of them and build it again, with the bike shop's web shop and room for another member."
:::

UN2 covers part 4. On your cloud you build a Kubernetes cluster from code, roll out the web shop with GitOps, give the members namespaces from a template and explain your decisions. UN2 is individual work and belongs with UN1 to hand-in 1 at the end of block 4.

## Required functions

Everything runs in your own lab with your personal parameters from chapter 0.3.

1. The two cluster VMs are created by OpenTofu from your repo `platform`, `tofu plan` shows no changes afterwards, and the state is not in Git.
2. k3s runs with a server and an agent, its own ranges for pods and services and the host-gw routing, and kubectl works from the front-end.
3. Gitea runs on the front-end with the private repo `wolkenwerk/platform`, and Argo CD reads it with a read-only token.
4. Argo CD rolls out the web shop from Git, and you show self-heal and a change through Git.
5. The namespaces `velo` and `gemeinde` come from the template with ResourceQuota, LimitRange and NetworkPolicy, the municipality's by pull request.
6. Another member of your choice gets a namespace with limits of your own, justified, by pull request.
7. You show the quota at its limit and the separation of the namespaces by the NetworkPolicy.
8. You rebuild the cluster with `tofu destroy`, `tofu apply` and the Argo CD bootstrap, everything from Git is back, and the check `platform` is green.

## Explanations and decisions

In the README of UN2 and in the screencast you explain

- the architecture of your platform with a drawing of your own of OpenNebula, the cluster VMs, Gitea, Argo CD and the namespaces,
- the difference between your click path of part 2 and the code of part 4, with state, drift and idempotence,
- why the cluster needs its own address ranges, the host-gw routing and 6 GB per VM,
- why Gitea runs outside the cluster and who has which rights,
- how you set the limits of your own member and whether the sum of the quotas fits the cluster,
- what happens when the server fails and what higher availability would need.

If you deviate from the course values, for example for memory, quotas or the template, you justify it. Decisions of your own earn more points than values taken over.

## Screencast

The screencast lasts at most ten minutes in a single take. A suggestion for its course.

| Minutes | What you show |
|---|---|
| 0 to 1 | `/etc/cc-lab.env`, the report of the check `platform` with its hash and your drawing |
| 1 to 2 | start `tofu destroy` and `tofu apply`, the repo in Gitea while the cluster comes up |
| 2 to 4 | `main.tf` and the start script, address ranges and host-gw |
| 4 to 5 | the Argo CD bootstrap, the applications come back |
| 5 to 6 | the web shop in the browser, self-heal, a change through Git |
| 6 to 8 | template, pull request of your own member, quota at its limit, NetworkPolicy |
| 8 to 9 | `tofu plan` without changes, the check `platform` after the rebuild |
| 9 to 10 | two or three decisions of your own |

In the lab, the rebuild took a little under three minutes. Start it early in the recording and explain the code while it runs. If you show UN2 live in class, the same course applies.

## Hand-in

The folder `un2/` of your hand-in repo holds

- `README.md` with drawing, explanations, decisions and your use of AI,
- `platform/`, a copy of your repo `platform` from Gitea without the folder `.git`, without state and without tokens,
- the screencast or a link to it.

You put the reports of the checks in `reports/`. How the repo is structured and how you set a tag is described in the [overview](../).

## Rubric

| Criterion | Points |
|---|---|
| Cluster VMs from OpenTofu, plan without changes, state outside Git | 3 |
| k3s with its own address ranges and host-gw, kubectl from the front-end | 2 |
| Gitea with a private repo, read-only token for Argo CD | 2 |
| Web shop with Argo CD, self-heal and a change through Git | 3 |
| Namespaces from the template, the municipality's request, quota and NetworkPolicy shown | 2 |
| A member of your own with its own limits | 2 |
| Rebuild of the cluster, everything from Git back, check `platform` | 4 |
| **Functions** | **18** |
| Architecture with a drawing of your own | 3 |
| Click path and code, state, drift and idempotence explained | 3 |
| Address ranges, memory and location of Gitea justified | 3 |
| Limits of your own member, sum of the quotas and failure of the server justified | 3 |
| **Explanations and decisions** | **12** |
| **Total** | **30** |

The functions make up 60 % of the points, the explanations and decisions 40 %. Your teacher calculates the grade of hand-in 1 from the points of UN1 and UN2 according to the school's rules.
