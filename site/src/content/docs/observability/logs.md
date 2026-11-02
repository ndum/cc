---
title: Logs mit Loki
description: Logs neben Metriken, Loki als einzelner Prozess, Alloy als Sammler auf jedem Node, Labels, Aufbewahrung und erste Abfragen mit LogQL, mit denen du den Fehler eines Deployments findest.
sidebar:
  order: 2
---

:::assignment
«Am Samstag hatten drei Kundinnen beim Bezahlen eine Fehlermeldung», schreibt das Veloatelier Matte. «Könnt ihr herausfinden, was da los war?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Erklären, was Logs zeigen, das Metriken nicht zeigen
- Den Aufbau von Loki und Alloy im Cluster beschreiben
- Logs mit LogQL nach Namespace, Pod und Text filtern und zählen
- Den Fehler eines Deployments in den Logs finden
:::

## Logs und Metriken

Metriken sind Zahlen in festen Abständen. Sie zeigen, dass 5 % der Anfragen scheitern, aber nicht, welche und mit welcher Meldung. Logs sind Textzeilen, die ein Programm bei einem Ereignis schreibt. Sie enthalten die Einzelheiten, kosten aber mehr Speicher. In Kubernetes schreibt jeder Container seine Logs nach Standardausgabe und Standardfehler, der Node legt sie als Dateien ab. `kubectl logs` liest diese Dateien, aber nur, solange der Pod existiert. Wird er ersetzt, sind seine Logs weg.

## Loki und Alloy

Loki sammelt Logs zentral und behält sie über das Ende eines Pods hinaus. Eine Volltextsuche indexiert den ganzen Text. Loki legt einen Index nur über wenige Labels wie Namespace und Pod an und durchsucht den Text erst bei der Abfrage. Das hält Loki klein. Dafür grenzt du jede Suche zuerst mit Labels ein.

Alloy von Grafana läuft als DaemonSet, also mit einem Pod pro Node. Jeder davon liest die Logs der Pods auf seinem Node, versieht sie mit Labels und schickt sie an Loki. Beide kamen mit dem Kopieren in Kapitel 5.1 in dein Repo, als zwei Applications in `apps/loki.yaml`.

![Der Weg der Logs im Cluster. Zwei Nodes des Clusters, k3s-server und k3s-agent. Auf jedem Node schreiben die Pods ihre Logs nach stdout und stderr. Alloy läuft als DaemonSet mit einem Pod pro Node, liest die Logs der Pods auf seinem Node und schickt sie mit den Labels namespace, pod, container und app an Loki. Loki läuft als ein einziger Prozess, legt einen Index nur über die Labels an und behält die Logs drei Tage. In Grafana fragst du Loki unter «Explore» mit LogQL ab. Eine Abfrage wie {namespace="velo", app="webshop"} |= "404" wählt zuerst die Streams über ihre Labels und durchsucht dann den Text. Sie findet auch Zeilen von Pods, die es nicht mehr gibt.](../../../assets/figures/de/p5c2-logs.svg)

::code{file="platform/observability/repo/monitoring/loki.yaml"}

Loki läuft hier als ein einziger Prozess und speichert auf der Disk eines Nodes. Für ein Lab genügt das. Im Betrieb würde man Loki auf mehrere Prozesse verteilen und die Daten in einen Objektspeicher legen. Logs, die älter als drei Tage sind, löscht Loki.

::code{file="platform/observability/repo/monitoring/alloy.yaml"}

Die Konfiguration von Alloy ist eine Kette aus vier Komponenten. `discovery.kubernetes` findet die Pods des eigenen Nodes. `discovery.relabel` macht aus Angaben von Kubernetes die Labels `namespace`, `pod`, `container` sowie `app`. `loki.source.kubernetes` liest die Logs, `loki.write` schickt sie an Loki. Im Testaufbau scheiterte eine Konfiguration, in der ein Block auf einer Zeile stand, mit «expected TERMINATOR». Alloy verlangt jedes Attribut auf einer eigenen Zeile.

Im Lab waren Loki und Alloy 80 Sekunden nach dem Push bereit.

```bash
kubectl -n monitoring get pods -o wide | grep -E 'loki|alloy'
```

## LogQL

Abfragen schreibst du in Grafana unter «Explore» mit der Datenquelle Loki. Eine Abfrage beginnt immer mit einer Auswahl von Streams in geschweiften Klammern.

