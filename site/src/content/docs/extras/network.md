---
title: Linux-Netz im Lab
description: Schnittstellen und Routen mit ip, netplan und systemd-networkd auf Ubuntu 26.04, die Bridges und VXLAN-Geräte, NAT und Firewall mit nftables, DNS, die MTU und das Pod-Netz von k3s mit den Befehlen für jeden Server.
sidebar:
  order: 3
---

:::goals
Nach diesem Kapitel kannst du:

- Schnittstellen, Adressen und Routen eines Servers mit `ip` lesen
- Erklären, wie netplan, systemd-networkd und systemd-resolved das Netz eines Servers einrichten
- Die Bridges und VXLAN-Geräte auf Front-end und Knoten ihrem Zweck zuordnen
- Die Tabellen `cc_gateway` und `cc_firewall` lesen und ihr Zusammenspiel erklären
- Begründen, wo im Lab die MTU 1450 gilt und woher sie kommt
- Den Weg eines Pakets aus einem Pod bis ins Internet beschreiben
:::

In deinem Lab liegen mehrere Netze übereinander. Diese Ergänzung zeigt, wie Linux sie umsetzt und wie du das auf jedem Rechner nachprüfst. Die Beispiele verwenden den Code `mmuster` wie die [Lab-Referenz](../../lab-reference/) und die Schnittstelle `eth0`. Deine Schnittstelle heisst vielleicht anders, etwa `ens160`, den Namen hast du in [Kapitel 0.3](../../start/parameters/) abgelesen. Alle Befehle auf dieser Seite lesen nur.

## Die Netze im Lab

| Rechner | Labnetz 192.168.210.0/24 | cc-net 172.31.160.0/24 | Pod-Netz 10.52.0.0/16 |
|---|---|---|---|
| Client | .10 | keine Adresse | keine Adresse |
| Front-end | .137 auf `eth0` | .1 auf `cc-br` | keine Adresse |
| Knoten 1 und 2 | .138 und .139 auf `eth0` | keine Adresse, sie tragen nur den Verkehr | keine Adresse |
| VMs der Mitglieder | keine Adresse | ab .10 | keine Adresse |
| `k3s-server` und `k3s-agent` | keine Adresse | .110 und .111 | je ein /24 auf `cni0` |

Nur das Front-end hat Adressen im Labnetz und in cc-net, deshalb ist es das Gateway von cc-net. Die Knoten tragen den Verkehr von cc-net auf Schicht 2 weiter, ohne darin selbst eine Adresse zu haben. Eine VM in cc-net erreichst du darum vom Front-end aus, von einem Knoten aus nicht. Die Adressen der Pods kennen nur die beiden VMs von k3s.

## Schnittstellen und Adressen

