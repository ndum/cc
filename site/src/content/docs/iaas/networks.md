---
title: Virtuelle Netze
description: Die Netztreiber von OpenNebula, das interne Netz deiner Cloud als VXLAN aus deinen persönlichen Parametern, Adressbereiche und Leases sowie das Gateway auf dem Front-end.
sidebar:
  order: 3
---

:::assignment
«Die Mitglieder fragen, ob ihre Server ins Internet kommen und ob man sie von aussen sieht», schreibt Simone Wyss. «Kannst du ein Netz einrichten, in dem unsere VMs laufen, ohne dass wir dafür am Netz der Schule etwas ändern müssen?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Die Netztreiber von OpenNebula unterscheiden und VXLAN begründen
- Das interne Netz deiner Cloud aus deinen Parametern anlegen
- Erklären, was ein Adressbereich und eine Lease sind
- Beschreiben, wie Netz, Gateway und NAT zusammenspielen
- Erklären, was ein Overlay-Netz ist und weshalb die MTU auf 1450 Byte sinkt
:::

## Netztreiber

Ein virtuelles Netz in OpenNebula beschreibt, wie die VMs an ein Netz angeschlossen werden. Der Netztreiber bestimmt, wie das auf den Knoten geschieht.

| Treiber | Funktionsweise | Geeignet, wenn |
|---|---|---|
| `bridge` | Die VMs hängen über eine Linux-Bridge direkt im Netz des Knotens. | das Netz des Knotens fremde MAC-Adressen zulässt |
| `802.1Q` | Jedes virtuelle Netz bekommt ein eigenes VLAN auf dem physischen Netz. | der Switch VLANs für die Knoten bereitstellt |
| `vxlan` | Das Netz der VMs reist in UDP-Paketen über das bestehende Netz zwischen den Knoten. | das bestehende Netz nichts über die VMs wissen soll |
| `ovswitch` | Open vSwitch statt Linux-Bridge, mit Funktionen wie Flussregeln | grosse Installationen mit besonderen Anforderungen |

Dein Lab nutzt `vxlan`. Im Labnetz erscheinen von deiner Cloud nur Front-end und Knoten, ihre VMs bleiben darin unsichtbar. Deshalb funktioniert das Lab auch auf smartlearn, wo der Hypervisor keine fremden MAC-Adressen durchlässt.

