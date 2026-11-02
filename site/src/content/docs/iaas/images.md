---
title: Images, Vorlagen und Kontext
description: Datastores und Images aus dem Marketplace, eine Vorlage für kleine Ubuntu-VMs, die Kontextualisierung mit Netz, SSH-Schlüssel und Hostname und deine erste VM in der Cloud.
sidebar:
  order: 4
---

:::assignment
«Die Praxis Rosenweg möchte eine erste Testmaschine», schreibt Simone Wyss. «Ubuntu, klein, im internen Netz und ohne dass jemand von uns sie von Hand einrichten muss. Geht das in ein paar Minuten?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Datastores, Images und Vorlagen unterscheiden
- Ein Image aus dem Marketplace in deine Cloud holen
- Die Formate raw und qcow2 sowie persistente und nicht persistente Images unterscheiden
- Eine Vorlage für VMs lesen und anpassen
- Erklären, wie die Kontextualisierung eine VM beim ersten Start einrichtet
- Eine VM starten, dich per SSH anmelden und den Check dieses Teils bestehen
:::

## Datastores und Images

Ein Image ist eine Disk, aus der VMs starten, etwa ein vorbereitetes Ubuntu. Images liegen in einem Datastore. OneDeploy hat drei Datastores angelegt. `default` hält die Images, `system` die Disks laufender VMs, und `files` kleinere Dateien wie Skripte. Startet eine VM, kopiert der Transfertreiber `ssh` ihr Image in den Datastore `system` des Knotens. Die VM arbeitet auf dieser Kopie, das Image im Datastore bleibt unverändert.

Fertige Images liefert der Marketplace von OpenNebula. Mit `onemarketapp export` holst du ein Image in deinen Datastore. OpenNebula legt dazu eine einfache Vorlage an.

```bash
onemarketapp list | grep -i ubuntu
onemarketapp export "Ubuntu Minimal 26.04" ubuntu-26.04 --datastore default
oneimage list
```

Das Image ist bereit, sobald `oneimage list` in der Spalte `STAT` den Wert `rdy` zeigt.

## Formate von Images

