---
title: Werkzeuge der Plattform
description: Argo CD, Helm, Kustomize, Prometheus, Alertmanager, Grafana, Loki, Alloy und Sealed Secrets mit Zweck, Aufbau, wichtigen Begriffen, der Version im Kurs und der Installation im Lab.
sidebar:
  order: 5
---

:::goals
Nach diesem Kapitel kannst du:

- Für jedes Werkzeug der Plattform sagen, wozu es dient, wie es ins Lab kommt und in welchem Kapitel es vorkommt
- Den Aufbau von Argo CD, des Monitoring-Stacks und von Sealed Secrets in wenigen Sätzen beschreiben
- Helm und Kustomize unterscheiden und erklären, wie Argo CD beide nutzt
- Die Versionen in deinem Plattform-Repo finden und die Dokumentation derselben Version öffnen
- In deinem Lab mit Befehlen, die nichts ändern, nachsehen, wie jedes Werkzeug läuft
:::

Ab Teil 4 kommen neun Werkzeuge dazu. Die Kapitel führen jedes dort ein, wo es gebraucht wird. Diese Ergänzung sammelt Zweck, Aufbau, Begriffe und Installation an einem Ort. OpenTofu und Gitea fehlen hier, sie stehen ausführlich in den Kapiteln [4.2](../../platform/opentofu/) und [4.4](../../platform/gitops/).

## Übersicht

| Werkzeug | Aufgabe | Version im Lab | So kommt es ins Lab | Kapitel |
|---|---|---|---|---|
| Argo CD | gleicht den Cluster laufend an Git an | 3.5.6, Chart argo-cd 10.11.6 | Helm, einmal mit `bootstrap-argocd.sh` | [4.4](../../platform/gitops/), [4.5](../../platform/templates/) |
| Helm | installiert Pakete, sogenannte Charts | 4.3.0 | Paketquelle von Helm mit `install-tools.sh` | [4.2](../../platform/opentofu/), [4.4](../../platform/gitops/) |
| Kustomize | setzt Manifeste aus Vorlage und Patches zusammen | 5.8.1 in kubectl 1.36.6 | in kubectl und Argo CD eingebaut | [4.5](../../platform/templates/) |
| Prometheus | holt Metriken ab und wertet Regeln aus | 3.15.1, Chart kube-prometheus-stack 92.17.0 | Argo CD, Application `monitoring` | [5.1](../../observability/metrics/) |
| Alertmanager | gruppiert Alerts und leitet sie weiter | 0.34.2, Chart kube-prometheus-stack 92.17.0 | Argo CD, Application `monitoring` | [5.3](../../observability/slo/) |
| Grafana | zeigt Abfragen als Dashboards | 13.3.0, Chart kube-prometheus-stack 92.17.0 | Argo CD, Application `monitoring` | [5.1](../../observability/metrics/), [5.2](../../observability/logs/) |
| Loki | speichert Logs | 3.6.16, Chart loki 7.5.0 | Argo CD, Application `loki` | [5.2](../../observability/logs/) |
| Alloy | sammelt die Logs der Pods | 1.21.3, Chart alloy 1.15.0 | Argo CD, Application `alloy` | [5.2](../../observability/logs/) |
| Sealed Secrets | verschlüsselt Secrets für Git | 0.41.2, Chart sealed-secrets 2.22.0 | Argo CD, Application `sealed-secrets`, dazu `kubeseal` mit `install-kubeseal.sh` | [6.1](../../operations/security/), [6.2](../../operations/backup/) |

![Die Werkzeuge der Plattform. Oben das Front-end mit Helm, Gitea und kubeseal. Helm installiert Argo CD einmal mit bootstrap-argocd.sh in den Namespace argocd. Argo CD holt dein Plattform-Repo jede Minute aus Gitea. Ordner wie webshop/ und members/ rendert es mit Kustomize und bringt so Webshop und Mitglieder in die Namespaces velo und gemeinde. Charts rendert es mit Helm. So kommen Prometheus, Alertmanager, Grafana, Loki und Alloy in den Namespace monitoring, der Controller von Sealed Secrets nach kube-system. kubeseal verschlüsselt ein Secret, seal-secrets.sh legt es als SealedSecret in dein Repo. Achte darauf, dass Helm auf dem Front-end nur Argo CD installiert. Alles andere bringt Argo CD aus Git in den Cluster.](../../../assets/figures/de/ex-tools.svg)

