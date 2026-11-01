---
title: Kosten und Ressourceneffizienz
description: Eine Vollkostenrechnung für Wolkenwerk mit Hardware, Strom und Arbeit, ein Preis für ein neues Mitglied, Right-Sizing mit Prometheus und ungenutzte Ressourcen.
sidebar:
  order: 4
---

:::assignment
«Was kostet uns der Betrieb wirklich, und was verlangen wir vom neuen Mitglied?», fragt Beat Kläy. «Die Preise aus dem Showback waren ein Anfang. Ich möchte eine Rechnung sehen, die alles enthält, und wissen, ob wir Ressourcen verschwenden.»
:::

:::goals
Nach diesem Kapitel kannst du

- die Vollkosten einer kleinen Cloud aus Hardware, Strom und Arbeit berechnen,
- daraus einen Preis für ein Mitglied ableiten und begründen,
- reservierte und genutzte Ressourcen mit Prometheus vergleichen,
- Requests und Limits nach Messwerten anpassen,
- ungenutzte Ressourcen finden und ihre Kosten einschätzen.
:::

## Vollkostenrechnung

Kapitel 3.3 hat Preise pro Stunde für CPU, Arbeitsspeicher und Disk in die Vorlage geschrieben. Eine VM mit einer halben CPU und 1 GB kostete damit rund 35 Franken im Monat. Die Preise waren für den Fall erfunden. Ob sie die Kosten decken, zeigt erst eine Rechnung, die alle Kosten enthält. Die Übung in Kapitel 3.3 rechnete mit vereinfachten Zahlen, ohne Front-end und mit wenig Arbeit. Hier kommen alle Posten dazu, darum fällt das Total deutlich höher aus.

| Posten | Annahme | pro Jahr |
|---|---|---|
| Hardware | zwei Knoten für 7 000 und ein Front-end für 2 000 Franken, fünf Jahre | 1 800 Franken |
| Strom | durchschnittlich 300 Watt, 2 628 kWh zu 31,5 Rappen | 828 Franken |
| Arbeit | 10 % einer Vollzeitstelle zu 130 000 Franken mit Sozialabgaben | 13 000 Franken |
| Übriges | Internet, Platz im Rack, Kopie der Backups ausser Haus | 1 500 Franken |
| **Total** | | **17 128 Franken** |

