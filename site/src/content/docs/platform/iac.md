---
title: Infrastructure as Code
description: Die Gründe des Plattform-Teams für Infrastruktur als Code, deklarative und imperative Beschreibungen, Soll-Zustand, State, Plan und Apply, Drift und Idempotenz.
sidebar:
  order: 1
---

:::assignment
«Das Veloatelier will seinen Webshop auf Containern betreiben», schreibt Simone Wyss. «Und ich habe gehört, dass ihr letzte Woche wieder einen Abend lang VMs von Hand neu aufgesetzt habt. Ich will eine Plattform, die ihr jederzeit aus dem Code neu bauen könnt.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Deklarative und imperative Beschreibungen von Infrastruktur unterscheiden
- Erklären, was Soll-Zustand, Ist-Zustand und State sind
- Den Ablauf von Plan und Apply beschreiben
- Drift und Idempotenz an einem Beispiel aus dem Lab erklären
:::

## Klickpfad und Code

In Teil 2 hast du das Netz `cc-net`, die Vorlage `ubuntu` und die ersten VMs mit Befehlen der CLI angelegt, Schritt für Schritt. Das ging, solange du allein warst und dir die Reihenfolge gemerkt hast. Schwierig wird es, wenn jemand anderes dieselbe Umgebung bauen soll, wenn nach einem Fehler nicht klar ist, was schon angelegt ist, oder wenn du nach einem halben Jahr wissen willst, warum eine VM 6 GB hat.

Infrastructure as Code (IaC) beschreibt Infrastruktur in Dateien, die in Git liegen. Ein Werkzeug liest die Dateien und sorgt dafür, dass die Infrastruktur so aussieht, wie sie beschrieben ist. Die Dateien sind dann Bauanleitung und Dokumentation zugleich. Wer wissen will, warum die VM 6 GB hat, findet die Zeile und im Verlauf von Git den Commit mit seiner Begründung.

## Deklarativ und imperativ

Eine imperative Beschreibung sagt, was in welcher Reihenfolge zu tun ist. Die Befehle aus Teil 2 sind imperativ.

```bash
onevnet create cc-net.tpl
onetemplate create ubuntu.tpl
onetemplate instantiate ubuntu --name web-1
```

Startest du diese Befehle ein zweites Mal, scheitert der erste, weil `cc-net` schon existiert. Der dritte legt eine zweite VM mit demselben Namen an. Das Skript selbst prüft nicht, was schon da ist.

Eine deklarative Beschreibung sagt, wie das Ergebnis aussehen soll. Das Werkzeug vergleicht diesen Soll-Zustand mit dem Ist-Zustand und bestimmt selbst, was es dafür tun muss. Im nächsten Kapitel beschreibst du die zwei VMs des Kubernetes-Clusters so.

```hcl
resource "opennebula_virtual_machine" "k3s" {
  for_each = local.nodes
  name     = each.key
  memory   = 6144
}
```

Fehlt eine VM, legt OpenTofu sie an. Hat eine VM zu wenig Speicher, ändert OpenTofu sie. Stimmt alles, tut OpenTofu nichts.

| | Imperativ | Deklarativ |
|---|---|---|
| Beschreibt | die Schritte | das Ergebnis |
| Zweiter Lauf | macht die Schritte noch einmal | ändert nur, was abweicht |
| Reihenfolge | legt der Mensch fest | leitet das Werkzeug aus den Abhängigkeiten ab |
| Beispiele | Shell-Skripte, CLI-Befehle | OpenTofu, Kubernetes-Manifeste |

Ansible aus Kapitel 2.2 liegt dazwischen. Ein Playbook ist eine Liste von Schritten, die Module der Schritte sind aber meist deklarativ, etwa «dieses Paket ist installiert».

## State

OpenTofu muss wissen, welche Objekte in OpenNebula zu welchem Block im Code gehören. Diese Zuordnung speichert es im State, im Lab in der Datei `terraform.tfstate`. Darin steht etwa, dass der Block `opennebula_virtual_machine.k3s["k3s-server"]` die VM mit der Nummer 11 ist.

