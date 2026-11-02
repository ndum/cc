---
title: Persönliche Parameter
description: Dein persönlicher Code, der Name der Netzwerkschnittstelle, der Generator für deine Werte, die Adressen der drei Server und die Datei /etc/cc-lab.env mit der Bedeutung jedes Werts.
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
- Jeden Wert in `/etc/cc-lab.env` erklären und sagen, wo er im Kurs vorkommt
- Die Datei auf allen drei Servern ablegen und prüfen
:::

## Zweck der Parameter

Jedes Lab im Kurs ist ein wenig anders. Aus einem persönlichen Code entstehen die Namen und Adressen deiner Server, das interne Netz deiner Cloud und die Kennung ihres VXLAN. Die Skripte des Kurses lesen diese Werte und die Befehle in den Kapiteln verwenden sie. Auch in den Meilensteinen sind sie sichtbar. Deine Dozentin oder dein Dozent kann sie jederzeit aus deinem Code nachrechnen, eine Lösung aus einem anderen Lab fällt deshalb auf.

Den Code nennt dir deine Dozentin oder dein Dozent, meist ist es dein Kürzel. Er beginnt mit einem Buchstaben und besteht aus 2 bis 16 Kleinbuchstaben oder Ziffern. Behalte für den ganzen Kurs denselben Code.

## Die Netzwerkschnittstelle

Der Generator schreibt für jeden Server die Befehle und die Datei, mit denen der Server seine Adresse bekommt. Darin steht der Name der Netzwerkschnittstelle, über die der Server im Labnetz hängt. Diesen Namen vergibt Ubuntu nach der virtuellen Netzwerkkarte, die der Hypervisor der VM gibt. Du liest ihn deshalb auf deinen eigenen Servern ab.

Melde dich an der Konsole von smartlearn an einem der Server an und gib diesen Befehl ein.

```bash
ip -br link
```

Die Ausgabe hat eine Zeile pro Schnittstelle. `lo` ist die Schnittstelle, über die der Server mit sich selbst spricht. Die zweite Zeile nennt die gesuchte Schnittstelle, ihr Name steht ganz vorne. Auf den drei Servern einer Umgebung heisst sie gleich.

Trag genau diesen Namen in den Generator ein. Namen aus Beispielen, etwa `ens160` oder `eth0`, passen nur, wenn deine Server die Schnittstelle zufällig auch so nennen. Mit einem falschen Namen bekommt der Server keine Adresse und du erreichst ihn nicht per SSH.

## Der Generator

Öffne diese Seite im Browser des Clients. Dann kannst du die Ausgaben des Generators kopieren und im Terminal des Clients einfügen. Gib deinen Code und den Namen der Netzwerkschnittstelle ein. Die Rechnung läuft nur im Browser, nichts verlässt diese Seite. Beim nächsten Besuch stehen deine Eingaben wieder da.

<cc-params></cc-params>

Das Ergebnis zeigt zuerst die Adressen deiner drei Server. Für jeden Server folgen zwei Befehle für seine Konsole und eine Datei für netplan, danach der Inhalt der Datei `/etc/cc-lab.env`. Zuletzt stehen in einer Tabelle deine persönlichen Werte für die vier Meilensteine. In den Kapiteln arbeitest du mit den Werten, die dort stehen. Erst der Meilenstein verlangt deine eigenen.

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

## Die Adressen eintragen

Ohne Adresse erreichst du einen Server nicht per SSH. An seiner Konsole auf smartlearn kannst du aber nichts einfügen. Deshalb gibst du jedem Server an der Konsole zuerst eine vorläufige Adresse. Dafür tippst du die zwei Befehle ab, die der Generator für diesen Server zeigt. Der erste schaltet die Schnittstelle ein, der zweite gibt ihr die Adresse.

```bash
sudo ip link set <schnittstelle> up
sudo ip addr add <adresse>/24 dev <schnittstelle>
```

Die vorläufige Adresse gilt bis zum nächsten Neustart. Ab jetzt arbeitest du am Client. Öffne dort ein Terminal und melde dich mit deinem Benutzer und der Adresse des Servers an. Beim ersten Mal fragt SSH, ob du dem Schlüssel des Servers vertraust. Nach `yes` will der Server das Passwort deines Benutzers.

```bash
ssh cc@<adresse>
```

Damit die Adresse auch einen Neustart übersteht, legst du sie in den Einstellungen des Netzes fest. Ubuntu verwaltet das Netz mit netplan, das seine Einstellungen aus YAML-Dateien in `/etc/netplan/` liest. Das minimale Ubuntu hat noch keinen Editor, deshalb schreibst du die Datei mit `tee`.

