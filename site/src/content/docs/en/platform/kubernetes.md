---
title: Kubernetes as code
description: Installing k3s with a start script in the VM context, server and agent, separate ranges for pods and services, routing with host-gw, the kubeconfig on the front-end and first steps with kubectl.
sidebar:
  order: 3
---

:::assignment
"Two VMs are nice," Simone Wyss writes. "But the bike shop wants containers, not VMs. What is running on your machines now?"
:::

:::goals
After this chapter you can:

- Name the building blocks of a Kubernetes cluster and what sets k3s apart
- Explain how controllers, the scheduler and services keep pods running, place them and make them reachable
- Explain how the start script in the context installs k3s on both VMs
- Explain why the cluster needs its own ranges for pods and services and the host-gw routing
- Examine the cluster from the front-end with kubectl
:::

## Kubernetes in brief

Kubernetes spreads containers across several machines and keeps them running. Like OpenNebula for VMs, it works with a desired state. You describe what should run, and controllers in the cluster keep adjusting the actual state to match. The following objects come up throughout the chapter.

| Term | Meaning |
|---|---|
| Pod | one or more containers that run together on one node and share an address |
| ReplicaSet | keeps a number of identical pods from one template running |
| Deployment | manages ReplicaSets and replaces the pods step by step on an update |
| Service | a fixed address and name for a changing group of pods |
| Ingress | a rule that sends HTTP requests from outside to services |
| Namespace | an area of the cluster for objects that belong together |

## Control plane and nodes

