---
title: Platform as code (Milestone 2)
description: The assignment of the second milestone with the seven base requirements, the three advanced tasks, the showing, the content of the hand-in and the rubric.
---

:::assignment
"The board wants to see that you can rebuild the platform at any time," Simone Wyss writes. "Throw it away in front of them and build it again, with the bike shop's web shop and room for another member."
:::

Milestone 2 covers part 4. In the base you build a Kubernetes cluster from code on your cloud, roll out the web shop with GitOps and give the members namespaces from a template. In the advanced tasks you rebuild the platform, add a member of your own and protect the branch `main`. Milestone 2 belongs with milestone 1 to hand-in 1.

## Base

Everything runs in your own lab with your personal parameters from chapter 0.3. The base has seven requirements.

1. The two cluster VMs come from OpenTofu in your repo `platform`, `tofu plan` shows no changes afterwards, and the state is not in Git.
2. The k3s cluster runs with a server, an agent and host-gw routing, and kubectl works from the front-end.
3. Gitea runs on the front-end with the private repo `wolkenwerk/platform`, and Argo CD reads it with a read-only token.
4. Argo CD rolls out the web shop from Git, and you show self-heal and a change through Git.
5. The namespaces `velo` and `gemeinde` come from the template with ResourceQuota, LimitRange and NetworkPolicy.
6. The municipality's ResourceQuota uses your [personal values](../../start/parameters/#your-values-for-the-milestones) and arrives through a pull request.
7. You show the quota at its limit and the separation of the namespaces by the NetworkPolicy, and the check `m2` is green.

You prove the base with the report of the check `m2` and one screenshot per requirement, each with a file name that starts with the number of its requirement. `python3 ~/cc/checks/check.py m2` writes the report on the front-end. For a pull request, a screenshot from Gitea with the diff and the merge is enough. For the token, the screenshot shows the answer of the Gitea API with the `scopes` of the token `argocd`, as chapter 4.4 queries it.

## Advanced tasks

Plan four to six hours for the three advanced tasks. Each one is worth 0 to 3 points by the [levels of the advanced tasks](../#levels-of-the-advanced-tasks). Every task you do needs [documentation in five parts](../#documenting-the-advanced-tasks). [Chapter 4.6](../../platform/advanced/) explains the concepts behind them and lists the requirements of each task.

### Rebuilding the platform (Task A)

You tear the cluster down with `tofu destroy`, rebuild it with `tofu apply` and the Argo CD bootstrap, and measure the time from the start of the teardown to the first answer of the web shop. Along the way you explain what state and drift mean for a rebuild. In the lab, with the platform as it stood after part 4, the web shop ran again after just under three minutes. Start the rebuild early in the showing and explain the code while it runs. [Chapter 4.6](../../platform/advanced/#rebuilding-the-platform-task-a) describes the task.

### A member of your own (Task B)

One more member of your choice gets a namespace from the template through a pull request, with limits of your own that you justify. You also create an Argo CD AppProject that allows only this member's namespace. [Chapter 4.6](../../platform/advanced/#a-member-of-your-own-task-b) describes the task, and you know the template from chapter 4.5.

### Branch protection (Task C)

In Gitea you protect the branch `main` so that changes only get in through a reviewed pull request. You show that Gitea rejects a direct push. [Chapter 4.6](../../platform/advanced/#branch-protection-task-c) describes the task.

## Showing the advanced tasks

You show the advanced tasks live in class or in a screencast of at most ten minutes. For a live showing you book a slot with your instructor yourself. It must take place by hand-in 1. The screencast starts with `cat /etc/cc-lab.env` and the report of the check `m2` with its hash and your two questions, which you answer during the showing.

## Hand-in

The folder `m2/` of your hand-in repo holds the screenshots of the base. The advanced tasks add their documentation and `platform/`, a copy of your repo `platform` from Gitea without the `.git` folder, state, tokens or passwords. A showing by screencast adds its link.

You put the reports of the checks in `reports/`. [Handing in](../#handing-in) describes how the repo is structured and how you set a tag.

## Rubric

| Base requirement | Points |
|---|---|
| Cluster VMs from OpenTofu, plan without changes, state outside Git | 3 |
| k3s with server, agent and host-gw, kubectl from the front-end | 3 |
| Gitea with a private repo, read-only token for Argo CD | 3 |
| Web shop with Argo CD, self-heal and a change through Git | 3 |
| Namespaces `velo` and `gemeinde` from the template | 3 |
| The municipality's ResourceQuota with the personal values through a pull request | 3 |
| Quota at the limit and NetworkPolicy shown, check `m2` | 3 |
| **Base** | **21** |

| Advanced task | Points |
|---|---|
| Rebuilding the platform with the measured time (Task A) | 3 |
| A member of your own with an AppProject (Task B) | 3 |
| Protection of the branch `main` (Task C) | 3 |
| **Advanced** | **9** |

Milestone 2 is worth up to 30 points in total. A base requirement gets 3 points when the report and a screenshot prove it, 2 points when the check is green but a fitting screenshot is missing, and 1 point when it is only partly met. Each of the two questions you leave unanswered or answer wrongly costs 1 point of the advanced tasks. If the documentation or one of its parts 1, 2, 4 and 5 is missing, an advanced task gets at most 1 point.
