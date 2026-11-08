---
title: Persönliche Parameter
description: Dein persönlicher Code, der Generator für deine Werte, die Adressen der drei Server, die Datei /etc/cc-lab.env und die Bedeutung jedes Werts.
sidebar:
  order: 3
---

:::assignment
«Bei uns soll jede Installation eindeutig sein», schreibt Simone Wyss. «Wenn wir später einen zweiten Standort bauen, dürfen sich Namen und Netze nicht in die Quere kommen. Kannst du dein Lab so benennen, dass man es auf den ersten Blick erkennt?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Erklären, wozu die persönlichen Parameter dienen
- Mit dem Generator die Datei `/etc/cc-lab.env` auf allen drei Servern ablegen
- Den drei Servern ihre Adressen geben und dich vom Client aus per SSH anmelden
- Jeden Wert in `/etc/cc-lab.env` erklären und sagen, wo er im Kurs vorkommt
:::

## Zweck der Parameter

Jedes Lab im Kurs ist ein wenig anders. Aus einem persönlichen Code entstehen die Namen und Adressen deiner Server, das interne Netz deiner Cloud und die Kennung ihres VXLAN. Die Skripte des Kurses lesen diese Werte und die Befehle in den Kapiteln verwenden sie. Auch in den Meilensteinen sind sie sichtbar. Deine Dozentin oder dein Dozent kann sie jederzeit aus deinem Code nachrechnen, eine Lösung aus einem anderen Lab fällt deshalb auf.

Den Code nennt dir deine Dozentin oder dein Dozent, meist ist es dein Kürzel. Behalte für den ganzen Kurs denselben Code.

## Die Adressen im Lab

Die Vorlage von smartlearn startet die drei Server mit Standardadressen, das Front-end mit 192.168.210.137, Knoten 1 mit .138 und Knoten 2 mit .139. Unter diesen Adressen erreichst du sie vom Client aus per SSH. Danach bekommt jeder Server seine Adresse aus deinem Code, denn die Skripte und Checks des Kurses erwarten sie.