A cluster consists of the control plane, which makes the decisions, and the nodes, which run the containers. A node is a machine, in the course a VM. The [overview of the components](https://kubernetes.io/docs/concepts/overview/components/) describes each part.

The API server is the only way into the cluster. kubectl, Argo CD, the controllers and the nodes all talk to it and to no other component. It checks that a request is authenticated and allowed, then stores the objects in the cluster database, which only it reads and writes. Most clusters use etcd, a distributed key-value store. With a single server and no further options, k3s uses SQLite instead and translates the calls through a layer called kine, as the [datastore documentation](https://docs.k3s.io/datastore) explains. Your cluster runs that way in part 4. In chapter 6.2 you restart the server on etcd with `--cluster-init`, because k3s writes snapshots only with etcd.

The scheduler picks a node for every new pod. The controller manager runs the controllers, small programs that each look after one kind of object, such as deployments, ReplicaSets or nodes. Neither the scheduler nor the controllers start a container themselves. They only read and write objects through the API server.

Every node runs the kubelet. It watches the API server for pods assigned to its node and has the container runtime start them. In k3s the runtime is containerd. Next to it, kube-proxy sets up the forwarding for services on every node, which is covered further down.

k3s bundles the API server, scheduler, controller manager, kubelet and kube-proxy into a single process, as the [k3s architecture](https://docs.k3s.io/architecture) shows. A separate containerd process runs beside it.

## Desired state and controllers

Every Kubernetes object has two parts. `spec` holds what you want, for example two pods running the web shop image. `status` is where the cluster reports what it actually finds. You only write `spec`, and the controllers and the kubelet fill in `status`.

A controller runs in a loop. It reads the desired state, compares it with the actual state and takes the step that shrinks the difference, then starts over. The [controller documentation](https://kubernetes.io/docs/concepts/architecture/controller/) calls this a control loop, and you will often hear it called a reconcile loop.

A deployment shows how controllers build on each other. The deployment controller creates a ReplicaSet that holds the pod template and the number of pods. The ReplicaSet controller counts the pods with matching labels, creates missing pod objects and deletes extra ones. The new pods have no node yet. The scheduler fills one in, and the kubelet on that node starts the containers. When you update the image, the deployment controller creates a second ReplicaSet, scales it up step by step and scales the old one down. The old one stays around with zero pods so that `kubectl rollout undo` can go back to it.

You give no command for any of these steps. If you delete a pod, the ReplicaSet is one short and creates a new one. If a node fails, the node controller marks it `NotReady`. After five minutes Kubernetes evicts its pods, a delay the [documentation on taints](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/#taint-based-evictions) explains. The ReplicaSet then starts replacements on the remaining nodes.

Chapter 4.4 shows the same pattern one level up. Argo CD is a controller whose desired state lives in Git. It compares the repo with the objects in the cluster and corrects any drift, just as the ReplicaSet controller corrects the number of pods.

## Requests, limits and scheduling

Each container can set two values for CPU and memory. The request is what the container is guaranteed to get, and the limit is its ceiling. Kubernetes counts CPU in cores, so `50m` is five hundredths of a core. Memory is counted in bytes, and `64Mi` means 64 mebibytes.

The scheduler plans with requests only. For each node it adds up the requests of the pods already running there and compares the sum with the capacity the node offers. If the new pod no longer fits, the node is ruled out, even when its CPU is nearly idle at that moment. If the pod fits on no node, it stays `Pending` until room frees up. `kubectl describe node` shows under `Allocated resources` how much is already taken.

The node's kernel enforces the limits at runtime through cgroups. A container with a limit of `250m` gets at most a quarter of a core in each time slice. It is held back but keeps running, which is called CPU throttling. Memory cannot be held back like that. If a container needs more than its limit, the kernel kills it (an OOM kill, for out of memory), and the kubelet restarts it. `kubectl describe pod` then shows `OOMKilled` as the reason the last run ended. The [resource management documentation](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) has the rules.

The web shop of chapter 4.4 requests `50m` CPU and `64Mi` memory per pod and may go up to `500m` CPU and `128Mi`. To the scheduler, two pods take up a tenth of a core, while under load they can use up to a whole one. So the sum of the limits on a node may exceed its capacity, as long as not every pod hits its limit at once.

In chapter 4.5 each member gets a namespace with a ResourceQuota, which acts at a different point than the scheduler. When a pod is created, the API server checks whether the total requests and limits in the namespace stay below the quota and rejects the pod otherwise, before the scheduler ever sees it. The quota thus divides the cluster among the members, while the requests spread the pods across the nodes. In chapter 5.4 the web shop has a limit of `250m` for this reason, so that six pods plus the extra pods of an update fit into the quota of two CPUs.

## k3s

k3s is a Kubernetes distribution and a CNCF project. It ships as a single program and needs little memory. Parts that a cluster otherwise needs separately come built in.

| Part | Job |
|---|---|
| flannel | the network between pods on different nodes |
| CoreDNS | names like `webshop.velo.svc.cluster.local` |
| Traefik | the ingress controller on ports 80 and 443 |
| ServiceLB | makes services of type LoadBalancer reachable on the node addresses |
| local-path | storage for pods on the node's disk |
| metrics-server | CPU and memory of pods for `kubectl top` and the autoscaling of part 5 |

A k3s server holds the control plane and runs pods itself. An agent is only a node. With one server and one agent the cluster has a single control plane. If the server fails, the pods on the agent keep running, but nobody can manage the cluster anymore. That is enough for the exercises. A highly available cluster would need three servers.

## The start script

The VMs of chapter 4.2 do not come with Kubernetes. OpenTofu passes a start script to each VM in its context, `START_SCRIPT_BASE64`. The contextualization of chapter 2.4 runs it as `root` every time the VM boots.

::code{file="platform/repo/tofu/k3s.sh.tftpl"}

The file is a template. `templatefile()` in `main.tf` fills in role, addresses, version and token, and the lines with `%{ if }` pick the part for the server or the agent. The first command ends the script if k3s is already there, so a reboot installs nothing twice. The agent keeps asking the server for `/ping` until its API answers and then joins with the token. The version is pinned to `v1.36.5+k3s1`. A rebuild three months from now installs the same version, even if a newer one is out by then.

## Address ranges

Every pod gets an address, and so does every service. Without settings, k3s uses `10.42.0.0/16` for pods and `10.43.0.0/16` for services. In the test setup the lab itself was `10.42.0.0/24`. The pods would have covered the addresses of the lab VMs, and packets to the front-end would have stayed inside the cluster. The start script therefore sets ranges that overlap no network of the course.

| Range | Network |
|---|---|
| lab network of smartlearn or your hypervisor | the network of your three VMs and the client |
| `cc-net` | `CC_GUEST_NET` from your parameters, a network in `172.16.0.0/12` |
| pods | `10.52.0.0/16`, each node gets a `/24` of it |
| services | `10.53.0.0/16` |

## Routing with host-gw

Pods on different nodes need a path to each other. By default, flannel builds a VXLAN for this, just as OpenNebula does for `cc-net`. In the test setup, packets in this second VXLAN inside the nested VMs lost their checksums, and pods on the agent could not reach the DNS on the server.

Both VMs sit in the same network `cc-net`, though, so no overlay is needed. With `--flannel-backend host-gw`, flannel adds a route on each node that sends traffic for the pod network of the other node to that node's address in `cc-net`. Packets travel directly, without extra encapsulation. This only works when all nodes share one layer 2 network. A cluster across several sites would need an overlay again.

![The k3s cluster in cc-net. On the left, kubectl on the front-end uses the kubeconfig to reach the API server on port 6443. Two VMs sit in the internal network cc-net with the range CC_GUEST_NET. k3s-server at CC_K3S_SERVER_IP holds the control plane with the API server and the SQLite database and runs pods itself. k3s-agent at CC_K3S_AGENT_IP joins with the token and runs pods too. Each node gets a /24 of 10.52.0.0/16 for its pods, while services use 10.53.0.0/16 across the whole cluster. Look at the host-gw routes. Each node sends packets for the other node's pod network straight to that node's address in cc-net, with no overlay.](../../../../assets/figures/en/p4c3-cluster.svg)

## The path of a request

A replacement pod has a new name and a new address, often on a different node. If you reached the web shop through a pod address, that address would lead nowhere after the next update.

A service solves this. It gets a fixed virtual address from the service range, here `10.53.0.0/16`, and a name. CoreDNS resolves `webshop.velo.svc.cluster.local` to that address, and within the same namespace `webshop` is enough. The service's selector decides which pods stand behind it, for the web shop the label `app=webshop`. A controller writes the addresses of the matching pods into EndpointSlices, but only those of pods whose readiness probe answers. The [service documentation](https://kubernetes.io/docs/concepts/services-networking/service/) describes the types.

No machine and no process sits behind a service address. Instead, kube-proxy watches services and EndpointSlices and writes rules into the kernel's packet filter on every node. In the lab, the kube-proxy of k3s runs in iptables mode. When a packet goes to the service address, the kernel on the sender's node rewrites it to the address of a randomly chosen pod. From there it travels through the pod network, over the host-gw route to the other node if needed. The [documentation on virtual IPs](https://kubernetes.io/docs/reference/networking/virtual-ips/) explains the kube-proxy modes.

Service addresses only work inside the cluster. From outside, the course uses two paths. A service of type NodePort also opens a port in the range 30000 to 32767 on every node. That is how Argo CD becomes reachable on port 30080 of both VMs from chapter 4.4 on, and Grafana and Prometheus follow in part 5 with ports of their own. You can contact either node, since kube-proxy forwards the request to a pod on the other node too.

The web shop takes the second path, an ingress. An [ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) is an HTTP rule, for the web shop "every path goes to the service `webshop`". An ingress controller has to carry it out, and k3s ships Traefik for that. Traefik itself runs as a pod behind a service of type LoadBalancer, which ServiceLB exposes on ports 80 and 443 of both VMs, as the [k3s documentation on services](https://docs.k3s.io/networking/networking-services) describes. A request to port 80 reaches Traefik first, which finds the rule for the host and path and sends the request to a pod of the service. For web applications the ingress is the usual way in from outside, because many applications share ports 80 and 443 and are told apart by host name and path. The quota in chapter 4.5 forbids members to open their own NodePorts, so the ingress is their only path.

## The kubeconfig

To log in, kubectl needs the address of the API and a certificate. Both are on the server in `/etc/rancher/k3s/k3s.yaml`, with `127.0.0.1` as the address. The script fetches the file over SSH, puts in the server address and saves it as `~/.kube/config`.

::code{file="platform/get-kubeconfig.sh"}

```bash
~/cc/platform/get-kubeconfig.sh
```

The file grants full rights on the cluster, so like `one_auth` it belongs to you alone. After a rebuild of the cluster, the server has new certificates and a new SSH host key. Then you remove the old key with `ssh-keygen -R <server-address>` and fetch the kubeconfig again.

## First steps with kubectl

```bash
kubectl get nodes -o wide
kubectl get pods -A -o wide
kubectl get services -A
kubectl top nodes
```

In the lab both nodes were `Ready` half a minute to two minutes after `tofu apply`. The pods of CoreDNS, Traefik, local-path and metrics-server ran with addresses from `10.52.0.0/16`, and the services had addresses from `10.53.0.0/16`. Traefik was a service of type LoadBalancer on both VM addresses.

A short test shows whether a pod on the agent can resolve names and reach the internet.

```bash
kubectl run test --rm -it --restart=Never --image=busybox:1.37 \
  --overrides='{"spec":{"nodeName":"k3s-agent"}}' -- \
  sh -c 'nslookup kubernetes.default.svc.cluster.local; wget -qO- https://example.com | head -c 100'
```

::::exercise[Lab]
Fetch the kubeconfig and show that both nodes are `Ready` and that pods on the agent resolve names. Note how long it takes from `tofu apply` to `Ready`.

:::solution
`kubectl get nodes` shows `k3s-server` with the role `control-plane` and `k3s-agent` without a role, both `Ready` with version `v1.36.5+k3s1`. The test pod resolves `kubernetes.default.svc.cluster.local` to `10.53.0.1` and loads the page. In the lab it took half a minute to two minutes, longer on slower nodes.
:::
::::

::::exercise[Delete a pod]
Create a deployment with two pods and a service in front of it.

```bash
kubectl create deployment uebung --image=busybox:1.37 --replicas=2 -- sleep 3600
kubectl expose deployment uebung --port 80
kubectl get pods -o wide
kubectl get replicasets,endpointslices
```

Predict what happens to the number of pods, their names and addresses, the ReplicaSet and the service when you delete one of the pods with `kubectl delete pod <name>`. Check your prediction with the same commands, then clean up with `kubectl delete deployment,service uebung`. What would be different if the VM `k3s-agent` failed instead of the pod?

:::solution
The ReplicaSet now counts only one matching pod and creates a new one right away. Still, `kubectl delete pod` only returns after about 30 seconds. `sleep` runs as the first process in the container and ignores the signal to stop, so Kubernetes waits for the grace period of 30 seconds. The kernel treats the first process specially and, apart from SIGKILL, only delivers the signals it sets a handler for itself. That is why the web shop of chapter 4.4 starts behind the small init program `tini`, which passes signals on. The new pod's name starts the same way, `uebung-` plus the ReplicaSet hash, but ends differently, and it has a new address, on the other node if the scheduler decides so. The ReplicaSet stays the same because the template has not changed. The service keeps its address and name, and in its EndpointSlice the new pod's address replaces the old one. If `k3s-agent` fails, `kubectl get nodes` shows it as `NotReady` in under a minute. After five minutes Kubernetes evicts its pods. They stay visible as `Terminating` until the node comes back, but the ReplicaSet starts replacements on `k3s-server` if its capacity covers the requests. If `k3s-server` fails instead, the pods on the agent keep running, but without the API server nothing replaces a pod.
:::
::::

::::exercise[Address ranges]
In the test setup the lab VMs were in `10.42.0.0/24`, and k3s first ran with its default ranges. What happens to a packet from a pod to the front-end at `10.42.0.10`, and where do you change that?

:::solution
The first node receives `10.42.0.0/24` out of `10.42.0.0/16` for its pods, exactly the lab network. The node takes `10.42.0.10` for one of its own pods and sends the packet to its local bridge instead of to the front-end. The ranges are set in `k3s.sh.tftpl` with `--cluster-cidr` and `--service-cidr`. You pick ranges that touch none of your networks and rebuild the cluster, because k3s fixes them at install time.
:::
::::
