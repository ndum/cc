---
title: Lab-Referenz
description: Die Werte deiner Parameter, die Adressen und Ports aller Dienste, wo die Zugangsdateien liegen und die wichtigsten Befehle pro Werkzeug.
sidebar:
  order: 2
---

Diese Seite fasst zusammen, was du im Betrieb deines Labs immer wieder nachschlägst. Die Beispiele verwenden den Code `mmuster`. Setze überall deine eigenen Werte aus `/etc/cc-lab.env` ein. In den Kapiteln der letzten Spalte findest du die Begründungen.

## Die Datei cc-lab.env

Alle drei VMs haben dieselbe Datei `/etc/cc-lab.env`. Skripte und Checks lesen sie mit `source /etc/cc-lab.env`, danach stehen die Werte als Variablen zur Verfügung.

| Variable | Bedeutung | Kapitel |
|---|---|---|
| `CC_CODE` | dein persönlicher Code | [0.3](../start/parameters/) |
| `CC_LANG` | Sprache der Berichte, `de` oder `en` | [0.3](../start/parameters/) |
| `CC_FE_HOST`, `CC_NODE1_HOST`, `CC_NODE2_HOST` | Namen der drei VMs, etwa `mmuster-fe` | [0.3](../start/parameters/) |
| `CC_FE_IP`, `CC_NODE1_IP`, `CC_NODE2_IP` | Adressen der drei VMs im Labnetz | [0.3](../start/parameters/) |
| `CC_GUEST_NET` | internes Netz `cc-net` für die VMs deiner Cloud, ein /24 in 172.16.0.0/12 | [2.3](../iaas/networks/) |
| `CC_GUEST_GATEWAY` | Adresse des Front-ends in `cc-net`, endet auf `.1` | [2.3](../iaas/networks/) |
| `CC_GUEST_FIRST`, `CC_GUEST_SIZE` | erste Adresse und Anzahl Adressen für die VMs, ab `.10` und 200 Adressen | [2.3](../iaas/networks/) |
| `CC_VNI`, `CC_VXLAN_GROUP` | Kennung und Multicast-Gruppe des VXLAN | [2.3](../iaas/networks/) |
| `CC_K3S_SERVER_IP`, `CC_K3S_AGENT_IP` | feste Adressen von k3s-server und k3s-agent, enden auf `.110` und `.111` | [4.2](../platform/opentofu/) |

## Rechner und Rollen

| Rechner | Adresse | Rolle |
|---|---|---|
| Front-end `mmuster-fe` | `CC_FE_IP`, in `cc-net` zusätzlich `CC_GUEST_GATEWAY` | OpenNebula, Gateway mit NAT für `cc-net`, Gitea, OpenTofu, kubectl, Backups |
| Knoten `mmuster-node1` und `mmuster-node2` | `CC_NODE1_IP`, `CC_NODE2_IP` | KVM und libvirt für die VMs der Cloud |
| `k3s-server` | `CC_K3S_SERVER_IP` | Control Plane mit etcd, führt auch Pods aus |
| `k3s-agent` | `CC_K3S_AGENT_IP` | Node für Pods, unter anderem Ollama |
| VMs der Mitglieder | ab `CC_GUEST_FIRST` | Leases aus `cc-net`, `onevnet show cc-net` zeigt sie |
| Client | 192.168.210.10 auf smartlearn | Kali Linux mit Browser und Terminal, von hier aus arbeitest du, mit eigenem Hypervisor übernimmt dein PC diese Rolle |

Am Front-end meldest du dich vom Client aus mit `ssh mmuster-fe` an, so wie in [Kapitel 0.5](../start/tools/) eingerichtet. Der Client ist auf smartlearn die Kali-VM, mit eigenem Hypervisor dein PC. Die VMs in `cc-net` erreichst du nur vom Front-end aus, etwa mit `ssh root@$CC_K3S_SERVER_IP`.

## Dienste und Ports