Das Werkzeug `ip` aus iproute2 zeigt und ändert Schnittstellen, Adressen und Routen, auf Ubuntu 26.04 in Version 6.19. `-br` kürzt die Ausgabe auf eine Zeile pro Schnittstelle, `-d` zeigt Details wie den Typ eines Geräts. Die [Handbuchseite von ip-link](https://manpages.ubuntu.com/manpages/resolute/man8/ip-link.8.html) beschreibt alle Gerätetypen.

```bash
ip -br link
ip -br addr
ip -d link show cc-vxlan
```

Auf dem Front-end listet `ip -br addr` die Adresse im Labnetz auf `eth0`, das Gateway auf `cc-br` und `cc-vxlan` ohne IPv4-Adresse. `ip -d link show cc-vxlan` nennt die MTU 1450, mit `master cc-br` die Bridge des Geräts sowie Kennung, Gruppe und Port des VXLAN.

## netplan und systemd-networkd

Die Adresse im Labnetz hast du in Kapitel 0.3 mit netplan festgelegt. netplan liest die YAML-Dateien in `/etc/netplan/` in alphabetischer Reihenfolge, spätere ergänzen oder überschreiben frühere, wie die [Dokumentation zu netplan generate](https://netplan.readthedocs.io/en/stable/netplan-generate/) beschreibt. Daraus schreibt es Dateien für systemd-networkd nach `/run/systemd/network/`, etwa `10-netplan-eth0.network`. Mit diesen Dateien richtet systemd-networkd Adresse, Route und DNS-Server ein. `/run` ist nach einem Neustart leer, netplan erzeugt die Dateien bei jedem Start neu. Ändern solltest du deshalb nur die YAML-Dateien.

Die Geräte, die `cc-gateway` und OpenNebula anlegen, kennt netplan nicht. `networkctl list` führt sie als `unmanaged`, systemd-networkd lässt sie in Ruhe. Der Dienst `cc-gateway` startet erst nach `network-online.target`, weil er die Schnittstelle zum Labnetz aus der Default-Route liest. Die Firewall aus Kapitel 6.1 lädt dagegen vor `network-pre.target`, also bevor systemd-networkd die erste Schnittstelle einrichtet.

```bash
netplan status
networkctl list
sudo cat /run/systemd/network/10-netplan-eth0.network
```

Auf Knoten 1 nennt `netplan status` den Stub von systemd-resolved und für `eth0` Adresse, DNS-Server und Routen.

```text
     Online state: online
    DNS Addresses: 127.0.0.53 (stub)

●  2: eth0 ethernet UP (networkd: eth0)
        Addresses: 192.168.210.138/24
                   fe80::215:5dff:fe01:6e03/64 (link)
    DNS Addresses: 192.168.210.1
           Routes: default via 192.168.210.1 (static)
                   192.168.210.0/24 from 192.168.210.138 (link)
```

## Bridges und VXLAN

Eine Bridge verbindet Schnittstellen auf Schicht 2 wie ein Switch. Sie merkt sich, hinter welchem Port welche MAC-Adresse liegt. Rahmen an eine bekannte Adresse schickt sie nur an diesen Port. Ein VXLAN-Gerät ist ein Port, der Rahmen in UDP-Pakete packt und über eine andere Schnittstelle verschickt.

Auf dem Front-end legt `cc-gateway` beides an, `cc-vxlan` in der Bridge `cc-br` mit der Adresse des Gateways. Auf den Knoten legt OpenNebula die Bridge `ccbr5862` und das VXLAN-Gerät `eth0.5862` an, sobald dort eine VM aus cc-net läuft. Die Karten der VMs hängen mit Namen wie `one-12-0` in derselben Bridge, wie die Ergänzung [OpenNebula im Detail](../opennebula/) zeigt. Die Bridge auf einem Knoten hat keine Adresse.

![Bridges und VXLAN im Lab. Links das Front-end, rechts Knoten 1 mit zwei VMs. Auf beiden hat eth0 die MTU 1500 und eine Adresse im Labnetz. Auf dem Front-end legt cc-gateway die Bridge cc-br mit dem Gateway 172.31.160.1/24 an, darin das VXLAN-Gerät cc-vxlan, beide mit der MTU 1450. Pakete aus cc-net leitet der Kernel mit ip_forward=1 an eth0 weiter. Dabei ersetzt die Tabelle cc_gateway ihren Absender durch 192.168.210.137. Auf dem Knoten legt OpenNebula die Bridge ccbr5862 ohne Adresse an, darin das VXLAN-Gerät eth0.5862. Der Kernel gibt ihm die MTU von eth0 minus 50 Byte, also 1450. In derselben Bridge hängen die Karten der VMs wie one-12-0, libvirt gibt ihnen die MTU der Bridge. Die VMs selbst bekommen 1450 über den Kontext. Die beiden VXLAN-Geräte verbinden die Bridges zum Netz cc-net. Sie verpacken die Rahmen in UDP-Pakete an Port 8472 und finden einander über die Multicast-Gruppe 239.0.22.230 im Labnetz. Achte darauf, dass die Bridge auf dem Knoten keine Adresse hat. Von den Servern hat nur das Front-end eine Adresse in cc-net.](../../../assets/figures/de/ex-network.svg)

Eine Bridge `br0` mit der Adresse des Knotens, wie sie der Netztreiber `bridge` verlangt, gibt es im Lab nicht. Mit VXLAN behält `eth0` seine Adresse. Auch das Netz `default` von libvirt mit der Bridge `virbr0` fehlt, OneDeploy schaltet es bei der Installation ab.

```bash
sudo cc-gateway status
```

```text
cc-br            UP             172.31.160.1/24 fe80::fcbf:e3ff:fe9a:6827/64
vxlan id 5862 group 239.0.22.230
ip_forward=1
        ip saddr 172.31.160.0/24 oifname "eth0" masquerade
```

Die Ausgabe zeigt die Bridge mit dem Gateway, das VXLAN mit Kennung und Gruppe, die Weiterleitung und die Regel für NAT.

Wohin ein VXLAN-Gerät einen Rahmen schickt, steht in seiner Forwarding-Tabelle. Für jede MAC-Adresse, von der schon ein Paket kam, nennt sie den Server dahinter. Alle anderen Ziele erreicht es über die Multicast-Gruppe 239.0.22.230, wie die [Dokumentation des Kernels](https://docs.kernel.org/networking/vxlan.html) beschreibt. In der Tabelle steht dafür ein Eintrag mit der Adresse `00:00:00:00:00:00`. Pakete an diese Gruppe erreichen alle Server, die ihr beigetreten sind. `ip maddr` zeigt die Mitgliedschaft auf `eth0`.

```bash
bridge fdb show dev cc-vxlan
ip maddr show dev eth0
ssh mmuster-node1 'ip link show master ccbr5862; bridge fdb show dev eth0.5862'
```

Auf dem Front-end führt die Tabelle die MAC-Adressen der VMs mit der Adresse ihres Knotens. Auf dem Knoten zeigt `ip link show master` das VXLAN-Gerät und die Karten der VMs in der Bridge.

## Routen und Default-Route

Für jedes Paket wählt der Kernel die Route mit dem längsten passenden Präfix. Auf dem Front-end liegen das Labnetz und cc-net direkt an `eth0` und `cc-br`. Alles andere geht über die Default-Route an 192.168.210.1, das Gateway von smartlearn. Die Knoten kennen nur das Labnetz und die Default-Route. Die VMs in cc-net bekommen über den Kontext 172.31.160.1 als Default-Route.

Der Client kennt cc-net nicht. Seine Pakete an 172.31.160.0/24 gingen an das Gateway von smartlearn, das cc-net ebenso wenig kennt. Dienste in cc-net erreichst du vom Client aus deshalb nur über einen SSH-Tunnel zum Front-end, wie die Lab-Referenz zeigt.

Drei Skripte des Kurses lesen die Schnittstelle zum Labnetz aus der Default-Route. `prepare.sh` nennt sie auf den Knoten, `make-network.sh` trägt sie als `PHYDEV` in cc-net ein und `cc-gateway` schickt das VXLAN darüber. Pakete für andere Rechner gibt ein Linux-Server nur weiter, wenn `net.ipv4.ip_forward` eingeschaltet ist. Im Lab braucht das nur das Front-end, die Bridges der Knoten arbeiten auf Schicht 2.

```bash
ip route
ip route get 172.31.160.110
ip route get 9.9.9.9
```

`ip route get` nennt für ein Ziel die Schnittstelle, das nächste Gateway und die Absenderadresse. Auf dem Front-end geht 172.31.160.110 mit dem Absender 172.31.160.1 über `cc-br`, 9.9.9.9 über `eth0` und 192.168.210.1.

## NAT und Firewall mit nftables

nftables ist der Paketfilter des Linux-Kernels. Regeln stehen in Ketten, Ketten in Tabellen. Eine Basiskette hängt an einem Hook, einer festen Stelle auf dem Weg eines Pakets durch den Kernel. Pakete an das Front-end selbst laufen durch `input`, Pakete zum Weiterleiten durch `prerouting`, `forward` und `postrouting`, wie die [Handbuchseite von nft](https://manpages.ubuntu.com/manpages/resolute/man8/nft.8.html) beschreibt. Auf dem Front-end liegen zwei Tabellen des Kurses.

| Tabelle | Familie | Kette | Inhalt | Kapitel |
|---|---|---|---|---|
| `cc_gateway` | `ip` | `postrouting`, Typ `nat` | Masquerade für cc-net hinaus über `eth0` | [0.4](../../start/prepare/) |
| `cc_firewall` | `inet` | `input`, Typ `filter`, Policy `drop` | Antworten, `lo`, ICMP, DHCP, Knoten und cc-net, Ports 22 und 2616 | [6.1](../../operations/security/) |

Die Firewall prüft nur Pakete an das Front-end selbst. Der Verkehr der VMs ins Internet läuft durch Hooks, an denen sie keine Kette hat. Auch die Antworten darauf erreichen `input` nicht. Das Connection Tracking erkennt sie als Teil einer bekannten Verbindung, setzt die Adresse der VM wieder als Ziel ein und der Kernel leitet sie weiter. VXLAN und Monitoring der Knoten kommen durch, weil die Firewall alles von den Adressen der Knoten annimmt.

Mit zwei Tabellen ersetzt jedes Skript nur seine eigene. `cc-gateway down` löscht `cc_gateway`, die Firewall bleibt stehen. Die Datei der Firewall beginnt mit `table inet cc_firewall` und `delete table inet cc_firewall` und baut die Tabelle danach neu auf. `nft -f` übernimmt die ganze Datei in einem einzigen Schritt, wie das [Wiki von nftables](https://wiki.nftables.org/wiki-nftables/index.php/Atomic_rule_replacement) erklärt. Dazwischen gibt es keinen Moment ohne Firewall. Hängen mehrere Basisketten am selben Hook, sieht ein Paket alle. Ein `accept` beendet nur die eigene Kette, ein `drop` gilt endgültig.

Auf den Knoten setzt OpenNebula die Regeln der Sicherheitsgruppen mit iptables in eine Kette `opennebula`. Auf Ubuntu 26.04 schreibt iptables seine Regeln in nftables, `sudo nft list ruleset` zeigt sie deshalb mit. In den VMs von k3s schreiben kube-proxy und flannel ihre Regeln ebenfalls mit iptables.

```bash
sudo nft list tables
sudo nft list table ip cc_gateway
sudo nft list table inet cc_firewall
```

`nft list tables` zeigt alle Tabellen mit ihrer Familie, die beiden anderen Befehle den Inhalt der Tabellen des Kurses. `cc_firewall` gibt es erst nach Kapitel 6.1.

## DNS

Auf den drei Servern beantwortet systemd-resolved die Anfragen nach Namen. `/etc/resolv.conf` ist ein Link auf `/run/systemd/resolve/stub-resolv.conf` und nennt nur den lokalen Stub 127.0.0.53. resolved fragt dann die DNS-Server, die netplan über systemd-networkd meldet, auf smartlearn 192.168.210.1. Diesen Aufbau empfiehlt die [Handbuchseite von systemd-resolved](https://manpages.ubuntu.com/manpages/resolute/man8/systemd-resolved.service.8.html). Die Namen der drei Server kommen ohne DNS aus. `prepare.sh` hat sie in `/etc/hosts` geschrieben und `/etc/nsswitch.conf` lässt die Server diese Datei vor dem DNS lesen.

Die VMs in cc-net bekommen über den Kontext die DNS-Server 9.9.9.9 und 1.1.1.1, die `make-network.sh` in das Netz schreibt. Ihre Anfragen gehen wie jeder andere Verkehr über das Gateway ins Internet.

Im Cluster beantwortet CoreDNS unter 10.53.0.10 die Namen der Services, etwa `webshop.velo.svc.cluster.local`. Andere Namen leitet CoreDNS an die DNS-Server der VM weiter. Steht in `/etc/resolv.conf` der VM eine lokale Adresse wie der Stub 127.0.0.53, gibt k3s den Pods stattdessen `/run/systemd/resolve/resolv.conf` mit den eigentlichen Servern. Den Stub der VM erreicht ein Pod nicht, die [Dokumentation von Kubernetes](https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/) beschreibt die Schleife, die sonst entsteht.

```bash
ls -l /etc/resolv.conf
resolvectl status
getent hosts mmuster-node1
```

`resolvectl status` zeigt pro Schnittstelle die DNS-Server, `getent hosts` löst einen Namen auf demselben Weg auf wie jedes Programm.

## MTU

[Kapitel 2.3](../../iaas/networks/) rechnet vor, warum in cc-net 1450 Byte bleiben. Auf den Servern siehst du, wo dieser Wert entsteht. `eth0` hat überall 1500 Byte. Auf dem Front-end setzt `cc-gateway` für `cc-vxlan` und `cc-br` ausdrücklich 1450. Auf den Knoten verlangt OpenNebula für `eth0.5862` 1500 Byte, weil cc-net kein Attribut `MTU` hat. Der Kernel begrenzt ein VXLAN-Gerät aber auf die MTU der Schnittstelle darunter minus 50 Byte und setzt 1450. Die Bridge übernimmt den kleinsten Wert ihrer Ports, libvirt gibt den Karten der VMs die MTU der Bridge. Die VMs selbst bekommen 1450 über `GUEST_MTU` und den Kontext.

Die MTU bestimmt auch die Grösse der TCP-Segmente. Beim Aufbau einer Verbindung kündigt jede Seite an, wie viele Byte Nutzdaten sie pro Segment annimmt, bei IPv4 die MTU minus 40 Byte für die Köpfe von IP und TCP. Eine VM mit 1450 kündigt 1410 an. Mit 1500 kündigte sie 1460 an und bekäme Pakete, die nicht durch das VXLAN passen.

In den VMs von k3s gilt die MTU 1450 von `eth0`. flannel übernimmt sie mit host-gw für `cni0` und die Pods unverändert, weil host-gw nichts einpackt. Das Standard-Backend `vxlan` von flannel zöge weitere 50 Byte ab und liesse den Pods 1400. Die Backends beschreibt die [Dokumentation von k3s](https://docs.k3s.io/networking/basic-network-options).

```bash
ip link show eth0
ip link show cc-br
ssh mmuster-node1 ip link show eth0.5862
ssh root@172.31.160.110 cat /run/flannel/subnet.env
```

Die erste Zeile jedes Geräts nennt seine MTU. `subnet.env` zeigt das Pod-Netz des Nodes und `FLANNEL_MTU=1450`.

## Das Pod-Netz von k3s

Auf jeder VM von k3s legt flannel die Bridge `cni0` an. Sie trägt die erste Adresse aus dem Pod-Netz dieses Nodes, im Lab auf dem Server 10.52.0.1. Jeder Pod hängt mit einem veth-Paar daran, ein Ende im Pod, das andere in `cni0`. Mit host-gw kommt für jeden anderen Node eine Route dazu, die sein Pod-Netz über seine Adresse in cc-net erreicht, wie [Kapitel 4.3](../../platform/kubernetes/) erklärt.

```bash
ssh root@172.31.160.110 'ip route | grep 10.52'
```

```text
10.52.0.0/24 dev cni0 proto kernel scope link src 10.52.0.1
10.52.1.0/24 via 172.31.160.111 dev eth0
```

Die erste Route führt zu den Pods auf dem Server selbst, die zweite über den Agent zu dessen Pods.

Ein Paket aus einem Pod auf dem Agent ins Internet bekommt unterwegs zweimal eine neue Absenderadresse. Es verlässt den Pod über `cni0` und die Default-Route der VM. Weil das Ziel ausserhalb des Pod-Netzes liegt, ersetzt die Masquerade von flannel die Adresse des Pods durch 172.31.160.111. Über `eth0` der VM gelangt es in die Bridge `ccbr5862` auf dem Knoten, durch das VXLAN zum Front-end und dort aus `cc-br` über `eth0` hinaus. Dabei ersetzt `cc_gateway` die Adresse noch einmal, nun durch 192.168.210.137. Die Antwort nimmt denselben Weg zurück, beide Stationen finden ihren Eintrag im Connection Tracking. Pakete zwischen Pods auf verschiedenen Nodes behalten dagegen ihre Adressen.

## Befehle pro Server

Die Tabelle sagt, was du auf welchem Rechner ansiehst. Auf die VMs in cc-net meldest du dich vom Front-end aus als `root` an.

| Rechner | Befehle | Was du siehst |
|---|---|---|
| Client | `ip -br addr`, `ip route` | die Adresse .10 und keine Route nach cc-net |
| Front-end | `sudo cc-gateway status`, `bridge fdb show dev cc-vxlan`, `sudo nft list ruleset`, `resolvectl status` | Gateway, VXLAN, NAT, Firewall und DNS |
| Knoten | `ip -br link`, `ip link show master ccbr5862`, `bridge fdb show dev eth0.5862`, `sudo nft list ruleset` | Bridge und VXLAN von OpenNebula, die Kette `opennebula` |
| VM in cc-net | `ip -br addr`, `ip link show eth0`, `ip route` | Adresse und MTU aus dem Kontext, die Default-Route über .1 |
| `k3s-server`, `k3s-agent` | `ip route`, `ip -br link`, `cat /run/flannel/subnet.env` | Routen von host-gw, `cni0` und die veth-Geräte der Pods |

::::exercise[Lab]
Verfolge den Weg eines Pakets von einem Pod auf `k3s-agent` zu `ubuntu.com`. Bist du noch nicht in Teil 4, nimm eine VM in cc-net wie `web-1` aus Kapitel 2.4. Notiere für jede Station den Rechner, die Schnittstelle, ihre MTU und die Absenderadresse, mit der das Paket weitergeht. Belege jede Angabe mit einem Befehl von dieser Seite.

:::solution
1. Im Pod hat das Paket eine Adresse aus dem Pod-Netz des Agents wie 10.52.1.0/24. Es verlässt den Pod über sein veth-Gerät Richtung `cni0` mit MTU 1450 (`subnet.env`, `ip -br link`).
2. Auf `k3s-agent` gilt die Default-Route über 172.31.160.1. Die Masquerade von flannel setzt den Absender 172.31.160.111 (`ip route`).
3. Auf dem Knoten des Agents läuft der Rahmen von der Karte `one-<nummer>-0` durch `ccbr5862` in `eth0.5862`, alle mit MTU 1450 (`ip link show master ccbr5862`).
4. Im Labnetz reist er in einem UDP-Paket an Port 8472 vom Knoten an das Front-end, Absender ist die Adresse des Knotens (`bridge fdb show dev eth0.5862`).
5. Auf dem Front-end packt `cc-vxlan` ihn aus, über `cc-br` erreicht das Paket den Kernel, der es an `eth0` weiterleitet (`ip route get 9.9.9.9`).
6. Die Tabelle `cc_gateway` ersetzt den Absender durch 192.168.210.137, dann geht das Paket an 192.168.210.1 (`sudo nft list table ip cc_gateway`).

Bei einer VM wie `web-1` fallen die Schritte 1 und 2 weg. Ihre Adresse aus cc-net bleibt bis zum Front-end erhalten.
:::
::::
