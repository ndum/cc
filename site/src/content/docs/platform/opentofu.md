---
title: OpenTofu mit OpenNebula
description: Platz auf den Knoten schaffen, OpenTofu, kubectl und Helm installieren und zwei VMs mit Provider, Data Sources, Variablen, Outputs und State aus Code anlegen, ändern und neu bauen.
sidebar:
  order: 2
---

:::assignment
«Fangt mit den zwei Maschinen für die Container an», schreibt Simone Wyss. «Wenn ihr sie in zehn Minuten weggeworfen und wieder aufgebaut habt, glaube ich euch das mit dem Code.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Begründen, warum die VMs aus Teil 2 und 3 den Platz für den Cluster freigeben müssen
- OpenTofu mit dem Provider für OpenNebula einrichten
- Provider, Data Sources, Variablen, Ressourcen und Outputs in einer Konfiguration erkennen
- VMs mit `tofu plan` und `tofu apply` anlegen, ändern, ersetzen und löschen
- Erklären, warum der State geheime Werte enthält und nicht in Git gehört
:::

## Platz auf den Knoten

Der Kubernetes-Cluster von Teil 4 läuft auf zwei VMs mit je 6 GB Arbeitsspeicher, auf jedem Knoten eine. So viel braucht er spätestens in Teil 5 mit Prometheus und Loki. Ein lokales Sprachmodell aus den Zusatzaufträgen braucht zusätzlich Platz. Jeder Knoten hat 8 GB, davon meldet OpenNebula 7,2 GB für VMs. `onehost list` zeigt das in der Spalte `ALLOCATED_MEM`. Für den Knoten selbst zieht OpenNebula davon nichts ab, obwohl Ubuntu, libvirt und die Dienste von OpenNebula rund 0,6 GB brauchen.

OpenNebula reserviert für jede VM den ganzen Speicher aus ihrer Vorlage auf ihrem Knoten, auch wenn die VM ihn gerade nicht braucht. Neben dem Cluster meldet OpenNebula auf jedem Knoten noch 1,2 GB frei. Eine VM mit 1 GB passt dort nur dank dem Swap aus Kapitel 0.4, wie Kapitel 6.2 zeigt. Die drei Webserver aus Teil 2, die VMs der Praxis und der Dienst der Treuhand aus Teil 3 belegen zusammen 6 GB. Mit ihnen startet der Cluster nicht, OpenNebula fände keinen Knoten mit 6 GB frei.

![Der Speicher eines Knotens. Ein Balken zeigt die 8 GB eines Knotens. 0,8 GB behalten Kernel und Firmware, die übrigen 7,2 GB meldet OpenNebula für VMs, ohne abzuziehen, was der Knoten selbst braucht. Davon reserviert die k3s-VM 6 GB, auf einem Knoten der Server, auf dem anderen der Agent. Laut OpenNebula bleiben 1,2 GB frei, davon braucht das System des Knotens rund 0,6 GB. Achte darauf, dass eine weitere VM mit 1 GB nur dank dem Swap des Knotens Platz hat.](../../../assets/figures/de/p4c2-memory.svg)

Darum räumst du als Erstes auf. Die Gruppen, Quotas, Preise und Vorlagen aus Teil 3 bleiben bestehen, du entfernst nur die laufenden VMs.

:::caution[Screenshots vor dem Aufräumen]
Die Schleife unten beendet alle VMs aus Teil 2 und 3 endgültig. Mache vorher die Screenshots für Meilenstein 1, denn danach fehlen die VMs, die sie zeigen. Zeigst du die Zusatzaufträge von Meilenstein 1 im Screencast, nimmst du ihn ebenfalls vorher auf. Lege zur Sicherheit einen Snapshot der drei Server an, wie ihn Kapitel 0.4 beschreibt.
:::

Hast du im Zusatzkapitel 3.5 den Dienst der Treuhand gestartet, entfernst du ihn zuerst, sonst startet OneFlow seine VM gleich wieder. `oneflow list` zeigt die Nummer des Dienstes in der Spalte `ID`. Diese Nummer setzt du im zweiten Befehl für `<id-des-dienstes>` ein. Ohne einen Dienst aus Kapitel 3.5 lässt du diesen Block aus.

```bash
oneflow list
oneflow delete <id-des-dienstes>
```

