---
title: Security
description: Protection needs of the members, a hardened front-end with SSH keys, a firewall and updates, the restricted profile for pods, encrypted secrets in Git and who may do what on the platform.
sidebar:
  order: 1
---

:::assignment
"A fifth organization wants to become a member," writes Beat Kläy, president of the board. "Before we say yes, I want to know how well we are protected. Who can get onto the servers, where are the passwords, and what happens if a member brings an insecure application?"
:::

:::goals
After this chapter you can

- assess a member's protection needs for confidentiality, integrity and availability,
- harden the front-end with SSH keys, a firewall and automatic updates,
- require the restricted profile for member pods with Pod Security Admission,
- store secrets encrypted in Git,
- show who may do what on your platform.
:::

You study part 6 on your own, and block 6 is work time for UN4. The chapters build on your lab as it stands after part 5.

## Protection needs

Security costs time and convenience, so it starts with the question of what needs protecting. The protection needs of data and services are assessed against three goals.

| Goal | Question | Example at Wolkenwerk |
|---|---|---|
| Confidentiality | Who may see the data? | patient data of Praxis Rosenweg |
| Integrity | Does the data stay correct and complete? | bookkeeping of Treuhand Aaregg |
| Availability | Is the service there when it is needed? | counter services of Gemeinde Hinterbüel |

Three levels are common, normal, high and very high. What counts is the damage a loss would cause, to people, to the member and to Wolkenwerk. Under Art. 5 of the Swiss data protection act, health data is particularly sensitive, and doctors are bound by professional secrecy under Art. 321 of the Swiss criminal code. Chapter 1.4 introduced both. For the practice, confidentiality is therefore very high. For the bike shop's web shop, availability on Saturdays matters most.

Measures follow from the protection needs. The platform needs a baseline for everyone, and members with high needs get more, such as a VM of their own instead of a namespace, or more frequent backups.

## The attack surface of the lab

Only what can be reached can be attacked. After part 5, your front-end accepts connections on several ports.

| Port | Service | Who needs it |
|---|---|---|
| 22 | SSH | you |
| 2616 | OpenNebula web interface | you and the members |
| 2633 | OpenNebula API | OpenTofu on the front-end itself |
| 3000 | Gitea | Argo CD in the cluster, you through a tunnel |
| 9100, 9925 | exporters for Prometheus | Prometheus in the cluster |

The nodes and the VMs in cc-net talk to the front-end on further ports, for example for OpenNebula's monitoring and for VXLAN. From outside the lab you only need SSH and the web interface. A firewall can turn away everything else.

## Hardening the front-end

Hardening means switching off or shielding everything that is not needed. The course script does three things.

::code{file="platform/operations/harden-frontend.sh"}

Afterwards, SSH accepts keys only, and `root` cannot log in directly. A password can be guessed or intercepted, while a private key never leaves your computer. The firewall is an nftables table of its own. It lets the nodes and cc-net reach everything and allows only SSH and the web interface from anywhere else. The `cc_gateway` table with the NAT for cc-net from chapter 2.3 stays untouched. Ubuntu installs security updates daily with `unattended-upgrades`, and the script makes sure it runs.

First check that you can log in with your key. Keep the first connection open until a second one with the key works.

```bash
sudo ~/cc/platform/operations/harden-frontend.sh
ssh -o PubkeyAuthentication=no mmuster-fe
```

The second connection fails with `Permission denied (publickey)`. In the lab, the web interface answered as before, Gitea could no longer be reached from the teacher's computer, and all targets in Prometheus stayed `up`.

## Rights on the platform

Since part 3, the platform has separated rights on several levels. The principle is always the same, every role gets only what it needs for its work.

| Level | Mechanism | Chapter |
|---|---|---|
| OpenNebula | groups, quotas and the VDC wolkenwerk | 3.1, 3.2 |
| Kubernetes | one namespace per member with a quota | 4.5 |
| Network in the cluster | NetworkPolicy, access to the model only with a label | 4.5, 5.5 |
| Automation | the triage service's own role, only `get` and `patch` in `velo` | 5.6 |
| Changes | pull requests in Gitea, Argo CD only reads | 4.4 |

One gap remains. The `oneadmin` account and your kubeconfig may do everything. In the lab you are the whole platform team. In a real team, each person would get an account of their own, and administrator rights would be limited to a few people.

## Pod Security Admission

A member brings containers of its own. If a container runs as `root` or with extended kernel privileges, a bug in the application can lead to an escape onto the node. Kubernetes checks this with Pod Security Admission. A label on the namespace sets which profile applies.

| Profile | Meaning |
|---|---|
| privileged | no restrictions |
| baseline | prevents known ways to gain more privileges |
| restricted | strict, following current recommendations for pods |

The member template sets `restricted` in three modes. `enforce` rejects pods, `warn` shows a warning when a manifest is applied, and `audit` writes violations to the Kubernetes audit log.

::code{file="platform/operations/repo/templates/member/namespace.yaml"}

A pod only meets `restricted` if it does not run as `root`, cannot gain additional privileges, drops all kernel capabilities and uses the runtime's seccomp profile. The web shop already ran as an ordinary user, and it lacked the other three settings.

