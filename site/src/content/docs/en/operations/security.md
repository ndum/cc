---
title: Security
description: Protection needs of the members, a hardened front-end with SSH keys, a firewall and updates, TLS and SSH tunnels, RBAC in Kubernetes, the restricted profile for pods, encrypted secrets in Git and who may do what on the platform.
sidebar:
  order: 1
---

:::assignment
"A fifth organization wants to become a member," writes Beat Kläy, president of the board. "Before we say yes, I want to know how well we are protected. Who can get onto the servers, where are the passwords, and what happens if a member brings an insecure application?"
:::

:::goals
After this chapter you can:

- Assess a member's protection needs for confidentiality, integrity and availability
- Harden the front-end with SSH keys, a firewall and automatic updates
- Explain how TLS protects a connection and where you use SSH tunnels in the lab instead
- Explain roles and bindings in Kubernetes and check the rights of a ServiceAccount
- Require the restricted profile for member pods with Pod Security Admission
- Store secrets encrypted in Git
- Show who may do what on your platform
:::

The chapters of part 6 build on your lab as it stands after part 5.

## Protection needs

Security costs time and convenience. Before you plan any measures, you work out what needs protecting. The protection needs of data and services are assessed against three goals.

| Goal | Question | Example at Wolkenwerk |
|---|---|---|
| Confidentiality | Who may see the data? | patient data of Praxis Rosenweg |
| Integrity | Does the data stay correct and complete? | bookkeeping of Treuhand Aaregg |
| Availability | Is the service there when it is needed? | counter services of Gemeinde Hinterbüel |

The usual levels are normal, high and very high. The level depends on the damage a loss would cause to people, to the member and to Wolkenwerk. Under Art. 5 of the Swiss data protection act, health data is particularly sensitive, and doctors are bound by professional secrecy under Art. 321 of the Swiss criminal code. Chapter 1.4 introduced both. For the practice, confidentiality is therefore very high. For the bike shop's web shop, availability on Saturdays matters most.

The measures follow from the protection needs. The platform needs a baseline for everyone, and members with high needs get more, such as a VM of their own instead of a namespace, or more frequent backups.

## The attack surface of the lab

The **attack surface** is everything an attacker can reach over the network. After part 5, your front-end accepts connections on several ports.

| Port | Service | Who needs it |
|---|---|---|
| 22 | SSH | you |
| 2616 | OpenNebula web interface | you and the members |
| 2633 | OpenNebula API | OpenTofu on the front-end itself |
| 3000 | Gitea | Argo CD in the cluster, you through a tunnel |
| 9100, 9925 | exporters for Prometheus | Prometheus in the cluster |

The nodes and the VMs in cc-net talk to the front-end on further ports, for example for OpenNebula's monitoring and for VXLAN. From any other machine, only SSH and the web interface are needed. That includes the client you work from, the Kali VM on smartlearn or your PC if you run your own hypervisor. A firewall can turn away everything else.

## Hardening the front-end

**Hardening** means switching off or shielding everything that is not needed. The course script does three things.

::code{file="platform/operations/harden-frontend.sh"}

