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
Nach diesem Kapitel kannst du

- die vier Prinzipien von GitOps erklären,
- begründen, warum der Git-Server ausserhalb des Clusters läuft, den er steuert,
- Gitea auf dem Front-end betreiben und ein Repo mit Zugriff nur zum Lesen freigeben,
- Argo CD installieren und mit Applications den Webshop aus Git ausrollen,
- Sync, Prune und Self-Heal an einem Beispiel zeigen.
:::

## GitOps

Mit OpenTofu beschreibst du die VMs in Code, ausführen musst du ihn aber selbst. GitOps geht einen Schritt weiter. Die Arbeitsgruppe OpenGitOps der CNCF fasst es in vier Prinzipien.

| Prinzip | Bedeutung |
|---|---|
| Deklarativ | Das System ist als Soll-Zustand beschrieben. |
| Versioniert und unveränderlich | Der Soll-Zustand liegt in einem Speicher, der jede Version behält, meist Git. |
| Automatisch geholt | Software im System holt sich den Soll-Zustand selbst ab. |
| Laufend abgeglichen | Dieselbe Software vergleicht Soll und Ist ständig und gleicht Abweichungen an. |

Der Unterschied zum klassischen Ausrollen liegt in der Richtung. Bei einem Push-Ansatz meldet sich eine Pipeline oder ein Mensch mit Rechten am Cluster an und spielt Änderungen ein. Bei GitOps braucht ausser dem Agent im Cluster niemand diese Rechte. Wer etwas ändern will, ändert Git, und die Geschichte von Git ist zugleich das Protokoll aller Änderungen.

## Gitea auf dem Front-end

Argo CD, der Agent dieses Kapitels, braucht ein Git-Repo, das er aus dem Cluster erreicht. Das Plattform-Team betreibt dafür ein eigenes Gitea. Gitea ist ein schlanker Git-Server mit Weboberfläche, Benutzern, Organisationen und Pull Requests, unter der Lizenz MIT.

Gitea läuft auf dem Front-end und nicht im Cluster. In Meilenstein 2 baust du den Cluster live neu auf. Läge der Soll-Zustand in einem Gitea im selben Cluster, wäre er nach `tofu destroy` weg, und der neue Cluster wüsste nicht, was er ausrollen soll. Ein Werkzeug, das ein System wiederherstellt, darf nicht vom System abhängen, das es wiederherstellt. Der Front-end hat genug Speicher, und er muss ohnehin laufen, damit OpenNebula läuft.

::code{file="platform/gitea/install-gitea.sh"}

```bash
sudo ~/cc/platform/gitea/install-gitea.sh
```

Das Skript prüft die Prüfsumme des Programms, legt den Systembenutzer `git` an und schreibt die Konfiguration selbst, damit kein Installationsassistent im Browser nötig ist. Gitea speichert in SQLite und läuft als Dienst von systemd. Neue Konten kann niemand selbst anlegen, und ohne Anmeldung sieht man nichts. Im Browser erreichst du Gitea unter Port 3000 des Front-ends und meldest dich als `platform` mit dem Passwort aus `~/cc-lab/gitea/platform.pass` an.

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

`git status` zeigt vor dem Commit keinen State von OpenTofu, `.gitignore` hält ihn draussen. In Gitea siehst du danach die Ordner `tofu`, `apps`, `webshop`, `templates` und `members`.

## Der Webshop

Der Webshop des Veloateliers ist ein kleines Programm in Python, das nur die Standardbibliothek nutzt. Es liegt im Kursrepo unter `case/webshop/`.

| Pfad | Antwort |
|---|---|
| `/` | die Seite des Shops mit den Velos |
| `/api/products` | die Produkte als JSON |
| `/healthz` | `ok`, für die Proben von Kubernetes |
| `/metrics` | Anfragen und Antwortzeiten im Format von Prometheus, Thema von Teil 5 |

Die CI des Kursrepos baut daraus ein Image und legt es in der Registry von GitHub ab, `ghcr.io/ndum/cc/webshop:1.0.0`. Das Image beruht auf dem offiziellen Image `python:3.14-slim` und läuft als Benutzer ohne Rechte.

::code{file="case/webshop/Containerfile"}

Im Plattform-Repo beschreiben drei Dateien den Shop im Cluster.

::code{file="platform/repo/webshop/deployment.yaml"}

Das Deployment hält zwei Pods am Laufen und gibt ihnen Requests und Limits für CPU und Speicher. Die Proben fragen `/healthz` ab. Ein Pod bekommt erst Anfragen, wenn die Readiness-Probe antwortet, und Kubernetes startet ihn neu, wenn die Liveness-Probe ausbleibt. Der Service `webshop` gibt den Pods einen festen Namen, und der Ingress lässt Traefik Anfragen auf Port 80 der beiden VMs an den Service weiterleiten.

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

