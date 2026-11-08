---
title: Backup and restore
description: RPO and RTO, what Git already covers and what it does not, the cluster with etcd and snapshots, VM backups in OpenNebula and a restore drill.
sidebar:
  order: 2
---

:::assignment
"The new organization is asking what happens in an outage," writes Simone Wyss. "How long are we down, and how much data do we lose? And please try it out once instead of just claiming it."
:::

:::goals
After this chapter you can:

- Set and justify an RPO and an RTO for a service
- Tell apart what Git covers and what needs a backup
- Run the cluster with etcd and regular snapshots
- Back up and restore VMs in OpenNebula
- Practice a restore and measure the time
:::

## RPO and RTO

Two numbers describe what an outage may cost. The **recovery point objective** (RPO) is the point in time to which data must be recovered after an outage. If you back up every night, you can lose up to 24 hours of data. The **recovery time objective** (RTO) is the longest time a service may be down before the damage is no longer acceptable. Both terms come from contingency planning, and NIST defines them in [SP 800-34](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf).

A small RPO calls for frequent backups, a small RTO for a fast restore that has been practiced. Both cost money. The fiduciary office would hate to lose half a day of bookings at the end of the month, while the web shop can easily get by without a day of logs.

A common rule of thumb is the **3-2-1 rule**, which the US agency CISA describes in [Data Backup Options](https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf). You keep three copies of important data on two different media, one of them offsite.

## The limits of Git

Since part 4, the desired state of the platform has been in Git. A new cluster gets all applications, templates and rules from there. Much else is not in Git, though.