1. Kopiere aus dem Generator die Datei für diesen Server. Füge sie in der SSH-Sitzung nach der ersten Zeile des Befehls unten ein und schliesse mit einer Zeile `EOF`.
2. Schütze die Datei und übernimm die Einstellungen mit `netplan try`. Bestätige mit Enter. Bleibt die Bestätigung aus, etwa weil die SSH-Verbindung abbricht, stellt netplan nach zwei Minuten die alten Einstellungen wieder her.
3. Prüfe die Adresse, die Route über das Gateway und die Verbindung ins Internet. Das minimale Ubuntu enthält kein `ping`, `curl` ist dabei.

```bash
sudo tee /etc/netplan/60-cc-lab.yaml <<'EOF'
<Inhalt aus dem Generator>
EOF
sudo chmod 600 /etc/netplan/60-cc-lab.yaml
sudo netplan try
ip -br addr
ip route
curl -sI https://ubuntu.com | head -1
```

Wiederhole das für die beiden anderen Server. Die Datei beginnt mit `60`, damit netplan sie nach einer allfälligen Datei `50-cloud-init.yaml` liest. Für dieselbe Schnittstelle gelten dann ihre Einstellungen. YAML verlangt Einrückungen mit Leerzeichen, ein Tabulator führt zu einem Fehler.

:::selfhost
Hast du die Adressen schon bei der Installation von Ubuntu eingetragen, lässt du die beiden Befehle für die Konsole und die Datei für netplan weg. Prüfe nur mit den drei letzten Befehlen, ob Adresse, Route und Internet stimmen.
:::

| Symptom | Ursache | Was hilft |
|---|---|---|
| `ssh` wartet und meldet «Connection timed out» | Der Server hat keine Adresse oder die Schnittstelle stimmt nicht | An der Konsole `ip -br addr` prüfen, die beiden Befehle mit dem Namen aus `ip -br link` wiederholen |
| `netplan try` meldet einen Fehler in der Datei | Einrückung mit Tabulator oder falsch eingerückte Zeile | Datei mit `cat -A` ansehen, Tabulatoren erscheinen als `^I` |
| `ip -br addr` zeigt zwei Adressen | DHCP aus `50-cloud-init.yaml` für eine andere Schnittstelle | Name der Schnittstelle im Generator prüfen |
| `ip route` zeigt keine Zeile `default via 192.168.210.1` | Die Route fehlt in der Datei oder die Schnittstelle ist falsch | Datei und `ip -br addr` mit dem Generator vergleichen |
| `curl` meldet «Could not resolve host» | Der DNS fehlt | `resolvectl status` zeigt den DNS, auf smartlearn muss er 192.168.210.1 sein |
| `curl` wartet und bricht ab | Kein Weg ins Internet | Adresse und Gateway prüfen, sonst die Dozentin oder den Dozenten fragen |

## Die Datei auf den Servern

Lege die Datei `/etc/cc-lab.env` auf allen drei Servern mit demselben Inhalt an. Melde dich dazu vom Client aus per SSH an jedem Server an. Du schreibst die Datei wieder mit `tee`, fügst die Ausgabe des Generators ein und schliesst mit `EOF`. Einen Editor, nano, installiert erst das Vorbereitungsskript in Kapitel 0.4.

```bash
sudo tee /etc/cc-lab.env <<'EOF'
<Inhalt aus dem Generator>
EOF
```

Danach zeigt `cat /etc/cc-lab.env` auf jedem Server dieselben Zeilen. Stimmt später ein Wert nicht, etwa weil du eine Adresse falsch eingegeben hast, korrigierst du die Datei auf allen drei Servern. Starte danach das Vorbereitungsskript aus [Kapitel 0.4](../prepare/) noch einmal.

:::note
Die Dokumentation jedes Meilensteins beginnt mit dem Inhalt von `/etc/cc-lab.env`, ein Screencast der Zusatzaufträge mit dem Befehl `cat /etc/cc-lab.env`. Deine Dozentin oder dein Dozent sieht daran, dass Screenshots und Vorführung aus deinem Lab stammen.
:::

::::exercise[Lab]
Erzeuge deine Parameter und gib allen drei Servern ihre Adresse. Lege `/etc/cc-lab.env` an und erkläre einer Kollegin oder einem Kollegen drei der Werte in eigenen Worten.

:::solution
Die Datei hat 16 Zeilen und ist auf allen drei Servern gleich. Die Hostnamen beginnen mit deinem Code, das interne Netz liegt in 172.16.0.0/12 und endet auf `.0/24`. Die VXLAN-Kennung liegt zwischen 1000 und 9999. `ssh cc@<adresse>` klappt vom Client aus auf jedem Server, auch nach einem Neustart.
:::
::::
