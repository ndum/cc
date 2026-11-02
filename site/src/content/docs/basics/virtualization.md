---
title: Virtualisierung
description: Hypervisoren vom Typ 1 und Typ 2, KVM, QEMU und libvirt, die Unterstützung der CPU, verschachtelte Virtualisierung, CPU-Modelle und der Unterschied zwischen VMs und Containern.
sidebar:
  order: 3
---

:::assignment
«Unsere Server sind selbst schon VMs, und darauf sollen wieder VMs laufen?», fragt Simone Wyss. «Und die Velowerkstatt redet von Containern. Kannst du mir das auseinandernehmen, bevor ich es an der Generalversammlung erklären muss?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Hypervisoren vom Typ 1 und Typ 2 unterscheiden
- Erklären, wie KVM, QEMU und libvirt zusammenarbeiten
- Die Virtualisierungsfunktionen einer CPU prüfen
- Verschachtelte Virtualisierung und die Rolle des CPU-Modells erklären
- VMs und Container vergleichen
:::

## Hypervisoren

Ein Hypervisor teilt einen physischen Rechner in mehrere virtuelle Maschinen auf. Jede VM erhält eigene virtuelle CPUs, eigenen Arbeitsspeicher, eigene Disks und Netzwerkkarten und führt darauf ein vollständiges Betriebssystem aus.

Ein Hypervisor vom Typ 1 läuft direkt auf der Hardware. Beispiele sind VMware ESXi, Hyper-V und KVM. Ein Hypervisor vom Typ 2 läuft als Programm in einem gewöhnlichen Betriebssystem, wie VirtualBox oder VMware Workstation. Typ 1 ist im Rechenzentrum üblich, weil er weniger Umwege hat und die Hardware direkt verwaltet.

## KVM, QEMU und libvirt

Auf den Knoten deines Labs arbeiten drei Bausteine zusammen. KVM (Kernel-based Virtual Machine) ist ein Teil des Linux-Kernels und macht Linux zum Hypervisor vom Typ 1. Es nutzt die Virtualisierungsfunktionen der CPU, damit der Code einer VM direkt auf dem Prozessor läuft. QEMU stellt jeder VM die übrigen Geräte bereit, also Disks, Netzwerkkarten und Konsole, und läuft pro VM als eigener Prozess. libvirt verwaltet die VMs eines Rechners über eine einheitliche Schnittstelle. OpenNebula spricht auf jedem Knoten mit libvirt, libvirt startet QEMU, und QEMU nutzt KVM.

## Unterstützung durch die CPU

Moderne Prozessoren haben eigene Befehle für die Virtualisierung, bei Intel heissen sie VT-x, bei AMD AMD-V. Dazu kommen Funktionen, die den Arbeitsspeicher der VMs schnell übersetzen, bei Intel EPT, bei AMD NPT. Linux zeigt diese Funktionen als Flags `vmx` und `svm` in `/proc/cpuinfo`. Ohne sie müsste QEMU jeden Befehl der VM in Software nachbilden, und die VM wäre um ein Vielfaches langsamer.

```bash
lscpu | grep -iE 'virtualization|model name'
```

## Verschachtelte Virtualisierung

In deinem Lab stapeln sich die Hypervisoren. smartlearn führt deine Knoten als VMs aus, und auf den Knoten führt KVM die VMs deiner Cloud aus. Damit das funktioniert, muss der äussere Hypervisor die Virtualisierungsfunktionen der CPU an die Knoten weitergeben. Dieses Prinzip heisst verschachtelte Virtualisierung. Es kostet etwas Leistung, besonders bei vielen Wechseln zwischen VM und Hypervisor, reicht für ein Lab aber gut aus. In Produktion laufen die Knoten einer Cloud direkt auf der Hardware.

## CPU-Modelle

Ein Hypervisor zeigt einer VM nicht zwingend die echte CPU. Er kann ihr ein allgemeines Modell vorspielen, das auf vielen Rechnern gleich aussieht. Das erleichtert es, eine VM im laufenden Betrieb auf einen anderen Knoten mit anderer CPU zu verschieben. Der Preis dafür sind fehlende Befehle. Das allgemeine Modell von QEMU kennt zum Beispiel die Vektorbefehle AVX2 nicht, die Programme für Berechnungen nutzen.

Bei der Entwicklung des Kurses lief ein Sprachmodell mit drei Milliarden Parametern in einer VM mit dem allgemeinen Modell und schaffte 2,2 Tokens pro Sekunde. Mit dem CPU-Modell `host-passthrough`, das der VM die echte CPU zeigt, waren es 19,4 Tokens pro Sekunde, rund achtmal mehr. Für die VMs, auf denen in Teil 5 das Sprachmodell läuft, setzt der Kurs deshalb `host-passthrough`.

## VMs und Container

Ein Container ist ein Prozess mit eigener Sicht auf Dateisystem, Netz und Prozesse. Er teilt den Kernel mit dem Rechner, auf dem er läuft, und bringt nur die Programme und Bibliotheken seiner Anwendung mit. Eine VM bringt dagegen ein vollständiges Betriebssystem mit eigenem Kernel mit.

| Eigenschaft | VM | Container |
|---|---|---|
| Kernel | eigener | geteilt mit dem Rechner |
| Start | Sekunden bis Minuten | meist unter einer Sekunde |
| Grösse | Gigabytes | oft Megabytes |
| Trennung | stark, durch den Hypervisor | schwächer, durch Funktionen des Kernels |
| Typisch für | ganze Server, unterschiedliche Betriebssysteme, Mandanten | einzelne Anwendungen und ihre Teile |

Im Kurs kommen beide vor. OpenNebula liefert den Mitgliedern VMs, weil die Trennung zwischen Mandanten stark sein soll. Der Webshop des Veloateliers läuft in Containern auf Kubernetes, und Kubernetes selbst läuft in zwei VMs aus OpenNebula.

::::exercise[Lab]
Führe `lscpu` auf einem Knoten und auf dem Front-end aus. Welche Virtualisierung meldet `lscpu`, und welches CPU-Modell sieht die VM?

:::solution
`lscpu` zeigt unter «Virtualization» `VT-x` oder `AMD-V`, wenn die verschachtelte Virtualisierung eingeschaltet ist. Unter «Model name» steht das Modell, das der äussere Hypervisor der VM zeigt. Auf smartlearn und mit Hyper-V ist das meist die echte CPU des Servers.
:::
::::

::::exercise[Einordnen]
Die Treuhand Aaregg will ihre Buchhaltungssoftware für Windows betreiben, das Veloatelier seinen Webshop in mehreren Kopien. Wer bekommt eine VM, wer Container, und warum?

:::solution
Die Treuhand bekommt eine VM, weil ihre Software ein eigenes Betriebssystem braucht und Container den Kernel des Rechners teilen. Das Veloatelier bekommt Container auf Kubernetes, weil der Webshop schnell startende Kopien braucht, die mit der Last wachsen und schrumpfen.
:::
::::
