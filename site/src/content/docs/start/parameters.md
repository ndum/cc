---
title: Persönliche Parameter
description: Dein persönlicher Code, der Generator für deine Werte, was jeder Wert bedeutet und wo er im Kurs vorkommt, und die Datei /etc/cc-lab.env auf allen drei VMs.
sidebar:
  order: 3
---

:::assignment
«Bei uns soll jede Installation eindeutig sein», schreibt Simone Wyss. «Wenn wir später einen zweiten Standort bauen, dürfen sich Namen und Netze nicht in die Quere kommen. Kannst du dein Lab so benennen, dass man es auf den ersten Blick erkennt?»
:::

:::goals
Nach diesem Kapitel kannst du

- erklären, wozu die persönlichen Parameter dienen,
- deine Parameter mit dem Generator erzeugen,
- jeden Wert in `/etc/cc-lab.env` erklären und sagen, wo er im Kurs vorkommt,
- die Datei auf allen drei VMs ablegen und prüfen.
:::

## Zweck der Parameter

Jedes Lab im Kurs ist ein wenig anders. Aus einem persönlichen Code entstehen die Namen und Adressen deiner VMs, das interne Netz deiner Cloud und die Kennung ihres VXLAN-Netzes. Diese Werte begleiten dich durch den ganzen Kurs. Die Skripte lesen sie, die Kapitel verwenden sie in den Befehlen, und in jedem Meilenstein sind sie sichtbar. Deine Dozentin oder dein Dozent kann sie jederzeit aus deinem Code nachrechnen. Eine Lösung, die aus einem anderen Lab kopiert wurde, fällt dadurch auf.

Den Code nennt dir deine Dozentin oder dein Dozent, meist ist es dein Kürzel. Er beginnt mit einem Buchstaben und besteht aus 2 bis 16 Kleinbuchstaben oder Ziffern. Behalte für den ganzen Kurs denselben Code.

## Der Generator

Gib deinen Code und den Namen der Netzwerkschnittstelle deiner VMs ein. Die Rechnung läuft nur in deinem Browser, nichts verlässt diese Seite. Beim nächsten Besuch stehen deine Eingaben wieder da.

<cc-params></cc-params>

Das Ergebnis zeigt die Adressen deiner drei VMs, für jede VM eine Datei für netplan und den Inhalt der Datei `/etc/cc-lab.env`. Darunter stehen deine persönlichen Werte für die vier Meilensteine. Bis zum jeweiligen Meilenstein arbeitest du mit den Werten der Kapitel, erst der Meilenstein verlangt deine eigenen.

## Die Werte

| Wert | Bedeutung | Wo er vorkommt |
|---|---|---|
| `CC_CODE` | dein persönlicher Code | in jedem Bericht der Checks |
| `CC_LANG` | Sprache der Berichte, `de` oder `en` | Check-Skripte |
| `CC_FE_HOST`, `CC_NODE1_HOST`, `CC_NODE2_HOST` | Namen der drei VMs, aus dem Code gebildet | Hostnamen, `/etc/hosts`, Inventar von Ansible |
| `CC_FE_IP`, `CC_NODE1_IP`, `CC_NODE2_IP` | Adressen der drei VMs im Labnetz, aus dem Code gebildet | netplan, `/etc/hosts`, Inventar, Weboberfläche |
| `CC_GUEST_NET` | internes Netz für die VMs deiner Cloud | Gateway auf dem Front-end, Netz in OpenNebula ab Kapitel 2.3 |
| `CC_GUEST_GATEWAY` | Adresse des Front-ends im internen Netz | Gateway, Netz in OpenNebula |
| `CC_GUEST_FIRST`, `CC_GUEST_SIZE` | erste Adresse und Anzahl Adressen für die VMs der Cloud | Adressbereich des Netzes in OpenNebula |
| `CC_VNI`, `CC_VXLAN_GROUP` | Kennung und Multicast-Gruppe deines VXLAN-Netzes | Gateway auf dem Front-end, Netz in OpenNebula |
| `CC_K3S_SERVER_IP`, `CC_K3S_AGENT_IP` | feste Adressen der beiden VMs für Kubernetes | Teil 4 |

Das interne Netz liegt immer im Bereich 172.16.0.0/12 und die VXLAN-Kennung zwischen 1000 und 9999. Die Adressen der drei VMs liegen nebeneinander zwischen 192.168.210.20 und 192.168.210.199. Weil jede Umgebung auf smartlearn ihr eigenes Labnetz hat, dürfen zwei Personen dieselben Adressen haben.