Das Token geht als Secret mit dem Label `argocd.argoproj.io/secret-type=repository` an Argo CD. Im Lab scheiterte ein erster Versuch mit `kubectl create secret --from-file`. Das Secret enthielt den Zeilenumbruch am Ende der Datei, und Gitea antwortete mit «authentication required». Das Skript entfernt den Zeilenumbruch darum vorher.

## App of Apps

Die erste Application heisst `root`. Sie zeigt auf den Ordner `apps` im Repo, in dem weitere Applications liegen.

::code{file="platform/repo/root.yaml"}

::code{file="platform/repo/apps/webshop.yaml"}

Argo CD rollt also zuerst `root` aus und findet darin die Application `webshop`, die den Ordner `webshop` in den Namespace `velo` bringt. Eine neue Anwendung braucht nur eine neue Datei in `apps`, mit `kubectl` arbeitest du danach nicht mehr. Dieses Muster heisst App of Apps.

| Einstellung | Wirkung |
|---|---|
| `automated` | Argo CD gleicht ohne Klick ab, sobald Git sich ändert |
| `prune: true` | was aus Git verschwindet, löscht Argo CD auch im Cluster |
| `selfHeal: true` | was jemand im Cluster von Hand ändert, setzt Argo CD auf den Stand von Git zurück |
| `CreateNamespace=true` | Argo CD legt den Namespace an, wenn er fehlt |

Im Lab waren alle Applications 5 Sekunden nach dem Bootstrap `Synced` und `Healthy`. Argo CD fragt Gitea hier jede Minute ab, die Einstellung `timeout.reconciliation` in den Werten. Ohne sie wären es drei Minuten.

## Zugriff vom eigenen Rechner

Der Cluster liegt im internen Netz `cc-net`, das nur der Front-end erreicht. Für den Browser auf deinem Rechner leitest du zwei Ports durch SSH weiter, mit den Adressen aus deinen Parametern.

```bash
ssh -L 8080:<adresse-des-servers>:30080 -L 8081:<adresse-des-servers>:80 mmuster-fe
```

Solange die Verbindung offen ist, zeigt `http://localhost:8080/` die Oberfläche von Argo CD und `http://localhost:8081/` den Webshop. In Argo CD meldest du dich als `admin` mit dem Passwort an, das das Skript ausgegeben hat. Gitea erreichst du direkt unter Port 3000 des Front-ends.

## Abgleich zeigen

Self-Heal siehst du am schnellsten, wenn du gegen Git arbeitest.

```bash
kubectl -n velo scale deployment webshop --replicas=5
kubectl -n velo get deployment webshop
kubectl -n velo delete deployment webshop
kubectl -n velo get deployment webshop
```

Im Lab stand das Deployment nach etwa einer Sekunde wieder auf zwei Pods, und das gelöschte Deployment war nach drei Sekunden zurück. Eine Änderung über Git dauert länger, weil Argo CD erst bei der nächsten Abfrage davon erfährt.

```bash
cd ~/platform
sed -i 's/replicas: 2/replicas: 3/' webshop/deployment.yaml
git commit -am "Webshop mit drei Pods für die Saison"
git push
```

Im Lab lief der dritte Pod 83 Sekunden nach dem Push. Ein Webhook von Gitea an Argo CD würde den Abgleich sofort auslösen, das Lab kommt mit der Abfrage jede Minute aus.

::::exercise[Lab]
Installiere Gitea, lege das Repo an, rolle Argo CD aus und öffne Webshop und Argo CD im Browser deines Rechners. Ändere die Zahl der Pods über Git.

:::solution
`kubectl -n argocd get applications` zeigt `root` und `webshop` als `Synced` und `Healthy`, später auch `member-velo` aus Kapitel 4.5. Der Webshop zeigt die Velos und unten den Namen des Pods, der geantwortet hat. Nach einem Push mit `replicas: 3` zeigt `kubectl -n velo get pods` innerhalb von ein bis zwei Minuten drei Pods, und in Argo CD erscheint der neue Commit bei der Application.
:::
::::

::::exercise[Zurück zum alten Stand]
Die neue Version mit drei Pods war ein Fehler. Wie stellst du den alten Stand wieder her, ohne `kubectl` zu benutzen?

:::solution
`git revert HEAD` legt einen Commit an, der die letzte Änderung rückgängig macht, `git push` schickt ihn an Gitea. Argo CD gleicht bei der nächsten Abfrage ab und entfernt den dritten Pod. Der Fehler und seine Korrektur bleiben in der Geschichte von Git sichtbar.
:::
::::

::::exercise[Rechte]
Wer braucht nach diesem Kapitel noch Schreibrechte auf den Cluster, und was bedeutet das für die kubeconfig auf dem Front-end?

:::solution
Für den Betrieb nur noch Argo CD, alles andere geht über Git. Die kubeconfig mit vollen Rechten brauchst du zum Bootstrap, für die Fehlersuche und im Notfall. In einem Team würde man sie wenigen Personen geben und für den Alltag Konten mit Leserechten anlegen.
:::
::::
