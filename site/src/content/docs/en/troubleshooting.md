---
title: Troubleshooting
description: A procedure for faults in your lab and the common problems of all parts, sorted by layer, with cause and fix.
sidebar:
  order: 3
---

The tables on this page show problems that came up while the course was tried out. Before you search them for your symptom, go through the steps in the next section. They also help with problems that no table lists.

## Handling a fault

1. Pin down the symptom. Who reports what, since when, and what is the exact error message?
2. Narrow down the layer and work from the bottom up. `onehost list` shows the nodes, `onevm list` the VMs, `kubectl get nodes` the cluster and `kubectl -n argocd get applications` the sync with Git. Only then is it worth looking at the application.
3. Read the logs and events of that layer, such as `journalctl -u <service>`, `kubectl describe` and `kubectl get events`, Loki in Grafana or the `MONITORING` section of `onehost show`.
4. Look for the latest change. `git log` in the platform repo shows what came through Git. Also think of anything you or someone else changed by hand.
5. Fix the cause where the state comes from. What comes from Git gets fixed in Git, what comes from code gets fixed in the code. Self-heal immediately reverts a manual change to an object that Argo CD manages.
6. Check that the symptom is gone and run the check of the part. Then write down cause, fix and prevention in a few sentences.

The addresses, ports and commands for these steps are in the [lab reference](../lab-reference/).

## Lab and VMs

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| VMware reports "Virtualized Intel VT-x/EPT is not supported on this platform" | The Windows hypervisor is running, for example because of memory integrity, WSL 2 or Docker Desktop | Use Hyper-V instead of VMware or work on smartlearn | [Own hypervisor](../extras/own-hypervisor/) |
| A node does not start on your PC for lack of memory | Your PC does not have enough RAM for the size of the nodes | Set the nodes to 8 GB | [Own hypervisor](../extras/own-hypervisor/) |
| `ssh` reports "Connection timed out" | The server is not running, the address in `00-eth0.yaml` is wrong or it still has its default address | Check on smartlearn that the VM runs, look at `ip -br addr` and `/etc/netplan/00-eth0.yaml` on its console | [0.3](../start/parameters/) |
| A server can no longer be reached after a reboot | On smartlearn there is a second file in `/etc/netplan/`, on a hypervisor of your own the netplan file is missing | On smartlearn delete the extra file at the console and run `sudo netplan apply`, otherwise paste the generator's netplan block | [0.3](../start/parameters/) |
| `git: command not found` | The minimal Ubuntu install has no Git | `sudo apt install -y git` | [0.4](../start/prepare/) |
| `prepare.sh` reports "This VM has no address" | Wrong role, or the addresses in `/etc/cc-lab.env` do not match the VM | Check the role, compare `ip -br a` with `/etc/cc-lab.env` | [0.4](../start/prepare/) |
| `prepare.sh` reports "sees no vmx or svm flag" | Nested virtualization is off for the node | On smartlearn tell your instructor, on Hyper-V run `Set-VMProcessor -ExposeVirtualizationExtensions $true` with the VM switched off | [0.2](../start/lab/), [Own hypervisor](../extras/own-hypervisor/) |
| Values from `/etc/cc-lab.env` end in an invisible character | The file came through a Windows editor with CR LF line endings | Run `prepare.sh` again, it removes the characters | [0.3](../start/parameters/) |
| The `start` check shows `[!!]` for SSH without a password | The front-end's key is missing on a node | `ssh-copy-id` from the front-end to the node | [0.5](../start/tools/) |

