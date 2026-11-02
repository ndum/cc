---
title: Benutzer, Gruppen und VDCs
description: Mandantenfähigkeit in OpenNebula mit einer Gruppe pro Mitglied, Gruppenadmins, einem virtuellen Rechenzentrum für die Genossenschaft und den ACLs, die festlegen, wer was darf.
sidebar:
  order: 1
---

:::assignment
«Ab nächstem Monat wollen alle vier Mitglieder loslegen», schreibt Simone Wyss. «Die Praxis Rosenweg darf aber nichts vom Webshop des Veloateliers sehen und umgekehrt. Und ich will nicht für jede neue VM angerufen werden.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Erklären, was Mandantenfähigkeit in einer Cloud bedeutet
- Benutzer, Gruppen und Gruppenadmins in OpenNebula unterscheiden
- Für jedes Mitglied eine Gruppe mit Admin anlegen
- Ein virtuelles Rechenzentrum (VDC) einrichten und begründen
- Eine ACL lesen
:::

## Mandantenfähigkeit

Bis jetzt arbeitest du allein als `oneadmin` und siehst alles. Eine Cloud für mehrere Organisationen braucht Mandantenfähigkeit (Multi-Tenancy). Die Mandanten teilen sich dieselbe Hardware, sehen aber nur ihre eigenen VMs, Images und Vorlagen. Jeder Mandant verwaltet seine Leute selbst. Welche Ressourcen er nutzen darf und wie viel davon, legt das Plattform-Team fest.

OpenNebula setzt das mit drei Bausteinen um.

| Baustein | Was er festlegt | Im Lab |
|---|---|---|
| Gruppe | wer zusammengehört und Ressourcen gemeinsam nutzt, getrennt von den anderen Gruppen | eine Gruppe pro Mitglied |
| Gruppenadmin | wer in einer Gruppe Benutzer anlegen und alle VMs der Gruppe verwalten darf | je einer pro Gruppe, etwa `praxis-admin` oder `treuhand-admin` |
| VDC | welche Cluster, Hosts, Netze und Datastores eine Gruppe nutzen darf | das VDC `wolkenwerk` für alle Mitglieder |

Ein VDC (Virtual Data Center) ist ein Ausschnitt der Infrastruktur, den OpenNebula einer oder mehreren Gruppen zuteilt. Die Gruppen sehen darin nur ihre eigenen Objekte, auch wenn sie sich dieselben Knoten teilen.

![Gruppen, Gruppenadmins und das VDC der Mitglieder. Oben fasst das VDC wolkenwerk die vier Gruppen praxis, treuhand, velo und gemeinde zusammen, eine pro Mitglied. Jede Gruppe hat einen Gruppenadmin wie praxis-admin, der darin Benutzer anlegt. Die Gruppen dürfen VMs, Images, Vorlagen und Dokumente anlegen und sehen nur ihre eigenen Objekte. Unten liegt der Cluster 0 mit Knoten 1, Knoten 2, dem Netz cc-net und den Datastores. Das Plattform-Team teilt ihn dem VDC zu, deshalb teilen sich alle vier Gruppen dieselben Knoten.](../../../assets/figures/de/p3c1-tenants.svg)

## Gruppen und Gruppenadmins

`onegroup create` legt eine Gruppe an und auf Wunsch gleich einen Admin dazu. `--resources` bestimmt, welche Objekte die Benutzer der Gruppe selbst erstellen dürfen. Im Lab sind das VMs, Images, Vorlagen und Dokumente. Die Dokumente braucht OneFlow in Kapitel 3.5, denn OpenNebula speichert einen Dienst als Dokument.

Das Skript `lab/tenants/make-tenants.sh` legt die vier Mitglieder an. Es erzeugt zufällige Passwörter für die Gruppenadmins und speichert sie in `~/cc-lab/tenants/`, wo nur dein Benutzer sie lesen kann.

::code{file="lab/tenants/make-tenants.sh"}

```bash
~/cc/lab/tenants/make-tenants.sh
onegroup list
oneuser list
```