| Dienst | Port | Läuft auf | So erreichst du ihn | Kapitel |
|---|---|---|---|---|
| SSH | 22 | allen VMs | `ssh mmuster-fe`, nach der Härtung nur mit Schlüssel | [0.5](../start/tools/), [6.1](../operations/security/) |
| Sunstone | 2616 | Front-end | `http://<CC_FE_IP>:2616/` im Browser des Clients | [2.2](../iaas/installation/) |
| API von OpenNebula | 2633 | Front-end | CLI und OpenTofu auf dem Front-end | [4.2](../platform/opentofu/) |
| Gitea | 3000 | Front-end | vor der Härtung `http://<CC_FE_IP>:3000/`, danach über einen Tunnel auf das Front-end | [4.4](../platform/gitops/) |
| OpenNebula-Exporter | 9925 | Front-end | Prometheus im Cluster | [5.1](../observability/metrics/) |
| node_exporter | 9100 | Front-end und Knoten | Prometheus im Cluster | [5.1](../observability/metrics/) |
| Libvirt-Exporter | 9926 | Knoten | Prometheus im Cluster | [5.1](../observability/metrics/) |
| API von Kubernetes | 6443 | k3s-server | kubectl mit `~/.kube/config` | [4.3](../platform/kubernetes/) |
| Webshop über Traefik | 80 | beiden Nodes | Tunnel `-L 8081:<CC_K3S_SERVER_IP>:80` | [4.4](../platform/gitops/) |
| Argo CD | 30080 | k3s-server | Tunnel `-L 8080:<CC_K3S_SERVER_IP>:30080` | [4.4](../platform/gitops/) |
| Prometheus | 30090 | k3s-server | Tunnel `-L 9090:<CC_K3S_SERVER_IP>:30090` | [5.1](../observability/metrics/) |
| Alertmanager | 30093 | k3s-server | Tunnel `-L 9093:<CC_K3S_SERVER_IP>:30093` | [5.3](../observability/slo/) |
| Grafana | 30300 | k3s-server | Tunnel `-L 3000:<CC_K3S_SERVER_IP>:30300` | [5.1](../observability/metrics/) |
| Sprachmodell und Triage-Dienst | nach deiner Lösung | k3s | nach deiner Lösung, etwa über einen Tunnel | [5.5](../observability/advanced/) |

Einen Tunnel öffnest du im Terminal des Clients. Mehrere `-L` lassen sich in einer Verbindung kombinieren. Solange sie offen ist, erreichst du den Dienst im Browser des Clients unter `http://localhost:<lokaler-port>/`.

```bash
ssh -L 8080:<CC_K3S_SERVER_IP>:30080 -L 3000:<CC_K3S_SERVER_IP>:30300 mmuster-fe
```

Für Gitea nach der Härtung leitest du einen freien lokalen Port auf Port 3000 des Front-ends weiter, etwa mit `-L 3001:localhost:3000`. Den lokalen Port 3000 belegt schon Grafana.

## Zugangsdateien

Diese Dateien liegen im Home-Verzeichnis deines Benutzers auf dem Front-end. Nur du darfst sie lesen. Ihr Inhalt gehört weder in Git noch in einen Screencast oder in einen Chat mit einem KI-Assistenten.

| Datei | Inhalt | Kapitel |
|---|---|---|
| `~/cc-lab/oneadmin.pass` | Passwort von `oneadmin` für Sunstone | [2.2](../iaas/installation/) |
| `~/.one/one_auth` | Benutzer und Passwort, mit denen sich die CLI von OpenNebula anmeldet | [2.2](../iaas/installation/) |
| `~/cc-lab/tenants/` | Passwörter und Anmeldedateien der Gruppenadmins | [3.1](../tenants/groups/) |
| `~/platform/tofu/terraform.tfstate` | State von OpenTofu mit geheimen Werten, nicht in Git | [4.1](../platform/iac/) |
| `~/.kube/config` | Adresse und Zertifikat für kubectl, volle Rechte auf den Cluster | [4.3](../platform/kubernetes/) |
| `~/cc-lab/gitea/` | Passwort des Benutzers `platform` und die Tokens für Git und Argo CD | [4.4](../platform/gitops/) |
| `~/.git-credentials` | Token, mit dem Git ins Repo `platform` pusht | [4.4](../platform/gitops/) |
| `~/cc-lab/grafana.pass` | Passwort von `admin` in Grafana | [5.1](../observability/metrics/) |
| `~/backup/k3s/` | Snapshots von etcd, das Token von k3s und der Schlüssel von Sealed Secrets | [6.2](../operations/backup/) |

Das Passwort von `admin` in Argo CD legt das Bootstrap-Skript in einer Datei ab.

```bash
cat ~/cc-lab/argocd-admin.pass
```

Weitere Ordner auf dem Front-end sind `~/cc` mit dem Kursrepo, `~/platform` mit deinem Plattform-Repo und `~/cc-reports` mit den Berichten der Checks.

## Befehle

### OpenNebula

