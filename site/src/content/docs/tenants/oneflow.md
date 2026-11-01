---
title: Elastizität mit OneFlow
description: Dienste mit Rollen in OneFlow, Kardinalität, Regeln für die Elastizität nach Last und nach Zeitplan, OneGate und ein Dienst für die Treuhand, der Ende Monat wächst.
sidebar:
  order: 5
---

:::assignment
«Ende Monat läuft bei uns die Buchhaltung aller Kunden», schreibt die Treuhand Aaregg. «Dann brauchen wir mehr Leistung, den Rest des Monats kaum. Wir wollen nicht jedes Mal anrufen.»
:::

:::goals
Nach diesem Kapitel kannst du

- Elastizität von Self-Service unterscheiden,
- einen Dienst mit Rollen in OneFlow beschreiben und anlegen,
- Regeln für die Elastizität nach Last und nach Zeitplan schreiben,
- beobachten und erklären, wie ein Dienst unter Last wächst und wieder schrumpft.
:::

## Elastizität

Rapid Elasticity ist ein weiteres Merkmal aus Kapitel 1.1. Ressourcen wachsen mit der Last und schrumpfen wieder, im besten Fall ohne dass jemand eingreift. Self-Service aus Kapitel 3.4 heisst, dass ein Mitglied selbst eine VM starten kann. Elastizität heisst, dass das System die Zahl der VMs nach Regeln selbst anpasst.

## Dienste und Rollen

OneFlow verwaltet Dienste aus mehreren VMs. Ein Dienst besteht aus Rollen, etwa einer Datenbank und mehreren Anwendungsservern, und jede Rolle startet ihre VMs aus einer Vorlage. Die Kardinalität ist die Zahl der VMs einer Rolle. `min_vms` und `max_vms` begrenzen sie, und die Regeln für die Elastizität verändern sie innerhalb dieser Grenzen.

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

Als `oneadmin` legst du die Dienstvorlage an und gibst sie den Mitgliedern zur Nutzung frei. Instanziieren soll sie die Treuhand selbst, damit der Dienst ihr gehört und gegen ihre Quota zählt.

```bash
~/cc/lab/tenants/make-service.sh > ~/cc-lab/treuhand-service.json
oneflow-template create ~/cc-lab/treuhand-service.json
oneflow-template chmod treuhand-buchhaltung 604

printf 'treuhand-admin:%s\n' "$(cat ~/cc-lab/tenants/treuhand-admin.pass)" > ~/cc-lab/tenants/treuhand.auth
chmod 600 ~/cc-lab/tenants/treuhand.auth
export ONE_AUTH=~/cc-lab/tenants/treuhand.auth
oneflow-template instantiate treuhand-buchhaltung
oneflow list
unset ONE_AUTH
```

Fehlt der Gruppe das Recht auf Dokumente, meldet OneFlow `Not authorized to perform CREATE DOCUMENT`. Kapitel 3.1 zeigt, wie eine ACL das ergänzt. Nach etwa einer Minute ist der Dienst `RUNNING` mit einer VM. Damit `treuhand-admin` sich an ihr anmelden kann, braucht auch er einen Schlüssel wie `praxis-admin` in Kapitel 3.1.

## Wachsen unter Last

Erzeuge in der VM des Dienstes Last und beobachte den Dienst auf dem Front-end.

```bash
ssh root@<adresse-der-vm> 'nohup sh -c "yes > /dev/null" >/dev/null 2>&1 &'
watch -n 10 oneflow show <dienst>
```

Im Lab wuchs die Rolle nach etwa 155 Sekunden von einer auf zwei VMs. Die Regel verlangt zwei Perioden von 30 Sekunden über 60 %, dazu kommen die Zeit, bis die Überwachung neue Werte liefert, und der Start der VM. Danach war der Dienst im Zustand `COOLDOWN`. Nach dem Stopp der Last mit `pkill yes` schrumpfte er nach etwa 345 Sekunden wieder auf eine VM. Die Regel zum Schrumpfen ist absichtlich träger, damit der Dienst nicht hin und her springt. Die CPU-Last bildet OneFlow aus dem Mittel der VMs einer Rolle. Eine VM unter Volllast und eine leere VM ergeben zusammen 50 %, darum wächst der Dienst nicht weiter.

Die CPU kommt aus der Überwachung von OpenNebula. Anwendungen können über OneGate auch eigene Werte melden, etwa die Länge einer Warteschlange, und die Regeln können diese Werte verwenden. Die VM braucht dafür ein Token im Kontext und die Adresse von OneGate.

## Wachsen nach Zeitplan

Die Treuhand weiss im Voraus, wann die Last kommt. Statt auf die Last zu warten, kann eine Regel nach Zeitplan die Kardinalität setzen. `recurrence` ist ein Ausdruck im Format von cron.

```json
"scheduled_policies": [
  { "type": "CARDINALITY", "adjust": 3, "recurrence": "0 6 28 * *" },
  { "type": "CARDINALITY", "adjust": 1, "recurrence": "0 20 3 * *" }
]
```

Diese Regeln setzen die Rolle am 28. jedes Monats um 6 Uhr auf drei VMs und am 3. des Folgemonats um 20 Uhr zurück auf eine. Im Lab setzte eine solche Regel mit einem Zeitplan von zwei Minuten die Kardinalität pünktlich von eins auf zwei. Regeln nach Last und nach Zeitplan lassen sich kombinieren. Der Zeitplan deckt die bekannte Spitze ab, die Last fängt das Unerwartete auf.

Jede neue VM zählt gegen die Quota der Treuhand. Mit vier VMs, 2 CPU und 4096 MB reicht ihre Quota aus Kapitel 3.2 für die drei VMs des Dienstes und eine weitere VM. Läge `max_vms` über der Quota, würde OpenNebula die zusätzlichen VMs ablehnen wie in Kapitel 3.2. Quota und `max_vms` müssen deshalb zueinander passen.

::::exercise[Lab]
Instanziiere den Dienst als `treuhand-admin`, erzeuge Last und notiere die Zeit bis zur zweiten VM und nach dem Stopp der Last die Zeit bis zum Schrumpfen. Lass zum Schluss den Check dieses Teils laufen.

```bash
python3 ~/cc/checks/check.py tenants
```

:::solution
`oneflow show` zeigt im Log «Role app scaling up from 1 to 2 nodes» nach zwei bis drei Minuten und den Zustand `COOLDOWN`. Nach dem Stopp der Last folgt «scaling down» nach fünf bis sechs Minuten. Der Check endet mit «21 von 21 Prüfungen erfüllt».
:::
::::

::::exercise[Regeln entwerfen]
Das Veloatelier Matte hat jeden Samstag von 9 bis 17 Uhr viel Verkehr im Webshop und an Aktionstagen unerwartete Spitzen. Entwirf die Regeln für einen Dienst mit einer Rolle `web` und begründe `min_vms`, `max_vms` und die Quota.

:::solution
Eine Regel nach Zeitplan setzt die Kardinalität jeden Samstag um 8.30 Uhr auf zwei (`"30 8 * * 6"`) und eine zweite um 17.30 Uhr zurück auf eins (`"30 17 * * 6"`). Eine Regel nach Last ergänzt eine VM bei `CPU > 70` über zwei Perioden, eine weitere entfernt eine bei `CPU < 20` über vier Perioden. `min_vms` ist 1, `max_vms` 3, und die Quota des Veloateliers muss mindestens drei VMs zulassen, also mehr als die zwei aus Kapitel 3.2.
:::
::::
