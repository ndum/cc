---
title: Persönliche Parameter
description: Dein persönlicher Code, der Name der Netzwerkschnittstelle, der Generator für deine Werte, die Adressen der drei Server, die Datei /etc/cc-lab.env und die Bedeutung jedes Werts.
sidebar:
  order: 3
---

:::assignment
«Bei uns soll jede Installation eindeutig sein», schreibt Simone Wyss. «Wenn wir später einen zweiten Standort bauen, dürfen sich Namen und Netze nicht in die Quere kommen. Kannst du dein Lab so benennen, dass man es auf den ersten Blick erkennt?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Erklären, wozu die persönlichen Parameter dienen
- Den Namen der Netzwerkschnittstelle eines Servers herausfinden
- Deine Parameter mit dem Generator erzeugen
- Den drei Servern ihre Adressen geben und dich vom Client aus per SSH anmelden
- Die Datei `/etc/cc-lab.env` auf allen drei Servern ablegen
- Jeden Wert in `/etc/cc-lab.env` erklären und sagen, wo er im Kurs vorkommt
:::

## Zweck der Parameter

Jedes Lab im Kurs ist ein wenig anders. Aus einem persönlichen Code entstehen die Namen und Adressen deiner Server, das interne Netz deiner Cloud und die Kennung ihres VXLAN. Die Skripte des Kurses lesen diese Werte und die Befehle in den Kapiteln verwenden sie. Auch in den Meilensteinen sind sie sichtbar. Deine Dozentin oder dein Dozent kann sie jederzeit aus deinem Code nachrechnen, eine Lösung aus einem anderen Lab fällt deshalb auf.

Den Code nennt dir deine Dozentin oder dein Dozent, meist ist es dein Kürzel. Er beginnt mit einem Buchstaben und besteht aus 2 bis 16 Kleinbuchstaben oder Ziffern. Behalte für den ganzen Kurs denselben Code.

## Der Ablauf

Bis deine drei Server ihre eigenen Adressen haben und ihre Parameter kennen, gehst du in fünf Schritten vor. Den ersten machst du einmal, die übrigen vier für jeden Server. Auf smartlearn brauchst du dafür keine Konsole, denn die Vorlage gibt jedem Server schon eine Standardadresse, unter der du ihn vom Client aus per SSH erreichst.

1. Deinen Code in den Generator eintragen
2. Dich vom Client aus an der Standardadresse des Servers anmelden und die Netzwerkschnittstelle prüfen
3. Die Adresse in `/etc/netplan/00-eth0.yaml` auf die Adresse aus dem Generator ändern
4. Dich an der neuen Adresse wieder anmelden
5. Die Datei `/etc/cc-lab.env` anlegen

