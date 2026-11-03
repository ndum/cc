---
title: Advanced tasks
description: The three advanced tasks of milestone 2, a rebuild drill of the whole platform, a member of your own with an AppProject and branch protection for main in Gitea.
sidebar:
  order: 6
  badge:
    text: Advanced
    variant: note
---

:::assignment
Beat Kläy, the president of the board, writes to you after the last meeting. "A platform built from code sounds good. Have you ever actually timed how long the bike shop's web shop is down if everything is gone? Before the next member joins, I want to see that it can only work in its own area. And nobody should change the platform without a second person looking at the change first, not even you."
:::

:::goals
After this chapter you can:

- Plan a rebuild of the platform as a drill, time it and check the result
- Explain what state and drift mean for a rebuild and what a rebuild does not bring back
- Derive the limits of a member from its needs and check them against the cluster
- Restrict a member to its namespace with an AppProject in Argo CD
- Protect the branch `main` in Gitea with rules and justify their exceptions
:::

## Your own solutions

The three tasks in this chapter are the advanced tasks of [milestone 2](../../assessment/milestone-2/), and the base does not need them. Unlike chapters 4.1 to 4.5, this chapter has no commands to copy and no ready-made files. You design the solution yourself, build it in your lab and explain why you built it that way. The sections before the tasks cover the concepts and trade-offs you need for that. Each task lists the requirements for your solution and points to the documentation.

