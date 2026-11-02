---
title: Kubernetes per Code
description: k3s mit einem Startskript im Kontext der VMs installieren, Server und Agent, eigene Bereiche für Pods und Services, Routing mit host-gw, die kubeconfig auf dem Front-end und erste Schritte mit kubectl.
sidebar:
  order: 3
---

:::assignment
«Zwei VMs sind schön», schreibt Simone Wyss. «Das Veloatelier will aber Container, keine VMs. Was läuft jetzt auf euren Maschinen?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Die Bausteine eines Kubernetes-Clusters und die Besonderheiten von k3s nennen
- Erklären, wie Controller, Scheduler und Services Pods am Laufen halten, verteilen und erreichbar machen
- Erklären, wie das Startskript im Kontext k3s auf beiden VMs installiert
- Begründen, warum der Cluster eigene Bereiche für Pods und Services und das Routing host-gw braucht
- Den Cluster vom Front-end aus mit kubectl untersuchen
:::

## Kubernetes in Kürze

Kubernetes verteilt Container auf mehrere Rechner und hält sie am Laufen. Wie OpenNebula für VMs arbeitet es mit einem Soll-Zustand. Du beschreibst, was laufen soll. Controller im Cluster gleichen den Ist-Zustand laufend daran an. Die folgenden Objekte kommen im ganzen Kapitel vor.

| Begriff | Bedeutung |
|---|---|
| Pod | einer oder mehrere Container, die zusammen auf einem Node laufen und eine Adresse teilen |
| ReplicaSet | hält eine Zahl gleicher Pods aus einer Vorlage am Laufen |
| Deployment | verwaltet ReplicaSets und tauscht die Pods bei einem Update schrittweise aus |
| Service | eine feste Adresse und ein Name für eine wechselnde Gruppe von Pods |
| Ingress | eine Regel, nach der HTTP-Anfragen von aussen an Services gehen |
| Namespace | ein Bereich im Cluster für Objekte, die zusammengehören |

## Control Plane und Nodes

