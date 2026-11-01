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
After this chapter you can

- assess a member's protection needs for confidentiality, integrity and availability,
- harden the front-end with SSH keys, a firewall and automatic updates,
- explain how TLS protects a connection and where the lab relies on SSH tunnels instead,
- define and check the rights of a ServiceAccount with a Role and a RoleBinding,
- require the restricted profile for member pods with Pod Security Admission,
- store secrets encrypted in Git,
- show who may do what on your platform.
:::

The chapters of part 6 build on your lab as it stands after part 5.

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

Afterwards, SSH accepts keys only, and `root` cannot log in directly. A password can be guessed or intercepted, while a private key never leaves your computer. The firewall is an nftables table of its own. It lets the nodes and cc-net reach everything and allows only SSH and the web interface from anywhere else. The `cc_gateway` table with the NAT for cc-net from chapter 0.4 stays untouched. Ubuntu installs security updates daily with `unattended-upgrades`, and the script makes sure it runs.

![The protection layers of front-end and cluster. In the middle the front-end. Its firewall, the nftables table cc_firewall, drops everything it does not explicitly allow. Other hosts reach only SSH on port 22 and the web interface on port 2616, and SSH accepts only keys and does not let root log in directly. The nodes and cc-net reach everything, including Gitea on port 3000, the API on port 2633 and the exporters on ports 9100 and 9925. unattended-upgrades installs security updates every day. On the right the cluster. Pod Security Admission enforces the profile restricted in the member namespaces, NetworkPolicies separate the members, and the triage service may only get and patch deployments in velo. A SealedSecret comes encrypted from Gitea, and only the Sealed Secrets controller in kube-system can decrypt it.](../../../../assets/figures/en/p6c1-security.svg)

First check that you can log in with your key. Keep the first connection open until a second one with the key works.

```bash
sudo ~/cc/platform/operations/harden-frontend.sh
ssh -o PubkeyAuthentication=no mmuster-fe
```

The second connection fails with `Permission denied (publickey)`. In the lab, the web interface answered as before, Gitea could no longer be reached from the instructor's computer, and all targets in Prometheus stayed `up`.

From now on you reach Gitea through a tunnel. The tunnel to Grafana already uses local port 3000, so pick another one, for example `ssh -L 3001:localhost:3000 mmuster-fe`, and open `http://localhost:3001/`.

## Transport encryption

The firewall decides who can reach a service. It does nothing about what happens to the data on the way. Almost every web interface in the lab speaks plain HTTP, Sunstone on port 2616, Gitea on port 3000, Argo CD, Grafana and the web shop. Anyone who can read the traffic between browser and service sees passwords, session cookies and content in plain text. The same goes for the token in `~/.git-credentials` that Git uses to push to the `platform` repo, and for the connection over which Argo CD fetches the repo from Gitea.

TLS (Transport Layer Security) protects a connection in three ways. Encryption keeps the content confidential. Every block sent carries an authentication tag, so the receiver notices if anything was changed in transit, which protects integrity. And the server proves its identity with a certificate, so the client knows it is talking to the right server and not to someone in between. The current version, TLS 1.3, is specified in [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446).

A certificate binds a public key to a name, such as the server's hostname or IP address. It is signed by a certificate authority (CA). The client keeps a list of CAs it trusts and checks that the certificate comes from one of them, has not expired and matches the address it asked for. During the handshake, the server then proves that it holds the private key belonging to the certificate. An attacker can copy the certificate but cannot provide that proof.

You can see this in the lab with the Kubernetes API on port 6443. When k3s is installed, it creates its own CAs and uses them to issue the API server's certificate ([k3s documentation](https://docs.k3s.io/cli/certificate)). Your kubeconfig contains that CA's certificate, which is why kubectl trusts the server without any public CA involved. With `openssl s_client` you can check the connection by hand, on the front-end and without changing anything.

```bash
server=$(kubectl config view -o jsonpath='{.clusters[0].cluster.server}')
echo | openssl s_client -connect "${server#https://}" \
  -CAfile <(kubectl config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d) \
  2>/dev/null | grep -E 'subject=|issuer=|Protocol|Verify return'
```

```text
subject=O=k3s, CN=k3s
issuer=CN=k3s-server-ca@1793541775
Protocol: TLSv1.3
Verify return code: 0 (ok)
```

The number after `k3s-server-ca@` is the time k3s created the CA, so yours will differ. Without `-CAfile`, openssl reports `Verify return code: 19 (self-signed certificate in certificate chain)`. The connection is still encrypted, but openssl does not know the k3s CA and cannot confirm that the server is genuine.

