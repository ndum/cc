---
title: Benutzer, Gruppen und VDCs
description: Mandantenfähigkeit in OpenNebula mit einer Gruppe pro Mitglied, Gruppenadmins, einem virtuellen Rechenzentrum für die Genossenschaft und den ACLs, die festlegen, wer was darf.
sidebar:
  order: 1
---

:::assignment
«Ab nächstem Monat wollen alle vier Mitglieder loslegen», schreibt Simone Wyss. «Die Praxis Rosenweg darf aber nichts vom Webshop des Veloateliers sehen, und umgekehrt. Und ich will nicht für jede neue VM angerufen werden.»
:::

:::goals
Nach diesem Kapitel kannst du

- erklären, was Mandantenfähigkeit in einer Cloud bedeutet,
- Benutzer, Gruppen und Gruppenadmins in OpenNebula unterscheiden,
- für jedes Mitglied eine Gruppe mit Admin anlegen,
- ein virtuelles Rechenzentrum (VDC) einrichten und begründen,
- eine ACL lesen.
:::

## Mandantenfähigkeit

Bis jetzt arbeitest du allein als `oneadmin` und siehst alles. Eine Cloud für mehrere Organisationen braucht Mandantenfähigkeit (Multi-Tenancy). Mehrere Mandanten teilen sich dieselbe Hardware, sehen aber nur ihre eigenen VMs, Images und Vorlagen. Jeder Mandant verwaltet seine Leute selbst, und das Plattform-Team legt fest, welche Ressourcen er nutzen darf und wie viel davon.

OpenNebula baut das aus drei Bausteinen.

| Baustein | Was er festlegt | Im Lab |
|---|---|---|
| Gruppe | wer zusammengehört und die Ressourcen der anderen teilt | eine Gruppe pro Mitglied |
| Gruppenadmin | wer in einer Gruppe Benutzer anlegen und alle VMs der Gruppe verwalten darf | `praxis-admin`, `treuhand-admin` und so weiter |
| VDC | welche Cluster, Hosts, Netze und Datastores eine Gruppe nutzen darf | das VDC `wolkenwerk` für alle Mitglieder |

Ein VDC (Virtual Data Center) ist ein Ausschnitt der Infrastruktur, den OpenNebula einer oder mehreren Gruppen zuteilt. Die Gruppen sehen darin nur ihre eigenen Objekte, auch wenn sie sich dieselben Knoten teilen.

## Gruppen und Gruppenadmins

`onegroup create` legt eine Gruppe an und auf Wunsch gleich einen Admin dazu. `--resources` bestimmt, welche Objekte die Mitglieder der Gruppe selbst erstellen dürfen. Im Lab sind das VMs, Images, Vorlagen und Dokumente. Dokumente braucht OneFlow in Kapitel 3.5, ein Dienst ist für OpenNebula ein Dokument.

Das Skript `lab/tenants/make-tenants.sh` legt die vier Mitglieder an. Die Passwörter der Gruppenadmins erzeugt es zufällig und legt sie in `~/cc-lab/tenants/` ab, die Dateien liest nur dein Benutzer.

::code{file="lab/tenants/make-tenants.sh"}

```bash
~/cc/lab/tenants/make-tenants.sh
onegroup list
oneuser list
```

Jede neue Gruppe landet zuerst im VDC `default`, das allen Gruppen alle Cluster gibt. Das Skript nimmt die Mitglieder dort heraus und fasst sie im VDC `wolkenwerk` zusammen. Es teilt dem VDC den Cluster 0 zu, der beide Knoten, das Netz `cc-net` und die Datastores enthält. Zum Schluss gibt es die Vorlage `ubuntu` und ihr Image mit `chmod 604` für alle zur Nutzung frei. Die erste Ziffer 6 erlaubt dem Besitzer Nutzen und Verwalten, die 0 gibt der Gruppe `oneadmin` nichts zusätzlich, die 4 erlaubt allen anderen das Nutzen.

## Als Mitglied arbeiten

Um zu sehen, was ein Mitglied sieht, meldest du dich als dessen Admin an. Die CLI liest Benutzer und Passwort aus der Datei, auf die `ONE_AUTH` zeigt.

```bash
printf 'praxis-admin:%s\n' "$(cat ~/cc-lab/tenants/praxis-admin.pass)" > ~/cc-lab/tenants/praxis.auth
chmod 600 ~/cc-lab/tenants/praxis.auth
export ONE_AUTH=~/cc-lab/tenants/praxis.auth
onetemplate list
onevnet list
onevm list
unset ONE_AUTH
```

Die Praxis sieht die Vorlage `ubuntu` und das Netz `cc-net`, aber keine VMs von `oneadmin`. Damit sie sich per SSH an ihren VMs anmelden kann, braucht auch `praxis-admin` einen öffentlichen Schlüssel, denn der Kontext nimmt ihn vom Benutzer, der die VM startet. Als `oneadmin` hinterlegst du ihn wie in Kapitel 2.4.

```bash
printf 'SSH_PUBLIC_KEY="%s"\n' "$(cat ~/.ssh/id_ed25519.pub)" > /tmp/key.tpl
oneuser update praxis-admin --append /tmp/key.tpl
```

Startet die Praxis nun eine VM, sieht das Veloatelier sie nicht. Im Lab zeigte `onevm list` als `velo-admin` keine einzige VM, während zwei VMs der Praxis liefen.

## ACLs

Hinter Gruppen und VDCs stehen ACLs (Access Control Lists). Jede Regel sagt, wer welche Ressourcen mit welchen Rechten bearbeiten darf. `oneacl list` zeigt sie als Tabelle mit Buchstaben, `oneacl create` legt eine neue Regel an.

```text
@100 VM+IMAGE+TEMPLATE+DOCUMENT/* CREATE
```

`@100` ist die Gruppe mit der Nummer 100, `VM+IMAGE+TEMPLATE+DOCUMENT` sind die Ressourcen, `/*` heisst alle Objekte dieser Art, und `CREATE` ist das Recht. Diese Regel hat `onegroup create` aus `--resources` gemacht. In `oneacl list` steht dieselbe Regel als `V--I-T---O---------` mit der Operation `---c`. Wer eine Ressource vergessen hat, ergänzt sie mit einer eigenen Regel, statt die Gruppe neu anzulegen.

::::exercise[Lab]
Lege die vier Mitglieder an, melde dich als `praxis-admin` an und starte die VM `praxis-1` aus der Vorlage `ubuntu`. Zeige als `velo-admin`, dass das Veloatelier diese VM nicht sieht.

:::solution
Nach `make-tenants.sh` zeigt `onegroup list` die Gruppen `praxis`, `treuhand`, `velo` und `gemeinde`. Als `praxis-admin` startet `onetemplate instantiate ubuntu --name praxis-1` die VM, `onevm list` zeigt sie mit dem Besitzer `praxis-admin` und der Gruppe `praxis`. Mit der Auth-Datei von `velo-admin` bleibt `onevm list` leer.
:::
::::

::::exercise[Gruppe oder VDC]
Die Gemeinde Hinterbüel will später einen eigenen Knoten kaufen, den nur sie nutzt. Reicht dafür eine eigene Gruppe, oder braucht es ein eigenes VDC? Begründe.

:::solution
Eine Gruppe trennt nur die Objekte, die VMs der Gemeinde könnten weiterhin auf jedem Knoten laufen. Ein eigenes VDC, dem nur der neue Knoten zugeteilt ist, legt fest, dass die VMs der Gemeinde nur dort laufen. Es braucht also beides, die Gruppe für die Objekte und das VDC für die Infrastruktur.
:::
::::