| Befehl | Zweck |
|---|---|
| `onehost list`, `onehost show <knoten>` | Zustand, Kapazität und Monitoring der Knoten |
| `onehost flush <knoten>`, `onehost enable <knoten>` | Knoten leeren und wieder in Betrieb nehmen |
| `onehost forceupdate` | Monitoring der Knoten sofort neu einlesen |
| `onevm list`, `onevm show <vm>` | VMs mit Zustand, Knoten und Adresse |
| `onetemplate instantiate ubuntu --name <name>` | VM aus der Vorlage starten |
| `onevm terminate <vm>`, `onevm terminate --hard <vm>` | VM beenden und löschen |
| `onevm migrate --live <vm> <knoten>` | VM im Betrieb auf einen anderen Knoten verschieben |
| `onevm backup -d backups <vm>` | VM in den Backup-Datastore sichern |
| `oneimage list`, `oneimage restore -d default <backup-image>` | Images und Backups anzeigen, ein Backup wiederherstellen |
| `onevnet show cc-net` | Adressbereich und Leases des internen Netzes |
| `onegroup list`, `onegroup show <gruppe>` | Gruppen der Mitglieder mit Quota und Verbrauch |
| `oneuser list` | Benutzer und ihre Gruppen |
| `oneshowback calculate`, `oneshowback list` | Kosten berechnen und anzeigen |
| `oneflow list`, `oneflow show <dienst>` | Dienste von OneFlow mit Rollen und Kardinalität |

### OpenTofu

Diese Befehle führst du im Ordner `~/platform/tofu` aus, nachdem du `OPENNEBULA_USERNAME` und `OPENNEBULA_PASSWORD` wie in [Kapitel 4.2](../platform/opentofu/) gesetzt hast.

| Befehl | Zweck |
|---|---|
| `tofu init` | Provider laden, in jeder neuen Kopie des Repos |
| `tofu plan` | Änderungen und Drift anzeigen, ohne etwas zu tun |
| `tofu apply` | Code umsetzen |
| `tofu apply -replace='opennebula_virtual_machine.k3s["k3s-agent"]'` | eine VM neu bauen |
| `tofu state list`, `tofu output` | Objekte im State und Ausgaben anzeigen |

### Kubernetes

| Befehl | Zweck |
|---|---|
| `kubectl get nodes -o wide` | Nodes mit Zustand und Adresse |
| `kubectl get pods -A -o wide` | alle Pods mit Node |
| `kubectl -n <ns> describe pod <pod>` | Ereignisse eines Pods, etwa ein Fehler beim Pull |
| `kubectl -n <ns> get events --sort-by=.lastTimestamp` | Ereignisse eines Namespaces, etwa `FailedCreate` |
| `kubectl -n <ns> logs <pod>` | Logs eines Pods, solange er existiert |
| `kubectl -n <ns> rollout restart deployment <name>` | Pods eines Deployments neu starten |
| `kubectl top nodes`, `kubectl top pods -A` | aktueller Verbrauch an CPU und Speicher |
| `kubectl -n <ns> get resourcequota,limitrange,networkpolicy` | Rahmen eines Mitglieds |
| `kubectl -n <ns> get hpa` | Zustand des Autoscalers |

### Argo CD und Git

| Befehl | Zweck |
|---|---|
| `kubectl -n argocd get applications` | alle Applications mit Sync und Health |
| `kubectl -n argocd describe application <name>` | Meldungen einer Application, etwa ein Fehler beim Sync |
| `git status`, `git log --oneline` | Stand des Plattform-Repos in `~/platform` |
| `git add`, `git commit`, `git push` | Änderung nach Gitea bringen, Argo CD holt sie innert einer Minute |
| `git revert <commit>` | einen Commit mit einem neuen Commit rückgängig machen |

### Systemdienste und Firewall

| Befehl | Zweck |
|---|---|
| `systemctl status <dienst>` | Zustand eines Dienstes, etwa `opennebula`, `gitea` oder `cc-gateway` |
| `sudo systemctl restart <dienst>` | Dienst neu starten |
| `journalctl -u <dienst> -n 50` | letzte Meldungen eines Dienstes |
| `systemctl list-timers` | Timer wie `cc-backup-k3s.timer` mit nächstem Lauf |
| `sudo nft list ruleset` | alle Tabellen von nftables, darunter `cc_gateway` und `cc_firewall` |

### Checks

| Befehl | Zweck |
|---|---|
| `python3 ~/cc/checks/check.py <name>` | Check eines Teils ausführen, etwa `iaas`, `platform` oder `operations` |
| `ls ~/cc-reports` | gespeicherte Berichte mit Hash |