Bis auf den Strompreis sind die Zahlen Annahmen für den Fall. Der Strompreis ist der Tarif 2026 von Energie Wasser Bern für einen Kleinbetrieb im Profil C2, aus den [offenen Daten der ElCom](https://energy.ld.admin.ch/elcom/electricityprice/observation/351-519-C2-standard-2026). Der Median der Schweiz für dasselbe Profil liegt bei 25,1 Rappen.

Die Arbeit macht drei Viertel der Kosten aus, der Strom keine 5 %. Das ist für kleine Plattformen typisch. Wer hier sparen will, spart Arbeitszeit, etwa durch Automatisierung mit OpenTofu und GitOps, durch Self-Service und durch wenige, gut dokumentierte Abläufe.

## Ein Preis für das neue Mitglied

Die einfachste Verteilung folgt den reservierten Ressourcen. Die Knoten haben zusammen 8 CPU und 14,4 GB, die OpenNebula vergeben kann. Ein neues Mitglied mit einem Namespace mit 1 CPU und 1 GB in der Quota und einer VM mit einer halben CPU und 1 GB reserviert 1,5 von 8 CPU, also 18,8 %, und 2 von 14,4 GB, also 13,9 %. Im Mittel sind das 16,3 % der Kosten.

```text
17 128 × 0,163 ≈ 2 795 Franken pro Jahr ≈ 233 Franken pro Monat
```

Mit den Preisen aus Kapitel 3.3 kostete dasselbe Mitglied rund 86 Franken im Monat, 35 für die VM und 51 für den Namespace, gerechnet mit denselben Preisen pro CPU und MB. Die Preise des Showbacks decken nur gut einen Drittel. Sie sind aber nicht falsch, sie zeigen den Verbrauch, nicht den Preis. Ein Vorschlag an den Vorstand könnte einen Grundbeitrag pro Mitglied für die Arbeit vorsehen und den Verbrauch dazu nach Showback abrechnen. Ob Wolkenwerk den Mitgliedern die Kosten wirklich verrechnet oder nur zeigt, ist ein Entscheid der Genossenschaft. Die FinOps Foundation unterscheidet dafür Showback und Chargeback.

Die Rechnung nimmt an, dass die Plattform voll belegt ist. In Wahrheit belegen die VMs von k3s allein 12 der 14,4 GB. Was die Mitglieder nicht kaufen, tragen die anderen mit.

## Right-Sizing

Eine Quota und die Requests eines Pods reservieren Ressourcen, auch wenn der Pod sie nie nutzt. Right-Sizing heisst, die Reservierung an den gemessenen Verbrauch anzupassen. Prometheus kennt beides. Die erste Abfrage zeigt die Requests pro Namespace, die zweite das 95. Perzentil des tatsächlichen Verbrauchs der letzten Stunde.

```text
sum by (namespace) (kube_pod_container_resource_requests{resource="cpu"})

quantile_over_time(0.95,
  sum by (namespace) (rate(container_cpu_usage_seconds_total{container!=""}[5m]))[1h:1m])
```

Für den Arbeitsspeicher zählt der höchste Wert, denn ein Container, der sein Limit überschreitet, wird beendet.

```text
sum by (namespace) (kube_pod_container_resource_requests{resource="memory"}) / 2^20

sum by (namespace) (max_over_time(container_memory_working_set_bytes{container!=""}[1h])) / 2^20
```

Im Lab ergab sich nach einem Lasttest dieses Bild.

| Namespace | CPU reserviert | CPU genutzt, p95 | Speicher reserviert | Speicher genutzt, max |
|---|---|---|---|---|
| velo | 0,3 | 0,55 | 384 MiB | 197 MiB |
| ai | 1,02 | 0,22 | 2 112 MiB | 3 391 MiB |
| probe | 0,05 | 0 | 64 MiB | 21 MiB |

Die Messung stammt aus dem Lab des Kurses. Dort heisst das eigene Mitglied aus Meilenstein 4 `probe`, bei dir steht an dieser Stelle der Namespace deines Mitglieds.

Die Zahlen sagen Verschiedenes. Beim Webshop lag der Verbrauch über den Requests, weil das HPA die Pods nach Auslastung der Requests skaliert. Die Requests sind dort ein Werkzeug der Skalierung, kein Fehler. Ollama reservierte viermal mehr CPU, als es brauchte, aber ein Drittel zu wenig Speicher. Mit dem geladenen Modell nutzte es 3,3 GiB bei einem Request von 2 GiB. Wird der Speicher auf dem Node knapp, beendet Kubernetes zuerst Pods, die mehr nutzen, als sie reserviert haben. Ein besserer Request wäre etwa 0,5 CPU und 3,5 GiB Speicher. Die Änderung gehört in `ai/ollama.yaml` und damit in einen Pull Request.

Eine Stunde ist für solche Entscheide zu kurz. Ein Samstag im Frühling sieht anders aus als ein Dienstag im Januar. Grafana zeigt dieselben Abfragen über Wochen, und erst dann lohnt sich eine Änderung.

## Ungenutzte Ressourcen

Was läuft und nichts tut, kostet trotzdem. Typisch sind VMs, die nach einem Test weiterlaufen, alte Images und Backups, die niemand mehr braucht, und Namespaces von Projekten, die beendet sind. OpenNebula und Kubernetes zeigen sie.

```bash
onevm list
oneimage list
kubectl top pods -A --sort-by=cpu | tail
```

Im Lab nutzte eine VM mit 1 GB Arbeitsspeicher im Leerlauf 253 MB. Der Knoten musste trotzdem das ganze GB bereithalten und lagerte dafür rund 200 MB auf die Disk aus. Eine VM, die nur tagsüber gebraucht wird, lässt sich mit `onevm undeploy` aus Kapitel 4.2 nachts vom Knoten nehmen. Sie belegt dann nur noch ihre Disk.

Auch der Strom hängt an der Belegung. Ein Server im Leerlauf braucht einen grossen Teil seiner Spitzenleistung. Zwei halb leere Knoten verbrauchen darum mehr als ein voller. Eine kleine Genossenschaft kann wenig an der Hardware ändern, aber sie kann ungenutzte VMs entfernen und die Mitglieder mit dem Showback dazu bringen, ihre eigenen aufzuräumen.

## Ausblick

OpenCost rechnet die Kosten eines Clusters pro Namespace, Deployment und Pod aus, mit Preisen pro CPU und GB, und zeigt ungenutzte Reservierungen. Es läuft im Cluster und liest aus Prometheus. Für den Kurs genügen die Abfragen oben und die Rechnung in einer Tabelle.

::::exercise[Kostenmodell]
Erstelle das Kostenmodell für dein Mitglied aus Meilenstein 4. Rechne mit den Vollkosten oben oder mit eigenen begründeten Annahmen und vergleiche das Ergebnis mit dem Showback aus Kapitel 3.3.

:::solution
Das Modell nennt die Ressourcen des Mitglieds aus Quota und VM, den Anteil an der Kapazität, den Preis pro Monat aus den Vollkosten und den Betrag aus dem Showback. Es erklärt den Unterschied mit der Arbeit, die im Showback fehlt, und schlägt eine Verrechnung vor, etwa Grundbeitrag plus Verbrauch. Eigene Annahmen sind erlaubt, wenn sie begründet sind.
:::
::::

::::exercise[Right-Sizing]
Vergleiche Requests und Verbrauch der Namespaces in deinem Lab über mindestens einen Tag und passe einen Request über einen Pull Request an. Begründe den neuen Wert.

:::solution
Die Abfragen zeigen pro Namespace Reservierung und Verbrauch. Ein guter Kandidat ist Ollama mit zu viel CPU und zu wenig Speicher. Der neue Wert liegt etwas über dem gemessenen Maximum beim Speicher und nahe am 95. Perzentil bei der CPU. Beim Webshop bleiben die Requests klein, weil das HPA darauf rechnet.
:::
::::

::::exercise[Aufräumen]
Suche in deinem Lab ungenutzte VMs, Images, Backups und Namespaces. Schätze, was sie nach der Rechnung oben im Jahr kosten, und räume auf, was niemand braucht.

:::solution
`onevm list`, `oneimage list` und `kubectl get ns` zeigen die Kandidaten, etwa VMs aus Tests, Backup-Images alter VMs und Vorlagen aus `oneimage restore`. Eine VM mit einer halben CPU und 1 GB belegt rund 6 % der CPU und 7 % des Speichers, nach der Vollkostenrechnung etwa 1 100 Franken im Jahr. Gelöscht wird nur, was niemand mehr braucht und was nicht als Backup dient.
:::
::::
