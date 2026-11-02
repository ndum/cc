---
title: Elastizität mit OneFlow
description: Dienste mit Rollen in OneFlow, Kardinalität, Regeln für die Elastizität nach Last und nach Zeitplan, OneGate und ein Dienst für die Treuhand, der Ende Monat wächst.
sidebar:
  order: 5
  badge:
    text: Zusatz
    variant: note
---

:::assignment
«Ende Monat läuft bei uns die Buchhaltung aller Kunden», schreibt die Treuhand Aaregg. «Dann brauchen wir mehr Leistung, den Rest des Monats kaum. Wir wollen nicht jedes Mal anrufen.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Elastizität von Self-Service unterscheiden
- Einen Dienst mit Rollen in OneFlow beschreiben und anlegen
- Regeln für die Elastizität nach Last und nach Zeitplan schreiben
- Beobachten und erklären, wie ein Dienst unter Last wächst und wieder schrumpft
:::

:::note[Zusatzkapitel]
Dieses Kapitel gehört zu den Zusatzaufträgen von Meilenstein 1. Für die Basis brauchst du es nicht. Auch Teil 4 setzt den Dienst der Treuhand nicht voraus.
:::

## Elastizität

Rapid Elasticity ist ein weiteres Merkmal aus Kapitel 1.1. Ressourcen wachsen mit der Last und schrumpfen wieder, im besten Fall ohne dass jemand eingreift. Self-Service aus Kapitel 3.4 heisst, dass ein Mitglied selbst eine VM starten kann. Elastizität heisst, dass das System die Zahl der VMs nach Regeln selbst anpasst.

## Dienste und Rollen

OneFlow verwaltet Dienste aus mehreren VMs. Ein Dienst besteht aus Rollen, etwa einer Datenbank und mehreren Anwendungsservern. Jede Rolle startet ihre VMs aus einer Vorlage. Die Kardinalität ist die Zahl der VMs einer Rolle. `min_vms` und `max_vms` begrenzen sie, innerhalb dieser Grenzen verändern die Regeln für die Elastizität die Kardinalität.

Das Skript `lab/tenants/make-service.sh` schreibt die Dienstvorlage der Treuhand. Sie hat eine Rolle `app` aus der Vorlage `ubuntu`, die mit einer VM beginnt und auf höchstens drei wächst.

::code{file="lab/tenants/make-service.sh" lines="13-32"}

| Angabe | Bedeutung |
|---|---|
| `cardinality` | Zahl der VMs beim Start |
| `min_vms`, `max_vms` | Grenzen, innerhalb derer die Regeln die Kardinalität ändern |
| `cooldown` | Sekunden nach einer Änderung, in denen keine weitere Regel greift |
| `expression` | Bedingung über Werte der Überwachung, hier die CPU-Last der VMs in Prozent |
| `period`, `period_number` | wie lange die Bedingung gelten muss, hier zwei oder vier Perioden zu 30 Sekunden |
| `type`, `adjust` | was geschieht, `CHANGE` mit `1` heisst eine VM mehr |

## Den Dienst starten

Als `oneadmin` legst du die Dienstvorlage an und gibst sie den Mitgliedern zur Nutzung frei. Instanziieren soll sie die Treuhand selbst, damit der Dienst ihr gehört und gegen ihre Quota zählt. Ausserdem hinterlegst du deinen öffentlichen Schlüssel bei `treuhand-admin`, wie in Kapitel 3.1 bei `praxis-admin`. Bei jeder VM des Dienstes übernimmt der Kontext den Schlüssel vom Benutzer, der den Dienst gestartet hat.

```bash
~/cc/lab/tenants/make-service.sh > ~/cc-lab/treuhand-service.json
oneflow-template create ~/cc-lab/treuhand-service.json
oneflow-template chmod treuhand-buchhaltung 604
printf 'SSH_PUBLIC_KEY="%s"\n' "$(cat ~/.ssh/id_ed25519.pub)" > /tmp/key.tpl
oneuser update treuhand-admin --append /tmp/key.tpl

printf 'treuhand-admin:%s\n' "$(cat ~/cc-lab/tenants/treuhand-admin.pass)" > ~/cc-lab/tenants/treuhand.auth
chmod 600 ~/cc-lab/tenants/treuhand.auth
export ONE_AUTH=~/cc-lab/tenants/treuhand.auth
oneflow-template instantiate treuhand-buchhaltung
oneflow list
unset ONE_AUTH
```

Fehlt der Gruppe das Recht, Dokumente anzulegen, meldet OneFlow `Not authorized to perform CREATE DOCUMENT`. Wie eine ACL dieses Recht ergänzt, zeigt Kapitel 3.1. Nach etwa einer Minute steht der Dienst mit einer VM auf `RUNNING`. Die VM trägt deinen Schlüssel, weil du ihn oben bei `treuhand-admin` hinterlegt hast.