Jede neue Gruppe landet zuerst im VDC `default`, das allen Gruppen alle Cluster gibt. Das Skript nimmt die Mitglieder dort heraus und fasst sie im VDC `wolkenwerk` zusammen. Diesem VDC teilt es den Cluster 0 zu, der beide Knoten, das Netz `cc-net` und die Datastores enthält. Zum Schluss gibt es die Vorlage `ubuntu` und ihr Image mit `chmod 604` für alle zur Nutzung frei. Die erste Ziffer 6 erlaubt dem Besitzer das Nutzen und Verwalten. Die 0 gibt der Gruppe `oneadmin` keine zusätzlichen Rechte, die 4 erlaubt allen anderen das Nutzen.

## Als Mitglied arbeiten

Um zu sehen, was ein Mitglied sieht, meldest du dich als dessen Admin an. Die CLI liest Benutzer und Passwort aus der Datei, auf die `ONE_AUTH` zeigt. Die Schleife legt eine solche Datei für jeden der vier Admins an. Du brauchst die Dateien auch in den nächsten Kapiteln.

```bash
for m in praxis treuhand velo gemeinde; do
  printf '%s-admin:%s\n' "$m" "$(cat ~/cc-lab/tenants/$m-admin.pass)" > ~/cc-lab/tenants/$m.auth
done
chmod 600 ~/cc-lab/tenants/*.auth
export ONE_AUTH=~/cc-lab/tenants/praxis.auth
onetemplate list
onevnet list
onevm list
unset ONE_AUTH
```

Die Praxis sieht die Vorlage `ubuntu` und das Netz `cc-net`, aber keine VMs von `oneadmin`. Für SSH auf ihre VMs braucht auch `praxis-admin` einen öffentlichen Schlüssel, denn der Kontext übernimmt ihn vom Benutzer, der die VM startet. Als `oneadmin` hinterlegst du ihn wie in Kapitel 2.4.

```bash
printf 'SSH_PUBLIC_KEY="%s"\n' "$(cat ~/.ssh/id_ed25519.pub)" > /tmp/key.tpl
oneuser update praxis-admin --append /tmp/key.tpl
```

Startet die Praxis nun eine VM, sieht das Veloatelier sie nicht. Im Lab zeigte `onevm list` als `velo-admin` keine einzige VM, während zwei VMs der Praxis liefen.

## ACLs

Gruppen und VDCs beruhen auf ACLs (Access Control Lists). Jede Regel sagt, wer welche Ressourcen mit welchen Rechten bearbeiten darf. `oneacl list` zeigt die Regeln als Tabelle mit Buchstaben, `oneacl create` legt eine neue an.

```text
@100 VM+IMAGE+TEMPLATE+DOCUMENT/* CREATE
```

`@100` ist die Gruppe mit der Nummer 100. `VM+IMAGE+TEMPLATE+DOCUMENT` sind die Ressourcen, `/*` steht für alle Objekte dieser Art. Das Recht ist `CREATE`. Diese Regel hat `onegroup create` aus der Angabe `--resources` erzeugt. In `oneacl list` steht sie als `V--I-T---O---------` mit der Operation `---c`. Wer eine Ressource vergessen hat, ergänzt sie mit einer eigenen Regel und muss die Gruppe nicht neu anlegen.

::::exercise[Lab]
Lege die vier Mitglieder an, melde dich als `praxis-admin` an und starte die VM `praxis-1` aus der Vorlage `ubuntu`. Zeige als `velo-admin`, dass das Veloatelier diese VM nicht sieht.

:::solution
Nach `make-tenants.sh` zeigt `onegroup list` die vier Gruppen `praxis`, `treuhand`, `velo` sowie `gemeinde`. Als `praxis-admin` startest du die VM mit `onetemplate instantiate ubuntu --name praxis-1`. `onevm list` zeigt sie mit dem Besitzer `praxis-admin` und der Gruppe `praxis`. Mit der Auth-Datei von `velo-admin` bleibt `onevm list` leer.
:::
::::

::::exercise[Gruppe oder VDC]
Die Gemeinde Hinterbüel will später einen eigenen Knoten kaufen, den nur sie nutzt. Reicht dafür eine eigene Gruppe, oder braucht es ein eigenes VDC? Begründe.

:::solution
Eine Gruppe trennt nur die Objekte. Die VMs der Gemeinde könnten weiterhin auf jedem Knoten laufen. Erst ein eigenes VDC, dem nur der neue Knoten zugeteilt ist, sorgt dafür, dass sie ausschliesslich dort laufen. Es braucht also beides, die Gruppe für die Objekte und das VDC für die Infrastruktur.
:::
::::
