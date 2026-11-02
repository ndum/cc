---
title: Milestone 2 · Platform as code
description: The assignment of the second milestone with the seven base requirements, the three advanced tasks, the showing, the content of the hand-in and the rubric.
---

:::assignment
"The board wants to see that you can rebuild the platform at any time," Simone Wyss writes. "Throw it away in front of them and build it again, with the bike shop's web shop and room for another member."
:::

Milestone 2 covers part 4. In the base you build a Kubernetes cluster from code on your cloud, roll out the web shop with GitOps and give the members namespaces from a template. In the advanced tasks you rebuild the platform, add a member of your own and protect the branch `main`. Milestone 2 is individual work and belongs with milestone 1 to hand-in 1.

## Base

Everything runs in your own lab with your personal parameters from chapter 0.3. The base has seven requirements.

1. The two cluster VMs come from OpenTofu in your repo `platform`, `tofu plan` shows no changes afterwards, and the state is not in Git.
2. The k3s cluster runs with a server, an agent and host-gw routing, and kubectl works from the front-end.
3. Gitea runs on the front-end with the private repo `wolkenwerk/platform`, and Argo CD reads it with a read-only token.
4. Argo CD rolls out the web shop from Git, and you show self-heal and a change through Git.
5. The namespaces `velo` and `gemeinde` come from the template with ResourceQuota, LimitRange and NetworkPolicy.
6. The municipality's ResourceQuota uses your [personal values](../../start/parameters/) and arrives through a pull request.
7. You show the quota at its limit and the separation of the namespaces by the NetworkPolicy, and the check `m2` is green.

The documentation has a screenshot for each requirement with one or two sentences about it, plus the report of the check `m2`. For a pull request, a screenshot from Gitea with the diff and the merge is enough.

## Advanced tasks

Plan four to six hours for the three advanced tasks. Each one is worth 0 to 3 points by the [levels of the advanced tasks](../#levels-of-the-advanced-tasks).

### A · Rebuilding the platform

You rebuild the cluster with `tofu destroy`, `tofu apply` and the Argo CD bootstrap, measure the time and show that everything from Git is back. Along the way you explain the role of state and drift in a rebuild. [Chapter 4.2](../../platform/opentofu/) has the commands. With the state of part 4, the rebuild in the lab took just under three minutes until the web shop ran, so start it early in the showing and explain the code while it runs.

### B · A member of your own

One more member of your choice gets a namespace from the template through a pull request, with limits of your own that you justify. You also create an Argo CD AppProject that allows only this member's namespace. [Chapter 4.5](../../platform/templates/) shows the template, [chapter 4.4](../../platform/gitops/) Argo CD.

### C · Branch protection

In Gitea you protect the branch `main` so that changes only get in through a reviewed pull request. You show that a direct push is rejected. [Chapter 4.4](../../platform/gitops/) covers Gitea and the repo `platform`.

## Showing the advanced tasks

You show the advanced tasks live in class or in a screencast of at most ten minutes. For a live showing you book a slot with your instructor yourself. It must take place by hand-in 1. The screencast starts with `cat /etc/cc-lab.env` and the report of the check `m2` with its hash and your two questions, which you answer during the showing.

## Hand-in

The folder `m2/` of your hand-in repo holds the documentation with the screenshots and `platform/`, a copy of your repo `platform` from Gitea without the `.git` folder, without state and without tokens. The showing adds the screencast or a link to it.

You put the reports of the checks in `reports/`. The [overview](../) describes how the repo is structured and how you set a tag.

## Rubric

| Base requirement | Points |
|---|---|
| Cluster VMs from OpenTofu, plan without changes, state outside Git | 3 |
| k3s with server, agent and host-gw, kubectl from the front-end | 3 |
| Gitea with a private repo, read-only token for Argo CD | 3 |
| Web shop with Argo CD, self-heal and a change through a pull request | 3 |
| Namespaces `velo` and `gemeinde` from the template | 3 |
| The municipality's ResourceQuota with the personal values through a pull request | 3 |
| Quota at the limit and NetworkPolicy shown, check `m2` | 3 |
| **Base** | **21** |

| Advanced task | Points |
|---|---|
| A · Rebuilding the platform with the measured time | 3 |
| B · A member of your own with an AppProject | 3 |
| C · Protection of the branch `main` | 3 |
| **Advanced** | **9** |

Milestone 2 is worth up to 30 points in total. A base requirement gets 3 points when the report and a screenshot prove it, and 1 point when it is only partly met. If you leave one of the two questions unanswered or answer it wrongly, the advanced task it belongs to gets at most 1 point.
