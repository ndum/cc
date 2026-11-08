---
title: Eigener Hypervisor
description: Das Lab auf einem eigenen Hypervisor statt auf smartlearn, mit dem Skript für Hyper-V und Hinweisen für VMware, VirtualBox und Proxmox.
sidebar:
  order: 1
---

:::goals
Nach diesem Kapitel kannst du:

- Entscheiden, ob dein PC das Lab tragen kann
- Die drei VMs mit Hyper-V anlegen
- Verschachtelte Virtualisierung und das Labnetz in VMware, VirtualBox und Proxmox einrichten
:::

## Voraussetzungen

Diese Ergänzung gehört nicht zum Standardweg des Kurses, der auf smartlearn läuft. Ein eigener Hypervisor lohnt sich, wenn du auch ausserhalb der Schule ohne Netzzugang zu smartlearn arbeiten willst. Dieser Weg geht auf eigenes Risiko. Deine Dozentin oder dein Dozent hilft vor allem beim Standardweg.

Dein PC braucht mindestens 48 GB RAM, dazu eine x86-CPU mit Virtualisierung und rund 200 GB freien Speicher. Die drei VMs belegen zusammen 32 GB RAM fest, 16 GB das Front-end und je 8 GB die Knoten. Den Rest braucht das Betriebssystem deines PCs. Ein Mac mit Apple-Prozessor eignet sich nicht, weil das Lab auf x86-Prozessoren getestet ist.

Unabhängig vom Hypervisor gelten dieselben Anforderungen wie auf smartlearn:

1. Drei VMs mit den Grössen aus [Kapitel 0.2](../../start/lab/)
2. Verschachtelte Virtualisierung auf beiden Knoten
3. Das Labnetz 192.168.210.0/24 mit NAT ins Internet, denn die festen Adressen aus Kapitel 0.3 liegen in diesem Netz
4. Ubuntu Server 26.04 mit den Einstellungen aus Kapitel 0.2

Welche Adresse das Gateway im Labnetz hat, hängt vom Hypervisor ab. Die Abschnitte unten nennen sie. Als DNS kannst du einen öffentlichen Resolver wie 9.9.9.9 eintragen, den auch das Skript für Hyper-V nennt.

Einen Client wie auf smartlearn brauchst du nicht, dein PC übernimmt seine Rolle. Du meldest dich von ihm aus direkt per SSH an den Servern an und öffnest die Weboberflächen in seinem Browser. Wo der Kurs vom Client spricht, ist dein PC gemeint.

## Hyper-V