Ein Image im Format raw enthält die Disk Byte für Byte, so wie sie auf einer echten Festplatte läge. Das Format ist einfach, schnell und lässt sich mit jedem Werkzeug lesen. Eine Disk von 30 GB belegt als raw-Datei 30 GB, ausser das Dateisystem unterstützt Sparse Files und reserviert nur die beschriebenen Bereiche, wie die [Dokumentation von QEMU](https://www.qemu.org/docs/master/system/qemu-block-drivers.html) erklärt.

qcow2 steht für QEMU Copy On Write in der Version 2. Die Datei wächst nur mit den Blöcken, die tatsächlich beschrieben sind, und kann Snapshots enthalten. Ausserdem kann eine qcow2-Datei auf ein Backing File verweisen, ein anderes Image, aus dem sie nur liest. Braucht die VM einen Block, den die eigene Datei nicht enthält, kommt er aus dem Backing File. Schreibt sie einen Block, landet er in der eigenen Datei, und das Backing File bleibt unverändert, so beschreibt es die [Spezifikation von qcow2](https://www.qemu.org/docs/master/interop/qcow2.html). Viele VMs können so ein gemeinsames Grundimage nutzen, und jede speichert nur ihre Änderungen. Auf Datastores mit gemeinsamem Speicher legt OpenNebula neue Disks auf diese Weise an, mit dem Image als Backing File, wie die [Dokumentation zu NFS-Datastores](https://docs.opennebula.io/7.4/product/cluster_configuration/storage_system/nas_ds/) zeigt.

Dein Lab nutzt qcow2. `oneimage show ubuntu-26.04` zeigt `FORMAT : qcow2` und eine Grösse von 3,5 GB, so gross ist die Disk für die VM. Die Datei unter `SOURCE` belegt im Datastore aber nur rund 450 MB, das zeigt `qemu-img info` auf dieser Datei. Weil der Transfertreiber `ssh` das Image auf den Knoten kopiert, hat die Disk einer VM im Lab kein Backing File. Sie ist eine eigenständige Kopie. Das Kopieren kostet beim Start etwas Zeit, dafür läuft die VM ohne Zugriff auf den Datastore des Front-ends.

## Persistente Images

Ein Image ist in OpenNebula entweder persistent oder nicht persistent. Ein nicht persistentes Image dient als Vorlage für Disks. Jede VM arbeitet auf ihrer eigenen Kopie, beliebig viele VMs können es gleichzeitig nutzen, und was eine VM auf ihre Disk schreibt, ist nach dem Beenden der VM weg. Ein persistentes Image behält die Änderungen über das Ende der VM hinaus, darf aber nur von einer einzigen VM gleichzeitig genutzt werden, wie die [Dokumentation zu Images](https://docs.opennebula.io/7.4/product/virtual_machines_operation/virtual_machines/images/) festhält. Mit `oneimage persistent` und `oneimage nonpersistent` wechselst du die Art.

Das Image `ubuntu-26.04` ist nicht persistent, `oneimage show` zeigt `PERSISTENT : No`. Die Spalte `RVMS` von `oneimage list` zeigt, wie viele VMs es gerade nutzen. Für Systemdisks ist das richtig, denn jede VM soll aus demselben Stand starten. Daten, die bleiben müssen, etwa die einer Datenbank, gehören auf eine zweite Disk aus einem persistenten Image. Willst du den Stand einer Disk als neues Image sichern, kopiert `onevm disk-saveas` sie in den Datastore.

## Vorlagen

Eine Vorlage beschreibt eine VM, aus der du beliebig viele VMs startest. Der Kurs liefert die Vorlage `ubuntu` für kleine VMs im internen Netz.

::code{file="lab/iaas/ubuntu.tpl"}

`CPU` ist der Anteil eines physischen Kerns, den der Scheduler für die VM reserviert. `VCPU` ist die Anzahl CPUs, die die VM sieht. Mit `CPU = "0.5"` und `VCPU = "1"` passen doppelt so viele VMs auf einen Knoten, wie er Kerne hat, solange nicht alle gleichzeitig voll rechnen. `CPU_MODEL` mit `host-passthrough` zeigt der VM die echte CPU, wie Kapitel 1.3 erklärt. `DISK` nennt das Image, `NIC` das Netz. Den Abschnitt `CONTEXT` erklärt der nächste Abschnitt.

```bash
onetemplate create ~/cc/lab/iaas/ubuntu.tpl
onetemplate list
```

## Kontextualisierung

Ein Image ist für alle VMs gleich, jede VM braucht aber ihre eigene Adresse, ihren Namen und die Schlüssel ihrer Benutzer. Diese Angaben gibt OpenNebula der VM beim Start mit. Es legt sie als kleines virtuelles CD-Laufwerk an die VM, und das Paket `one-context` im Image liest sie beim ersten Start und richtet die VM danach ein. Dieses Prinzip heisst Kontextualisierung.

| Angabe | Wirkung in der VM |
|---|---|
| `NETWORK = "YES"` | Adresse, Gateway, DNS und MTU aus dem Netz `cc-net` |
| `SSH_PUBLIC_KEY` | der öffentliche Schlüssel in `authorized_keys` von root |
| `SET_HOSTNAME` | der Hostname, hier der Name der VM |
| `START_SCRIPT` | ein Skript, das beim Start läuft, in Teil 4 für k3s |

`$USER[SSH_PUBLIC_KEY]` übernimmt den Schlüssel aus dem Benutzer, der die VM startet. Damit du dich vom Front-end aus anmelden kannst, legst du den Schlüssel des Front-ends bei `oneadmin` ab.

```bash
printf 'SSH_PUBLIC_KEY="%s"\n' "$(cat ~/.ssh/id_ed25519.pub)" > /tmp/key.tpl
oneuser update oneadmin --append /tmp/key.tpl
```

## Kontextualisierung und cloud-init

OpenNebula schreibt die Werte aus `CONTEXT` in eine Datei `context.sh` mit Zeilen der Form `NAME='Wert'` und legt sie auf ein ISO-Abbild, das die VM als CD-Laufwerk sieht, so beschreibt es die [Referenz der VM-Vorlage](https://docs.opennebula.io/7.4/product/operation_references/configuration_references/template/). Im Lab liegt dieses Abbild auf dem Knoten neben der Disk im Verzeichnis der VM, als `disk.1` mit der Bezeichnung `CONTEXT`. Die [Kontextualisierungspakete](https://docs.opennebula.io/7.4/product/virtual_machines_operation/guest_operating_systems/kvm_contextualization/) von OpenNebula hängen das Laufwerk beim Start ein, lesen die Variablen und richten danach Netz, Hostname, Schlüssel und Skripte ein. Die Images im Marketplace bringen diese Pakete schon mit.

In öffentlichen Clouds übernimmt meist [cloud-init](https://docs.cloud-init.io/en/latest/) diese Aufgabe. Auch cloud-init richtet eine generische VM beim ersten Start mit den Daten ihrer Instanz ein. Es holt diese Daten aus einer Datenquelle, je nach Cloud aus einem Metadatendienst im Netz oder von einer angehängten Disk. Die Einrichtung selbst kommt meist als YAML-Datei im Format `#cloud-config`. cloud-init hat auch eine [Datenquelle für OpenNebula](https://docs.cloud-init.io/en/latest/reference/datasources/opennebula.html), die dasselbe CD-Laufwerk mit `context.sh` liest. Ein Image, das für cloud-init gebaut ist, lässt sich also auch in OpenNebula einrichten. Der Unterschied liegt vor allem in der Form der Angaben. OpenNebula arbeitet mit einfachen Variablen, cloud-init mit einer Konfiguration aus Modulen für Pakete, Dateien, Benutzer und Befehle.

## Deine erste VM

Jetzt startest du eine VM aus der Vorlage und meldest dich an. Sie läuft meist nach wenigen Sekunden, SSH ist nach etwa einer halben Minute bereit.

```bash
onetemplate instantiate ubuntu --name web-1
onevm list
onevm show web-1 | grep -E 'IP=|HOST'
ssh root@<adresse-der-vm>
```

In der VM zeigen `hostname`, `ip -br addr` und `ip link show eth0`, was die Kontextualisierung eingerichtet hat. Mit `curl -I https://ubuntu.com` prüfst du, ob die VM über das Gateway ins Internet kommt. In Sunstone öffnet ein Klick auf die VM und dann auf das Symbol der Konsole ihren Bildschirm im Browser.

Der Check dieses Teils prüft das Netz, die Vorlage, eine laufende VM, die Anmeldung per SSH, ihren Hostnamen und den Zugang zum Internet.

```bash
python3 ~/cc/checks/check.py iaas
```

::::exercise[Lab]
Hole das Image, lege die Vorlage an, starte die VM `web-1` und lade den Bericht des Checks `iaas` in dein Abgabe-Repo.

:::solution
Der Check endet mit «11 von 11 Prüfungen der Basis erfüllt». In der VM zeigt `hostname` den Namen `web-1`, `ip -br addr` eine Adresse aus deinem internen Netz und `ip link show eth0` die MTU 1450.
:::
::::

::::exercise[Vorlage anpassen]
Die Treuhand Aaregg braucht am Monatsende eine grössere VM mit zwei CPUs und 2 GB Arbeitsspeicher. Lege eine Kopie der Vorlage unter dem Namen `ubuntu-medium` an und starte daraus eine VM. Wie viele solcher VMs passen nach `onehost list` auf einen Knoten?

:::solution
`onetemplate clone ubuntu ubuntu-medium` und danach `onetemplate update ubuntu-medium` mit `CPU = "1"`, `VCPU = "2"` und `MEMORY = "2048"`. Ein Knoten mit 7,2 GB Arbeitsspeicher und vier Kernen trägt drei solcher VMs, der Arbeitsspeicher setzt die Grenze, nicht die CPU.
:::
::::

::::exercise[Persistente Daten]
Die Praxis Rosenweg will in einer VM eine kleine Datenbank betreiben. Die Daten sollen erhalten bleiben, auch wenn die VM beendet und neu angelegt wird. Wie richtest du die Disks ein, und was spricht dagegen, einfach das Image `ubuntu-26.04` persistent zu machen?

:::solution
Die Systemdisk kommt weiterhin aus dem nicht persistenten Image `ubuntu-26.04`. Für die Daten legst du ein leeres persistentes Image an, etwa mit `oneimage create -d default --name praxis-db --type DATABLOCK --size 2048 --persistent`, und hängst es als zweite Disk an die VM. Wird die VM beendet, bleiben die Daten im Image, und eine neue VM kann es wieder einbinden. Wäre `ubuntu-26.04` persistent, dürfte es nur noch eine VM nutzen, alle weiteren VMs aus der Vorlage könnten nicht mehr starten, und jede Änderung an dieser Systemdisk landete im gemeinsamen Grundimage.
:::
::::