Die nächsten zwei Abschnitte erklären, was dabei auf den Servern geschieht. Danach folgen der Generator und die Arbeit mit seinen Blöcken. Mit einem eigenen Hypervisor weichen die Schritte 2 bis 4 des Ablaufs ab, der Kasten «Eigener Hypervisor» am Ende von [Die Adressen eintragen](#die-adressen-eintragen) beschreibt sie.

## Die Netzwerkschnittstelle

Jeder Server hängt über eine Netzwerkschnittstelle im Labnetz. Ihren Namen vergibt Ubuntu nach der virtuellen Netzwerkkarte, die der Hypervisor der VM gibt. Du prüfst ihn auf jedem Server, sobald du angemeldet bist.

```bash
ip -br link
```

Die Ausgabe hat eine Zeile pro Schnittstelle. `lo` ist die Schnittstelle, über die der Server mit sich selbst spricht. Die zweite Zeile nennt die gesuchte Schnittstelle, ihr Name steht ganz vorne. Auf smartlearn heisst sie auf allen drei Servern `eth0`.

## Adressen mit netplan

Die Vorlage von smartlearn startet die drei Server mit festen Standardadressen. Sie sind in jeder Umgebung gleich, deshalb bekommt jeder Server zuerst seine eigene Adresse aus dem Generator.

| Server | Standardadresse |
|---|---|
| Front-end | 192.168.210.137 |
| Knoten 1 | 192.168.210.138 |
| Knoten 2 | 192.168.210.139 |

Ubuntu verwaltet das Netz mit netplan, das seine Einstellungen aus YAML-Dateien in `/etc/netplan/` liest. Auf smartlearn steht die Adresse eines Servers mit Route und DNS in `00-eth0.yaml`, benannt nach seiner Schnittstelle. Wie eine solche Datei eine feste Adresse festlegt, zeigt die [Anleitung zu festen Adressen](https://netplan.readthedocs.io/en/1.2/using-static-ip-addresses/) von netplan 1.2, der Version in Ubuntu 26.04. Weil das minimale Ubuntu noch keinen Editor hat, ändert ein Block des Generators die Adresse in dieser Datei mit `sed` und zeigt sie mit `grep`. `netplan apply` übernimmt sie sofort.

Ab diesem Moment antwortet der Server nur noch unter der neuen Adresse. Eine SSH-Sitzung, die an der alten Adresse hängt, bleibt deshalb stehen. Du beendest sie und meldest dich an der neuen Adresse wieder an. Die Datei gilt auch nach einem Neustart, die Adresse bleibt also.

:::caution[Keine zweite Datei für netplan]
Auf smartlearn änderst du nur die Adresse in `/etc/netplan/00-eth0.yaml`. Leg dort keine weitere Datei in `/etc/netplan/` an, etwa `60-cc-lab.yaml`. Neben `00-eth0.yaml` mit ihrer festen Adresse hätte der Server sonst zwei Einstellungen für dieselbe Schnittstelle und sein Netz gerät durcheinander.
:::

## Der Generator

Öffne diese Seite im Browser des Clients. Dann kannst du die Ausgaben des Generators kopieren und im Terminal des Clients einfügen. Gib deinen Code ein. Den Namen der Netzwerkschnittstelle brauchst du nur mit einem eigenen Hypervisor, auf smartlearn lässt du das Feld leer. Die Rechnung läuft nur im Browser, nichts verlässt diese Seite. Beim nächsten Besuch stehen deine Eingaben wieder da.

Der Generator zeigt zuerst die Adressen deiner drei Server. Danach folgen für jeden Server vier Blöcke, die Anmeldung an der Standardadresse, die Änderung der Adresse, die Anmeldung an der neuen Adresse und die Datei `/etc/cc-lab.env`. Ganz unten stehen deine Werte für die Meilensteine.

<cc-params></cc-params>

## Die Adressen eintragen

Nimm dir die Server einzeln vor, zuerst das Front-end und danach die beiden Knoten. Für jeden Server gehst du seine vier Blöcke im Generator von oben nach unten durch.

1. Öffne am Client ein Terminal und melde dich mit dem ersten Block des Servers an seiner Standardadresse an. Beim ersten Mal fragt SSH, ob du dem Schlüssel des Servers vertraust. Nach `yes` will der Server das Passwort deines Benutzers.
2. Prüfe mit `ip -br link`, dass die Schnittstelle `eth0` heisst.
3. Füge den zweiten Block in die SSH-Sitzung ein und starte ihn mit Enter. `sudo` fragt nach deinem Passwort. Die Ausgabe von `grep` zeigt deine neue Adresse, daneben Gateway und DNS mit 192.168.210.1. Danach bleibt die Sitzung hängen. Beende sie mit Enter und danach den Zeichen `~` und `.` oder schliesse das Terminal. Sind deine Adressen genau die Standardadressen, läuft die Sitzung weiter und du meldest dich mit `exit` ab.
4. Melde dich mit dem dritten Block an der neuen Adresse an. Auch hier fragt SSH beim ersten Mal nach dem Schlüssel.
5. Prüfe die Adresse, die Route über das Gateway und die Verbindung ins Internet. Das minimale Ubuntu enthält kein `ping`, `curl` ist dabei.

```bash
ip -br addr
ip route
curl -sI https://ubuntu.com | head -1
```

Bleib danach in dieser Sitzung, mit dem vierten Block legst du im nächsten Abschnitt die Datei mit deinen Werten an.

| Symptom | Ursache | Was hilft |
|---|---|---|
| `ssh` an die Standardadresse meldet «Connection timed out» | Der Server läuft nicht oder hat eine andere Adresse | Auf smartlearn prüfen, ob die VM läuft, an ihrer Konsole `ip -br addr` ansehen |
| `grep` zeigt noch die Standardadresse | Block eines anderen Servers eingefügt oder die Adresse steht anders in der Datei. Gibt dir der Generator genau die Standardadresse, ist das richtig | Mit `cat /etc/netplan/00-eth0.yaml` die Datei ansehen und den Block des richtigen Servers einfügen |
| Die neue Adresse antwortet nicht | Die Datei hat einen Fehler oder die Adresse stimmt nicht | An der Konsole von smartlearn anmelden, `ip -br addr` und `/etc/netplan/00-eth0.yaml` prüfen |
| `ssh` meldet «REMOTE HOST IDENTIFICATION HAS CHANGED» | Der Server wurde neu aufgesetzt, der Client kennt noch den alten Schlüssel | Am Client `ssh-keygen -R <adresse>` ausführen und dich neu anmelden |
| `ip route` zeigt keine Zeile `default via 192.168.210.1` | Die Route fehlt in der Datei | Datei mit `cat` ansehen, deine Dozentin oder deinen Dozenten fragen |
| `curl` meldet «Could not resolve host» | Der DNS fehlt | `resolvectl status` zeigt den DNS, auf smartlearn muss er 192.168.210.1 sein |
| `curl` wartet und bricht ab | Kein Weg ins Internet | Adresse und Gateway prüfen, sonst deine Dozentin oder deinen Dozenten fragen |

:::selfhost
Auf einem eigenen Hypervisor hat ein Server keine Standardadresse und seine Datei für netplan heisst je nach Installation anders. Passe die Schritte deshalb an deine Installation an. Hast du die Adressen schon bei der Installation von Ubuntu eingetragen, prüfst du nur mit den drei Befehlen oben Adresse, Route und Internet.

Sonst liest du an der Konsole jedes Servers mit `ip -br link` den Namen der Schnittstelle ab und trägst ihn im Generator ein. Er zeigt dann unter «Eigener Hypervisor» für jeden Server zwei Befehle für die Konsole, die eine vorläufige Adresse bis zum nächsten Neustart setzen. Danach meldest du dich vom PC aus per SSH an dieser Adresse an und fügst den Block für netplan ein. Er schreibt die Datei `60-cc-lab.yaml`, die netplan nach einer allfälligen `50-cloud-init.yaml` liest, schützt sie mit `chmod 600` und übernimmt sie mit `netplan try`. `netplan try` wartet auf Enter und stellt ohne Bestätigung nach zwei Minuten die alten Einstellungen wieder her. Mit einem falschen Namen der Schnittstelle bekommt der Server keine Adresse.
:::

## Die Datei auf den Servern

Bleib in der SSH-Sitzung an der neuen Adresse. Der vierte Block des Servers legt die Datei `/etc/cc-lab.env` an, aus der die Skripte des Kurses deine Werte lesen. Er ist für alle drei Server gleich. Füge ihn ein und starte ihn mit Enter. `sudo` fragt in der neuen Sitzung nochmals nach deinem Passwort. Prüfe die Datei danach mit `cat /etc/cc-lab.env`. Melde dich danach mit `exit` ab und nimm dir den nächsten Server vor.

Stimmt später ein Wert nicht, etwa weil du eine Adresse falsch eingegeben hast, korrigierst du die Datei auf allen drei Servern. Starte danach das Vorbereitungsskript aus [Kapitel 0.4](../prepare/) noch einmal.

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

Das interne Netz liegt immer im Bereich 172.16.0.0/12, die VXLAN-Kennung zwischen 1000 und 9999. Die Adressen der drei Server liegen nebeneinander zwischen 192.168.210.20 und 192.168.210.199. Jede Umgebung auf smartlearn hat ihr eigenes Labnetz, zwei Personen dürfen also dieselben Adressen haben. Der Client hat in jeder Umgebung 192.168.210.10.

Im internen Netz reicht der Adressbereich für die VMs von `.10` bis `.209`. Er enthält damit auch die festen Adressen `.110` und `.111` für Kubernetes. OpenNebula gibt einer VM ohne Wunschadresse die erste freie Adresse ab `.10`, die VMs der Teile 2 und 3 bleiben also weit darunter. Für die beiden VMs von Kubernetes verlangt OpenTofu ausdrücklich `.110` und `.111`. Wäre eine davon schon vergeben, bräche `tofu apply` mit einer Meldung ab.

## Deine Werte für die Meilensteine

Die Tabelle am Ende des Generators nennt deine persönlichen Werte für die vier Meilensteine, etwa die Quota der Gemeinde in Meilenstein 1 oder die Uhrzeit des Backup-Jobs in Meilenstein 4. In den Kapiteln arbeitest du mit den Werten, die dort stehen. Erst der Meilenstein verlangt deine eigenen. Der Generator zeigt sie jedes Mal wieder an, wenn du deinen Code eingibst.

:::note
Eine Kopie von `/etc/cc-lab.env` liegt in deinem Abgabe-Repo, ein Screencast der Zusatzaufträge beginnt mit dem Befehl `cat /etc/cc-lab.env`. Deine Dozentin oder dein Dozent sieht daran, dass Screenshots und Vorführung aus deinem Lab stammen.
:::

::::exercise[Lab]
Erzeuge deine Parameter und gib allen drei Servern ihre Adresse. Lege `/etc/cc-lab.env` an und erkläre einer Kollegin oder einem Kollegen drei der Werte in eigenen Worten.

:::solution
Die Datei hat 16 Zeilen und ist auf allen drei Servern gleich. Die Hostnamen beginnen mit deinem Code, das interne Netz liegt in 172.16.0.0/12 und endet auf `.0/24`. Die VXLAN-Kennung liegt zwischen 1000 und 9999. `ssh cc@<adresse>` klappt vom Client aus an der neuen Adresse jedes Servers, auch nach einem Neustart, die Standardadressen antworten nicht mehr, ausser sie sind selbst deine Adressen.
:::
::::