## OpenNebula

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| OneDeploy reports `UNREACHABLE` for a node | The front-end's key is missing on the node, or the node is off | Add the key, start the VM | [2.2](../iaas/installation/) |
| "Please make sure each cluster member can resolve all Front-end hostnames" or "Could not find the requested service rsyslog.service" | `prepare.sh` did not run on every VM | Run `prepare.sh` with the right role on each VM | [2.2](../iaas/installation/) |
| "opennebula-fireedge ... Depends nodejs" or "Failed to set permissions on the temporary files" | The Node.js pin or the acl package is missing on the front-end | Run `sudo ~/cc/lab/prepare.sh fe` again | [2.2](../iaas/installation/) |
| A host shows `err` in `onehost list` | SSH from the front-end as `oneadmin` to the node fails, KVM is missing, or the node is down | `onehost show <node>`, section `MONITORING`, on the node `ls /dev/kvm` | [2.5](../iaas/hosts/) |
| The web interface does not load | Port 2616 cannot be reached from the client | Use the front-end's address in the lab network in the client's browser, check on the front-end that `opennebula-fireedge` runs | [2.2](../iaas/installation/) |
| Commands like `onevm list` fail to log in | `~/.one/one_auth` is missing | Create the file as in 2.2 | [2.2](../iaas/installation/) |
| `onetemplate instantiate` finds no suitable host | A node is disabled or fully reserved | `onehost list`, `onehost enable`, delete VMs no longer needed | [2.5](../iaas/hosts/) |
| A VM stays `pending` with "Not enough capacity on datastores" | The node monitoring still shows the old free space | `onehost forceupdate` | [6.2](../operations/backup/) |
| A member cannot see `cc-net` | The group is still in the VDC `default`, or the cluster is missing from the VDC | `onevdc show wolkenwerk`, run `make-tenants.sh` again | [3.1](../tenants/groups/) |
| A member can no longer start a VM | Its quota is used up | `onegroup show <group>`, clean up VMs or change the quota on purpose | [3.2](../tenants/quotas/) |
| `Not authorized to perform CREATE DOCUMENT` when starting a service | The group may not create documents | `oneacl create "@<gid> DOCUMENT/* CREATE"` | [3.5](../tenants/advanced/) |
| `oneshowback list` shows a cost of 0 | The VM started before the prices were set, or `calculate` is missing | End the VM with `onevm terminate`, start it again from the template and run `oneshowback calculate` after a while | [3.3](../tenants/showback/) |
| The OneFlow service does not grow | The load was too short, or OneFlow averages over all VMs of the role | `oneflow show`, at least three minutes of load, load in every VM of the role | [3.5](../tenants/advanced/) |
| A restored VM belongs to `oneadmin` | `oneimage restore` creates new objects | `onevm chown <vm> <user> <group>` | [6.2](../operations/backup/) |
| `onevm backup` refuses a VM | The VM already belongs to a backup job | `onebackupjob backup praxis-nightly` backs up all VMs of the job | [6.2](../operations/backup/) |
| After the restore, a file created shortly before the backup is missing | Ubuntu had not written it to disk yet | Run `sync` in the VM before the backup | [6.2](../operations/backup/) |