Die Versionen der Charts legt dein Plattform-Repo bei `targetRevision` der Applications in `apps/` fest, die Version von Argo CD steht in `bootstrap-argocd.sh` im Kursrepo. Ein Chart hat eine eigene Versionsnummer und nennt in `appVersion` die Version des Programms, das es installiert. Das Chart argo-cd 10.11.6 bringt so Argo CD 3.5.6. `install-tools.sh` holt Helm in der neusten Version aus seiner Paketquelle und kubectl aus der Reihe 1.36. Die Links auf dieser Seite führen zur Dokumentation der Versionen aus der Tabelle, weil sich Felder und Standardwerte zwischen Versionen ändern.

Fast alles kommt über Argo CD in den Cluster. Argo CD holt dein Repo aus Gitea, rendert Charts mit Helm und Ordner mit Kustomize und wendet das Ergebnis an.

## Argo CD

Argo CD ist ein Projekt der CNCF und ein Controller für GitOps. Er vergleicht den Soll-Zustand aus Git mit dem Ist-Zustand im Cluster und gleicht Abweichungen an. Im Namespace `argocd` laufen dafür mehrere Teile, wie die [Beschreibung der Architektur](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/architecture/) zeigt.

| Teil | Aufgabe |
|---|---|
| API-Server | Weboberfläche und API, im Lab als NodePort 30080 |
| Repository-Server | holt die Repos, rendert die Manifeste mit Helm oder Kustomize und hält sie im Cache |
| Application Controller | vergleicht Soll und Ist, führt den Sync aus und meldet Sync-Status und Health |
| ApplicationSet-Controller | erzeugt Applications nach einem Muster, im Kurs eine pro Ordner unter `members` |
| Redis | Cache für die anderen Teile |

