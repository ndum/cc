---
title: GitOps with Argo CD
description: The desired state of the cluster in Git, a Gitea of the platform team on the front-end, the bike shop's web shop as a container and Argo CD with applications, sync, prune and self-heal.
sidebar:
  order: 4
---

:::assignment
"Our web shop is supposed to go live in spring," Veloatelier Matte writes. "We'd like to propose changes ourselves, without one of you typing commands on a server in the middle of the night."
:::

:::goals
After this chapter you can:

- Explain the four principles of GitOps
- Explain why the Git server runs outside the cluster it controls
- Run Gitea on the front-end and share a repo with read-only access
- Install Argo CD and roll out the web shop from Git with applications
- Demonstrate sync, prune and self-heal
:::

## GitOps

With OpenTofu you describe the VMs in code, but you still run the code yourself. With GitOps, software inside the system takes over that part. The CNCF working group OpenGitOps sums it up in four principles.

| Principle | Meaning |
|---|---|
| Declarative | The system is described as a desired state. |
| Versioned and immutable | The desired state is kept in a store that retains every version, usually Git. |
| Pulled automatically | Software inside the system fetches the desired state itself. |
| Continuously reconciled | The same software keeps comparing desired and actual state and corrects differences. |

The difference from a classic rollout is the direction. With a push approach, a pipeline or a person with rights logs in to the cluster and applies changes. With GitOps, nobody but the agent in the cluster needs those rights. Whoever wants a change edits Git, and the Git history doubles as the log of every change.

![The GitOps loop. The platform team sends a change with git push to Gitea on the front-end, or opens a pull request that is merged after review. Argo CD in the k3s cluster polls the repo wolkenwerk/platform every minute with read-only access. It compares the desired state from Git with the live state, for example for the web shop in the namespace velo, and applies the differences. If someone changes the cluster by hand with kubectl scale, self-heal reverts the change. Pay attention to the direction of the arrows. Argo CD pulls the desired state itself, nobody pushes it into the cluster.](../../../../assets/figures/en/p4c4-gitops.svg)

## Gitea on the front-end

Argo CD, the agent of this chapter, needs a Git repo it can reach from the cluster. The platform team runs its own Gitea for that. Gitea is a lightweight Git server with a web interface, users, organizations and pull requests, under the MIT license.

