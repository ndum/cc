---
title: GitOps mit Argo CD
description: Der Soll-Zustand des Clusters in Git, ein Gitea des Plattform-Teams auf dem Front-end, der Webshop des Veloateliers als Container und Argo CD mit Applications, Sync, Prune und Self-Heal.
sidebar:
  order: 4
---

:::assignment
«Unser Webshop soll im Frühling laufen», schreibt das Veloatelier Matte. «Wir möchten Änderungen selbst vorschlagen können, ohne dass jemand von euch nachts auf einem Server Befehle eintippt.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Die vier Prinzipien von GitOps erklären
- Begründen, warum der Git-Server ausserhalb des Clusters läuft, den er steuert
- Gitea auf dem Front-end betreiben und ein Repo mit Zugriff nur zum Lesen freigeben
- Argo CD installieren und mit Applications den Webshop aus Git ausrollen
- Sync, Prune und Self-Heal an einem Beispiel zeigen
:::

## GitOps

Mit OpenTofu beschreibst du die VMs in Code, ausführen musst du ihn aber selbst. Bei GitOps übernimmt das eine Software im System. Die Arbeitsgruppe OpenGitOps der CNCF fasst GitOps in vier Prinzipien zusammen.

| Prinzip | Bedeutung |
|---|---|
| Deklarativ | Das System ist als Soll-Zustand beschrieben. |
| Versioniert und unveränderlich | Der Soll-Zustand liegt in einem Speicher, der jede Version behält, meist Git. |
| Automatisch geholt | Software im System holt sich den Soll-Zustand selbst ab. |
| Laufend abgeglichen | Dieselbe Software vergleicht Soll und Ist ständig und gleicht Abweichungen an. |

Der Unterschied zum klassischen Ausrollen liegt in der Richtung. Bei einem Push-Ansatz meldet sich eine Pipeline oder ein Mensch mit Rechten am Cluster an und spielt Änderungen ein. Bei GitOps braucht ausser dem Agent im Cluster niemand diese Rechte. Wer etwas ändern will, ändert Git. Die Geschichte von Git ist zugleich das Protokoll aller Änderungen.

![Der Kreislauf von GitOps. Das Plattform-Team schickt eine Änderung mit git push an Gitea auf dem Front-end oder öffnet einen Pull Request, der nach der Prüfung zusammengeführt wird. Argo CD im k3s-Cluster holt das Repo wolkenwerk/platform jede Minute mit Leserechten. Es vergleicht den Soll-Zustand aus Git mit dem Ist-Zustand und wendet die Unterschiede an, etwa beim Webshop im Namespace velo. Ändert jemand den Cluster von Hand mit kubectl scale, setzt Self-Heal die Änderung zurück. Achte auf die Richtung der Pfeile. Argo CD holt sich den Soll-Zustand selbst, niemand schickt ihn in den Cluster.](../../../assets/figures/de/p4c4-gitops.svg)

## Gitea auf dem Front-end

Argo CD, der Agent dieses Kapitels, braucht ein Git-Repo, das er aus dem Cluster erreicht. Das Plattform-Team betreibt dafür ein eigenes Gitea. Gitea ist ein schlanker Git-Server mit Weboberfläche, Benutzern, Organisationen und Pull Requests, unter der Lizenz MIT.

