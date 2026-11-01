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
Nach diesem Kapitel kannst du

- die Bausteine eines Kubernetes-Clusters und die Besonderheiten von k3s nennen,
- erklären, wie das Startskript im Kontext k3s auf beiden VMs installiert,
- begründen, warum der Cluster eigene Bereiche für Pods und Services und das Routing host-gw braucht,
- den Cluster vom Front-end aus mit kubectl untersuchen.
:::

## Kubernetes in Kürze

Kubernetes verteilt Container auf mehrere Rechner und hält sie am Laufen. Wie OpenNebula für VMs arbeitet es mit einem Soll-Zustand. Du beschreibst, was laufen soll, und Controller im Cluster gleichen den Ist-Zustand laufend daran an.

| Begriff | Bedeutung |
|---|---|
| Control Plane | API-Server, Scheduler, Controller und die Datenbank des Clusters |
| Node | ein Rechner, auf dem Container laufen, hier eine VM |
| Pod | einer oder mehrere Container, die zusammen auf einem Node laufen und eine Adresse teilen |
| Deployment | hält eine Zahl gleicher Pods am Laufen und tauscht sie bei einem Update aus |
| Service | eine feste Adresse und ein Name für eine wechselnde Gruppe von Pods |
| Ingress | leitet HTTP-Anfragen von aussen an Services weiter |
| Namespace | ein Bereich im Cluster für Objekte, die zusammengehören |

## k3s

k3s ist eine Kubernetes-Distribution und ein Projekt der CNCF. Sie kommt als ein einziges Programm und braucht wenig Speicher. Was ein Cluster sonst aus vielen Teilen zusammensetzt, bringt k3s mit.

| Teil | Aufgabe |
|---|---|
| flannel | das Netz zwischen den Pods auf verschiedenen Nodes |
| CoreDNS | Namen wie `webshop.velo.svc.cluster.local` |
| Traefik | der Ingress-Controller auf Port 80 und 443 |
| ServiceLB | macht Services vom Typ LoadBalancer auf den Adressen der Nodes erreichbar |
| local-path | Speicher für Pods auf der Disk des Nodes |
| metrics-server | CPU und Speicher der Pods für `kubectl top` und das Autoscaling in Teil 5 |

Ein k3s-Server enthält die Control Plane und führt selbst auch Pods aus. Ein Agent ist nur Node. Mit einem Server und einem Agent hat der Cluster eine einzige Control Plane. Fällt der Server aus, laufen die Pods auf dem Agent weiter, aber niemand kann den Cluster mehr steuern. Für die Übungen reicht das, ein Cluster mit hoher Verfügbarkeit bräuchte drei Server.

## Das Startskript

Die VMs aus Kapitel 4.2 bringen Kubernetes nicht mit. OpenTofu gibt jeder VM im Kontext ein Startskript mit, `START_SCRIPT_BASE64`. Die Kontextualisierung aus Kapitel 2.4 führt es bei jedem Start der VM als `root` aus.

::code{file="platform/repo/tofu/k3s.sh.tftpl"}

Die Datei ist eine Vorlage. `templatefile()` in `main.tf` setzt Rolle, Adressen, Version und Token ein, die Zeilen mit `%{ if }` wählen den Teil für Server oder Agent. Die erste Zeile beendet das Skript, wenn k3s schon da ist, so installiert ein Neustart nichts doppelt. Der Agent fragt den Server so lange nach `/ping`, bis dessen API antwortet, und tritt dann mit dem Token bei. Die Version ist fest eingetragen, `v1.36.5+k3s1`. Ein Neubau in drei Monaten gibt so denselben Cluster und nicht den, der dann gerade aktuell ist.

## Adressbereiche

Jeder Pod bekommt eine Adresse, jeder Service ebenso. k3s nimmt ohne Angabe `10.42.0.0/16` für Pods und `10.43.0.0/16` für Services. Im Testaufbau lag das Lab selbst in `10.42.0.0/24`. Die Pods hätten die Adressen der Lab-VMs überdeckt, und Pakete an den Front-end wären im Cluster geblieben. Das Startskript setzt darum eigene Bereiche, die sich mit keinem Netz des Kurses überschneiden.

