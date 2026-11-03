---
title: Glossary
description: The terms of the course in one or two sentences, with the chapter that introduces them.
sidebar:
  order: 1
---

The glossary explains the terms of the course briefly and points to the chapter that introduces them. Many cloud terms stay in English on the German pages as well, such as front-end, deployment or snapshot, so you recognize them in documentation, error messages and tools.

| Term | Meaning | Chapter |
|---|---|---|
| 3-2-1 rule | Keep three copies of important data on two different media, one of them offsite. | [6.2](../operations/backup/) |
| Alertmanager | Receives firing alerts from Prometheus, groups similar ones, suppresses repeats and forwards them to receivers such as a webhook. | [5.3](../observability/slo/) |
| Alloy | The agent that reads the logs of the pods on each node and sends them to Loki. | [5.2](../observability/logs/) |
| Ansible | A tool that brings servers into a described target state over SSH. A second run changes only what is not yet right. | [2.2](../iaas/installation/) |
| Application | An Argo CD object that defines which folder of which repo belongs in which namespace. | [4.4](../platform/gitops/) |
| ApplicationSet | Generates Applications from a pattern. In the course it creates one for each folder under `members`. | [4.5](../platform/templates/) |
| Argo CD | A set of controllers in the cluster that reads manifests from Git, compares them with the cluster and brings the cluster in line with Git. | [4.4](../platform/gitops/) |
| Burn rate | How fast a service uses up its error budget. At a burn rate of 1, the budget runs out exactly at the end of the period. | [5.3](../observability/slo/) |
| Chargeback | Usage is charged to the budget of the unit that caused it. | [3.3](../tenants/showback/) |
| Check | A course script that tests the state of your lab and writes a report with a hash. Together with the screenshots, the report of the checks `m1` to `m4` proves the base of a milestone. | [0.5](../start/tools/) |
| Client | The VM you work from on smartlearn, a Kali Linux desktop with a browser for the web interfaces and a terminal for SSH to the servers. With your own hypervisor, your PC takes this role. | [0.2](../start/lab/) |
| Container | A process with its own view of the file system, network and processes. It shares the kernel with the host and brings only its application. | [1.3](../basics/virtualization/) |
| Contextualization | OpenNebula hands a VM its address, name, keys and scripts at boot, and the `one-context` package sets the VM up with them. | [2.4](../iaas/images/) |
| Control plane | The part of Kubernetes that runs the cluster, with the API server, scheduler, controllers and database. In k3s it runs on the server. | [4.3](../platform/kubernetes/) |
| Datastore | A storage location in OpenNebula. `default` holds the images, `system` the disks of running VMs, `files` smaller files, and from chapter 6.2 on `backups` the VM backups. | [2.4](../iaas/images/) |
| Deployment | Keeps a number of identical pods running and replaces them during an update. | [4.3](../platform/kubernetes/) |
| Drift | A difference between the actual state and the code, for example after a manual change. `tofu plan` shows it. | [4.1](../platform/iac/) |
| Elasticity | Resources grow with the load and shrink again, following rules and without manual work. | [3.5](../tenants/advanced/) |
| Error budget | The share of failures an SLO allows. For the web shop that is 0.5% of requests over seven days. | [5.3](../observability/slo/) |
| etcd | A distributed database for the state of a cluster. In part 6 it replaces SQLite so k3s can write snapshots. | [6.2](../operations/backup/) |
| Exporter | A program that offers the metrics of a system in the Prometheus format, such as node_exporter on port 9100. | [5.1](../observability/metrics/) |
| Front-end | The VM on which OpenNebula manages the cloud, with the service `oned`, the scheduler and the web interface. In the course it is also the gateway of the internal network. | [0.2](../start/lab/) |
| Full cost | All the costs of a service, labor and other items as well as hardware and power. On a small platform, labor is the largest share. | [6.4](../operations/cost/) |
| Gateway | The machine through which the VMs of a network reach other networks. In the course the front-end forwards the traffic of the internal network to the internet with NAT. | [0.2](../start/lab/) |
| Gitea | A lightweight Git server with a web interface and pull requests. In the course it runs on the front-end and holds the `platform` repo. | [4.4](../platform/gitops/) |
| GitOps | The desired state is versioned in Git, and an agent in the cluster pulls it and keeps reconciling. Changes therefore go through Git. | [4.4](../platform/gitops/) |
| Grafana | Shows queries against Prometheus and Loki as dashboards. | [5.1](../observability/metrics/) |
| Group | Brings together the users of a tenant in OpenNebula. A group admin manages the people of their member. | [3.1](../tenants/groups/) |
| Hardening | Switching off or shielding everything that is not needed. In the course that means SSH with keys only, a firewall and automatic updates. | [6.1](../operations/security/) |
| Hash | A short checksum that changes as soon as the content changes. The check report ends with the hash of its content. | [0.5](../start/tools/) |
| Helm | Installs packages called charts in Kubernetes, with values you adjust. | [4.2](../platform/opentofu/) |
| HorizontalPodAutoscaler | Adjusts the number of pods of a deployment to a metric, usually CPU as a percentage of the request. HPA for short. | [5.4](../observability/autoscaling/) |
| Hypervisor | Splits a physical machine into several virtual machines, each with its own CPUs, memory and disks. | [1.3](../basics/virtualization/) |
| IaaS | Infrastructure as a service. The provider supplies VMs, networks and storage, and the users run the operating system and the application. | [1.2](../basics/models/) |
| Image | A disk that VMs boot from, such as a prepared Ubuntu. It lives in a datastore. | [2.4](../iaas/images/) |
| Infrastructure as code | Infrastructure is described in files, versioned and created by a tool instead of by hand. | [4.1](../platform/iac/) |
| Inventory | The file in which Ansible finds the servers and their groups, along with values for all of them or for single ones. | [2.2](../iaas/installation/) |
| k3s | A lightweight Kubernetes distribution in a single program. A server contains the control plane, an agent only runs pods. | [4.3](../platform/kubernetes/) |
| Kustomize | Builds the objects for each member from a template and small adjustments without copying the template. | [4.5](../platform/templates/) |
| KVM | The hypervisor in the Linux kernel. It uses the virtualization features of the CPU and runs the VMs on the nodes. | [0.2](../start/lab/) |
| Language model | A model that generates text token by token. It writes likely text and does not check whether it is true. | [5.5](../observability/advanced/) |
| Least privilege | Every identity gets only the smallest set of rights it needs for its job, such as read-only rights for Prometheus in the course. | [6.1](../operations/security/) |
| LimitRange | Sets defaults and upper limits for the requests and limits of each container in a namespace. | [4.5](../platform/templates/) |
| LogQL | The query language of Loki. A query first selects streams by labels and then filters the text. | [5.2](../observability/logs/) |
| Loki | Collects logs centrally and keeps them after a pod is gone. It indexes only a few labels, not the text. | [5.2](../observability/logs/) |
| Namespace | A separate area in the Kubernetes cluster. In the course every member gets its own, with a quota and rules. | [4.3](../platform/kubernetes/) |
| NAT | Network address translation replaces the source address of packets so that machines on an internal network reach the internet through a single address. | [0.2](../start/lab/) |
| Nested virtualization | A VM passes the virtualization features of the CPU on to its own operating system, so VMs can run inside it. | [0.2](../start/lab/) |
| netplan | Sets up the network of an Ubuntu server from YAML files in `/etc/netplan/`. In the course it fixes the addresses of the three servers. | [0.3](../start/parameters/) |
| NetworkPolicy | Defines who may reach a pod over the cluster network. Without a policy, every pod reaches every other. | [4.5](../platform/templates/) |
| nftables | The packet filter of Linux. In the course it holds the NAT of the gateway and the firewall of the front-end, each in a table of its own. | [6.1](../operations/security/) |
| Node | A VM on which OpenNebula runs the virtual machines of the members. The course has two nodes with KVM. | [0.2](../start/lab/) |
| Ollama | Loads open language models and serves them through an HTTP interface. In the advanced tasks of part 5 it can provide the local language model of the platform. | [5.5](../observability/advanced/) |
| OneDeploy | The collection of Ansible playbooks the OpenNebula project uses to install a cloud from a front-end and nodes. | [2.2](../iaas/installation/) |
| OneFlow | Manages services made of several VMs in roles and adjusts the number of VMs by rules. | [3.5](../tenants/advanced/) |
| OpenNebula | A free platform for private clouds. It manages nodes, networks, storage and virtual machines and assigns them to tenants. | [2.2](../iaas/installation/) |
| OpenTofu | An infrastructure-as-code tool and a free fork of Terraform. In the course it creates the k3s VMs in OpenNebula. | [4.2](../platform/opentofu/) |
| PaaS | Platform as a service. The provider also runs the operating system and runtime, and the users bring only their application. | [1.2](../basics/models/) |
| Personal parameters | The values of your lab that come from your personal code, such as host names, the internal network and the VXLAN identifier. They live in `/etc/cc-lab.env`. | [0.3](../start/parameters/) |
| Playbook | A file that describes which steps Ansible runs on which servers. | [2.2](../iaas/installation/) |
| Pod | The smallest unit in Kubernetes, one or more containers that run together on a node and share an address. | [4.3](../platform/kubernetes/) |
| Pod Security Admission | Checks pods against a security profile set by a label on the namespace. The profile `restricted` rejects pods that run as `root`, for example. | [6.1](../operations/security/) |
| Postmortem | A report after an incident with its course, impact, contributing causes and measures, written without looking for someone to blame. | [6.3](../operations/sla/) |
| Private cloud | A cloud for a single organization. When several organizations with shared requirements use one cloud together, as at Wolkenwerk Bern, it is called a community cloud. | [1.2](../basics/models/) |
| Prometheus | Scrapes metrics at fixed intervals and stores them as time series, each a name with labels and timestamped values. | [5.1](../observability/metrics/) |
| PromQL | The query language of Prometheus, for rates, sums and percentiles over time series. | [5.1](../observability/metrics/) |
| Protection needs | How strongly data and services need protecting for confidentiality, integrity and availability, measured by the damage a loss would cause. | [1.4](../basics/sovereignty/) |
| Provider | Translates the blocks in OpenTofu code into calls to an API, such as the OpenNebula API on port 2633. | [4.2](../platform/opentofu/) |
| Pull request | A request in Gitea to merge a branch into `main`. Others review the change before it takes effect. | [4.5](../platform/templates/) |
| Quota | An upper limit on the resources a group or user may take. | [3.2](../tenants/quotas/) |
| RBAC | Role-based access control. Kubernetes allows a request only what a Role or ClusterRole grants the sender through a binding. | [6.1](../operations/security/) |
| Recording rule | A rule that Prometheus evaluates regularly and stores as a new time series, so alerts and dashboards can read it quickly. | [5.3](../observability/slo/) |
| ResourceQuota | Limits the CPU, memory and objects that all pods of a namespace may request together. | [4.5](../platform/templates/) |
| Right-sizing | Adjusting reserved resources to the measured use. | [6.4](../operations/cost/) |
| RPO | Recovery point objective. The point in time to which data must be recovered after an outage. It says how much data loss is acceptable. | [6.2](../operations/backup/) |
| RTO | Recovery time objective. The longest time a service may be down before the damage becomes unacceptable. | [6.2](../operations/backup/) |
| Runbook | Instructions for a recurring incident with its symptoms, first checks and measures. | [6.3](../operations/sla/) |
| SaaS | Software as a service. Users get a finished application and manage only their data and access rights. | [1.2](../basics/models/) |
| Sealed Secrets | Encrypts a Secret with the public key of a controller into a SealedSecret that may go into Git. Only the controller can decrypt it. | [6.1](../operations/security/) |
| Self-heal | Argo CD reverts whatever someone changes in the cluster by hand, so the cluster matches Git again. | [4.4](../platform/gitops/) |
| Self-service | A member takes resources whenever it needs them, within the limits the platform team sets. | [3.4](../tenants/self-service/) |
| Showback | Shows each unit what it used, without any money changing hands. OpenNebula calculates it from prices in the template. | [3.3](../tenants/showback/) |
| SLA | Service level agreement. An agreement with the member on the quality of a service, with consequences if it is missed. | [6.3](../operations/sla/) |
| SLI | Service level indicator. A measurement of how well a service works from the customer's view, usually as the share of good events. | [5.3](../observability/slo/) |
| SLO | Service level objective. The internal target for an SLI over a period. For the web shop it is 99.5% of requests without server errors over seven days. | [5.3](../observability/slo/) |
| Snapshot | A saved state at one point in time, in smartlearn of a whole VM, in k3s of the cluster database. With an etcd snapshot and the server's token, the cluster can be reset to that state. | [0.4](../start/prepare/), [6.2](../operations/backup/) |
| SSH key | A pair of a private and a public key that lets you log in to a server without a password. After the hardening in chapter 6.1, the front-end accepts keys only. | [0.5](../start/tools/) |
| State | The file in which OpenTofu records which object in OpenNebula belongs to which block in the code. It holds secret values and stays out of Git. | [4.1](../platform/iac/) |
| Sunstone | The OpenNebula web interface on port 2616 of the front-end, for the platform team and the members. | [2.1](../iaas/architecture/) |
| Template | Describes a VM in OpenNebula that you can start as many times as you like, such as `ubuntu` in the course. | [2.4](../iaas/images/) |
| Tenant | An organization that shares a cloud with others and sees only its own resources. | [3.1](../tenants/groups/) |
| TLS | Transport Layer Security. Encrypts a connection, makes changes in transit detectable and identifies the server with a certificate. | [6.1](../operations/security/) |
| Triage | The first assessment of an alert. In the advanced tasks you build a service that uses the local model to propose a cause and an action from a fixed list, and a person approves it. | [5.5](../observability/advanced/) |
| VDC | Virtual data center. A slice of the infrastructure that OpenNebula assigns to one or more groups. | [3.1](../tenants/groups/) |
| VXLAN | A way to carry a network for VMs inside UDP packets across an existing network. In the course it connects the VMs of your cloud through the front-end and the nodes. | [2.3](../iaas/networks/) |