| What | Where | Backed up by |
|---|---|---|
| manifests, charts, rules, SealedSecrets | repo `platform` in Gitea | Git, with a copy on the front-end in `~/platform` |
| OpenTofu state | `~/platform/tofu/terraform.tfstate` | not in Git, holds the k3s token |
| cluster state, such as secrets and the Argo CD password | etcd on the server | k3s snapshots |
| k3s token, Sealed Secrets key | server and cluster | `backup-k3s.sh` |
| data in volumes, such as Prometheus, Loki, audit log | disks of the k3s VMs | not in this course |
| member VMs | node datastores | OpenNebula backups |
| OpenNebula database with users, groups, templates and VMs | MariaDB on the front-end | not in this course, [`onedb backup`](https://docs.opennebula.io/7.4/product/operation_references/opennebula_services_configuration/database/#onedb-backup) would be the way |
| passwords, tokens and login files | `~/cc-lab`, `~/.one` and `~/.git-credentials` on the front-end | not in this course |

The Gitea repo lives on the front-end, like the state, the snapshots, the backups, the OpenNebula database and the passwords. If the front-end fails, everything is gone at once. That violates the 3-2-1 rule. One copy belongs on another system, such as your instructor's computer or storage offsite.

![Where the data lives and how it is backed up. On the left the k3s cluster and the nodes. On k3s-server, etcd writes a snapshot every six hours and keeps eight of them. A timer copies the snapshots to ~/backup/k3s on the front-end every six hours, together with the k3s token and the Sealed Secrets key. The volumes on k3s-agent with metrics and logs are not backed up. The member VMs live in the datastores of the nodes, and a backup job backs them up every night at 2:00 to the backup datastore backups on the front-end and keeps seven backups. The front-end also holds the repo platform in Gitea and the working copy ~/platform with the OpenTofu state. An off-site copy is missing, so the lab breaks the 3-2-1 rule. If the front-end fails, everything is gone at once.](../../../../assets/figures/en/p6c2-backup.svg)

## The cluster with etcd

In part 4 you installed k3s with its default database, SQLite. For snapshots, k3s needs etcd. The template from the additions of part 6 starts the server with `--cluster-init` and lets k3s write a snapshot every six hours, keeping eight of them on the server. The [k3s documentation](https://docs.k3s.io/cli/etcd-snapshot) describes the options.

::code{file="platform/operations/repo/tofu/k3s.sh.tftpl"}

The file came into your repo with the copy in chapter 6.1. `tofu plan` only shows a change to the context of the two VMs. The start script runs at every boot, but it stops right away when k3s is already installed. A changed installation therefore only affects new VMs. So you rebuild the cluster. The option `-replace` replaces both VMs. It is one of the [planning options of `tofu plan`](https://opentofu.org/docs/v1.13/cli/commands/plan/#planning-options), which `tofu apply` accepts as well. That is also the first restore drill, because the rebuild shows how much Git alone brings back.

:::caution[Before the rebuild]
The rebuild replaces both k3s VMs along with their disks. Metrics, logs and the audit log of a triage service from milestone 3 are gone afterwards. So put the screenshots and the report of the check `m3` for milestone 3 into your hand-in repo first, and copy the audit log there as well. Also save the Sealed Secrets key with the first block below, or the new cluster cannot decrypt the Grafana password.
:::

```bash
mkdir -p ~/backup/k3s && chmod 700 ~/backup ~/backup/k3s
(umask 077; kubectl -n kube-system get secret -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml > ~/backup/k3s/sealed-secrets-key.yaml)
grep -c 'kind: Secret' ~/backup/k3s/sealed-secrets-key.yaml
```

The last line counts the keys in the copy. Only start the rebuild once it prints at least 1. A 0 means the copy is empty.

```bash
cd ~/platform/tofu
export OPENNEBULA_USERNAME=oneadmin
export OPENNEBULA_PASSWORD=$(cut -d: -f2- ~/.one/one_auth)
tofu apply -replace='opennebula_virtual_machine.k3s["k3s-server"]' -replace='opennebula_virtual_machine.k3s["k3s-agent"]'
```

In the lab, with the whole stack of part 5, `tofu apply` took just under three minutes for this rebuild. For 104 seconds of it the old VMs were waiting to shut down. On smartlearn, `tofu apply` took about a minute. In the lab, OpenNebula also held one of the new VMs in `pending` and reported "Not enough capacity on datastores", because it still had the old value for one node's free disk space. `onevm show <id> | grep SCHED_MESSAGE` shows the reason, and after `onehost forceupdate` the VM ran half a minute later.

Then follow the steps of chapters 4.3 and 4.4. The new VMs have new SSH keys, so you remove the old ones first. `get-kubeconfig.sh` waits up to five minutes until k3s is installed on the new server. If it shows only one node or `NotReady` at the end, that is normal. The `until` loop waits until both nodes are `Ready`. You apply the key before Argo CD, as the [Sealed Secrets documentation](https://github.com/bitnami/sealed-secrets/blob/v0.41.2/README.md#how-can-i-do-a-backup-of-my-sealedsecrets) describes for a restore. If the controller finds no key when it starts, it generates a new one and cannot decrypt the SealedSecret from Git. The last line therefore checks that the key is in the cluster.

```bash
source /etc/cc-lab.env
ssh-keygen -R $CC_K3S_SERVER_IP; ssh-keygen -R $CC_K3S_AGENT_IP
~/cc/platform/get-kubeconfig.sh
until [ "$(kubectl get nodes --no-headers 2>/dev/null | grep -cw Ready)" = 2 ]; do sleep 10; done
kubectl get nodes
kubectl apply -f ~/backup/k3s/sealed-secrets-key.yaml
kubectl -n kube-system get secret -l sealedsecrets.bitnami.com/sealed-secrets-key
```

`kubectl get nodes` shows `k3s-server` with the roles `control-plane,etcd`, so the new server runs on etcd. The last line names a Secret whose name starts with `sealed-secrets-key`. If it reports "No resources found", repeat `kubectl apply` and only start the bootstrap after that. If the loop has not ended after five minutes, stop it with Ctrl+C. `onevm list` then shows whether both VMs run or one is waiting in `pending`.

```bash
~/cc/platform/bootstrap-argocd.sh
```

After about a minute the script reports that Argo CD runs and names the tunnel to the Argo CD interface. It writes the new password to `~/cc-lab/argocd-admin.pass` instead of the terminal, so it does not end up in a screenshot. Argo CD then rolls out everything. The rebuild is done once `kubectl -n argocd get applications` shows every application as `Synced` and `Healthy`.

In the lab, the web shop answered 50 seconds after the bootstrap, and after a good minute and a half all applications were synced and healthy, with the Grafana password decrypted again. From the start of `tofu apply`, a little over five minutes had passed. On smartlearn, the ten applications of the base were synced and healthy about three minutes after the bootstrap. What was lost was the data in the volumes, meaning the metrics and the logs. The course lab also ran Ollama and a triage service from the advanced tasks of milestone 3. Ollama reloaded its model, and the triage service's audit log was gone.

## Saving the snapshots

A snapshot on the server does not help if the server itself is lost. The script copies the snapshots to the front-end, along with the k3s token and the Sealed Secrets key.

:::caution[Keep the token and the key]
Without the old server's token, k3s does not start from a snapshot, because the token encrypts confidential data in the database. Without the Sealed Secrets key, nobody can open a SealedSecret from Git anymore. Keep both in `~/backup/k3s`. They never go into Git, your hand-in repo or a screencast.
:::

::code{file="platform/operations/backup-k3s.sh"}

Ubuntu 26.04 comes without cron. A systemd timer starts the script every six hours, half an hour after the k3s snapshots. The k3s VMs run on UTC and take their snapshots at 0:00, 6:00, 12:00 and 18:00 UTC. The timer therefore counts in UTC as well and copies at 0:30, 6:30, 12:30 and 18:30 UTC, even when the front-end uses another time zone. `systemctl list-timers` shows the runs in the front-end's time zone. On a front-end set to Europe/Zurich, the run at 18:30 UTC shows up as 19:30 in winter. The [systemd.timer manual page](https://manpages.ubuntu.com/manpages/resolute/man5/systemd.timer.5.html) describes the settings of a timer.

Right after the rebuild, k3s has no snapshot yet. The first one only comes at the next full six-hour mark, so take one by hand before the first copy.

```bash
source /etc/cc-lab.env
ssh root@$CC_K3S_SERVER_IP k3s etcd-snapshot save
sudo ~/cc/platform/operations/install-backup-timer.sh
sudo systemctl start cc-backup-k3s.service
ls ~/backup/k3s/snapshots
```

At the end, `install-backup-timer.sh` shows the timer's next run and `ls` the copy of the snapshot. Together with `kubectl get nodes` and the roles `control-plane,etcd`, this output proves requirement 4 of milestone 4. Take a screenshot of it, such as `4-etcd.png`. [Chapter 6.1](../security/#hardening-the-front-end) shows how you take screenshots and copy them to the front-end.

That makes the RPO of the cluster six hours. Anything changed in that time through `kubectl` instead of Git would be gone after a restore. Restoring from a snapshot is part of advanced task B in [chapter 6.5](../advanced/#restoring-from-a-snapshot).

## VMs in OpenNebula

OpenNebula backs up the member VMs itself. Backups go to a datastore of type `BACKUP_DS`. The Community Edition has the drivers rsync and restic, and the [OpenNebula documentation](https://docs.opennebula.io/7.4/product/cluster_configuration/backup_system/) describes both. The course uses rsync, which copies the disks over SSH to the front-end.

::code{file="platform/operations/backup-datastore.sh"}

Since chapter 4.2 only the two k3s VMs run in OpenNebula. You do not back them up this way, since their state lives in Git and in the etcd snapshots. To practice, start the VM `praxis-1` from the template `ubuntu` with 1 GB as `praxis-admin`. A node has no more memory to spare next to k3s. Even this VM only fits thanks to the swap from [chapter 0.4](../../start/prepare/#the-preparation-script). The two VMs on the node reserve 7 GB together, and the node itself needs about 0.6 GB on top. Without swap, memory runs out and the kernel kills the largest VM, the one of k3s. [Chapter 2.5](../../iaas/hosts/#capacity-and-overcommitment) explains why missing memory is worse than missing CPU time. You back up this VM and restore it. So that you can check the restore, create a test file before the backup. `onevm show` gives the number of the VM for `<vm>` and its address in cc-net. You read the values in angle brackets from the output before them, so run the lines one at a time. If you do advanced task A from [chapter 6.5](../advanced/#a-member-of-your-own-task-a), you can use the VM of your own member instead.

`onevm backup` starts a backup by hand, even for a running VM. In the lab, backing up a VM with 1 GB of memory and Ubuntu 26.04 took six to eleven seconds, and the backup image was 1004 MB.

```bash
ONE_AUTH=~/cc-lab/tenants/praxis.auth onetemplate instantiate ubuntu --name praxis-1
onevm show praxis-1 | grep -E '^ID|ETH0_IP='
ssh root@<address-of-the-vm> 'echo before the backup > /root/testfile.txt && sync'
~/cc/platform/operations/backup-datastore.sh
onevm backup -d backups <vm>
oneimage list
```

For a running VM, the backup only holds what is already on its disk. Ubuntu writes changes on the root partition to disk after up to 30 seconds, and `sync` forces it at once. Without `sync`, the test file was missing after the restore in the lab, because the backup had run seven seconds after the file was created. A database inside the VM also keeps data in memory, so its backup is only as complete as after a power cut. OpenNebula does not freeze the file system before the backup, which `onebackupjob show` lists as the setting `FS_FREEZE="NONE"`.

A backup job, as the [OpenNebula 7.4 documentation](https://docs.opennebula.io/7.4/product/virtual_machines_operation/virtual_machine_backups/backup_jobs/) describes it, takes care of regular backups. The script creates one that backs up every night. Without further arguments it runs at 2 a.m. and keeps seven backups. You can pass the hour and the number, for milestone 4 the ones from your [personal values](../../start/parameters/). The hour is in the time zone of the front-end, which `timedatectl` shows.

```bash
~/cc/platform/operations/backup-job.sh praxis-nightly <vm> <hour> <number>
onebackupjob list
```

::code{file="platform/operations/backup-job.sh"}

Sunstone shows the job under "Storage › BackupJobs". The "Info" tab lists the last run and the values of the job.

![The backup job praxis-nightly in Sunstone, logged in as oneadmin. Its last run took 6 seconds. Under Attributes, BACKUP_VMS names VM 27 and DATASTORE_ID the datastore backups with ID 100. FS_FREEZE is NONE and KEEP_LAST is 10. MODE FULL means that every backup copies the whole disk. In the lab, the job runs with the personal values 4 a.m. and ten backups. The front-end runs on UTC and Sunstone converts times to the time zone of the browser, so the run at 4 a.m. shows up as 05:00:06.](../../../../assets/screenshots/sunstone-backupjob.png)

For requirement 5 of milestone 4, your screenshot shows the job in the datastore `backups` with your hour and number of backups, in Sunstone as above or with `onebackupjob show praxis-nightly`. Name it something like `5-backup-job.png`.

Once a VM belongs to a backup job, `onevm backup` refuses it. An extra backup then comes from `onebackupjob backup praxis-nightly`, which backs up all VMs of the job.

To restore, `oneimage restore` turns a backup into a new template with a new image. The OpenNebula documentation calls this a [full restore](https://docs.opennebula.io/7.4/product/virtual_machines_operation/virtual_machine_backups/operations/#full-restore). In the lab, 20 seconds to a minute after the command, the new VM held the test file from before the backup again. Template, image and VM then belong to `oneadmin`, and `onevm chown` gives the VM back to the member. The new VM has a new number. So that the backup job keeps backing it up, you enter it in the job. `oneimage list` gives the number of the backup for `<backup-image>`, `onetemplate list` the new template and `onevm show` the number of the new VM for `<new-vm>`. Run the lines one at a time again.

```bash
onevm terminate --hard praxis-1
oneimage restore -d default <backup-image>
onetemplate list
onetemplate instantiate <new-template> --name praxis-1
onevm list
```

`onevm list` shows the new VM `praxis-1` with its number. While the old one is still going away, two VMs carry this name, so in the next block you use the number of the new one for `<new-vm>`.

```bash
onevm show <new-vm> | grep -E '^ID|ETH0_IP='
ssh root@<address-of-the-vm> cat /root/testfile.txt
onevm chown <new-vm> praxis-admin praxis
echo 'BACKUP_VMS="<new-vm>"' > /tmp/job.tpl
onebackupjob update praxis-nightly /tmp/job.tpl --append
```

In the new VM, `cat` prints `before the backup` again. If the VM does not answer on SSH yet, try again after half a minute. This output proves requirement 6 of milestone 4, so take a screenshot of it, such as `6-restore.png`.

The new VM gets its first backup of its own the next night. If you do not want to wait that long, `onebackupjob backup praxis-nightly` takes it right away.

Sunstone lists the backups under "Storage › Backups".

![The practice's backups under Storage › Backups in Sunstone, in the table view. Every backup is an image of the type Backup in the datastore backups and, like its VM, belongs to praxis-admin and the group praxis. Its name starts with the number of the VM, followed by the day and time on the front-end. Backups 2 and 4 come from earlier VMs named praxis-1 with the numbers 25 and 26, which no longer exist, so a backup stays when its VM is deleted. Backups 6 and 9 belong to the restored VM 27. Its disk has grown since the restore, which is why backup 9 from the night is larger. Sunstone rounds its 1.5 GB up to 2 GB.](../../../../assets/screenshots/sunstone-backups.png)

Backups count against the datastore quota. A member with many large backups needs space there, and that space costs money. Chapter 6.4 comes back to it.

## Outlook

Velero backs up namespaces together with their volumes into object storage and restores single namespaces without resetting the whole cluster. It would need storage such as MinIO and more components on the tight nodes. For the course, Git, the etcd snapshots and the OpenNebula backups are enough.

## The check of milestone 4

Part 6 completes milestone 4. Its check `m4` runs the check `operations` of this part. From chapter 6.1 it tests the hardened front-end, meaning SSH with keys only, the firewall and the automatic updates. For the first test it tries to log in to the front-end without a key itself. Then it tests whether both nodes of the cluster are `Ready`. It adds the applications `sealed-secrets` and `secrets`, the Grafana password from the SealedSecret and the `restricted` profile in every member namespace. From this chapter it tests the etcd snapshots, their copy with the token and the key on the front-end, the timer, the backup datastore, a backup job with a schedule and a backup of a VM. On top of that, `m4` checks the backup job against your personal values, looks for the traces of advanced task A and draws two questions that you answer in the showing of the advanced tasks. Run it on the front-end once the backup job is in place and the VM is restored.

```bash
python3 ~/cc/checks/check.py m4
```

Under "Milestone 4, personal values" the report has the line about the backup job with the hour and the number of backups from your [personal values](../../start/parameters/). If it shows `[!!]`, compare these values with `onebackupjob show praxis-nightly`. The four lines about the new member marked `[+!!]` belong to advanced task A in chapter 6.5 and do not count for the base. You answer the two questions by the rules under [showing the advanced tasks](../../assessment/milestone-4/#showing-the-advanced-tasks). Without your personal values and the questions, `python3 ~/cc/checks/check.py operations` checks only this part with its 14 base checks.

The end of the report proves requirement 7. Take a screenshot of it, such as `7-check-m4.png`, and copy it to `m4/` like the others. The check saves its report in `~/cc-reports/`. As in [chapter 0.5](../../start/tools/#uploading-the-report-and-screenshots), the following block first fetches whatever is new in the repo with `git pull`. Then it puts the report into the folder `reports/` of your hand-in repo and uploads it together with the screenshots in `m4/`. Each of the seven requirements of milestone 4 needs at least one screenshot whose file name starts with its number.

```bash
source /etc/cc-lab.env
cd ~/cc-$CC_CODE
git pull
cp ~/cc-reports/m4-*.txt reports/
git add reports m4
git commit -m "Milestone 4"
git push
```

::::exercise[RPO and RTO]
Set an RPO and an RTO for the four members. Check whether the platform meets them with snapshots every six hours and nightly backups. If you do the advanced tasks from chapter 6.5, add your own member.

:::solution
One possible setting is the fiduciary office with an RPO of four hours and an RTO of four hours at the end of the month, the practice with an RPO of 24 hours and an RTO of one working day, the web shop with an RPO of 24 hours and an RTO of one hour on Saturdays, the municipality with an RPO of 24 hours and an RTO of four hours during counter hours. The nightly VM backups reach an RPO of 24 hours, so the fiduciary office would need more frequent ones. An RTO of one hour requires a practiced restore. In the lab, rebuilding the cluster took a little over five minutes, restoring from the snapshot less than one.
:::
::::

::::exercise[Lab]
Rebuild the cluster with etcd, set up the snapshot copies and a backup job, and restore the VM `praxis-1` from its backup. Measure the times, for example with `date` before `tofu apply`, after the bootstrap and once all applications are healthy. Finally run the check `m4`, which also contains the check `operations` of this part, and add its report to your hand-in repo along with the screenshots of part 6.

:::solution
On the server, `k3s etcd-snapshot ls` shows the snapshots. `~/backup/k3s` holds snapshots, token and key, and `systemctl list-timers cc-backup-k3s.timer` shows the timer's next run. `onebackupjob list` shows the job, and `oneimage list` an image of type `BK`. Afterwards the VM is back and holds the test file. The times are in the range of the lab, a little over five minutes for the rebuild and under a minute for the VM. Without advanced tasks the report of `m4` ends with "15 of 15 base checks passed" and "0 of 4 checks of the advanced tasks passed, they do not count for the base". The two questions for the showing come right before. Your hand-in repo then holds the report in `reports/` and in `m4/` the screenshots of the seven requirements, among them `6-restore.png` and `7-check-m4.png`.
:::
::::

::::exercise[Three copies]
All backups are on the front-end. Describe what a loss of the front-end would take with it, and propose a way to the 3-2-1 rule that fits the budget of a small cooperative.

:::solution
With the front-end, Gitea, the OpenTofu state, the snapshots, the VM backups, the OpenNebula database and the passwords in `~/cc-lab` would be gone at once. The VMs on the nodes would keep running but could no longer be managed. An affordable way is an encrypted copy of the backup datastore, a backup of the OpenNebula database made with `onedb backup` and the folders `~/backup`, `~/platform` and `~/cc-lab`, every night to storage offsite. That can be a disk at a second location or object storage in Switzerland. The key for it does not belong on the same storage.
:::
::::
