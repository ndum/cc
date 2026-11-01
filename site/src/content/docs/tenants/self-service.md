---
title: Self-Service
description: Die Ansichten von Sunstone für Mitglieder und Gruppenadmins, gemeinsame Vorlagen, eigene Kopien und Benutzer und was ein Mitglied selbst ändern darf.
sidebar:
  order: 4
---

:::assignment
«Die Praxis Rosenweg hat eine neue MPA, die ab und zu eine Test-VM braucht», schreibt Simone Wyss. «Kann die Praxis das selbst einrichten, ohne dass wir etwas tun müssen?»
:::

:::goals
Nach diesem Kapitel kannst du

- erklären, was Self-Service in einer Cloud bedeutet und warum er zu den Merkmalen einer Cloud gehört,
- die Ansichten von Sunstone für Mitglieder und Gruppenadmins unterscheiden,
- als Gruppenadmin Benutzer anlegen und eigene Vorlagen ableiten,
- begründen, was ein Mitglied ändern darf und was nicht.
:::

## Self-Service

In [Kapitel 1.1](../../basics/characteristics/) gehört On-Demand Self-Service zu den fünf Merkmalen einer Cloud. Die Definition des NIST in [SP 800-145](https://csrc.nist.gov/pubs/sp/800/145/final) verlangt, dass Nutzende Rechenleistung und Speicher selbst und nach Bedarf beziehen, ohne dass beim Anbieter ein Mensch eingreift. Ein Mitglied holt sich also Ressourcen, wenn es sie braucht, und wartet nicht auf ein Ticket beim Plattform-Team.
Das Plattform-Team gibt den Rahmen vor, mit Gruppen, VDC und Quotas aus den Kapiteln 3.1 und 3.2, und gemeinsamen Vorlagen. Innerhalb dieses Rahmens handeln die Mitglieder selbst.

## Aufgaben von Plattform-Team und Mitglied

Mit Self-Service teilen sich Plattform-Team und Mitglieder die Arbeit neu auf. Die Aufteilung folgt der geteilten Verantwortung bei IaaS aus [Kapitel 1.2](../../basics/models/#geteilte-verantwortung). Das Plattform-Team betreibt die Knoten, das Netz, die Datastores und OpenNebula selbst. Es legt die Mitglieder an, setzt ihre Quotas und Preise und pflegt die gemeinsamen Vorlagen und Images. Was in einer VM läuft, verantwortet das Mitglied. Es legt seine Benutzer an, startet und löscht seine VMs, hält das Betriebssystem darin aktuell und sichert seine Daten. Die Grenze verläuft also am Hypervisor. Darunter arbeitet das Plattform-Team, darüber das Mitglied.

Für das Plattform-Team heisst das, dass es weniger einzelne Aufträge erledigt und mehr Zeit in gute Vorgaben steckt. Ein Fehler in einer gemeinsamen Vorlage trifft alle Mitglieder zugleich.

## Ansichten von Sunstone

Sunstone zeigt nicht allen dasselbe. Welche Ansicht jemand bekommt, steht in der Vorlage seiner Gruppe. `onegroup create` hat für die Mitglieder diese Werte gesetzt.

```text
FIREEDGE=[
  DEFAULT_VIEW="cloud",
  GROUP_ADMIN_DEFAULT_VIEW="groupadmin",
  GROUP_ADMIN_VIEWS="groupadmin",
  VIEWS="cloud" ]
```

| Ansicht | Für | Was sie zeigt |
|---|---|---|
| `cloud` | Benutzer eines Mitglieds | Übersicht, VMs, Vorlagen, Dienste, Marketplace und das eigene Konto |
| `user` | Benutzer mit mehr Bedarf, im Lab nicht vergeben | dazu Images, Netze, Sicherheitsgruppen und Backups, aber keine Benutzer und Dienstvorlagen |
| `groupadmin` | Gruppenadmins | dazu Images, Netze, Benutzer der Gruppe, Dienstvorlagen, Sicherheitsgruppen und Backups |
| `admin` | das Plattform-Team | alles, auch Hosts, Cluster, Datastores und VDCs |

OpenNebula 7.4 bringt diese vier Ansichten mit, die [Dokumentation der Ansichten](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/fireedge_sunstone_views/) beschreibt sie. Die Ansicht `cloud` ist für Endnutzende gedacht, die nur VMs aus fertigen Vorlagen starten. Hat eine Gruppe keine eigenen Werte, gilt die Zuteilung aus `sunstone-views.yaml` im selben Ordner. Dort bekommt die Gruppe `oneadmin` alle vier Ansichten, alle anderen `user` und `cloud`.

Die Ansichten liegen auf dem Front-end in `/etc/one/fireedge/sunstone/views/`. Jede Ansicht ist ein Ordner mit einer Datei pro Reiter. Wer einer Ansicht einen Reiter wegnehmen will, passt diese Dateien an.

Melde dich in Sunstone unter `http://<front-end>:2616` als `praxis-admin` an. Du siehst die Ansicht `groupadmin` mit den VMs der Praxis und der Vorlage `ubuntu`. Hosts und Datastores fehlen, die bleiben beim Plattform-Team.

## ACLs hinter den Ansichten

Eine Ansicht blendet nur Reiter und Knöpfe aus. Sie ist eine Hilfe für die Bedienung, keine Sicherheitsgrenze. Sunstone ruft für jede Aktion dieselbe API von OpenNebula auf wie die CLI, und erst dort entscheidet sich, ob der Auftrag erlaubt ist.

OpenNebula prüft jeden Auftrag in einer festen Reihenfolge, wie die [Dokumentation zu Rechten und ACLs](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/chmod/) beschreibt. Der Benutzer `oneadmin` und die Gruppe `oneadmin` dürfen alles. Bei VMs, Netzen, Images, Vorlagen und Dokumenten zählen danach die Rechte des Objekts für Besitzer, Gruppe und alle anderen, also das `chmod 604` der Vorlage `ubuntu`. Reicht das nicht, geht OpenNebula die ACLs aus Kapitel 3.1 durch, bis eine Regel den Auftrag erlaubt. ACLs geben nur Rechte, sie nehmen keine weg. Erlaubt keine Regel den Auftrag, lehnt OpenNebula ihn ab.

Wer einem Mitglied etwas verbieten will, ändert deshalb die ACLs oder die Rechte der Objekte. Ein Reiter, der in der Ansicht fehlt, hält niemanden auf, der die CLI oder die API benutzt.

## Benutzer in der Gruppe

Ein Gruppenadmin legt die Benutzer seines Mitglieds selbst an. Neue Benutzer landen in seiner Gruppe und zählen gegen ihre Quota.

```bash
export ONE_AUTH=~/cc-lab/tenants/praxis.auth
oneuser create praxis-mpa "<passwort>"
oneuser list
unset ONE_AUTH
```

Die MPA meldet sich danach in Sunstone an, bekommt die Ansicht `cloud` und startet ihre VMs aus der Vorlage `ubuntu`. Der Gruppenadmin sieht und verwaltet auch ihre VMs.

## Der Servicekatalog

Ein Servicekatalog ist die Liste der Dienste, die ein Anbieter fertig anbietet, jeweils mit festgelegtem Inhalt, Preis und Zuständigkeit. Wer etwas braucht, wählt aus dem Katalog, statt einen Wunsch frei zu formulieren. Für den Anbieter heisst das, dass er nur betreibt, was er geprüft und beschrieben hat.

In OpenNebula bilden die gemeinsamen Vorlagen diesen Katalog. Die Vorlage `ubuntu` legt Image, Grösse, Netz und Kontext fest und trägt seit Kapitel 3.3 ihren Preis. Die Dienstvorlagen von OneFlow aus Kapitel 3.5 ergänzen den Katalog um Dienste aus mehreren VMs. Laut der [Dokumentation der Cloud-Ansicht](https://docs.opennebula.io/7.4/product/control_plane_configuration/graphical_user_interface/cloud_view/) wählen Benutzer dort eine der Vorlagen, die die Administration vorbereitet hat, und passen vor dem Start höchstens Grösse und Disks an. Der Katalog ist damit die Schnittstelle zwischen Plattform-Team und Mitglied. Jeder Eintrag im Katalog ist eine Zusage, ihn zu pflegen. Das Plattform-Team nimmt deshalb nur auf, was es auch betreiben kann.

## Die Grenzen eines Mitglieds

Die Vorlage `ubuntu` gehört `oneadmin`, und die Mitglieder dürfen sie dank `chmod 604` nur nutzen. Ein Versuch, sie zu ändern, scheitert.

```text
[one.template.update] User [2] : Not authorized to perform MANAGE TEMPLATE [1].
```

Die Mitglieder dürfen aber Vorlagen anlegen, das erlaubt ihre Gruppe seit Kapitel 3.1. Braucht die Praxis eine grössere VM, kopiert sie die Vorlage und ändert ihre Kopie.

```bash
onetemplate clone ubuntu praxis-gross
onetemplate update praxis-gross
```

Die Kopie übernimmt alles, auch die Preise aus Kapitel 3.3, und gehört der Praxis. Was sie darin einträgt, begrenzt weiterhin ihre Quota. Damit ist die Arbeit verteilt. Das Plattform-Team pflegt wenige gemeinsame Vorlagen, Netze und Images, die Mitglieder richten sich innerhalb ihrer Quota selbst ein.

::::exercise[Lab]
Mit zwei VMs ist die Quota der Praxis aus Kapitel 3.2 voll. Lösche deshalb zuerst als `praxis-admin` die VM `praxis-2` mit `onevm terminate`. Lege dann den Benutzer `praxis-mpa` an, melde dich mit ihm in Sunstone an und starte eine VM. Prüfe als `praxis-admin`, dass du sie siehst, und lösche sie.

:::solution
`oneuser create praxis-mpa <passwort>` legt den Benutzer in der Gruppe `praxis` an. In Sunstone zeigt die Ansicht `cloud` die Vorlage `ubuntu`, die VM startet nur, solange die Quota der Praxis Platz hat. Als `praxis-admin` zeigt `onevm list` die VM mit dem Besitzer `praxis-mpa`, `onevm terminate` löscht sie.
:::
::::

::::exercise[Rahmen setzen]
Die Gemeinde Hinterbüel möchte, dass ihre Benutzer nur VMs starten, aber keine eigenen Images hochladen. Wie setzt du das um?

:::solution
Die Gruppe `gemeinde` bekommt nur die Ressourcen `VM`, `TEMPLATE` und `DOCUMENT` statt auch `IMAGE`. Bei einer bestehenden Gruppe löschst du die ACL der Gruppe mit `oneacl delete` und legst sie ohne `IMAGE` neu an. In der Ansicht `cloud` fehlt der Reiter für Images ohnehin, die ACL verhindert das Hochladen aber auch über die CLI.
:::
::::

::::exercise[Zuständigkeit]
Die Praxis möchte, dass ihre MPA höchstens eine VM gleichzeitig hat. Ausserdem wünscht sie sich eine Vorlage mit Windows für alle Mitglieder. Wer setzt was um, und womit?

:::solution
Die Grenze für die MPA ist eine Benutzerquota mit `VMS = 1`. Die setzt `praxis-admin` selbst mit `oneuser quota praxis-mpa`, weil ein Gruppenadmin die Benutzer seiner Gruppe verwalten darf. Eine Vorlage für alle Mitglieder gehört in den gemeinsamen Katalog und damit zum Plattform-Team. Es entscheidet, ob es das Image pflegen und die Lizenzen tragen kann, legt die Vorlage als `oneadmin` an und gibt sie mit `chmod 604` frei. Die Praxis könnte zwar eine eigene Vorlage anlegen, die gehörte aber ihr und nicht zum Katalog, den das Plattform-Team pflegt.
:::
::::
