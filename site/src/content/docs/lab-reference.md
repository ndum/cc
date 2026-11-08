---
title: Lab-Referenz
description: Die Werte deiner Parameter, die Adressen und Ports aller Dienste, wo die Zugangsdateien liegen und die wichtigsten Befehle pro Werkzeug.
sidebar:
  order: 2
---

Diese Seite fasst zusammen, was du im Betrieb deines Labs immer wieder nachschlägst. Die Beispiele verwenden den Code `mmuster`. Setze überall deine eigenen Werte aus `/etc/cc-lab.env` ein. In den Kapiteln der letzten Spalte findest du die Begründungen.

## Die Datei cc-lab.env

Alle drei VMs haben dieselbe Datei `/etc/cc-lab.env`. Die Skripte des Kurses lesen sie mit `source /etc/cc-lab.env`, die Checks lesen sie selbst ein. In deiner eigenen Shell stehen die Werte erst als Variablen bereit, nachdem du `source /etc/cc-lab.env` ausgeführt hast. Die persönlichen Werte der Meilensteine stehen nicht in der Datei. Sie zeigt dir der Generator in [Kapitel 0.3](../start/parameters/#deine-werte-für-die-meilensteine), die Checks berechnen sie aus deinem Code.

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
| `k3s-agent` | `CC_K3S_AGENT_IP` | Node für Pods, mit den Zusatzaufträgen von Teil 5 auch für Ollama |
| VMs der Mitglieder | ab `CC_GUEST_FIRST` | Leases aus `cc-net`, `onevnet show cc-net` zeigt sie |
| Client | 192.168.210.10 auf smartlearn | Kali Linux mit Browser und Terminal, von hier aus arbeitest du, mit eigenem Hypervisor übernimmt dein PC diese Rolle |

Am Front-end meldest du dich vom Client aus mit `ssh mmuster-fe` an, so wie in [Kapitel 0.4](../start/prepare/) eingerichtet. Der Client ist auf smartlearn die Kali-VM, mit eigenem Hypervisor dein PC. Die VMs in `cc-net` erreichst du nur vom Front-end aus, etwa mit `ssh root@<CC_K3S_SERVER_IP>`. Die festen Adressen der drei Server stehen auf smartlearn in `/etc/netplan/00-eth0.yaml`, wo sie der zweite Block aus Kapitel 0.3 eingetragen hat.

Auf dieser Seite steht `<CC_K3S_SERVER_IP>` für die Adresse von `k3s-server` aus dem ersten Block des Generators. Auf dem Front-end zeigt sie `grep K3S /etc/cc-lab.env`, für `mmuster` ist es 172.31.160.110. `<CC_FE_IP>` steht ebenso für die Adresse des Front-ends, für `mmuster` 192.168.210.137.

## Dienste und Ports

| Dienst | Port | Läuft auf | So erreichst du ihn | Kapitel |
|---|---|---|---|---|
| SSH | 22 | allen VMs | `ssh mmuster-fe`, nach der Härtung nur mit Schlüssel | [0.4](../start/prepare/), [6.1](../operations/security/) |
| Sunstone | 2616 | Front-end | `http://<CC_FE_IP>:2616/` im Browser des Clients | [2.2](../iaas/installation/) |
| API von OpenNebula | 2633 | Front-end | CLI und OpenTofu auf dem Front-end | [4.2](../platform/opentofu/) |
| OneFlow | 2474 | Front-end | CLI `oneflow` und Sunstone auf dem Front-end | [3.5](../tenants/advanced/) |
| Gitea | 3000 | Front-end | vor der Härtung `http://<CC_FE_IP>:3000/`, danach über einen Tunnel auf das Front-end | [4.4](../platform/gitops/) |
| OpenNebula-Exporter | 9925 | Front-end | Prometheus im Cluster | [5.1](../observability/metrics/) |
| node_exporter | 9100 | Front-end und Knoten | Prometheus im Cluster | [5.1](../observability/metrics/) |
| Libvirt-Exporter | 9926 | Knoten | Prometheus im Cluster | [5.1](../observability/metrics/) |
| API von Kubernetes | 6443 | k3s-server | kubectl mit `~/.kube/config` | [4.3](../platform/kubernetes/) |
| Webshop über Traefik | 80 | beiden Nodes | Tunnel `-L 8081:<CC_K3S_SERVER_IP>:80` | [4.4](../platform/gitops/) |
| Argo CD | 30080 | k3s-server | Tunnel `-L 8080:<CC_K3S_SERVER_IP>:30080` | [4.4](../platform/gitops/) |
| Prometheus | 30090 | k3s-server | Tunnel `-L 9090:<CC_K3S_SERVER_IP>:30090` | [5.1](../observability/metrics/) |
| Alertmanager | 30093 | k3s-server | Tunnel `-L 9093:<CC_K3S_SERVER_IP>:30093` | [5.1](../observability/metrics/) |
| Grafana | 30300 | k3s-server | Tunnel `-L 3000:<CC_K3S_SERVER_IP>:30300` | [5.1](../observability/metrics/) |
| Sprachmodell und Triage-Dienst | nach deiner Lösung | k3s | nach deiner Lösung, etwa über einen Tunnel | [5.5](../observability/advanced/) |

Die übrigen Ports des Front-ends, etwa von OneGate, MariaDB und guacd, stehen in der Tabelle von [Kapitel 2.2](../iaas/installation/#auf-dem-front-end). Nach der Härtung in [Kapitel 6.1](../operations/security/#das-front-end-härten) nimmt das Front-end von aussen nur noch SSH auf Port 22 und Sunstone auf Port 2616 an. Die Knoten und die VMs in `cc-net` erreichen weiterhin alle Ports. Alle anderen Dienste des Front-ends erreichst du vom Client aus dann nur noch über einen Tunnel.

Einen Tunnel öffnest du in einem zweiten Tab des Terminals des Clients, so bleibt der erste für das Front-end frei. `-N` öffnet nur den Tunnel ohne Shell, Ctrl+C in seinem Tab schliesst ihn wieder. Mehrere `-L` lassen sich in einer Verbindung kombinieren. Solange sie offen ist, erreichst du jeden Dienst im Browser des Clients unter `http://localhost:<lokaler-port>/`. Dieser Tunnel öffnet Argo CD, den Webshop, Prometheus, Alertmanager und Grafana auf einmal.

```bash
ssh -N -L 8080:<CC_K3S_SERVER_IP>:30080 -L 8081:<CC_K3S_SERVER_IP>:80 \
  -L 9090:<CC_K3S_SERVER_IP>:30090 -L 9093:<CC_K3S_SERVER_IP>:30093 \
  -L 3000:<CC_K3S_SERVER_IP>:30300 mmuster-fe
```

Für Gitea nach der Härtung leitest du einen freien lokalen Port auf Port 3000 des Front-ends weiter, etwa mit `-L 3001:localhost:3000`. Den lokalen Port 3000 belegt schon Grafana.

## Zugangsdateien

Diese Dateien liegen im Home-Verzeichnis deines Benutzers auf dem Front-end. Nur du darfst sie lesen. Ihr Inhalt gehört weder in Git noch in einen Screencast oder in einen Chat mit einem KI-Assistenten.

| Datei | Inhalt | Kapitel |
|---|---|---|
| `~/.ssh/id_ed25519` | privater Schlüssel des Front-ends für SSH auf die Knoten und als Deploy Key für dein Abgabe-Repo | [0.4](../start/prepare/#ssh-vom-front-end-auf-die-knoten), [0.5](../start/tools/#zugriff-vom-front-end) |
| `~/cc-lab/oneadmin.pass` | Passwort von `oneadmin` für Sunstone | [2.2](../iaas/installation/) |
| `~/cc-lab/inventory.yml` | Inventar von OneDeploy, enthält das Passwort von `oneadmin` im Klartext | [2.2](../iaas/installation/#das-inventar) |
| `~/.one/one_auth` | Benutzer und Passwort, mit denen sich die CLI von OpenNebula anmeldet | [2.2](../iaas/installation/) |
| `~/cc-lab/tenants/` | Passwörter und Anmeldedateien der Gruppenadmins | [3.1](../tenants/groups/) |
| `~/platform/tofu/terraform.tfstate` | State von OpenTofu mit geheimen Werten, nicht in Git | [4.1](../platform/iac/) |
| `~/.kube/config` | Adresse und Zertifikat für kubectl, volle Rechte auf den Cluster | [4.3](../platform/kubernetes/) |
| `~/cc-lab/gitea/` | Passwort des Benutzers `platform` und die Tokens für Git und Argo CD | [4.4](../platform/gitops/) |
| `~/.git-credentials` | Token, mit dem Git ins Repo `platform` pusht | [4.4](../platform/gitops/) |
| `~/cc-lab/argocd-admin.pass` | Passwort von `admin` in Argo CD, das Bootstrap-Skript legt es dort ab | [4.4](../platform/gitops/#zugriff-vom-client) |
| `~/cc-lab/grafana.pass` | Passwort von `admin` in Grafana | [5.1](../observability/metrics/) |
| `~/backup/k3s/` | Snapshots von etcd, das Token von k3s und der Schlüssel von Sealed Secrets | [6.2](../operations/backup/) |

Ein Passwort zeigt dir `cat` auf dem Front-end. Markiere es im Terminal des Clients, kopiere es mit Ctrl+Shift+C und füge es im Browser des Clients mit Ctrl+V ein.

```bash
cat ~/cc-lab/argocd-admin.pass
```

Weitere Ordner auf dem Front-end sind `~/cc` mit dem Kursrepo, `~/cc-lab` mit den Dateien, die die Skripte des Kurses für dein Lab anlegen, `~/platform` mit deinem Plattform-Repo, `~/cc-reports` mit den Berichten der Checks und `~/cc-mmuster` mit deinem Abgabe-Repo.

## Nach einer Pause

Wird deine Umgebung auf smartlearn ausgeschaltet oder startest du die Server neu, kommen die drei Server mit ihren Diensten von selbst wieder. Die VMs in OpenNebula laufen danach aber nicht mehr. OpenNebula findet sie auf ihren Knoten nicht mehr und setzt sie auf `poff`. Auf dem Front-end holst du sie so zurück.

```bash
onehost list
onevm list
onevm resume k3s-server
onevm resume k3s-agent
```

`onehost list` zeigt beide Knoten nach ein bis zwei Minuten wieder als `on`, erst dann startet `onevm resume` eine VM. Ab Teil 4 sind das vor allem `k3s-server` und `k3s-agent`. k3s startet in den VMs von selbst, `kubectl get nodes` zeigt beide Nodes nach ein bis zwei Minuten als `Ready`, danach gleicht Argo CD wieder ab. Weitere VMs, etwa `praxis-1`, startest du ebenso mit `onevm resume`, aber nur die, die vor der Pause liefen. Hält smartlearn die Umgebung nur an, statt sie auszuschalten, laufen alle VMs danach weiter und du musst nichts tun.

## Befehle

### OpenNebula

Die Befehle arbeiten als `oneadmin` mit `~/.one/one_auth`. Einen einzelnen Befehl als Mitglied startest du mit `ONE_AUTH=~/cc-lab/tenants/<mitglied>.auth <befehl>`, etwa `ONE_AUTH=~/cc-lab/tenants/praxis.auth onevm list`. Ein `export ONE_AUTH=...` gilt dagegen für alle folgenden Befehle, bis `unset ONE_AUTH` die Variable wieder löscht. `<knoten>` ist der Name aus der Spalte `NAME` von `onehost list`. OneDeploy trägt die Knoten mit ihren Adressen ein, für `mmuster` also 192.168.210.138 und 192.168.210.139. Statt des Namens geht auch die Nummer aus der Spalte `ID`, bei `<vm>` ebenso der Name oder die Nummer aus `onevm list`.

| Befehl | Zweck |
|---|---|
| `onehost list`, `onehost show <knoten>` | Zustand, Kapazität und Monitoring der Knoten |
| `onehost flush <knoten>`, `onehost offline <knoten>`, `onehost enable <knoten>` | Knoten leeren, für eine Wartung auf `off` setzen und wieder in Betrieb nehmen |
| `onehost forceupdate` | Monitoring der Knoten sofort neu einlesen |
| `onevm list`, `onevm show <vm>` | VMs mit Zustand, Knoten und Adresse |
| `onetemplate instantiate ubuntu --name <name>` | VM aus der Vorlage starten |
| `onetemplate clone ubuntu <name>`, `onetemplate update <name> --append <datei>` | Vorlage kopieren und in der Kopie nur die Werte aus der Datei ändern, ohne Editor |
| `onevm poweroff <vm>`, `onevm undeploy <vm>`, `onevm resume <vm>` | VM ausschalten, mit `undeploy` auch ihren Platz auf dem Knoten freigeben, mit `resume` wieder starten |
| `onevm terminate <vm>`, `onevm terminate --hard <vm>` | VM beenden und löschen |
| `onevm migrate --live <vm> <knoten>` | VM im Betrieb auf einen anderen Knoten verschieben |
| `onevm chown <vm> <benutzer> <gruppe>` | VM einem Benutzer und seiner Gruppe geben, etwa nach einer Wiederherstellung |
| `onevm backup -d backups <vm>` | VM in den Backup-Datastore sichern |
| `onebackupjob list`, `onebackupjob backup <job>` | Backup-Jobs anzeigen, ein Backup ausser der Reihe starten |
| `oneimage list`, `oneimage restore -d default <backup-image>` | Images und Backups anzeigen, ein Backup wiederherstellen |
| `onevnet show cc-net` | Adressbereich und Leases des internen Netzes |
| `onegroup list`, `onegroup show <gruppe>` | Gruppen der Mitglieder mit Quota und Verbrauch |
| `onegroup quota <gruppe> <datei>`, `oneuser quota <benutzer> <datei>` | Quota einer Gruppe oder eines Benutzers aus einer Datei setzen, ohne Datei öffnet sich ein Editor |
| `oneuser list`, `oneuser show` | Benutzer und ihre Gruppen, ohne Angabe zeigt `oneuser show` den Benutzer, als der die CLI gerade arbeitet |
| `oneacl list` | Regeln der ACLs mit Benutzer, Ressourcen und Rechten |
| `onevdc show wolkenwerk` | Gruppen und Cluster des VDC der Mitglieder |
| `oneshowback calculate`, `oneshowback list` | Kosten berechnen und anzeigen, mit `-g <gruppe>` nur für ein Mitglied, mit `--csv` als CSV |
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
| `ssh root@<CC_K3S_SERVER_IP> k3s etcd-snapshot ls` | Snapshots von etcd auf dem Server |

### Argo CD und Git

| Befehl | Zweck |
|---|---|
| `kubectl -n argocd get applications` | alle Applications mit Sync und Health |
| `kubectl -n argocd describe application <name>` | Meldungen einer Application, etwa ein Fehler beim Sync |
| `git status`, `git log --oneline` | Stand des Plattform-Repos in `~/platform` |
| `git add`, `git commit`, `git push` | Änderung nach Gitea bringen, Argo CD holt sie innert einer Minute |
| `git revert --no-edit <commit>` | einen Commit mit einem neuen Commit rückgängig machen, ohne Editor für die Nachricht |

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
| `python3 ~/cc/checks/check.py m1` bis `m4` | Check eines Meilensteins mit deinen persönlichen Werten und zwei Fragen für die Vorführung, sein Bericht belegt zusammen mit den Screenshots die Basis, bei Meilenstein 1 mit den Berichten von `start`, `install` und `iaas` |
| `ls ~/cc-reports` | gespeicherte Berichte mit Hash |

### Kursrepo und Abgabe

Das Kursrepo liegt auf jedem der drei Server in `~/cc`, dein Abgabe-Repo auf dem Front-end in `~/cc-mmuster`. Wie das Abgabe-Repo aufgebaut ist und wie du abgibst, steht unter [Abgeben](../assessment/#abgeben).

| Befehl | Zweck |
|---|---|
| `git -C ~/cc pull` | neuen Stand des Kursrepos holen, wenn ihn deine Dozentin oder dein Dozent ankündigt, auf jedem der drei Server |
| `cp ~/cc-reports/m1-*.txt ~/cc-mmuster/reports/` | Bericht eines Checks ins Abgabe-Repo legen |
| `scp ~/5-trennung.png mmuster-fe:cc-mmuster/m1/` | Screenshot, den du mit dem Screenshot-Werkzeug von Kali im Home-Ordner gespeichert hast, in den Ordner des Meilensteins kopieren, auf dem Client in einem zweiten Tab des Terminals |
| `git pull`, `git add .`, `git commit -m "<nachricht>"`, `git push` | im Abgabe-Repo zuerst holen, was du im Browser hochgeladen hast, danach deine Änderungen hochladen |
| `git tag abgabe-1`, `git push origin abgabe-1` | eine Abgabe mit einem Tag festhalten, die zweite heisst `abgabe-2` |
