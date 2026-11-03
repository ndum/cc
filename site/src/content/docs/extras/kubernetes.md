---
title: Kubernetes-Grundlagen
description: Eine Auffrischung vor Teil 4 für alle, die Docker kennen, mit Pods, Deployments, Services, Ingress, Namespaces, ConfigMaps, Secrets, Labels, Requests, Limits, Proben, Manifesten und den wichtigsten Befehlen von kubectl.
sidebar:
  order: 4
---

:::goals
Nach diesem Kapitel kannst du:

- Erklären, wie Pod, ReplicaSet und Deployment zusammenhängen und was einen Pod von einem Container in Docker unterscheidet
- Zeigen, wie Labels und Selektoren die Objekte des Webshops verbinden
- Die Typen eines Services nennen und sagen, wo der Kurs welchen Typ nutzt
- Beschreiben, wie Traefik eine Anfrage über einen Ingress an den Webshop weitergibt
- Namespaces, ConfigMaps, Secrets, Requests, Limits und Proben in einem Manifest erkennen und begründen
- Mit `kubectl get`, `describe`, `logs`, `exec` und `apply` arbeiten und sagen, was jeder Befehl zeigt
:::

Diese Ergänzung frischt die Objekte von Kubernetes auf, die ab Teil 4 vorkommen. Sie setzt voraus, dass du mit Docker schon Images gebaut und Container gestartet hast. Wie Control Plane, Scheduler und Controller zusammenarbeiten, erklärt [Kapitel 4.3](../../platform/kubernetes/). Hier geht es um die Objekte, die du in Manifesten liest und schreibst, am Beispiel des Webshops aus [Kapitel 4.4](../../platform/gitops/). Die Links führen zur Dokumentation von Kubernetes 1.36, der Version, die k3s im Kurs installiert.

## Pods