::code{file="platform/operations/repo/webshop/deployment.yaml" lines="16-29"}

In the lab, Kubernetes then rejected a plain test pod in the namespace `velo` and listed every missing setting.

```text
Error from server (Forbidden): pods "psa-test" is forbidden: violates PodSecurity "restricted:latest":
allowPrivilegeEscalation != false (container "psa-test" must set securityContext.allowPrivilegeEscalation=false), ...
```

With a Deployment the error is less visible. Argo CD reports the Deployment as synced, but the ReplicaSet cannot create pods, and `kubectl -n <namespace> get events` shows `FailedCreate`.

## Secrets in Git

In part 5 you created the Grafana password by hand as a Secret, because a Secret in Git is only Base64 encoded and therefore readable. That leaves it out of Git, though, and after a rebuild you have to remember it. Sealed Secrets closes this gap. A controller in the cluster creates a key pair. With the public key, `kubeseal` encrypts a Secret into a SealedSecret, which may go into Git. Only the controller can decrypt it again with its private key.

A SealedSecret is bound to its name and namespace. Copying it into another namespace to read it there gets you nothing. This binding is called `strict` and is the default.

First copy the additions of part 6 into your platform repo. They bring the application for the controller, the application `secrets`, the `restricted` profile in the template, the adjusted web shop and the k3s template for chapter 6.2.

```bash
source /etc/cc-lab.env
cd ~/platform
cp -r ~/cc/platform/operations/repo/. .
sed -i "s#http://FRONTEND:3000#http://$CC_FE_IP:3000#" apps/*.yaml
git status
```

If a member in your repo has a label of its own on its namespace, such as `ai: allowed` from chapter 5.5, it has to be written as a merge patch. A patch with `op: add` on `/metadata/labels` replaces all labels, and the namespace loses its profile. In the lab, exactly that happened to `velo`. Push the changes and wait until the controller runs. Then install `kubeseal` and seal the password.

::code{file="platform/operations/seal-secrets.sh"}

```bash
git add -A && git commit -m "Sealed Secrets, restricted profile for members" && git push
kubectl -n kube-system rollout status deploy sealed-secrets-controller
sudo ~/cc/platform/operations/install-kubeseal.sh
~/cc/platform/operations/seal-secrets.sh
```

The Secret from part 5 already exists, and the controller does not overwrite a Secret it did not create itself. In the lab it reported "already exists and is not managed by SealedSecret". An annotation hands the Secret over, and a restart makes the controller try again.

```bash
git add secrets && git commit -m "Grafana password encrypted in Git" && git push
kubectl -n monitoring annotate secret grafana-admin sealedsecrets.bitnami.com/managed=true
kubectl -n kube-system rollout restart deploy sealed-secrets-controller
kubectl -n monitoring get secret grafana-admin -o jsonpath='{.metadata.ownerReferences[0].kind}'
```

The last line prints `SealedSecret`. Without the controller's private key, the SealedSecret in Git is worthless, to you as well. Chapter 6.2 therefore backs it up too.

## Updates

The front-end and the k3s VMs get Ubuntu's security updates automatically. A reboot, for a new kernel for example, does not happen on its own. `/var/run/reboot-required` shows when one is needed. You update the platform software yourself, OpenNebula through its packages, k3s through the variable `k3s_version` and a rebuild, and the charts through their versions in Git. Each of these versions is in Git, so you can trace what ran when.

::::exercise[Protection needs]
Assess the protection needs of Wolkenwerk's four members for confidentiality, integrity and availability, and justify each level in one sentence. Do the same for your own member from UN4.

:::solution
One possible assessment gives the practice very high confidentiality, high integrity and normal availability, because health data falls under professional secrecy and the practice can bridge an outage of a few hours on paper. The fiduciary office has high confidentiality, very high integrity and high availability at the end of the month. The bike shop has normal confidentiality, normal integrity and high availability on Saturdays. The municipality has high confidentiality because of personal data, high integrity and high availability during counter hours. Other levels are correct if the reasoning holds.
:::
::::

::::exercise[Lab]
Harden your front-end, move the Grafana password into a SealedSecret and set the `restricted` profile for all members. Show that a pod without security settings is rejected.

:::solution
`ssh -o PubkeyAuthentication=no` fails, `systemctl is-active cc-firewall` shows `active`, and `kubectl get ns velo --show-labels` shows the label `pod-security.kubernetes.io/enforce=restricted`. `kubectl -n velo run test --image=busybox -- sleep 5` ends with `forbidden: violates PodSecurity`. The first checks of the check `operations` are green.
:::
::::

::::exercise[Scanning images]
For fast students. Scan the web shop image with Trivy for known vulnerabilities and think about how the course repo's CI could stop an image with critical flaws.

:::solution
`trivy image ghcr.io/ndum/cc/webshop:1.0.0` lists vulnerabilities of the packages in the image with their severity. In the CI, the same scan would run after the build, and `--exit-code 1 --severity CRITICAL` would make the job fail on critical findings. A small base image has fewer packages and thus fewer findings.
:::
::::