Die drei Treiber für Linux-Bridges unterscheiden sich vor allem darin, wie viel das physische Netz über die VMs wissen muss. Bei `bridge` sieht der Switch die MAC-Adresse jeder VM, das Netz der VMs ist das Netz der Knoten. `802.1Q` trennt die Netze mit einem VLAN-Tag im Rahmen. Das Tag hat 12 Bit, es gibt also höchstens 4094 Netze. Jeder Switch zwischen den Knoten muss diese VLANs kennen. `vxlan` verlangt vom physischen Netz nur, dass sich die Knoten über IP erreichen. Seine Kennung hat 24 Bit, das reicht für rund 16 Millionen Netze. Dafür kostet jedes Paket 50 Byte. Für Rahmen an alle braucht `vxlan` zudem Multicast im Netz. Die [Übersicht der Netztreiber](https://docs.opennebula.io/7.4/product/cluster_configuration/networking_system/overview/) beschreibt alle Varianten von OpenNebula 7.4.

## Overlay-Netze

Ein Overlay-Netz ist ein virtuelles Netz, das auf einem bestehenden Netz aufsetzt. Das bestehende Netz heisst Underlay, in deinem Lab ist es das Labnetz mit den Adressen von Front-end und Knoten. Die Endpunkte des Overlays sind die Knoten selbst. Sie verpacken den Verkehr der VMs in gewöhnliche IP-Pakete an einen anderen Knoten. Das Underlay transportiert diese Pakete wie jeden anderen Verkehr. Den VMs erscheint es, als hingen sie alle am selben Switch, auch wenn sie auf verschiedenen Knoten laufen. Es entsteht ein Netz auf Schicht 2, das sich über ein Netz auf Schicht 3 spannt. Das Underlay muss dabei weder die IP-Adressen noch die MAC-Adressen der VMs kennen. Clouds setzen Overlays gern ein, weil ein Mandant damit ein neues Netz anlegen kann, ohne dass jemand am physischen Netz etwas ändert.

## VXLAN

VXLAN (Virtual Extensible LAN) packt jeden Ethernet-Rahmen einer VM in ein UDP-Paket und schickt es über das Labnetz zum Knoten, auf dem die Ziel-VM läuft. Dort packt der Kernel den Rahmen wieder aus. Eine Kennung zwischen 1 und rund 16 Millionen trennt die Netze voneinander, in deinem Lab ist es `CC_VNI` aus deinen Parametern. Rahmen an alle, etwa die Anfragen von ARP, gehen an eine Multicast-Gruppe, die OpenNebula aus 239.0.0.0 und der Kennung bildet. Das Gateway auf dem Front-end tritt derselben Gruppe bei und gehört damit zum selben Netz.

Den Aufbau der Pakete legt [RFC 7348](https://www.rfc-editor.org/rfc/rfc7348) fest. Vor den Rahmen der VM setzt der Knoten einen VXLAN-Kopf von 8 Byte, der vor allem die Kennung mit 24 Bit enthält, den VXLAN Network Identifier oder kurz VNI. Davor kommen ein UDP-Kopf und ein IP-Kopf mit den Adressen der beiden Knoten als Absender und Ziel. Der empfangende Knoten liest die VNI und gibt den Rahmen nur an die Bridge des passenden Netzes weiter. Damit bleiben die Netze verschiedener Mandanten getrennt, obwohl ihre Pakete über dieselbe Leitung laufen. Die IANA hat VXLAN den UDP-Port 4789 zugeteilt. Der Linux-Kernel nimmt als Vorgabe noch den älteren Port 8472. OpenNebula übernimmt diesen Wert, wie die [Dokumentation zu VXLAN](https://docs.opennebula.io/7.4/product/cluster_configuration/networking_system/vxlan/) festhält. Deshalb setzt `lab/cc-gateway.sh` auf dem Front-end ebenfalls `dstport 8472`, sonst kämen die Pakete der Knoten dort nicht an.

Ein Paket im Labnetz darf 1500 Byte gross sein. Davon belegen der äussere IP-Kopf 20 Byte, der UDP-Kopf 8 Byte, der VXLAN-Kopf 8 Byte und der Ethernet-Kopf des inneren Rahmens 14 Byte. Diese 50 Byte fehlen der VM, für ihr IP-Paket bleiben 1450 Byte. Zu grosse Pakete zerlegen die Knoten nicht, denn RFC 7348 verbietet den Endpunkten die Fragmentierung. Senden die VMs grössere Pakete, gehen diese verloren. Downloads über HTTPS brechen dann ab, während kleine Anfragen noch klappen. Das Netz gibt den VMs deshalb über `GUEST_MTU` und den Kontext die MTU 1450 mit.

## Das interne Netz anlegen

Das Skript `lab/iaas/make-network.sh` schreibt die Vorlage des Netzes aus deinen Parametern. Die Schnittstelle, über die das VXLAN läuft, liest es auf Knoten 1 ab.

```bash
~/cc/lab/iaas/make-network.sh > ~/cc-lab/cc-net.tpl
onevnet create ~/cc-lab/cc-net.tpl
onevnet list
```

::code{file="lab/iaas/make-network.sh" lines="16-37"}

`VN_MAD` wählt den Treiber, `PHYDEV` die Schnittstelle der Knoten, `VLAN_ID` die Kennung von VXLAN und `BRIDGE` den Namen der Bridge auf den Knoten. `AR` ist der Adressbereich, aus dem OpenNebula den VMs ihre Adressen gibt. `GATEWAY` und `DNS` erhalten die VMs über den Kontext, wie Kapitel 2.4 zeigt.

## Adressen und Leases

OpenNebula verteilt die Adressen selbst, ohne DHCP. Startet eine VM, nimmt OpenNebula die nächste freie Adresse aus dem Adressbereich und vermerkt sie als Lease. Die VM bekommt Adresse, Gateway und DNS beim Start über den Kontext. Die belegten Adressen zeigt `onevnet show`.

```bash
onevnet show cc-net
```

Weil OpenNebula die Adressen verwaltet, bleibt die Adresse einer VM gleich, solange es die VM gibt. Löschst du sie, wird die Lease wieder frei.

## Netz und Gateway

Das Netz `cc-net` und der Dienst `cc-gateway` aus Kapitel 0.4 gehören zusammen. Auf den Knoten legt OpenNebula beim Start der ersten VM die Bridge `ccbr` mit deiner Kennung und das VXLAN an. Auf dem Front-end hat `cc-gateway` die Bridge `cc-br` mit der Adresse des Gateways und dasselbe VXLAN schon eingerichtet. Ein Paket einer VM ins Internet läuft über das VXLAN zum Front-end, das es mit NAT ins Labnetz und weiter ins Internet schickt.

![Der Weg eines Pakets von der VM ins Internet. Links schickt eine VM auf Knoten 1 ihren Rahmen an die Bridge ccbr mit deiner Kennung und weiter ins VXLAN. In der Mitte reist der Rahmen im Labnetz in einem UDP-Paket an Port 8472. Der Kopf von VXLAN und das äussere Paket brauchen 36 Byte, der Ethernet-Kopf im Rahmen der VM weitere 14. Für das IP-Paket der VM bleiben so höchstens 1450 der 1500 Byte, darum die MTU 1450. Rechts packt cc-vxlan auf dem Front-end den Rahmen aus und gibt ihn an die Bridge cc-br mit der Adresse des Gateways. Die NAT-Regel in der nftables-Tabelle cc_gateway ersetzt die Absenderadresse. Danach geht das Paket über das Labnetz ins Internet. Achte darauf, dass von der Cloud im Labnetz nur Front-end und Knoten sichtbar sind.](../../../assets/figures/de/p2c3-network-path.svg)

## Source NAT

Die Adressen deines internen Netzes stammen aus einem privaten Bereich nach [RFC 1918](https://www.rfc-editor.org/rfc/rfc1918). Router im Internet leiten solche Adressen nicht weiter. Auch das Labnetz kennt keine Route zurück in dein internes Netz. Schickte das Front-end die Pakete der VMs unverändert weiter, käme nie eine Antwort zurück. Deshalb ersetzt es mit Source NAT die Absenderadresse jedes ausgehenden Pakets durch seine eigene Adresse im Labnetz, wie es [RFC 3022](https://www.rfc-editor.org/rfc/rfc3022) beschreibt. Damit viele VMs gleichzeitig dieselbe Adresse nutzen können, ändert es bei Bedarf auch den Absenderport. Jede Verbindung hält der Kernel in einer Tabelle fest, dem Connection Tracking. Kommt eine Antwort, sucht er dort den passenden Eintrag, setzt die Adresse der VM wieder als Ziel ein und schickt das Paket über das VXLAN zurück.

Masquerade ist eine Form von Source NAT, bei der die neue Absenderadresse nicht fest in der Regel steht. Der Kernel nimmt jeweils die aktuelle Adresse der Schnittstelle, über die das Paket hinausgeht. Deshalb stimmt die Regel auch dann noch, wenn sich die Adresse des Front-ends ändert. Die Regel in `cc-gateway` erfasst nur Pakete aus deinem internen Netz, die über die Schnittstelle zum Labnetz hinausgehen. Vorher schaltet das Skript mit `net.ipv4.ip_forward` das Weiterleiten ein. Ohne diese Einstellung gibt ein Linux-Host keine Pakete für andere Rechner weiter.

::code{file="lab/cc-gateway.sh" lines="47-55"}

Die VMs der Mitglieder erreichen also das Internet, von aussen sind sie aber nicht sichtbar. Eine Verbindung, die von aussen beginnt, hat keinen Eintrag in der Tabelle und erreicht nur das Front-end selbst. Soll ein Dienst in einer VM von aussen erreichbar sein, braucht es eine Weiterleitung mit Destination NAT oder einen Proxy auf dem Front-end.

::::exercise[Lab]
Lege das Netz `cc-net` mit dem Skript an und vergleiche `onevnet show cc-net` mit den Werten in `/etc/cc-lab.env`. Welche drei Werte müssen übereinstimmen, damit das Gateway funktioniert?

:::solution
Die Kennung `VLAN_ID` muss `CC_VNI` entsprechen und das Gateway `GATEWAY` muss `CC_GUEST_GATEWAY` sein. Ausserdem müssen die Adressen des Bereichs in `CC_GUEST_NET` liegen. Nur dann gehören Front-end und VMs zum selben VXLAN und nur dann erfasst die NAT-Regel auf dem Front-end den Verkehr der VMs.
:::
::::

::::exercise[Netztreiber]
Die Gemeinde Hinterbüel betreibt ein eigenes kleines Rechenzentrum mit einem VLAN-fähigen Switch und denkt über eine eigene Cloud nach. Welchen Netztreiber würdest du ihr empfehlen und warum?

:::solution
`802.1Q` passt, weil der Switch VLANs bereitstellt. Jedes Netz bekommt ein eigenes VLAN, ohne den zusätzlichen Kopf von VXLAN und ohne Multicast im Netz. VXLAN wäre auch möglich, lohnt sich aber vor allem, wenn das Netz darunter nichts von den VMs wissen soll oder kann.
:::
::::
