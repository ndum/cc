---
title: Advanced tasks
description: The three advanced tasks of milestone 2, a rebuild drill of the whole platform, a member of your own with an AppProject and branch protection for main in Gitea.
tableOfContents:
  maxHeadingLevel: 2
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

## Scope and grading

The three tasks in this chapter go beyond the base. Unlike chapters 4.1 to 4.5, this one has no commands to copy and no ready-made files. You design a solution of your own, build it in your lab and justify your decisions. The concept sections below often name more than one way to do it.

These conditions apply:

- They are the advanced tasks of [milestone 2](../../assessment/milestone-2/), and you may take on only some of them
- Plan four to six hours for all three
- You show them live in class or in a screencast of at most ten minutes, as the milestone describes under [showing the advanced tasks](../../assessment/milestone-2/#showing-the-advanced-tasks). In the showing you answer the two questions from the report of the check `m2`.
- Each task needs documentation in five parts as [Assessment](../../assessment/#documenting-the-advanced-tasks) describes, plus a copy of your repo `platform` without `.git`, state, tokens and passwords
- Each task is worth 0 to 3 points by the [levels of the advanced tasks](../../assessment/#levels-of-the-advanced-tasks), and at most 1 point without documentation
- You may use AI assistants under the [course rules](../../start/overview/#ai-tools). In the showing you explain every line yourself.

## Practicing the rebuild

In chapter 4.1, Simone Wyss asked for a platform that can be rebuilt from code at any time. Only a rebuild shows whether the code delivers that. Otherwise a manual step someone forgot about goes unnoticed until the platform is gone. Operations teams therefore rehearse the emergency in a fixed procedure.

| | Runbook | Script |
|---|---|---|
| Procedure | steps for people, with checks in between | the same steps, the same way every time |
| Time | measured by a person | recorded by the script as it goes |

:::details[Timing the drill, the RTO and a script that stops halfway]
Operations teams time the rehearsal, write down what went wrong, improve the procedure and run the drill again.

As long as the rebuild is the only way back, Wolkenwerk cannot promise the bike shop a shorter outage than the measured one. [Chapter 6.2](../../operations/backup/#rpo-and-rto) calls this promise the RTO. Only the time of each step shows where the minutes go, whether in the teardown, the start of the VMs, Kubernetes or Argo CD.

If a script stops halfway through the rebuild, someone has to work out where it stood.
:::

## Code, state and manual work

A rebuild brings back exactly what the code describes. `tofu destroy` deletes exactly the objects the state lists. The state sits next to the code on the front-end, but not in Git.

:::details[Objects, keys and data after the rebuild]
| What | After the rebuild |
|---|---|
| VMs, start script, applications, template and members | come back from the repo `platform` |
| The network `cc-net` and the image, which the code only reads | are left alone |
| Gitea with the repo on the front-end | keeps running |
| VM IDs and values OpenTofu generates, such as the k3s token | are new |
| The old host key of the server in `known_hosts` and the kubeconfig on the front-end | no longer fit, as chapter 4.3 explains |
| Objects outside Git that scripts such as the bootstrap of chapter 4.4 create, for example the secret with the Gitea token | are created again by the script |
| Data that pods wrote to a node's disk and objects someone created with `kubectl` without going through Git | are lost |

Chapter 6.2 comes back to the lost data with backups.
:::

## Drift before the rebuild

Before the teardown, drift tells you what the rebuild is going to change. Afterwards it is gone, including any fix made by hand that never reached Git, so look for it beforehand.

| | VMs | Cluster |
|---|---|---|
| Comparison | `tofu plan`, only for the attributes the provider knows | Argo CD for every application, and self-heal resets deviations |
| Unnoticed | changes inside a VM | objects someone created without going through Git |
| After `tofu destroy` | a VM someone created next to the code stays and keeps taking memory on the tight nodes of chapter 4.2 | the objects created outside Git are gone too |

## Limits for a member

The municipality's values came from your personal parameters, but for a member of your own you derive the requests and limits of the quota yourself. You start from the number, CPU and memory of its pods and whether it stores files. Then you check against the cluster.

:::details[LimitRange, the check against the cluster and your justification]
The LimitRange has to let the largest container have what it needs, otherwise Kubernetes rejects the container even though the quota still has room. Its defaults apply to every container that sets no values of its own.

Of the 8 vCPUs and 12 GB of the two VMs, k3s and Argo CD already use a share, and part 5 adds Prometheus, Loki and, as an advanced task, a language model. As with the quotas in chapter 3.2, the sum of the limits may exceed the cluster, but with requests that is riskier. The scheduler starts no more pods once the reserved values fill the nodes. Your justification names the need, the calculation and what a peak at the limit leads to.
:::

## AppProjects

So far every application belongs to the project `default`, which permits everything. An **AppProject** defines, for the applications that name it, which repos, clusters, namespaces and kinds of objects they may use.

| Kinds of objects | Examples | Rule in the AppProject |
|---|---|---|
| Cluster-wide | the Namespace object | only the kinds on an allow list are permitted |
| Inside a namespace | Deployment, ResourceQuota | single kinds can be forbidden |

:::details[Exclusions, AppProjects in Git and the template's application]
A rule with `!` excludes a destination, for example one namespace. AppProjects live in the namespace `argocd` and can come from Git like the applications.

Because the template of chapter 4.5 creates the namespace as an object of its own, its application needs a project that allows this kind. If a project instead allows everything except ResourceQuota, LimitRange and NetworkPolicy, as an example in the Argo CD documentation does, an application cannot change the limits of its namespace.

This leaves a decision. Either the template's application belongs to the member's project, or it stays with the platform team and the member gets a second application in its project for its own workloads.
:::

## Project and ApplicationSet

The ApplicationSet `members` of chapter 4.5 writes `project: default` into every application it generates. A member's AppProject only takes effect once the member's application names it.

| Way | Consequence |
|---|---|
| The ApplicationSet builds the project name from the folder | every member needs a project of its own |
| The Git generator excludes the folder | an application of its own describes the member |
| The template's application stays as it is | only the member's workloads get a project |

:::details[Safety of each way and the review of changes to the repo]
Which way is safe depends on who may change the repo. The Argo CD documentation warns against a project that comes from the template of an ApplicationSet, because with the Git generator a single pull request that adds a folder could create applications in a project with too many rights. The documentation therefore asks administrators to approve such pull requests. A project with access to the namespace `argocd` effectively has administrator rights. An AppProject is only as strong as the review of the changes to the repo, the subject of task C.
:::

## Branch protection in Gitea

In the repo `wolkenwerk/platform`, `main` is the desired state of the cluster. Gitea accepts any push with write access, whether someone reviewed it or not.

A **protected branch** turns the review into a rule that Gitea enforces itself, in the web editor and through the API as well. These settings are available:

- Block direct pushes or allow them only for a list of accounts
- Require approvals before a merge, counted from every account with write access or only from a list
- Dismiss old approvals after new commits
- Block the merge after a rejection
- Give single files extra protection, for example in `templates/member`, because a change there affects every member

:::details[Argo CD, direct pushes and status checks]
Argo CD polls every minute and rolls out every new commit. The platform team reviews the members' requests as pull requests, but so far it sends its own changes straight to `main` with `git push`.

The lab has no CI, so there are no status checks to require.
:::

## Exceptions to the rule

In Gitea the author of a pull request cannot approve it. Repository administrators can merge a pull request without the required approvals unless "Administrators must follow branch protection rules" is turned on. Whether the platform team keeps such back doors is a trade-off.

:::details[A second account, the bypass list and an emergency path]
In the lab you both open and approve pull requests, so you need a second account with write access. Since nobody can sign up on their own, an administrator creates it.

The account `platform` is the administrator of your Gitea and owns the organization `wolkenwerk`. The accounts on the Gitea 28 list "Allow selected users or teams to bypass branch protection" get around the rule even when "Administrators must follow branch protection rules" is on.

A fix in an emergency waits for a review too, and the outage lasts longer. Teams therefore often keep a documented emergency path that they use rarely and review afterwards. Argo CD only reads the repo and does not notice the protection.
:::

## Rebuilding the platform (Task A)

Beat Kläy wants to know how long the bike shop's web shop is down if everything is gone. You tear the platform down, rebuild it from the code alone and time the outage.

![Rebuilding the platform. The target state of task A. After a teardown the platform comes back from code. At the top left is the front-end, which stays in place. It holds OpenTofu with the code and the state, and Gitea with the repo wolkenwerk/platform. At the top right is the new k3s cluster in cc-net. OpenTofu creates the two VMs k3s-server and k3s-agent again. Argo CD arrives with the bootstrap, pulls the desired state from Gitea and applies the applications for the web shop and the members. At the bottom your runbook or script times every step, the teardown, the start of the VMs, Kubernetes and Argo CD. Notice that the outage runs from the start of the teardown to the first answer of the web shop.](../../../../assets/figures/en/p4c6-rebuild.svg)

| Starting point | Result |
|---|---|
| From the base you have the VMs `k3s-server` and `k3s-agent` from OpenTofu, with their state in `~/platform/tofu` on the front-end (chapter 4.2), and k3s from the start script (chapter 4.3). Gitea on the front-end holds the repo `wolkenwerk/platform`. Since the bootstrap in chapter 4.4, Argo CD rolls out the applications `root`, `webshop`, `member-velo` and `member-gemeinde` from it, with the web shop in the namespace `velo` and the limits of the namespaces `velo` and `gemeinde` from chapter 4.5. | You have torn the platform down with `tofu destroy` and rebuilt it from your code and the repo in Gitea alone. The web shop answers again, every application is `Synced` and `Healthy`, and `tofu plan` shows no changes. Your runbook or script records the time of each step. |

### Approach

1. Record the state before the teardown and look for drift in the VMs and in the cluster.
2. Write the teardown and the rebuild down as a runbook or a script that times every step.
3. Tear the platform down and rebuild it with your procedure from the code and the repo in Gitea alone.
4. Check the new platform with the plan, the applications, the web shop and the members' limits.
5. Compare the state afterwards with the state before and work out what the rebuild did not bring back.
6. Record the times per step, the problems and your choice between runbook and script for the documentation.

:::caution[Rebuilding after part 4]
The notes from the lab for this task assume the platform as it stood after part 4. A later rebuild takes longer and loses the metrics and logs of part 5. Until chapter 6.1 you run `make-secrets.sh` before the bootstrap, and from chapter 6.1 on you back up the Sealed Secrets key before the teardown as in chapter 6.2. Otherwise Grafana does not start.
:::

### Requirements

1. After the teardown with `tofu destroy`, the platform comes back from your code and the repo in Gitea alone. Apart from the Argo CD bootstrap, you create nothing in the cluster by hand.
2. You measure the time from the start of the teardown to the first answer of the web shop and record the time of each step.
3. After the rebuild, `tofu plan` shows no changes, every application is `Synced` and `Healthy`, and the members' namespaces have their limits again.
4. The procedure is written down as a short runbook or as a script that another person could use to repeat the rebuild.
5. You explain on your lab what role the state plays in the teardown, what happens to a change made by hand and what the rebuild does not bring back.

### Showing

- The state before the teardown with `tofu plan` and the applications in Argo CD
- The teardown and the rebuild with your runbook or script and the running time measurement
- The platform after the rebuild with the web shop, the applications, the limits and `tofu plan`
- Your times per step and what you conclude from them

:::details[Notes from the lab]
- With the platform as it stood after part 4, the rebuild took just under three minutes until the web shop ran again. Start it early in the showing and explain your code while it runs.
- Gitea on the front-end stays reachable the whole time
:::

:::details[Sources]
- [Chapter 4.1](../iac/#state) on state, plan and drift
- [Chapter 4.2](../opentofu/#changing-replacing-and-rebuilding) on `tofu plan` and `tofu apply` for the cluster VMs
- [Chapter 4.3](../kubernetes/#the-kubeconfig) on the front-end after a new cluster
- [Chapter 4.4](../gitops/#argo-cd) on the Argo CD bootstrap
- The OpenTofu 1.13 documentation on [`tofu destroy`](https://opentofu.org/docs/v1.13/cli/commands/destroy/), the [state](https://opentofu.org/docs/v1.13/language/state/) and the [modes of `tofu plan`](https://opentofu.org/docs/v1.13/cli/commands/plan/), among them `-refresh-only`, which updates the state to match changes made outside OpenTofu
- [Cluster Bootstrapping](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/cluster-bootstrapping/) in the Argo CD 3.5 documentation on the app of apps pattern the bootstrap relies on
:::

## A member of your own (Task B)

Before the next member joins, Beat Kläy wants to see that it can only work in its own area. A member of your choice gets a namespace from the template through a pull request, like the municipality, and an AppProject in Argo CD restricts its applications to that namespace.

![A member of your own with an AppProject. The target state of task B. At the top, a pull request in Gitea asks for the namespace from the template, and after the review the member folder and the AppProject are on main. In the middle, Argo CD pulls both from Git. The member application and a test application name the AppProject, which allows only the member namespace as a destination. At the bottom, in the cluster, Argo CD applies the member application in its namespace with its own quota and LimitRange. Notice the test application. It tries to write to the namespace velo of another member, and Argo CD rejects it.](../../../../assets/figures/en/p4c6-member.svg)

| Starting point | Result |
|---|---|
| From the base, the repo `wolkenwerk/platform` holds the template `templates/member` and the ApplicationSet `members`, which generates an application in the project `default` for every folder under `members` (chapter 4.5). The namespaces `velo` and `gemeinde` have their limits, and you reviewed and merged the municipality's request as a pull request. The practice and the fiduciary office have no namespace yet. | A member of your choice has a namespace of its own from the template, with limits you derived from its needs. An AppProject from Git allows its applications only this namespace as a destination. Argo CD rejects an application of the project that tries to write anywhere else. |

### Approach

1. Choose a member without a namespace and estimate the number, CPU and memory of its pods.
2. Derive the quota and the LimitRange from that and check all quotas together against the cluster.
3. Request the namespace with a pull request like the municipality, then review and merge it.
4. Decide which applications belong to the member's project. Then put the AppProject into Git.
5. Use a test application to check that Argo CD rejects a destination outside the namespace.
6. Record the needs, the calculation, the rejection and your decision on the project for the documentation.

### Requirements

1. The member has no namespace in part 4 yet. It comes in through a pull request in Gitea that you review and merge.
2. Quota and LimitRange have values of your own. You derive them from the member's needs and check that all quotas together fit the cluster.
3. An AppProject allows only this member's namespace as a destination, and at least one application of the member belongs to it.
4. The AppProject is in Git and reaches the cluster through Argo CD.
5. Argo CD rejects an application of the project that tries to write to another namespace.

### Showing

- The member's pull request with the diff and your reasons for the values
- The member's limits in the cluster and your calculation for all members
- The AppProject in Git and the applications that belong to it
- An application that Argo CD rejects because of the project, with the reason

:::details[Notes from the lab]
- Before you open the pull request, `kubectl kustomize` shows what the template produces for your member
- Argo CD shows the reason for a rejection on the application in its interface
:::

:::details[Sources]
- [Chapter 4.5](../templates/#kustomize) with the template, the bike shop's patch and the municipality's pull request
- [Chapter 4.3](../kubernetes/#requests-limits-and-scheduling) on requests and limits
- [Chapter 3.2](../../tenants/quotas/#quotas-and-overcommitment) on quotas and overcommitment
- The Kubernetes 1.36 documentation on [ResourceQuota](https://v1-36.docs.kubernetes.io/docs/concepts/policy/resource-quotas/) and [LimitRange](https://v1-36.docs.kubernetes.io/docs/concepts/policy/limit-range/)
- The Argo CD 3.5 documentation with the fields of an AppProject under [Projects](https://argo-cd.readthedocs.io/en/release-3.5/user-guide/projects/) and a complete AppProject as a file under [Declarative Setup](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/declarative-setup/)
- [Git generator](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/applicationset/Generators-Git/) on how an ApplicationSet selects and excludes folders
- [ApplicationSet Security](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/applicationset/Security/) on the risk of a project that comes from the template
:::

## Branch protection (Task C)

Nobody should change the platform without a second person looking at the change first. Changes therefore only reach `main` of the repo `wolkenwerk/platform` through a reviewed pull request, and Gitea enforces the rule itself.

![The protected branch main. The target state of task C. On the left is the platform team with two accounts, your account platform, which is also the Gitea administrator, and a second account with write access. In the middle, Gitea holds the repo wolkenwerk/platform with the protected branch main. Gitea rejects a direct push from platform to main. A pull request from platform needs an approval. The second account approves it, and only then does Gitea merge it into main. On the right, Argo CD in the k3s cluster pulls main with read access only and applies the change as before. Notice that you decide yourself who may bypass the rule.](../../../../assets/figures/en/p4c6-branch.svg)

| Starting point | Result |
|---|---|
| From the base you have Gitea on the front-end with the administrator `platform`, the organization `wolkenwerk` and the repo `platform` (chapter 4.4). You push your own changes straight to `main` with `platform.token`, and Argo CD reads the repo with `argocd.token` and rolls out every new commit. There is no account besides `platform`, because nobody can sign up on their own. | Gitea rejects every direct push to `main` and only lets you merge a pull request once a second account with write access has approved it. Argo CD then rolls out the change as before. You have checked who can get around the rule and decided whether that stays. |

### Approach

1. Decide who may write to `main`, approve and get around the rule, including the pushes of parts 5 and 6.
2. Create the second account and give it write access to the repo.
3. Set up the rule for `main` in the settings of the repo.
4. Test the rule with a direct push and with a pull request that the second account approves.
5. Check after the merge that Argo CD rolls out the change.
6. Record the settings, the messages and your decision on the exception for the documentation.

:::caution[Pushes in parts 5 and 6]
Parts 5 and 6 send changes straight to `main` with `git push`, and with the protection of this task Gitea rejects them. Before you turn the protection on, decide whether you will work through pull requests in those parts or through an exception you define yourself.
:::

### Requirements

1. Gitea rejects a direct push to `main` of the repo `wolkenwerk/platform`.
2. A pull request to `main` can only be merged once another account with write access has approved it.
3. After the merge, Argo CD rolls out the change as before.
4. You show who could get around the rule in your Gitea, and you decide and justify whether that exception stays.

### Showing

- The rule for `main` in the settings of the repo
- A direct push that Gitea rejects, with the message in the terminal
- A pull request that Gitea only lets you merge after the approval
- The change in the cluster after the merge

:::details[Notes from the lab]
- You create another account under "Site Administration" in the web interface or with `gitea admin user create`
:::

:::details[Sources]
- [Chapter 4.4](../gitops/#gitea-on-the-front-end) on Gitea with sign-up turned off, so that only an administrator creates accounts
- [The repo platform](../gitops/#the-repo-platform) in chapter 4.4 with the rights of the two tokens
- [Chapter 4.5](../templates/#the-municipalitys-request) with the path of a request
- The Gitea 28 documentation with every setting under [Protected branches](https://docs.gitea.com/usage/access-control/protected-branches/) and the commands for accounts in the [command line reference](https://docs.gitea.com/administration/command-line)
:::