Gitea läuft auf dem Front-end, ausserhalb des Clusters. Den Cluster baust du spätestens in Kapitel 6.2 für etcd neu auf, im [Zusatzauftrag A](../advanced/#auftrag-a--neubau-der-plattform) von Kapitel 4.6 schon früher. Läge der Soll-Zustand in einem Gitea im selben Cluster, wäre er nach `tofu destroy` weg. Der neue Cluster wüsste dann nicht, was er ausrollen soll. Der Soll-Zustand, aus dem ein Cluster neu entsteht, gehört deshalb nicht in diesen Cluster. Das Front-end hat genug Speicher und läuft ohnehin, weil OpenNebula es braucht.

::code{file="platform/gitea/install-gitea.sh"}

```bash
sudo ~/cc/platform/gitea/install-gitea.sh
```

Das Skript prüft die Prüfsumme des Programms, legt den Systembenutzer `git` an und schreibt die Konfiguration selbst, damit kein Installationsassistent im Browser nötig ist. Gitea speichert seine Daten in SQLite und läuft als Dienst von systemd. Niemand kann sich selbst ein Konto anlegen. Ohne Anmeldung sieht man nichts. Im Browser des Clients (auf smartlearn die Kali-VM, mit eigenem Hypervisor dein PC) erreichst du Gitea unter Port 3000 des Front-ends. Du meldest dich als `platform` mit dem Passwort aus `~/cc-lab/gitea/platform.pass` an.

## Das Repo platform

Ein zweites Skript legt die Organisation `wolkenwerk`, das private Repo `platform` und zwei Tokens an.

::code{file="platform/gitea/make-repo.sh"}

```bash
~/cc/platform/gitea/make-repo.sh
```

| Token | Rechte | Wer es nutzt |
|---|---|---|
| `platform.token` | Repos und Organisation schreiben | du, beim Push |
| `argocd.token` | Repos lesen | Argo CD |

Argo CD bekommt nur Leserechte. Gelangt sein Token an die falsche Stelle, kann damit niemand den Soll-Zustand ändern.

In `~/platform` liegt seit Kapitel 4.2 die Vorlage. Die Dateien für Argo CD enthalten den Platzhalter `FRONTEND`, den du durch die Adresse deines Front-ends ersetzt. Danach machst du daraus ein Git-Repo und schickst es an Gitea.

```bash
source /etc/cc-lab.env
cd ~/platform
sed -i "s#http://FRONTEND:3000#http://$CC_FE_IP:3000#" root.yaml apps/*.yaml
git init -b main
git config user.name "Plattform-Team"
git config user.email "platform@wolkenwerk.example"
git config credential.helper store
printf 'http://platform:%s@%s:3000\n' "$(cat ~/cc-lab/gitea/platform.token)" "$CC_FE_IP" > ~/.git-credentials
chmod 600 ~/.git-credentials
git add .
git status
git commit -m "Plattform von Wolkenwerk Bern"
git remote add origin "http://$CC_FE_IP:3000/wolkenwerk/platform.git"
git push -u origin main
```

Vor dem Commit zeigt `git status` keinen State von OpenTofu, weil `.gitignore` ihn draussen hält. Nach dem Push zeigt Gitea die Ordner `tofu`, `apps`, `webshop`, `templates` sowie `members`.

## Der Webshop

Der Webshop des Veloateliers ist ein kleines Programm in Python, das nur die Standardbibliothek nutzt. Es liegt im Kursrepo unter `case/webshop/`.

| Pfad | Antwort |
|---|---|
| `/` | die Seite des Shops mit den Velos |
| `/api/products` | die Produkte als JSON |
| `/healthz` | `ok`, für die Proben von Kubernetes |
| `/metrics` | Anfragen und Antwortzeiten im Format von Prometheus, Thema von Teil 5 |

Die CI des Kursrepos baut daraus ein Image und legt es in der Registry von GitHub ab, `ghcr.io/ndum/cc/webshop:1.0.0`. Das Image beruht auf dem offiziellen Image `python:3.14-slim` und läuft als Benutzer ohne Root-Rechte.

::code{file="case/webshop/Containerfile"}

Im Plattform-Repo beschreiben drei Dateien den Shop im Cluster.

::code{file="platform/repo/webshop/deployment.yaml"}

Das Deployment hält zwei Pods am Laufen und gibt ihnen Requests und Limits für CPU und Speicher. Die Proben fragen `/healthz` ab. Ein Pod bekommt erst Anfragen, wenn die Readiness-Probe antwortet. Bleibt die Liveness-Probe aus, startet Kubernetes ihn neu. Der Service `webshop` gibt den Pods einen festen Namen. Über den Ingress leitet Traefik Anfragen auf Port 80 der beiden VMs an den Service weiter.

## Argo CD

Argo CD ist ein Projekt der CNCF und läuft als Satz von Controllern im Cluster. Er liest Repos, rendert die Manifeste, auch mit Kustomize oder Helm, vergleicht sie mit dem Cluster und gleicht ab. Eine Application sagt ihm, welcher Ordner welches Repos in welchen Namespace gehört.

Ein Skript installiert Argo CD mit Helm, hinterlegt das Token für Gitea und wendet die erste Application an.

::code{file="platform/bootstrap-argocd.sh"}

::code{file="platform/argocd/values.yaml"}

```bash
~/cc/platform/bootstrap-argocd.sh
kubectl -n argocd get pods
kubectl -n argocd get applications
```

Das Token geht als Secret mit dem Label `argocd.argoproj.io/secret-type=repository` an Argo CD. Im Lab scheiterte ein erster Versuch mit `kubectl create secret --from-file`. Das Secret enthielt den Zeilenumbruch am Ende der Datei, worauf Gitea mit «authentication required» antwortete. Das Skript entfernt den Zeilenumbruch darum vorher.

## App of Apps

Die erste Application heisst `root`. Sie zeigt auf den Ordner `apps` im Repo, in dem weitere Applications liegen.

::code{file="platform/repo/root.yaml"}

::code{file="platform/repo/apps/webshop.yaml"}

Argo CD rollt also zuerst `root` aus und findet darin die Application `webshop`, die den Ordner `webshop` in den Namespace `velo` bringt. Für eine neue Anwendung legst du nur eine Datei in `apps` an, `kubectl` brauchst du dafür nicht mehr. Dieses Muster heisst App of Apps.

![App of Apps im Plattform-Repo. Die Application root wendet das Skript beim Bootstrap einmal an, sie zeigt auf den Ordner apps. Darin liegen das ApplicationSet members aus Kapitel 4.5 und die Application webshop, die den Ordner webshop in den Namespace velo bringt. Das ApplicationSet erzeugt für jeden Ordner unter members eine eigene Application, etwa member-velo und member-gemeinde. Achte darauf, dass nur root von Hand in den Cluster kommt, alles Weitere entsteht aus Dateien in Git.](../../../assets/figures/de/p4c4-app-of-apps.svg)

| Einstellung | Wirkung |
|---|---|
| `automated` | Argo CD gleicht ohne Klick ab, sobald Git sich ändert |
| `prune: true` | was aus Git verschwindet, löscht Argo CD auch im Cluster |
| `selfHeal: true` | was jemand im Cluster von Hand ändert, setzt Argo CD auf den Stand von Git zurück |
| `CreateNamespace=true` | Argo CD legt den Namespace an, wenn er fehlt |

Im Lab waren alle Applications 5 Sekunden nach dem Bootstrap `Synced` und `Healthy`. Argo CD fragt Gitea hier jede Minute ab, das legt `timeout.reconciliation` in den Werten fest. Ohne diese Einstellung wären es drei Minuten.

## Zugriff vom Client

Der Cluster liegt im internen Netz `cc-net`, das nur vom Front-end aus erreichbar ist. Damit der Browser des Clients Argo CD und den Webshop öffnen kann, leitest du im Terminal des Clients zwei Ports durch SSH weiter. Die Adressen stehen in deinen Parametern.

```bash
ssh -L 8080:<adresse-des-servers>:30080 -L 8081:<adresse-des-servers>:80 mmuster-fe
```

Solange die Verbindung offen ist, zeigt `http://localhost:8080/` die Oberfläche von Argo CD und `http://localhost:8081/` den Webshop. In Argo CD meldest du dich als `admin` mit dem Passwort aus `~/cc-lab/argocd-admin.pass` an, das Skript hat es dort abgelegt. Gitea erreichst du direkt unter Port 3000 des Front-ends, bis die Firewall aus Kapitel 6.1 den Port von aussen sperrt.

## Abgleich zeigen

Self-Heal siehst du am schnellsten, wenn du den Cluster an Git vorbei änderst.

```bash
kubectl -n velo scale deployment webshop --replicas=4
kubectl -n velo get deployment webshop
kubectl -n velo delete deployment webshop
kubectl -n velo get deployment webshop
```

Im Lab stand das Deployment beim ersten Versuch nach etwa einer Sekunde wieder auf zwei Pods. Das gelöschte Deployment war nach drei Sekunden zurück. Wiederholst du den Versuch, wartet Argo CD jedes Mal etwas länger, damit sich Self-Heal und ein Mensch nicht endlos abwechseln. Eine Änderung über Git dauert länger, weil Argo CD erst bei der nächsten Abfrage davon erfährt.

```bash
cd ~/platform
sed -i 's/replicas: 2/replicas: 3/' webshop/deployment.yaml
git commit -am "Webshop mit drei Pods für die Saison"
git push
```

Im Lab lief der dritte Pod ein bis gut zwei Minuten nach dem Push, denn Argo CD fragt jede Minute ab und verschiebt die Abfrage um einen zufälligen Anteil. Ein Webhook von Gitea an Argo CD würde den Abgleich sofort auslösen. Für das Lab genügt die Abfrage jede Minute.

::::exercise[Lab]
Installiere Gitea, lege das Repo an, rolle Argo CD aus und öffne Webshop und Argo CD im Browser des Clients. Ändere die Zahl der Pods über Git.

:::solution
`kubectl -n argocd get applications` zeigt `root` und `webshop` sowie `member-velo` als `Synced` und `Healthy`. `member-velo` kommt schon mit dem ersten Push, Kapitel 4.5 erklärt es. Der Webshop zeigt die Velos und unten den Namen des Pods, der geantwortet hat. Nach einem Push mit `replicas: 3` zeigt `kubectl -n velo get pods` innerhalb von ein bis zwei Minuten drei Pods. In Argo CD erscheint der neue Commit bei der Application.
:::
::::

::::exercise[Zurück zum alten Stand]
Die neue Version mit drei Pods war ein Fehler. Wie stellst du den alten Stand wieder her, ohne `kubectl` zu benutzen?

:::solution
`git revert HEAD` legt einen Commit an, der die letzte Änderung rückgängig macht, `git push` schickt ihn an Gitea. Argo CD gleicht bei der nächsten Abfrage ab und entfernt den dritten Pod. Der Fehler und seine Korrektur bleiben in der Geschichte von Git sichtbar.
:::
::::

::::exercise[Rechte]
Wer braucht nach diesem Kapitel noch Schreibrechte auf den Cluster und was bedeutet das für die kubeconfig auf dem Front-end?

:::solution
Für den Betrieb nur noch Argo CD, alles andere geht über Git. Die kubeconfig mit vollen Rechten brauchst du zum Bootstrap, für die Fehlersuche und im Notfall. In einem Team würde man sie wenigen Personen geben und für den Alltag Konten mit Leserechten anlegen.
:::
::::
