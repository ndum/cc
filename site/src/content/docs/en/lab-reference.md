---
title: Lab reference
description: The values of your parameters, the addresses and ports of every service, where the access files are and the main commands for each tool.
sidebar:
  order: 2
---

This page collects what you look up again and again while running your lab. The examples use the code `mmuster`. Replace it everywhere with your own values from `/etc/cc-lab.env`. The chapters in the last column explain the reasons behind each entry.

## The cc-lab.env file

All three VMs have the same file `/etc/cc-lab.env`. Scripts and checks read it with `source /etc/cc-lab.env`, which makes the values available as variables.

| Variable | Meaning | Chapter |
|---|---|---|
| `CC_CODE` | your personal code | [0.3](../start/parameters/) |
| `CC_LANG` | language of the reports, `de` or `en` | [0.3](../start/parameters/) |
| `CC_FE_HOST`, `CC_NODE1_HOST`, `CC_NODE2_HOST` | names of the three VMs, such as `mmuster-fe` | [0.3](../start/parameters/) |
| `CC_FE_IP`, `CC_NODE1_IP`, `CC_NODE2_IP` | addresses of the three VMs in the lab network | [0.3](../start/parameters/) |
| `CC_GUEST_NET` | the internal network `cc-net` for the VMs of your cloud, a /24 in 172.16.0.0/12 | [2.3](../iaas/networks/) |
| `CC_GUEST_GATEWAY` | the front-end's address in `cc-net`, ending in `.1` | [2.3](../iaas/networks/) |
| `CC_GUEST_FIRST`, `CC_GUEST_SIZE` | first address and number of addresses for VMs, from `.10` with 200 addresses | [2.3](../iaas/networks/) |
| `CC_VNI`, `CC_VXLAN_GROUP` | identifier and multicast group of the VXLAN | [2.3](../iaas/networks/) |
| `CC_K3S_SERVER_IP`, `CC_K3S_AGENT_IP` | fixed addresses of k3s-server and k3s-agent, ending in `.110` and `.111` | [4.2](../platform/opentofu/) |

## Machines and roles

| Machine | Address | Role |
|---|---|---|
| Front-end `mmuster-fe` | `CC_FE_IP`, plus `CC_GUEST_GATEWAY` in `cc-net` | OpenNebula, gateway with NAT for `cc-net`, Gitea, OpenTofu, kubectl, backups |
| Nodes `mmuster-node1` and `mmuster-node2` | `CC_NODE1_IP`, `CC_NODE2_IP` | KVM and libvirt for the VMs of the cloud |
| `k3s-server` | `CC_K3S_SERVER_IP` | control plane with etcd, also runs pods |
| `k3s-agent` | `CC_K3S_AGENT_IP` | node for pods, with the advanced tasks of part 5 also for Ollama |
| Member VMs | from `CC_GUEST_FIRST` | leases from `cc-net`, shown by `onevnet show cc-net` |
| Client | 192.168.210.10 on smartlearn | Kali Linux with a browser and a terminal, where you work, with your own hypervisor your PC takes this role |

From the client you log in to the front-end with `ssh mmuster-fe`, as set up in [chapter 0.5](../start/tools/). On smartlearn the client is the Kali VM, with your own hypervisor it is your PC. You reach the VMs in `cc-net` only from the front-end, for example with `ssh root@$CC_K3S_SERVER_IP`. On smartlearn the fixed addresses of the three servers are in `/etc/netplan/00-eth0.yaml`, where the second block from chapter 0.3 put them.

## Services and ports