Der State ist heikel. Er enthält alle Attribute der Objekte, auch geheime Werte wie das Token, mit dem sich die Knoten von k3s verbinden. Darum gehört er nicht in Git. Geht er verloren, kennt OpenTofu seine VMs nicht mehr und würde beim nächsten Lauf neue anlegen. In Teams liegt der State in einem gemeinsamen Speicher mit Sperre, damit nicht zwei Leute gleichzeitig ändern. Im Lab arbeitest du allein, der State bleibt als Datei auf dem Front-end.

## Plan und Apply

Die Arbeit mit OpenTofu hat zwei Schritte.

1. `tofu plan` liest Code, State und Ist-Zustand und zeigt, was sich ändern würde, ohne etwas zu tun. `+` heisst anlegen, `~` ändern, `-` löschen, `-/+` ersetzen.
2. `tofu apply` erstellt denselben Plan, fragt nach und führt ihn aus.

Im Plan fängst du Fehler ab. Steht dort `-/+` vor einer VM, die du nur umbenennen wolltest, brichst du ab. Teams legen den Plan in einem Pull Request vor, bevor jemand ihn ausführt.

![Plan und Apply mit dem State. Links liegt der Code in Git als Soll-Zustand, rechts der Ist-Zustand in OpenNebula. tofu plan liest den Code, den State in terraform.tfstate und den Ist-Zustand und zeigt nur, was sich ändern würde. tofu apply liest den Code, ändert die VMs über die API von OpenNebula und schreibt danach den State. Ganz rechts ändert jemand eine VM von Hand in Sunstone oder mit der CLI. Achte darauf, dass nur apply etwas ändert und dass der nächste Plan diese Drift zeigt, weil er den Ist-Zustand liest.](../../../assets/figures/de/p4c1-plan-apply.svg)

## Drift und Idempotenz

Drift ist eine Abweichung des Ist-Zustands vom Code, etwa weil jemand eine VM in Sunstone von Hand geändert hat. `tofu plan` macht Drift sichtbar, `tofu apply` macht sie rückgängig.

Im Lab trat eine Drift auf, die niemand von Hand verursacht hatte. OpenNebula setzt beim Start einer VM selbst den Maschinentyp `q35`. Der Code nannte keinen, also wollte jeder spätere Plan den Wert entfernen. Erst als `machine = "q35"` im Code stand, meldete `tofu plan` «No changes». Solche Werte, die eine Plattform selbst ergänzt, gehören in den Code, sonst lernt man, Pläne mit Änderungen zu überlesen.

Idempotent heisst eine Operation, die beim zweiten Mal nichts mehr ändert. `tofu apply` ohne Änderung im Code ist idempotent, die Befehle oben sind es nicht. Erst die Idempotenz erlaubt dir, denselben Code beliebig oft laufen zu lassen, ob im Lab, für einen Meilenstein oder nach einem Ausfall.

::::exercise[Klickpfad und Code vergleichen]
Nimm deine Befehle aus Kapitel 2.3 und 2.4 und lege eine Tabelle an. Halte für jeden Schritt fest, was ein zweiter Lauf bewirkt und wie eine deklarative Beschreibung denselben Schritt ausdrücken würde.

:::solution
`onevnet create` und `onetemplate create` scheitern beim zweiten Mal, weil der Name schon vergeben ist. `onetemplate instantiate` legt eine weitere VM an, OpenNebula erlaubt doppelte Namen von VMs. Deklarativ wäre jeder Schritt ein Block mit dem gewünschten Ergebnis, etwa ein Netz `cc-net` mit Adressbereich, eine Vorlage `ubuntu` und genau eine VM `web-1`. Ein zweiter Lauf fände alles vor und täte nichts.
:::
::::

::::exercise[State verloren]
Eine Kollegin löscht aus Versehen `terraform.tfstate`. Die VMs laufen weiter. Was zeigt der nächste `tofu plan` und was wäre die Folge eines `tofu apply`?

:::solution
OpenTofu kennt ohne State keine Objekte und plant, alle VMs neu anzulegen. Ein `apply` würde zwei weitere VMs mit denselben festen Adressen starten. Weil diese Adressen schon belegt sind, schlüge das fehl oder es gäbe Konflikte im Netz. Richtig wäre, die bestehenden VMs mit `tofu import` wieder dem Code zuzuordnen oder den State aus einer Sicherung zu holen. Darum gehört der State gesichert, aber nicht in Git.
:::
::::