## Network

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| `make-network.sh` finds no interface | SSH from the front-end to node 1 is missing | Add the key, or pass the interface as an argument | [2.3](../iaas/networks/) |
| The VM runs, but SSH to its address hangs | `cc-gateway` is not running, or multicast is blocked in the smartlearn network | `sudo cc-gateway status`, `bridge fdb show dev cc-vxlan` | [2.3](../iaas/networks/) |
| SSH to a VM asks for a password | The key was not stored with `oneadmin` or the group admin when the VM started | Store the key with `oneuser update --append`, end the VM and start it again from the template | [2.4](../iaas/images/), [3.1](../tenants/groups/#working-as-a-member) |
| Downloads inside a VM break off | MTU 1500 instead of 1450 in the network | Check `GUEST_MTU` with `onevnet show cc-net`, restart the VM | [2.3](../iaas/networks/) |
| After hardening, Gitea can no longer be reached from the client | The firewall lets in only SSH and port 2616 from outside | That is intended, reach Gitea through a tunnel from the client | [6.1](../operations/security/) |
| No login possible after hardening | The client's key is missing on the front-end or does not match | Log in at the front-end's console, remove `/etc/ssh/sshd_config.d/10-cc-hardening.conf`, reload SSH with `sudo systemctl reload ssh`, add the key with `ssh-copy-id` and harden again | [6.1](../operations/security/) |

## OpenTofu and k3s

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| `tofu apply` fails because no node has enough memory | VMs from part 2 or 3 are still running | `onehost list`, terminate VMs, delete services with `oneflow delete` | [4.2](../platform/opentofu/) |
| `Inconsistent dependency lock file` | `tofu init` has not run in this copy | `tofu init` in the `tofu` folder | [4.2](../platform/opentofu/) |
| The provider fails to log in | `OPENNEBULA_USERNAME` and `OPENNEBULA_PASSWORD` are not set, for example in a new shell | Repeat the two `export` lines from 4.2 | [4.2](../platform/opentofu/) |
| After a change to the start script, `tofu plan` shows only `update in-place` | The start script exits when k3s is already installed, so a running VM does not pick up the change | `tofu apply -replace` for the VMs concerned | [6.2](../operations/backup/) |
| Nodes do not become `Ready` | The start script is still running or failed | `ssh root@<server> journalctl -u one-context`, `systemctl status k3s`, if needed `tofu apply -replace` | [4.3](../platform/kubernetes/) |
| SSH or kubectl refuse after a rebuild | An old key in `known_hosts`, an old kubeconfig | `ssh-keygen -R <address>`, fetch the kubeconfig again with `get-kubeconfig.sh` | [4.3](../platform/kubernetes/) |
| A node is `NotReady` | k3s is not running on that VM, or the VM is off | `onevm list`, `ssh root@<address> systemctl status k3s` or `k3s-agent` | [4.3](../platform/kubernetes/) |
| The agent's disk is full, `KubePersistentVolumeFillingUp` | The VM's disk is too small for the Ollama image | Set `disk_size` to 30 GB, `tofu apply` | [5.5](../observability/advanced/) |

## GitOps

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| Argo CD shows `authentication required` | Wrong token, or a line break in the secret | Rewrite the secret with `bootstrap-argocd.sh` | [4.4](../platform/gitops/) |
| Applications stay `Unknown` | The `FRONTEND` placeholder was not replaced, or Gitea is not running | `grep -r FRONTEND ~/platform`, `systemctl status gitea` | [4.4](../platform/gitops/) |
| `git push` is rejected | Wrong token or `~/.git-credentials` | Rewrite the file as in 4.4 | [4.4](../platform/gitops/) |
| An Application reports a sync error | A commit contains an invalid manifest | `kubectl -n argocd describe application <name>`, `git log`, undo the commit with `git revert` | [4.4](../platform/gitops/) |
| Pods hang in `ImagePullBackOff` or `ErrImagePull` | Wrong image tag, or the image cannot be reached | `kubectl describe pod`, check the tag in Git | [4.4](../platform/gitops/) |
| A manual change disappears after a few seconds | Self-heal restores the state from Git | That is intended, make the change in Git | [4.4](../platform/gitops/) |
| A new folder under `members` does not show up | The push is missing, or the ApplicationSet has not polled yet | `git log origin/main`, wait a minute | [4.5](../platform/templates/) |
| The first requests to a new pod fail with `Connection refused` | The NetworkPolicy does not know the pod's address yet | Wait a few seconds | [4.5](../platform/templates/) |
| A deployment is synced but has no pods | The quota or the `restricted` profile rejects them | `kubectl -n <ns> get events`, adjust requests or `securityContext` | [4.5](../platform/templates/), [6.1](../operations/security/) |

## Observability

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| `monitoring` stays `OutOfSync` with an annotation that is too large | `ServerSideApply` is missing in the Application | Take the Application from the additions of part 5 | [5.1](../observability/metrics/) |
| Grafana does not start because the secret is missing | `make-secrets.sh` did not run, or after a rebuild the Sealed Secrets key is missing | Run the script or apply the key, restart the pod | [5.1](../observability/metrics/), [6.2](../operations/backup/) |
| The OpenNebula targets are `down` | The exporters were not started, or the address placeholders were not replaced | `install-exporters.sh`, `grep -r _IP ~/platform/monitoring` | [5.1](../observability/metrics/) |
| The OpenNebula exporter reports 0 hosts | It has been running for only a few seconds | Wait half a minute | [5.1](../observability/metrics/) |
| The web shop target is `down` | The NetworkPolicy does not admit `monitoring` | Take the NetworkPolicy from the additions of part 5 | [5.1](../observability/metrics/) |
| Loki is missing the logs of one node | Alloy reads only the pods on its own node, and `NODE_NAME` is missing | Take the values from the additions of part 5 | [5.2](../observability/logs/) |
| The burn rate alert does not fire | The error rate over one hour is still too low | Wait, or raise `FAIL_PERCENT` | [5.3](../observability/slo/) |
| The HPA shows `<unknown>` | metrics-server needs about a minute after starting | Wait | [5.4](../observability/autoscaling/) |
| The HPA stays below `maxReplicas` with the event `exceeded quota` | The pods' requests no longer fit into the quota | Adjust limits or quota, leave room for the rollout | [5.4](../observability/autoscaling/) |

## AI service and triage

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| The model answers very slowly | The VM sees no AVX2 because `host-passthrough` is missing | Add the `cpumodel` block in `main.tf`, restart the VM | [5.5](../observability/advanced/) |
| Your triage service gets no alerts | Alertmanager has no route to your receiver, or the alert is not `firing` | Alertmanager UI on port 30093, logs of the service | [5.5](../observability/advanced/) |
| A new member's alert does not reach your triage service | The Alertmanager route does not match the labels of the new rule | Compare the labels of the rule with the route, for example with `amtool config routes test` | [6.5](../operations/advanced/) |

## Operations

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| A namespace lacks the `restricted` profile | A patch with `op: add` on `/metadata/labels` replaced all labels | Set the label with a merge patch | [5.5](../observability/advanced/), [6.1](../operations/security/) |
| A SealedSecret reports "not managed by SealedSecret" | The secret existed before the controller arrived | Annotate with `sealedsecrets.bitnami.com/managed=true`, restart the controller | [6.1](../operations/security/) |
| The `secrets` Application stays in an error state | The Sealed Secrets controller is not running yet | Wait, the Application retries | [6.1](../operations/security/) |
| `crontab: command not found` | Ubuntu 26.04 ships without cron | Set up the timer with `install-backup-timer.sh` | [6.2](../operations/backup/) |
| New snapshots do not arrive on the front-end | The `cc-backup-k3s.timer` timer is not active | `systemctl list-timers`, enable the timer | [6.2](../operations/backup/) |
| After the cluster rebuild, metrics, logs and the audit log are gone | The volume data lived on the disks of the old VMs | That is expected, take screenshots and copy the audit log before the rebuild | [6.2](../operations/backup/) |
| Argo CD ignores new commits after a restore | The controllers are working with the old state | Restart the controllers in `argocd` and `monitoring` and the Sealed Secrets controller | [6.5](../operations/advanced/) |
| The node swaps and every VM slows down | A member's VM is too large for the free memory | Keep the VM at 1 GB or less | [6.4](../operations/cost/) |