| Service | Port | Runs on | How to reach it | Chapter |
|---|---|---|---|---|
| SSH | 22 | all VMs | `ssh mmuster-fe`, with keys only after hardening | [0.5](../start/tools/), [6.1](../operations/security/) |
| Sunstone | 2616 | front-end | `http://<CC_FE_IP>:2616/` in the client's browser | [2.2](../iaas/installation/) |
| OpenNebula API | 2633 | front-end | CLI and OpenTofu on the front-end | [4.2](../platform/opentofu/) |
| Gitea | 3000 | front-end | `http://<CC_FE_IP>:3000/` before hardening, through a tunnel to the front-end afterwards | [4.4](../platform/gitops/) |
| OpenNebula exporter | 9925 | front-end | Prometheus in the cluster | [5.1](../observability/metrics/) |
| node_exporter | 9100 | front-end and nodes | Prometheus in the cluster | [5.1](../observability/metrics/) |
| Libvirt exporter | 9926 | nodes | Prometheus in the cluster | [5.1](../observability/metrics/) |
| Kubernetes API | 6443 | k3s-server | kubectl with `~/.kube/config` | [4.3](../platform/kubernetes/) |
| Web shop through Traefik | 80 | both nodes | tunnel `-L 8081:<CC_K3S_SERVER_IP>:80` | [4.4](../platform/gitops/) |
| Argo CD | 30080 | k3s-server | tunnel `-L 8080:<CC_K3S_SERVER_IP>:30080` | [4.4](../platform/gitops/) |
| Prometheus | 30090 | k3s-server | tunnel `-L 9090:<CC_K3S_SERVER_IP>:30090` | [5.1](../observability/metrics/) |
| Alertmanager | 30093 | k3s-server | tunnel `-L 9093:<CC_K3S_SERVER_IP>:30093` | [5.3](../observability/slo/) |
| Grafana | 30300 | k3s-server | tunnel `-L 3000:<CC_K3S_SERVER_IP>:30300` | [5.1](../observability/metrics/) |
| Language model and triage service | as in your solution | k3s | as in your solution, for example through a tunnel | [5.5](../observability/advanced/) |

You open a tunnel in the client's terminal, and one connection can carry several `-L` options. While it stays open, the service answers at `http://localhost:<local-port>/` in the client's browser.

```bash
ssh -L 8080:<CC_K3S_SERVER_IP>:30080 -L 3000:<CC_K3S_SERVER_IP>:30300 mmuster-fe
```

To reach Gitea after hardening, forward a free local port to port 3000 of the front-end, for example with `-L 3001:localhost:3000`. Grafana already takes local port 3000.

## Access files

These files live in your user's home directory on the front-end, and only you may read them. Their content never goes into Git, a screencast or a chat with an AI assistant.

| File | Content | Chapter |
|---|---|---|
| `~/cc-lab/oneadmin.pass` | password of `oneadmin` for Sunstone | [2.2](../iaas/installation/) |
| `~/.one/one_auth` | user and password the OpenNebula CLI logs in with | [2.2](../iaas/installation/) |
| `~/cc-lab/tenants/` | passwords and login files of the group admins | [3.1](../tenants/groups/) |
| `~/platform/tofu/terraform.tfstate` | OpenTofu state with secret values, kept out of Git | [4.1](../platform/iac/) |
| `~/.kube/config` | address and certificate for kubectl, full rights on the cluster | [4.3](../platform/kubernetes/) |
| `~/cc-lab/gitea/` | password of the user `platform` and the tokens for Git and Argo CD | [4.4](../platform/gitops/) |
| `~/.git-credentials` | the token Git uses to push to the `platform` repo | [4.4](../platform/gitops/) |
| `~/cc-lab/grafana.pass` | password of `admin` in Grafana | [5.1](../observability/metrics/) |
| `~/backup/k3s/` | etcd snapshots, the k3s token and the Sealed Secrets key | [6.2](../operations/backup/) |

The bootstrap script stores the password of `admin` in Argo CD in a file.

```bash
cat ~/cc-lab/argocd-admin.pass
```

The front-end also has `~/cc` with the course repo, `~/platform` with your platform repo and `~/cc-reports` with the reports of the checks.

## Commands

### OpenNebula