Eine **Application** verbindet eine Quelle in Git mit einem Ziel im Cluster. Der Sync-Status sagt, ob der Cluster Git entspricht (`Synced` oder `OutOfSync`), Health, ob die Objekte laufen (`Healthy`, `Progressing` oder `Degraded`). Ein Refresh vergleicht nur, ein Sync wendet an. Prune löscht, was aus Git verschwunden ist, Self-Heal setzt Änderungen von Hand zurück. Liegt in einem Ordner eine `Chart.yaml`, rendert Argo CD mit Helm, bei einer `kustomization.yaml` mit Kustomize, sonst nimmt er die Dateien, wie sie sind. Jedes verwaltete Objekt trägt die Annotation `argocd.argoproj.io/tracking-id`. Die [Grundbegriffe](https://argo-cd.readthedocs.io/en/release-3.5/core_concepts/) stehen in der Dokumentation von Argo CD 3.5.

Das Skript `bootstrap-argocd.sh` aus [Kapitel 4.4](../../platform/gitops/) installiert das Chart mit Helm. Seine Werte schalten Dex für die Anmeldung über fremde Konten und den Dienst für Benachrichtigungen aus. Die Oberfläche antwortet ohne TLS. Argo CD fragt Git jede Minute ab statt alle drei Minuten. Danach legt das Skript das Secret mit dem Lese-Token für Gitea an und wendet `root.yaml` an, alles Weitere entsteht aus Git. Argo CD wendet die Manifeste wie `kubectl apply` an. Die Application `monitoring` nutzt `ServerSideApply=true`, weil die Definitionen des Prometheus Operator für die Annotation eines gewöhnlichen `apply` zu gross sind. Eigene AppProjects neben `default` sind Thema der [Zusatzaufträge von Kapitel 4.6](../../platform/advanced/).

## Helm

Helm ist ein Paketmanager für Kubernetes. Ein **Chart** ist ein Paket aus Vorlagen für Manifeste, der Datei `values.yaml` mit Standardwerten und der Datei `Chart.yaml` mit `version` und `appVersion`. Charts liegen in Repositories, die von Argo CD etwa unter `https://argoproj.github.io/argo-helm`. Ein **Release** ist ein installiertes Chart im Cluster. Eigene Werte gibst du mit `-f werte.yaml` oder `--set` mit. Die Releases speichert Helm als Secrets im Cluster, eine eigene Datenbank braucht es nicht. Die [Einführung in Helm](https://helm.sh/docs/intro/introduction/) beschreibt diese Begriffe für Helm 4.

Auf dem Front-end legt Helm im Kurs genau ein Release an, `argocd` im Namespace `argocd`, mit `helm upgrade --install` aus dem Bootstrap-Skript. Die Charts der Teile 5 und 6 erzeugt Argo CD mit `helm template` nur als Manifeste und verwaltet diese danach selbst, wie die [Dokumentation von Argo CD zu Helm](https://argo-cd.readthedocs.io/en/release-3.5/user-guide/helm/) beschreibt. `helm list` zeigt sie deshalb nicht, ein Rollback geht über `git revert`. Auch k3s nutzt Helm. Sein eingebauter [Helm-Controller](https://docs.k3s.io/add-ons/helm) installiert Traefik aus Objekten vom Typ HelmChart in `kube-system`.

## Kustomize

Kustomize setzt Manifeste aus gewöhnlichem YAML zusammen, ohne Vorlagensprache. Die Datei `kustomization.yaml` zählt unter `resources` die Dateien eines Ordners auf und bindet unter `components` Komponenten ein. Mit `namespace` setzt sie den Namespace aller Objekte, mit `patches` ändert sie einzelne Felder. Ein Patch ist entweder ein JSON-Patch mit Operationen wie `op: replace` oder ein Strategic-Merge-Patch, ein Stück YAML, das Kustomize mit dem Original zusammenführt. Eine [Komponente](https://kubectl.docs.kubernetes.io/guides/config_management/components/) mit `kind: Component` ist ein Baustein, den mehrere Ordner einbinden können.

Im Kurs ist `templates/member` aus [Kapitel 4.5](../../platform/templates/) eine solche Komponente mit Namespace, ResourceQuota, LimitRange und NetworkPolicy. `members/velo` setzt den Namespace `velo` und ersetzt mit einem JSON-Patch den Wert für `requests.cpu`. Auch `webshop/` ist ein Ordner mit `kustomization.yaml`. `kubectl kustomize` zeigt das Ergebnis, ohne etwas anzuwenden. Argo CD bringt im Repository-Server eigene Fassungen von Kustomize und Helm mit. Die [Dokumentation von Kubernetes 1.36](https://v1-36.docs.kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/) und die [Referenz der Patches](https://kubectl.docs.kubernetes.io/references/kustomize/kustomization/patches/) beschreiben alle Felder.

| | Helm | Kustomize |
|---|---|---|
| Ansatz | Vorlagen mit Platzhaltern, gefüllt aus Werten | fertiges YAML, verändert durch Patches |
| Paket | Chart mit Version in einem Repository | Ordner in Git |
| Im Kurs für | Software anderer Projekte, etwa Argo CD, Loki und Sealed Secrets | eigene Manifeste, also Webshop und Mitglieder |

## Prometheus

Prometheus holt Messwerte in festen Abständen über HTTP bei seinen Zielen ab und speichert sie als Zeitreihen auf der Disk. Abfragen schreibst du in PromQL. Regeln rechnet Prometheus regelmässig aus. Recording Rules speichern ihr Ergebnis als neue Zeitreihe, Alerting Rules schicken auslösende Alerts an Alertmanager. Für Systeme ohne eigenes `/metrics` gibt es Exporter, etwa den OpenNebula-Exporter auf Port 9925.

Im Lab kommt Prometheus mit dem Chart kube-prometheus-stack aus [Kapitel 5.1](../../observability/metrics/). Neben Prometheus, Alertmanager und Grafana bringt es drei Teile mit. Der Prometheus Operator 0.94.2 führt eigene Objektarten ein und schreibt daraus die Konfiguration von Prometheus. Der Dienst kube-state-metrics meldet den Zustand der Objekte im Cluster, etwa die bereiten Pods eines Deployments. Der node-exporter läuft als DaemonSet und liefert die Werte jedes Nodes.

| Objektart | Inhalt | Im Kurs |
|---|---|---|
| ServiceMonitor | welche Services Prometheus abfragt | `webshop` in `velo`, alle 15 Sekunden |
| ScrapeConfig | Ziele ausserhalb des Clusters | die Exporter von OpenNebula |
| PrometheusRule | Recording und Alerting Rules | das SLO des Webshops aus [Kapitel 5.3](../../observability/slo/) |

Die Werte des Kurses behalten Daten drei Tage auf einem Volume von 5 GiB und öffnen den NodePort 30090. Prometheus liest Monitore und Regeln aus allen Namespaces, auch solche, die nicht aus dem Chart stammen. Die Monitore für etcd, Scheduler, Controller Manager und Proxy sind aus, weil k3s diese Teile in einem einzigen Prozess ausführt. Die [Grundlagen von PromQL](https://prometheus.io/docs/prometheus/3.15/querying/basics/) gelten für Prometheus 3.15, die [Objektarten des Operators](https://prometheus-operator.dev/docs/getting-started/design/) stehen auf seiner Website.

## Alertmanager

Alertmanager nimmt die Alerts von Prometheus an und entscheidet, wer davon erfährt. Er fasst Alerts mit gleichen Labels zu Gruppen zusammen und verschickt eine Gruppe nur einmal pro Intervall. Mit **Inhibition** unterdrückt er Meldungen, solange bestimmte andere Alerts schon auslösen. Eine Silence schaltet Alerts für eine gewisse Zeit stumm. Routen weisen Alerts nach ihren Labels einem Empfänger zu, etwa einem Webhook oder einer E-Mail-Adresse. Die [Dokumentation von Alertmanager 0.34](https://prometheus.io/docs/alerting/0.34/alertmanager/) erklärt diese Begriffe.

Im Lab läuft Alertmanager aus demselben Chart mit dem NodePort 30093. Die Werte des Kurses gruppieren nach `alertname` und `namespace` und schicken alle Alerts an den Empfänger `null`, der nichts verschickt. Die Alerts erscheinen darum nur in der Oberfläche. Dort steht auch `Watchdog`, eine Regel des Charts, die immer auslöst und damit zeigt, dass die Kette von Prometheus bis Alertmanager funktioniert. [Kapitel 5.3](../../observability/slo/) erklärt die Weiterleitung, einen eigenen Empfänger richtest du in den [Zusatzaufträgen von Kapitel 5.5](../../observability/advanced/) ein.

## Grafana

Grafana stellt Abfragen als Dashboards dar. Eine [Datenquelle](https://grafana.com/docs/grafana/v13.3/datasources/) ist die Verbindung zu einem Speicher wie Prometheus oder Loki. Ein [Dashboard](https://grafana.com/docs/grafana/v13.3/dashboards/) besteht aus Panels, jedes Panel zeigt eine oder mehrere Abfragen. Unter «Explore» probierst du Abfragen ohne Dashboard aus.

Im Lab gehört Grafana zum Chart kube-prometheus-stack und ist auf NodePort 30300 erreichbar. Die Datenquelle Prometheus richtet das Chart selbst ein, Loki kommt über `additionalDataSources` aus den Werten dazu. Das Passwort von `admin` liegt im Secret `grafana-admin`, ab [Kapitel 6.1](../../operations/security/) aus einem SealedSecret. Ein weiterer Container im Pod, ein sogenannter Sidecar, lädt jede ConfigMap mit dem Label `grafana_dashboard` als Dashboard, auch das Dashboard des Plattform-Teams aus [Kapitel 5.1](../../observability/metrics/). Grafana hat im Lab kein Volume. Was du in der Oberfläche änderst, geht beim nächsten Neustart des Pods verloren, Dashboards gehören darum in Git.

## Loki

Loki speichert Logs und indexiert dabei nur die Labels, etwa Namespace und Pod, nicht den Text. Alle Zeilen mit denselben Labels bilden einen **Stream**. Den Text legt Loki komprimiert in Chunks ab und durchsucht ihn erst bei einer Abfrage in LogQL. Eine Abfrage liefert entweder Zeilen oder macht aus Zeilen eine Metrik, etwa mit `count_over_time`. Die [Übersicht von Loki 3.6](https://grafana.com/docs/loki/v3.6.x/get-started/overview/) beschreibt den Aufbau, die [Seite zu LogQL](https://grafana.com/docs/loki/v3.6.x/query/) die Abfragen.

Im Lab läuft Loki im monolithischen Modus, den das Chart `SingleBinary` nennt. Alle Teile stecken in einem Prozess, die Daten liegen im Dateisystem auf einem Volume von 5 GiB. Nach 72 Stunden löscht der Compactor sie. Die [Beschreibung der Betriebsarten](https://grafana.com/docs/loki/v3.6.x/get-started/deployment-modes/) empfiehlt diesen Modus für kleine Mengen bis etwa 20 GB am Tag. Eine Anmeldung gibt es nicht, Grafana und Alloy erreichen Loki unter `loki.monitoring.svc:3100`. Welche Labels in den Index gehören, steht in [Kapitel 5.2](../../observability/logs/).

## Alloy

Alloy von Grafana sammelt Daten wie Metriken und Logs und schickt sie weiter. Seine Konfiguration besteht aus [Komponenten](https://grafana.com/docs/alloy/v1.21/get-started/components/). Jede erledigt eine Aufgabe, bekommt Argumente und gibt Exporte weiter, die andere Komponenten verwenden. Daraus entsteht eine Kette.

Im Lab läuft Alloy als DaemonSet mit einem Pod pro Node. Die Kette aus [Kapitel 5.2](../../observability/logs/) hat vier Glieder. `discovery.kubernetes` findet die Pods, `discovery.relabel` macht daraus die Labels `namespace`, `pod`, `container` und `app`. `loki.source.kubernetes` liest die Logs, `loki.write` schickt sie an Loki. Die Komponente [`loki.source.kubernetes`](https://grafana.com/docs/alloy/v1.21/reference/components/loki/loki.source.kubernetes/) liest die Logs über die API von Kubernetes und könnte so jeden Pod im Cluster erreichen. Darum sucht `discovery.kubernetes` in jeder Instanz mit einem Selektor auf `spec.nodeName` nur die Pods des eigenen Nodes. Den Namen des Nodes bekommt Alloy als Variable `NODE_NAME` aus seinem eigenen Pod.

## Sealed Secrets

Ein Secret in Git wäre für alle lesbar, die das Repo lesen dürfen. Sealed Secrets löst das mit zwei Teilen. Ein Controller im Cluster erzeugt ein Schlüsselpaar. `kubeseal` auf dem Front-end holt den öffentlichen Schlüssel und verschlüsselt damit ein Secret zu einem SealedSecret, das in Git darf. Nur der Controller kann es mit seinem privaten Schlüssel öffnen. Er legt daraus ein gewöhnliches Secret an, dessen Besitzer das SealedSecret ist. Im Standard `strict` sind Name und Namespace Teil der Verschlüsselung. Der Controller erneuert seinen Schlüssel alle 30 Tage und behält die alten. Gehen die privaten Schlüssel verloren, öffnet niemand mehr ein SealedSecret, darum sichert [Kapitel 6.2](../../operations/backup/) sie auf dem Front-end. Die [Beschreibung von Sealed Secrets 0.41.2](https://github.com/bitnami/sealed-secrets/blob/v0.41.2/README.md) erklärt die Varianten.

Im Lab bringt die Application `sealed-secrets` aus [Kapitel 6.1](../../operations/security/) den Controller nach `kube-system`. Er heisst dort `sealed-secrets-controller`, so wie `kubeseal` ihn sucht. `install-kubeseal.sh` installiert `kubeseal` und prüft dabei die Prüfsumme. `seal-secrets.sh` schreibt das Passwort von Grafana als `secrets/grafana-admin.yaml` ins Plattform-Repo. Die Application `secrets` bringt es von dort in den Cluster.

## Im Lab

Ab Teil 6 sind alle neun Werkzeuge im Einsatz. Die folgenden Befehle auf dem Front-end lesen nur und ändern nichts.

```bash
helm list -A
grep -h -A1 'chart:' ~/platform/apps/*.yaml
```

Helm zeigt nur Releases, die es selbst installiert hat, darunter `argocd` mit dem Chart `argo-cd-10.11.6`. `grep` zeigt für jede Application mit einem Chart dessen Namen und die Version aus Git.

```bash
kubectl -n argocd get pods
kubectl -n argocd get applications
```

Du siehst je einen Pod für Server, Repository-Server, Application Controller, ApplicationSet-Controller und Redis, dazu alle Applications mit Sync-Status und Health.

```bash
kubectl api-resources --api-group=argoproj.io
kubectl api-resources --api-group=monitoring.coreos.com
kubectl api-resources --api-group=bitnami.com
```

Die Ausgaben listen die Objektarten, die Argo CD, der Prometheus Operator und Sealed Secrets im Cluster einführen, etwa `applications`, `servicemonitors` und `sealedsecrets`.

```bash
kubectl get servicemonitors,scrapeconfigs,prometheusrules -A
kubectl -n monitoring get configmaps -l grafana_dashboard
```

Der erste Befehl zeigt, woher Prometheus Ziele und Regeln bekommt, aus dem Chart und aus deinem Repo. Der zweite listet die Dashboards, die Grafana lädt.

```bash
kubectl -n monitoring get pods -o wide | grep -E 'loki|alloy'
kubectl get sealedsecrets -A
kubectl version --client
```

Loki läuft in einem Pod, Alloy in einem Pod pro Node. Das SealedSecret `grafana-admin` steht mit `True` in der Spalte `SYNCED`, sobald der Controller es entschlüsselt hat. Die letzte Zeile nennt neben kubectl die Version von Kustomize.

::::exercise[Lab]
Erstelle für dein Lab eine Tabelle der neun Werkzeuge. Trage für jedes ein, wie es ins Lab kam, welche Version läuft, in welchem Namespace oder auf welcher VM es liegt und welche Datei seine Einstellungen festlegt. Erkläre danach, warum `helm list -A` die Charts aus Teil 5 nicht zeigt. Was geschieht, wenn du in deinem Plattform-Repo die `targetRevision` von Loki änderst und pushst?

:::solution
Argo CD 3.5.6 kam mit Helm aus dem Chart 10.11.6 und läuft in `argocd`, seine Werte stehen in `platform/argocd/values.yaml` im Kursrepo. Helm und kubectl liegen als Pakete auf dem Front-end, `helm version` und `kubectl version --client` nennen die Versionen, kubectl auch die von Kustomize. Kustomize hat keine eigene Installation, seine Dateien sind die `kustomization.yaml` in `webshop/`, `templates/member/` und `members/`. Prometheus, Alertmanager und Grafana kommen über die Application `monitoring` mit kube-prometheus-stack 92.17.0 nach `monitoring`, die Werte stehen in `monitoring/kube-prometheus-stack.yaml`. Loki und Alloy kommen über `apps/loki.yaml`, die Werte stehen in `monitoring/loki.yaml` und `monitoring/alloy.yaml`. Der Controller von Sealed Secrets kommt über `apps/sealed-secrets.yaml` nach `kube-system`, `kubeseal` liegt in `/usr/local/bin` auf dem Front-end.

`helm list -A` zeigt nur Releases, die Helm selbst installiert hat, also `argocd` und je nach Stand die Releases, mit denen k3s Traefik einrichtet. Argo CD rendert die übrigen Charts mit `helm template` und wendet die Manifeste selbst an, ein Release entsteht dabei nicht. Nach dem Push erkennt Argo CD die neue `targetRevision` innert ein bis zwei Minuten, rendert die neue Version des Charts mit deinen Werten und passt die Objekte an. Zurück geht es mit `git revert`. Vorher lohnt ein Blick in die Hinweise zum Upgrade des Charts, weil neue Versionen manchmal den Aufbau der Werte ändern.
:::
::::
