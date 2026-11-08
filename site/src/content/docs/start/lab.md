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

## smartlearn

Deine Dozentin oder dein Dozent stellt dir auf smartlearn eine eigene Umgebung bereit, mit den drei Servern, dem Client und verschachtelter Virtualisierung. Auf den Servern ist Ubuntu schon installiert, mit dem Benutzer `vmadmin`. Sein Passwort nennt dir deine Dozentin oder dein Dozent. Die Umgebung hat ein eigenes Labnetz 192.168.210.0/24 mit Gateway und DNS auf 192.168.210.1 und Zugang zum Internet. Kein anderes Lab liegt in diesem Netz. Die Adressen der Server trägst du in [Kapitel 0.3](../parameters/#die-adressen-eintragen) selbst ein. Wird deine Umgebung ausgeschaltet oder starten die Server neu, laufen danach die Server wieder, die VMs in OpenNebula aber nicht. Wie du sie zurückholst, steht in der Labreferenz unter [Nach einer Pause](../../lab-reference/#nach-einer-pause).

Alle Anleitungen des Kurses gehen von smartlearn aus. Wer die VMs lieber auf einem eigenen Hypervisor betreibt, findet die Hinweise dazu in der Ergänzung [Eigener Hypervisor](../../extras/own-hypervisor/). Abschnitte, die nur dafür gelten, stehen in einem geschlossenen Kasten «Eigener Hypervisor». Auf smartlearn lässt du ihn zu und liest danach weiter.

## Der Client

Auf smartlearn arbeitest du immer am Client. Er ist eine VM mit Kali Linux und Desktop und liegt im selben Labnetz wie die drei Server, mit der festen Adresse 192.168.210.10. Du meldest dich an ihm als `vmadmin` an, mit dem Passwort, das dir deine Dozentin oder dein Dozent nennt. Im Browser des Clients öffnest du diesen Kurs, den Generator und später alle Weboberflächen. In seinem Terminal meldest du dich per SSH an den Servern an.

Am Client kannst du Befehle aus dem Kurs kopieren und im Terminal einfügen. Im Terminal fügt Ctrl+Shift+V ein und Ctrl+Shift+C kopiert. Ctrl+V allein fügt dort nichts ein und Ctrl+C bricht den laufenden Befehl ab. An den Konsolen der Server auf smartlearn geht das Einfügen nicht. Die Vorlage von smartlearn gibt jedem Server aber schon eine Standardadresse, unter der du ihn vom Client aus per SSH erreichst. Die Konsole eines Servers brauchst du deshalb nur, wenn er per SSH nicht mehr antwortet.

Den Client richtet deine Dozentin oder dein Dozent in der Vorlage ein. Zeigt `ip -br addr` im Terminal des Clients keine Adresse in 192.168.210.0/24, setzt du sie mit `nmcli` selbst. Den Namen der Verbindung zeigt der erste Befehl, bei Kali heisst sie meist «Wired connection 1». Fragt `sudo` nach einem Passwort, ist es das Passwort, mit dem du dich am Client anmeldest. Die Befehle von `nmcli` erklärt das [Referenzhandbuch von NetworkManager](https://networkmanager.dev/docs/api/latest/nmcli.html).

```bash
nmcli connection show
sudo nmcli connection modify "Wired connection 1" ipv4.method manual ipv4.addresses 192.168.210.10/24 ipv4.gateway 192.168.210.1 ipv4.dns 192.168.210.1
sudo nmcli connection up "Wired connection 1"
```

Mit eigenem Hypervisor brauchst du keinen Client. Dein PC übernimmt seine Rolle, du meldest dich direkt von ihm aus per SSH an den Servern an und öffnest die Weboberflächen in seinem Browser. Wo der Kurs vom Client spricht, ist dann dein PC gemeint.

## Zwei Netze

Alle VMs liegen im Labnetz 192.168.210.0/24. Die drei Server haben dort feste Adressen, die aus deinem persönlichen Code entstehen. Über dieses Netz erreichst du die Server vom Client aus. Auch Front-end und Knoten sprechen darüber miteinander.

Die VMs deiner Cloud bekommen ein zweites, internes Netz, das nur deine drei Server kennen. Es ist ein VXLAN (Virtual Extensible LAN). Ein VXLAN packt die Ethernet-Rahmen der VMs in UDP-Pakete und schickt sie über das Labnetz von Server zu Server. Der Hypervisor darunter sieht nur diese UDP-Pakete zwischen den Servern. Deshalb funktioniert das interne Netz auch dort, wo er keine fremden MAC-Adressen zulässt. Kapitel 2.3 erklärt den Aufbau genauer. Das Front-end ist das Gateway des internen Netzes und verbindet es über NAT mit dem Internet.

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
2. Die feste IPv4-Adresse aus deinen persönlichen Parametern in Kapitel 0.3, mit dem Gateway deines Hypervisors und einem DNS, der in deinem Netz antwortet. Das Gateway ist meist 192.168.210.1, unter VMware 192.168.210.2. Unter Hyper-V nimmst du 9.9.9.9, wie es `new-lab.ps1` am Ende ausgibt, denn auf .1 antwortet dort kein DNS
3. Derselbe Benutzername auf allen drei VMs, am besten `vmadmin` wie auf smartlearn, damit der SSH-Block von Kapitel 0.4 ohne Änderung passt
4. Das Häkchen bei «Install OpenSSH server»
5. Keine zusätzlichen Snaps

Die einzelnen Bildschirme des Installationsprogramms zeigt die [Anleitung zur Installation](https://canonical-subiquity.readthedocs-hosted.com/en/latest/tutorial/screen-by-screen.html) von Ubuntu.

Nach der Installation nimmst du das ISO aus dem DVD-Laufwerk jeder VM. Unter Hyper-V setzt `new-lab.ps1` das DVD-Laufwerk an die erste Stelle der Startreihenfolge. Bleibt das ISO darin, startet die VM wieder das Installationsprogramm. In der PowerShell als Administrator leert `Set-VMDvdDrive -VMName mmuster-fe -Path $null` das Laufwerk des Front-ends, für die Knoten setzt du ihre Namen ein. Den Befehl beschreibt die [Dokumentation von Microsoft](https://learn.microsoft.com/en-us/powershell/module/hyper-v/set-vmdvddrive).

Lege danach von jeder VM einen Snapshot an. Mit ihm kommst du jederzeit zu einer frischen Installation zurück.
:::

::::exercise[Lab]
Öffne am Client diesen Kurs im Browser unter `https://cc.ndum.ch/`. Melde dich danach im Terminal des Clients per SSH an den beiden Knoten an, an ihren Standardadressen 192.168.210.138 und 192.168.210.139 aus [Kapitel 0.3](../parameters/#die-adressen-im-lab), etwa mit `ssh vmadmin@192.168.210.138`. Beim ersten Mal bestätigst du den Schlüssel des Knotens mit `yes`, danach will `ssh` das Passwort von `vmadmin`. Prüfe dort die verschachtelte Virtualisierung.

:::solution
`grep -cE 'vmx|svm' /proc/cpuinfo` gibt auf beiden Knoten eine Zahl grösser als null aus, bei vier vCPUs meist 4 oder 8.
:::
::::
