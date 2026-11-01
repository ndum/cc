---
title: Backup und Wiederherstellung
description: RPO und RTO, was Git schon abdeckt und was nicht, der Cluster mit etcd und Snapshots, Backups der VMs in OpenNebula und eine Übung zur Wiederherstellung.
sidebar:
  order: 2
---

:::assignment
«Die neue Organisation fragt, was bei einem Ausfall passiert», schreibt Simone Wyss. «Wie lange sind wir weg, und wie viele Daten verlieren wir? Und bitte nicht nur behaupten, sondern einmal ausprobieren.»
:::

:::goals
Nach diesem Kapitel kannst du

- RPO und RTO für einen Dienst festlegen und begründen,
- unterscheiden, was Git abdeckt und was ein Backup braucht,
- den Cluster mit etcd und regelmässigen Snapshots betreiben,
- VMs in OpenNebula sichern und wiederherstellen,
- eine Wiederherstellung üben und die Zeit messen.
:::

## RPO und RTO

Zwei Zahlen beschreiben, was ein Ausfall kosten darf. Das Recovery Point Objective (RPO) ist der Zeitpunkt, bis zu dem Daten nach einem Ausfall wiederhergestellt sein müssen. Wer jede Nacht sichert, kann bis zu 24 Stunden Daten verlieren. Das Recovery Time Objective (RTO) ist die längste Zeit, die ein Dienst ausfallen darf, bevor der Schaden nicht mehr tragbar ist. Beide Begriffe stammen aus der Notfallplanung, das NIST definiert sie in [SP 800-34](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf).

Ein kleines RPO verlangt häufige Backups, ein kleines RTO eine schnelle Wiederherstellung, die geübt ist. Beides kostet. Die Treuhand verliert am Monatsende ungern einen halben Tag Buchungen, der Webshop verkraftet einen verlorenen Tag Logs ohne Weiteres.

Eine bewährte Faustregel ist die Regel 3-2-1, wie sie die amerikanische Behörde CISA in [Data Backup Options](https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf) beschreibt. Man hält drei Kopien wichtiger Daten, auf zwei verschiedenen Medien, und eine davon ausser Haus.

## Grenzen von Git

Seit Teil 4 steht der Soll-Zustand der Plattform in Git. Ein neuer Cluster holt sich daraus alle Anwendungen, Vorlagen und Regeln. Vieles liegt aber nicht in Git.

| Was | Wo | Gesichert durch |
|---|---|---|
| Manifeste, Charts, Regeln, SealedSecrets | Repo `platform` in Gitea | Git, mit Kopie auf dem Front-end in `~/platform` |
| State von OpenTofu | `~/platform/tofu/terraform.tfstate` | nicht in Git, enthält das Token von k3s |
| Zustand des Clusters, etwa Secrets und Passwort von Argo CD | etcd auf dem Server | Snapshots von k3s |
| Token von k3s, Schlüssel von Sealed Secrets | Server und Cluster | `backup-k3s.sh` |
| Daten in Volumes, etwa Prometheus, Loki, Audit-Log | Disk des Agents | in diesem Kurs nicht |
| VMs der Mitglieder | Datastores der Knoten | Backups von OpenNebula |

Das Repo in Gitea liegt auf dem Front-end. Fällt das Front-end aus, sind Gitea, State, Snapshots und Backups zugleich weg. Das verletzt die Regel 3-2-1. Eine Kopie gehört auf ein anderes System, etwa auf den Rechner der Lehrperson oder in einen Speicher ausser Haus.

## Der Cluster mit etcd

