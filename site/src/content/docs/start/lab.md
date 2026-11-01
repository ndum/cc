---
title: Das Lab
description: Die drei VMs deines Labs auf smartlearn, ihre Rollen und Netze, was sie mitbringen müssen und wie du Ubuntu 26.04 auf ihnen einrichtest.
sidebar:
  order: 2
---

:::assignment
Simone Wyss schickt dir die Liste der Hardware. «Drei Server, einer für die Verwaltung und zwei für die Arbeit. Bitte bereite sie so vor, dass wir nächste Woche die Cloud darauf installieren können.»
:::

:::goals
Nach diesem Kapitel kannst du

- die drei VMs des Labs und ihre Rollen beschreiben,
- die beiden Netze des Labs unterscheiden,
- prüfen, ob eine VM verschachtelte Virtualisierung bietet,
- Ubuntu Server 26.04 so einrichten, wie es der Kurs erwartet.
:::

## Die drei VMs

Dein Lab besteht aus drei virtuellen Maschinen. Das Front-end verwaltet später die Cloud, die beiden Knoten führen die virtuellen Maschinen deiner Mitglieder aus.

| VM | Rolle | vCPU | RAM | Disk |
|---|---|---:|---:|---:|
| Front-end | Verwaltung, Weboberfläche, Gateway | 4 | 16 GB | 100 GB |
| Knoten 1 | führt VMs aus | 4 | mindestens 8 GB | 50 GB |
| Knoten 2 | führt VMs aus | 4 | mindestens 8 GB | 50 GB |

![Das Lab mit drei VMs und zwei Netzen. Das Front-end und zwei Knoten hängen im Labnetz mit festen Adressen. Auf jedem Knoten laufen VMs der Cloud. Diese VMs und das Front-end teilen ein internes VXLAN-Netz. Das Front-end ist dessen Gateway und leitet den Verkehr mit NAT ins Internet.](../../../assets/figures/de/p0c2-lab.svg)

## Zwei Netze

Alle drei VMs liegen im Labnetz 192.168.210.0/24 und haben dort feste IP-Adressen, die aus deinem persönlichen Code entstehen. Über dieses Netz erreichst du die VMs, und über dieses Netz sprechen Front-end und Knoten miteinander.

Die VMs deiner Cloud bekommen ein zweites, internes Netz, das nur deine drei VMs kennen. Es läuft als VXLAN über das Labnetz. Das Front-end ist das Gateway dieses Netzes und verbindet es über NAT mit dem Internet. So funktioniert das Lab auf jedem Hypervisor, auch wenn dieser in seinem Netz keine fremden MAC-Adressen zulässt.

## smartlearn

Deine Dozentin oder dein Dozent stellt dir auf smartlearn eine eigene Umgebung mit den drei VMs und verschachtelter Virtualisierung bereit. Die Umgebung hat ein eigenes Labnetz, 192.168.210.0/24, mit Gateway und DNS auf 192.168.210.1 und Zugang zum Internet. Kein anderes Lab liegt in diesem Netz. Die Adressen deiner VMs trägst du in [Kapitel 0.3](../parameters/#die-adressen-eintragen) selbst ein. Das ist der Standardweg des Kurses, und alle Anleitungen gehen davon aus. Wer die VMs lieber auf einem eigenen Hypervisor betreibt, findet die Hinweise dazu in der Ergänzung [Eigener Hypervisor](../../extras/own-hypervisor/).

## Verschachtelte Virtualisierung

Auf den Knoten laufen später selbst wieder VMs. Die Knoten brauchen deshalb verschachtelte Virtualisierung (Nested Virtualization), die VM muss also die Virtualisierungsfunktionen der CPU an ihr eigenes Betriebssystem weitergeben. Ob das klappt, prüfst du in der VM. Die Zahl muss grösser als null sein.

```bash
grep -cE 'vmx|svm' /proc/cpuinfo
```

## Ubuntu einrichten

Auf allen drei VMs läuft Ubuntu Server 26.04 LTS. Wenn du Ubuntu selbst installierst, gelten diese Einstellungen:

1. die Variante «Ubuntu Server (minimized)»
2. die feste IPv4-Adresse aus deinen persönlichen Parametern, siehe Kapitel 0.3
3. derselbe Benutzername auf allen drei VMs, zum Beispiel `cc`
4. das Häkchen bei «Install OpenSSH server»
5. keine zusätzlichen Snaps

Ansible führt in Kapitel 2.2 Befehle als Administrator aus, ohne nach einem Passwort zu fragen. Melde dich deshalb per SSH an jeder VM an und erlaube deinem Benutzer sudo ohne Passwort.

```bash
echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$USER
```

Wenn deine VMs Snapshots kennen, ist jetzt ein guter Moment für einen ersten Snapshot. Mit ihm kommst du jederzeit zu einer frischen Installation zurück.

::::exercise[Lab]
Melde dich an der Konsole von smartlearn an allen drei VMs an, prüfe auf beiden Knoten die verschachtelte Virtualisierung und richte sudo ohne Passwort ein. Notiere dir den Namen der Netzwerkschnittstelle, den `ip -br link` zeigt, du brauchst ihn im nächsten Kapitel.

:::solution
`grep -cE 'vmx|svm' /proc/cpuinfo` gibt auf beiden Knoten eine Zahl grösser als null aus, bei vier vCPUs meist 4 oder 8. `sudo -n true` läuft danach ohne Rückfrage durch. `ip -br link` zeigt neben `lo` eine Schnittstelle, meist `ens160` oder `eth0`.
:::
::::