Afterwards, SSH accepts keys only, and nobody can log in directly as `root`. The [sshd_config manual page](https://manpages.ubuntu.com/manpages/resolute/man5/sshd_config.5.html) describes these options. A password can be guessed or intercepted, while a private key never leaves the client. The firewall is an nftables table of its own. It lets the nodes and cc-net reach everything and allows only SSH and the web interface from any other machine. The [simple ruleset for a server](https://wiki.nftables.org/wiki-nftables/index.php/Simple_ruleset_for_a_server) in the nftables wiki shows how such a table is built. The `cc_gateway` table with the NAT for cc-net from chapter 0.4 stays untouched. Ubuntu installs security updates every day on its own with the package `unattended-upgrades`. The script turns this on with the file `/etc/apt/apt.conf.d/20auto-upgrades`. Following that file, `apt-daily.timer` fetches the package lists and `apt-daily-upgrade.timer` installs the updates. The service `unattended-upgrades`, which the script also enables, installs nothing itself. It only makes sure that an update in progress ends cleanly when the machine shuts down. The Ubuntu Server guide on [automatic updates](https://ubuntu.com/server/docs/how-to/software/automatic-updates/) explains the settings.

![The protection layers of front-end and cluster. In the middle the front-end. Its firewall, the nftables table cc_firewall, drops everything it does not explicitly allow. The client and other hosts reach only SSH on port 22 and the web interface on port 2616, and SSH accepts only keys and does not let root log in directly. The nodes and cc-net reach everything, including Gitea on port 3000, the API on port 2633 and the exporters on ports 9100 and 9925. Every day, unattended-upgrades installs security updates. On the right the cluster. Pod Security Admission enforces the profile restricted in the member namespaces, NetworkPolicies separate the members, and Prometheus may only read, in all namespaces. A SealedSecret comes encrypted from Gitea, and only the Sealed Secrets controller in kube-system can decrypt it with its key.](../../../../assets/figures/en/p6c1-security.svg)

:::caution[Check your key login]
After hardening, SSH no longer accepts passwords, and from the client you only reach SSH and Sunstone. Make sure beforehand that you can log in from the client with your key. Keep the existing connection open until a new login with the key works. Otherwise the front-end's console is your only way back in.
:::

First check in the client's terminal that logging in with your key works. The command prints the front-end's host name without asking for a password.

```bash
ssh mmuster-fe hostname
```

If SSH asks for the password of `vmadmin`, your key is not on the front-end yet. In that case copy it over first with `ssh-copy-id mmuster-fe`, as in [chapter 0.4](../../start/prepare/#ssh-from-the-client). Then run the script on the front-end. At the end it shows `permitrootlogin no`, `passwordauthentication no` and the rules of the table `cc_firewall`.

```bash
sudo ~/cc/platform/operations/harden-frontend.sh
```

Keep this connection to the front-end open. Open a second tab in the client's terminal and test the login without and with your key there, as well as the firewall.

```bash
ssh -o PubkeyAuthentication=no mmuster-fe
ssh mmuster-fe hostname
ssh mmuster-fe systemctl is-active cc-firewall
```

The attempt without a key fails with `Permission denied (publickey)`. With the key, SSH prints `mmuster-fe` again, and the firewall reports `active`. In the lab, the web interface answered as before and all targets in Prometheus stayed `up`, but Gitea could no longer be reached from the client.

These three outputs prove requirement 1 of milestone 4. Take a screenshot of them with Kali's screenshot tool. Save it in your home folder under a name that starts with the number of the requirement, such as `1-hardening.png`. In the second tab, create the folder `m4` in your hand-in repo on the front-end and copy the screenshot into it. The screenshots of the other requirements follow in this chapter and in chapter 6.2. You can upload all of them at the end of chapter 6.2 together with the report of the check `m4`.

```bash
ssh mmuster-fe mkdir -p cc-mmuster/m4
scp ~/1-hardening.png mmuster-fe:cc-mmuster/m4/
```

From now on you open Gitea through a tunnel. On the client, the tunnel to Grafana from chapter 5.1 already uses local port 3000, so pick another one. Start the tunnel in another tab of the client's terminal.

```bash
ssh -N -L 3001:localhost:3000 mmuster-fe
```

`-N` opens only the tunnel and no shell. Here `localhost:3000` means the front-end itself, where Gitea runs. While the tunnel is open, the client's browser shows Gitea at `http://localhost:3001/`. You log in as `platform` as in chapter 4.4, and `cat ~/cc-lab/gitea/platform.pass` on the front-end shows the password. Gitea builds some links with the address from its configuration, port 3000 of the front-end. Such a link, the clone address for example, leads nowhere from the client, so stay with `localhost:3001` in the browser. Ctrl+C in the tunnel's tab closes it again.

The course does not harden the nodes. SSH there still accepts passwords, and node_exporter on port 9100 and the libvirt exporter on port 9926 answer anyone. Each node also offers the consoles of its VMs over VNC on all of its addresses and without a password, starting at port 5900. Sunstone fetches them from there through the front-end. Anyone who reaches the nodes can therefore read the metrics and operate the VM consoles. Your client and your three servers reach them, and so do the VMs in cc-net through the front-end's NAT, the members' VMs among them. For a lab with test data that is acceptable. A production setup hardens the nodes like the front-end and protects the consoles with a password, which OpenNebula generates for every VM with `RANDOM_PASSWD` in the template ([template reference](https://docs.opennebula.io/7.4/product/operation_references/configuration_references/template/)).

The passwords and tokens of the lab live in your home directory on the front-end, and only you may read them. The [lab reference](../../lab-reference/#access-files) lists them under "Access files".

## The additions of part 6

The additions for part 6 are in the course repo under `platform/operations/repo`. They bring the application for the Sealed Secrets controller, the application `secrets`, the `restricted` profile in the member template, the adjusted web shop and the k3s template for chapter 6.2. As in chapter 5.1, you copy them over your platform repo and replace the placeholder with your front-end's address. The sections on Pod Security Admission and on secrets in Git further down explain what they do.

```bash
source /etc/cc-lab.env
cd ~/platform
cp -r ~/cc/platform/operations/repo/. .
sed -i "s#http://FRONTEND:3000#http://$CC_FE_IP:3000#" apps/*.yaml
git status
```

`git status` lists the two new applications and three changed files, the namespace template, the web shop and the k3s template. The copy leaves the kube-prometheus-stack values from part 5 alone, so a route to the triage service from advanced task B of milestone 3 stays in place. If you changed one of the three files yourself, `git diff` shows what the copy overwrote.

If a member in your repo has a label of its own on its namespace, for example for access to the model from chapter 5.5, it has to be written as a merge patch. A patch with `op: add` on `/metadata/labels` replaces all labels, and the namespace loses its profile. In the lab this happened to `velo`. Then push the additions.

```bash
git add -A && git commit -m "Sealed Secrets, restricted profile for members" && git push
```

Argo CD picks up the changes at its next poll of the repo. It rolls out the web shop with the new settings, puts the labels on the member namespaces and creates the Sealed Secrets controller. Until the folder `secrets` is in the repo, the application `secrets` shows `Unknown` with "app path does not exist", which is normal at this point.

## Transport encryption

The firewall decides who can reach a service. It does nothing about what happens to the data on the way. Almost every web interface in the lab speaks plain HTTP, including Sunstone on port 2616, Gitea on port 3000, Argo CD, Grafana and the web shop. Anyone who can read the traffic between browser and service sees passwords, session cookies and content in plain text. The same goes for the token in `~/.git-credentials` that Git uses to push to the `platform` repo. The connection over which Argo CD fetches the repo from Gitea is not encrypted either.

**TLS** (Transport Layer Security) protects a connection in three ways. Encryption keeps the content confidential. Every block sent carries an authentication tag that lets the receiver detect any change in transit, which protects integrity. The server also proves its identity with a certificate. This tells the other side, a browser for example, whether it is talking to the right server or to someone in between. The current version, TLS 1.3, is specified in [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446).

A certificate binds a public key to a name, such as the server's hostname or IP address. It is signed by a certificate authority (CA). Browsers and other programs keep a list of CAs they trust. When they connect, they check that the certificate comes from one of these CAs, has not expired and matches the address they asked for. During the handshake, the server then proves that it holds the private key belonging to the certificate. An attacker can copy the certificate but cannot provide that proof.

You can see this in the lab with the Kubernetes API on port 6443. When k3s is installed, it creates its own CAs and uses them to issue the API server's certificate ([k3s documentation](https://docs.k3s.io/cli/certificate)). Your kubeconfig contains that CA's certificate, which is why kubectl trusts the server without any public CA involved. On the front-end you can check the connection by hand with `openssl s_client`. The command changes nothing.

```bash
server=$(kubectl config view -o jsonpath='{.clusters[0].cluster.server}')
echo | openssl s_client -connect "${server#https://}" \
  -CAfile <(kubectl config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d) \
  2>/dev/null | grep -E '^(subject=|issuer=|Protocol|Verify return)' | awk '!seen[$0]++'
```

```text
subject=O=k3s, CN=k3s
issuer=CN=k3s-server-ca@1793541775
Protocol: TLSv1.3
Verify return code: 0 (ok)
```

`awk '!seen[$0]++'` prints each line only once, otherwise `Protocol` and `Verify return code` sometimes appear twice on Ubuntu 26.04. The number after `k3s-server-ca@` is the time k3s created the CA, so yours will differ. Without `-CAfile`, openssl reports `Verify return code: 19 (self-signed certificate in certificate chain)`. The connection is still encrypted, but openssl does not know the k3s CA and cannot confirm that the server is genuine.

Plain HTTP is acceptable for the web interfaces in the lab because hardly any of them is exposed. After hardening, the client and every other host can only reach SSH and Sunstone. You open Gitea, Argo CD, Grafana and the web shop through SSH tunnels from the client. SSH encrypts the connection itself and authenticates the server with its host key. Behind the tunnel, the traffic stays on the front-end or in cc-net, which only the lab's nodes and VMs can reach. Sunstone is the exception. Its login crosses the lab network in plain text. That is acceptable for a training environment with test data, but not for the patient data of the medical practice.

A production setup puts every service behind TLS. Web interfaces such as Sunstone usually sit behind a reverse proxy like nginx or Traefik, which terminates TLS and passes requests on to the service. Inside the cluster, an [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) with a `tls` section does the job, and k3s already ships Traefik as its ingress controller. Gitea can also serve HTTPS itself ([Gitea documentation](https://docs.gitea.com/administration/https-setup)). The certificates come either from an internal CA, whose certificate then has to be installed on every device of the members, or from a public CA such as Let's Encrypt. Let's Encrypt issues certificates for free and automatically through the ACME protocol, with the server proving that it controls the domain ([How It Works](https://letsencrypt.org/how-it-works/)). That requires a public domain name. With HTTPS, the token in `~/.git-credentials` would no longer cross the network in plain text. On disk it stays readable, so only your user may read the file, and `ls -l ~/.git-credentials` shows `-rw-------`.

## Rights on the platform

Since part 3, the platform has separated rights on several levels. On each of them, a role gets only what it needs for its work.

| Level | Mechanism | Chapter |
|---|---|---|
| OpenNebula | groups, quotas and the VDC wolkenwerk | 3.1, 3.2 |
| Kubernetes | one namespace per member with a quota | 4.5 |
| Network in the cluster | NetworkPolicy, access to the model only with a label | 4.5, 5.5 |
| Automation | a role of its own for every service, for example read-only rights for Prometheus | 5.1 |
| Changes | pull requests in Gitea, Argo CD only reads | 4.4 |

### Roles in Kubernetes

Kubernetes controls access to its API with role-based access control, **RBAC** for short ([Kubernetes documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)). Every API request has a sender, a verb and a resource. RBAC calls the sender a subject. A subject is a user, a group or a ServiceAccount. Kubernetes does not manage users and groups itself. They come from elsewhere, for example from the client certificate someone logs in with. A ServiceAccount, by contrast, is an object in a namespace and gives a program in the cluster an identity of its own. The verb states what should happen, such as `get`, `list`, `watch`, `create`, `patch` or `delete`. The resource is the kind of object, such as `deployments` from the API group `apps`, or `secrets` from the core group, which YAML writes as `""`.

You grant rights in two steps. A role lists which verbs are allowed on which resources. A binding then connects subjects to exactly one role. Both come in a namespaced flavor and a cluster-wide one.

| Object | Applies in | Contains |
|---|---|---|
| Role | one namespace | rules made of API groups, resources and verbs |
| ClusterRole | the whole cluster | rules, also for resources without a namespace such as nodes |
| RoleBinding | one namespace | subjects and a Role or ClusterRole |
| ClusterRoleBinding | the whole cluster | subjects and a ClusterRole |

A RoleBinding may refer to a ClusterRole and then grants its rights only in its own namespace. That is how the built-in ClusterRoles `view`, `edit` and `admin` serve as templates. If the municipality got access to its namespace, a RoleBinding in `gemeinde` binding its group to `edit` would be enough. RBAC only knows permissions. Anything no rule allows is denied, and the rights from several bindings add up.

### Prometheus as an example

Prometheus from chapter 5.1 runs in the namespace `monitoring` under a ServiceAccount of its own. To find its targets it has to read pods, services and endpoints in every namespace, and it never needs to change anything. The chart kube-prometheus-stack therefore creates a ClusterRole that allows only the verbs `get`, `list` and `watch` on these resources, and a ClusterRoleBinding ties the ServiceAccount to it. The rights apply in every namespace, but only for reading.

```bash
kubectl get clusterrolebinding -o wide | grep prometheus
kubectl get clusterrole monitoring-kube-prometheus-prometheus -o yaml
```

The first command shows the binding with the ServiceAccount, the second the rules of the role. The chart builds their names from `monitoring`, the name Argo CD installs it under. Secrets do not appear in the rules, so Prometheus cannot read any password, not even the one of Grafana.

This approach is called **least privilege**. Every identity gets the smallest set of rights that lets it do its job ([RBAC good practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/)). If someone takes control of Prometheus, they can read objects in the cluster but neither change nor delete anything. A service that has to act needs a Role with the few verbs it uses, in exactly the namespace where it acts. The triage service of the advanced tasks in chapter 5.5 is such a case.

`kubectl auth can-i` checks whether the rules work. The `--as` option asks on behalf of another subject, and a ServiceAccount is written as `system:serviceaccount:<namespace>:<name>` ([kubectl auth can-i](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_auth/kubectl_auth_can-i/)). `--list` shows all rights in a namespace at once.

```bash
kubectl auth can-i --list -n velo --as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus
```

For `pods`, `services` and `endpoints` only the verbs `get`, `list` and `watch` appear. Lines such as `selfsubjectaccessreviews` and URLs such as `/.well-known/openid-configuration/` come to every authenticated subject through built-in ClusterRoles such as `system:basic-user` and `system:discovery`, so that it can query its own rights and explore the API.

### Accounts with full rights

Other accounts on the platform may do far more. The Argo CD application controller is bound through a ClusterRoleBinding to a ClusterRole that allows every verb on every resource, because it has to create arbitrary objects from Git anywhere in the cluster. The boundary therefore lies in Git. Whoever may push to `main` of `wolkenwerk/platform` changes the whole cluster through Argo CD.

The `oneadmin` account and your kubeconfig may do everything as well. `kubectl auth whoami` shows that your kubeconfig identifies you as `system:admin` in the group `system:masters`. Members of this group bypass every RBAC check. That is also why `--as` works for you, since taking on another identity is a right of its own, with the verb `impersonate`. In the lab you are the whole platform team. In a real team, each person would get an account of their own with suitable roles, and administrator rights would be limited to a few people.

## Pod Security Admission

A member brings containers of its own. If a container runs as `root` or with extended kernel privileges, a bug in the application can lead to an escape onto the node. Kubernetes checks this with Pod Security Admission. A label on the namespace sets which profile applies.

| Profile | Meaning |
|---|---|
| privileged | no restrictions |
| baseline | prevents known ways to gain more privileges |
| restricted | strict, following current recommendations for pods |

The member template sets `restricted` in three modes. `enforce` rejects pods, `warn` shows a warning when a manifest is applied, and `audit` records violations in the API server's audit log. The API server only writes that log with an audit policy, as the page [Auditing](https://v1-36.docs.kubernetes.io/docs/tasks/debug/debug-cluster/audit/) describes. In the lab, k3s starts it without such a policy, so `audit` leaves no trace there. The [Pod Security Admission documentation](https://v1-36.docs.kubernetes.io/docs/concepts/security/pod-security-admission/) for Kubernetes 1.36 describes the labels and their modes.

::code{file="platform/operations/repo/templates/member/namespace.yaml"}

A pod only meets `restricted` if it does not run as `root`, cannot gain additional privileges, drops all kernel capabilities and uses the runtime's seccomp profile. The [Pod Security Standards](https://v1-36.docs.kubernetes.io/docs/concepts/security/pod-security-standards/#restricted) list each of these settings. The web shop already ran as an ordinary user but lacked the other three settings.

::code{file="platform/operations/repo/webshop/deployment.yaml" lines="16-29"}

The labels came into the template with the additions of part 6. Check them on the namespace `velo`, then start a plain test pod without security settings there.

```bash
kubectl get ns velo --show-labels
kubectl -n velo run psa-test --restart=Never --image=busybox:1.37 -- sleep 5
```

The column `LABELS` includes `pod-security.kubernetes.io/enforce=restricted`. If the label is still missing, Argo CD has not picked up the additions yet. Wait a minute and try again. Kubernetes rejects the test pod and lists every missing setting.

```text
Error from server (Forbidden): pods "psa-test" is forbidden: violates PodSecurity "restricted:latest":
allowPrivilegeEscalation != false (container "psa-test" must set securityContext.allowPrivilegeEscalation=false), ...
```

The two outputs prove requirement 3 of milestone 4. Take a screenshot of them as for requirement 1, such as `3-restricted.png`.

With a Deployment the error is less visible. Argo CD reports the Deployment as synced, but the ReplicaSet cannot create pods, and `kubectl -n <namespace> get events` shows `FailedCreate`.

## Secrets in Git

In part 5 you created the Grafana password by hand as a Secret, because a Secret in Git is only Base64 encoded and therefore readable. That leaves it out of Git, though, and after a rebuild you have to remember it yourself. With Sealed Secrets, the password can live in Git after all. A controller in the cluster creates a key pair. With the public key, `kubeseal` encrypts a Secret into a SealedSecret, which may go into Git. Only the controller can decrypt it again with its private key.

A SealedSecret is bound to its name and namespace. If someone copies it into another namespace to read it there, the controller does not decrypt it. This binding is called `strict` and is the default.

Argo CD creates the controller with the additions of part 6, in the lab two to three minutes after the push. If it is not there yet, the `until` loop waits for it, and `rollout status` then waits until it runs. Then install `kubeseal` and seal the password. The [installation guide of Sealed Secrets 0.41.2](https://github.com/bitnami/sealed-secrets/blob/v0.41.2/README.md#installation) covers the controller and `kubeseal`.

::code{file="platform/operations/seal-secrets.sh"}

```bash
until kubectl -n kube-system get deploy sealed-secrets-controller >/dev/null 2>&1; do sleep 10; done
kubectl -n kube-system rollout status deploy sealed-secrets-controller
sudo ~/cc/platform/operations/install-kubeseal.sh
~/cc/platform/operations/seal-secrets.sh
```

The Secret from part 5 already exists, and the controller does not overwrite a Secret it did not create itself. In the lab it reported "already exists and is not managed by SealedSecret". An annotation hands the Secret over, so set it before you push the SealedSecret. The section [Managing existing secrets](https://github.com/bitnami/sealed-secrets/blob/v0.41.2/README.md#managing-existing-secrets) of the documentation describes the annotation.

```bash
cd ~/platform
kubectl -n monitoring annotate secret grafana-admin sealedsecrets.bitnami.com/managed=true
git add secrets && git commit -m "Grafana password encrypted in Git" && git push
until kubectl -n monitoring get secret grafana-admin -o jsonpath='{.metadata.ownerReferences[0].kind}' | grep SealedSecret; do sleep 10; done
```

The loop ends by printing `SealedSecret` once Argo CD has rolled out the SealedSecret and the controller has taken over the Secret. In the lab that took 40 seconds to a good minute and a half. This output proves requirement 2 of milestone 4, so take a screenshot of it, such as `2-sealedsecret.png`. If the loop has not ended after a few minutes, stop it with Ctrl+C, and `kubectl -n kube-system logs deploy/sealed-secrets-controller` shows the reason. If the SealedSecret arrived before the annotation, restart the controller after annotating with `kubectl -n kube-system rollout restart deploy sealed-secrets-controller`, and it tries again. Without the controller's private key, the SealedSecret in Git is worthless, to you as well. Chapter 6.2 therefore backs it up too.

## Updates

The front-end and the k3s VMs get Ubuntu's security updates automatically. A reboot, for a new kernel for example, does not happen on its own. If the file `/var/run/reboot-required` exists, one is needed. You update the platform software yourself, OpenNebula through its packages, k3s through the variable `k3s_version` and a rebuild, and the charts through their versions in Git. Because each of these versions is in Git, you can trace what ran when.

::::exercise[Protection needs]
Take your assessment of the four members from chapter 1.4 and check which measures of this chapter contribute to which protection goal. If you do advanced task A from chapter 6.5, also assess your own member for confidentiality, integrity and availability, and justify each level in one sentence.

:::solution
The assessment from chapter 1.4 still holds, for example the practice with very high confidentiality, high integrity and high availability. The firewall and key-only access protect the front-end, and the profile `restricted` makes it harder to break out of a container onto the node. Both serve mainly the confidentiality and integrity of every member. Sealed Secrets keep passwords out of plain text in Git. For the practice's very high confidentiality that is not enough on its own. The web interfaces in the lab run without TLS, and the nodes are not hardened, so even another member's VM reaches the practice's consoles over VNC without a password. A member of your own such as a daycare center with data on children would have very high confidentiality, high integrity and normal availability, because registrations can wait a day. Other levels are just as right if you justify them soundly.
:::
::::

::::exercise[Lab]
Harden your front-end, move the Grafana password into a SealedSecret and set the `restricted` profile for all members. Show that a pod without security settings is rejected. Take the screenshots for requirements 1 to 3 of milestone 4 along the way.

:::solution
From the client, `ssh -o PubkeyAuthentication=no` fails, and `ssh mmuster-fe hostname` prints `mmuster-fe`. On the front-end, `systemctl is-active cc-firewall` shows `active`, and `kubectl get ns velo --show-labels` shows the label `pod-security.kubernetes.io/enforce=restricted`. `kubectl -n velo run psa-test --restart=Never --image=busybox:1.37 -- sleep 5` ends with `forbidden: violates PodSecurity`. `kubectl -n monitoring get secret grafana-admin -o jsonpath='{.metadata.ownerReferences[0].kind}'` prints `SealedSecret`. `~/cc-mmuster/m4` holds the screenshots of requirements 1 to 3. The first checks of the check `operations` are green.
:::
::::

::::exercise[Checking rights]
Use `kubectl auth can-i` with `--as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus` to find out whether Prometheus may read and delete pods in `velo`, change deployments in `gemeinde` and read secrets in `velo`. Then work out why Prometheus has a ClusterRole instead of a Role in a namespace. Do not change anything in the lab.

:::solution
Only the first question gets a `yes` from kubectl.

```bash
kubectl auth can-i get pods -n velo --as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus                # yes
kubectl auth can-i delete pods -n velo --as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus             # no
kubectl auth can-i patch deployments -n gemeinde --as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus   # no
kubectl auth can-i get secrets -n velo --as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus             # no
```

Deleting and changing are missing from the list of verbs, and secrets are a different resource. Prometheus finds its targets in every namespace, including the ones a new member gets later. A Role would have to be created in every namespace on its own. The ClusterRole with its ClusterRoleBinding covers all of them at once and stays limited to reading.
:::
::::

::::exercise[Scanning images]
For fast students. Scan the web shop image with Trivy for known vulnerabilities and think about how the course repo's CI could stop an image with critical flaws. The [installation guide of Trivy 0.76](https://trivy.dev/docs/v0.76/getting-started/installation/) shows how to install it.

:::solution
`trivy image ghcr.io/ndum/cc/webshop:1.0.0` lists vulnerabilities of the packages in the image with their severity. In the CI, the same scan would run after the build, and `--exit-code 1 --severity CRITICAL` would make the job fail on critical findings. A small base image has fewer packages and thus fewer findings.
:::
::::
