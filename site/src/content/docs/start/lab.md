---
title: Das Lab
description: Die drei Server und der Client deines Labs auf smartlearn, ihre Rollen und Netze, was die Knoten mitbringen müssen und wie du Ubuntu 26.04 auf eigenen VMs einrichtest.
sidebar:
  order: 2
---

:::assignment
Simone Wyss schickt dir die Liste der Hardware. «Drei Server, einer für die Verwaltung und zwei für die Arbeit. Bitte bereite sie so vor, dass wir nächste Woche die Cloud darauf installieren können.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Die VMs des Labs und ihre Rollen beschreiben
- Erklären, wozu du auf smartlearn den Client brauchst
- Die beiden Netze des Labs unterscheiden
- Prüfen, ob eine VM verschachtelte Virtualisierung bietet
- Ubuntu Server 26.04 auf einem eigenen Hypervisor so einrichten, wie es der Kurs erwartet
:::

## Die VMs des Labs

Dein Lab besteht aus drei Servern und einem Client. Das Front-end verwaltet später die Cloud, auf den beiden Knoten laufen die VMs deiner Mitglieder. Am Client arbeitest du selbst.

| VM | Rolle | vCPU | RAM | Disk |
|---|---|---:|---:|---:|
| Front-end | Verwaltung, Weboberfläche, Gateway | 4 | 16 GB | 100 GB |
| Knoten 1 | Führt VMs aus | 4 | mindestens 8 GB | 50 GB |
| Knoten 2 | Führt VMs aus | 4 | mindestens 8 GB | 50 GB |
| Client | Kali Linux mit Browser und Terminal | 2 | 8 GB | |

![Das Lab mit drei Servern, dem Client und zwei Netzen. Front-end, zwei Knoten und der Client hängen im Labnetz. Vom Client aus erreichst du die Server per SSH und ihre Weboberflächen im Browser. Auf jedem Knoten laufen VMs der Cloud. Diese VMs und das Front-end teilen ein internes VXLAN-Netz. Das Front-end ist dessen Gateway und leitet den Verkehr mit NAT ins Internet.](../../../assets/figures/de/p0c2-lab.svg)

## Der Client

Auf smartlearn arbeitest du immer am Client. Er ist eine VM mit Kali Linux und Desktop und liegt im selben Labnetz wie die drei Server, mit der festen Adresse 192.168.210.10. Im Browser des Clients öffnest du diesen Kurs, den Generator und später alle Weboberflächen. In seinem Terminal meldest du dich per SSH an den Servern an.

Am Client kannst du Befehle aus dem Kurs kopieren und im Terminal einfügen. An den Konsolen der Server auf smartlearn geht das nicht. Die Konsole eines Servers brauchst du deshalb nur am Anfang, bis er eine Adresse hat und SSH funktioniert.

Den Client richtet deine Dozentin oder dein Dozent in der Vorlage ein. Zeigt `ip -br addr` im Terminal des Clients keine Adresse in 192.168.210.0/24, setzt du sie mit `nmcli` selbst. Den Namen der Verbindung zeigt die erste Zeile, bei Kali heisst sie meist «Wired connection 1».

```bash
nmcli connection show
sudo nmcli connection modify "Wired connection 1" ipv4.method manual ipv4.addresses 192.168.210.10/24 ipv4.gateway 192.168.210.1 ipv4.dns 192.168.210.1
sudo nmcli connection up "Wired connection 1"
```

Mit eigenem Hypervisor brauchst du keinen Client. Dein PC übernimmt seine Rolle, du meldest dich direkt von ihm aus per SSH an den Servern an und öffnest die Weboberflächen in seinem Browser. Wo der Kurs vom Client spricht, ist dann dein PC gemeint.

## Zwei Netze

Alle VMs liegen im Labnetz 192.168.210.0/24. Die drei Server haben dort feste Adressen, die aus deinem persönlichen Code entstehen. Über dieses Netz erreichst du die Server vom Client aus. Auch Front-end und Knoten sprechen darüber miteinander.

Die VMs deiner Cloud bekommen ein zweites, internes Netz, das nur deine drei Server kennen. Es ist ein VXLAN (Virtual Extensible LAN). Ein VXLAN packt die Ethernet-Rahmen der VMs in UDP-Pakete und schickt sie über das Labnetz von Server zu Server. Der Hypervisor darunter sieht nur diese UDP-Pakete zwischen den Servern. Deshalb funktioniert das interne Netz auch dort, wo er keine fremden MAC-Adressen zulässt. Kapitel 2.3 erklärt den Aufbau genauer. Das Front-end ist das Gateway des internen Netzes und verbindet es über NAT mit dem Internet.

## smartlearn

Deine Dozentin oder dein Dozent stellt dir auf smartlearn eine eigene Umgebung bereit, mit den drei Servern, dem Client und verschachtelter Virtualisierung. Auf den Servern ist Ubuntu schon installiert. Die Umgebung hat ein eigenes Labnetz 192.168.210.0/24 mit Gateway und DNS auf 192.168.210.1 und Zugang zum Internet. Kein anderes Lab liegt in diesem Netz. Die Adressen der Server trägst du in [Kapitel 0.3](../parameters/#die-adressen-eintragen) selbst ein.

Alle Anleitungen des Kurses gehen von smartlearn aus. Wer die VMs lieber auf einem eigenen Hypervisor betreibt, findet die Hinweise dazu in der Ergänzung [Eigener Hypervisor](../../extras/own-hypervisor/). Abschnitte, die nur dafür gelten, stehen in einem geschlossenen Kasten «Eigener Hypervisor». Auf smartlearn lässt du ihn zu und liest danach weiter.

## Verschachtelte Virtualisierung

Auf den Knoten laufen später selbst wieder VMs. Die Knoten brauchen deshalb verschachtelte Virtualisierung (Nested Virtualization). Die VM muss die Virtualisierungsfunktionen der CPU an ihr eigenes Betriebssystem weitergeben. Auf einem Knoten prüfst du das mit dem folgenden Befehl, die Zahl muss grösser als null sein.

```bash
grep -cE 'vmx|svm' /proc/cpuinfo
```

## Ubuntu einrichten

Auf allen drei Servern läuft Ubuntu Server 26.04 LTS.

:::selfhost
Installierst du Ubuntu selbst, wählst du bei der Installation diese Einstellungen:

1. Die Variante «Ubuntu Server (minimized)»
2. Die feste IPv4-Adresse aus deinen persönlichen Parametern in Kapitel 0.3, mit Gateway 192.168.210.1 und einem DNS, den dein Hypervisor anbietet
3. Derselbe Benutzername auf allen drei VMs, zum Beispiel `cc`
4. Das Häkchen bei «Install OpenSSH server»
5. Keine zusätzlichen Snaps

Lege danach von jeder VM einen Snapshot an. Mit ihm kommst du jederzeit zu einer frischen Installation zurück.
:::

::::exercise[Lab]
Öffne am Client diesen Kurs im Browser. Melde dich danach an der Konsole von smartlearn an den drei Servern an und prüfe auf beiden Knoten die verschachtelte Virtualisierung. Notiere dir den Namen der Netzwerkschnittstelle, den `ip -br link` zeigt, du brauchst ihn im nächsten Kapitel.

:::solution
`grep -cE 'vmx|svm' /proc/cpuinfo` gibt auf beiden Knoten eine Zahl grösser als null aus, bei vier vCPUs meist 4 oder 8. `ip -br link` zeigt neben `lo` eine weitere Schnittstelle. Ihr Name hängt vom Hypervisor ab, auf den drei Servern einer Umgebung ist er gleich.
:::
::::