| Abfrage | Ergebnis |
|---|---|
| `{namespace="velo"}` | alle Logs des Veloateliers |
| `{namespace="velo", app="webshop"} \|= "404"` | Zeilen des Webshops, die `404` enthalten |
| `{namespace="velo"} \|~ "(?i)error\|exception"` | Zeilen, auf die der reguläre Ausdruck passt |
| `{namespace="velo"} != "/healthz"` | alles ausser den Proben von Kubernetes |
| `sum by (pod) (count_over_time({namespace="velo"} \|= " 404 " [5m]))` | Zahl der Zeilen mit 404 pro Pod in fünf Minuten |

`|=` filtert nach Text, `|~` nach einem regulären Ausdruck, `!=` schliesst Zeilen mit dem Text aus. `count_over_time` zählt die Zeilen in einem Zeitfenster und macht aus Logs eine Metrik, die du in Dashboards und Alerts verwenden kannst.

Im Lab erzeugten 20 Aufrufe einer Seite, die es nicht gibt, Zeilen mit `404`.

```bash
for i in $(seq 20); do curl -s -o /dev/null http://<adresse-des-servers>/warenkorb; done
```

```text
10.52.1.10 "GET /warenkorb HTTP/1.1" 404 -
```

Traefik verteilt die Anfragen auf die Pods. Die Abfrage mit `count_over_time` zeigte danach, wie viele dieser Aufrufe jeder Pod beantwortet hatte.

## Labels mit Mass

Jede Kombination von Labels ist in Loki ein eigener Stream. Labels wie Namespace, Pod oder App haben wenige Werte und eignen sich gut. Eine IP-Adresse, eine Bestellnummer oder ein Pfad als Label würden Tausende Streams erzeugen und Loki langsam machen. Was sich oft ändert, bleibt im Text und wird mit `|=` gesucht.

::::exercise[Lab]
Rolle Loki und Alloy aus, erzeuge Aufrufe mit `404` und finde sie in Grafana. Zähle sie pro Pod.

:::solution
`{namespace="velo", app="webshop"} |= "404"` zeigt die Zeilen mit `/warenkorb`, das Label `pod` sagt, welcher Pod geantwortet hat. `sum by (pod) (count_over_time({namespace="velo"} |= " 404 " [5m]))` zeigt eine Zahl pro Pod, zusammen etwa 20.
:::
::::

::::exercise[Fehler finden]
Spiele zuerst den Fehler nach, als wärst du jemand anderes aus dem Team. Der Befehl setzt im Deployment des Webshops die Variable `FAIL_PERCENT` auf `30`. Danach antwortet der Shop auf drei von zehn Anfragen mit einem Fehler.

```bash
cd ~/platform
sed -i '/FAIL_PERCENT/{n;s/value: "0"/value: "30"/}' webshop/deployment.yaml
git commit -am "Webshop anpassen"
git push
```

Rufe den Shop einige Male auf, sobald Argo CD die Änderung übernommen hat. Finde in den Logs heraus, was die Kundschaft erlebt. Suche danach im Git-Verlauf, wer es war. Stelle zum Schluss den alten Stand her.

:::solution
`{namespace="velo", app="webshop"} |= "error"` zeigt Zeilen wie `error: simulated failure on /`, daneben Zeilen mit dem Status `500`. `git log -p webshop/deployment.yaml` zeigt den Commit mit Autor und Änderung, seine Zeit passt zur ersten Fehlerzeile. `git revert` und `git push` stellen den alten Stand her, Argo CD rollt ihn aus.
:::
::::

::::exercise[Ein Label zu viel]
Ein Kollege schlägt vor, in Alloy die IP-Adresse der Kundschaft als Label zu setzen, damit man schneller nach einer Kundin suchen kann. Was antwortest du?

:::solution
Jede Adresse wäre ein eigener Stream, bei vielen Kundinnen und Kunden Tausende. Loki würde langsamer und bräuchte mehr Speicher. Die Adresse steht ohnehin im Text, `{namespace="velo"} |= "10.52.1.10"` findet sie. Dazu kommt der Datenschutz. Eine IP-Adresse ist ein Personendatum. Wer sie speichert, braucht dafür einen Zweck und eine Aufbewahrungsfrist.
:::
::::
