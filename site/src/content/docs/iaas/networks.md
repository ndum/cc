---
title: Virtuelle Netze
description: Die Netztreiber von OpenNebula, das interne Netz deiner Cloud als VXLAN aus deinen persönlichen Parametern, Adressbereiche und Leases und wie das Gateway auf dem Front-end dazu passt.
sidebar:
  order: 3
---

:::assignment
«Die Mitglieder fragen, ob ihre Server ins Internet kommen und ob man sie von aussen sieht», schreibt Simone Wyss. «Kannst du ein Netz einrichten, in dem unsere VMs laufen, ohne dass wir dafür am Netz der Schule etwas ändern müssen?»
:::

:::goals
Nach diesem Kapitel kannst du

- die Netztreiber von OpenNebula unterscheiden und VXLAN begründen,
- das interne Netz deiner Cloud aus deinen Parametern anlegen,
- erklären, was ein Adressbereich und eine Lease sind,
- beschreiben, wie Netz, Gateway und NAT zusammenspielen.
:::

## Netztreiber

Ein virtuelles Netz in OpenNebula beschreibt, wie die VMs an ein Netz angeschlossen werden. Der Netztreiber bestimmt, wie das auf den Knoten geschieht.

| Treiber | Funktionsweise | Geeignet, wenn |
|---|---|---|
| `bridge` | Die VMs hängen über eine Linux-Bridge direkt im Netz des Knotens. | das Netz des Knotens fremde MAC-Adressen zulässt |
| `802.1Q` | Jedes virtuelle Netz bekommt ein eigenes VLAN auf dem physischen Netz. | der Switch VLANs für die Knoten bereitstellt |
| `vxlan` | Das Netz der VMs reist in UDP-Paketen über das bestehende Netz zwischen den Knoten. | das bestehende Netz nichts über die VMs wissen soll |
| `ovswitch` | Open vSwitch statt Linux-Bridge, mit Funktionen wie Flussregeln | grosse Installationen mit besonderen Anforderungen |

Dein Lab nutzt `vxlan`. Im Labnetz erscheinen nur die Adressen deiner drei VMs, die VMs der Cloud sind darin unsichtbar. Deshalb funktioniert das Lab auch auf smartlearn, wo der Hypervisor keine fremden MAC-Adressen durchlässt.

## VXLAN

VXLAN (Virtual Extensible LAN) packt jeden Ethernet-Rahmen einer VM in ein UDP-Paket und schickt es über das Labnetz zum Knoten, auf dem die Ziel-VM läuft. Dort packt der Kernel den Rahmen wieder aus. Eine Kennung zwischen 1 und rund 16 Millionen trennt die Netze voneinander, in deinem Lab ist es `CC_VNI` aus deinen Parametern. Rahmen an alle, etwa die Anfragen von ARP, gehen an eine Multicast-Gruppe, die OpenNebula aus 239.0.0.0 und der Kennung bildet. Das Gateway auf dem Front-end tritt derselben Gruppe bei und gehört damit zum selben Netz.

Der Kopf von VXLAN und das äussere Paket brauchen 50 Byte. Bleiben im Labnetz 1500 Byte pro Paket, dürfen die VMs nur 1450 Byte senden. Senden sie mehr, gehen grosse Pakete verloren, und Downloads über HTTPS brechen ab, während kleine Anfragen noch klappen. Das Netz gibt den VMs deshalb die MTU 1450 mit.

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

Das Netz `cc-net` und der Dienst `cc-gateway` aus Kapitel 0.4 gehören zusammen. Auf den Knoten legt OpenNebula beim Start der ersten VM die Bridge `ccbr` mit deiner Kennung und das VXLAN an. Auf dem Front-end hat `cc-gateway` die Bridge `cc-br` mit der Adresse des Gateways und dasselbe VXLAN schon eingerichtet. Pakete einer VM ins Internet gehen so über das VXLAN zum Front-end, das sie mit NAT ins Labnetz und weiter ins Internet schickt.

::::exercise[Lab]
Lege das Netz `cc-net` mit dem Skript an und vergleiche `onevnet show cc-net` mit den Werten in `/etc/cc-lab.env`. Welche drei Werte müssen übereinstimmen, damit das Gateway funktioniert?

:::solution
Die Kennung `VLAN_ID` muss `CC_VNI` entsprechen, das Gateway `GATEWAY` muss `CC_GUEST_GATEWAY` sein, und die Adressen des Bereichs müssen in `CC_GUEST_NET` liegen. Nur dann gehören Front-end und VMs zum selben VXLAN, und die NAT-Regel auf dem Front-end erfasst den Verkehr der VMs.
:::
::::

::::exercise[Netztreiber]
Die Gemeinde Hinterbüel betreibt ein eigenes kleines Rechenzentrum mit einem Switch, der VLANs kann, und denkt über eine eigene Cloud nach. Welchen Netztreiber würdest du ihr empfehlen, und warum?

:::solution
`802.1Q` passt, weil der Switch VLANs bereitstellt. Jedes Netz bekommt ein eigenes VLAN, ohne den zusätzlichen Kopf von VXLAN und ohne Multicast im Netz. VXLAN wäre auch möglich, lohnt sich aber vor allem, wenn das Netz darunter nichts von den VMs wissen soll oder kann.
:::
::::
