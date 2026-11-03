---
title: Zusatzaufträge
description: Ein Dienst der Treuhand in OneFlow, der nach Last und Zeitplan wächst, ein monatlicher Bericht aus dem Showback mit der Kostendeckung und die Folgen eines ausgefallenen Knotens mit einem Vorschlag für die Platzierung der VMs.
tableOfContents:
  maxHeadingLevel: 2
sidebar:
  order: 5
  badge:
    text: Zusatz
    variant: note
---

:::assignment
«Bevor alle vier Mitglieder auf die Cloud wechseln, hat der Vorstand noch drei Anliegen», schreibt Beat Kläy. «Die Treuhand braucht Ende Monat mehr Leistung und will dafür nicht jedes Mal anrufen. Jeden Monat soll ein Bericht zeigen, was die Mitglieder kosten und ob das unsere Kosten deckt. Ausserdem möchte ich wissen, was die Mitglieder merken, wenn ein Knoten ausfällt. Wie verteilen wir die VMs, damit ein Ausfall möglichst wenig trifft?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Elastizität von Self-Service unterscheiden
- Einen Dienst in OneFlow mit Rollen und Regeln für die Elastizität entwerfen
- Regeln nach Last und nach Zeitplan aufeinander und auf die Quota abstimmen
- Eine wiederkehrende Aufgabe mit einem Timer von systemd planen
- Aus dem Showback die Kostendeckung der Genossenschaft berechnen
- Die Folgen eines ausgefallenen Knotens für die Mitglieder beurteilen
- Eine Strategie für die Platzierung der VMs vorschlagen und gegen eine Alternative abwägen
:::

## Rahmen und Bewertung

Dieses Kapitel gibt dir keine Anleitung zum Nachbauen. Du entwirfst eine eigene Lösung, setzt sie in deinem Lab um und begründest deine Entscheide. Die Abschnitte zu den Konzepten erklären, was du dafür wissen musst. Sie nennen auch Abwägungen, an denen sich ein eigener Entscheid festmachen lässt.

