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

In Kapitel 1.1 gehört On-Demand Self-Service zu den fünf Merkmalen einer Cloud. Ein Mitglied holt sich Ressourcen selbst, wenn es sie braucht, ohne beim Plattform-Team anzufragen. Das Plattform-Team gibt den Rahmen vor, mit Gruppen, VDC und Quotas aus den Kapiteln 3.1 und 3.2, und gemeinsamen Vorlagen. Innerhalb dieses Rahmens handeln die Mitglieder selbst.

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
| `groupadmin` | Gruppenadmins | dazu Images, Netze, Benutzer der Gruppe, Dienstvorlagen, Sicherheitsgruppen und Backups |
| `admin` | das Plattform-Team | alles, auch Hosts, Cluster, Datastores und VDCs |

Die Ansichten liegen auf dem Front-end in `/etc/one/fireedge/sunstone/views/`. Jede Ansicht ist ein Ordner mit einer Datei pro Reiter. Wer einer Ansicht einen Reiter wegnehmen will, passt diese Dateien an.

Melde dich in Sunstone unter `http://<front-end>:2616` als `praxis-admin` an. Du siehst die Ansicht `groupadmin` mit den VMs der Praxis und der Vorlage `ubuntu`. Hosts und Datastores fehlen, die bleiben beim Plattform-Team.

## Benutzer in der Gruppe

Ein Gruppenadmin legt die Benutzer seines Mitglieds selbst an. Neue Benutzer landen in seiner Gruppe und zählen gegen ihre Quota.

```bash
export ONE_AUTH=~/cc-lab/tenants/praxis.auth
oneuser create praxis-mpa "<passwort>"
oneuser list
unset ONE_AUTH
```

Die MPA meldet sich danach in Sunstone an, bekommt die Ansicht `cloud` und startet ihre VMs aus der Vorlage `ubuntu`. Der Gruppenadmin sieht und verwaltet auch ihre VMs.

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