Unter Windows 11 Pro, Education und Enterprise ist Hyper-V der einfachste Weg. Aktiviere Hyper-V in den Windows-Features, starte den PC neu und lade das ISO von Ubuntu Server 26.04 LTS von [ubuntu.com](https://ubuntu.com/download/server) herunter. Wie du Hyper-V einschaltest, beschreibt die [Anleitung zur Installation von Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/get-started/install-hyper-v?pivots=windows) von Microsoft. Das Skript `lab/hyperv/new-lab.ps1` aus dem Kursrepo legt danach ein internes Netz mit NAT und die drei VMs an. Öffne eine PowerShell als Administrator, lade das Skript von GitHub in deinen Ordner «Downloads» und starte es mit deinem persönlichen Code und dem Pfad zum ISO.

```powershell
cd $env:USERPROFILE\Downloads
Invoke-WebRequest https://raw.githubusercontent.com/ndum/cc/main/lab/hyperv/new-lab.ps1 -OutFile new-lab.ps1 -UseBasicParsing
powershell -ExecutionPolicy Bypass -File new-lab.ps1 -Code mmuster -Iso "$env:USERPROFILE\Downloads\ubuntu-26.04-live-server-amd64.iso"
```

Setze bei `-Iso` den Namen der Datei ein, die du heruntergeladen hast. Gibt Ubuntu eine Zwischenversion wie 26.04.1 heraus, heisst das ISO etwa `ubuntu-26.04.1-live-server-amd64.iso`.

Das Skript gibt dem Front-end 16 GB RAM, den Knoten 8 GB und jeder VM vier virtuelle CPUs. Es schaltet die verschachtelte Virtualisierung ein, die festen Arbeitsspeicher verlangt. Für Secure Boot wählt es die Vorlage für fremde Systeme, sonst startet Ubuntu nicht. Was verschachtelte Virtualisierung unter Hyper-V voraussetzt, nennt die [Anleitung zur verschachtelten Virtualisierung](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/enable-nested-virtualization) von Microsoft.

::code{file="lab/hyperv/new-lab.ps1" lines="48-52"}

Das Skript legt das Labnetz 192.168.210.0/24 mit NAT an, dein PC selbst ist das Gateway 192.168.210.1. Am Ende zeigt es die Adressen aus deinem Code, dieselben wie der Generator in Kapitel 0.3, die du bei der Installation von Ubuntu einträgst. Auf .1 antwortet unter Hyper-V kein DNS, trag deshalb den DNS ein, den das Skript nennt. Windows 11 Home enthält kein Hyper-V.

## VMware

In VMware Workstation schaltest du die verschachtelte Virtualisierung für beide Knoten in den Einstellungen der VM ein, unter «Processors» mit «Virtualize Intel VT-x/EPT or AMD-V/RVI». Die Option erklärt die [Dokumentation von VMware Workstation Pro](https://techdocs.broadcom.com/us/en/vmware-cis/desktop-hypervisors/workstation-pro/26H1/using-vmware-workstation-pro/configuring-virtual-machine-hardware-settings/configuring-virtual-machine-processor-settings.html). Unter ESXi heisst die Option «Expose hardware assisted virtualization to the guest OS».

Unter Windows funktioniert die Option nur, wenn der Hypervisor von Windows nicht läuft. Meldet VMware beim Start «Virtualized Intel VT-x/EPT is not supported on this platform», nutzen die Speicherintegrität, WSL 2 oder Docker Desktop diesen Hypervisor. In diesem Fall ist Hyper-V oder smartlearn der bessere Weg.

Als Labnetz nimmst du das NAT-Netz VMnet8, das VMware Workstation bei der Installation anlegt. Im «Virtual Network Editor» unter «Edit» stellst du sein Subnetz auf 192.168.210.0 mit der Maske 255.255.255.0. Den Netzwerkadapter der drei VMs stellst du auf «NAT». In diesem Netz hat dein PC die Adresse .1 und das NAT-Gerät von VMware die Adresse .2, wie die [Konventionen für Adressen](https://techdocs.broadcom.com/us/en/vmware-cis/desktop-hypervisors/workstation-pro/26H1/using-vmware-workstation-pro/configuring-network-connections/assigning-ip-addresses-in-host-only-networks-and-nat-configurations/dhcp-conventions-for-assigning-ip-addresses-in-host-only-and-nat-networks.html) von VMware festhalten. Bei der Installation von Ubuntu trägst du deshalb 192.168.210.2 als Gateway ein, nicht .1 wie bei den anderen Hypervisoren. Die Adressen ab .128 vergibt dort der DHCP-Server von VMware. Liegen die Adressen aus deinem Code in diesem Bereich, hängst du keine weitere VM mit DHCP an VMnet8.

## VirtualBox

In VirtualBox heisst die Option «Enable Nested VT-x/AMD-V» und steht unter «System» und «Processor». Auf der Kommandozeile schaltest du sie bei ausgeschalteter VM mit `VBoxManage` ein. Beide Wege beschreibt das [Handbuch von VirtualBox](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/AdvancedTopics.html#nested-virt). Für VirtualBox unter Windows gilt dieselbe Einschränkung wie für VMware.

```bash
VBoxManage modifyvm "mmuster-node1" --nested-hw-virt on
```

Als Labnetz legst du ein NAT-Netzwerk mit dem Bereich 192.168.210.0/24 an.

```bash
VBoxManage natnetwork add --netname cc-lab --network "192.168.210.0/24" --enable
```

In den Einstellungen jeder VM wählst du danach unter «Network» bei «Attached to» den Eintrag «NAT Network» und das Netz `cc-lab`. Das Gateway bekommt in diesem Netz ohne weitere Einstellung die Adresse 192.168.210.1, wie das Handbuch im Abschnitt zum [NAT-Netzwerk](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html#network_nat_service) beschreibt.

## Proxmox

In Proxmox VE setzt du bei beiden Knoten unter «Hardware» und «Processors» den Typ auf `host`. Damit sieht die VM die CPU mit allen Funktionen, auch der Virtualisierung. Ob der Proxmox-Host verschachtelte Virtualisierung erlaubt, zeigt auf dem Host die folgende Datei. Sie muss `Y` oder `1` enthalten, bei AMD-Prozessoren heisst der Pfad `kvm_amd`. Die Einstellungen auf Host und VM beschreibt die [Seite zur verschachtelten Virtualisierung](https://pve.proxmox.com/wiki/Nested_Virtualization) im Wiki von Proxmox VE.

```bash
cat /sys/module/kvm_intel/parameters/nested
```

Als Labnetz legst du auf dem Proxmox-Host eine Bridge ohne physischen Port mit der Adresse 192.168.210.1/24 an, etwa `vmbr1`. Daran hängst du die drei VMs. Weiterleitung und Masquerading schaltest du in `/etc/network/interfaces` ein, wie der Abschnitt [Masquerading (NAT) with iptables](https://pve.proxmox.com/wiki/Network_Configuration#sysadmin_network_masquerading) im Wiki von Proxmox VE zeigt. Das Gateway der VMs ist dann 192.168.210.1.

::::exercise[Lab]
Wenn du einen eigenen Hypervisor nutzt, lege die drei VMs an, installiere Ubuntu nach Kapitel 0.2 und prüfe auf beiden Knoten die verschachtelte Virtualisierung.

:::solution
`grep -cE 'vmx|svm' /proc/cpuinfo` gibt auf beiden Knoten eine Zahl grösser als null aus. Ist sie null, ist die Option im Hypervisor aus, oder unter Windows läuft der Hypervisor von Windows im Hintergrund.
:::
::::
