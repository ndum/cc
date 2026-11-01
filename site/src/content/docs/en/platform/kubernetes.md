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
After this chapter you can

- name the building blocks of a Kubernetes cluster and what sets k3s apart,
- explain how the start script in the context installs k3s on both VMs,
- explain why the cluster needs its own ranges for pods and services and the host-gw routing,
- examine the cluster from the front-end with kubectl.
:::

## Kubernetes in brief

Kubernetes spreads containers across several machines and keeps them running. Like OpenNebula for VMs, it works with a desired state. You describe what should run, and controllers in the cluster keep adjusting the actual state to match.

| Term | Meaning |
|---|---|
| Control plane | API server, scheduler, controllers and the database of the cluster |
| Node | a machine that runs containers, here a VM |
| Pod | one or more containers that run together on one node and share an address |
| Deployment | keeps a number of identical pods running and replaces them on an update |
| Service | a fixed address and name for a changing group of pods |
| Ingress | forwards HTTP requests from outside to services |
| Namespace | an area of the cluster for objects that belong together |

## k3s

k3s is a Kubernetes distribution and a CNCF project. It ships as a single program and needs little memory. What a cluster usually puts together from many parts comes built in.

| Part | Job |
|---|---|
| flannel | the network between pods on different nodes |
| CoreDNS | names like `webshop.velo.svc.cluster.local` |
| Traefik | the ingress controller on ports 80 and 443 |
| ServiceLB | makes services of type LoadBalancer reachable on the node addresses |
| local-path | storage for pods on the node's disk |
| metrics-server | CPU and memory of pods for `kubectl top` and the autoscaling of part 5 |

A k3s server holds the control plane and runs pods itself. An agent is only a node. With one server and one agent the cluster has a single control plane. If the server fails, the pods on the agent keep running, but nobody can manage the cluster anymore. That is enough for the exercises, a highly available cluster would need three servers.

## The start script

The VMs of chapter 4.2 do not come with Kubernetes. OpenTofu passes a start script to each VM in its context, `START_SCRIPT_BASE64`. The contextualization of chapter 2.4 runs it as `root` every time the VM boots.

::code{file="platform/repo/tofu/k3s.sh.tftpl"}

The file is a template. `templatefile()` in `main.tf` fills in role, addresses, version and token, and the lines with `%{ if }` pick the part for the server or the agent. The first line ends the script if k3s is already there, so a reboot installs nothing twice. The agent keeps asking the server for `/ping` until its API answers and then joins with the token. The version is pinned to `v1.36.5+k3s1`. A rebuild three months from now gives the same cluster, not whatever is current by then.

## Address ranges

Every pod gets an address, and so does every service. Without settings, k3s uses `10.42.0.0/16` for pods and `10.43.0.0/16` for services. In the test setup the lab itself was `10.42.0.0/24`. The pods would have covered the addresses of the lab VMs, and packets to the front-end would have stayed inside the cluster. So the start script sets ranges that overlap no network of the course.

| Range | Network |
|---|---|
| lab network of smartlearn or your hypervisor | the network of your three VMs |
| `cc-net` | `CC_GUEST_NET` from your parameters, a network in `172.16.0.0/12` |
| pods | `10.52.0.0/16`, each node gets a `/24` of it |
| services | `10.53.0.0/16` |

## Routing with host-gw

Pods on different nodes need a path to each other. By default, flannel builds a VXLAN for this, just as OpenNebula does for `cc-net`. In the test setup, packets in this second VXLAN inside the nested VMs lost their checksums, and pods on the agent could not reach the DNS on the server.

Both VMs sit in the same network `cc-net`, though, so no overlay is needed. With `--flannel-backend host-gw`, flannel adds a route on each node that sends traffic for the pod network of the other node to that node's address in `cc-net`. Packets travel directly, without extra encapsulation. host-gw only works when all nodes share one layer 2 network. A cluster across several sites would need an overlay again.

## The kubeconfig

kubectl needs the address of the API and a certificate to log in. Both are on the server in `/etc/rancher/k3s/k3s.yaml`, with `127.0.0.1` as the address. The script fetches the file over SSH, puts in the server address and saves it as `~/.kube/config`.

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

In the lab both nodes were `Ready` about two minutes after `tofu apply`. The pods of CoreDNS, Traefik, local-path and metrics-server ran with addresses from `10.52.0.0/16`, and the services had addresses from `10.53.0.0/16`. Traefik was a service of type LoadBalancer on both VM addresses.

A short test shows whether a pod on the agent can resolve names and reach the internet.

```bash
kubectl run test --rm -it --restart=Never --image=busybox:1.37 \
  --overrides='{"spec":{"nodeName":"k3s-agent"}}' -- \
  sh -c 'nslookup kubernetes.default.svc.cluster.local; wget -qO- https://example.com | head -c 100'
```

::::exercise[Lab]
Fetch the kubeconfig and show that both nodes are `Ready` and that pods on the agent resolve names. Note how long it takes from `tofu apply` to `Ready`.

:::solution
`kubectl get nodes` shows `k3s-server` with the role `control-plane` and `k3s-agent` without a role, both `Ready` with version `v1.36.5+k3s1`. The test pod resolves `kubernetes.default.svc.cluster.local` to `10.53.0.1` and loads the page. In the lab it took about two minutes, slower nodes take longer.
:::
::::

::::exercise[Rebuild]
Rebuild the cluster with `tofu destroy` and `tofu apply`. What do you have to do on the front-end afterwards so that kubectl works again, and why?

:::solution
The new VMs have new SSH host keys, and k3s has new certificates. `ssh-keygen -R` removes the old keys of both addresses from `~/.ssh/known_hosts`, otherwise SSH refuses the connection. Then `get-kubeconfig.sh` fetches the new kubeconfig, since the old one no longer fits the cluster.
:::
::::

::::exercise[Address ranges]
In the test setup the lab VMs were in `10.42.0.0/24`, and k3s first ran with its default ranges. What happens to a packet from a pod to the front-end at `10.42.0.10`, and where do you change that?

:::solution
The first node receives `10.42.0.0/24` out of `10.42.0.0/16` for its pods, exactly the lab network. The node takes `10.42.0.10` for one of its own pods and sends the packet to its local bridge instead of to the front-end. The ranges are set in `k3s.sh.tftpl` with `--cluster-cidr` and `--service-cidr`. You pick ranges that touch none of your networks and rebuild the cluster, because k3s fixes them at install time.
:::
::::