Danach beendet die Schleife jede VM, die `onevm list` zeigt, egal wie du sie in den Teilen 2 und 3 genannt hast. `oneadmin` darf die VMs aller Mitglieder beenden.

```bash
onevm list
for id in $(onevm list -l ID --no-header); do onevm terminate "$id"; done
onehost list
```

Am Ende zeigt `onehost list` auf beiden Knoten `0K / 7.2G`.

:::note[Zusatzaufträge von Meilenstein 1 live zeigen]
Die Basis von Meilenstein 1 belegst du mit dem Bericht und den Screenshots, dafür brauchst du die alten VMs nicht mehr. Wer die Zusatzaufträge von Meilenstein 1 im Unterricht live zeigt statt im Screencast, nimmt den Cluster für die Vorführung von den Knoten. `onevm undeploy k3s-server` und `onevm undeploy k3s-agent` stoppen die VMs und geben Speicher und CPU frei, ihre Disks bleiben erhalten. `onevm poweroff` reicht dafür nicht, weil eine ausgeschaltete VM ihren Platz auf dem Knoten behält. Danach startest du die VMs, die du für die Zusatzaufträge brauchst, mit den Befehlen aus Teil 3 neu und zeigst die Aufträge. Nach der Vorführung beendest du nur diese VMs, jede einzeln mit `onevm terminate <name>`. Einen Dienst aus Kapitel 3.5 entfernst du mit `oneflow delete <id-des-dienstes>`. Die Schleife von oben nimmst du dafür nicht, weil sie auch `k3s-server` und `k3s-agent` beenden würde. `onevm resume k3s-server` und `onevm resume k3s-agent` bringen den Cluster zurück. Im Lab dauerte `undeploy` knapp zwei Minuten, nach `resume` antwortete der Webshop aus Kapitel 4.4 nach etwa 45 Sekunden wieder. Argo CD zeigte die Application `root` danach noch gut drei Minuten als `Degraded`, weil das ApplicationSet `members` beim Start das Repo nicht lesen konnte. Der Repo-Server von Argo CD lief da noch nicht, danach erholte sich das ApplicationSet von selbst.
:::

## Werkzeuge