## Wachsen unter Last

Erzeuge in der VM des Dienstes Last und beobachte den Dienst auf dem Front-end.

```bash
ssh root@<adresse-der-vm> 'nohup sh -c "yes > /dev/null" >/dev/null 2>&1 &'
watch -n 10 oneflow show <dienst>
```

Im Lab wuchs die Rolle nach etwa 155 Sekunden von einer auf zwei VMs. Die Regel verlangt zwei Perioden von 30 Sekunden über 60 %. Dazu kommen der Start der VM und die Zeit, bis die Überwachung neue Werte liefert. Danach war der Dienst im Zustand `COOLDOWN`. Als die Last mit `pkill yes` gestoppt war, schrumpfte er nach etwa 345 Sekunden wieder auf eine VM. Die Regel zum Schrumpfen ist absichtlich träger, damit der Dienst nicht hin und her springt. Die CPU-Last bildet OneFlow aus dem Mittel der VMs einer Rolle. Eine VM unter Volllast und eine leere VM ergeben im Mittel 50 %, deshalb wächst der Dienst nicht weiter.

Den Wert für die CPU liefert die Überwachung von OpenNebula. Anwendungen können über OneGate auch eigene Werte melden, etwa die Länge einer Warteschlange. Auch solche Werte lassen sich in den Regeln verwenden. Die VM braucht dafür ein Token im Kontext und die Adresse von OneGate.

## Wachsen nach Zeitplan

Die Treuhand weiss im Voraus, wann die Last kommt. Statt auf die Last zu warten, kann eine Regel nach Zeitplan die Kardinalität setzen. `recurrence` ist ein Ausdruck im Format von cron.

```json
"scheduled_policies": [
  { "type": "CARDINALITY", "adjust": 3, "recurrence": "0 6 28 * *" },
  { "type": "CARDINALITY", "adjust": 1, "recurrence": "0 20 3 * *" }
]
```

Diese Regeln setzen die Rolle am 28. jedes Monats um 6 Uhr auf drei VMs und am 3. des Folgemonats um 20 Uhr zurück auf eine. Im Lab löste eine solche Regel alle zwei Minuten aus und setzte die Kardinalität pünktlich von eins auf zwei. Regeln nach Last und nach Zeitplan lassen sich kombinieren. Der Zeitplan deckt dann die bekannte Spitze am Monatsende ab. Steigt die Last unerwartet, greift die Regel nach Last.

Jede neue VM zählt gegen die Quota der Treuhand. Mit vier VMs, 2 CPU und 4096 MB reicht ihre Quota aus Kapitel 3.2 für die drei VMs des Dienstes und eine weitere VM. Läge `max_vms` über der Quota, würde OpenNebula die zusätzlichen VMs wie in Kapitel 3.2 ablehnen. Quota und `max_vms` müssen deshalb zueinander passen.

::::exercise[Lab]
Instanziiere den Dienst als `treuhand-admin` und erzeuge Last. Notiere die Zeit bis zur zweiten VM und nach dem Stopp der Last die Zeit bis zum Schrumpfen. Lass zum Schluss den Check dieses Teils laufen.

```bash
python3 ~/cc/checks/check.py tenants
```

:::solution
Nach zwei bis drei Minuten zeigt `oneflow show` im Log «Role app scaling up from 1 to 2 nodes» und den Zustand `COOLDOWN`. Ist die Last gestoppt, folgt nach fünf bis sechs Minuten «scaling down». Der Check meldet «19 von 19 Prüfungen der Basis erfüllt» und «2 von 2 Prüfungen der Zusatzaufträge erfüllt».
:::
::::

::::exercise[Regeln entwerfen]
Das Veloatelier Matte hat jeden Samstag von 9 bis 17 Uhr viel Verkehr im Webshop und an Aktionstagen unerwartete Spitzen. Entwirf die Regeln für einen Dienst mit einer Rolle `web`. Begründe deine Werte für `min_vms` und `max_vms` sowie die Quota.

:::solution
Eine Regel nach Zeitplan setzt die Kardinalität jeden Samstag um 8.30 Uhr auf zwei (`"30 8 * * 6"`) und eine zweite um 17.30 Uhr zurück auf eins (`"30 17 * * 6"`). Eine Regel nach Last ergänzt bei `CPU > 70` über zwei Perioden eine VM, eine weitere entfernt bei `CPU < 20` über vier Perioden wieder eine. `min_vms` ist 1 und `max_vms` ist 3. Die Quota des Veloateliers muss deshalb mindestens drei VMs zulassen, mehr als die zwei aus Kapitel 3.2.
:::
::::