In Teil 4 hast du k3s mit seiner Standard-Datenbank SQLite installiert. Für Snapshots braucht k3s etcd. Die Vorlage aus den Ergänzungen von Teil 6 startet den Server mit `--cluster-init` und lässt k3s alle sechs Stunden einen Snapshot schreiben, acht davon bleiben auf dem Server. Die Optionen beschreibt die [Dokumentation von k3s](https://docs.k3s.io/cli/etcd-snapshot).

::code{file="platform/operations/repo/tofu/k3s.sh.tftpl"}

Die Datei kam mit dem Kopieren in Kapitel 6.1 in dein Repo. `tofu plan` zeigt nur eine Änderung am Kontext der beiden VMs. Das Startskript läuft aber nur beim ersten Start, eine geänderte Vorlage wirkt erst auf neuen VMs. Du baust den Cluster darum neu, und das ist zugleich die erste Übung zur Wiederherstellung. Der Neubau zeigt, wie viel Git allein zurückbringt.

Sichere vor dem Neubau den Schlüssel von Sealed Secrets, sonst kann der neue Cluster das Passwort von Grafana nicht entschlüsseln.

```bash
mkdir -p ~/backup/k3s && chmod 700 ~/backup ~/backup/k3s
kubectl -n kube-system get secret -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml > ~/backup/k3s/sealed-secrets-key.yaml
cd ~/platform && git add -A && git commit -m "k3s mit etcd und Snapshots" && git push
cd ~/platform/tofu
export OPENNEBULA_USERNAME=oneadmin
export OPENNEBULA_PASSWORD=$(cut -d: -f2- ~/.one/one_auth)
tofu apply -replace='opennebula_virtual_machine.k3s["k3s-server"]' -replace='opennebula_virtual_machine.k3s["k3s-agent"]'
```

Danach folgen die Schritte aus Kapitel 4.3 und 4.4, mit dem Schlüssel vor Argo CD.

```bash
source /etc/cc-lab.env
ssh-keygen -R $CC_K3S_SERVER_IP; ssh-keygen -R $CC_K3S_AGENT_IP
~/cc/platform/get-kubeconfig.sh
kubectl apply -f ~/backup/k3s/sealed-secrets-key.yaml
~/cc/platform/bootstrap-argocd.sh
```

Im Lab dauerte `tofu apply` 484 Sekunden. Einen grossen Teil davon warteten die alten VMs auf ihr Herunterfahren. OpenNebula hielt den neuen Server zudem in `pending` und meldete «Not enough capacity on datastores». Die freie Disk eines Knotens war noch der alte Wert. `onehost forceupdate` löste das sofort. Nach dem Bootstrap rollte Argo CD alles aus, und nach wenigen Minuten waren alle elf Applications synchron und gesund, auch das entschlüsselte Passwort von Grafana. Ollama lud sein Modell neu. Verloren waren die Daten in den Volumes, also die Metriken, die Logs und das Audit-Log des Triage-Dienstes.

## Snapshots sichern

Ein Snapshot auf dem Server hilft nicht, wenn der Server selbst verloren ist. Das Skript kopiert die Snapshots auf das Front-end, dazu das Token von k3s und den Schlüssel von Sealed Secrets. Ohne das Token des alten Servers startet k3s mit einem Snapshot nicht, denn das Token verschlüsselt vertrauliche Daten in der Datenbank.

::code{file="platform/operations/backup-k3s.sh"}

Ubuntu 26.04 bringt kein cron mit. Ein Timer von systemd startet das Skript alle sechs Stunden, eine halbe Stunde nach den Snapshots von k3s.

```bash
sudo ~/cc/platform/operations/install-backup-timer.sh
sudo systemctl start cc-backup-k3s.service
ls ~/backup/k3s/snapshots
```

Damit ist das RPO des Clusters sechs Stunden. Was in dieser Zeit über `kubectl` statt über Git geändert wurde, wäre nach einer Wiederherstellung weg.

## Den Cluster wiederherstellen

Die Übung simuliert einen schweren Bedienfehler, jemand löscht den Namespace `argocd` und damit die GitOps-Steuerung. Lege vorher einen Snapshot an und kopiere ihn.

```bash
ssh root@$CC_K3S_SERVER_IP k3s etcd-snapshot save --name vor-uebung
~/cc/platform/operations/backup-k3s.sh
kubectl delete namespace argocd
```

Zur Wiederherstellung stoppst du k3s, setzt die Datenbank auf den Snapshot zurück und startest k3s wieder. `--cluster-reset` macht den Server zum einzigen Mitglied eines neuen etcd-Clusters mit dem Inhalt des Snapshots.

```bash
snap=$(ls ~/backup/k3s/snapshots | grep vor-uebung | tail -1)
scp ~/backup/k3s/snapshots/$snap root@$CC_K3S_SERVER_IP:/root/
ssh root@$CC_K3S_SERVER_IP "systemctl stop k3s && k3s server --cluster-reset --cluster-reset-restore-path=/root/$snap && systemctl start k3s"
kubectl get namespace argocd
```

Im Lab war die API nach 13 Sekunden zurück, der Namespace `argocd` und alle Applications ebenso. Danach zeigte sich eine Falle. Controller wie Argo CD und der Operator von Prometheus beobachten den Cluster laufend und merken sich, welchen Stand sie zuletzt gesehen haben. Nach dem Zurücksetzen passte dieser Stand nicht mehr. Argo CD übernahm einen neuen Commit nicht mehr, und der Operator meldete Fehler beim Beobachten. Ein Neustart der Controller behob das.

```bash
kubectl -n argocd rollout restart deployment,statefulset
kubectl -n monitoring rollout restart deployment,statefulset
kubectl -n kube-system rollout restart deploy sealed-secrets-controller
```

Erst danach ist die Wiederherstellung fertig. Prüfe sie mit einem kleinen Commit, den Argo CD übernehmen muss, und mit dem Check `platform`.

## VMs in OpenNebula

Die VMs der Mitglieder sichert OpenNebula selbst. Backups landen in einem Datastore vom Typ `BACKUP_DS`. In der Community Edition gibt es die Treiber rsync und restic, die [Dokumentation von OpenNebula](https://docs.opennebula.io/7.4/product/cluster_configuration/backup_system/) beschreibt beide. Der Kurs nimmt rsync, das die Disks über SSH auf das Front-end kopiert.

::code{file="platform/operations/backup-datastore.sh"}

Ein Backup von Hand startet `onevm backup`, auch bei einer laufenden VM. Im Lab dauerte das Backup einer VM mit 1 GB Speicher und Ubuntu 26.04 elf Sekunden, das Backup-Image war 1004 MB gross.

```bash
~/cc/platform/operations/backup-datastore.sh
onevm backup -d backups <vm>
oneimage list
```

Regelmässige Backups übernimmt ein Backup-Job. Das Skript legt einen an, der jede Nacht um 2 Uhr sichert und sieben Backups behält.

::code{file="platform/operations/backup-job.sh"}

Zur Wiederherstellung macht `oneimage restore` aus einem Backup eine neue Vorlage mit einem neuen Image. Im Lab enthielt die neue VM wieder die Testdatei, die vor dem Backup angelegt worden war, gut anderthalb Minuten nach dem Befehl. Vorlage, Image und VM gehören danach `oneadmin`, `onevm chown` gibt die VM dem Mitglied zurück.

```bash
onevm terminate --hard <vm>
oneimage restore -d default <backup-image>
onetemplate instantiate <neue-vorlage> --name <name>
onevm chown <neue-vm> <benutzer> <gruppe>
```

Backups zählen zur Quota des Datastores. Ein Mitglied mit vielen grossen Backups braucht dort Platz, und der Platz kostet Geld, das in Kapitel 6.4 wieder auftaucht.

## Ausblick

Velero sichert Namespaces samt ihren Volumes in einen Objektspeicher und stellt einzelne Namespaces wieder her, ohne den ganzen Cluster zurückzusetzen. Es bräuchte einen Speicher wie MinIO und weitere Komponenten auf den knappen Knoten. Für den Kurs genügen Git, die Snapshots von etcd und die Backups von OpenNebula.

::::exercise[RPO und RTO]
Lege für die vier Mitglieder und für dein eigenes Mitglied aus UN4 ein RPO und ein RTO fest. Prüfe, ob die Plattform sie mit den Snapshots alle sechs Stunden und den nächtlichen Backups erreicht.

:::solution
Eine mögliche Festlegung ist die Treuhand mit RPO vier Stunden und RTO vier Stunden am Monatsende, die Praxis mit RPO 24 Stunden und RTO einem Arbeitstag, der Webshop mit RPO 24 Stunden und RTO einer Stunde am Samstag, die Gemeinde mit RPO 24 Stunden und RTO vier Stunden zu den Schalterzeiten. Die nächtlichen Backups der VMs erreichen ein RPO von 24 Stunden, die Treuhand bräuchte häufigere. Ein RTO von einer Stunde verlangt eine geübte Wiederherstellung, im Lab dauerte der Neubau des Clusters gut zehn Minuten, die Wiederherstellung aus dem Snapshot unter einer Minute.
:::
::::

::::exercise[Lab]
Baue den Cluster mit etcd neu, richte die Sicherung der Snapshots und einen Backup-Job ein und übe beide Wiederherstellungen, den Namespace `argocd` aus dem Snapshot und eine VM aus ihrem Backup. Miss die Zeiten.

:::solution
`k3s etcd-snapshot ls` auf dem Server zeigt Snapshots, `~/backup/k3s` enthält Snapshots, Token und Schlüssel, und `systemctl list-timers cc-backup-k3s.timer` zeigt den nächsten Lauf. `onebackupjob list` zeigt den Job, `oneimage list` ein Image vom Typ `BK`. Nach den Übungen sind Argo CD und die VM zurück, und der Check `operations` meldet die Prüfungen zum Backup als erfüllt. Die Zeiten liegen im Bereich des Labs, unter einer Minute für den Snapshot, rund zwei Minuten für die VM.
:::
::::

::::exercise[Drei Kopien]
Alle Backups liegen auf dem Front-end. Beschreibe, was bei einem Verlust des Front-ends verloren wäre, und schlage einen Weg zur Regel 3-2-1 vor, der zum Budget einer kleinen Genossenschaft passt.

:::solution
Mit dem Front-end wären Gitea, der State von OpenTofu, die Snapshots, die Backups der VMs und die Datenbank von OpenNebula zugleich weg. Die VMs auf den Knoten liefen weiter, liessen sich aber nicht mehr verwalten. Ein günstiger Weg ist eine verschlüsselte Kopie von `~/backup`, `~/platform` und dem Backup-Datastore jede Nacht auf einen Speicher ausser Haus, etwa eine Disk an einem zweiten Standort oder einen Objektspeicher in der Schweiz. Der Schlüssel dafür gehört nicht auf denselben Speicher.
:::
::::
