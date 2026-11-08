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

In the tables, `<CC_K3S_SERVER_IP>` stands for the address of `k3s-server` and `<CC_K3S_AGENT_IP>` for that of `k3s-agent`. Both come from the first block of the generator, and `grep K3S /etc/cc-lab.env` shows them on the front-end. For `mmuster` they are 172.31.160.110 and 172.31.160.111. `<node>` is the name of a node in the column `NAME` of `onehost list`, which is its address.

## Lab and VMs

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| VMware reports "Virtualized Intel VT-x/EPT is not supported on this platform" | The Windows hypervisor is running, for example because of memory integrity, WSL 2 or Docker Desktop | Use Hyper-V instead of VMware or work on smartlearn | [Own hypervisor](../extras/own-hypervisor/) |
| A node does not start on your PC for lack of memory | Your PC has less than the 48 GB the three VMs need together with Windows, or the nodes have more than 8 GB | Set the nodes to 8 GB, otherwise use a PC with more RAM | [Own hypervisor](../extras/own-hypervisor/) |
| `ssh` stops with "No route to host" or "Connection timed out" | The server is not running, the address in `00-eth0.yaml` is wrong or it still has its default address | Check on smartlearn that the VM runs, look at `ip -br addr` and `/etc/netplan/00-eth0.yaml` on its console | [0.3](../start/parameters/) |
| A server can no longer be reached after a reboot | The new address is not fixed in netplan | Log in at the default address and paste the second block from chapter 0.3 again, on a hypervisor of your own enter the fixed address | [0.3](../start/parameters/) |
| `git: command not found` | The minimal Ubuntu install has no Git | `sudo apt install -y git` | [0.4](../start/prepare/) |
| `prepare.sh` reports "This VM has no address" | Wrong role, or the addresses in `/etc/cc-lab.env` do not match the VM | Check the role, compare `ip -br a` with `/etc/cc-lab.env` | [0.4](../start/prepare/) |
| `prepare.sh` reports "sees no vmx or svm flag" | Nested virtualization is off for the node | On smartlearn tell your instructor, on Hyper-V run `Set-VMProcessor -ExposeVirtualizationExtensions $true` with the VM switched off | [0.2](../start/lab/), [Own hypervisor](../extras/own-hypervisor/) |
| Values from `/etc/cc-lab.env` end in an invisible character | The file came through a Windows editor with CR LF line endings | Run `prepare.sh` again, it removes the characters | [0.3](../start/parameters/) |
| The `start` check shows `[!!]` for SSH without a password | The front-end's key is missing on a node | `ssh-copy-id` from the front-end to the node | [0.4](../start/prepare/) |
| `git clone` of the hand-in repo stops with "port 22: Connection timed out" | The network does not let SSH to GitHub or GitLab through on port 22 | On GitHub, clone over port 443, for example with `git clone ssh://git@ssh.github.com:443/mmuster/cc-mmuster.git`, as [GitHub's guide](https://docs.github.com/en/authentication/troubleshooting-ssh/using-ssh-over-the-https-port) shows. For the school's GitLab, ask your instructor | [0.5](../start/tools/#access-from-the-front-end) |
| `git clone` or `git push` reports "Permission denied (publickey)" | The deploy key is missing from the repo or does not match the front-end's key, for example because you added the client's key | Compare `cat ~/.ssh/id_ed25519.pub` on the front-end with the deploy key in the repo, `ssh -T git@github.com` tests the login to GitHub | [0.5](../start/tools/#access-from-the-front-end) |
| `git push` to the hand-in repo reports "read only" or "does not have write access" | The deploy key may only read | Delete the deploy key and add it again with write access, on GitHub with "Allow write access", on GitLab with "Grant write permissions to this key" | [0.5](../start/tools/#access-from-the-front-end) |
| `git push` to the hand-in repo reports "rejected" and "fetch first" | The repo holds commits from the browser that the front-end lacks | `git pull`, then `git push` again | [0.5](../start/tools/#uploading-the-report-and-screenshots) |
| A command such as `onetemplate update` or `oneuser quota` opens an editor you cannot leave | Without the variable `EDITOR`, the OpenNebula CLI opens the editor vi | In vi, press Esc, type `:q!` and press Enter to leave without saving. `:wq` saves first. After `export EDITOR=nano`, OpenNebula, Git and kubectl open nano. In `~/.bashrc` the line also applies after your next login | [2.4](../iaas/images/), [3.4](../tenants/self-service/) |

## OpenNebula

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| OneDeploy reports `UNREACHABLE` for a node | The front-end's key is missing on the node, or the node is off | Add the key, start the VM | [2.2](../iaas/installation/) |
| "Please make sure each cluster member can resolve all Front-end hostnames" or "Could not find the requested service rsyslog.service" | `prepare.sh` did not run on every VM | Run `prepare.sh` with the right role on each VM | [2.2](../iaas/installation/) |
| "opennebula-fireedge ... Depends nodejs" or "Failed to set permissions on the temporary files" | The Node.js pin or the acl package is missing on the front-end | Run `sudo ~/cc/lab/prepare.sh fe` again | [2.2](../iaas/installation/) |
| A host shows `err` in `onehost list` | SSH from the front-end as `oneadmin` to the node fails, KVM is missing, or the node is down | `onehost show <node>`, section `MONITORING`, on the node `ls /dev/kvm` | [2.5](../iaas/hosts/) |
| The web interface does not load | Port 2616 cannot be reached from the client | Use the front-end's address in the lab network in the client's browser, check on the front-end that `opennebula-fireedge` runs | [2.2](../iaas/installation/) |
| If you log in to Sunstone as a second user, every tab works as that user | Sunstone keeps one session per address in the browser, and all tabs of the same address share it | Log in the second user in a private window of Firefox, which Ctrl+Shift+P opens, or log out first | [3.4](../tenants/self-service/#sunstone-views) |
| Commands like `onevm list` fail to log in | `~/.one/one_auth` is missing | Create the file as in 2.2 | [2.2](../iaas/installation/) |
| A block of the platform team fails with "Not authorized to perform", for example with `ADMIN GROUP` or `MANAGE TEMPLATE` | `ONE_AUTH` still points to the file of a group admin, so the CLI works as that member | `oneuser show` shows who the CLI is working as. `unset ONE_AUTH` removes the variable, then repeat the block | [3.1](../tenants/groups/#working-as-a-member) |
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
| A tunnel reports "Address already in use" and "Could not request local forwarding" | Another tunnel already holds the local port, for example in another tab | Close the old tunnel with Ctrl+C in its tab or pick a free local port, such as `-L 9091:<CC_K3S_SERVER_IP>:30090` | [4.4](../platform/gitops/#access-from-the-client) |
| The client's browser does not reach a service through the tunnel, and the tunnel's tab shows "connect failed" | The address or the port after `-L` is wrong, or the service is not running yet | On the front-end, check the address with `grep K3S /etc/cc-lab.env` and the ports of the services with `kubectl get svc -A`, such as `30080` for Argo CD | [4.4](../platform/gitops/#access-from-the-client) |
| A tunnel does not end with `exit` and the terminal hangs | The tunnel ran with a shell. `ssh` waits until the browser closes its open connections | Press Enter and type `~.`, which disconnects `ssh` at once. Open tunnels with `-N` and no shell, then Ctrl+C closes them | [4.4](../platform/gitops/#access-from-the-client) |
| After hardening, Gitea can no longer be reached from the client | The firewall lets in only SSH and port 2616 from outside | That is intended, reach Gitea through a tunnel from the client | [6.1](../operations/security/) |
| No login possible after hardening | The client's key is missing on the front-end or does not match | Log in at the front-end's console, remove `/etc/ssh/sshd_config.d/10-cc-hardening.conf`, reload SSH with `sudo systemctl reload ssh`, add the key with `ssh-copy-id` and harden again | [6.1](../operations/security/) |

## OpenTofu and k3s

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| `tofu apply` fails because no node has enough memory | VMs from part 2 or 3 are still running | `onehost list`, terminate VMs, delete services with `oneflow delete` | [4.2](../platform/opentofu/) |
| `Inconsistent dependency lock file` | `tofu init` has not run in this copy | `tofu init` in the `tofu` folder | [4.2](../platform/opentofu/) |
| The provider fails to log in | `OPENNEBULA_USERNAME` and `OPENNEBULA_PASSWORD` are not set, for example in a new shell | Repeat the two `export` lines from 4.2 | [4.2](../platform/opentofu/) |
| After a change to the start script, `tofu plan` shows only `update in-place` | The start script exits when k3s is already installed, so a running VM does not pick up the change | `tofu apply -replace` for the VMs concerned | [6.2](../operations/backup/) |
| Nodes do not become `Ready` | The start script is still running or failed | Read `journalctl -u one-context` and `systemctl status k3s` or `k3s-agent` on the VM, for example with `ssh root@<CC_K3S_SERVER_IP>`, if needed `tofu apply -replace` | [4.3](../platform/kubernetes/) |
| SSH or kubectl refuse after a rebuild | An old key in `known_hosts`, an old kubeconfig | `ssh-keygen -R <CC_K3S_SERVER_IP>` and `ssh-keygen -R <CC_K3S_AGENT_IP>`, fetch the kubeconfig again with `get-kubeconfig.sh` | [4.3](../platform/kubernetes/) |
| A node is `NotReady` | k3s is not running on that VM, or the VM is off | `onevm list`, `ssh root@<CC_K3S_SERVER_IP> systemctl status k3s` or `ssh root@<CC_K3S_AGENT_IP> systemctl status k3s-agent` | [4.3](../platform/kubernetes/) |
| After `tofu apply -replace` for the agent, `k3s-agent` stays `NotReady` and its log reports "Node password rejected" | The server still knows the password of the old VM for the name `k3s-agent` | `kubectl delete node k3s-agent`, after which the new agent joins on its own. `ssh root@<CC_K3S_AGENT_IP> journalctl -u k3s-agent` shows its log | [4.2](../platform/opentofu/#changing-replacing-and-rebuilding), [4.3](../platform/kubernetes/) |
| A k3s VM is in `poff` after another VM started | The node ran out of memory and the kernel killed the VM | `free -h` on the node shows the swap. If it is missing, fetch the new state of the course repo there with `git -C ~/cc pull` and run `sudo ~/cc/lab/prepare.sh` with the role of the node. Power off the other VM and start the k3s VM with `onevm resume` | [6.2](../operations/backup/#vms-in-opennebula) |
| The agent's disk is full, `KubePersistentVolumeFillingUp` | Images, models and volumes fill the 30 GB of the VM | Delete models you no longer need and remove unused images with `ssh root@<CC_K3S_AGENT_IP> k3s crictl rmi --prune`. If that is not enough, raise `disk_size` in `tofu/variables.tf` and rebuild the agent with `tofu apply -replace` | [5.5](../observability/advanced/#memory-and-load) |

## GitOps

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| Argo CD shows `authentication required` | Wrong token, or a line break in the secret | Rewrite the secret with `bootstrap-argocd.sh` | [4.4](../platform/gitops/) |
| Applications stay `Unknown` | The `FRONTEND` placeholder was not replaced, or Gitea is not running | `grep -r FRONTEND ~/platform`, `systemctl status gitea` | [4.4](../platform/gitops/) |
| `git push` is rejected | Wrong token or `~/.git-credentials` | Rewrite the file as in 4.4 | [4.4](../platform/gitops/) |
| `git push` to `main` fails with "Not allowed to push to protected branch main" | The branch protection of task C in chapter 4.6 blocks direct pushes, also for the changes of parts 5 and 6 | Bring the change in through a pull request that the second account approves, or use the exception you set in task C | [4.6](../platform/advanced/#branch-protection-task-c) |
| An Application reports a sync error | A commit contains an invalid manifest | `kubectl -n argocd describe application <name>`, `git log`, undo the commit with `git revert --no-edit <commit>` | [4.4](../platform/gitops/) |
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
| Loki is missing all logs | `NODE_NAME` is missing in the values of Alloy. Without the name of its node, Alloy finds no pods | Take the values in `monitoring/alloy.yaml` from the additions of part 5 | [5.2](../observability/logs/#loki-and-alloy) |
| Loki is missing the logs of one node | No Alloy pod runs on that node. Each one reads only the pods of its own node | `kubectl -n monitoring get pods -o wide` shows the Alloy pods with their nodes, `kubectl -n monitoring describe pod <pod>` the reason | [5.2](../observability/logs/#loki-and-alloy) |
| A query such as `{namespace="velo"}` shows metrics instead of logs under "Explore" or reports a "parse error" | Explore opens with the data source Prometheus, and only Loki understands LogQL | Pick the data source Loki at the top left of "Explore" | [5.2](../observability/logs/#logql) |
| The burn rate alert does not fire | Without traffic there are no errors, for example once the pod `load` has finished after 1800 seconds. Or the new pods with `FAIL_PERCENT` are not running yet, or the error rate over one hour is still below the threshold | `kubectl get pod load` shows the load, `kubectl -n velo get pods` the new pods. Wait, raise `FAIL_PERCENT` or delete `load` with `kubectl delete pod load` and start it again | [5.3](../observability/slo/#firing-an-alert) |
| The HPA shows `<unknown>` | metrics-server needs about a minute after starting | Wait | [5.4](../observability/autoscaling/) |
| The HPA stays below `maxReplicas` with the event `exceeded quota` | The limits of the pods or their number no longer fit into the quota, for the web shop `limits.cpu` first | `kubectl -n <ns> describe resourcequota` shows what is full. `maxReplicas` × limit has to fit into the quota with room for the rollout, otherwise adjust the quota or the limits | [5.4](../observability/autoscaling/#the-quota) |

## AI service and triage

| Symptom | Cause | Fix | Chapter |
|---|---|---|---|
| The model answers very slowly | The VM sees no AVX2, and `grep -c avx2 /proc/cpuinfo` prints 0 on it. Your `main.tf` lacks the `cpumodel` block with `host-passthrough`, for example in an older copy | Take the block from `~/cc/platform/repo/tofu/main.tf` and rebuild the VM with `tofu apply -replace` | [5.5](../observability/advanced/#tokens-per-second) |
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