Gitea runs on the front-end, outside the cluster. You rebuild the cluster in chapter 6.2 at the latest, when it moves to etcd, and earlier if you take on [advanced task A](../advanced/#task-a--rebuilding-the-platform) of chapter 4.6. If the desired state lived in a Gitea inside the same cluster, it would be gone after `tofu destroy`, and the new cluster would not know what to roll out. The desired state a cluster is rebuilt from therefore does not belong in that cluster. The front-end has enough memory and runs anyway, because OpenNebula needs it.

::code{file="platform/gitea/install-gitea.sh"}

```bash
sudo ~/cc/platform/gitea/install-gitea.sh
```

The script verifies the checksum of the program, creates the system user `git` and writes the configuration itself, so no install wizard in the browser is needed. Gitea stores its data in SQLite and runs as a systemd service. Nobody can sign up on their own, and without signing in you see nothing. In the browser of the client (the Kali VM on smartlearn, your PC with your own hypervisor), Gitea is on port 3000 of the front-end. You sign in as `platform` with the password from `~/cc-lab/gitea/platform.pass`.

## The repo platform

A second script creates the organization `wolkenwerk`, the private repo `platform` and two tokens.

::code{file="platform/gitea/make-repo.sh"}

```bash
~/cc/platform/gitea/make-repo.sh
```

| Token | Rights | Used by |
|---|---|---|
| `platform.token` | write repos and the organization | you, when pushing |
| `argocd.token` | read repos | Argo CD |

Argo CD only gets read access. If its token ends up in the wrong place, nobody can use it to change the desired state.

Since chapter 4.2, `~/platform` holds the template. The files for Argo CD contain the placeholder `FRONTEND`, which you replace with the address of your front-end. Then you turn the folder into a Git repo and push it to Gitea.

```bash
source /etc/cc-lab.env
cd ~/platform
sed -i "s#http://FRONTEND:3000#http://$CC_FE_IP:3000#" root.yaml apps/*.yaml
git init -b main
git config user.name "Platform team"
git config user.email "platform@wolkenwerk.example"
git config credential.helper store
printf 'http://platform:%s@%s:3000\n' "$(cat ~/cc-lab/gitea/platform.token)" "$CC_FE_IP" > ~/.git-credentials
chmod 600 ~/.git-credentials
git add .
git status
git commit -m "Platform of Wolkenwerk Bern"
git remote add origin "http://$CC_FE_IP:3000/wolkenwerk/platform.git"
git push -u origin main
```

Before the commit, `git status` shows no OpenTofu state, because `.gitignore` keeps it out. After the push, Gitea shows the folders `tofu`, `apps`, `webshop`, `templates` and `members`.

## The web shop

The bike shop's web shop is a small Python program that only uses the standard library. It lives in the course repo under `case/webshop/`.

| Path | Answer |
|---|---|
| `/` | the shop page with the bikes |
| `/api/products` | the products as JSON |
| `/healthz` | `ok`, for the Kubernetes probes |
| `/metrics` | requests and response times in the Prometheus format, the topic of part 5 |

The CI of the course repo builds an image from it and publishes it to the GitHub container registry as `ghcr.io/ndum/cc/webshop:1.0.0`. The image is based on the official `python:3.14-slim` image and runs as an unprivileged user.

::code{file="case/webshop/Containerfile"}

In the platform repo, three files describe the shop in the cluster.

::code{file="platform/repo/webshop/deployment.yaml"}

The deployment keeps two pods running and gives them requests and limits for CPU and memory. The probes call `/healthz`. A pod only receives requests once its readiness probe answers, and Kubernetes restarts it when the liveness probe fails. The service `webshop` gives the pods a fixed name, and the ingress tells Traefik to forward requests on port 80 of both VMs to the service.

## Argo CD

Argo CD is a CNCF project and runs as a set of controllers in the cluster. It reads repos, renders the manifests, with Kustomize or Helm as well, compares them with the cluster and reconciles. An application tells it which folder of which repo belongs in which namespace.

A script installs Argo CD with Helm, stores the token for Gitea and applies the first application.

::code{file="platform/bootstrap-argocd.sh"}

::code{file="platform/argocd/values.yaml"}

```bash
~/cc/platform/bootstrap-argocd.sh
kubectl -n argocd get pods
kubectl -n argocd get applications
```

The token reaches Argo CD as a secret with the label `argocd.argoproj.io/secret-type=repository`. In the lab, a first attempt with `kubectl create secret --from-file` failed. The secret contained the line break at the end of the file, and Gitea answered "authentication required". The script therefore strips the line break first.

## App of apps

The first application is called `root`. It points to the folder `apps` in the repo, which holds more applications.

::code{file="platform/repo/root.yaml"}

::code{file="platform/repo/apps/webshop.yaml"}

Argo CD first rolls out `root` and finds the application `webshop` in it, which brings the folder `webshop` into the namespace `velo`. Adding an application only takes a new file in `apps`, and you no longer need `kubectl` for it. This pattern is called app of apps.

![App of apps in the platform repo. The bootstrap script applies the application root once, and root points to the folder apps. That folder holds the application webshop, which brings the folder webshop into the namespace velo, and the ApplicationSet members from chapter 4.5. The ApplicationSet generates a separate application for every folder under members, such as member-velo and member-gemeinde. Notice that only root enters the cluster by hand, and everything else comes from files in Git.](../../../../assets/figures/en/p4c4-app-of-apps.svg)

| Setting | Effect |
|---|---|
| `automated` | Argo CD reconciles without a click as soon as Git changes |
| `prune: true` | whatever disappears from Git, Argo CD also deletes in the cluster |
| `selfHeal: true` | whatever someone changes in the cluster by hand, Argo CD resets to the state in Git |
| `CreateNamespace=true` | Argo CD creates the namespace if it is missing |

In the lab, all applications were `Synced` and `Healthy` 5 to 15 seconds after the bootstrap. Here Argo CD polls Gitea every minute, as set by `timeout.reconciliation` in the values. Without that setting, the interval would be three minutes.

## Access from the client

The cluster sits in the internal network `cc-net`, which only the front-end can reach. So that the browser of the client can open Argo CD and the web shop, you forward two ports through SSH in the terminal of the client. The addresses come from your parameters.

```bash
ssh -L 8080:<server-address>:30080 -L 8081:<server-address>:80 mmuster-fe
```

While the connection is open, `http://localhost:8080/` shows the Argo CD interface and `http://localhost:8081/` the web shop. In Argo CD you sign in as `admin` with the password from `~/cc-lab/argocd-admin.pass`, where the script stored it. Gitea is reachable directly on port 3000 of the front-end until the firewall of chapter 6.1 closes the port from outside.

## Showing reconciliation

You see self-heal fastest when you change the cluster without going through Git.

```bash
kubectl -n velo scale deployment webshop --replicas=4
kubectl -n velo get deployment webshop
kubectl -n velo delete deployment webshop
kubectl -n velo get deployment webshop
```

In the lab the deployment was back to two pods after about a second on the first try, and the deleted deployment returned after three seconds. Its pods only ran again after a good 40 seconds. A web shop pod takes 30 seconds to stop. The program ignores the signal to stop, so Kubernetes waits for the full grace period. Until then the old pods count against the quota of the namespace `velo` from chapter 4.5. After the test with four pods its 2 CPUs of limits are used up, and `kubectl -n velo get events` reports "exceeded quota". If you repeat it, Argo CD waits a little longer each time, so that self-heal and a person do not take turns forever. A change through Git takes longer, because Argo CD only learns about it at its next poll.

```bash
cd ~/platform
sed -i 's/replicas: 2/replicas: 3/' webshop/deployment.yaml
git commit -am "Web shop with three pods for the season"
git push
```

In the lab the third pod was running 40 seconds to a good two minutes after the push, because Argo CD polls every minute and shifts each poll by a random amount. A webhook from Gitea to Argo CD would trigger the sync at once. For the lab, polling every minute is enough.

::::exercise[Lab]
Install Gitea, create the repo, roll out Argo CD and open the web shop and Argo CD in the browser of the client. Change the number of pods through Git.

:::solution
`kubectl -n argocd get applications` shows `root`, `webshop` and `member-velo` as `Synced` and `Healthy`. `member-velo` already comes with the first push, chapter 4.5 explains it. The web shop shows the bikes and, at the bottom, the name of the pod that answered. After a push with `replicas: 3`, `kubectl -n velo get pods` shows three pods after a good two minutes at most, and Argo CD shows the new commit on the application.
:::
::::

::::exercise[Back to the old state]
The new version with three pods was a mistake. How do you restore the old state without using `kubectl`?

:::solution
`git revert HEAD` creates a commit that undoes the last change, and `git push` sends it to Gitea. Argo CD reconciles at its next poll and removes the third pod. The mistake and its correction both stay visible in the Git history.
:::
::::

::::exercise[Rights]
Who still needs write access to the cluster after this chapter, and what does that mean for the kubeconfig on the front-end?

:::solution
For day-to-day operation only Argo CD, everything else goes through Git. You need the kubeconfig with full rights for the bootstrap, for troubleshooting and in an emergency. A team would give it to few people and create read-only accounts for everyday work.
:::
::::
