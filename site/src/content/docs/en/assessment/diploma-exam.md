---
title: Diploma exam
description: The known format of the diploma exam, a checklist for your preparation and practice scenarios with solutions for your own lab.
---

The diploma exam follows after the module, outside of it. It is practical, takes 60 minutes and is open book. As in the [mock exam](../mock-exam/), you find and fix faults in a running environment and extend it.

## Key facts

| Item | Status |
|---|---|
| Form | practical, on a running environment |
| Duration | 60 minutes |
| Aids | open book, the school announces the exact list |
| Environment | announced by the school |
| Date | announced by the school |

The environment may be your own lab or an environment of the school built the same way. Go by what the school announces, not by assumptions from this course.

## Preparation

- You find your way around OpenNebula, OpenTofu, Kubernetes, Argo CD and Prometheus without searching for long. The [lab reference](../../lab-reference/) sums up the commands.
- You follow a fixed procedure when something breaks, as described in [Troubleshooting](../../troubleshooting/#handling-a-fault).
- You worked through the mock exam and practiced the tickets you were unsure about once more.
- You solved the practice scenarios below in your lab.
- You know the competence grids of parts 1 to 6 and can solve every task in them without looking anything up.
- Your notes and repos are organized so that you find what you need within a minute.

## Practice scenarios

Work through the scenarios in your own lab. Take a snapshot in smartlearn first. Each scenario should take ten to fifteen minutes.

::::exercise[Month-end at the fiduciary office]
For its month-end closing, Treuhand Aaregg needs two extra VMs with 1 GB each for one week. Raise the quota as far as needed, start the VMs as the admin of the fiduciary office and then reset the quota to the value from chapter 3.2. Explain what happens to running VMs when the quota goes down.

:::solution
The quota of the fiduciary office allows 4 VMs, 2 CPUs and 4,096 MB. Two more VMs with 1 GB each only fit if the office has no VMs running yet. Otherwise you raise MEMORY, and VMS and CPU if needed, with `onegroup quota treuhand`. When you lower the quota afterward, existing VMs keep running. OpenNebula only blocks new VMs until usage is below the quota again.
:::
::::

::::exercise[Sale in the web shop]
Veloatelier Matte starts a sale on Saturday. During the sale, the web shop should run with at least three pods. Make the change through Git and show that the cluster picked it up.

:::solution
The lower limit is `minReplicas` in `webshop/hpa.yaml` in the platform repo. You set it to 3, open a pull request in Gitea and merge it. After the next sync, `kubectl -n velo get hpa webshop` shows three as the minimum and three pods are running. A change with `kubectl scale` or `kubectl edit` would be reverted by Argo CD's self-heal.
:::
::::

::::exercise[Rejected pod]
Start a pod in the namespace `gemeinde` with `kubectl -n gemeinde run test --image=nginx`. Find out why it does not run, and get a pod with a web server running in this namespace that follows the rules.

:::solution
Kubernetes rejects the pod with `violates PodSecurity "restricted:latest"`, because the image runs as `root` and the security settings are missing. A pod with `nginxinc/nginx-unprivileged`, `runAsNonRoot`, the `seccompProfile` `RuntimeDefault`, `allowPrivilegeEscalation: false` and no capabilities meets the profile `restricted`. To keep it, it belongs as a manifest in the municipality's folder in the platform repo.
:::
::::

::::exercise[Alert for the municipality]
The municipality gets a small website with `nginxinc/nginx-unprivileged`. Bring it into its namespace through Git. The municipality wants to know when the website has had no running pod for more than five minutes. Write the alert rule, trigger the alert through Git and show that it reaches the triage service.

:::solution
The website is a deployment like the app of your member from UN4, listed in the municipality's `kustomization.yaml`. A `PrometheusRule` in the same folder queries `kube_deployment_status_replicas_available{namespace="gemeinde"} < 1` with `for: 5m` and carries the label `triage: "true"`, so Alertmanager sends the alert to the triage service. You trigger it by setting the deployment to zero replicas through Git. After a few minutes the alert shows up in the audit log of the triage service. Then you set the replicas back through Git.
:::
::::

::::exercise[Deleted]
Delete the namespace `gemeinde` with `kubectl delete namespace gemeinde` and watch what happens. Then delete the VM of your own member from UN4 and restore it from the latest backup. Explain the difference between the two cases.

:::solution
Argo CD creates the namespace again after a short while, because its desired state is in Git. Data that lived only in the namespace is still gone. The VM is not in Git. You get it back from the backup image with `oneimage restore`, start it from the new template and give it back to the member with `onevm chown`. Everything changed after the last backup is missing. The case shows how Git and backups complement each other.
:::
::::