Plain HTTP is acceptable for the web interfaces in the lab because hardly any of them is exposed. After hardening, other hosts can only reach SSH and Sunstone. You open Gitea, Argo CD, Grafana and the web shop through SSH tunnels, and SSH encrypts the connection itself and authenticates the server with its host key. Behind the tunnel, the traffic stays on the front-end or in cc-net, which only the lab's nodes and VMs can reach. Sunstone is the exception. Its login crosses the classroom network in plain text. That is acceptable for a practice environment with test data, but not for the practice's patient data.

A production setup puts every service behind TLS. Web interfaces usually sit behind a reverse proxy such as nginx or Traefik, which terminates TLS and passes requests on to the service, and Sunstone would be handled that way. Inside the cluster, an [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) with a `tls` section does the job, and k3s already ships Traefik as its ingress controller. Gitea can also serve HTTPS itself ([Gitea documentation](https://docs.gitea.com/administration/https-setup)). The certificates come either from an internal CA, whose certificate then has to be installed on every device of the members, or from a public CA such as Let's Encrypt. Let's Encrypt issues certificates for free and automatically through the ACME protocol, with the server proving that it controls the domain ([How It Works](https://letsencrypt.org/how-it-works/)). That requires a public domain name. With HTTPS, the token in `~/.git-credentials` would no longer cross the network in plain text. On disk it stays readable, so only your user may read the file, and `ls -l ~/.git-credentials` shows `-rw-------`.

## Rights on the platform

Since part 3, the platform has separated rights on several levels. The principle is always the same, every role gets only what it needs for its work.

| Level | Mechanism | Chapter |
|---|---|---|
| OpenNebula | groups, quotas and the VDC wolkenwerk | 3.1, 3.2 |
| Kubernetes | one namespace per member with a quota | 4.5 |
| Network in the cluster | NetworkPolicy, access to the model only with a label | 4.5, 5.5 |
| Automation | the triage service's own role, only `get` and `patch` in `velo` | 5.6 |
| Changes | pull requests in Gitea, Argo CD only reads | 4.4 |

### Roles in Kubernetes

Kubernetes controls access to its API with role-based access control, RBAC for short ([Kubernetes documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)). Every API request has a sender, a verb and a resource. RBAC calls the sender a subject. A subject is a user, a group or a ServiceAccount. Kubernetes does not manage users and groups itself. They come from elsewhere, for example from the client certificate someone logs in with. A ServiceAccount, by contrast, is an object in a namespace and gives a program in the cluster an identity of its own. The verb states what should happen, such as `get`, `list`, `watch`, `create`, `patch` or `delete`. The resource is the kind of object, such as `deployments` from the API group `apps`, or `secrets` from the core group, which YAML writes as `""`.

You grant rights in two steps. A role lists which verbs are allowed on which resources. A binding then connects subjects to exactly one role. Both come in a namespaced flavor and a cluster-wide one.

| Object | Applies in | Contains |
|---|---|---|
| Role | one namespace | rules made of API groups, resources and verbs |
| ClusterRole | the whole cluster | rules, also for resources without a namespace such as nodes |
| RoleBinding | one namespace | subjects and a Role or ClusterRole |
| ClusterRoleBinding | the whole cluster | subjects and a ClusterRole |

A RoleBinding may refer to a ClusterRole and then grants its rights only in its own namespace. That is how the built-in ClusterRoles `view`, `edit` and `admin` serve as templates. If the municipality got access to its namespace, a RoleBinding in `gemeinde` binding its group to `edit` would be enough. RBAC only knows permissions. Anything no rule allows is denied, and the rights from several bindings add up.

### The triage service as an example

The triage service from chapter 5.6 runs in the namespace `ai` under the ServiceAccount `triage`. It should be able to restart the web shop and do nothing else.

::code{file="platform/observability/repo/ai/triage-rbac.yaml"}

The Role lives in `velo` and allows `get` and `patch` on deployments in the `apps` group. That is enough for a restart, which only sets an annotation in the deployment's pod template. The RoleBinding lives in `velo` too and names the ServiceAccount from `ai` as its subject. Subject and binding may sit in different namespaces, and the rights always apply in the binding's namespace. So the service can neither read secrets nor delete deployments nor touch anything in `gemeinde`.

This approach is called least privilege. Every identity gets the smallest set of rights that lets it do its job ([RBAC good practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/)). If someone takes control of the service, for example with a crafted alert that leads the model to a wrong suggestion, the damage is limited to restarts in `velo`.

`kubectl auth can-i` checks whether the rules work. The `--as` option asks on behalf of another subject, and a ServiceAccount is written as `system:serviceaccount:<namespace>:<name>` ([kubectl auth can-i](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_auth/kubectl_auth_can-i/)). Chapter 5.6 checked single verbs, and `--list` shows all rights in a namespace at once.

```bash
kubectl auth can-i --list -n velo --as=system:serviceaccount:ai:triage
```

```text
Resources                                       Non-Resource URLs                      Resource Names   Verbs
selfsubjectreviews.authentication.k8s.io        []                                     []               [create]
selfsubjectaccessreviews.authorization.k8s.io   []                                     []               [create]
selfsubjectrulesreviews.authorization.k8s.io    []                                     []               [create]
deployments.apps                                []                                     []               [get patch]
                                                [/.well-known/openid-configuration/]   []               [get]
...
```

The `deployments.apps` line comes from the Role `triage`. Every authenticated subject gets the three lines above it and the URLs below it through built-in ClusterRoles such as `system:basic-user` and `system:discovery`, so that it can query its own rights and explore the API.

### Accounts with full rights

Other accounts on the platform may do far more. The Argo CD application controller is bound through a ClusterRoleBinding to a ClusterRole that allows every verb on every resource, because it has to create arbitrary objects from Git anywhere in the cluster. The real boundary is therefore Git. Whoever may push to `main` of `wolkenwerk/platform` changes the whole cluster through Argo CD.

The `oneadmin` account and your kubeconfig may do everything as well. `kubectl auth whoami` shows that your kubeconfig identifies you as `system:admin` in the group `system:masters`. Members of this group bypass every RBAC check. That is also why `--as` works for you, since taking on another identity is a right of its own, with the verb `impersonate`. In the lab you are the whole platform team. In a real team, each person would get an account of their own with suitable roles, and administrator rights would be limited to a few people.

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
Take your assessment of the four members from chapter 1.4 and check which measures of this chapter contribute to which protection goal. If you do the advanced task of milestone 4, also assess your own member for confidentiality, integrity and availability, and justify each level in one sentence.

:::solution
The assessment from chapter 1.4 still holds, for example the practice with very high confidentiality, high integrity and high availability. The firewall, key-only access and the profile `restricted` protect the confidentiality and integrity of every member. Sealed Secrets keep passwords out of plain text in Git. For the practice's very high confidentiality that is not enough on its own, because the web interfaces in the lab run without TLS. A member of your own such as a daycare center with data on children would have very high confidentiality, high integrity and normal availability, because registrations can wait a day. Other levels are right as long as the reasoning holds.
:::
::::

::::exercise[Lab]
Harden your front-end, move the Grafana password into a SealedSecret and set the `restricted` profile for all members. Show that a pod without security settings is rejected.

:::solution
`ssh -o PubkeyAuthentication=no` fails, `systemctl is-active cc-firewall` shows `active`, and `kubectl get ns velo --show-labels` shows the label `pod-security.kubernetes.io/enforce=restricted`. `kubectl -n velo run test --image=busybox -- sleep 5` ends with `forbidden: violates PodSecurity`. The first checks of the check `operations` are green.
:::
::::

::::exercise[Checking rights]
Use `kubectl auth can-i` with `--as=system:serviceaccount:ai:triage` to find out whether the triage service may read and delete deployments in `velo`, patch deployments in `gemeinde` and read secrets in `velo`. Then work out which rule the Role `triage` would additionally need so that the service can read the logs of the pods in `velo`. Do not change anything in the lab.

:::solution
kubectl answers `yes` only to the first question.

```bash
kubectl auth can-i get deployments -n velo --as=system:serviceaccount:ai:triage      # yes
kubectl auth can-i delete deployments -n velo --as=system:serviceaccount:ai:triage   # no
kubectl auth can-i patch deployments -n gemeinde --as=system:serviceaccount:ai:triage  # no
kubectl auth can-i get secrets -n velo --as=system:serviceaccount:ai:triage          # no
```

Deleting is missing from the list of verbs, `gemeinde` has no RoleBinding for the service, and secrets are a different resource. For the logs, the Role would need a second rule with the API group `""`, the resource `pods/log` and the verb `get`, plus `list` on `pods` so the service can find the pod names. Today, `kubectl auth can-i get pods/log -n velo` with the same `--as` option answers `no`. The new rule would go into the file in the platform repo, and Argo CD would apply it.
:::
::::

::::exercise[Scanning images]
For fast students. Scan the web shop image with Trivy for known vulnerabilities and think about how the course repo's CI could stop an image with critical flaws.

:::solution
`trivy image ghcr.io/ndum/cc/webshop:1.0.0` lists vulnerabilities of the packages in the image with their severity. In the CI, the same scan would run after the build, and `--exit-code 1 --severity CRITICAL` would make the job fail on critical findings. A small base image has fewer packages and thus fewer findings.
:::
::::