| Command | Purpose |
|---|---|
| `onehost list`, `onehost show <node>` | state, capacity and monitoring of the nodes |
| `onehost flush <node>`, `onehost enable <node>` | empty a node and bring it back into service |
| `onehost forceupdate` | read the monitoring of the nodes again right away |
| `onevm list`, `onevm show <vm>` | VMs with state, node and address |
| `onetemplate instantiate ubuntu --name <name>` | start a VM from the template |
| `onevm terminate <vm>`, `onevm terminate --hard <vm>` | shut down and delete a VM |
| `onevm migrate --live <vm> <node>` | move a running VM to another node |
| `onevm backup -d backups <vm>` | back up a VM to the backup datastore |
| `onebackupjob list`, `onebackupjob backup <job>` | list the backup jobs, start an extra backup |
| `oneimage list`, `oneimage restore -d default <backup-image>` | list images and backups, restore a backup |
| `onevnet show cc-net` | address range and leases of the internal network |
| `onegroup list`, `onegroup show <group>` | member groups with quota and usage |
| `oneuser list` | users and their groups |
| `oneshowback calculate`, `oneshowback list` | calculate and show costs |
| `oneflow list`, `oneflow show <service>` | OneFlow services with roles and cardinality |

### OpenTofu

Run these in `~/platform/tofu` after setting `OPENNEBULA_USERNAME` and `OPENNEBULA_PASSWORD` as in [chapter 4.2](../platform/opentofu/).

| Command | Purpose |
|---|---|
| `tofu init` | download the providers, needed in every new copy of the repo |
| `tofu plan` | show changes and drift without doing anything |
| `tofu apply` | apply the code |
| `tofu apply -replace='opennebula_virtual_machine.k3s["k3s-agent"]'` | rebuild one VM |
| `tofu state list`, `tofu output` | list the objects in the state and the outputs |

### Kubernetes

| Command | Purpose |
|---|---|
| `kubectl get nodes -o wide` | nodes with state and address |
| `kubectl get pods -A -o wide` | all pods with their node |
| `kubectl -n <ns> describe pod <pod>` | events of a pod, such as a failed image pull |
| `kubectl -n <ns> get events --sort-by=.lastTimestamp` | events of a namespace, such as `FailedCreate` |
| `kubectl -n <ns> logs <pod>` | logs of a pod while it exists |
| `kubectl -n <ns> rollout restart deployment <name>` | restart the pods of a deployment |
| `kubectl top nodes`, `kubectl top pods -A` | current CPU and memory use |
| `kubectl -n <ns> get resourcequota,limitrange,networkpolicy` | the limits of a member |
| `kubectl -n <ns> get hpa` | state of the autoscaler |
| `ssh root@<CC_K3S_SERVER_IP> k3s etcd-snapshot ls` | etcd snapshots on the server |

### Argo CD and Git

| Command | Purpose |
|---|---|
| `kubectl -n argocd get applications` | all Applications with sync and health status |
| `kubectl -n argocd describe application <name>` | messages of an Application, such as a sync error |
| `git status`, `git log --oneline` | state of the platform repo in `~/platform` |
| `git add`, `git commit`, `git push` | send a change to Gitea, Argo CD picks it up within a minute |
| `git revert <commit>` | undo a commit with a new commit |

### System services and firewall

| Command | Purpose |
|---|---|
| `systemctl status <service>` | state of a service such as `opennebula`, `gitea` or `cc-gateway` |
| `sudo systemctl restart <service>` | restart a service |
| `journalctl -u <service> -n 50` | latest messages of a service |
| `systemctl list-timers` | timers such as `cc-backup-k3s.timer` with their next run |
| `sudo nft list ruleset` | all nftables tables, including `cc_gateway` and `cc_firewall` |

### Checks

| Command | Purpose |
|---|---|
| `python3 ~/cc/checks/check.py <name>` | run the check of a part, such as `iaas`, `platform` or `operations` |
| `python3 ~/cc/checks/check.py m1` to `m4` | the check of a milestone with your personal values and two questions for the showing, whose report proves the base together with the screenshots, for milestone 1 with the reports of `start`, `install` and `iaas` as well |
| `ls ~/cc-reports` | saved reports with their hash |