Der Adressbereich für die VMs reicht von `.10` bis `.209` und enthält damit auch die festen Adressen `.110` und `.111` für Kubernetes. OpenNebula vergibt einer VM ohne Wunschadresse die erste freie Adresse ab `.10`, die VMs der Teile 2 und 3 bleiben also weit darunter. OpenTofu verlangt für die beiden VMs von Kubernetes ausdrücklich `.110` und `.111`. Wäre eine davon schon vergeben, bräche `tofu apply` mit einer Meldung ab.

## Die Adressen eintragen

Ohne Adresse erreichst du eine VM noch nicht per SSH. Du trägst die Adressen deshalb an der Konsole von smartlearn ein, auf jeder VM ihre eigene. Ubuntu verwaltet das Netz mit netplan, das seine Einstellungen aus YAML-Dateien in `/etc/netplan/` liest.

1. Prüfe mit `ip -br link` den Namen der Netzwerkschnittstelle. Steht im Generator ein anderer Name, korrigierst du ihn dort.
2. Lege die Datei an. Das minimale Ubuntu hat noch keinen Editor, deshalb schreibst du sie mit `tee`. Füge nach der ersten Zeile den Inhalt aus dem Generator für diese VM ein und schliesse mit einer Zeile `EOF`.
3. Schütze die Datei und übernimm die Einstellungen mit `netplan try`. Bestätige mit Enter. Bleibt die Bestätigung aus, stellt netplan nach zwei Minuten die alten Einstellungen wieder her.
4. Prüfe die Adresse, die Route über das Gateway und eine Verbindung ins Internet. Das minimale Ubuntu enthält kein `ping`, `curl` ist dabei.

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

Die Datei beginnt mit `60`, damit sie nach einer allfälligen Datei `50-cloud-init.yaml` gelesen wird und deren Einstellungen für dieselbe Schnittstelle überschreibt. YAML verlangt Einrückungen mit Leerzeichen, ein Tabulator führt zu einem Fehler.

| Symptom | Ursache | Was hilft |
|---|---|---|
| `netplan try` meldet einen Fehler in der Datei | Einrückung mit Tabulator oder falsch eingerückte Zeile | Datei mit `cat -A` ansehen, Tabulatoren erscheinen als `^I` |
| `ip -br addr` zeigt zwei Adressen | DHCP aus `50-cloud-init.yaml` für eine andere Schnittstelle | Name der Schnittstelle im Generator prüfen |
| `ip route` zeigt keine Zeile `default via 192.168.210.1` | Route fehlt in der Datei oder falsche Schnittstelle | Datei und `ip -br addr` mit dem Generator vergleichen |
| `curl` meldet «Could not resolve host» | DNS fehlt | `resolvectl status` zeigt den DNS, er muss 192.168.210.1 sein |
| `curl` wartet und bricht ab | kein Weg ins Internet | Adresse und Gateway prüfen, sonst die Dozentin oder den Dozenten fragen |

## Die Datei auf den VMs

Lege die Datei `/etc/cc-lab.env` auf allen drei VMs mit demselben Inhalt an. Jetzt geht das schon per SSH. Du schreibst die Datei wieder mit `tee`, fügst die Ausgabe des Generators ein und schliesst mit `EOF`. Einen Editor, nano, installiert erst das Vorbereitungsskript in Kapitel 0.4.

```bash
sudo tee /etc/cc-lab.env <<'EOF'
<Inhalt aus dem Generator>
EOF
```

Danach zeigt `cat /etc/cc-lab.env` auf jeder VM dieselben Zeilen. Stimmt später ein Wert nicht, etwa weil du eine Adresse falsch eingegeben hast, korrigierst du die Datei auf allen drei VMs und startest das Vorbereitungsskript aus [Kapitel 0.4](../prepare/) noch einmal.

:::note
Die Dokumentation jedes Meilensteins beginnt mit dem Inhalt von `/etc/cc-lab.env`, und jeder Screencast der Zusatzaufträge beginnt mit `cat /etc/cc-lab.env`. Deine Dozentin oder dein Dozent sieht daran, dass Screenshots und Vorführung aus deinem Lab stammen.
:::

::::exercise[Lab]
Erzeuge deine Parameter, trage auf allen drei VMs ihre Adresse ein, lege `/etc/cc-lab.env` an und erkläre einer Kollegin oder einem Kollegen drei der Werte in eigenen Worten.

:::solution
Die Datei hat 16 Zeilen und ist auf allen drei VMs gleich. Die Hostnamen beginnen mit deinem Code, das interne Netz liegt in 172.16.0.0/12 und endet auf `.0/24`, die VXLAN-Kennung liegt zwischen 1000 und 9999.
:::
::::