Ein Cluster besteht aus der Control Plane und den Nodes. Die Control Plane entscheidet, auf den Nodes laufen die Container. Ein Node ist ein Rechner, hier eine VM. Die [Übersicht der Komponenten](https://kubernetes.io/docs/concepts/overview/components/) beschreibt die einzelnen Teile.

Der API-Server ist der einzige Eingang zum Cluster. kubectl, Argo CD, die Controller und die Nodes sprechen alle mit ihm und mit keinem anderen Teil. Er prüft bei jeder Anfrage, ob sie angemeldet und erlaubt ist. Die Objekte speichert er in der Datenbank des Clusters, die nur er liest und schreibt. Meist ist das etcd, ein verteilter Key-Value-Store. k3s nimmt bei einem einzelnen Server ohne weitere Angabe SQLite und übersetzt die Zugriffe mit der Zwischenschicht kine, wie die [Dokumentation zum Datastore](https://docs.k3s.io/datastore) beschreibt. Dein Cluster läuft in Teil 4 mit SQLite. In Kapitel 6.2 startest du den Server mit `--cluster-init` neu auf etcd, weil k3s nur damit Snapshots schreibt.

Der Scheduler sucht für jeden neuen Pod einen Node. Der Controller Manager führt die Controller aus, kleine Programme, die je eine Art von Objekt betreuen, etwa Deployments, ReplicaSets oder Nodes. Weder Scheduler noch Controller starten selbst einen Container. Sie lesen und schreiben nur Objekte über den API-Server.

Auf jedem Node läuft der kubelet. Er beobachtet über den API-Server, welche Pods seinem Node zugeteilt sind. Diese Pods lässt er von der Container-Runtime starten, in k3s ist das containerd. Daneben richtet kube-proxy auf jedem Node die Weiterleitung für Services ein, mehr dazu weiter unten.

k3s fasst API-Server, Scheduler, Controller Manager, kubelet und kube-proxy in einem einzigen Prozess zusammen, wie die [Architektur von k3s](https://docs.k3s.io/architecture) zeigt. Dazu kommt containerd als eigener Prozess.

## Soll-Zustand und Controller

Jedes Objekt in Kubernetes hat zwei Teile. In `spec` steht, was du willst, etwa zwei Pods mit dem Image des Webshops. In `status` meldet der Cluster, was er tatsächlich vorfindet. Du schreibst nur `spec`, den `status` füllen die Controller und der kubelet.

Ein Controller arbeitet in einer Schleife. Er liest den Soll-Zustand, vergleicht ihn mit dem Ist-Zustand und macht den Schritt, der den Unterschied verkleinert, dann beginnt er von vorn. Die [Dokumentation zu Controllern](https://kubernetes.io/docs/concepts/architecture/controller/) nennt das Control Loop, oft hörst du auch Reconcile-Schleife.

Ein Deployment zeigt, wie Controller aufeinander aufbauen. Der Deployment-Controller legt ein ReplicaSet an, das die Vorlage der Pods und ihre Zahl enthält. Der ReplicaSet-Controller zählt die Pods mit passenden Labels, legt fehlende Pod-Objekte an und löscht überzählige. Die neuen Pods haben noch keinen Node. Der Scheduler trägt einen ein, danach startet der kubelet dieses Nodes die Container. Bei einem Update mit neuem Image legt der Deployment-Controller ein zweites ReplicaSet an, fährt es schrittweise hoch und das alte herunter. Das alte bleibt mit null Pods stehen, damit `kubectl rollout undo` zurückkehren kann.

Für keinen dieser Schritte gibst du einen Befehl. Löschst du einen Pod, fehlt dem ReplicaSet einer und es legt einen neuen an. Fällt ein Node aus, markiert ihn der Node-Controller als `NotReady`. Nach fünf Minuten räumt Kubernetes seine Pods, die Wartezeit erklärt die [Dokumentation zu Taints](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/#taint-based-evictions). Das ReplicaSet startet dann Ersatz auf den übrigen Nodes.

Kapitel 4.4 zeigt dasselbe Muster eine Ebene höher. Argo CD ist ein Controller, dessen Soll-Zustand in Git liegt. Er vergleicht das Repo mit den Objekten im Cluster und gleicht Abweichungen an, so wie der ReplicaSet-Controller die Zahl der Pods.

## Requests, Limits und Scheduling

Jeder Container kann für CPU und Speicher zwei Werte angeben. Der Request ist, was der Container sicher bekommen soll, das Limit ist seine Obergrenze. CPU zählt Kubernetes in Kernen, `50m` sind fünf Hundertstel eines Kerns. Speicher zählt es in Bytes, `64Mi` sind 64 Mebibyte.

Der Scheduler plant nur mit den Requests. Für jeden Node zählt er die Requests der Pods zusammen, die dort schon laufen. Die Summe vergleicht er mit der Kapazität, die der Node anbietet. Passt der neue Pod nicht mehr hinein, scheidet der Node aus, auch wenn seine CPU gerade kaum arbeitet. Passt der Pod auf keinen Node, bleibt er `Pending`, bis Platz frei wird. `kubectl describe node` zeigt unter `Allocated resources`, wie viel schon vergeben ist.

Die Limits setzt der Kernel des Nodes zur Laufzeit mit cgroups durch. Ein Container mit einem Limit von `250m` bekommt in jedem Zeitabschnitt höchstens ein Viertel eines Kerns. Er wird gebremst, läuft aber weiter. Das nennt man CPU-Throttling. Speicher lässt sich nicht bremsen. Braucht ein Container mehr als sein Limit, beendet ihn der Kernel mit einem OOM-Kill (Out of Memory). Der kubelet startet ihn danach neu. `kubectl describe pod` zeigt dann beim letzten Zustand des Containers den Grund `OOMKilled`. Die Regeln stehen in der [Dokumentation zu Ressourcen](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

Der Webshop aus Kapitel 4.4 verlangt pro Pod `50m` CPU und `64Mi` Speicher und darf bis `500m` CPU und `128Mi` gehen. Zwei Pods belegen für den Scheduler ein Zehntel eines Kerns, unter Last brauchen sie bis zu einem ganzen. Die Summe der Limits auf einem Node darf darum seine Kapazität übersteigen, solange nicht alle Pods zugleich ihr Limit ausschöpfen.

In Kapitel 4.5 bekommt jedes Mitglied einen Namespace mit einer ResourceQuota, die an einer anderen Stelle wirkt als der Scheduler. Der API-Server prüft schon beim Anlegen eines Pods, ob die Summe aller Requests und Limits im Namespace unter der Quota bleibt. Ist sie zu gross, lehnt er den Pod ab, bevor der Scheduler ihn sieht. Die Quota teilt den Cluster also unter den Mitgliedern auf, die Requests verteilen die Pods auf die Nodes. In Kapitel 5.4 hat der Webshop darum ein Limit von `250m`, damit sechs Pods und die zusätzlichen Pods eines Updates in die Quota von zwei CPU passen.

## k3s

k3s ist eine Kubernetes-Distribution und ein Projekt der CNCF. Sie kommt als ein einziges Programm und braucht wenig Speicher. Teile, die ein Cluster sonst einzeln braucht, bringt k3s schon mit.

| Teil | Aufgabe |
|---|---|
| flannel | das Netz zwischen den Pods auf verschiedenen Nodes |
| CoreDNS | Namen wie `webshop.velo.svc.cluster.local` |
| Traefik | der Ingress-Controller auf Port 80 und 443 |
| ServiceLB | macht Services vom Typ LoadBalancer auf den Adressen der Nodes erreichbar |
| local-path | Speicher für Pods auf der Disk des Nodes |
| metrics-server | CPU und Speicher der Pods für `kubectl top` und das Autoscaling in Teil 5 |

Ein k3s-Server enthält die Control Plane und führt selbst auch Pods aus. Ein Agent ist nur Node. Mit einem Server und einem Agent hat der Cluster eine einzige Control Plane. Fällt der Server aus, laufen die Pods auf dem Agent weiter, aber niemand kann den Cluster mehr steuern. Für die Übungen reicht das. Ein Cluster mit hoher Verfügbarkeit bräuchte drei Server.

## Das Startskript

Die VMs aus Kapitel 4.2 bringen Kubernetes nicht mit. OpenTofu gibt jeder VM im Kontext ein Startskript mit, `START_SCRIPT_BASE64`. Die Kontextualisierung aus Kapitel 2.4 führt es bei jedem Start der VM als `root` aus.

::code{file="platform/repo/tofu/k3s.sh.tftpl"}

Die Datei ist eine Vorlage. `templatefile()` in `main.tf` setzt Rolle, Adressen, Version und Token ein, die Zeilen mit `%{ if }` wählen den Teil für Server oder Agent. Der erste Befehl beendet das Skript, wenn k3s schon da ist. Ein Neustart installiert also nichts doppelt. Der Agent fragt den Server so lange nach `/ping`, bis dessen API antwortet. Erst dann tritt er mit dem Token bei. Die Version ist fest eingetragen, `v1.36.5+k3s1`. Auch ein Neubau in drei Monaten installiert diese Version, selbst wenn es dann eine neuere gibt.

## Adressbereiche

Jeder Pod bekommt eine Adresse, jeder Service ebenso. k3s nimmt ohne Angabe `10.42.0.0/16` für Pods und `10.43.0.0/16` für Services. Im Testaufbau lag das Lab selbst in `10.42.0.0/24`. Die Pods hätten die Adressen der Lab-VMs überdeckt. Pakete an das Front-end wären im Cluster geblieben. Das Startskript setzt darum eigene Bereiche, die sich mit keinem Netz des Kurses überschneiden.

| Bereich | Netz |
|---|---|
| Labnetz von smartlearn oder deinem Hypervisor | das Netz deiner drei VMs und des Clients |
| `cc-net` | `CC_GUEST_NET` aus deinen Parametern, ein Netz in `172.16.0.0/12` |
| Pods | `10.52.0.0/16`, jeder Node bekommt daraus ein `/24` |
| Services | `10.53.0.0/16` |

## Routing mit host-gw

Pods auf verschiedenen Nodes brauchen einen Weg zueinander. Dafür baut flannel in der Standardeinstellung ein VXLAN, wie OpenNebula für `cc-net`. Im Testaufbau verloren Pakete in diesem zweiten VXLAN innerhalb der verschachtelten VMs ihre Prüfsumme. Pods auf dem Agent erreichten das DNS auf dem Server nicht.

Beide VMs liegen aber im selben Netz `cc-net`, ein Overlay braucht es also nicht. Mit `--flannel-backend host-gw` trägt flannel auf jedem Node eine Route ein, die das Pod-Netz des anderen Nodes über dessen Adresse in `cc-net` erreicht. Pakete gehen ohne zusätzliche Kapselung direkt hin. Das funktioniert nur, wenn alle Nodes im selben Layer-2-Netz liegen. Ein Cluster über mehrere Standorte bräuchte wieder ein Overlay.

![Der k3s-Cluster in cc-net. Links spricht kubectl auf dem Front-end mit der kubeconfig den API-Server auf Port 6443 an. Im internen Netz cc-net mit dem Bereich CC_GUEST_NET liegen zwei VMs. k3s-server mit der Adresse CC_K3S_SERVER_IP enthält die Control Plane mit API-Server und der Datenbank SQLite und führt selbst Pods aus. k3s-agent mit der Adresse CC_K3S_AGENT_IP tritt mit dem Token bei und führt ebenfalls Pods aus. Jeder Node bekommt für seine Pods ein /24 aus 10.52.0.0/16, die Services liegen für den ganzen Cluster in 10.53.0.0/16. Achte auf die Routen von host-gw. Jeder Node schickt Pakete für das Pod-Netz des anderen direkt an dessen Adresse in cc-net, ohne Overlay.](../../../assets/figures/de/p4c3-cluster.svg)

## Der Weg einer Anfrage

Ein ersetzter Pod hat einen neuen Namen und eine neue Adresse, oft auf einem anderen Node. Wer den Webshop über die Adresse eines Pods anspricht, bekommt nach dem nächsten Update keine Antwort mehr.

Dafür gibt es Services. Ein Service bekommt einen Namen und eine feste virtuelle Adresse aus dem Bereich der Services, hier `10.53.0.0/16`. CoreDNS löst `webshop.velo.svc.cluster.local` zu dieser Adresse auf, im selben Namespace genügt `webshop`. Welche Pods hinter dem Service stehen, bestimmt sein Selector, beim Webshop das Label `app=webshop`. Ein Controller trägt die Adressen dieser Pods in EndpointSlices ein, aber nur die von Pods, deren Readiness-Probe antwortet. Die [Dokumentation zu Services](https://kubernetes.io/docs/concepts/services-networking/service/) beschreibt die Typen.

Hinter der Adresse eines Services steht weder ein Rechner noch ein Prozess. Stattdessen beobachtet kube-proxy Services und EndpointSlices und schreibt auf jedem Node Regeln in den Paketfilter des Kernels. Im Lab läuft kube-proxy von k3s im Modus iptables. Ein Paket an die Adresse des Services schreibt der Kernel schon auf dem Node des Absenders auf die Adresse eines zufällig gewählten Pods um. Danach geht es durch das Pod-Netz, wenn nötig über die Route von host-gw zum anderen Node. Die [Dokumentation zu virtuellen IPs](https://kubernetes.io/docs/reference/networking/virtual-ips/) erklärt die Modi von kube-proxy.

Die Adressen der Services gelten nur im Cluster. Von aussen nutzt der Kurs zwei Wege. Ein Service vom Typ NodePort öffnet zusätzlich einen Port aus dem Bereich 30000 bis 32767 auf jedem Node. Argo CD ist so ab Kapitel 4.4 auf Port 30080 beider VMs erreichbar, Grafana und Prometheus folgen in Teil 5 mit eigenen Ports. Du kannst jeden der beiden Nodes ansprechen, kube-proxy leitet die Anfrage auch an einen Pod auf dem anderen Node weiter.

Der Webshop nimmt den zweiten Weg, einen Ingress. Ein [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) ist eine Regel für HTTP, beim Webshop «alle Pfade an den Service `webshop`». Umsetzen muss sie ein Ingress-Controller, den k3s mit Traefik gleich mitbringt. Traefik läuft selbst als Pod hinter einem Service vom Typ LoadBalancer, den ServiceLB auf Port 80 und 443 beider VMs bereitstellt, wie die [Dokumentation zu den Services von k3s](https://docs.k3s.io/networking/networking-services) beschreibt. Eine Anfrage an Port 80 erreicht zuerst Traefik, das die Regel zu Host und Pfad sucht und die Anfrage an einen Pod des Services schickt. Für Webanwendungen ist der Ingress der übliche Weg nach aussen, weil sich viele Anwendungen die Ports 80 und 443 teilen und nach Namen und Pfaden getrennt werden. Den Mitgliedern verbietet die Quota in Kapitel 4.5 eigene NodePorts, ihnen bleibt der Ingress.

## Die kubeconfig

Für die Anmeldung braucht kubectl die Adresse der API und ein Zertifikat. Beides steht auf dem Server in `/etc/rancher/k3s/k3s.yaml`, mit `127.0.0.1` als Adresse. Das Skript holt die Datei per SSH, setzt die Adresse des Servers ein und legt sie als `~/.kube/config` ab.

::code{file="platform/get-kubeconfig.sh"}

```bash
~/cc/platform/get-kubeconfig.sh
```

Die Datei gibt volle Rechte auf den Cluster. Wie `one_auth` gehört sie nur dir. Nach einem Neubau des Clusters hat der Server neue Zertifikate und einen neuen Schlüssel für SSH. Dann löschst du den alten Schlüssel mit `ssh-keygen -R <adresse-des-servers>` und holst die kubeconfig neu.

## Erste Schritte mit kubectl

```bash
kubectl get nodes -o wide
kubectl get pods -A -o wide
kubectl get services -A
kubectl top nodes
```

Im Lab waren beide Nodes etwa zwei Minuten nach `tofu apply` `Ready`. Die Pods von CoreDNS, Traefik, local-path und metrics-server liefen mit Adressen aus `10.52.0.0/16`, die Services hatten Adressen aus `10.53.0.0/16`. Traefik stand als Service vom Typ LoadBalancer auf beiden Adressen der VMs.

Ein kurzer Test zeigt, ob ein Pod auf dem Agent Namen auflösen und ins Internet kann.

```bash
kubectl run test --rm -it --restart=Never --image=busybox:1.37 \
  --overrides='{"spec":{"nodeName":"k3s-agent"}}' -- \
  sh -c 'nslookup kubernetes.default.svc.cluster.local; wget -qO- https://example.com | head -c 100'
```

::::exercise[Lab]
Hole die kubeconfig und zeige, dass beide Nodes `Ready` sind und Pods auf dem Agent Namen auflösen. Notiere, wie lange es von `tofu apply` bis `Ready` dauert.

:::solution
`kubectl get nodes` zeigt `k3s-server` mit der Rolle `control-plane` und `k3s-agent` ohne Rolle, beide `Ready` mit der Version `v1.36.5+k3s1`. Der Test-Pod löst `kubernetes.default.svc.cluster.local` zu `10.53.0.1` auf und lädt die Seite. Im Lab dauerte es etwa zwei Minuten, auf langsameren Knoten länger.
:::
::::

::::exercise[Pod löschen]
Lege ein Deployment mit zwei Pods und einen Service davor an.

```bash
kubectl create deployment uebung --image=busybox:1.37 --replicas=2 -- sleep 3600
kubectl expose deployment uebung --port 80
kubectl get pods -o wide
kubectl get replicasets,endpointslices
```

Sag voraus, was mit der Zahl der Pods, ihren Namen und Adressen, dem ReplicaSet und dem Service geschieht, wenn du einen der Pods mit `kubectl delete pod <name>` löschst. Prüfe deine Vorhersage mit denselben Befehlen und räume danach mit `kubectl delete deployment,service uebung` auf. Was wäre anders, wenn statt des Pods die VM `k3s-agent` ausfiele?

:::solution
Das ReplicaSet zählt nur noch einen passenden Pod und legt sofort einen neuen an. Der Name des neuen Pods beginnt wieder mit `uebung-` und dem Hash des ReplicaSets, endet aber anders. Auch seine Adresse ist neu. Je nach Entscheid des Schedulers läuft er auf dem anderen Node. Das ReplicaSet bleibt dasselbe, weil sich die Vorlage nicht geändert hat. Der Service behält Adresse und Namen, in seiner EndpointSlice ersetzt die Adresse des neuen Pods die alte. Fällt `k3s-agent` aus, zeigt `kubectl get nodes` ihn nach weniger als einer Minute als `NotReady`. Nach fünf Minuten räumt Kubernetes seine Pods. Sie bleiben als `Terminating` sichtbar, bis der Node zurück ist, aber das ReplicaSet startet Ersatz auf `k3s-server`, wenn dessen Kapazität für die Requests reicht. Fällt dagegen `k3s-server` aus, laufen die Pods auf dem Agent weiter, doch ohne API-Server ersetzt niemand einen Pod.
:::
::::

::::exercise[Neu bauen]
Baue den Cluster mit `tofu destroy` und `tofu apply` neu. Was musst du danach auf dem Front-end tun, damit kubectl wieder funktioniert? Begründe deine Antwort.

:::solution
Die neuen VMs haben neue Schlüssel für SSH. Auch die Zertifikate von k3s sind neu. `ssh-keygen -R` entfernt die alten Schlüssel der beiden Adressen aus `~/.ssh/known_hosts`, sonst verweigert SSH die Verbindung. Danach holt `get-kubeconfig.sh` die neue kubeconfig, die alte passt nicht mehr zum Cluster.
:::
::::

::::exercise[Adressbereiche]
Im Testaufbau lagen die Lab-VMs im Netz `10.42.0.0/24`. Zuerst lief k3s dort mit seinen Standardbereichen. Was passiert mit einem Paket von einem Pod an das Front-end `10.42.0.10` und wo änderst du das?

:::solution
Der erste Node erhält aus `10.42.0.0/16` das Netz `10.42.0.0/24` für seine Pods, genau das Netz des Labs. Der Node hält `10.42.0.10` für einen eigenen Pod und schickt das Paket an seine lokale Bridge statt an das Front-end. Die Bereiche stehen in `k3s.sh.tftpl` bei `--cluster-cidr` und `--service-cidr`. Du wählst Bereiche, die keines deiner Netze berühren. Danach baust du den Cluster neu, denn k3s legt die Bereiche bei der Installation fest.
:::
::::
