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

Jedes Lab im Kurs ist ein wenig anders. Aus einem persönlichen Code entstehen die Namen deiner VMs, das interne Netz deiner Cloud und die Kennung ihres VXLAN-Netzes. Diese Werte begleiten dich durch den ganzen Kurs. Die Skripte lesen sie, die Kapitel verwenden sie in den Befehlen, und in jedem Meilenstein sind sie sichtbar. Deine Dozentin oder dein Dozent kann sie jederzeit aus deinem Code nachrechnen. Eine Lösung, die aus einem anderen Lab kopiert wurde, fällt dadurch auf.

Den Code nennt dir deine Dozentin oder dein Dozent, meist ist es dein Kürzel. Er beginnt mit einem Buchstaben und besteht aus 2 bis 16 Kleinbuchstaben oder Ziffern. Behalte für den ganzen Kurs denselben Code.

## Der Generator

Gib deinen Code und die Adressen deiner drei VMs ein. Die Rechnung läuft nur in deinem Browser, nichts verlässt diese Seite. Beim nächsten Besuch stehen deine Eingaben wieder da.

<cc-params></cc-params>

Das Ergebnis ist der Inhalt der Datei `/etc/cc-lab.env`.

## Die Werte

| Wert | Bedeutung | Wo er vorkommt |
|---|---|---|
| `CC_CODE` | dein persönlicher Code | in jedem Bericht der Checks |
| `CC_LANG` | Sprache der Berichte, `de` oder `en` | Check-Skripte |
| `CC_FE_HOST`, `CC_NODE1_HOST`, `CC_NODE2_HOST` | Namen der drei VMs, aus dem Code gebildet | Hostnamen, `/etc/hosts`, Inventar von Ansible |
| `CC_FE_IP`, `CC_NODE1_IP`, `CC_NODE2_IP` | Adressen der drei VMs im Labnetz | `/etc/hosts`, Inventar, Weboberfläche |
| `CC_GUEST_NET` | internes Netz für die VMs deiner Cloud | Gateway auf dem Front-end, Netz in OpenNebula ab Kapitel 2.3 |
| `CC_GUEST_GATEWAY` | Adresse des Front-ends im internen Netz | Gateway, Netz in OpenNebula |
| `CC_GUEST_FIRST`, `CC_GUEST_SIZE` | erste Adresse und Anzahl Adressen für die VMs der Cloud | Adressbereich des Netzes in OpenNebula |
| `CC_VNI`, `CC_VXLAN_GROUP` | Kennung und Multicast-Gruppe deines VXLAN-Netzes | Gateway auf dem Front-end, Netz in OpenNebula |
| `CC_K3S_SERVER_IP`, `CC_K3S_AGENT_IP` | feste Adressen der beiden VMs für Kubernetes | Teil 4 |

Das interne Netz liegt immer im Bereich 172.16.0.0/12 und die VXLAN-Kennung zwischen 1000 und 9999. So kommen sich zwei Labs nicht in die Quere, auch wenn sie im selben Netz von smartlearn liegen.

## Die Datei auf den VMs

Lege die Datei `/etc/cc-lab.env` auf allen drei VMs mit demselben Inhalt an. Am einfachsten öffnest du sie mit einem Editor und fügst die Ausgabe des Generators ein.

```bash
sudo nano /etc/cc-lab.env
```

Danach zeigt `cat /etc/cc-lab.env` auf jeder VM dieselben Zeilen. Stimmt später ein Wert nicht, etwa weil du eine Adresse falsch eingegeben hast, korrigierst du die Datei auf allen drei VMs und startest das Vorbereitungsskript aus [Kapitel 0.4](../prepare/) noch einmal.

:::note
Jeder Screencast eines Meilensteins beginnt mit `cat /etc/cc-lab.env`. Deine Dozentin oder dein Dozent sieht daran, dass die Vorführung aus deinem Lab stammt.
:::

::::exercise[Lab]
Erzeuge deine Parameter, lege `/etc/cc-lab.env` auf allen drei VMs an und erkläre einer Kollegin oder einem Kollegen drei der Werte in eigenen Worten.

:::solution
Die Datei hat 16 Zeilen und ist auf allen drei VMs gleich. Die Hostnamen beginnen mit deinem Code, das interne Netz liegt in 172.16.0.0/12 und endet auf `.0/24`, die VXLAN-Kennung liegt zwischen 1000 und 9999.
:::
::::
