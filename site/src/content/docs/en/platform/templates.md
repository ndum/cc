---
title: Platform templates
description: A namespace per member from a template with ResourceQuota, LimitRange and NetworkPolicy, an ApplicationSet for all members and a member's request as a pull request in Gitea.
sidebar:
  order: 5
---

:::assignment
"Gemeinde Hinterbüel heard about the web shop and wants to run its forms on containers too," Simone Wyss writes. "If every member wants that, you can't start from scratch each time. And the municipality must not take the cluster away from the bike shop on a Saturday."
:::

:::goals
After this chapter you can

- explain what a platform template is and what it gives a member,
- limit and separate namespaces with ResourceQuota, LimitRange and NetworkPolicy,
- use one template for several members with Kustomize,
- generate an application for every folder in Git with an ApplicationSet,
- review and accept a member's request as a pull request.
:::

## Templates

A platform team does not build an environment by hand for every team. It offers a tested path that others follow on their own, often called a golden path. The template defines what every member gets, and the member requests its space instead of waiting for an appointment. In part 3, OpenNebula played this role with groups, a VDC and quotas. In the cluster, namespaces and three kinds of objects take over.

| Part 3 in OpenNebula | Part 4 in Kubernetes |
|---|---|
| group | namespace |
| group quota | ResourceQuota |
| size of the template `ubuntu` | LimitRange |
| VDC and own network | NetworkPolicy |

## ResourceQuota

A ResourceQuota limits what all pods of a namespace may request together.

::code{file="platform/repo/templates/member/resourcequota.yaml"}

Requests are what the scheduler reserves for a container, like the `CPU` column of a VM in OpenNebula. Limits are the ceiling a container never exceeds. One CPU is one core, and `250m` is a quarter of it. `services.nodeports: "0"` stops members from opening ports on the nodes themselves, their way out is the ingress.

## LimitRange

Once a quota limits CPU and memory, Kubernetes rejects every pod without requests and limits. The LimitRange sets defaults for those and a ceiling per container.

::code{file="platform/repo/templates/member/limitrange.yaml"}

## NetworkPolicy

Without a rule, every pod in the cluster can reach every other pod, across namespaces too. A NetworkPolicy defines who may talk to a pod. k3s enforces such rules with its built-in controller.

::code{file="platform/repo/templates/member/networkpolicy.yaml"}

`podSelector: {}` means all pods of the namespace. They only accept connections from pods in their own namespace and from `kube-system`, where Traefik runs. In the lab, a pod in the namespace `default` got "Connection refused" from the web shop, while a pod in `velo` reached it. A freshly started pod failed its first two requests, though. After a pod starts, the controller needs a few seconds to add its address to its rules.

```bash
kubectl -n default run np-test --rm -i --restart=Never --image=busybox:1.37 -- sh -c "sleep 5; wget -qO- -T 5 http://webshop.velo/healthz"
kubectl -n velo run np-test --rm -i --restart=Never --image=busybox:1.37 -- sh -c "sleep 5; wget -qO- -T 5 http://webshop.velo/healthz"
```

The `sleep 5` gives the controller time to add the new pod to its rules.

## Kustomize

The four files make up the template in `templates/member`. Kustomize, which is built into kubectl and Argo CD, assembles the right objects for each member from it without copying the template.

::code{file="platform/repo/templates/member/kustomization.yaml"}

A member is a folder in `members` with a single file. The line `namespace` sets the namespace of all objects and also renames the template's Namespace object. The bike shop needs more CPU for its web shop than the template gives, so a patch replaces that one value.

::code{file="platform/repo/members/velo/kustomization.yaml"}

```bash
kubectl kustomize ~/platform/members/velo
```

The command prints the finished objects without changing anything. That is how you check a member before it lands in Git.

## ApplicationSet

Writing an application by hand for every member would be manual work again. An ApplicationSet generates applications from a pattern.

::code{file="platform/repo/apps/members.yaml"}

The `git` generator looks for folders under `members` in the repo and creates an application `member-<folder>` for each. When a folder is added, a namespace appears. When a folder disappears, Argo CD deletes the namespace and everything in it, thanks to `prune`. By default, the ApplicationSet checks every three minutes, and `requeueAfterSeconds: 60` shortens that to one minute.

