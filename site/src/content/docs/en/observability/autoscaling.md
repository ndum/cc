---
title: Autoscaling
description: Requests and limits, the HorizontalPodAutoscaler with CPU, a load test on the web shop, the limits set by quotas and rollouts, and the comparison with OneFlow elasticity.
sidebar:
  order: 4
---

:::assignment
"Things kick off at ten on Saturdays," Veloatelier Matte writes. "During the week the shop gets by with little. On Saturday it should grow without one of you sitting next to it."
:::

:::goals
After this chapter you can:

- Explain how the HorizontalPodAutoscaler calculates the number of pods
- Tune requests, limits and quotas for a deployment with autoscaling
- Run a load test and watch growing and shrinking
- Recognize when more pods no longer help
- Compare autoscaling in Kubernetes with OneFlow elasticity
:::

## The HorizontalPodAutoscaler

The **HorizontalPodAutoscaler (HPA)** adjusts the number of pods of a deployment to a metric, usually CPU. It compares the average utilization of the pods with a target, measured as a percentage of their CPU request. The [Kubernetes 1.36 documentation](https://v1-36.docs.kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/#algorithm-details) gives the calculation.

```text
desired pods = ceil(current pods × current utilization / target)
```

Two pods at 120% with a target of 60% make four pods. The HPA takes the values from the metrics-server that k3s ships.

![The control loop of the HorizontalPodAutoscaler. The metrics-server of k3s measures the CPU of the web shop pods. The HorizontalPodAutoscaler compares the average utilization with the target of 60% of the request and computes pods times utilization divided by target, rounded up, so two pods at 120% give four pods. It stays between 2 and 6 pods and sets replicas in the deployment webshop in the namespace velo. Every pod has a request of 50m and a limit of 250m. Below, the ResourceQuota member caps the limits at 2 CPU. Six pods need 1.5 CPU, and the rest is left for the extra pods of a rollout.](../../../../assets/figures/en/p5c4-hpa.svg)

::code{file="platform/observability/repo/webshop/hpa.yaml"}

The file from the course repo allows two to six pods. Since [chapter 5.2](../logs/#your-values-for-milestone-3), your repo holds the maximum from your [personal values](../../start/parameters/#your-values-for-the-milestones) in `maxReplicas`, four or five pods. When shrinking, the HPA waits five minutes and takes the highest recommendation of that period. If the shop is briefly quiet between two waves, it does not lose its pods right away.

## Two controllers for one number

So far, the number of pods was in Git, the number from chapter 4.4. With the HPA there would be two controllers for the same number. The HPA would raise it to six and Argo CD with self-heal would reset it to three, again and again. The deployment in `observability/repo/webshop` therefore has no `replicas` anymore. If the field is missing in Git, Argo CD leaves it alone, and the HPA sets the number by itself. During the switch the deployment dropped to one pod for about 15 seconds in the lab until the HPA raised it back to its minimum.

::code{file="platform/observability/repo/webshop/deployment.yaml"}

`WORK_MS` makes the shop compute for 20 milliseconds per request so that the load shows up in the CPU. The request of `50m` is the basis of the HPA percentages, the limit of `250m` the ceiling of a pod.

## The load test

The web shop image contains a load generator, `load.py`. It sends requests with several threads as fast as the shop answers and prints throughput, errors and response time every ten seconds. You start it as a pod in the namespace `default` and send the load through Traefik to the address of `k3s-server`, the same way customers come in.

After the alert of chapter 5.3 the web shop may still run more than two pods. If the pod `load` from there is still running, delete it first with `kubectl delete pod load`. Start the load test only once `kubectl -n velo get hpa webshop` shows 2 in the column `REPLICAS` again, otherwise you will not see the shop grow.

```bash
source /etc/cc-lab.env
kubectl delete pod load --ignore-not-found
kubectl run load --restart=Never --image=ghcr.io/ndum/cc/webshop:1.0.0 -- \
  python3 /app/load.py http://$CC_K3S_SERVER_IP/ --workers 20 --seconds 240
kubectl -n velo get hpa webshop --watch
kubectl logs load
```

`--watch` keeps running until you stop it with Ctrl+C. You see the output of the generator afterwards with `kubectl logs load`, or you open a second terminal for it. The finished pod `load` stays in place. The line with `kubectl delete` removes it before the next run, otherwise `kubectl run` reports that it already exists.

In the lab, the HPA showed more than 400% after almost 30 seconds and asked for six pods. A little over 40 seconds after the start, six pods ran at 500% of their request each, which is the limit of `250m`. With two pods the generator reported almost 60 requests per second, 95% of them back within 1.3 s. With six pods it was about 145 requests per second within just under 300 ms. After the load ended, the shop first stayed at six pods because of the five-minute wait. A little over five minutes after the end it shrank to four pods, and 15 seconds later to two. Every surplus pod had stopped after two seconds, because the web shop keeps answering for two seconds after the signal to stop and then exits.

With your maximum the shop only grows to four or five pods, and the column `MAXPODS` shows your value. On smartlearn, with the maximum 4, four pods ran at 470 to 500% of their request. The generator reported about 90 requests per second without errors, 95% of them mostly back within 410 to 550 ms.

In the dashboard of chapter 5.1 the load test looks like this.

![The load test in the dashboard Wolkenwerk platform. On the left, the requests with status 200 rise to a little over 100 per second and drop back to 0 when the load ends. On the right, the response time of the 95th percentile rises from about 50 ms to a little over 200 ms but stays below the limit of 0.5 s.](../../../../assets/screenshots/grafana-loadtest.png)

For requirement 6 of milestone 3 you capture both, the output of `--watch` until the shop shrinks and the load test in the dashboard. As on every screenshot of the terminal, the prompt with the name of the front-end is visible. Save the pictures in the home folder of the client as in chapter 5.3, for example as `6-hpa.png` and `6-loadtest.png`, and copy them to `m3/` with `scp`.

## Limits

The lab revealed three limits that occur in production as well.

### The quota

In a first attempt, each pod had a limit of `500m`. The bike shop's quota allows 2 CPUs of limits. The HPA wanted six pods, four ran, and the fifth failed with this message.

```text
Error creating: pods "webshop-68674cff94-7ln2v" is forbidden: exceeded quota: member, requested: limits.cpu=500m, used: limits.cpu=2, limited: limits.cpu=2
```

The quota of chapter 4.5 protects the other members, but it also limits growth. Whoever sets `maxReplicas` checks whether `maxReplicas` × limit fits into the quota.

### The rollout

With six pods at the edge of the quota, someone changed a variable of the deployment. During a rollout, Kubernetes starts extra pods before it has ended all old ones, by default up to 25% more. There was no room in the quota for these pods, and the rollout got stuck with two new and three old pods. A quota therefore needs headroom for the extra pods of a rollout. With `250m`, six pods plus two extra pods fit into 2 CPUs.

### The bottleneck elsewhere

When the quota was raised in the first attempt, six pods ran instead of four, but throughput only went from 175 to 185 requests per second. The load generator is a single Python process and cannot do more. More pods only help if the shop is the bottleneck. Before scaling, find out where the time is lost.

## Comparison with OneFlow

| | OneFlow, chapter 3.5 | HPA |
|---|---|---|
| Unit | VM | pod |
| Starting a new unit | minutes | seconds |
| Measurement | CPU from OpenNebula monitoring | CPU from the metrics-server |
| Growth in the lab | after about 155 seconds | after about 40 seconds |
| Limit | `max_vms` and the group quota | `maxReplicas` and the ResourceQuota |
| Schedule | `scheduled_policies` with cron | not in the HPA, for example a CronJob that changes `minReplicas` |

Containers start faster than VMs, so the HPA reacts sooner than OneFlow. In both systems a rule measures, compares with a target and changes the number within fixed limits. Both run on the same hardware. Six pods only help if the two cluster VMs have enough CPU.

## The check of milestone 3

Part 5 completes milestone 3. Its check `m3` runs the check `observability` of this part, which tests the OpenNebula and libvirt exporters, whether both nodes of the cluster are `Ready`, and the applications `monitoring`, `monitoring-config`, `loki` and `alloy` in Argo CD. It also tests the jobs `opennebula`, `opennebula-libvirt` and `webshop` in Prometheus, the SLO rules, Alertmanager with its configuration, the bike shop's logs in Loki and the web shop's HPA. For the query to Loki it reads the Grafana password from `~/cc-lab/grafana.pass`. On top of that, `m3` checks your two personal values, looks for the trace of advanced task B and draws two questions that you answer in the showing of the advanced tasks. Run it on the front-end once Prometheus shows all targets as `up`.

```bash
python3 ~/cc/checks/check.py m3
```

Under "Milestone 3, personal values" the report for `mmuster` has the lines "The SLO alert uses the target 99.0 %" and "The web shop HPA allows at most 5 pods". If one of them shows `[!!]`, check your values from [chapter 5.2](../logs/#your-values-for-milestone-3) and whether Argo CD has rolled out the commit yet. The line about a receiver of your own in Alertmanager marked `[+!!]` belongs to advanced task B in chapter 5.5 and does not count for the base. You answer the two questions by the rules under [showing the advanced tasks](../../assessment/milestone-3/#showing-the-advanced-tasks). Without your personal values and the questions, `python3 ~/cc/checks/check.py observability` checks only this part with its 15 base checks.

The check saves its report in `~/cc-reports/`. As in [chapter 0.5](../../start/tools/#uploading-the-report-and-screenshots), the following block first fetches whatever is new in the repo with `git pull`. Then it puts the report into the folder `reports/` of your hand-in repo and uploads it together with the screenshots in `m3/`. Each of the seven requirements of milestone 3 needs at least one screenshot whose file name starts with its number.

```bash
source /etc/cc-lab.env
cd ~/cc-$CC_CODE
git pull
cp ~/cc-reports/m3-*.txt reports/
git add reports m3
git commit -m "Milestone 3"
git push
```

::::exercise[Lab]
Check with `kubectl -n velo get hpa webshop` that the HPA is running. It came into your repo with the additions of chapter 5.1. Run the load test and note when the shop grows and when it shrinks. Show in the dashboard of chapter 5.1 how traffic and response time behave. Finally run the check `m3` and add its report and your screenshots to your hand-in repo.

:::solution
`kubectl -n velo get hpa webshop --watch` shows the utilization rising and the pods growing from two up to your maximum, within a minute in the lab. In the dashboard, requests per second go up and so does the response time. With six pods it stayed below the 0.5 s limit of chapter 5.3 in the lab, and with four pods on smartlearn it was around that limit. After the end, the shop stays at your maximum for five minutes and then drops to two. Without advanced tasks the report of `m3` ends with "17 of 17 base checks passed" and "0 of 1 checks of the advanced tasks passed, they do not count for the base". Your hand-in repo then holds the report in `reports/` and the screenshots in `m3/`, among them `5-alert.png`, `6-hpa.png` and `6-loadtest.png`.
:::
::::

::::exercise[Quota and HPA]
The bike shop wants up to ten pods on Saturdays. What do you have to change in the repo, and what do you check before accepting the pull request?

:::solution
`maxReplicas: 10` in `webshop/hpa.yaml`, and in `members/velo` two more operations in the quota patch, one for `limits.cpu` and one for `pods`. During a rollout Kubernetes starts up to 25% extra pods, which rounds up to three for ten pods. 13 pods at `250m` need 3.25 CPUs of limits, but the template only allows 2 CPUs and 10 pods. With `limits.cpu` of at least `3250m` and `pods` of at least 13, the rollout gets through as well. Requests and memory are still enough for 13 pods. Before accepting, you check whether the two VMs can carry the requests and whether the sum of all members' quotas is still reasonable, as in chapter 4.5.
:::
::::

::::exercise[Saturday at ten]
The bike shop knows that the load starts at ten on Saturdays. How do you prepare the shop so that it doesn't wait for the first wave to grow?

:::solution
A CronJob that sets the HPA's `minReplicas` to four at 9:45 on Saturdays and back in the evening works like the scheduled rule in OneFlow. Since the repo is the source, the change either goes to Git as a planned commit, or `minReplicas` is excluded from the comparison with Git in Argo CD. Otherwise self-heal resets the value at once.
:::
::::