Mit `docker run` startest du einen Container auf einem einzelnen Rechner. Fällt der Rechner aus, startet niemand den Container auf einem anderen neu. Kubernetes verteilt Container auf mehrere Nodes und hält am Laufen, was du beschrieben hast. Die kleinste Einheit dafür ist der [Pod](https://v1-36.docs.kubernetes.io/docs/concepts/workloads/pods/), ein oder mehrere Container, die sich Netz und Volumes teilen. Jeder Pod bekommt eine eigene Adresse, im Lab aus `10.52.0.0/16`. Container im selben Pod erreichen einander über `localhost`. Die meisten Pods im Kurs haben genau einen Container. Die Pods `svclb-traefik-…` in `kube-system`, mit denen k3s die Ports von Traefik auf jedem Node öffnet, zeigen dagegen in der Spalte `READY` den Wert `2/2`, zwei Container in einem Pod.

Pods sind kurzlebig. Wird ein Pod gelöscht oder fällt sein Node aus, ersetzt ihn ein Controller durch einen neuen mit anderem Namen und anderer Adresse. Pods legst du darum selten selbst an. Das übernehmen Objekte mit einer Vorlage für Pods, im Kurs meist ein Deployment. Alloy aus [Kapitel 5.2](../../observability/logs/) läuft als DaemonSet mit einem Pod auf jedem Node. Für Prometheus und Loki gibt es StatefulSets, deren Pods einen festen Namen und ein eigenes Volume behalten.

## ReplicaSets und Deployments

Ein **ReplicaSet** hält eine Zahl gleicher Pods aus einer Vorlage am Laufen. Ein **Deployment** verwaltet ReplicaSets und tauscht die Pods schrittweise aus, wenn sich die Vorlage ändert. Du schreibst nur das Deployment, ReplicaSet und Pods legt der Cluster an. Die Namen zeigen die Kette, hier zwei Pods des Webshops im Lab.

```text
NAME                       READY   STATUS    RESTARTS   AGE
webshop-7d4f56cb9b-chxkw   1/1     Running   0          3m30s
webshop-7d4f56cb9b-mjsjj   1/1     Running   0          3m19s
```

Das ReplicaSet heisst `webshop-7d4f56cb9b`. Der zweite Teil ist ein Hash der Pod-Vorlage, jeder Pod hängt noch ein zufälliges Stück an. Änderst du die Vorlage, etwa das Image oder eine Variable, entsteht ein neues ReplicaSet mit neuem Hash. Beim Wechsel darf das Deployment ein Viertel mehr Pods starten als gewünscht. Ebenso darf ein Viertel fehlen. Das sind die Standardwerte von `maxSurge` und `maxUnavailable`, wie die [Dokumentation zu Deployments](https://v1-36.docs.kubernetes.io/docs/concepts/workloads/controllers/deployment/) beschreibt. Zehn alte ReplicaSets bleiben mit null Pods stehen, damit `kubectl rollout undo` zurückkehren kann.

## Labels und Selektoren

[Labels](https://v1-36.docs.kubernetes.io/docs/concepts/overview/working-with-objects/labels/) sind Paare aus Schlüssel und Wert an einem Objekt. Ein **Selektor** wählt Objekte nach ihren Labels aus. Über ein gemeinsames Label verweist ein Objekt auf andere, ohne deren Namen zu kennen. Beim Webshop tragen Deployment, Pods und Service das Label `app: webshop`.

| Objekt | Feld | Wirkung |
|---|---|---|
| Deployment `webshop` | `spec.selector.matchLabels` | erkennt daran seine Pods |
| Service `webshop` | `spec.selector` | schickt Anfragen an die bereiten Pods mit diesem Label |
| ServiceMonitor `webshop` aus [Kapitel 5.1](../../observability/metrics/) | `spec.selector.matchLabels` | lässt Prometheus den Service mit diesem Label abfragen |
| Alloy aus [Kapitel 5.2](../../observability/logs/) | Regel in `discovery.relabel` | übernimmt das Label nach Loki, `{app="webshop"}` findet die Logs |

Zusätzlich setzt der Deployment-Controller an jedem Pod das Label `pod-template-hash`, damit sich alte und neue Pods unterscheiden lassen. Selektoren vergleichen auf Gleichheit wie `app=webshop` oder mit Mengen wie `app in (webshop, shop)`. Ein Service kennt nur die Gleichheit. Auf der Kommandozeile wählt `-l` nach Labels, etwa `kubectl -n velo get pods -l app=webshop`.

![Die Objekte des Webshops. Alle Objekte liegen im Namespace velo. Oben der Weg einer Anfrage. Traefik setzt den Ingress webshop um, der alle Pfade an den Port http des Services webshop schickt. Der Service hat eine feste Adresse im Cluster und den Port 80. Über seinen Selektor app=webshop füllt Kubernetes die EndpointSlice mit den Adressen der bereiten Pods. Die Anfrage geht an Port 8080 eines dieser Pods. In der Mitte die beiden Pods webshop-7d4f56cb9b-chxkw und webshop-7d4f56cb9b-mjsjj. Unten das Deployment webshop. Es verwaltet das ReplicaSet webshop-7d4f56cb9b, das mit app=webshop und pod-template-hash seine beiden Pods auswählt und am Laufen hält. Achte darauf, dass Service, ReplicaSet und Deployment ihre Pods über das Label app=webshop finden, ohne deren Namen zu kennen.](../../../assets/figures/de/ex-kubernetes.svg)

Auch Namespaces tragen Labels. Das Label `kubernetes.io/metadata.name` setzt Kubernetes selbst, die NetworkPolicy der Mitglieder aus [Kapitel 4.5](../../platform/templates/) erkennt daran `kube-system`. In [Kapitel 6.1](../../operations/security/) bestimmen Labels am Namespace das Profil von Pod Security.

## Services

Ein [Service](https://v1-36.docs.kubernetes.io/docs/concepts/services-networking/service/) gibt einer wechselnden Gruppe von Pods einen festen Namen und eine feste virtuelle Adresse, im Lab aus `10.53.0.0/16`. Der Typ legt fest, von wo aus der Service erreichbar ist.

| Typ | Erreichbar über | Im Kurs |
|---|---|---|
| `ClusterIP` | die virtuelle Adresse, nur im Cluster, der Standard | `webshop` in `velo`, `kube-dns` in `kube-system`, Loki in `monitoring` |
| `NodePort` | zusätzlich einen Port von 30000 bis 32767 auf jedem Node | Argo CD auf 30080, Prometheus auf 30090, Alertmanager auf 30093, Grafana auf 30300 |
| `LoadBalancer` | zusätzlich eine Adresse von einem Load Balancer, in k3s ServiceLB auf den Adressen der Nodes | `traefik` in `kube-system` auf Port 80 und 443 |
| `ExternalName` | einen DNS-Namen ausserhalb des Clusters, ohne eigene Adresse | kommt im Kurs nicht vor |

Die Typen bauen aufeinander auf. Ein NodePort-Service hat auch eine Adresse im Cluster, ein LoadBalancer auch Ports auf den Nodes. Das zeigt ein Auszug aus `kubectl get services -A` kurz nach dem Aufbau des Clusters.

```text
NAMESPACE     NAME         TYPE           CLUSTER-IP      EXTERNAL-IP                     PORT(S)                      AGE
default       kubernetes   ClusterIP      10.53.0.1       <none>                          443/TCP                      45s
kube-system   kube-dns     ClusterIP      10.53.0.10      <none>                          53/UDP,53/TCP,9153/TCP       40s
kube-system   traefik      LoadBalancer   10.53.129.171   172.31.160.110,172.31.160.111   80:32332/TCP,443:30773/TCP   10s
```

Traefik hat eine Adresse im Cluster, die Adressen beider k3s-VMs als externe Adressen und dazu zwei zufällig vergebene Node-Ports. Der Service des Webshops nimmt Anfragen auf Port 80 an und gibt sie an den Port `http` der Pods weiter. Diesen Namen trägt im Deployment der Port 8080 des Containers.

::code{file="platform/repo/webshop/service.yaml"}

Im Cluster löst CoreDNS den Namen `webshop.velo.svc.cluster.local` zur Adresse des Services auf, im selben Namespace genügt `webshop`.

## Ingress mit Traefik

Ein [Ingress](https://v1-36.docs.kubernetes.io/docs/concepts/services-networking/ingress/) ist eine Regel für HTTP. Sie legt fest, an welchen Service die Anfragen für einen Host und einen Pfad gehen. Die Regel allein bewirkt nichts, umsetzen muss sie ein Ingress-Controller. k3s v1.36.5+k3s1 bringt dafür Traefik 3.7 mit und installiert es beim Start des Servers mit seinem eingebauten Helm-Controller in `kube-system`. Traefik läuft hinter dem Service `traefik` aus der Ausgabe oben, wie die [Dokumentation von k3s](https://docs.k3s.io/networking/networking-services) beschreibt.

::code{file="platform/repo/webshop/ingress.yaml"}

Die Regel des Webshops nennt keinen Host und nur den Pfad `/`. Jede Anfrage an Port 80 einer k3s-VM geht darum an den Service `webshop`. Eine Klasse nennt die Regel auch nicht. Das Chart von Traefik legt die IngressClass `traefik` als Standard an, deshalb trägt Kubernetes sie beim Anlegen des Ingress selbst ein. Den Weg einer Anfrage von Traefik bis zum Pod beschreibt [Kapitel 4.3](../../platform/kubernetes/). [Kapitel 6.1](../../operations/security/) erklärt, wie ein Ingress mit einem Abschnitt `tls` den Verkehr verschlüsseln würde.

Das Projekt Kubernetes empfiehlt inzwischen die Gateway API, die API für Ingress ist eingefroren und bekommt keine neuen Funktionen mehr. Der Kurs bleibt beim Ingress, den k3s ohne weitere Schritte unterstützt.

## Namespaces

Ein [Namespace](https://v1-36.docs.kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/) ist ein Bereich im Cluster. Namen müssen nur innerhalb eines Namespaces eindeutig sein, darum gibt es in `velo` und in `gemeinde` je eine ResourceQuota `member`. Quotas, Rechte und Netzregeln gelten pro Namespace. Deshalb bekommt in [Kapitel 4.5](../../platform/templates/) jedes Mitglied einen eigenen.

| Namespace | Inhalt im Lab |
|---|---|
| `kube-system` | die Teile von k3s wie CoreDNS, Traefik und metrics-server, ab Teil 6 der Controller von Sealed Secrets |
| `argocd` | Argo CD mit seinen Applications |
| `velo`, `gemeinde` | die Mitglieder mit Quota, LimitRange und NetworkPolicy, in `velo` der Webshop |
| `monitoring` | Prometheus, Alertmanager, Grafana, Loki und Alloy ab Teil 5 |
| `default` | was ohne Angabe eines Namespaces entsteht, etwa die Test-Pods aus Kapitel 4.3 |

Ohne `-n` arbeitet kubectl im Namespace `default`, mit `-A` in allen. Nodes, PersistentVolumes, IngressClasses und die Namespaces selbst gehören zu keinem Namespace, `kubectl api-resources --namespaced=false` listet alle Arten dieser Sorte.

## ConfigMaps und Secrets

Wie bei Docker gehört die Konfiguration nicht ins Image. Ein Pod bindet sie als Umgebungsvariablen oder als Dateien in einem Volume ein. Eine [ConfigMap](https://v1-36.docs.kubernetes.io/docs/concepts/configuration/configmap/) hält Daten, die nicht geheim sind, höchstens 1 MiB. Ein [Secret](https://v1-36.docs.kubernetes.io/docs/concepts/configuration/secret/) ist für Passwörter, Tokens und Schlüssel gedacht. Seine Werte sind aber nur mit Base64 kodiert und liegen ohne weitere Einstellung unverschlüsselt in der Datenbank des Clusters. Wer in einem Namespace Pods anlegen darf, kann auch dessen Secrets lesen. Ändert sich eine ConfigMap, sieht ein Pod die neuen Dateien nach einer Weile, neue Umgebungsvariablen erst nach einem Neustart.

| Objekt | Im Kurs | Kapitel |
|---|---|---|
| ConfigMap | die Konfiguration von Alloy, die Dashboards von Grafana mit dem Label `grafana_dashboard` | [5.1](../../observability/metrics/), [5.2](../../observability/logs/) |
| Secret | der Zugang von Argo CD zu Gitea, das Passwort von Grafana | [4.4](../../platform/gitops/), [5.1](../../observability/metrics/) |
| SealedSecret | das Passwort von Grafana verschlüsselt in Git, ein Controller macht daraus das Secret | [6.1](../../operations/security/) |

Der Webshop nutzt keines der beiden Objekte. Seine Einstellungen wie `SHOP_NAME` und ab Teil 5 `WORK_MS` und `FAIL_PERCENT` stehen als `env` direkt in der Vorlage des Deployments. Jede Änderung daran ergibt ein neues ReplicaSet und damit einen Rollout. [Kapitel 5.2](../../observability/logs/) spielt auf diese Weise mit `FAIL_PERCENT` einen Fehler ein.

## Requests und Limits

Für CPU und Speicher kann jeder Container zwei Werte angeben. Der **Request** ist, was der Scheduler für ihn reserviert, das **Limit** die Obergrenze. Über dem CPU-Limit bremst der Kernel den Container, über dem Speicherlimit kann er ihn beenden. `50m` sind fünf Hundertstel eines Kerns, `64Mi` sind 64 Mebibyte. Der Webshop verlangt `50m` und `64Mi` und darf bis `500m` und `128Mi` gehen, ab Teil 5 nur noch bis `250m` CPU.

In den Namespaces der Mitglieder setzt eine LimitRange Werte für Container ohne eigene Angaben. Eine ResourceQuota begrenzt dort die Summe, beides aus [Kapitel 4.5](../../platform/templates/). Der HorizontalPodAutoscaler aus [Kapitel 5.4](../../observability/autoscaling/) misst die CPU in Prozent des Requests. Wie der Scheduler mit Requests plant, erklärt [Kapitel 4.3](../../platform/kubernetes/), die Regeln stehen in der [Dokumentation zu Ressourcen](https://v1-36.docs.kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

## Proben

Der kubelet prüft mit [Proben](https://v1-36.docs.kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/), ob ein Container gesund ist. Docker kennt dafür die Anweisung `HEALTHCHECK`. Kubernetes unterscheidet drei Proben mit verschiedenen Folgen.

| Probe | Frage | Wenn sie scheitert |
|---|---|---|
| Readiness | Kann der Container Anfragen annehmen? | Seine Adresse verschwindet aus der EndpointSlice des Services, der Pod läuft weiter. |
| Liveness | Läuft der Container noch richtig? | Der kubelet startet den Container neu. |
| Startup | Ist der Container fertig gestartet? | Der kubelet startet den Container neu. Bis sie gelingt, warten die beiden anderen Proben. |

Der Webshop fragt bei Readiness und Liveness die Seite `/healthz` ab, eine Startup-Probe hat er nicht. Ohne weitere Angabe fragt der kubelet alle 10 Sekunden, wartet eine Sekunde auf die Antwort und wertet die Probe nach drei Fehlschlägen in Folge als gescheitert. Der Webshop wartet mit `timeoutSeconds: 3` drei Sekunden. Unter der Last aus Teil 5 antwortet ein Pod langsamer, eine gescheiterte Liveness-Probe würde ihn dann mitten im Lasttest neu starten. Die Readiness-Probe bestimmt auch, ab wann ein neuer Pod bei einem Rollout als verfügbar zählt.

## Manifeste und das deklarative Modell

Ein Manifest beschreibt ein Objekt in YAML. `apiVersion` und `kind` nennen seine Art, `metadata` Name, Namespace, Labels und Annotationen, `spec` den gewünschten Zustand. Das Feld `status` schreibt der Cluster selbst und meldet darin, was er tatsächlich vorfindet. Für die Verwaltung der Objekte gibt es drei Arten.

| Art | Beispiel | Im Kurs |
|---|---|---|
| Imperative Befehle | `kubectl create deployment`, `kubectl scale` | kurze Tests in Kapitel 4.3 und 4.5 |
| Imperative Konfiguration | `kubectl create -f webshop.yaml` | kommt nicht vor |
| Deklarative Konfiguration | `kubectl apply -f ordner/` | Argo CD für dein ganzes Repo, du selbst vor allem beim Bootstrap mit `root.yaml` |

`kubectl apply` legt fehlende Objekte an und ändert bestehende so, dass sie dem Manifest entsprechen. Dafür merkt sich kubectl die zuletzt angewendete Fassung in der Annotation `kubectl.kubernetes.io/last-applied-configuration`. Ein Feld, das du aus dem Manifest löschst, entfernt `apply` auch im Cluster. Felder, die im Manifest gar nicht vorkommen, lässt es stehen, auch wenn sie jemand anderes gesetzt hat.

Teil 5 nutzt diese Regel. Das Deployment des Webshops nennt dort keine Zahl von Pods mehr und überlässt das Feld `replicas` dem HorizontalPodAutoscaler. In Teil 4 steht dagegen `replicas: 2` im Manifest, darum setzt Argo CD in [Kapitel 4.4](../../platform/gitops/) ein `kubectl scale` gleich wieder zurück. `kubectl diff` zeigt vor einem `apply`, was sich ändern würde. Den Unterschied zwischen deklarativ und imperativ vertieft [Kapitel 4.1](../../platform/iac/), die drei Arten beschreibt die [Dokumentation zur Verwaltung von Objekten](https://v1-36.docs.kubernetes.io/docs/concepts/overview/working-with-objects/object-management/).

## Befehle von kubectl

| Befehl | Zeigt oder tut |
|---|---|
| `kubectl get` | eine Liste von Objekten, mit `-o wide` mit Node und Adresse, mit `-o yaml` das ganze Objekt mit `spec` und `status` |
| `kubectl describe` | ein Objekt in lesbarer Form mit Zustand und den Ereignissen der letzten Stunde, etwa einem Fehler beim Laden des Images |
| `kubectl logs` | Standardausgabe und Standardfehler eines Containers, mit `--previous` die des Laufs vor dem letzten Neustart, nur solange der Pod existiert |
| `kubectl exec` | führt einen Befehl in einem laufenden Container aus, etwa `env` oder `cat` |
| `kubectl apply` | wendet Manifeste an, mit `-k` einen Ordner mit Kustomize |
| `kubectl explain` | beschreibt ein Feld eines Manifests so, wie es der API-Server deines Clusters kennt |

Die [Kurzreferenz von kubectl](https://v1-36.docs.kubernetes.io/docs/reference/kubectl/quick-reference/) sammelt weitere Beispiele, die [Lab-Referenz](../../lab-reference/) die Befehle des Kurses.

## Im Lab

Ab Kapitel 4.4 läuft der Webshop in deinem Cluster. Die folgenden Befehle auf dem Front-end lesen nur und ändern nichts.

```bash
kubectl -n velo get deployment,replicaset,pod --show-labels
```

Die Ausgabe zeigt die Kette vom Deployment über das ReplicaSet zu den Pods und an den Pods die Labels `app=webshop` und `pod-template-hash`.

```bash
kubectl -n velo get service,endpointslice,ingress
```

Du siehst die Adresse des Services, in der EndpointSlice die Adressen der bereiten Pods und beim Ingress die Klasse `traefik` mit den Adressen beider k3s-VMs.

```bash
kubectl -n velo describe pod -l app=webshop
```

Für jeden Pod stehen dort Requests, Limits, die beiden Proben und am Ende die Ereignisse der letzten Stunde, bei einem länger laufenden Pod oft keine.

```bash
kubectl -n velo logs deployment/webshop --tail=5
kubectl -n velo exec deployment/webshop -- env
```

Der erste Befehl zeigt die letzten Zeilen eines Pods, meist Anfragen der Proben auf `/healthz`. Der zweite listet die Umgebung des Containers mit `SHOP_NAME` aus dem Manifest und Variablen wie `WEBSHOP_SERVICE_HOST`, die Kubernetes für die Services im Namespace setzt.

```bash
kubectl -n velo get deployment webshop -o yaml
kubectl explain deployment.spec.strategy.rollingUpdate
```

Das Objekt zeigt `spec` aus Git, `status` aus dem Cluster und die Annotation `argocd.argoproj.io/tracking-id`, mit der Argo CD es seiner Application zuordnet. `kubectl explain` beschreibt `maxSurge` und `maxUnavailable` mit ihren Standardwerten.

::::exercise[Lab]
Verfolge mit den Befehlen oben den Weg einer Anfrage an den Webshop vom Ingress bis zum Container. Nenne für jeden Schritt das Objekt und den Selektor oder Port, der es mit dem nächsten verbindet. Erkläre danach, was geschieht, wenn ein Pod dreimal nicht auf die Readiness-Probe antwortet. Was wäre bei der Liveness-Probe anders?

:::solution
Der Ingress `webshop` hat die Klasse `traefik` und schickt alle Pfade an den Service `webshop` auf den Port `http`. Der Service wählt mit `app=webshop` die Pods aus und gibt Port 80 an den Port `http` der Container weiter, also an 8080. Seine EndpointSlice enthält die Adressen der bereiten Pods. Die Pods gehören zum ReplicaSet `webshop-<hash>`. Es wählt mit `app=webshop` und `pod-template-hash` aus und gehört seinerseits zum Deployment `webshop`. `describe` zeigt bei beiden Proben `http-get http://:http/healthz` mit `timeout=3s period=10s #success=1 #failure=3`.

Scheitert die Readiness-Probe dreimal, nimmt Kubernetes die Adresse des Pods aus der EndpointSlice. Der Pod läuft weiter, bekommt aber keine Anfragen mehr, bis die Probe wieder gelingt. Scheitert die Liveness-Probe dreimal, startet der kubelet den Container neu. `kubectl get pods` zählt dann `RESTARTS` hoch und `kubectl logs --previous` zeigt die Logs vor dem Neustart.
:::
::::