```bash
kubectl -n argocd get applicationsets
kubectl -n argocd get applications
kubectl -n velo get resourcequota,limitrange,networkpolicy
kubectl -n velo describe resourcequota member
```

## The municipality's request

The municipality requests its namespace with a pull request. In practice the member works in its own branch or fork, in the lab you play both sides.

```bash
cd ~/platform
git switch -c gemeinde
mkdir -p members/gemeinde
cat > members/gemeinde/kustomization.yaml <<'EOF'
# Namespace of Gemeinde Hinterbüel with the limits of the template
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: gemeinde
components:
  - ../../templates/member
EOF
kubectl kustomize members/gemeinde
git add members
git commit -m "Namespace for Gemeinde Hinterbüel"
git push -u origin gemeinde
```

Gitea then offers to open a pull request for the branch `gemeinde`. As the platform team you review the change. Does the member only set its name, or does it also change the template? A request that changes `templates/member` affects every member and deserves closer attention. If everything is fine, you merge the pull request and pull the new state.

```bash
git switch main
git pull
kubectl get namespace gemeinde
kubectl -n argocd get applications
```

In the lab, the namespace `gemeinde` with its quota, LimitRange and NetworkPolicy was in place a few minutes after the merge. Nobody ran `kubectl apply` for it.

For milestone 2 the municipality gets the limits from your [personal values](../../start/parameters/). In a second pull request you add a patch to its file as for the bike shop. One patch may hold several operations, one `- op: replace` each for `limits.cpu` and for `limits.memory`. With smaller limits the test below stops earlier, in the lab with 1 CPU already after four pods.

## At the limit

A deployment that asks for too much shows what the quota does.

```bash
kubectl -n gemeinde create deployment fill --image=busybox:1.37 --replicas=12 -- sleep 3600
kubectl -n gemeinde get deployment fill
kubectl -n gemeinde get events --field-selector reason=FailedCreate
kubectl -n gemeinde delete deployment fill
kubectl -n gemeinde wait --for=delete pod -l app=fill --timeout=60s
```

In the lab, 8 of 12 pods ran with the values of the template. Each pod got a limit of `250m` CPU from the LimitRange, and after eight pods the quota of two CPUs was used up.

```text
Error creating: pods "fill-56886798df-vjq4b" is forbidden: exceeded quota: member, requested: limits.cpu=250m, used: limits.cpu=2, limited: limits.cpu=2
```

As with the quota in OpenNebula, the other members are not affected. The bike shop's web shop keeps running, whatever the municipality starts.

::::exercise[Lab]
Roll out the template for the bike shop, request the municipality's namespace as a pull request and accept it. Show the quota at its limit and the separation by the NetworkPolicy.

:::solution
`kubectl -n argocd get applications` shows `member-velo` and `member-gemeinde` as `Synced` and `Healthy`. `kubectl -n velo describe resourcequota member` shows `requests.cpu` with a limit of 2, while the municipality has the template's limit of 1. The deployment `fill` stops at 8 pods. A test pod in `gemeinde` gets "Connection refused" from the web shop in `velo`.
:::
::::

::::exercise[A member of your own]
Treuhand Aaregg wants a namespace for a small service that receives receipts. It needs little CPU but 1.5 GB of memory and storage for files. Create the member and justify your values.

:::solution
A folder `members/treuhand` with `namespace: treuhand` and patches for the quota, for example `requests.memory` to `2Gi`, `limits.memory` to `3Gi` and the LimitRange `max` to at least `2Gi`, so that a single container may get 1.5 GB. The two PersistentVolumeClaims of the template are enough for the storage. The justification names the needs of the service and checks whether the sum of all quotas fits the memory of the two VMs.
:::
::::

::::exercise[Overcommitting]
Add up the members' quotas and compare them with what the cluster has. Is it a mistake if the sum is larger?

:::solution
With the bike shop and the municipality, the requests add up to 3 CPUs and 2 Gi of memory, the limits to 4 CPUs and 4 Gi. The two VMs have 8 vCPUs and 12 GB, part of which k3s needs itself. A larger sum of limits is not a mistake as long as not everyone hits their limit at once, just like the quotas in chapter 3.2. Overcommitting requests would be riskier, because the scheduler starts no more pods once the reserved values fill the nodes.
:::
::::
