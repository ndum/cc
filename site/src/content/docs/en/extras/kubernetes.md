---
title: Kubernetes basics
description: A refresher before part 4 for anyone who knows Docker, covering pods, deployments, services, ingress, namespaces, ConfigMaps, Secrets, labels, requests, limits, probes, manifests and the kubectl commands you need most.
sidebar:
  order: 4
---

:::goals
After this chapter you can:

- Explain how pods, ReplicaSets and deployments relate and how a pod differs from a Docker container
- Show how labels and selectors tie the objects of the web shop together
- Name the service types and say where the course uses each one
- Describe how Traefik passes a request through an ingress to the web shop
- Recognize namespaces, ConfigMaps, Secrets, requests, limits and probes in a manifest and explain the values
- Work with `kubectl get`, `describe`, `logs`, `exec` and `apply` and say what each command shows
:::

This supplement refreshes the Kubernetes objects you meet from part 4 on. It assumes you have built images and started containers with Docker. How the control plane, the scheduler and the controllers work together is the topic of [chapter 4.3](../../platform/kubernetes/). This page looks at the objects you read and write in manifests, using the web shop of [chapter 4.4](../../platform/gitops/) as the example. The links go to the documentation of Kubernetes 1.36, the version k3s installs in the course.

## Pods

`docker run` starts a container on a single machine. If that machine fails, nothing starts the container somewhere else. Kubernetes spreads containers across several nodes and keeps running what you described. Its smallest unit is the [pod](https://v1-36.docs.kubernetes.io/docs/concepts/workloads/pods/), one or more containers that share a network and volumes. Each pod gets an address of its own, in the lab from `10.52.0.0/16`, and containers in the same pod reach each other over `localhost`. Most pods in the course hold exactly one container. The `svclb-traefik-…` pods in `kube-system`, which k3s uses to open the Traefik ports on every node, show `2/2` in the `READY` column instead, two containers in one pod.

Pods are short-lived. When a pod is deleted or its node fails, a controller replaces it with a new pod that has a different name and address. That is why you rarely create pods yourself. Objects that carry a pod template do it for you, in the course mostly deployments. Alloy in [chapter 5.2](../../observability/logs/) runs as a DaemonSet with one pod per node, and Prometheus and Loki run as StatefulSets, whose pods keep a fixed name and a volume of their own.

## ReplicaSets and deployments

A ReplicaSet keeps a number of identical pods from one template running. A deployment manages ReplicaSets and replaces the pods step by step when the template changes. You only write the deployment, and the cluster creates the ReplicaSet and the pods. The names show the chain, here for two web shop pods in the lab.

```text
NAME                       READY   STATUS    RESTARTS   AGE
webshop-7d4f56cb9b-chxkw   1/1     Running   0          3m30s
webshop-7d4f56cb9b-mjsjj   1/1     Running   0          3m19s
```

The ReplicaSet is called `webshop-7d4f56cb9b`. The second part is a hash of the pod template, and each pod adds a random suffix. When you change the template, for example the image or a variable, a new ReplicaSet with a new hash appears. During the switch the deployment may start a quarter more pods than desired, and a quarter may be missing. These are the defaults of `maxSurge` and `maxUnavailable`, as the [deployment documentation](https://v1-36.docs.kubernetes.io/docs/concepts/workloads/controllers/deployment/) describes. Ten old ReplicaSets stay around with zero pods so that `kubectl rollout undo` can go back.

## Labels and selectors

[Labels](https://v1-36.docs.kubernetes.io/docs/concepts/overview/working-with-objects/labels/) are key-value pairs attached to an object, and a selector picks objects by their labels. With a shared label one object can refer to others without knowing their names. In the web shop, the deployment, the pods and the service all carry the label `app: webshop`.

| Object | Field | Effect |
|---|---|---|
| deployment `webshop` | `spec.selector.matchLabels` | recognizes its pods by the label |
| service `webshop` | `spec.selector` | sends requests to the ready pods with the label |
| ServiceMonitor `webshop` from [chapter 5.1](../../observability/metrics/) | `spec.selector.matchLabels` | has Prometheus scrape the service with the label |
| Alloy from [chapter 5.2](../../observability/logs/) | rule in `discovery.relabel` | copies the label into Loki, where `{app="webshop"}` finds the logs |

The deployment controller also adds the label `pod-template-hash` to every pod, so that pods of the old and the new template can be told apart. Selectors either test for equality, such as `app=webshop`, or for membership in a set, such as `app in (webshop, shop)`. A service only supports equality. On the command line `-l` selects by label, for example `kubectl -n velo get pods -l app=webshop`.

![The objects of the web shop. All objects live in the namespace velo. At the top the path of a request. Traefik carries out the ingress webshop, which sends every path to the port http of the service webshop. The service has a fixed address in the cluster and port 80. Through its selector app=webshop, Kubernetes fills the EndpointSlice with the addresses of the ready pods, and the request goes to port 8080 of one of these pods. In the middle the two pods webshop-7d4f56cb9b-chxkw and webshop-7d4f56cb9b-mjsjj. At the bottom the deployment webshop. It manages the ReplicaSet webshop-7d4f56cb9b, which selects its two pods with app=webshop and pod-template-hash and keeps them running. Notice that the service, the ReplicaSet and the deployment find their pods through the label app=webshop without knowing their names.](../../../../assets/figures/en/ex-kubernetes.svg)

Namespaces carry labels too. Kubernetes sets `kubernetes.io/metadata.name` on each one, and the member NetworkPolicy of [chapter 4.5](../../platform/templates/) uses it to recognize `kube-system`. In [chapter 6.1](../../operations/security/), namespace labels decide which Pod Security profile applies.

## Services

A [service](https://v1-36.docs.kubernetes.io/docs/concepts/services-networking/service/) gives a changing group of pods a fixed name and a fixed virtual address, in the lab from `10.53.0.0/16`. Its type decides where it can be reached from.

| Type | Reachable through | In the course |
|---|---|---|
| `ClusterIP` | the virtual address, inside the cluster only, the default | `webshop` in `velo`, `kube-dns` in `kube-system`, Loki in `monitoring` |
| `NodePort` | also a port between 30000 and 32767 on every node | Argo CD on 30080, Prometheus on 30090, Alertmanager on 30093, Grafana on 30300 |
| `LoadBalancer` | also an address from a load balancer, in k3s ServiceLB on the node addresses | `traefik` in `kube-system` on ports 80 and 443 |
| `ExternalName` | a DNS name outside the cluster, with no address of its own | not used in the course |

The types build on each other. A NodePort service also has a cluster address, and a LoadBalancer service also has ports on the nodes. An excerpt of `kubectl get services -A` right after the cluster was built shows this.

```text
NAMESPACE     NAME         TYPE           CLUSTER-IP      EXTERNAL-IP                     PORT(S)                      AGE
default       kubernetes   ClusterIP      10.53.0.1       <none>                          443/TCP                      45s
kube-system   kube-dns     ClusterIP      10.53.0.10      <none>                          53/UDP,53/TCP,9153/TCP       40s
kube-system   traefik      LoadBalancer   10.53.129.171   172.31.160.110,172.31.160.111   80:32332/TCP,443:30773/TCP   10s
```

Traefik has a cluster address, the addresses of both k3s VMs as external addresses and two randomly assigned node ports on top. The web shop service accepts requests on port 80 and forwards them to the port named `http` of its pods, which the deployment defines as container port 8080.

::code{file="platform/repo/webshop/service.yaml"}

Inside the cluster, CoreDNS resolves `webshop.velo.svc.cluster.local` to the service address, and within the same namespace `webshop` is enough.

## Ingress with Traefik

An [ingress](https://v1-36.docs.kubernetes.io/docs/concepts/services-networking/ingress/) is an HTTP rule that says which service receives the requests for a host and a path. The rule does nothing on its own. An ingress controller has to carry it out, and k3s v1.36.5+k3s1 ships Traefik 3.7 for that. k3s installs it in `kube-system` when the server starts, through its built-in Helm controller, and Traefik runs behind the `traefik` service from the output above, as the [k3s documentation](https://docs.k3s.io/networking/networking-services) describes.

::code{file="platform/repo/webshop/ingress.yaml"}

The web shop rule names no host and only the path `/`, so every request to port 80 of a k3s VM goes to the `webshop` service. It names no class either. The Traefik chart creates the IngressClass `traefik` as the default, so Kubernetes fills it in when the ingress is created. [Chapter 4.3](../../platform/kubernetes/) follows a request from Traefik to the pod, and [chapter 6.1](../../operations/security/) explains how an ingress with a `tls` section would encrypt the traffic.

The Kubernetes project now recommends the Gateway API. The Ingress API is frozen and gets no new features. The course stays with ingress, which k3s supports without extra steps.

## Namespaces

A [namespace](https://v1-36.docs.kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/) is an area of the cluster. Names only have to be unique within a namespace, which is why `velo` and `gemeinde` each have a ResourceQuota called `member`. Quotas, permissions and network rules apply per namespace, so every member gets its own in [chapter 4.5](../../platform/templates/).

| Namespace | Contents in the lab |
|---|---|
| `kube-system` | the parts of k3s such as CoreDNS, Traefik and metrics-server, from part 6 on also the Sealed Secrets controller |
| `argocd` | Argo CD and its applications |
| `velo`, `gemeinde` | the members with quota, LimitRange and NetworkPolicy, the web shop in `velo` |
| `monitoring` | Prometheus, Alertmanager, Grafana, Loki and Alloy from part 5 on |
| `default` | whatever is created without a namespace, such as the test pods of chapter 4.3 |

Without `-n`, kubectl works in the `default` namespace, and `-A` covers all of them. Nodes, PersistentVolumes, IngressClasses and namespaces themselves belong to no namespace, and `kubectl api-resources --namespaced=false` lists every kind of that sort.

## ConfigMaps and Secrets

As with Docker, configuration stays out of the image. A pod mounts it as environment variables or as files in a volume. A [ConfigMap](https://v1-36.docs.kubernetes.io/docs/concepts/configuration/configmap/) holds data that is not confidential, at most 1 MiB. A [Secret](https://v1-36.docs.kubernetes.io/docs/concepts/configuration/secret/) is meant for passwords, tokens and keys. Its values are only Base64 encoded, though, and by default they sit unencrypted in the cluster database. Anyone allowed to create pods in a namespace can read its Secrets. When a ConfigMap changes, a pod sees the new files after a while, but new environment variables only after a restart.

| Object | In the course | Chapter |
|---|---|---|
| ConfigMap | the Alloy configuration, the Grafana dashboards with the label `grafana_dashboard` | [5.1](../../observability/metrics/), [5.2](../../observability/logs/) |
| Secret | Argo CD's access to Gitea, the Grafana password | [4.4](../../platform/gitops/), [5.1](../../observability/metrics/) |
| SealedSecret | the Grafana password encrypted in Git, which a controller turns into the Secret | [6.1](../../operations/security/) |

The web shop uses neither. Its settings, `SHOP_NAME` and from part 5 on `WORK_MS` and `FAIL_PERCENT`, are written as `env` straight into the pod template of the deployment. Any change to them creates a new ReplicaSet and with it a rollout, which is how [chapter 5.2](../../observability/logs/) injects a fault with `FAIL_PERCENT`.

## Requests and limits

Each container can set two values for CPU and memory. The request is what the scheduler reserves for it, and the limit is the ceiling. Above its CPU limit the kernel throttles the container, and above its memory limit the kernel may kill it. `50m` means five hundredths of a core, and `64Mi` means 64 mebibytes. The web shop requests `50m` and `64Mi` and may use up to `500m` and `128Mi`, from part 5 on only up to `250m` of CPU.

In the member namespaces, a LimitRange sets values for containers that bring none, and a ResourceQuota caps the total, both from [chapter 4.5](../../platform/templates/). The HorizontalPodAutoscaler of [chapter 5.4](../../observability/autoscaling/) measures CPU as a percentage of the request. [Chapter 4.3](../../platform/kubernetes/) explains how the scheduler plans with requests, and the [resource management documentation](https://v1-36.docs.kubernetes.io/docs/concepts/configuration/manage-resources-containers/) has the rules.

## Probes

The kubelet uses [probes](https://v1-36.docs.kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/) to check whether a container is healthy. Docker has the `HEALTHCHECK` instruction for this, while Kubernetes distinguishes three probes with different consequences.

| Probe | Question | When it fails |
|---|---|---|
| Readiness | Can the container accept requests? | Its address leaves the EndpointSlice of the service, the pod keeps running. |
| Liveness | Is the container still working? | The kubelet restarts the container. |
| Startup | Has the container finished starting? | The kubelet restarts the container. The other two probes wait until it succeeds. |

The web shop checks `/healthz` for readiness and liveness and has no startup probe. By default the kubelet probes every 10 seconds, waits one second for an answer and counts the probe as failed after three failures in a row. The web shop waits three seconds with `timeoutSeconds: 3`. Under the load of part 5 a pod answers more slowly, and a failed liveness probe would restart it in the middle of the load test. Readiness also decides when a new pod counts as available during a rollout.

## Manifests and the declarative model

A manifest describes an object in YAML. `apiVersion` and `kind` name its type, `metadata` holds the name, namespace, labels and annotations, and `spec` the desired state. The cluster writes `status` itself and reports there what it actually finds. There are three ways to manage objects.

| Technique | Example | In the course |
|---|---|---|
| Imperative commands | `kubectl create deployment`, `kubectl scale` | short tests in chapters 4.3 and 4.5 |
| Imperative object configuration | `kubectl create -f webshop.yaml` | not used |
| Declarative object configuration | `kubectl apply -f folder/` | Argo CD for your whole repo, you yourself mainly at the bootstrap with `root.yaml` |

`kubectl apply` creates missing objects and changes existing ones until they match the manifest. To do so, kubectl keeps the last applied version in the annotation `kubectl.kubernetes.io/last-applied-configuration`. If you remove a field from the manifest, `apply` removes it from the cluster too. Fields that never appear in the manifest stay untouched, even when someone else set them.

Part 5 relies on that rule. The web shop deployment no longer names a number of pods there and leaves the `replicas` field to the HorizontalPodAutoscaler. In part 4 the manifest still says `replicas: 2`, which is why Argo CD in [chapter 4.4](../../platform/gitops/) reverts a `kubectl scale` right away. `kubectl diff` shows what an `apply` would change before you run it. [Chapter 4.1](../../platform/iac/) goes deeper into declarative and imperative, and the [object management documentation](https://v1-36.docs.kubernetes.io/docs/concepts/overview/working-with-objects/object-management/) describes all three techniques.

## kubectl commands

| Command | Shows or does |
|---|---|
| `kubectl get` | a list of objects, with `-o wide` including node and address, with `-o yaml` the whole object with `spec` and `status` |
| `kubectl describe` | one object in readable form with its state and the events of the last hour, such as a failed image pull |
| `kubectl logs` | standard output and standard error of a container, with `--previous` those of the run before the last restart, only while the pod exists |
| `kubectl exec` | runs a command in a running container, such as `env` or `cat` |
| `kubectl apply` | applies manifests, with `-k` a folder with Kustomize |
| `kubectl explain` | describes a manifest field the way the API server of your cluster knows it |

The [kubectl quick reference](https://v1-36.docs.kubernetes.io/docs/reference/kubectl/quick-reference/) collects more examples, and the [lab reference](../../lab-reference/) lists the commands of the course.

## In the lab

From chapter 4.4 on the web shop runs in your cluster. The following commands on the front-end only read and change nothing.

```bash
kubectl -n velo get deployment,replicaset,pod --show-labels
```

The output shows the chain from the deployment through the ReplicaSet to the pods, and on the pods the labels `app=webshop` and `pod-template-hash`.

```bash
kubectl -n velo get service,endpointslice,ingress
```

You see the address of the service, the addresses of the ready pods in the EndpointSlice and, for the ingress, the class `traefik` with the addresses of both k3s VMs.

```bash
kubectl -n velo describe pod -l app=webshop
```

For each pod it lists requests, limits, both probes and at the end the events of the last hour, which are often empty for a pod that has been running for a while.

```bash
kubectl -n velo logs deployment/webshop --tail=5
kubectl -n velo exec deployment/webshop -- env
```

The first command prints the last lines of one pod, mostly probe requests to `/healthz`. The second lists the container environment with `SHOP_NAME` from the manifest and variables such as `WEBSHOP_SERVICE_HOST`, which Kubernetes sets for the services in the namespace.

```bash
kubectl -n velo get deployment webshop -o yaml
kubectl explain deployment.spec.strategy.rollingUpdate
```

The object shows `spec` from Git, `status` from the cluster and the annotation `argocd.argoproj.io/tracking-id`, which ties it to its Argo CD application. `kubectl explain` describes `maxSurge` and `maxUnavailable` with their defaults.

::::exercise[Lab]
Use the commands above to follow a request to the web shop from the ingress to the container. For each step, name the object and the selector or port that links it to the next one. Then explain what happens when a pod fails its readiness probe three times. How would a failing liveness probe differ?

:::solution
The ingress `webshop` has the class `traefik` and sends every path to the service `webshop` on the port `http`. The service selects the pods with `app=webshop` and forwards port 80 to the container port named `http`, which is 8080. Its EndpointSlice holds the addresses of the ready pods. The pods belong to the ReplicaSet `webshop-<hash>`, which selects with `app=webshop` and `pod-template-hash` and in turn belongs to the deployment `webshop`. `describe` shows both probes as `http-get http://:http/healthz` with `timeout=3s period=10s #success=1 #failure=3`.

After three failed readiness probes, Kubernetes removes the pod's address from the EndpointSlice. The pod keeps running but gets no requests until the probe succeeds again. After three failed liveness probes, the kubelet restarts the container. `kubectl get pods` then counts up `RESTARTS`, and `kubectl logs --previous` shows the logs from before the restart.
:::
::::