Ubuntu verwaltet das Netz mit netplan, das seine Einstellungen aus YAML-Dateien in `/etc/netplan/` liest. Auf smartlearn steht die Adresse eines Servers zusammen mit Gateway und DNS in `00-eth0.yaml`. Wie eine solche Datei eine feste Adresse festlegt, zeigt die [Anleitung zu festen Adressen](https://netplan.readthedocs.io/en/1.2/using-static-ip-addresses/) von netplan 1.2, der Version in Ubuntu 26.04. Der zweite Block des Generators ersetzt in dieser Datei nur die Adresse und `netplan apply` übernimmt sie sofort. Ab diesem Moment antwortet der Server nur noch unter der neuen Adresse, eine SSH-Sitzung an der alten bleibt deshalb hängen. Weil die Adresse in der Datei steht, gilt sie auch nach jedem Neustart.

## Der Generator

Öffne diese Seite im Browser des Clients, dann kannst du die Blöcke kopieren und im Terminal des Clients einfügen. Gib deinen Code ein. Die Rechnung läuft nur im Browser, nichts verlässt diese Seite. Beim nächsten Besuch steht dein Code wieder da.

<cc-params></cc-params>

## Die Adressen eintragen

Die beiden Blöcke des Generators sind für alle drei Server gleich. Nimm dir die Server der Reihe nach vor, zuerst das Front-end und danach die beiden Knoten.

1. Melde dich im Terminal des Clients an der Standardadresse des Servers an, für das Front-end mit `ssh cc@192.168.210.137`. Beim ersten Mal bestätigst du den Schlüssel des Servers mit `yes`, danach will er das Passwort des Benutzers `cc`, das dir deine Dozentin oder dein Dozent nennt.
2. Füge den ersten Block ein und starte ihn mit Enter. Er legt die Datei `/etc/cc-lab.env` an, aus der die Skripte des Kurses deine Werte lesen. `sudo` fragt dabei nach deinem Passwort.
3. Füge den zweiten Block ein und starte ihn mit Enter. Er trägt die neue Adresse in `00-eth0.yaml` ein und meldet dich ab. Zwei Sekunden später übernimmt der Server die neue Adresse.

`netplan apply` nimmt dem Server die alte Adresse, über die deine Sitzung läuft. Liefe der Befehl direkt in der Sitzung, bliebe sie hängen. Darum startet ihn `systemd-run` als eigenen Dienst, der zuerst zwei Sekunden wartet. In dieser Zeit meldet dich `exit` ab. Solche Dienste beschreibt die [Handbuchseite zu systemd-run](https://manpages.ubuntu.com/manpages/resolute/man1/systemd-run.1.html).

Sind alle drei Server umgestellt, meldest du dich zur Probe an der neuen Adresse des Front-ends aus der Tabelle an.

Gibt dir der Generator genau die Standardadressen, ändert der zweite Block die Adresse nicht. Du meldest dich an derselben Adresse wieder an. Stimmt später ein Wert nicht, legst du die Datei mit dem ersten Block auf allen drei Servern neu an und startest das Vorbereitungsskript aus [Kapitel 0.4](../prepare/) noch einmal.

| Symptom | Ursache | Was hilft |
|---|---|---|
| `ssh` an die Standardadresse bricht mit «No route to host» oder «Connection timed out» ab | Der Server läuft nicht oder hat schon seine neue Adresse | Auf smartlearn prüfen, ob die VM läuft, sonst die neue Adresse versuchen |
| Die neue Adresse antwortet nicht | Die Adresse in `00-eth0.yaml` stimmt nicht | An der Konsole des Servers auf smartlearn anmelden und `ip -br addr` und `cat /etc/netplan/00-eth0.yaml` prüfen |
| `ssh` meldet «REMOTE HOST IDENTIFICATION HAS CHANGED» | Der Server wurde neu aufgesetzt, der Client kennt noch den alten Schlüssel | Am Client `ssh-keygen -R <adresse>` ausführen und dich neu anmelden |

:::selfhost
Auf einem eigenen Hypervisor gibt es keine Standardadressen und keine Datei `00-eth0.yaml`, der zweite Block passt dort also nicht. Gib jedem Server die neue Adresse aus der Tabelle des Generators als feste Adresse mit der Maske /24, am einfachsten schon bei der Installation von Ubuntu wie im Kapitel [Eigener Hypervisor](../../extras/own-hypervisor/). Gateway und DNS kommen aus deinem Netz. Später geht es auch mit einer Datei in `/etc/netplan/` nach der Anleitung oben, den Namen der Netzwerkschnittstelle zeigt dir `ip -br link`. Melde dich danach an jedem Server an und füge nur den ersten Block ein.
:::

## Die Werte

| Wert | Bedeutung | Wo er vorkommt |
|---|---|---|
| `CC_CODE` | Dein persönlicher Code | In jedem Bericht der Checks |
| `CC_LANG` | Sprache der Berichte, `de` oder `en` | Check-Skripte |
| `CC_FE_HOST`, `CC_NODE1_HOST`, `CC_NODE2_HOST` | Namen der drei Server, aus dem Code gebildet | Hostnamen, `/etc/hosts`, Inventar von Ansible |
| `CC_FE_IP`, `CC_NODE1_IP`, `CC_NODE2_IP` | Adressen der drei Server im Labnetz, aus dem Code gebildet | netplan, `/etc/hosts`, Inventar, Weboberfläche |
| `CC_GUEST_NET` | Internes Netz für die VMs deiner Cloud | Gateway auf dem Front-end, Netz in OpenNebula ab Kapitel 2.3 |
| `CC_GUEST_GATEWAY` | Adresse des Front-ends im internen Netz | Gateway, Netz in OpenNebula |
| `CC_GUEST_FIRST`, `CC_GUEST_SIZE` | Erste Adresse und Anzahl Adressen für die VMs der Cloud | Adressbereich des Netzes in OpenNebula |
| `CC_VNI`, `CC_VXLAN_GROUP` | Kennung (VNI) und Multicast-Gruppe deines VXLAN | Gateway auf dem Front-end, Netz in OpenNebula |
| `CC_K3S_SERVER_IP`, `CC_K3S_AGENT_IP` | Feste Adressen der beiden VMs für Kubernetes im internen Netz | Teil 4 |

Das interne Netz liegt immer im Bereich 172.16.0.0/12, die VXLAN-Kennung zwischen 1000 und 9999. Die Adressen der drei Server liegen nebeneinander zwischen 192.168.210.20 und 192.168.210.199. Jede Umgebung auf smartlearn hat ihr eigenes Labnetz, zwei Personen dürfen also dieselben Adressen haben.

:::details[Adressbereich im internen Netz]
Im internen Netz reicht der Adressbereich für die VMs von `.10` bis `.209`. Er enthält damit auch die festen Adressen `.110` und `.111` für Kubernetes. OpenNebula gibt einer VM ohne Wunschadresse die erste freie Adresse ab `.10`, die VMs der Teile 2 und 3 bleiben also weit darunter. Für die beiden VMs von Kubernetes verlangt OpenTofu ausdrücklich `.110` und `.111`. Wäre eine davon schon vergeben, bräche `tofu apply` mit einer Meldung ab.
:::

## Deine Werte für die Meilensteine

Die Tabelle am Ende des Generators nennt deine persönlichen Werte für die vier Meilensteine, etwa die Quota der Gemeinde in Meilenstein 1 oder die Uhrzeit des Backup-Jobs in Meilenstein 4. In den Kapiteln arbeitest du mit den Werten, die dort stehen. Erst der Meilenstein verlangt deine eigenen. Der Generator zeigt sie jedes Mal wieder an, wenn du deinen Code eingibst.

:::note
Eine Kopie von `/etc/cc-lab.env` liegt in deinem Abgabe-Repo, ein Screencast der Zusatzaufträge beginnt mit dem Befehl `cat /etc/cc-lab.env`. Deine Dozentin oder dein Dozent sieht daran, dass Screenshots und Vorführung aus deinem Lab stammen.
:::

::::exercise[Lab]
Erzeuge deine Parameter, lege auf allen drei Servern `/etc/cc-lab.env` an und gib ihnen ihre neuen Adressen. Erkläre danach einer Kollegin oder einem Kollegen drei der Werte in eigenen Worten.

:::solution
Die Datei hat 16 Zeilen und ist auf allen drei Servern gleich. Die Hostnamen beginnen mit deinem Code, das interne Netz liegt in 172.16.0.0/12 und endet auf `.0/24`. Die VXLAN-Kennung liegt zwischen 1000 und 9999. `ssh cc@<adresse>` klappt vom Client aus an der neuen Adresse jedes Servers, auch nach einem Neustart.
:::
::::
