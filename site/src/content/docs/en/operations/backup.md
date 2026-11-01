---
title: Backup and restore
description: RPO and RTO, what Git already covers and what it does not, the cluster with etcd and snapshots, VM backups in OpenNebula and a restore drill.
sidebar:
  order: 2
---

:::assignment
"The new organization is asking what happens in an outage," writes Simone Wyss. "How long are we down, and how much data do we lose? And please don't just claim it, try it once."
:::

:::goals
After this chapter you can

- set and justify an RPO and an RTO for a service,
- tell apart what Git covers and what needs a backup,
- run the cluster with etcd and regular snapshots,
- back up and restore VMs in OpenNebula,
- practice a restore and measure the time.
:::

## RPO and RTO

Two numbers describe what an outage may cost. The recovery point objective (RPO) is the point in time to which data must be recovered after an outage. Whoever backs up every night can lose up to 24 hours of data. The recovery time objective (RTO) is the longest time a service may be down before the damage is no longer acceptable. Both terms come from contingency planning, and NIST defines them in [SP 800-34](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf).

A small RPO calls for frequent backups, a small RTO for a fast restore that has been practiced. Both cost money. The fiduciary office would hate to lose half a day of bookings at the end of the month, while the web shop can easily get by without a day of logs.

A proven rule of thumb is the 3-2-1 rule, as the US agency CISA describes it in [Data Backup Options](https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf). Keep three copies of important data, on two different media, with one of them offsite.

## The limits of Git

Since part 4, the desired state of the platform has been in Git. A new cluster gets all applications, templates and rules from there. Much is not in Git, though.

| What | Where | Backed up by |
|---|---|---|
| manifests, charts, rules, SealedSecrets | repo `platform` in Gitea | Git, with a copy on the front-end in `~/platform` |
| OpenTofu state | `~/platform/tofu/terraform.tfstate` | not in Git, holds the k3s token |
| cluster state, such as secrets and the Argo CD password | etcd on the server | k3s snapshots |
| k3s token, Sealed Secrets key | server and cluster | `backup-k3s.sh` |
| data in volumes, such as Prometheus, Loki, audit log | agent disk | not in this course |
| member VMs | node datastores | OpenNebula backups |

The Gitea repo lives on the front-end. If the front-end fails, Gitea, state, snapshots and backups are gone at once. That violates the 3-2-1 rule. One copy belongs on another system, such as the instructor's computer or storage offsite.

![Where the data lives and how it is backed up. On the left the k3s cluster and the nodes. etcd on k3s-server writes a snapshot every six hours and keeps eight of them. A timer copies the snapshots to ~/backup/k3s on the front-end every six hours, together with the k3s token and the Sealed Secrets key. The volumes on k3s-agent with metrics, logs and the audit log are not backed up. The member VMs live in the datastores of the nodes, and a backup job backs them up every night at 2:00 to the backup datastore backups on the front-end and keeps seven backups. The front-end also holds the repo platform in Gitea and the working copy ~/platform with the OpenTofu state. An off-site copy is missing, so the lab breaks the 3-2-1 rule. If the front-end fails, everything is gone at once.](../../../../assets/figures/en/p6c2-backup.svg)

## The cluster with etcd