Auf dem Front-end brauchst du drei Werkzeuge. OpenTofu legt die VMs an und kubectl spricht mit Kubernetes. Helm installiert Pakete in den Cluster. Das Skript holt alle drei aus den offiziellen Paketquellen, damit `apt upgrade` sie später aktualisiert. Die Anleitungen zur Installation von [OpenTofu 1.13](https://opentofu.org/docs/v1.13/intro/install/deb/), [kubectl 1.36](https://v1-36.docs.kubernetes.io/docs/tasks/tools/install-kubectl-linux/) und [Helm](https://helm.sh/docs/intro/install/) beschreiben diese Paketquellen.

::code{file="platform/install-tools.sh"}

```bash
sudo ~/cc/platform/install-tools.sh
```

Im Lab waren das OpenTofu 1.13.2, kubectl 1.36.6 und Helm 4.3.0. OpenTofu ist ein Fork von Terraform unter der Linux Foundation mit der freien Lizenz MPL 2.0. Die Sprache und die meisten Provider sind dieselben. Wer Terraform kennt, kann OpenTofu lesen.

## Das Plattform-Repo

Der Code der Plattform liegt in einem eigenen Repo. Die Vorlage dafür ist `platform/repo` im Kursrepo. Du kopierst sie nach `~/platform` und machst daraus in Kapitel 4.4 ein Git-Repo.

```bash
cp -r ~/cc/platform/repo ~/platform
cd ~/platform/tofu
ls -a
```

In `tofu/` liegt die Konfiguration, aufgeteilt in Dateien. OpenTofu liest alle Dateien mit der Endung `.tf` eines Ordners zusammen, die Aufteilung dient nur der Übersicht.

| Datei | Inhalt |
|---|---|
| `versions.tf` | die Version von OpenTofu und die Provider |
| `variables.tf` | die Variablen mit Beschreibung und Standardwert |
| `main.tf` | Provider, Data Sources und Ressourcen |
| `outputs.tf` | Werte, die OpenTofu nach dem Apply ausgibt |
| `k3s.sh.tftpl` | das Startskript der VMs, Thema von Kapitel 4.3 |
| `make-tfvars.sh` | schreibt `terraform.tfvars` aus `/etc/cc-lab.env` |
| `.terraform.lock.hcl` | die genauen Versionen und Prüfsummen der Provider |

## Provider

Ein **Provider** übersetzt Blöcke im Code in Aufrufe einer API. Der Provider `opennebula/opennebula` spricht mit der XML-RPC-Schnittstelle von OpenNebula auf Port 2633, dieselbe, die auch die CLI und Sunstone nutzen. `random` erzeugt zufällige Werte.

::code{file="platform/repo/tofu/versions.tf"}

`~> 1.5` heisst 1.5 oder neuer, aber nicht 2.0. Welche Version `tofu init` tatsächlich holt, hält es in `.terraform.lock.hcl` fest. Diese Datei gehört in Git, damit alle mit denselben Providern arbeiten. Benutzer und Passwort von OpenNebula stehen nicht im Code. Der Provider liest sie aus Umgebungsvariablen, die du aus deiner Datei `~/.one/one_auth` aus Kapitel 2.2 setzt. Alle Einstellungen und Ressourcen nennt die [Dokumentation des Providers](https://search.opentofu.org/provider/opennebula/opennebula/v1.5.0) in der Version 1.5.0, die `.terraform.lock.hcl` festhält.

```bash
export OPENNEBULA_USERNAME=oneadmin
export OPENNEBULA_PASSWORD=$(cut -d: -f2- ~/.one/one_auth)
```

## Die Konfiguration

::code{file="platform/repo/tofu/main.tf"}

| Block | Bedeutung |
|---|---|
| `provider` | wie OpenTofu OpenNebula erreicht |
| `resource "random_password"` | ein zufälliges Token, mit dem sich die Knoten des Clusters verbinden |
| `locals` | Werte, die im Code mehrfach vorkommen, hier die zwei VMs mit Adresse und Rolle |
| `data` | etwas, das schon existiert und nur gelesen wird, hier das Netz `cc-net` und das Image `ubuntu-26.04` aus Teil 2 |
| `resource "opennebula_virtual_machine"` | die VMs, dank `for_each` eine pro Eintrag in `local.nodes` |

Eine **Data Source** verbindet den Code mit dem, was du von Hand gebaut hast, ohne es zu übernehmen. OpenTofu liest die Nummer von `cc-net`, legt das Netz aber nie an und löscht es nie.

Die Adressen der VMs kommen aus deinen persönlichen Parametern. In `/etc/cc-lab.env` heissen sie `CC_K3S_SERVER_IP` und `CC_K3S_AGENT_IP`. Ein kleines Skript schreibt sie in `terraform.tfvars`, die Datei, aus der OpenTofu Variablen liest.

```bash
./make-tfvars.sh > terraform.tfvars
cat terraform.tfvars
```

## Init, Plan und Apply

`tofu init` lädt die Provider in den Ordner `.terraform`. Ohne diesen Schritt brechen `plan` und `apply` mit «Inconsistent dependency lock file» ab, auch in jeder neuen Kopie des Repos. Die Optionen von `tofu init` beschreibt die [Referenz des Befehls](https://opentofu.org/docs/v1.13/cli/commands/init/) in der Dokumentation von OpenTofu 1.13.

```bash
tofu init
tofu plan
tofu apply
```

Der Plan zeigt drei Ressourcen mit `+`, das Token und zwei VMs. Beim Token steht `result = (sensitive value)`. OpenTofu blendet geheime Werte in der Ausgabe aus, speichert sie aber im State. Nach `yes` legt OpenTofu die VMs an, im Lab in zehn Sekunden, je eine auf einem Knoten. Am Ende stehen die Outputs. Die Adressen unten gelten für den Code `mmuster`, bei dir stehen die Adressen deines Netzes `cc-net` mit den Endungen `.110` und `.111`.

```text
Outputs:

api = "https://172.31.160.110:6443"
ips = {
  "k3s-agent" = "172.31.160.111"
  "k3s-server" = "172.31.160.110"
}
```

## State lesen

```bash
tofu state list
tofu state show 'opennebula_virtual_machine.k3s["k3s-server"]'
tofu output
```

`tofu state list` zeigt die drei verwalteten Ressourcen und die zwei Data Sources, die OpenTofu nur liest. `tofu state show` listet alle Attribute einer VM so auf, wie OpenNebula sie meldet. Der State liegt in `terraform.tfstate`. Öffnest du die Datei, findest du das Token im Klartext. Die Datei `.gitignore` im Repo schliesst darum den State und den Ordner `.terraform` aus.

## Ändern, ersetzen und neu bauen

Benennst du eine VM von Hand um, entsteht Drift. Im Lab sah der nächste Plan so aus.

```bash
onevm rename k3s-agent handarbeit
tofu plan
```

```text
  # opennebula_virtual_machine.k3s["k3s-agent"] will be updated in-place
      ~ name                   = "handarbeit" -> "k3s-agent"
Plan: 0 to add, 1 to change, 0 to destroy.
```

`tofu apply` benennt sie zurück. Manche Änderungen lassen sich nicht an einer laufenden VM machen. Dann ersetzt OpenTofu sie und zeigt `-/+`. Mit der Option `-replace` erzwingst du das Ersetzen einer einzelnen VM, etwa wenn ihr Startskript schiefgegangen ist. Für den Agent lautet der Befehl `tofu apply -replace='opennebula_virtual_machine.k3s["k3s-agent"]'`. Führe ihn jetzt noch nicht aus. Der Agent tritt dem Cluster schon kurz nach `tofu apply` bei. Ein neuer Agent mit demselben Namen kommt danach erst nach einem Schritt mit kubectl in den Cluster. `-replace` probierst du darum in der Übung «Agent ersetzen» in [Kapitel 4.3](../kubernetes/) aus, sobald kubectl läuft.

Ob der Code alles beschreibt, zeigt erst ein ganzer Neubau. `tofu destroy` löscht alles, was im State steht, `tofu apply` baut es wieder auf. Für den leeren Cluster von Teil 4 dauerte das im Lab etwa zwei Minuten. Die Basis verlangt nur die VMs aus OpenTofu und einen Plan ohne Änderungen. Den Neubau der ganzen Plattform planst und misst du im Zusatzauftrag A in [Kapitel 4.6](../advanced/#neubau-der-plattform-auftrag-a). Wie das Startskript Kubernetes installiert, zeigt Kapitel 4.3.

::::exercise[Lab]
Räume die Knoten auf, installiere die Werkzeuge und lege die beiden VMs mit OpenTofu an. Zeige mit `tofu plan`, dass danach keine Änderungen offen sind.

:::solution
Nach dem Aufräumen zeigt `onehost list` auf beiden Knoten `0K / 7.2G`, auf smartlearn `0K / 7.3G`. `tofu apply` legt `k3s-server` und `k3s-agent` mit den Adressen aus deinen Parametern an, `onevm list` zeigt beide mit 6G auf verschiedenen Knoten. Ein zweiter `tofu plan` meldet «No changes. Your infrastructure matches the configuration.»
:::
::::

::::exercise[Drift]
Erzeuge eine Drift, indem du eine der beiden VMs in Sunstone oder mit der CLI änderst. Zeige sie mit `tofu plan` und behebe sie. Welche Änderung von Hand würde OpenTofu nicht bemerken?

:::solution
Ein neuer Name, wie oben, erscheint als `~ name` im Plan, `tofu apply` macht ihn rückgängig. OpenTofu vergleicht aber nur die Attribute, die der Provider kennt. Änderungen in der VM selbst bleiben unsichtbar, etwa ein per SSH installiertes Paket oder eine gelöschte Datei. Für den Inhalt der VMs sorgt das Startskript. Im Cluster übernimmt diese Aufgabe ab Kapitel 4.4 Argo CD.
:::
::::

::::exercise[Variable]
Die Treuhand fragt, ob der Cluster mit weniger Speicher auskäme, damit daneben wieder eine VM für sie Platz hat. Wo änderst du das und welche Folgen hat es?

:::solution
In `variables.tf` steht die Variable `memory` mit dem Wert 6144. In `terraform.tfvars` setzt du etwa `memory = 5120`, dann zeigt der Plan eine Änderung an beiden VMs. Jeder Knoten hätte danach laut OpenNebula 2,2 GB frei. Weil der Knoten selbst rund 0,6 GB braucht, passt ohne Swap eine VM mit 1 GB dazu. In Teil 5 brauchen Prometheus, Loki und das lokale Modell aber diesen Speicher. Im Test lag der Server mit allem bei 3,4 GB, das Modell brauchte auf dem Agent 2,7 GB. Eine spätere Messung über eine Stunde mit Anfragen ergab für das Modell bis 3,3 GiB, wie Kapitel 6.4 zeigt.
:::
::::
