---
title: Virtualisierung
description: Hypervisoren vom Typ 1 und Typ 2, KVM, QEMU und libvirt, die Unterstützung der CPU, verschachtelte Virtualisierung, CPU-Modelle und der Unterschied zwischen VMs und Containern.
sidebar:
  order: 3
---

:::assignment
«Unsere Server sind selbst schon VMs. Darauf sollen wieder VMs laufen?», fragt Simone Wyss. «Und das Veloatelier redet von Containern. Kannst du mir das aufschlüsseln, bevor ich es an der Generalversammlung erklären muss?»
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

Ein Hypervisor vom Typ 1 läuft direkt auf der Hardware. Beispiele sind VMware ESXi, Hyper-V und KVM. Ein Hypervisor vom Typ 2 läuft als Programm in einem gewöhnlichen Betriebssystem, wie VirtualBox oder VMware Workstation. Im Rechenzentrum ist Typ 1 üblich, weil er die Hardware direkt verwaltet, ohne den Umweg über ein weiteres Betriebssystem.

## KVM, QEMU und libvirt

Auf den Knoten deines Labs arbeiten drei Bausteine zusammen. KVM (Kernel-based Virtual Machine) ist ein Teil des Linux-Kernels und macht Linux zum Hypervisor vom Typ 1. Es nutzt die Virtualisierungsfunktionen der CPU, damit der Code einer VM direkt auf dem Prozessor läuft. QEMU läuft für jede VM als eigener Prozess und stellt ihr die übrigen Geräte bereit, also Disks, Netzwerkkarten und Konsole. Die VMs eines Rechners verwaltet libvirt über eine einheitliche Schnittstelle. OpenNebula spricht auf jedem Knoten mit libvirt, libvirt startet QEMU, QEMU nutzt KVM.

## Unterstützung durch die CPU

Moderne Prozessoren haben eigene Befehle für die Virtualisierung, bei Intel heissen sie VT-x, bei AMD AMD-V. Linux zeigt sie in `/proc/cpuinfo` als Flag `vmx` oder `svm`. Dazu kommen Funktionen wie EPT bei Intel und NPT bei AMD, mit denen die CPU die Speicheradressen der VMs schnell übersetzt. Ohne diese Unterstützung müsste QEMU jeden Befehl der VM in Software nachbilden, was die VM um ein Vielfaches verlangsamen würde.

```bash
lscpu | grep -iE 'virtualization|model name'
```

## Verschachtelte Virtualisierung

In deinem Lab stapeln sich die Hypervisoren. Deine Knoten laufen als VMs auf smartlearn. Auf ihnen führt KVM wiederum die VMs deiner Cloud aus. Damit das funktioniert, muss der äussere Hypervisor die Virtualisierungsfunktionen der CPU an die Knoten weitergeben. Dieses Prinzip heisst verschachtelte Virtualisierung. Es kostet etwas Leistung, besonders bei vielen Wechseln zwischen VM und Hypervisor, reicht für ein Lab aber gut aus. In Produktion laufen die Knoten einer Cloud direkt auf der Hardware.

## CPU-Modelle

Ein Hypervisor zeigt einer VM nicht zwingend die echte CPU. Er kann ihr ein allgemeines Modell vorspielen, das auf vielen Rechnern gleich aussieht. Das erleichtert es, eine VM im laufenden Betrieb auf einen anderen Knoten mit anderer CPU zu verschieben. Dafür fehlen dem allgemeinen Modell manche Befehle. Bei QEMU sind das zum Beispiel die Vektorbefehle AVX2, die Programme für Berechnungen nutzen.

Bei der Entwicklung des Kurses lief ein Sprachmodell mit drei Milliarden Parametern in einer VM mit dem allgemeinen CPU-Modell und schaffte 2,2 Tokens pro Sekunde. Mit dem CPU-Modell `host-passthrough`, das der VM die echte CPU zeigt, waren es 19,4 Tokens pro Sekunde, fast neunmal so viel. Deshalb erhalten die VMs, auf denen in Teil 5 das Sprachmodell läuft, das CPU-Modell `host-passthrough`.

## VMs und Container

Ein Container ist ein Prozess mit eigener Sicht auf Dateisystem, Netz und Prozesse. Er teilt sich den Kernel mit dem Rechner, auf dem er läuft. Mitbringen muss er nur die Programme und Bibliotheken seiner Anwendung. Eine VM bringt dagegen ein vollständiges Betriebssystem mit eigenem Kernel mit.

| Eigenschaft | VM | Container |
|---|---|---|
| Kernel | eigener | geteilt mit dem Rechner |
| Start | Sekunden bis Minuten | meist unter einer Sekunde |
| Grösse | Gigabytes | oft Megabytes |
| Trennung | stark, durch den Hypervisor | schwächer, durch Funktionen des Kernels |
| Typisch für | ganze Server, unterschiedliche Betriebssysteme, Mandanten | einzelne Anwendungen und ihre Teile |

Im Kurs kommen beide vor. OpenNebula liefert den Mitgliedern VMs, weil die Trennung zwischen Mandanten stark sein soll. Der Webshop des Veloateliers läuft in Containern auf Kubernetes. Kubernetes selbst läuft in zwei VMs aus OpenNebula.

::::exercise[Lab]
Führe `lscpu` auf einem Knoten und auf dem Front-end aus. Welche Virtualisierung meldet `lscpu`? Welches CPU-Modell sieht die VM?

:::solution
`lscpu` zeigt unter «Virtualization» `VT-x` oder `AMD-V`, wenn die verschachtelte Virtualisierung eingeschaltet ist. Unter «Model name» steht das Modell, das der äussere Hypervisor der VM zeigt. Auf smartlearn und unter Hyper-V ist das meist die echte CPU der physischen Maschine.
:::
::::

::::exercise[Einordnen]
Die Treuhand Aaregg will ihre Buchhaltungssoftware für Windows betreiben, das Veloatelier seinen Webshop in mehreren Kopien. Wer bekommt eine VM, wer Container? Begründe beide Entscheide.

:::solution
Die Treuhand bekommt eine VM, weil ihre Software ein eigenes Betriebssystem braucht und Container den Kernel des Rechners teilen. Das Veloatelier bekommt Container auf Kubernetes, weil der Webshop schnell startende Kopien braucht, deren Zahl mit der Last wächst und schrumpft.
:::
::::