In part 4 you installed k3s with its default database, SQLite. For snapshots, k3s needs etcd. The template from the additions of part 6 starts the server with `--cluster-init` and lets k3s write a snapshot every six hours, keeping eight of them on the server. The [k3s documentation](https://docs.k3s.io/cli/etcd-snapshot) describes the options.

::code{file="platform/operations/repo/tofu/k3s.sh.tftpl"}

The file came into your repo with the copy in chapter 6.1. `tofu plan` only shows a change to the context of the two VMs. The start script runs at every boot, but it stops right away when k3s is already installed. A changed installation therefore only affects new VMs. You therefore rebuild the cluster, which is also the first restore drill. The rebuild shows how much Git alone brings back.

Before the rebuild, save the Sealed Secrets key, otherwise the new cluster cannot decrypt the Grafana password.

```bash
mkdir -p ~/backup/k3s && chmod 700 ~/backup ~/backup/k3s
kubectl -n kube-system get secret -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml > ~/backup/k3s/sealed-secrets-key.yaml
cd ~/platform && git add -A && git commit -m "k3s with etcd and snapshots" && git push
cd ~/platform/tofu
export OPENNEBULA_USERNAME=oneadmin
export OPENNEBULA_PASSWORD=$(cut -d: -f2- ~/.one/one_auth)
tofu apply -replace='opennebula_virtual_machine.k3s["k3s-server"]' -replace='opennebula_virtual_machine.k3s["k3s-agent"]'
```

Then follow the steps of chapters 4.3 and 4.4, with the key before Argo CD.

```bash
source /etc/cc-lab.env
ssh-keygen -R $CC_K3S_SERVER_IP; ssh-keygen -R $CC_K3S_AGENT_IP
~/cc/platform/get-kubeconfig.sh
kubectl apply -f ~/backup/k3s/sealed-secrets-key.yaml
~/cc/platform/bootstrap-argocd.sh
```

In the lab, `tofu apply` took 484 seconds. Much of that time the old VMs spent waiting to shut down. OpenNebula also held the new server in `pending` and reported "Not enough capacity on datastores", because the free disk space of one node was still the old value. `onehost forceupdate` solved that at once. After the bootstrap, Argo CD rolled out everything, and a few minutes later all eleven applications were synced and healthy, including the decrypted Grafana password. Ollama loaded its model again. What was lost was the data in the volumes, meaning the metrics, the logs and the triage service's audit log.

## Saving the snapshots

A snapshot on the server does not help if the server itself is lost. The script copies the snapshots to the front-end, along with the k3s token and the Sealed Secrets key. Without the old server's token, k3s does not start from a snapshot, because the token encrypts confidential data in the database.

::code{file="platform/operations/backup-k3s.sh"}

Ubuntu 26.04 comes without cron. A systemd timer starts the script every six hours, half an hour after the k3s snapshots.

```bash
sudo ~/cc/platform/operations/install-backup-timer.sh
sudo systemctl start cc-backup-k3s.service
ls ~/backup/k3s/snapshots
```

That makes the RPO of the cluster six hours. Anything changed in that time through `kubectl` instead of Git would be gone after a restore.

## Restoring the cluster

The drill simulates a serious operator error, someone deletes the namespace `argocd` and with it the GitOps control. First take a snapshot and copy it.

```bash
ssh root@$CC_K3S_SERVER_IP k3s etcd-snapshot save --name vor-uebung
~/cc/platform/operations/backup-k3s.sh
kubectl delete namespace argocd
```

To restore, you stop k3s, reset the database to the snapshot and start k3s again. `--cluster-reset` makes the server the only member of a new etcd cluster with the content of the snapshot.

```bash
snap=$(ls ~/backup/k3s/snapshots | grep vor-uebung | tail -1)
scp ~/backup/k3s/snapshots/$snap root@$CC_K3S_SERVER_IP:/root/
ssh root@$CC_K3S_SERVER_IP "systemctl stop k3s && k3s server --cluster-reset --cluster-reset-restore-path=/root/$snap && systemctl start k3s"
kubectl get namespace argocd
```

In the lab, the API was back after 13 seconds, and so were the namespace `argocd` and all applications. Then a trap showed up. Controllers such as Argo CD and the Prometheus operator watch the cluster continuously and remember the last state they saw. After the reset, that state no longer matched. Argo CD stopped picking up a new commit, and the operator reported watch errors. Restarting the controllers fixed it.

```bash
kubectl -n argocd rollout restart deployment,statefulset
kubectl -n monitoring rollout restart deployment,statefulset
kubectl -n kube-system rollout restart deploy sealed-secrets-controller
```

Only then is the restore complete. Verify it with a small commit that Argo CD has to pick up, and with the check `platform`.

## VMs in OpenNebula

OpenNebula backs up the member VMs itself. Backups go to a datastore of type `BACKUP_DS`. The Community Edition has the drivers rsync and restic, and the [OpenNebula documentation](https://docs.opennebula.io/7.4/product/cluster_configuration/backup_system/) describes both. The course uses rsync, which copies the disks over SSH to the front-end.

::code{file="platform/operations/backup-datastore.sh"}

Since chapter 4.2 only the two k3s VMs run in OpenNebula. You do not back them up this way, their state lives in Git and in the etcd snapshots. To practice, start the VM `praxis-1` from the template `ubuntu` with 1 GB as `praxis-admin`, a node has no more room next to k3s. You back up this VM and restore it. In milestone 4 it is the VM of your own member.

`onevm backup` starts a backup by hand, even for a running VM. In the lab, backing up a VM with 1 GB of memory and Ubuntu 26.04 took eleven seconds, and the backup image was 1004 MB.

```bash
~/cc/platform/operations/backup-datastore.sh
onevm backup -d backups <vm>
oneimage list
```

A backup job takes care of regular backups. The script creates one that backs up every night at 2 a.m. and keeps seven backups.

::code{file="platform/operations/backup-job.sh"}

To restore, `oneimage restore` turns a backup into a new template with a new image. In the lab, the new VM held the test file created before the backup again, about a minute and a half after the command. Template, image and VM then belong to `oneadmin`, and `onevm chown` gives the VM back to the member.

```bash
onevm terminate --hard <vm>
oneimage restore -d default <backup-image>
onetemplate instantiate <new-template> --name <name>
onevm chown <new-vm> <user> <group>
```

Backups count against the datastore quota. A member with many large backups needs space there, and that space costs money, which comes up again in chapter 6.4.

## Outlook

Velero backs up namespaces together with their volumes into object storage and restores single namespaces without resetting the whole cluster. It would need storage such as MinIO and more components on the tight nodes. For the course, Git, the etcd snapshots and the OpenNebula backups are enough.

::::exercise[RPO and RTO]
Set an RPO and an RTO for the four members and for your own member from milestone 4. Check whether the platform meets them with snapshots every six hours and nightly backups.

:::solution
One possible setting is the fiduciary office with an RPO of four hours and an RTO of four hours at the end of the month, the practice with an RPO of 24 hours and an RTO of one working day, the web shop with an RPO of 24 hours and an RTO of one hour on Saturdays, the municipality with an RPO of 24 hours and an RTO of four hours during counter hours. The nightly VM backups reach an RPO of 24 hours, so the fiduciary office would need more frequent ones. An RTO of one hour requires a practiced restore. In the lab, rebuilding the cluster took a good ten minutes, restoring from the snapshot less than one.
:::
::::

::::exercise[Lab]
Rebuild the cluster with etcd, set up the snapshot copies and a backup job, and practice both restores, the namespace `argocd` from the snapshot and the VM `praxis-1` from its backup. Measure the times.

:::solution
`k3s etcd-snapshot ls` on the server shows snapshots, `~/backup/k3s` holds snapshots, token and key, and `systemctl list-timers cc-backup-k3s.timer` shows the next run. `onebackupjob list` shows the job, and `oneimage list` an image of type `BK`. After the drills, Argo CD and the VM are back, and the check `operations` reports the backup checks as passed. The times are in the range of the lab, under a minute for the snapshot and about two minutes for the VM.
:::
::::

::::exercise[Three copies]
All backups are on the front-end. Describe what a loss of the front-end would take with it, and propose a way to the 3-2-1 rule that fits the budget of a small cooperative.

:::solution
With the front-end, Gitea, the OpenTofu state, the snapshots, the VM backups and the OpenNebula database would be gone at once. The VMs on the nodes would keep running but could no longer be managed. An affordable way is an encrypted copy of `~/backup`, `~/platform` and the backup datastore every night to storage offsite, such as a disk at a second location or object storage in Switzerland. The key for it does not belong on the same storage.
:::
::::
