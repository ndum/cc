---
title: Zusatzaufträge
description: Ein Dienst der Treuhand in OneFlow, der nach Last und Zeitplan wächst, ein monatlicher Bericht aus dem Showback mit der Kostendeckung und die Folgen eines ausgefallenen Knotens mit einem Vorschlag für die Platzierung der VMs.
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

Die drei Aufträge dieses Kapitels sind die Zusatzaufträge von [Meilenstein 1](../../assessment/milestone-1/). Weder die Basis noch Teil 4 setzen sie voraus. Anders als die Kapitel davor gibt dir dieses Kapitel keine Anleitung zum Nachbauen. Du entwirfst eine eigene Lösung, setzt sie in deinem Lab um und begründest deine Entscheide. Die Abschnitte zu den Konzepten erklären, was du für den Entwurf wissen musst. Zu jedem Auftrag folgen danach das Ziel, die Anforderungen an deine Lösung, der Inhalt der Vorführung und Hinweise auf die Dokumentation.

Für alle drei Aufträge zusammen rechnest du mit vier bis sechs Stunden, du kannst auch nur einzelne bearbeiten. Du zeigst sie live im Unterricht oder in einem Screencast von höchstens zehn Minuten, wie es der Meilenstein unter [Zusatzaufträge zeigen](../../assessment/milestone-1/#zusatzaufträge-zeigen) beschreibt. In derselben Vorführung beantwortest du die zwei Fragen aus dem Check `m1`. KI-Assistenten darfst du nach den [Regeln des Kurses](../../start/overview/#ki-werkzeuge) einsetzen. Halte in der Dokumentation fest, wofür du sie gebraucht hast. Jede Zeile deiner Lösung musst du in der Vorführung erklären können.

Jeder Auftrag gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../../assessment/#stufen-der-zusatzaufträge). Eine Lösung, die läuft, gibt 1 Punkt. Erklärst du sie mit den Werten und Ausgaben deines Labs, sind es 2 Punkte. Für 3 Punkte kommt ein eigener Entscheid dazu, den du gegen eine Alternative abwägst. Die Konzepte unten nennen Abwägungen, an denen sich ein solcher Entscheid festmachen lässt.

## Elastizität

Elastizität gehört zu den [fünf Merkmalen einer Cloud](../../basics/characteristics/#die-fünf-merkmale-nach-nist), das NIST nennt sie Rapid Elasticity. Ressourcen wachsen mit der Last und schrumpfen wieder, im besten Fall ohne dass jemand eingreift. Beim Self-Service aus Kapitel 3.4 startet ein Mitglied selbst eine VM, wenn es eine braucht. Bei der Elastizität passt das System die Zahl der VMs selbst an, nach Regeln, die vorher jemand festgelegt hat.

Für die Treuhand heisst das, dass am Monatsende niemand eine VM von Hand starten muss. Die Regeln müssen den Dienst dafür rechtzeitig wachsen lassen und danach wieder verkleinern. Jede VM, die länger läuft als nötig, erscheint im Showback der Treuhand.

## Dienste und Rollen

OneFlow verwaltet in OpenNebula Dienste aus mehreren VMs. Ein Dienst besteht aus Rollen, etwa einer Datenbank und mehreren Anwendungsservern. Jede Rolle startet ihre VMs aus einer VM-Vorlage. Die Kardinalität ist die Zahl der VMs einer Rolle. Hat eine Rolle Regeln für die Elastizität, begrenzen `min_vms` und `max_vms` ihre Kardinalität. Die Regeln ändern sie nur innerhalb dieser Grenzen.

Den Aufbau eines Dienstes beschreibt eine Dienstvorlage. Beim Instanziieren entsteht aus ihr der Dienst. Du legst sie mit der CLI `oneflow-template` oder in Sunstone an. Eine Rolle beschreibst du vor allem mit diesen Angaben.

| Angabe | Bedeutung |
|---|---|
| `template_id` | Nummer der VM-Vorlage, aus der die Rolle ihre VMs startet |
| `cardinality` | Zahl der VMs beim Start |
| `min_vms`, `max_vms` | Grenzen, innerhalb derer die Regeln die Kardinalität ändern |
| `elasticity_policies` | Regeln nach Last |
| `scheduled_policies` | Regeln nach Zeitplan |
| `cooldown` | Sekunden nach einer Änderung, in denen keine weitere Regel greift |

OpenNebula speichert Dienstvorlagen und Dienste als Dokumente. Eine Gruppe braucht deshalb das Recht, Dokumente anzulegen, das die Mitglieder seit [Kapitel 3.1](../groups/#gruppen-und-gruppenadmins) haben. Wie VM-Vorlagen haben Dienstvorlagen Rechte für Besitzer, Gruppe und alle anderen.

Die VMs eines Dienstes gehören dem Besitzer des Dienstes und zählen gegen die Quota seiner Gruppe. Instanziiert `treuhand-admin` den Dienst, belastet er also die Quota der Treuhand. Den SSH-Schlüssel übernimmt jede VM des Dienstes wie in Kapitel 2.4 vom Benutzer, der den Dienst gestartet hat.

Offen ist auch, wer die Dienstvorlage anlegt. Legt das Plattform-Team sie an und gibt sie frei, gehört sie zum [Katalog](../self-service/#der-servicekatalog) aus Kapitel 3.4. Das Plattform-Team pflegt sie dann, auch andere Mitglieder können sie nutzen. Legt die Treuhand sie selbst an, gehört sie ihr. Sie passt die Regeln dann selbst an und trägt die Verantwortung dafür.

## Regeln nach Last

Eine Regel nach Last prüft einen Ausdruck über Werte der VMs einer Rolle, etwa `CPU > 75`. Die Werte stammen aus der Überwachung von OpenNebula. `CPU` gibt an, wie viel Prozent einer CPU die VM gerade verbraucht. Gilt der Ausdruck über `period_number` aufeinanderfolgende Perioden von `period` Sekunden, ändert die Regel die Kardinalität. Die Art der Änderung legen `type` und `adjust` fest, etwa mit `CHANGE` und `1` eine VM mehr oder mit `PERCENTAGE_CHANGE` einen Anteil der aktuellen Zahl.

OneFlow bildet den Wert eines Ausdrucks als Mittel über alle laufenden VMs der Rolle. Eine VM unter Volllast und eine leere VM ergeben im Mittel 50 %. Liegt die Schwelle höher, wächst eine Rolle mit zwei VMs deshalb nicht weiter, solange nur eine davon arbeitet. Ob das zur Treuhand passt, hängt davon ab, wie sich ihre Last auf die VMs verteilt.

Nach jeder Änderung steht der Dienst im Zustand `COOLDOWN`. Solange dieser dauert, greift keine weitere Regel, auch nicht die einer anderen Rolle. Die Dauer setzt `cooldown` in der Rolle. Ohne diese Angabe gilt der Standardwert aus `/etc/one/oneflow-server.conf`.

Bis eine neue VM arbeitet, vergeht Zeit. Der Ausdruck muss über alle Perioden gelten, danach startet die VM. Auch die Überwachung liefert neue Werte erst mit Verzögerung. OneFlow prüft die Regeln zudem nur alle 90 Sekunden, so steht es unter `:autoscaler_interval:` in `/etc/one/oneflow-server.conf`. Eine kürzere Periode wirkt deshalb wie eine von 90 Sekunden. Im Lab des Kurses lief die zweite VM rund zweieinhalb Minuten nach dem Beginn der Last, mit einer Regel über zwei Perioden von 30 Sekunden. Ohne Last schrumpfte der Dienst nach knapp sechs Minuten wieder, weil die Regel zum Schrumpfen absichtlich träger war. Eine träge Regel zum Schrumpfen verhindert, dass der Dienst bei kurzen Schwankungen der Last hin und her springt. Dafür bezahlt die Treuhand die zusätzliche VM etwas länger.

Neben der CPU kann ein Ausdruck auch Werte verwenden, die eine Anwendung selbst meldet, etwa die Länge einer Warteschlange. Die VM meldet sie über OneGate. Dafür braucht sie ein Token im Kontext und muss OneGate über das Netz erreichen. Im Lab hört OneGate nur lokal auf dem Front-end, wie die [Liste der Dienste](../../iaas/installation/#die-installierten-dienste) in Kapitel 2.2 zeigt. Für den Auftrag genügt die CPU.

## Regeln nach Zeitplan

Die Treuhand weiss im Voraus, wann ihre Last kommt. Eine Regel nach Zeitplan ändert die Kardinalität zu einer festen Zeit, ohne auf die Last zu warten. `recurrence` legt eine wiederkehrende Zeit als Ausdruck im Format von cron fest, `start_time` einen einzelnen Zeitpunkt. Die Änderung bestimmen wie bei den Regeln nach Last `type` und `adjust`. Mit `CARDINALITY` setzt eine Regel die Zahl der VMs auf einen festen Wert. Im Lab löste eine Regel, die alle zwei Minuten galt, bei der ersten Prüfung nach der geraden Minute aus und setzte die Rolle von einer auf zwei VMs. Eine Regel nach Zeitplan greift also bis zu 90 Sekunden nach ihrer Zeit.

Regeln nach Zeitplan und nach Last lassen sich in derselben Rolle kombinieren. Der Zeitplan deckt die bekannte Spitze am Monatsende ab, die Regel nach Last fängt unerwartete Spitzen auf. Beide ändern dieselbe Kardinalität. Prüfe deshalb, ob deine Regel zum Schrumpfen wieder wegnimmt, was der Zeitplan eben hinzugefügt hat, solange die Last noch fehlt. Überlege dir auch, welche Tage für die Treuhand zum Monatsende gehören und wann der Dienst wieder klein sein soll.

## Quota und Kapazität

Jede VM des Dienstes zählt gegen die [Quota der Treuhand](../quotas/#die-quotas-der-mitglieder) mit vier VMs, 2 CPU und 4096 MB. Darin laufen auch ihre anderen VMs, etwa `treuhand-1` aus Kapitel 3.3. Will eine Regel mehr VMs starten, als die Quota zulässt, lehnt OpenNebula die zusätzlichen VMs ab wie in Kapitel 3.2. Der Dienst steht danach auf `FAILED_SCALING` und keine seiner Regeln greift mehr, bis die Quota wieder Platz hat und jemand `oneflow recover` aufruft. `max_vms`, die Grösse der VMs und die Quota müssen deshalb zusammenpassen.

Die Quota begrenzt nur, was die Treuhand reservieren darf. Ob die Knoten den Platz auch haben, beschreibt Kapitel 3.2 unter [Quota und Überbuchung](../quotas/#quota-und-überbuchung). Ab Kapitel 4.2 belegt zudem der Kubernetes-Cluster die Knoten.

## Timer von systemd

Ubuntu 26.04 bringt auf den Servern des Labs kein cron mit. Wiederkehrende Aufgaben plant dort systemd mit Timern. Ein Timer ist eine Unit mit der Endung `.timer`. Läuft er ab, startet er eine andere Unit, ohne weitere Angabe den Dienst mit demselben Namen und der Endung `.service`. Dieser Dienst führt dann dein Skript aus.

Wann ein Timer abläuft, legt `OnCalendar=` mit einem Kalenderausdruck fest. Die Kurzform `monthly` steht zum Beispiel für den Ersten jedes Monats um Mitternacht. `systemd-analyze calendar` zeigt, wann ein Ausdruck das nächste Mal zutrifft. Mit `Persistent=` speichert systemd den Zeitpunkt des letzten Laufs auf der Disk. War der Server zur geplanten Zeit ausgeschaltet, holt systemd den Lauf nach dem nächsten Start nach. Ohne diese Option fällt er aus.

Neben den Units des Systems kennt systemd Units einzelner Benutzer. Eine Unit des Systems läuft auch, wenn niemand angemeldet ist. Mit `User=` legst du fest, unter welchem Benutzer ihr Dienst läuft. Die Units eines Benutzers laufen ohne weitere Einstellung nur, solange er angemeldet ist. `loginctl enable-linger` ändert das.

Der Dienst braucht Zugang zur CLI von OpenNebula. Sie meldet sich mit der Datei `~/.one/one_auth` des Benutzers an, unter dem sie läuft, wie [Kapitel 2.2](../../iaas/installation/#die-cli-als-dein-benutzer) zeigt. Diese Datei enthält das Passwort von `oneadmin` und gehört weder in dein Skript noch in dein Abgabe-Repo.

`systemctl list-timers` zeigt die Timer mit ihrem letzten und ihrem nächsten Lauf. Die Ausgabe deines Skripts landet im Journal, `journalctl` mit dem Namen des Dienstes zeigt sie an.

## Der monatliche Bericht

OpenNebula bringt selbst den Timer `opennebula-showback.timer` mit, der den Showback täglich berechnet. Wann er läuft, zeigt `systemctl list-timers`. Dein Bericht kann auf diese Berechnung aufbauen oder den vergangenen Monat selbst berechnen. Läuft dein Timer zur selben Zeit wie der von OpenNebula, ist offen, welcher zuerst fertig ist. Rechnet dein Skript selbst, wiederholt es eine Arbeit, die OpenNebula schon erledigt. Die [Dokumentation zum Showback](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/) empfiehlt bei vielen VMs, nur die fehlenden Monate zu berechnen, weil die Berechnung aufwendig ist. Laut derselben Dokumentation führst du `oneshowback calculate` als `oneadmin` aus.

Mit `-s` und `-e` wählt `oneshowback list` die Monate aus, `--csv` gibt die Liste als CSV aus und `-g` beschränkt sie auf eine Gruppe. Enthält der Bereich den laufenden Monat, rechnet OpenNebula die Kosten bis zum heutigen Tag.

Ein Bericht muss sich wiederholen lassen. Läuft dein Skript zweimal für denselben Monat, etwa nach einem Neustart, soll dieselbe Datei entstehen, ohne dass Zeilen doppelt vorkommen. Ein Dateiname mit Jahr und Monat zeigt auf einen Blick, welchen Monat eine Datei enthält.

## Kostendeckung

Die Preise in der Vorlage `ubuntu` sind für den Fall erfunden. Ob sie die Kosten der Genossenschaft decken, zeigt erst der Vergleich mit allen Kosten eines Monats. Dazu gehören laut [Kapitel 3.3](../showback/#die-kosten-einer-vm) die Hardware über ihre Lebensdauer, Strom, Lizenzen, Backup, die Arbeit des Plattform-Teams und die Reserve für Wartung aus Kapitel 2.5. Die Kostendeckung ist das Verhältnis zwischen der Summe aus dem Showback eines Monats und diesen Kosten. Liegt sie unter 100 %, decken die Preise die Kosten nicht, selbst wenn die Genossenschaft sie verrechnet.

Die Zahlen des Labs sind klein. Im Lab laufen nur wenige VMs, meist erst seit einigen Tagen. Ein Monat im Lab sagt deshalb wenig über einen Monat im Betrieb. Du triffst Annahmen, etwa wie viele VMs im Mittel laufen oder welche Kosten die Genossenschaft im Jahr hat. Diese Annahmen legst du offen. Die Aufgabe «Kostenmodell» in Kapitel 3.3 nennt Werte, die du übernehmen oder durch eigene ersetzen kannst. Ebenso lässt sich rechnen, wie viele VMs im Mittel laufen müssten, damit die Preise die Kosten decken.

Reicht die Deckung nicht, kann die Genossenschaft die Preise erhöhen, für mehr Auslastung sorgen oder von jedem Mitglied einen festen Beitrag für die Arbeit des Plattform-Teams verlangen. Jeder dieser Wege trifft die Mitglieder anders, etwa die Gemeinde mit ihrem festen Budget.

## Folgen eines Ausfalls

Fällt ein Knoten aus, laufen seine VMs nicht mehr. Nach einiger Zeit zeigt `onehost list` den Knoten als `err` und `onevm list` seine VMs als `unkn`, wie [Kapitel 2.5](../../iaas/hosts/#ausfall-eines-knotens) beschreibt. Gehört eine dieser VMs zu einem Dienst von OneFlow, setzt OneFlow den Dienst auf `WARNING`. Im Lab liegen die Disks laufender VMs im Datastore `system` des Knotens selbst. Solange der Knoten aus ist, kommt niemand an diese Disks.

OpenNebula liefert ein Skript mit, das als Hook startet, sobald ein Host in den Zustand `ERROR` wechselt. Mit `-m` verschiebt es die VMs des Hosts auf einen anderen, aber nur, wenn ihre Disks auf gemeinsamem Speicher wie NFS oder Ceph liegen. VMs auf lokalen Datastores überspringt es. Sie starten erst wieder, wenn ihr Host zurück ist. Mit `-r` löscht das Skript die VMs und legt sie neu an, ihr Zustand geht dabei verloren. Für eine VM ohne eigene Daten kann das genügen. Eine VM, die Daten hält, verliert dabei ihren Stand.

Bevor ein solches Skript VMs anderswo startet, muss es sicherstellen, dass der ausgefallene Host wirklich aus ist. Ohne dieses Fencing kann ein kurzer Netzfehler dazu führen, dass dieselbe VM auf zwei Hosts läuft. Wie schnell ein Host als ausgefallen gilt, hängt von den Zeiten der Überwachung in `/etc/one/monitord.conf` ab. Mit `-p` wartet das Skript einige Zyklen der Überwachung ab. Kommt der Host in dieser Zeit zurück, startet es seine VMs nicht anderswo neu.

Im Lab fehlen gemeinsamer Speicher und dieser Hook bewusst, damit es mit drei Servern auskommt. Ein Ausfall trifft die Mitglieder deshalb so lange, bis der Knoten wieder läuft.

## Platzierung und Ausfall

Wo eine neue VM läuft, entscheidet der Scheduler nach den Regeln aus [Kapitel 2.5](../../iaas/hosts/#platzierung-durch-den-scheduler). Im Lab verteilt Striping die VMs auf beide Knoten. Packing füllt zuerst einen Knoten, damit sich leere Knoten ausschalten lassen. Fällt ein Knoten aus, trifft es mit Packing aber mehr VMs auf einmal. Die Strategie in `/etc/one/schedulers/rank.conf` gilt für alle VMs ohne eigene Regel. Mit `SCHED_RANK` und `SCHED_REQUIREMENTS` in einer Vorlage bekommen einzelne Mitglieder oder Dienste eigene Regeln.

Striping richtet sich nach der Zahl der laufenden VMs eines Knotens. Ob zwei VMs desselben Dienstes auf verschiedenen Knoten landen, hängt deshalb auch von den übrigen VMs ab. Eine feste Trennung erreichst du mit VM-Gruppen. Eine VM-Gruppe fasst VMs in Rollen zusammen und bestimmt für jede Rolle, ob ihre VMs auf denselben Host gehören (`AFFINED`) oder auf verschiedene (`ANTI_AFFINED`). Diese Rollen sind ein eigenes Konzept und nicht dieselben wie die Rollen in OneFlow. Der Scheduler hält die Regeln einer VM-Gruppe strikt ein. Findet er keinen passenden Host, bleibt die VM im Zustand `pend`. Mit zwei Knoten laufen von einer Rolle mit `ANTI_AFFINED` deshalb höchstens zwei VMs gleichzeitig, während eines Ausfalls nur noch eine.

Dazu kommt die Reserve. Bei zwei Knoten muss für eine Wartung jeder allein alle VMs tragen, wie Kapitel 2.5 unter [Wartung eines Knotens](../../iaas/hosts/#wartung-eines-knotens) zeigt. Ein Ausfall verlangt dasselbe ohne Vorwarnung. Die Quotas der vier Mitglieder ergeben zusammen mehr, als ein einzelner Knoten trägt. Schöpfen alle ihre Quota aus, haben nach einem Ausfall nicht alle VMs Platz. Ein Vorschlag für die Platzierung sagt deshalb auch, welche Mitglieder bei einem Ausfall Vorrang haben. Wie stark die Mitglieder auf Verfügbarkeit angewiesen sind, zeigt ihr [Schutzbedarf](../../basics/sovereignty/#schutzbedarf) aus Kapitel 1.4.

## Auftrag A · Elastizität mit OneFlow

Die Treuhand bekommt einen Dienst in OneFlow, der Ende Monat mehr Leistung bereitstellt, ohne dass jemand eingreift. Er wächst nach Zeitplan vor der bekannten Spitze und nach Last bei unerwarteten Spitzen. Danach schrumpft er wieder, damit er die Treuhand nicht mehr kostet als nötig.

Deine Lösung erfüllt diese Anforderungen:

1. Ein Dienst in OneFlow läuft in der Gruppe `treuhand`, seine VMs zählen gegen die Quota der Treuhand.
2. Eine Rolle des Dienstes wächst unter Last und schrumpft ohne Last wieder, innerhalb fester Grenzen.
3. Eine Regel nach Zeitplan vergrössert den Dienst vor dem Monatsende und verkleinert ihn danach wieder, in derselben oder in einer eigenen Rolle.
4. Die Grenzen der Rolle passen zur Quota der Treuhand, auch neben ihren anderen VMs.

In der Vorführung zeigst du:

- Den Dienst mit seinen Rollen und Regeln
- Wie die Rolle unter Last wächst und nach dem Ende der Last wieder schrumpft, mit den Zeiten aus deinem Lab
- Wie du geprüft hast, dass die Regel nach Zeitplan auslöst
- Warum du Schwellen, Perioden und Grenzen so gewählt hast

Die Dokumentation von OpenNebula 7.4 beschreibt unter [OneFlow Services Management](https://docs.opennebula.io/7.4/product/virtual_machines_operation/multi-vm_workflows/appflow_use_cli/) den Aufbau einer Dienstvorlage und die Befehle `oneflow-template` und `oneflow`. Die Regeln nach Last und nach Zeitplan, ihre Ausdrücke und die Zustände eines Dienstes stehen unter [OneFlow Services Auto-scaling](https://docs.opennebula.io/7.4/product/virtual_machines_operation/multi-vm_workflows/appflow_elasticity/), die Werte der Überwachung einer VM unter [Resource Metrics](https://docs.opennebula.io/7.4/product/cloud_system_administration/resource_monitoring/metrics/). Die Standardwerte des Servers und seine Logs findest du unter [OneFlow Configuration](https://docs.opennebula.io/7.4/product/operation_references/opennebula_services_configuration/oneflow/). Antwortet OneFlow nicht, prüfst du den Dienst `opennebula-flow` aus [Kapitel 2.2](../../iaas/installation/#die-installierten-dienste).

Als Mitglied arbeitest du wie in [Kapitel 3.1](../groups/#als-mitglied-arbeiten) mit der Datei, auf die `ONE_AUTH` zeigt, oder in Sunstone mit der Ansicht `groupadmin` aus Kapitel 3.4. `oneflow show` zeigt die Rollen, ihre VMs und das Log des Dienstes mit jeder Änderung der Kardinalität. Last erzeugst du in einer VM des Dienstes mit einem Prozess, der die CPU voll auslastet, etwa `yes`. Starte die Last vor der Vorführung, denn das Wachsen dauert einige Minuten. Für die Regel nach Zeitplan überlegst du dir, wie du ihr Auslösen belegst, ohne bis zum Monatsende zu warten.

## Auftrag B · Showback als Bericht

Der Vorstand will jeden Monat sehen, was die Mitglieder gekostet haben, ohne dass jemand daran denken muss. Ein eigenes Skript erstellt den Bericht, ein eigener Timer von systemd startet es jeden Monat. Aus dem Bericht berechnest du, ob die Preise die Kosten der Genossenschaft decken.

Deine Lösung erfüllt diese Anforderungen:

1. Ein eigenes Skript legt den Showback des vergangenen Monats als CSV-Datei ab, deren Name den Monat nennt.
2. Ein eigener Timer von systemd startet das Skript einmal im Monat. Sein Name enthält `showback` und beginnt nicht mit `opennebula-`.
3. Läuft das Skript ein zweites Mal für denselben Monat, entsteht dieselbe Datei ohne doppelte Zeilen.
4. Aus dem Bericht berechnest du die Kosten pro Mitglied und die Kostendeckung der Genossenschaft mit offengelegten Annahmen.

In der Vorführung zeigst du:

- Den Timer mit seinem letzten und seinem nächsten Lauf
- Einen Lauf, den du von Hand startest, mit der Datei, die er ablegt
- Die Kostendeckung mit deinen Annahmen und einem Vorschlag an den Vorstand

Die [Dokumentation zum Showback](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/) von OpenNebula 7.4 beschreibt `oneshowback calculate` und `oneshowback list` mit ihren Optionen. Für die Units helfen die Handbuchseiten von Ubuntu 26.04 zu [systemd.timer](https://manpages.ubuntu.com/manpages/resolute/man5/systemd.timer.5.html), [systemd.service](https://manpages.ubuntu.com/manpages/resolute/man5/systemd.service.5.html) und den Kalenderausdrücken in [systemd.time](https://manpages.ubuntu.com/manpages/resolute/man7/systemd.time.7.html). [Kapitel 3.3](../showback/) erklärt Preise, Showback und den Export als CSV. Die Aufgabe «Kostenmodell» dort rechnet die Kostendeckung mit einfachen Zahlen vor. Das Skript schreibst du etwa in Bash oder Python, beides ist auf dem Front-end vorhanden.

Lief dein Lab im vergangenen Monat noch nicht, ist der Bericht für diesen Monat leer. Plane deshalb, wie du in der Vorführung einen Bericht mit Daten zeigst, zum Beispiel für den laufenden Monat. Fehlt die Datei nach einem Lauf, zeigt `journalctl`, was dein Dienst ausgegeben hat.

## Auftrag C · Ausfall eines Knotens

Beat Kläy will wissen, was die Mitglieder bei einem Ausfall merken. Du schaltest einen Knoten ohne Vorwarnung aus, beobachtest die Folgen für die VMs der Mitglieder und bringst das Lab danach wieder in Betrieb. Aus deinen Beobachtungen leitest du einen Vorschlag ab, wie Wolkenwerk seine VMs platzieren soll.

Deine Lösung erfüllt diese Anforderungen:

1. Vor dem Ausfall laufen VMs mehrerer Mitglieder auf beiden Knoten. Du hältst fest, welche VM wo läuft.
2. Du schaltest einen Knoten hart aus und hältst mit Zeiten fest, was OpenNebula danach zu Knoten, VMs und Diensten anzeigt.
3. Nach dem Wiedereinschalten laufen alle VMs wieder. Du hältst fest, was du dafür tun musstest.
4. Dein Vorschlag für die Platzierung stützt sich auf deine Beobachtungen. Er nennt eine Strategie oder Regel, eine Alternative und die Abwägung für die vier Mitglieder.

In der Vorführung zeigst du:

- Die Verteilung der VMs vor dem Ausfall
- Den Zustand von Knoten und VMs während des Ausfalls mit den Zeiten, die du gemessen hast
- Was du nach dem Wiedereinschalten tun musstest
- Deinen Vorschlag mit Alternative und Abwägung

[Kapitel 2.5](../../iaas/hosts/) beschreibt die Zustände von Hosts und VMs, den Scheduler, die Wartung und den Ausfall eines Knotens, [Kapitel 3.2](../quotas/#quota-und-überbuchung) Quota und Überbuchung. In der Dokumentation von OpenNebula 7.4 findest du die Strategien des Schedulers unter [Rank Scheduler](https://docs.opennebula.io/7.4/product/cloud_system_administration/scheduler/rank_scheduler/), die Regeln für VM-Gruppen unter [VM Groups (Affinity)](https://docs.opennebula.io/7.4/product/cloud_system_administration/capacity_planning/affinity/) und den Hook für ausgefallene Hosts unter [VM HA](https://docs.opennebula.io/7.4/product/control_plane_configuration/high_availability/vm_ha/).

Ein echter Ausfall kündigt sich nicht an. Schalte die VM des Knotens deshalb aus, ohne Ubuntu darin herunterzufahren. Lege vorher von allen drei Servern einen Snapshot an, wie [Kapitel 0.4](../../start/prepare/) es empfiehlt. Damit kommst du zurück, falls eine VM danach nicht mehr startet. Beobachte `onehost list` und `onevm list` in kurzen Abständen und notiere die Zeiten. Läuft der Dienst aus Auftrag A, beobachte auch ihn. Welche Befehle den Zustand einer VM ändern, steht in Kapitel 2.5 unter [Lebenszyklus einer VM](../../iaas/hosts/#lebenszyklus-einer-vm). Zeigst du den Auftrag nach Kapitel 4.2, beachte den Hinweis zum Kubernetes-Cluster im Meilenstein. Setzt du einen Teil deines Vorschlags im Lab um, etwa für die VMs eines Mitglieds, kannst du seine Wirkung in der Vorführung zeigen.
