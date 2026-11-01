---
title: Eigener Hypervisor
description: Das Lab auf einem eigenen Hypervisor statt auf smartlearn, mit dem Skript für Hyper-V und Hinweisen für VMware, VirtualBox und Proxmox.
sidebar:
  order: 1
---

:::goals
Nach diesem Kapitel kannst du

- entscheiden, ob dein Rechner das Lab tragen kann,
- die drei VMs mit Hyper-V anlegen,
- verschachtelte Virtualisierung in VMware, VirtualBox und Proxmox einschalten.
:::

## Voraussetzungen

Diese Ergänzung gehört nicht zum Standardweg des Kurses, der auf smartlearn läuft. Ein eigener Hypervisor lohnt sich, wenn du auch ausserhalb der Schule ohne Netzzugang zu smartlearn arbeiten willst. Dieser Weg geht auf eigenes Risiko, und deine Dozentin oder dein Dozent hilft vor allem beim Standardweg.

Dein Rechner braucht mindestens 32 GB RAM, besser 48 GB, dazu eine x86-CPU mit Virtualisierung und rund 200 GB freien Speicher. Ein Mac mit Apple-Prozessor eignet sich nicht, weil das Lab auf x86-Prozessoren getestet ist.

Unabhängig vom Hypervisor gelten dieselben Anforderungen wie auf smartlearn:

1. drei VMs mit den Grössen aus [Kapitel 0.2](../../start/lab/)
2. verschachtelte Virtualisierung auf beiden Knoten
3. ein gemeinsames Netz mit festen Adressen, aus dem die VMs ins Internet kommen
4. Ubuntu Server 26.04 mit den Einstellungen aus Kapitel 0.2

## Hyper-V

Unter Windows 11 Pro, Education und Enterprise ist Hyper-V der einfachste Weg. Aktiviere Hyper-V in den Windows-Features, starte den Rechner neu und lade das ISO von Ubuntu Server 26.04 LTS von [ubuntu.com](https://ubuntu.com/download/server) herunter. Das Skript `lab/hyperv/new-lab.ps1` legt danach ein internes Netz mit NAT und die drei VMs an. Starte es in einer PowerShell als Administrator, mit deinem persönlichen Code und dem Pfad zum ISO.

```powershell
powershell -ExecutionPolicy Bypass -File new-lab.ps1 -Code mmuster -Iso "$env:USERPROFILE\Downloads\ubuntu-26.04-live-server-amd64.iso"
```

Das Skript gibt dem Front-end 16 GB RAM, den Knoten 8 GB und jeder VM vier virtuelle CPUs. Es schaltet die verschachtelte Virtualisierung ein, dazu den festen Speicher, den sie verlangt, und das Zertifikat für Secure Boot mit Ubuntu.

::code{file="lab/hyperv/new-lab.ps1" lines="48-52"}

Das Skript legt das Labnetz 192.168.210.0/24 mit NAT an, der Rechner selbst ist das Gateway 192.168.210.1. Am Ende zeigt es die Adressen aus deinem Code, dieselben wie der Generator in Kapitel 0.3, die du bei der Installation von Ubuntu einträgst. Auf .1 antwortet unter Hyper-V kein DNS, trag deshalb den DNS ein, den das Skript nennt. Windows 11 Home enthält kein Hyper-V.

## VMware

In VMware Workstation schaltest du die verschachtelte Virtualisierung für beide Knoten in den Einstellungen der VM ein, unter «Processors» mit «Virtualize Intel VT-x/EPT or AMD-V/RVI». Unter ESXi heisst die Option «Expose hardware assisted virtualization to the guest OS».

Unter Windows funktioniert die Option nur, wenn der Hypervisor von Windows nicht läuft. Meldet VMware beim Start «Virtualized Intel VT-x/EPT is not supported on this platform», nutzen die Speicherintegrität, WSL 2 oder Docker Desktop diesen Hypervisor. In diesem Fall ist Hyper-V oder smartlearn der bessere Weg.

## VirtualBox

In VirtualBox heisst die Option «Enable Nested VT-x/AMD-V» und steht unter «System» und «Processor». Auf der Kommandozeile schaltest du sie bei ausgeschalteter VM mit `VBoxManage` ein. Für VirtualBox unter Windows gilt dieselbe Einschränkung wie für VMware.

```bash
VBoxManage modifyvm "mmuster-node1" --nested-hw-virt on
```

## Proxmox

In Proxmox VE setzt du bei beiden Knoten unter «Hardware» und «Processors» den Typ auf `host`. Damit sieht die VM die CPU mit allen Funktionen, auch der Virtualisierung. Ob der Proxmox-Host verschachtelte Virtualisierung erlaubt, zeigt auf dem Host die folgende Datei. Sie muss `Y` oder `1` enthalten, bei AMD-Prozessoren heisst der Pfad `kvm_amd`.

```bash
cat /sys/module/kvm_intel/parameters/nested
```

::::exercise[Lab]
Wenn du einen eigenen Hypervisor nutzt, lege die drei VMs an, installiere Ubuntu nach Kapitel 0.2 und prüfe auf beiden Knoten die verschachtelte Virtualisierung.

:::solution
`grep -cE 'vmx|svm' /proc/cpuinfo` gibt auf beiden Knoten eine Zahl grösser als null aus. Ist sie null, ist die Option im Hypervisor aus, oder unter Windows läuft der Hypervisor von Windows im Hintergrund.
:::
::::