- Die drei Aufträge sind die Zusatzaufträge von [Meilenstein 1](../../assessment/milestone-1/). Weder die Basis noch Teil 4 setzen sie voraus.
- Für alle drei zusammen rechnest du mit vier bis sechs Stunden. Du kannst auch nur einzelne bearbeiten.
- Du zeigst sie live im Unterricht oder in einem Screencast von höchstens zehn Minuten, wie es der Meilenstein unter [Zusatzaufträge zeigen](../../assessment/milestone-1/#zusatzaufträge-zeigen) beschreibt. In derselben Vorführung beantwortest du die zwei Fragen aus dem Check `m1`.
- Zu jedem Auftrag gehört eine [Dokumentation in fünf Teilen](../../assessment/#dokumentation-der-zusatzaufträge)
- Jeder Auftrag gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../../assessment/#stufen-der-zusatzaufträge), ohne Dokumentation höchstens 1 Punkt
- KI-Assistenten setzt du nach den [Regeln des Kurses](../../start/overview/#ki-werkzeuge) ein. In der Vorführung erklärst du jede Zeile deiner Lösung selbst.

## Elastizität

**Elastizität** gehört zu den [fünf Merkmalen einer Cloud](../../basics/characteristics/#die-fünf-merkmale-nach-nist), das NIST nennt sie Rapid Elasticity. Ressourcen wachsen mit der Last und schrumpfen wieder, ohne dass jemand eingreift. Beim Self-Service aus Kapitel 3.4 startet ein Mitglied selbst eine VM, bei der Elastizität ändert das System die Zahl der VMs nach festen Regeln. Diese müssen den Dienst der Treuhand rechtzeitig wachsen und wieder schrumpfen lassen, denn jede VM, die länger läuft als nötig, erscheint in ihrem Showback.

## Dienste und Rollen

OneFlow verwaltet Dienste aus mehreren VMs, gegliedert in Rollen wie eine Datenbank oder mehrere Anwendungsserver. Jede Rolle startet ihre VMs aus einer VM-Vorlage, die Zahl dieser VMs ist die **Kardinalität** der Rolle. Eine **Dienstvorlage** beschreibt den Aufbau, beim Instanziieren entsteht aus ihr der Dienst. Du legst sie mit `oneflow-template` oder in Sunstone an und beschreibst darin jede Rolle vor allem mit diesen Angaben.

| Angabe | Bedeutung |
|---|---|
| `template_id` | Nummer der VM-Vorlage, aus der die Rolle ihre VMs startet |
| `cardinality` | Zahl der VMs beim Start |
| `min_vms`, `max_vms` | Grenzen, innerhalb derer die Regeln die Kardinalität ändern |
| `elasticity_policies` | Regeln nach Last |
| `scheduled_policies` | Regeln nach Zeitplan |
| `cooldown` | Sekunden nach einer Änderung, in denen keine weitere Regel greift |

:::details[Rechte, Quota und wer die Dienstvorlage anlegt]
OpenNebula speichert Dienstvorlagen und Dienste als Dokumente. Das Recht, Dokumente anzulegen, haben die Mitglieder seit [Kapitel 3.1](../groups/#gruppen-und-gruppenadmins). Dienstvorlagen tragen wie VM-Vorlagen Rechte für Besitzer, Gruppe und alle anderen. Die VMs eines Dienstes gehören seinem Besitzer, zählen gegen die Quota von dessen Gruppe und übernehmen wie in Kapitel 2.4 seinen SSH-Schlüssel. Instanziiert `treuhand-admin` den Dienst, belastet er also die Quota der Treuhand. Offen ist, wer die Dienstvorlage anlegt.

| Dienstvorlage von | Folge |
|---|---|
| Plattform-Team | Teil des [Katalogs](../self-service/#der-servicekatalog) aus Kapitel 3.4, vom Plattform-Team gepflegt und auch für andere Mitglieder nutzbar |
| Treuhand | gehört der Treuhand, die ihre Regeln selbst anpasst und verantwortet |
:::

## Regeln nach Last

Eine Regel nach Last prüft einen Ausdruck über die VMs einer Rolle wie `CPU > 75`. Gilt er eine Zeit lang, ändert sie die Kardinalität. OneFlow nimmt dafür das Mittel aller laufenden VMs der Rolle und prüft die Regeln nur alle 90 Sekunden.

:::details[Ausdruck, Perioden, Cooldown und Messwerte aus dem Lab]
`CPU` ist die Auslastung einer CPU in Prozent aus der Überwachung. Auch Werte, die eine Anwendung selbst über OneGate meldet, etwa die Länge einer Warteschlange, sind möglich. Dafür braucht die VM ein Token im Kontext und einen Weg zu OneGate, das im Lab nur lokal auf dem Front-end hört, wie die [Liste der Dienste](../../iaas/installation/#die-installierten-dienste) in Kapitel 2.2 zeigt. Für den Auftrag genügt die CPU. Gilt der Ausdruck über `period_number` aufeinanderfolgende Perioden von `period` Sekunden, ändern `type` und `adjust` die Kardinalität, etwa mit `CHANGE` und `1` um eine VM oder mit `PERCENTAGE_CHANGE` um einen Anteil.

Weil OneFlow das Mittel nimmt, ergeben eine VM unter Volllast und eine leere 50 %. Bei einer höheren Schwelle wächst die Rolle also nicht, solange nur eine arbeitet. Ob das passt, hängt davon ab, wie sich die Last der Treuhand verteilt. Nach jeder Änderung steht der Dienst im Zustand `COOLDOWN` und keine Regel greift, auch nicht die einer anderen Rolle. Die Dauer setzt `cooldown`, sonst gilt der Standardwert aus `/etc/one/oneflow-server.conf`.

Dort legt `:autoscaler_interval:` die 90 Sekunden fest. Eine kürzere Periode wirkt also wie eine von 90 Sekunden, dazu kommt die Verzögerung der Überwachung. Im Lab lief die zweite VM rund zweieinhalb Minuten nach dem Beginn der Last, mit einer Regel über zwei Perioden von 30 Sekunden. Ohne Last schrumpfte der Dienst nach knapp sechs Minuten, weil die Regel zum Schrumpfen absichtlich träger war. So springt er bei kurzen Schwankungen nicht hin und her, die Treuhand bezahlt die zusätzliche VM aber etwas länger.
:::

## Regeln nach Zeitplan

Eine Regel nach Zeitplan ändert die Kardinalität zu einer festen Zeit, ohne auf die Last zu warten, mit `recurrence` wiederkehrend im Format von cron oder mit `start_time` einmal. In derselben Rolle deckt der Zeitplan die bekannte Spitze am Monatsende ab, die Regel nach Last unerwartete Spitzen.

:::details[Art der Änderung, Messwert aus dem Lab und Zusammenspiel mit der Last]
`type` und `adjust` bestimmen die Änderung, `CARDINALITY` setzt eine feste Zahl von VMs. Im Lab löste eine Regel, die alle zwei Minuten galt, bei der ersten Prüfung nach der geraden Minute aus und setzte die Rolle von einer auf zwei VMs. Eine Regel nach Zeitplan greift also bis zu 90 Sekunden nach ihrer Zeit.

Weil beide Regeln dieselbe Kardinalität ändern, prüfst du, ob die Regel zum Schrumpfen wegnimmt, was der Zeitplan eben hinzugefügt hat, solange die Last noch fehlt. Lege auch fest, welche Tage für die Treuhand zum Monatsende gehören und wann der Dienst wieder klein sein soll.
:::

## Quota und Kapazität

Jede VM des Dienstes zählt gegen die [Quota der Treuhand](../quotas/#die-quotas-der-mitglieder) von vier VMs, 2 CPU und 4096 MB, neben ihren anderen VMs wie `treuhand-1` aus Kapitel 3.3. `max_vms`, die Grösse der VMs und die Quota müssen also zusammenpassen.

:::details[Dienst über der Quota und Platz auf den Knoten]
VMs über der Quota lehnt OpenNebula ab wie in Kapitel 3.2, der Dienst steht dann auf `FAILED_SCALING`. Keine seiner Regeln greift mehr, bis die Quota wieder Platz hat und jemand `oneflow recover` aufruft. Ob die Knoten den Platz auch haben, sagt die Quota nicht, wie Kapitel 3.2 unter [Quota und Überbuchung](../quotas/#quota-und-überbuchung) zeigt. Ab Kapitel 4.2 belegt zudem der Kubernetes-Cluster die Knoten.
:::

## Timer von systemd

Ubuntu 26.04 bringt auf den Servern des Labs kein cron mit. Wiederkehrende Aufgaben plant systemd mit Timern, Units mit der Endung `.timer`, die beim Ablaufen ohne weitere Angabe den Dienst gleichen Namens mit der Endung `.service` starten. Dieser führt dein Skript aus.

:::details[Zeitpunkt, Art der Unit und Anmeldung der CLI]
Den Zeitpunkt legt `OnCalendar=` mit einem Kalenderausdruck fest, `monthly` steht etwa für den Ersten jedes Monats um Mitternacht. `systemd-analyze calendar` zeigt, wann ein Ausdruck das nächste Mal zutrifft. Mit `Persistent=` holt systemd einen Lauf, den der ausgeschaltete Server verpasst hat, nach dem nächsten Start nach. Ohne diese Option fällt er aus.

| Art | Läuft | Benutzer des Dienstes |
|---|---|---|
| Unit des Systems | auch ohne Anmeldung | mit `User=` festgelegt |
| Unit eines Benutzers | nur während seiner Anmeldung, ausser nach `loginctl enable-linger` | der Benutzer selbst |

Die CLI von OpenNebula meldet sich im Dienst mit `~/.one/one_auth` des Benutzers an, unter dem er läuft, wie [Kapitel 2.2](../../iaas/installation/#die-cli-als-dein-benutzer) zeigt. `systemctl list-timers` zeigt die Timer mit letztem und nächstem Lauf, `journalctl` mit dem Namen des Dienstes die Ausgabe deines Skripts.
:::

:::caution[Kein Passwort in Git]
`~/.one/one_auth` enthält das Passwort von `oneadmin`. Skript und Units kommen als Dateien des Auftrags in dein Abgabe-Repo. Schreib das Passwort deshalb in keine dieser Dateien und kopiere auch `one_auth` nicht ins Repo.
:::

## Der monatliche Bericht

OpenNebula bringt den Timer `opennebula-showback.timer` mit, der den Showback täglich berechnet. Wann er läuft, zeigt `systemctl list-timers`.

| Weg für deinen Bericht | Nachteil |
|---|---|
| Auf der Berechnung von OpenNebula aufbauen | läuft dein Timer zur selben Zeit wie der von OpenNebula, ist offen, welcher zuerst fertig ist |
| Selbst berechnen | dein Skript wiederholt eine Arbeit, die OpenNebula schon erledigt |

:::details[Befehle, Optionen und ein zweiter Lauf]
Laut der [Dokumentation zum Showback](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/) führst du `oneshowback calculate` als `oneadmin` aus, bei vielen VMs nur für die fehlenden Monate, weil die Berechnung aufwendig ist. `oneshowback list` wählt mit `-s` und `-e` die Monate, gibt mit `--csv` CSV aus und beschränkt sich mit `-g` auf eine Gruppe. Enthält der Bereich den laufenden Monat, rechnet OpenNebula bis heute. Läuft dein Skript zweimal für denselben Monat, etwa nach einem Neustart, soll dieselbe Datei ohne doppelte Zeilen entstehen. Jahr und Monat im Dateinamen zeigen, welchen Monat sie enthält.
:::

## Kostendeckung

Die Preise in der Vorlage `ubuntu` sind für den Fall erfunden. Ob sie die Kosten der Genossenschaft decken, zeigt die **Kostendeckung**, das Verhältnis der Summe aus dem Showback eines Monats zu allen Kosten dieses Monats. Unter 100 % decken die Preise die Kosten nicht, auch wenn die Genossenschaft sie verrechnet.

:::details[Kosten, Annahmen und Wege bei fehlender Deckung]
Zu den Kosten gehören laut [Kapitel 3.3](../showback/#die-kosten-einer-vm) die Hardware über ihre Lebensdauer, Strom, Lizenzen, Backup, die Arbeit des Plattform-Teams und die Reserve für Wartung aus Kapitel 2.5.

Ein Monat im Lab mit wenigen VMs, die oft erst seit einigen Tagen laufen, sagt wenig über den Betrieb. Deine Annahmen, etwa wie viele VMs im Mittel laufen oder was die Genossenschaft im Jahr kostet, legst du offen. Werte dafür nennt die Aufgabe «Kostenmodell» in Kapitel 3.3. Ebenso lässt sich rechnen, ab wie vielen VMs im Mittel die Preise die Kosten decken. Reicht die Deckung nicht, kann die Genossenschaft die Preise erhöhen, für mehr Auslastung sorgen oder von jedem Mitglied einen festen Beitrag für die Arbeit des Plattform-Teams verlangen. Jeder Weg trifft die Mitglieder anders, etwa die Gemeinde mit ihrem festen Budget.
:::

## Folgen eines Ausfalls

Fällt ein Knoten aus, zeigt ihn `onehost list` nach einiger Zeit als `err` und `onevm list` seine VMs als `unkn`, wie [Kapitel 2.5](../../iaas/hosts/#ausfall-eines-knotens) beschreibt. An ihre Disks im Datastore `system` des Knotens kommt niemand, solange er aus ist. Wer die VMs eines ausgefallenen Knotens anderswo startet, muss vorher sicherstellen, dass der Knoten wirklich aus ist. Ohne dieses **Fencing** kann nach einem kurzen Netzfehler dieselbe VM auf zwei Hosts laufen. Im Lab fehlen gemeinsamer Speicher und ein Hook für ausgefallene Hosts bewusst, damit drei Server genügen. Ein Ausfall trifft die Mitglieder also, bis der Knoten wieder läuft.

:::details[Hook für ausgefallene Hosts und das Verhalten von OneFlow]
OpenNebula liefert ein Skript mit, das als Hook startet, sobald ein Host in den Zustand `ERROR` wechselt. Seine Optionen bestimmen, was mit den VMs geschieht.

| Option | Wirkung |
|---|---|
| `-m` | verschiebt die VMs auf einen anderen Host, nur mit gemeinsamem Speicher wie NFS oder Ceph, VMs auf lokalen Datastores starten erst mit ihrem Host wieder |
| `-r` | löscht die VMs und legt sie neu an, ihr Zustand geht verloren, was für VMs ohne eigene Daten genügen kann |
| `-p` | wartet einige Zyklen der Überwachung ab, ein Host, der in dieser Zeit zurückkommt, behält seine VMs |

Wann ein Host als ausgefallen gilt, hängt von den Zeiten der Überwachung in `/etc/one/monitord.conf` ab.

OneFlow kennt den Zustand der Knoten nicht. Bis OpenNebula den Ausfall nach einigen Minuten erkennt, meldet es die VMs des Knotens noch als laufend, die Regeln eines Dienstes arbeiten also mit falschen Werten. Fällt die Last scheinbar, verkleinert OneFlow die Rolle und beendet dabei ihre ältesten VMs, auch eine gesunde auf dem anderen Knoten. Steht danach eine VM auf `unkn`, wechselt der Dienst in den Zustand `WARNING`, in dem OneFlow weder Regeln auswertet noch VMs ersetzt. Im Lab hatte der Dienst der Treuhand so einige Minuten lang keine VM, die arbeitete. Holst du eine VM mit `onevm recover --recreate` auf den anderen Knoten, bleibt ihr alter Ordner im System-Datastore des ausgefallenen Knotens liegen. Du räumst ihn selbst weg, sobald der Knoten zurück ist, denn OpenNebula kennt ihn nicht mehr.
:::

## Platzierung und Ausfall

Wo eine neue VM läuft, entscheidet der Scheduler nach den Regeln aus [Kapitel 2.5](../../iaas/hosts/#platzierung-durch-den-scheduler). Die Strategie in `/etc/one/schedulers/rank.conf` gilt für alle VMs ohne eigene Regel, `SCHED_RANK` und `SCHED_REQUIREMENTS` in einer Vorlage geben einzelnen Mitgliedern oder Diensten eigene Regeln.

| Regel | Wirkung | Bei einem Ausfall |
|---|---|---|
| Striping, im Lab eingestellt | verteilt die VMs nach der Zahl laufender VMs auf die Knoten, ob zwei VMs eines Dienstes getrennt landen, hängt auch von den übrigen ab | trifft es weniger VMs |
| Packing | füllt zuerst einen Knoten, leere Knoten lassen sich ausschalten | trifft es mehr VMs auf einmal |
| VM-Gruppe mit `ANTI_AFFINED` | trennt die VMs einer Rolle strikt nach Host, mit zwei Knoten laufen also höchstens zwei | läuft nur noch eine VM der Rolle |

:::details[VM-Gruppen und die Reserve der Knoten]
Eine VM-Gruppe fasst VMs in eigenen Rollen zusammen, die mit den Rollen von OneFlow nichts zu tun haben. Für jede Rolle legt sie fest, ob ihre VMs auf denselben Host gehören (`AFFINED`) oder auf verschiedene (`ANTI_AFFINED`). Der Scheduler hält das strikt ein. Ohne passenden Host bleibt die VM in `pend`.

Dazu kommt die Reserve. Bei zwei Knoten muss jeder allein alle VMs tragen, bei einer [Wartung](../../iaas/hosts/#wartung-eines-knotens) mit Vorwarnung und bei einem Ausfall ohne. Die Quotas der vier Mitglieder ergeben zusammen mehr, als ein Knoten trägt. Schöpfen alle sie aus, haben nach einem Ausfall nicht alle VMs Platz. Ein Vorschlag für die Platzierung sagt deshalb auch, welche Mitglieder Vorrang haben. Wie sehr sie auf Verfügbarkeit angewiesen sind, zeigt ihr [Schutzbedarf](../../basics/sovereignty/#schutzbedarf) aus Kapitel 1.4.
:::

## Elastizität mit OneFlow (Auftrag A)

Die Treuhand braucht Ende Monat mehr Leistung, ohne dass jemand eingreift. Ihr Dienst in OneFlow wächst vor der bekannten Spitze nach Zeitplan, bei unerwarteten Spitzen nach Last und schrumpft danach wieder.

![Der Dienst der Treuhand in OneFlow. Im Zielzustand von Auftrag A liest OneFlow oben auf dem Front-end die Rollen und Regeln deiner Dienstvorlage. Die Regeln nach Zeitplan richten sich nach der Systemzeit, die Regeln nach Last nach der CPU, die das Monitoring für jede VM misst. Nach diesen Werten ändert OneFlow die Kardinalität einer Rolle. Unten läuft der Dienst in der Gruppe treuhand. Ein Teil seiner VMs läuft immer, weitere VMs kommen nach Last oder Zeitplan dazu und gehen danach wieder. Daneben läuft treuhand-1, eine andere VM der Gruppe. Achte auf die Linien unter den VMs. Die Rolle bleibt zwischen min_vms und max_vms. Alle VMs des Dienstes passen zusammen mit treuhand-1 in die Quota der Treuhand.](../../../assets/figures/de/p3c5-oneflow.svg)

| Ausgangslage | Ergebnis |
|---|---|
| Aus der Basis hast du die Gruppe `treuhand` mit ihrem Admin `treuhand-admin`, ihrer Quota und der VM `treuhand-1` aus Kapitel 3.3, dazu die Vorlage `ubuntu` und das Netz `cc-net`. OneFlow läuft seit Kapitel 2.2 auf dem Front-end, einen Dienst hast du aber noch nicht angelegt. Anders als `praxis-admin` in Kapitel 3.1 hat `treuhand-admin` noch keinen SSH-Schlüssel. | In der Gruppe `treuhand` läuft ein Dienst mit mindestens einer Rolle. Die Zahl seiner VMs steigt unter Last und vor dem Monatsende und sinkt danach wieder, ohne die Quota der Treuhand zu sprengen. |

### Vorgehen

1. Plane die Rollen des Dienstes und ihre Grenzen passend zur Quota der Treuhand.
2. Schreibe eine Dienstvorlage mit Regeln nach Last und nach Zeitplan.
3. Starte den Dienst als Admin der Treuhand und prüfe, dass er läuft.
4. Erzeuge Last in einer VM des Dienstes und beobachte, wie die Rolle wächst und wieder schrumpft.
5. Belege die Regel nach Zeitplan, ohne bis zum Monatsende zu warten.
6. Halte Werte, Zeiten und deinen Entscheid für die Dokumentation fest.

### Anforderungen

1. Ein Dienst in OneFlow läuft in der Gruppe `treuhand`, seine VMs zählen gegen die Quota der Treuhand.
2. Eine Rolle wächst unter Last und schrumpft ohne Last wieder, innerhalb fester Grenzen.
3. Eine Regel nach Zeitplan vergrössert den Dienst vor dem Monatsende und verkleinert ihn danach, in derselben oder in einer eigenen Rolle.
4. Die Grenzen der Rolle passen zur Quota der Treuhand, auch neben ihren anderen VMs.

### Vorführung

- Den Dienst mit seinen Rollen und Regeln
- Das Wachsen unter Last und das Schrumpfen danach, mit den Zeiten aus deinem Lab
- Wie du belegst, dass die Regel nach Zeitplan auslöst
- Warum du Schwellen, Perioden und Grenzen so gewählt hast

:::details[Hinweise aus dem Lab]
- `oneflow show` zeigt die Rollen, ihre VMs und im Log des Dienstes jede Änderung der Kardinalität
- Last erzeugst du in einer VM des Dienstes mit einem Prozess, der die CPU voll auslastet, etwa `yes`. Starte sie vor der Vorführung, denn das Wachsen dauert einige Minuten.
- Antwortet OneFlow nicht, prüfst du den Dienst `opennebula-flow` aus [Kapitel 2.2](../../iaas/installation/#die-installierten-dienste)
:::

:::details[Quellen]
- [OneFlow Services Management](https://docs.opennebula.io/7.4/product/virtual_machines_operation/multi-vm_workflows/appflow_use_cli/) mit dem Aufbau einer Dienstvorlage und den Befehlen `oneflow-template` und `oneflow`
- [OneFlow Services Auto-scaling](https://docs.opennebula.io/7.4/product/virtual_machines_operation/multi-vm_workflows/appflow_elasticity/) mit den Regeln nach Last und Zeitplan, ihren Ausdrücken und den Zuständen eines Dienstes
- [Resource Metrics](https://docs.opennebula.io/7.4/product/cloud_system_administration/resource_monitoring/metrics/) mit den Werten der Überwachung einer VM
- [OneFlow Configuration](https://docs.opennebula.io/7.4/product/operation_references/opennebula_services_configuration/oneflow/) mit den Standardwerten des Servers und seinen Logs
- [Kapitel 3.1](../groups/#als-mitglied-arbeiten) für die Arbeit als Mitglied mit `ONE_AUTH`, in Sunstone die Ansicht `groupadmin` aus Kapitel 3.4
:::

## Showback als Bericht (Auftrag B)

Der Vorstand will jeden Monat sehen, was die Mitglieder gekostet haben, ohne dass jemand daran denken muss. Ein eigenes Skript mit einem eigenen Timer legt den Bericht ab, aus ihm berechnest du die Kostendeckung der Genossenschaft.

![Der monatliche Bericht aus dem Showback. Im Zielzustand von Auftrag B startet oben auf dem Front-end dein Timer einmal im Monat deinen Dienst, eine Unit von systemd. Der Dienst führt dein Skript aus. Das Skript fragt den Showback von OpenNebula ab und legt den Bericht des vergangenen Monats als CSV-Datei ab, die den Monat im Namen trägt. Daneben berechnet der Timer opennebula-showback.timer, den OpenNebula mitbringt, den Showback täglich. Unten berechnest du aus dem Bericht und den Kosten eines Monats die Kostendeckung, also die Summe des Showbacks geteilt durch alle Kosten. Die Kosten beruhen auf deinen Annahmen. Daraus machst du dem Vorstand einen Vorschlag. Achte darauf, dass zwei Timer am Showback arbeiten, deiner und der von OpenNebula.](../../../assets/figures/de/p3c5-report.svg)

| Ausgangslage | Ergebnis |
|---|---|
| Seit Kapitel 3.3 trägt die Vorlage `ubuntu` Preise. Dort hast du den Showback von Hand berechnet und als CSV exportiert. OpenNebula berechnet ihn mit seinem Timer `opennebula-showback.timer` täglich, einen eigenen Timer und einen Bericht pro Monat hast du aber noch nicht. | Ein eigener Timer von systemd startet einmal im Monat dein Skript, das den Showback des vergangenen Monats als CSV-Datei ablegt. Aus einem Bericht mit Daten berechnest du die Kosten pro Mitglied und die Kostendeckung der Genossenschaft. |

### Vorgehen

1. Probiere von Hand aus, wie du den Showback eines einzelnen Monats berechnest und als CSV ausgibst.
2. Schreibe das Skript für den Bericht des vergangenen Monats so, dass ein zweiter Lauf dieselbe Datei ergibt.
3. Lege Dienst und Timer von systemd an und entscheide, unter welchem Benutzer und wann sie laufen.
4. Starte einen Lauf von Hand und prüfe die Datei und den nächsten Lauf des Timers.
5. Berechne aus einem Bericht mit Daten die Kosten pro Mitglied und die Kostendeckung.
6. Halte Werte, Annahmen und deinen Entscheid für die Dokumentation fest.

### Anforderungen

1. Ein eigenes Skript legt den Showback des vergangenen Monats als CSV-Datei ab, deren Name den Monat nennt.
2. Ein eigener Timer von systemd startet das Skript einmal im Monat. Sein Name enthält `showback` und beginnt nicht mit `opennebula-`.
3. Läuft das Skript ein zweites Mal für denselben Monat, entsteht dieselbe Datei ohne doppelte Zeilen.
4. Aus dem Bericht berechnest du die Kosten pro Mitglied und die Kostendeckung der Genossenschaft mit offengelegten Annahmen.

### Vorführung

- Den Timer mit seinem letzten und seinem nächsten Lauf
- Einen Lauf, den du von Hand startest, mit der Datei, die er ablegt
- Die Kostendeckung mit deinen Annahmen und einem Vorschlag an den Vorstand

:::details[Hinweise aus dem Lab]
- Das Skript schreibst du etwa in Bash oder Python, beides ist auf dem Front-end vorhanden
- Lief dein Lab im vergangenen Monat noch nicht, ist der Bericht für diesen Monat leer. Plane deshalb, wie du in der Vorführung einen Bericht mit Daten zeigst, zum Beispiel für den laufenden Monat.
- Fehlt die Datei nach einem Lauf, zeigt `journalctl`, was dein Dienst ausgegeben hat
:::

:::details[Quellen]
- Die [Dokumentation zum Showback](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/) von OpenNebula 7.4 zu `oneshowback calculate` und `oneshowback list` mit ihren Optionen
- Die Handbuchseiten von Ubuntu 26.04 zu [systemd.timer](https://manpages.ubuntu.com/manpages/resolute/man5/systemd.timer.5.html), [systemd.service](https://manpages.ubuntu.com/manpages/resolute/man5/systemd.service.5.html) und den Kalenderausdrücken in [systemd.time](https://manpages.ubuntu.com/manpages/resolute/man7/systemd.time.7.html)
- [Kapitel 3.3](../showback/) zu Preisen, Showback und dem Export als CSV, dazu dort die Aufgabe «Kostenmodell» mit einer einfachen Rechnung zur Kostendeckung
:::

## Ausfall eines Knotens (Auftrag C)

Beat Kläy will wissen, was die Mitglieder bei einem Ausfall merken. Du schaltest einen Knoten ohne Vorwarnung aus, beobachtest die Folgen und leitest daraus einen Vorschlag ab, wie Wolkenwerk seine VMs platzieren soll.

![Der Ausfall eines Knotens. Im Zielzustand von Auftrag C laufen unten auf Knoten 1 und Knoten 2 VMs mehrerer Mitglieder. Ihre Disks liegen im Datastore system ihres Knotens. Im Beispiel ist Knoten 2 hart ausgeschaltet. Seine VMs und Disks sind nicht mehr erreichbar, Knoten 1 läuft weiter. Oben prüft das Monitoring auf dem Front-end die Knoten regelmässig und bekommt von Knoten 2 keine Antwort mehr. Rechts hältst du die Zustände mit Zeiten in deinem Protokoll fest. Darauf stützt sich dein Vorschlag mit Regel, Alternative und Abwägung. Er legt fest, wie der Scheduler neue VMs auf die Knoten verteilt. Achte darauf, dass die Disks auf dem ausgefallenen Knoten liegen. Solange er aus ist, kommt niemand an sie heran.](../../../assets/figures/de/p3c5-failure.svg)

| Ausgangslage | Ergebnis |
|---|---|
| Aus der Basis laufen die VMs `web-1` bis `web-3` aus Teil 2 sowie `praxis-1` und `treuhand-1` aus Teil 3, der Scheduler verteilt sie mit Striping auf beide Knoten. Ihre Disks liegen im Datastore `system` ihres Knotens, gemeinsamen Speicher und einen Hook für ausgefallene Hosts hat das Lab nicht. Einen Ausfall kennst du bisher nur aus der Beschreibung in Kapitel 2.5. | Nach einem harten Ausfall laufen wieder alle VMs. Dein Protokoll hält mit Zeiten fest, was OpenNebula dazwischen zu Knoten, VMs und Diensten zeigte und was du tun musstest. Darauf stützt sich dein Vorschlag für die Platzierung mit einer Alternative und der Abwägung für die vier Mitglieder. |

### Vorgehen

1. Verteile VMs mehrerer Mitglieder auf beide Knoten und halte fest, welche VM wo läuft.
2. Lege von allen drei Servern einen Snapshot an und bereite vor, wie du Zustände mit Zeiten festhältst.
3. Schalte einen Knoten hart aus und beobachte Knoten, VMs und Dienste, bis OpenNebula den Ausfall meldet.
4. Schalte den Knoten wieder ein und bringe alle VMs zum Laufen.
5. Leite aus deinen Beobachtungen einen Vorschlag für die Platzierung ab und wäge ihn gegen eine Alternative ab.
6. Halte Zeiten, Schritte und deinen Entscheid für die Dokumentation fest.

:::caution[Snapshot vor dem Ausfall]
Lege von allen drei Servern einen Snapshot an, bevor du den Knoten hart ausschaltest, wie [Kapitel 0.4](../../start/prepare/) es empfiehlt. Damit kommst du zurück, falls eine VM danach nicht mehr startet.
:::

### Anforderungen

1. Vor dem Ausfall laufen VMs mehrerer Mitglieder auf beiden Knoten. Du hältst fest, welche VM wo läuft.
2. Du schaltest einen Knoten hart aus und hältst mit Zeiten fest, was OpenNebula danach zu Knoten, VMs und Diensten anzeigt.
3. Nach dem Wiedereinschalten laufen alle VMs wieder. Du hältst fest, was du dafür tun musstest.
4. Dein Vorschlag für die Platzierung stützt sich auf deine Beobachtungen. Er nennt eine Strategie oder Regel, eine Alternative und die Abwägung für die vier Mitglieder.

### Vorführung

- Die Verteilung der VMs vor dem Ausfall
- Den Zustand von Knoten und VMs während des Ausfalls mit den Zeiten, die du gemessen hast
- Was du nach dem Wiedereinschalten tun musstest
- Deinen Vorschlag mit Alternative und Abwägung

:::details[Hinweise aus dem Lab]
- Ein echter Ausfall kündigt sich nicht an. Schalte die VM des Knotens deshalb aus, ohne Ubuntu darin herunterzufahren.
- Beobachte `onehost list` und `onevm list` in kurzen Abständen und notiere die Zeiten. Läuft der Dienst aus Auftrag A, beobachte auch ihn.
- Zeigst du den Auftrag nach Kapitel 4.2, beachte den Hinweis zum Kubernetes-Cluster unter [Zusatzaufträge zeigen](../../assessment/milestone-1/#zusatzaufträge-zeigen) im Meilenstein
- Setzt du einen Teil deines Vorschlags im Lab um, etwa für die VMs eines Mitglieds, kannst du seine Wirkung in der Vorführung zeigen
:::

:::details[Quellen]
- [Kapitel 2.5](../../iaas/hosts/) mit den Zuständen von Hosts und VMs, dem Scheduler, der Wartung und dem Ausfall eines Knotens
- Der Abschnitt [Lebenszyklus einer VM](../../iaas/hosts/#lebenszyklus-einer-vm) in Kapitel 2.5 mit den Befehlen, die den Zustand einer VM ändern
- [Kapitel 3.2](../quotas/#quota-und-überbuchung) zu Quota und Überbuchung
- [Rank Scheduler](https://docs.opennebula.io/7.4/product/cloud_system_administration/scheduler/rank_scheduler/) mit den Strategien des Schedulers
- [VM Groups (Affinity)](https://docs.opennebula.io/7.4/product/cloud_system_administration/capacity_planning/affinity/) mit den Regeln für VM-Gruppen
- [VM HA](https://docs.opennebula.io/7.4/product/control_plane_configuration/high_availability/vm_ha/) mit dem Hook für ausgefallene Hosts
:::
