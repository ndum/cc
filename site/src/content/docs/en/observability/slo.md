---
title: Alerts and SLOs
description: SLI, SLO and error budget for the web shop, recording rules, a burn rate alert with two time windows, symptoms versus causes and routing through Alertmanager.
sidebar:
  order: 3
---

:::assignment
"We don't want to be woken up for every small error," Veloatelier Matte writes. "But if the shop stops selling on a Saturday, we want to know before customers call."
:::

:::goals
After this chapter you can

- tell SLI, SLO, SLA and error budget apart,
- define an SLO for the web shop and calculate its error budget,
- read and justify a burn rate alert,
- tell alerts on symptoms from alerts on causes,
- explain how Alertmanager groups and routes alerts.
:::

## SLI, SLO and SLA

A service level indicator (SLI) measures how well a service works from the customers' point of view, usually as a share of good events. A service level objective (SLO) is the target for this share over a period. A service level agreement (SLA) is a contract with consequences if the target is missed. An SLA follows in part 6, here it is about the internal target.

| Term | Web shop |
|---|---|
| SLI | share of shop requests answered without a server error |
| SLO | 99.5 % over 7 days |
| Error budget | 0.5 % of the requests may fail |

No service reaches 100 %. The error budget turns the gap into a quantity you can plan with. While it is still full, the bike shop may try new things. Once it is used up, stability and fixes come first.

## Recording rules

The rules are in your repo at `monitoring/config/webshop-slo.yaml`, as a PrometheusRule.

::code{file="platform/observability/repo/monitoring/config/webshop-slo.yaml"}

The first two rules are recording rules. Prometheus regularly computes the error ratio over five minutes and over one hour and stores each as a time series of its own, `webshop:error_ratio:rate5m` and `webshop:error_ratio:rate1h`. Alerts and dashboards read these series instead of repeating the calculation every time. `clamp_min` prevents a division by zero when nobody is shopping.

## Burn rate

An alert on "more than 0.5 % errors" would fire at every short spike. The burn rate asks instead how fast the budget is being used up. A burn rate of 1 uses the budget up in exactly 7 days. At 14.4 it would be gone after 168 / 14.4 ≈ 12 hours. The alert `WebshopErrorBudgetBurn` fires when the error ratio over five minutes and over one hour are both above 14.4 × 0.5 % = 7.2 %, for two minutes.

| Window | Job |
|---|---|
| 1 hour | shows that the problem persists and really eats into the budget |
| 5 minutes | shows that it still exists now and ends the alert soon after the fix |

The lab showed the effect of the long window clearly. A load test had produced tens of thousands of good requests before. When every eighth request failed afterwards, the five-minute ratio jumped to 12 % at once, but the one-hour ratio stayed at 3 to 4 % for a long time. Only after about 25 minutes, and only after the error ratio had risen further, did the alert fire. A short disruption wakes nobody this way, a long one does.

## Symptoms and causes

`WebshopErrorBudgetBurn`, `WebshopSlow` and `WebshopDown` report symptoms, meaning what customers notice. Causes such as a full disk, a pod in a restart loop or a node without memory come as rules of their own with kube-prometheus-stack, for example `KubePodCrashLooping` or `KubePersistentVolumeFillingUp`. In the lab, Prometheus reported `KubePersistentVolumeFillingUp` when the agent's disk was 87 % full. The advanced chapter 5.5 explains why.

Symptoms are good for waking people up, because they certainly affect customers. Causes are good for tickets and dashboards. An alert nobody has to act on should be deleted. Otherwise the team learns to ignore alerts.

## Alertmanager

Prometheus evaluates the rules and sends firing alerts to Alertmanager. Alertmanager groups similar alerts, suppresses repetitions and forwards them to receivers such as email, a chat or a webhook. The routing is part of the kube-prometheus-stack values.

```yaml
route:
  receiver: "null"
  group_by: [alertname, namespace]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - receiver: triage
      matchers:
        - alertname =~ "Webshop.*"
```

Alerts of the web shop go to the receiver `triage`, the service of the advanced chapter 5.6. The routing belongs to the base, working with the service itself to the advanced tasks of milestone 3. All others end up at `null` for now and only appear in the Alertmanager interface on port 30093. `group_wait` waits 30 seconds for more alerts of the same group, and `repeat_interval` repeats an open alert only after four hours.

## Firing an alert

You break the SLO on purpose through Git. The web shop has the variable `FAIL_PERCENT` for that, the share of requests it answers with an error.

```bash
cd ~/platform
sed -i '/FAIL_PERCENT/{n;s/value: "0"/value: "60"/}' webshop/deployment.yaml
git commit -am "New payment module in the web shop"
git push
kubectl run load --restart=Never --image=ghcr.io/ndum/cc/webshop:1.0.0 -- \
  python3 /app/load.py http://<server-address>/ --workers 1 --seconds 1800
```

In Prometheus under "Alerts", `WebshopErrorBudgetBurn` first turns `pending` and after two minutes `firing`. Afterwards you restore the old state with `git revert` and `git push` and delete the pod `load`. In the lab the alert was inactive again a little under six minutes after the revert.

::::exercise[Lab]
Fire the alert as shown above, watch it in Prometheus and Alertmanager and restore the old state. Note the times.

:::solution
After the push, `webshop:error_ratio:rate5m` rises above 7.2 % within a few minutes. How long `webshop:error_ratio:rate1h` takes depends on the traffic of the last hour, without a load test before it is faster. Alertmanager shows the alert with the receiver `triage`. After the revert, the five-minute ratio drops and the alert ends, although the one-hour ratio is still high.
:::
::::

::::exercise[Error budget]
On a Saturday the web shop answers 40,000 requests. How many may fail before that day's budget is used up? What does a burn rate of 6 mean for the week's budget?

:::solution
0.5 % of 40,000 is 200 requests. A burn rate of 6 uses the budget six times as fast as allowed, so the 7-day budget would be gone after 28 hours. A second alert with a lower threshold and longer windows would report that without waking anyone right away.
:::
::::

::::exercise[For the practice]
Praxis Rosenweg wants an alert before patients notice anything. Propose an SLI and an SLO for its appointment portal and justify the values.

:::solution
A possible SLI is the share of calls to the appointment page that answer without an error in under one second. An SLO of 99.9 % over 30 days allows about 43 minutes of downtime per month. The practice has office hours, so you could count only requests between 7 am and 7 pm. Higher targets cost redundancy that a lab with one server does not have.
:::
::::