| Bereich | Netz |
|---|---|
| Lab-Netz von smartlearn oder deinem Hypervisor | das Netz deiner drei VMs |
| `cc-net` | `CC_GUEST_NET` aus deinen Parametern, ein Netz in `172.16.0.0/12` |
| Pods | `10.52.0.0/16`, jeder Node bekommt daraus ein `/24` |
| Services | `10.53.0.0/16` |

## Routing mit host-gw

Pods auf verschiedenen Nodes brauchen einen Weg zueinander. flannel baut dafür in der Standardeinstellung ein VXLAN, wie OpenNebula für `cc-net`. Im Testaufbau verloren Pakete in diesem zweiten VXLAN innerhalb der verschachtelten VMs ihre Prüfsumme, Pods auf dem Agent erreichten das DNS auf dem Server nicht.

Beide VMs liegen aber im selben Netz `cc-net`. Dann braucht es kein Overlay. Mit `--flannel-backend host-gw` trägt flannel auf jedem Node eine Route ein, das Netz der Pods des anderen Nodes liegt hinter dessen Adresse in `cc-net`. Pakete gehen ohne zusätzliche Kapselung direkt hin. host-gw funktioniert nur, wenn alle Nodes im selben Layer-2-Netz liegen, für einen Cluster über mehrere Standorte wäre wieder ein Overlay nötig.

![Der k3s-Cluster in cc-net. Links spricht kubectl auf dem Front-end mit der kubeconfig den API-Server auf Port 6443 an. Im internen Netz cc-net mit dem Bereich CC_GUEST_NET liegen zwei VMs. k3s-server mit der Adresse CC_K3S_SERVER_IP enthält die Control Plane mit API-Server und der Datenbank SQLite und führt selbst Pods aus. k3s-agent mit der Adresse CC_K3S_AGENT_IP tritt mit dem Token bei und führt ebenfalls Pods aus. Jeder Node bekommt für seine Pods ein /24 aus 10.52.0.0/16, die Services liegen für den ganzen Cluster in 10.53.0.0/16. Achte auf die Routen von host-gw. Jeder Node schickt Pakete für das Pod-Netz des anderen direkt an dessen Adresse in cc-net, ohne Overlay.](../../../assets/figures/de/p4c3-cluster.svg)

## Die kubeconfig

kubectl braucht die Adresse der API und ein Zertifikat, um sich anzumelden. Beides steht auf dem Server in `/etc/rancher/k3s/k3s.yaml`, mit `127.0.0.1` als Adresse. Das Skript holt die Datei per SSH, setzt die Adresse des Servers ein und legt sie als `~/.kube/config` ab.

::code{file="platform/get-kubeconfig.sh"}

```bash
~/cc/platform/get-kubeconfig.sh
```

Die Datei gibt volle Rechte auf den Cluster, sie gehört wie `one_auth` nur dir. Nach einem Neubau des Clusters hat der Server neue Zertifikate und einen neuen Schlüssel für SSH. Dann löschst du den alten Schlüssel mit `ssh-keygen -R <adresse-des-servers>` und holst die kubeconfig neu.

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

::::exercise[Neu bauen]
Baue den Cluster mit `tofu destroy` und `tofu apply` neu. Was musst du danach auf dem Front-end tun, damit kubectl wieder funktioniert, und warum?

:::solution
Die neuen VMs haben neue Schlüssel für SSH und k3s neue Zertifikate. `ssh-keygen -R` entfernt die alten Schlüssel der beiden Adressen aus `~/.ssh/known_hosts`, sonst verweigert SSH die Verbindung. Danach holt `get-kubeconfig.sh` die neue kubeconfig, die alte passt nicht mehr zum Cluster.
:::
::::

::::exercise[Adressbereiche]
Im Testaufbau lagen die Lab-VMs im Netz `10.42.0.0/24`, und k3s lief zuerst mit seinen Standardbereichen. Was passiert mit einem Paket von einem Pod an den Front-end `10.42.0.10`, und wo änderst du das?

:::solution
Der erste Node erhält aus `10.42.0.0/16` das Netz `10.42.0.0/24` für seine Pods, genau das Netz des Labs. Der Node hält `10.42.0.10` für einen eigenen Pod und schickt das Paket an seine lokale Bridge statt an den Front-end. Die Bereiche stehen in `k3s.sh.tftpl` bei `--cluster-cidr` und `--service-cidr`. Du wählst Bereiche, die keines deiner Netze berühren, und baust den Cluster neu, denn k3s legt sie bei der Installation fest.
:::
::::