Plan four to six hours for all three tasks together. You can also take on only some of them, since each one is worth 0 to 3 points by the [levels of the advanced tasks](../../assessment/#levels-of-the-advanced-tasks). A task that runs gets 1 point. If you also explain it on your own lab with your values and outputs, it gets 2. For 3 points you add a decision of your own with an alternative and a trade-off, which is why the sections below often name more than one way.

You show the tasks live in class or in a screencast of at most ten minutes, as the milestone page describes, and you answer the two questions from the report of the check `m2` along the way. For every task you write documentation, and [Assessment](../../assessment/#documenting-the-advanced-tasks) lists its parts. You may use AI assistants under the [course rules](../../start/overview/#ai-tools). Your documentation states what you used them for, and in the showing you explain every line you show in your own words.

## Practicing the rebuild

In chapter 4.1, Simone Wyss asked for a platform that can be rebuilt from code at any time. Only a rebuild shows whether the code delivers that. A step someone once did by hand, or a value that only ever lived in an old terminal, goes unnoticed until the platform is gone.

Operations teams therefore practice the emergency before it happens. A drill follows a fixed procedure. Someone times it and writes down what went wrong, then the team improves the procedure and runs the drill again.

The measured time is the least the web shop will be down after a total loss. As long as the rebuild is the only way back, Wolkenwerk cannot promise the bike shop a shorter outage. [Chapter 6.2](../../operations/backup/#rpo-and-rto) calls this promise the RTO.

You write the procedure down as a runbook or as a script. A runbook is a list of steps for people, with checks in between. A script runs the same steps the same way every time and can record the time as it goes, but if it stops halfway, someone has to work out where it stood. A single total says little. The time of each step shows where the minutes go, whether in the teardown, the start of the VMs, Kubernetes or Argo CD.

## Code, state and manual work

A rebuild brings back exactly what the code describes. The VMs, the start script, the applications, the template and the members are in the repo `platform` and come back. What the code only reads, the network `cc-net` and the image, the teardown leaves alone. Gitea with the repo lives on the front-end, where chapter 4.4 installed it so that it keeps running during a rebuild.

The state sits next to the code on the front-end, but not in Git. `tofu destroy` deletes exactly the objects the state lists, and `tofu apply` then creates them again with new IDs. Values OpenTofu generates itself, such as the k3s token, are new afterwards.

Anything that only existed in the cluster is lost. That includes data that pods wrote to a node's disk and any object someone created with `kubectl` without going through Git. What the front-end kept about the old cluster no longer fits the new one either, and chapter 4.3 names the SSH keys and the kubeconfig. Scripts such as the bootstrap of chapter 4.4 recreate a few things that are not in Git, for example the secret with the Gitea token. Chapter 6.2 comes back to the question with backups.

## Drift before the rebuild

Before the teardown, drift tells you what the rebuild is going to change. For the VMs, `tofu plan` compares the code with the actual state in OpenNebula, but only the attributes the provider knows. Changes inside a VM stay invisible. A VM someone created by hand next to the code is in no state at all. `tofu destroy` leaves it running, and it keeps taking memory on a node that was already tight in chapter 4.2.

In the cluster, Argo CD's self-heal resets every deviation, but only on objects that come from Git. An object created outside Git is left alone until the rebuild removes it. After a rebuild, every drift in the cluster is gone, including a fix made by hand that never reached Git. If you look before the teardown, you can still find it. `tofu plan` compares the VMs, and Argo CD shows for every application whether the cluster differs from the repo.

## Limits for a member

The municipality's values came from your personal parameters. For a member of your own you derive them yourself, starting from what the member wants to run. That means the number of pods, the CPU and memory each one needs and whether it stores files. The requests and limits of the quota follow from that. The LimitRange has to let the largest container have what it needs, otherwise Kubernetes rejects the container even though the quota still has room. Its defaults apply to every container that sets no values of its own.

Then you check against the cluster. The two VMs have 8 vCPUs and 12 GB together, and k3s and Argo CD need part of that themselves. Part 5 adds Prometheus and Loki, and as an advanced task a language model. As with the quotas in chapter 3.2, the sum of the limits may exceed the cluster. With requests that is riskier, because the scheduler starts no more pods once the reserved values fill the nodes. A justification names the need, the calculation and what happens at a peak when the member hits its limit.

## AppProjects

So far every application in the course belongs to the project `default`, which permits any source, any destination and every kind of object. An AppProject sets tighter rules for the applications that name it. It decides which repos they may read, which clusters and namespaces they may write to and which kinds of objects they may create. Destinations can also be excluded, for example a rule with `!` forbids one namespace.

For kinds of objects, an AppProject keeps two groups apart. Deployments or ResourceQuotas belong to a namespace. Other objects belong to the whole cluster, among them the Namespace object itself. For this second group an AppProject keeps an allow list, and everything not on it is forbidden. The template of chapter 4.5 creates a member's namespace as an object of its own. In a project that does not allow this kind, the template's application therefore cannot create its namespace.

For objects in a namespace, a project can forbid single kinds. The Argo CD documentation shows a project that allows everything except ResourceQuota, LimitRange and NetworkPolicy. An application in such a project cannot change the limits of its namespace.

This leaves a decision. Either the application that builds the namespace from the template belongs to the member's project, or it stays with the platform team and the member gets a second application in its project for its own workloads. AppProjects live in the namespace `argocd` like the applications, so they can come from Git the same way.

## Project and ApplicationSet

The ApplicationSet `members` of chapter 4.5 writes `project: default` into every application it generates. A member's AppProject only takes effect once the member's application names it, and there are several ways to get there. The ApplicationSet can build the project name from the folder name, and then every member needs a project of its own. The Git generator can also exclude a folder, so that an application of its own describes the new member. Or the template's application stays as it is and only the member's workloads get a project.

Which way is safe depends on who may change the repo. The Argo CD documentation warns against a project that comes from the template of an ApplicationSet. Anyone who may add folders to the repo could then create applications in a project with too many rights, and with the Git generator a pull request is enough for that. The documentation therefore asks that administrators approve such pull requests. It also points out that a project with access to the namespace `argocd` effectively has administrator rights. An AppProject is only as strong as the review of the changes to the repo, and that review is the subject of task C.

## Branch protection in Gitea

In the repo `wolkenwerk/platform`, `main` is the desired state of the cluster. Argo CD polls every minute and rolls out every new commit. So far the platform team reviews the members' requests as pull requests and sends its own changes straight to `main` with `git push`. Gitea accepts any push with write access to `main`, whether someone reviewed it or not.

A protected branch turns the review into a rule that Gitea enforces itself, in the web editor and through the API as well. Gitea can block direct pushes completely or allow them only for a list of accounts. It can require a number of approvals before a pull request may be merged, and reviews from every account with write access count unless you restrict them to a list. Further settings dismiss old approvals after new commits, block the merge after a rejection or give single files extra protection. That can make sense for `templates/member`, because a change there affects every member. The lab has no CI, so there are no status checks to require.

## Exceptions to the rule

A review needs a second person. In Gitea, the author of a pull request cannot approve it. In the lab you play both roles, so you need a second account with write access. Since nobody can sign up on their own, an administrator creates it.

The account `platform` is the administrator of your Gitea and owns the organization `wolkenwerk`. Repository administrators can merge a pull request even without the required approvals, unless the setting "Administrators must follow branch protection rules" is turned on. Gitea 28 also has a list of accounts that may bypass the rule, "Allow selected users or teams to bypass branch protection". The setting for administrators does not restrict these accounts. Whether the platform team keeps such back doors is a trade-off.

The protection also applies in an emergency. If the web shop fails on a Saturday and the fix waits for a review, the outage lasts longer. Teams therefore often keep a documented emergency path that they use rarely and review afterwards. The course asks for the same kind of trade-off. Parts 5 and 6 send changes straight to `main` with `git push`. With a protected branch they can only go through pull requests or through an exception you define yourself. Argo CD only reads the repo and does not notice the protection.

## Task A · Rebuilding the platform

You tear the platform down, rebuild it from the code alone and time how long the bike shop's web shop is down. Then you show that everything from Git is back and explain what state and drift mean for the rebuild.

Your solution meets these requirements:

1. After the teardown with `tofu destroy`, the platform comes back from your code and the repo in Gitea alone. Apart from the Argo CD bootstrap, you create nothing in the cluster by hand.
2. You measure the time from the start of the teardown to the first answer of the web shop and record the time of each step.
3. After the rebuild, `tofu plan` shows no changes, every application is `Synced` and `Healthy`, and the members' namespaces have their limits again.
4. The procedure is written down as a short runbook or as a script that another person could use to repeat the rebuild.
5. You explain on your lab what role the state plays in the teardown, what happens to a change made by hand and what the rebuild does not bring back.

In the showing you show:

- The state before the teardown with `tofu plan` and the applications in Argo CD
- The teardown and the rebuild with your runbook or script and the running time measurement
- The platform after the rebuild with the web shop, the applications, the limits and `tofu plan`
- Your times per step and what you conclude from them

[Chapter 4.1](../iac/#state) explains state, plan and drift, and [chapter 4.2](../opentofu/#changing-replacing-and-rebuilding) uses `tofu plan` and `tofu apply` on the cluster VMs. [Chapter 4.3](../kubernetes/#the-kubeconfig) says what changes on the front-end after a new cluster, and [chapter 4.4](../gitops/#argo-cd) describes the bootstrap. The OpenTofu 1.13 documentation covers [`tofu destroy`](https://opentofu.org/docs/v1.13/cli/commands/destroy/), the [state](https://opentofu.org/docs/v1.13/language/state/) and the [modes of `tofu plan`](https://opentofu.org/docs/v1.13/cli/commands/plan/), among them `-refresh-only`, which updates the state to match changes made outside OpenTofu. The app of apps pattern the bootstrap relies on is described in the [Argo CD 3.5 documentation](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/cluster-bootstrapping/).

In the lab, with the platform as it stood after part 4, the rebuild took just under three minutes until the web shop ran again. Start it early in the showing and explain your code while it runs. Gitea on the front-end stays reachable the whole time.

## Task B · A member of your own

One more member of your choice gets a namespace from the template, with limits that fit its needs. Like the municipality, it comes in through a pull request. An AppProject in Argo CD makes sure its applications only write to its own namespace.

Your solution meets these requirements:

1. The member has no namespace in part 4 yet. It comes in through a pull request in Gitea that you review and merge.
2. Quota and LimitRange have values of your own. You derive them from the member's needs and check that all quotas together fit the cluster.
3. An AppProject allows only this member's namespace as a destination, and at least one application of the member belongs to it.
4. The AppProject is in Git and reaches the cluster through Argo CD.
5. Argo CD rejects an application of the project that tries to write to another namespace.

In the showing you show:

- The member's pull request with the diff and your reasons for the values
- The member's limits in the cluster and your calculation for all members
- The AppProject in Git and the applications that belong to it
- An application that Argo CD rejects because of the project, with the reason

[Chapter 4.5](../templates/#kustomize) shows the template, the bike shop's patch and the municipality's pull request. `kubectl kustomize` shows what the template produces for your member before you open the pull request. [Chapter 4.3](../kubernetes/#requests-limits-and-scheduling) explains requests and limits, and [chapter 3.2](../../tenants/quotas/#quotas-and-overcommitment) explains quotas and overcommitment. The Kubernetes 1.36 documentation describes [ResourceQuota](https://v1-36.docs.kubernetes.io/docs/concepts/policy/resource-quotas/) and [LimitRange](https://v1-36.docs.kubernetes.io/docs/concepts/policy/limit-range/).

For Argo CD 3.5, the fields of an AppProject are under [Projects](https://argo-cd.readthedocs.io/en/release-3.5/user-guide/projects/), and [Declarative Setup](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/declarative-setup/) shows a complete AppProject as a file. The page on the [Git generator](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/applicationset/Generators-Git/) explains how an ApplicationSet selects and excludes folders, and [ApplicationSet Security](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/applicationset/Security/) covers the risk of a project that comes from the template. Argo CD shows the reason for a rejection on the application in its interface.

## Task C · Branch protection

In the repo `wolkenwerk/platform`, changes only reach `main` through a reviewed pull request. Gitea enforces the rule itself and rejects a direct push. You decide which exceptions are allowed and justify them.

Your solution meets these requirements:

1. Gitea rejects a direct push to `main` of the repo `wolkenwerk/platform`.
2. A pull request to `main` can only be merged once another account with write access has approved it.
3. After the merge, Argo CD rolls out the change as before.
4. You show who could get around the rule in your Gitea, and you decide and justify whether that exception stays.

In the showing you show:

- The rule for `main` in the settings of the repo
- A direct push that Gitea rejects, with the message in the terminal
- A pull request that Gitea only lets you merge after the approval
- The change in the cluster after the merge

Since [chapter 4.4](../gitops/#gitea-on-the-front-end), Gitea runs with sign-up turned off, so only an administrator creates accounts. [The repo platform](../gitops/#the-repo-platform) lists the rights of the two tokens, and [chapter 4.5](../templates/#the-municipalitys-request) shows the path of a request. The Gitea 28 documentation describes every setting under [Protected branches](https://docs.gitea.com/usage/access-control/protected-branches/). You create another account under "Site Administration" in the web interface or with `gitea admin user create`, which the [command line reference](https://docs.gitea.com/administration/command-line) describes.

Before you protect the branch, decide how you will keep working in parts 5 and 6.
