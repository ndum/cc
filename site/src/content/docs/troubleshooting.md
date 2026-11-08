---
title: Fehlerbehebung
description: Ein Vorgehen für Störungen in deinem Lab und die häufigen Probleme aller Teile, geordnet nach Schicht, mit Ursache und Lösung.
sidebar:
  order: 3
---

In den Tabellen dieser Seite stehen Probleme, die beim Erproben des Kurses aufgetreten sind. Bevor du darin nach deinem Symptom suchst, geh die Schritte im nächsten Abschnitt durch. Sie helfen auch bei Problemen, die keine Tabelle aufführt.

## Vorgehen bei einer Störung

1. Halte das Symptom genau fest. Wer meldet was seit wann? Wie lautet die Fehlermeldung wörtlich?
2. Grenze die Schicht ein und arbeite dich von unten nach oben. `onehost list` zeigt die Knoten, `onevm list` die VMs, `kubectl get nodes` den Cluster und `kubectl -n argocd get applications` den Abgleich mit Git. Erst danach schaust du dir die Anwendung an.
3. Lies die Logs und Ereignisse der betroffenen Schicht, etwa mit `journalctl -u <dienst>`, mit `kubectl describe` und `kubectl get events`, über Loki in Grafana oder im Abschnitt `MONITORING` von `onehost show`.
4. Suche die letzte Änderung. `git log` im Plattform-Repo zeigt, was über Git kam. Denk auch an das, was du oder jemand anderes von Hand geändert hat.
5. Behebe die Ursache dort, wo der Zustand entsteht. Was aus Git kommt, korrigierst du in Git, was aus Code kommt, im Code. Eine Änderung von Hand an einem Objekt, das Argo CD verwaltet, setzt Self-Heal sofort zurück.
6. Prüfe, ob das Symptom weg ist. Lass auch den Check des Teils laufen. Halte am Ende in wenigen Sätzen Ursache, Behebung und Vorbeugung fest.

Die Adressen, Ports und Befehle für diese Schritte stehen in der [Lab-Referenz](../lab-reference/).

In den Tabellen steht `<CC_K3S_SERVER_IP>` für die Adresse von `k3s-server` und `<CC_K3S_AGENT_IP>` für die von `k3s-agent`. Beide stammen aus dem ersten Block des Generators, auf dem Front-end zeigt sie `grep K3S /etc/cc-lab.env`. Für `mmuster` sind es 172.31.160.110 und 172.31.160.111. `<knoten>` ist der Name eines Knotens in der Spalte `NAME` von `onehost list`, also seine Adresse.

## Lab und VMs

| Symptom | Ursache | Was hilft | Kapitel |
|---|---|---|---|
| VMware meldet «Virtualized Intel VT-x/EPT is not supported on this platform» | Der Hypervisor von Windows läuft, etwa wegen Speicherintegrität, WSL 2 oder Docker Desktop | Hyper-V statt VMware verwenden oder auf smartlearn arbeiten | [Eigener Hypervisor](../extras/own-hypervisor/) |
| Ein Knoten startet auf deinem PC nicht, zu wenig Speicher | Dein PC hat weniger als die 48 GB, die die drei VMs zusammen mit Windows brauchen, oder die Knoten haben mehr als 8 GB | Knoten auf 8 GB stellen, sonst einen PC mit mehr RAM nehmen | [Eigener Hypervisor](../extras/own-hypervisor/) |
| `ssh` bricht mit «No route to host» oder «Connection timed out» ab | Der Server läuft nicht, die Adresse in `00-eth0.yaml` stimmt nicht oder er hat noch seine Standardadresse | Auf smartlearn prüfen, ob die VM läuft, an ihrer Konsole `ip -br addr` und `/etc/netplan/00-eth0.yaml` ansehen | [0.3](../start/parameters/) |
| Nach einem Neustart ist ein Server nicht mehr erreichbar | Die neue Adresse steht nicht fest in netplan | An der Standardadresse anmelden und den zweiten Block aus Kapitel 0.3 nochmals einfügen, auf einem eigenen Hypervisor die feste Adresse eintragen | [0.3](../start/parameters/) |
| `git: command not found` | Die minimale Installation von Ubuntu enthält kein Git | `sudo apt install -y git` | [0.4](../start/prepare/) |
| `prepare.sh` meldet «This VM has no address» | Falsche Rolle, oder die Adressen in `/etc/cc-lab.env` passen nicht zur VM | Rolle prüfen, `ip -br a` mit `/etc/cc-lab.env` vergleichen | [0.4](../start/prepare/) |
| `prepare.sh` meldet «sees no vmx or svm flag» | Verschachtelte Virtualisierung ist für den Knoten ausgeschaltet | Auf smartlearn der Dozentin oder dem Dozenten melden, bei Hyper-V `Set-VMProcessor -ExposeVirtualizationExtensions $true` bei ausgeschalteter VM | [0.2](../start/lab/), [Eigener Hypervisor](../extras/own-hypervisor/) |
| Werte aus `/etc/cc-lab.env` enden mit einem unsichtbaren Zeichen | Die Datei kam über einen Windows-Editor mit Zeilenenden CR LF | `prepare.sh` noch einmal ausführen, es entfernt die Zeichen | [0.3](../start/parameters/) |
| Check `start` meldet `[!!]` bei SSH ohne Passwort | Der Schlüssel des Front-ends fehlt auf einem Knoten | `ssh-copy-id` vom Front-end auf den Knoten | [0.4](../start/prepare/) |
| `git clone` des Abgabe-Repos bricht mit «port 22: Connection timed out» ab | Das Netz lässt SSH zu GitHub oder GitLab auf Port 22 nicht durch | Auf GitHub über Port 443 klonen, etwa mit `git clone ssh://git@ssh.github.com:443/mmuster/cc-mmuster.git`, wie es die [Anleitung von GitHub](https://docs.github.com/en/authentication/troubleshooting-ssh/using-ssh-over-the-https-port) zeigt. Beim GitLab der Schule fragst du deine Dozentin oder deinen Dozenten | [0.5](../start/tools/#zugriff-vom-front-end) |
| `git clone` oder `git push` meldet «Permission denied (publickey)» | Der Deploy Key fehlt im Repo oder passt nicht zum Schlüssel des Front-ends, etwa weil du den Schlüssel des Clients eingetragen hast | `cat ~/.ssh/id_ed25519.pub` auf dem Front-end mit dem Deploy Key im Repo vergleichen, `ssh -T git@github.com` prüft die Anmeldung bei GitHub | [0.5](../start/tools/#zugriff-vom-front-end) |
| `git push` ins Abgabe-Repo meldet «read only» oder «does not have write access» | Der Deploy Key darf nur lesen | Den Deploy Key löschen und mit Schreibrecht neu anlegen, auf GitHub mit «Allow write access», auf GitLab mit «Grant write permissions to this key» | [0.5](../start/tools/#zugriff-vom-front-end) |
| `git push` ins Abgabe-Repo meldet «rejected» und «fetch first» | Im Repo liegen Commits aus dem Browser, die auf dem Front-end fehlen | `git pull`, danach noch einmal `git push` | [0.5](../start/tools/#bericht-und-screenshots-hochladen) |
| Ein Befehl wie `onetemplate update` oder `oneuser quota` öffnet einen Editor, den du nicht verlassen kannst | Ohne die Variable `EDITOR` öffnet die CLI von OpenNebula den Editor vi | In vi drückst du Esc und gibst `:q!` mit Enter ein, so verlässt du ihn ohne zu speichern. `:wq` speichert vorher. Nach `export EDITOR=nano` öffnen OpenNebula, Git und kubectl nano. In `~/.bashrc` gilt die Zeile auch nach der nächsten Anmeldung | [2.4](../iaas/images/), [3.4](../tenants/self-service/) |

## OpenNebula

| Symptom | Ursache | Was hilft | Kapitel |
|---|---|---|---|
| OneDeploy meldet `UNREACHABLE` für einen Knoten | Der Schlüssel des Front-ends fehlt auf dem Knoten, oder der Knoten ist aus | Schlüssel nachtragen, VM starten | [2.2](../iaas/installation/) |
| «Please make sure each cluster member can resolve all Front-end hostnames» oder «Could not find the requested service rsyslog.service» | `prepare.sh` lief nicht auf allen VMs | `prepare.sh` mit der richtigen Rolle auf jeder VM | [2.2](../iaas/installation/) |
| «opennebula-fireedge ... Depends nodejs» oder «Failed to set permissions on the temporary files» | Der Pin für Node.js oder das Paket acl fehlt auf dem Front-end | `sudo ~/cc/lab/prepare.sh fe` noch einmal | [2.2](../iaas/installation/) |
| Ein Host steht in `onehost list` auf `err` | SSH vom Front-end als `oneadmin` zum Knoten klappt nicht, KVM fehlt, oder der Knoten ist ausgefallen | `onehost show <knoten>`, Abschnitt `MONITORING`, auf dem Knoten `ls /dev/kvm` | [2.5](../iaas/hosts/) |
| Die Weboberfläche lädt nicht | Port 2616 ist vom Client aus nicht erreichbar | Im Browser des Clients die Adresse des Front-ends im Labnetz verwenden, auf dem Front-end prüfen, ob `opennebula-fireedge` läuft | [2.2](../iaas/installation/) |
| Meldest du dich in Sunstone als zweiter Benutzer an, arbeiten alle Tabs als dieser Benutzer | Sunstone hält im Browser eine Sitzung pro Adresse, alle Tabs derselben Adresse teilen sie | Den zweiten Benutzer in einem privaten Fenster von Firefox anmelden, das Ctrl+Shift+P öffnet, oder dich vorher abmelden | [3.4](../tenants/self-service/#ansichten-von-sunstone) |
| Befehle wie `onevm list` melden einen Fehler bei der Anmeldung | `~/.one/one_auth` fehlt | Datei wie in 2.2 anlegen | [2.2](../iaas/installation/) |
| Ein Block des Plattform-Teams scheitert mit «Not authorized to perform», etwa bei `ADMIN GROUP` oder `MANAGE TEMPLATE` | `ONE_AUTH` zeigt noch auf die Datei eines Gruppenadmins, die CLI arbeitet als dieses Mitglied | `oneuser show` zeigt, als wer die CLI gerade arbeitet. `unset ONE_AUTH` löscht die Variable, danach den Block wiederholen | [3.1](../tenants/groups/#als-mitglied-arbeiten) |
| `onetemplate instantiate` findet keinen passenden Host | Knoten gesperrt oder voll reserviert | `onehost list`, `onehost enable`, nicht mehr gebrauchte VMs löschen | [2.5](../iaas/hosts/) |
| Eine VM bleibt `pending` mit «Not enough capacity on datastores» | Das Monitoring der Knoten zeigt noch den alten freien Platz | `onehost forceupdate` | [6.2](../operations/backup/) |
| Ein Mitglied sieht `cc-net` nicht | Die Gruppe ist noch im VDC `default`, oder der Cluster fehlt im VDC | `onevdc show wolkenwerk`, `make-tenants.sh` noch einmal | [3.1](../tenants/groups/) |
| Ein Mitglied kann keine VM mehr starten | Seine Quota ist ausgeschöpft | `onegroup show <gruppe>`, VMs aufräumen oder Quota bewusst anpassen | [3.2](../tenants/quotas/) |
| `Not authorized to perform CREATE DOCUMENT` beim Start eines Dienstes | Die Gruppe darf keine Dokumente anlegen | `oneacl create "@<gid> DOCUMENT/* CREATE"` | [3.5](../tenants/advanced/) |
| `oneshowback list` zeigt Kosten 0 | VM vor dem Eintragen der Preise gestartet, oder `calculate` fehlt | VM mit `onevm terminate` beenden und aus der Vorlage neu starten, nach einer Weile `oneshowback calculate` | [3.3](../tenants/showback/) |
| Der Dienst von OneFlow wächst nicht | Last zu kurz, oder OneFlow nimmt das Mittel aller VMs der Rolle | `oneflow show`, mindestens drei Minuten Last, in allen VMs der Rolle Last erzeugen | [3.5](../tenants/advanced/) |
| Eine wiederhergestellte VM gehört `oneadmin` | `oneimage restore` legt neue Objekte an | `onevm chown <vm> <benutzer> <gruppe>` | [6.2](../operations/backup/) |
| `onevm backup` lehnt eine VM ab | Die VM steht schon in einem Backup-Job | `onebackupjob backup praxis-nightly` sichert alle VMs des Jobs | [6.2](../operations/backup/) |
| Nach der Wiederherstellung fehlt eine Datei, die kurz vor dem Backup entstand | Ubuntu hatte sie noch nicht auf die Disk geschrieben | Vor dem Backup in der VM `sync` ausführen | [6.2](../operations/backup/) |

## Netz

| Symptom | Ursache | Was hilft | Kapitel |
|---|---|---|---|
| `make-network.sh` findet keine Schnittstelle | SSH vom Front-end zu Knoten 1 fehlt | Schlüssel nachtragen oder die Schnittstelle als Argument angeben | [2.3](../iaas/networks/) |
| Die VM läuft, SSH auf ihre Adresse hängt | `cc-gateway` läuft nicht, oder Multicast im Netz von smartlearn ist blockiert | `sudo cc-gateway status`, `bridge fdb show dev cc-vxlan` | [2.3](../iaas/networks/) |
| SSH auf eine VM verlangt ein Passwort | Der Schlüssel war bei `oneadmin` oder beim Gruppenadmin nicht hinterlegt, als die VM startete | Schlüssel mit `oneuser update --append` hinterlegen, VM beenden und aus der Vorlage neu starten | [2.4](../iaas/images/), [3.1](../tenants/groups/#als-mitglied-arbeiten) |
| Downloads in einer VM brechen ab | MTU 1500 statt 1450 im Netz | `GUEST_MTU` mit `onevnet show cc-net` prüfen, VM neu starten | [2.3](../iaas/networks/) |
| Ein Tunnel meldet «Address already in use» und «Could not request local forwarding» | Ein anderer Tunnel belegt den lokalen Port schon, etwa in einem anderen Tab | Den alten Tunnel in seinem Tab mit Ctrl+C schliessen oder einen freien lokalen Port nehmen, etwa `-L 9091:<CC_K3S_SERVER_IP>:30090` | [4.4](../platform/gitops/#zugriff-vom-client) |
| Der Browser des Clients erreicht einen Dienst über den Tunnel nicht, im Tab des Tunnels steht «connect failed» | Hinter `-L` stehen eine falsche Adresse oder ein falscher Port, oder der Dienst läuft noch nicht | Auf dem Front-end die Adresse mit `grep K3S /etc/cc-lab.env` prüfen und die Ports der Dienste mit `kubectl get svc -A`, etwa `30080` für Argo CD | [4.4](../platform/gitops/#zugriff-vom-client) |
| Ein Tunnel endet mit `exit` nicht, das Terminal hängt | Der Tunnel lief mit einer Shell. `ssh` wartet, bis der Browser seine offenen Verbindungen schliesst | Enter drücken und `~.` eingeben, das trennt `ssh` sofort. Öffne Tunnel mit `-N` ohne Shell, dann schliesst Ctrl+C sie | [4.4](../platform/gitops/#zugriff-vom-client) |
| Nach der Härtung ist Gitea vom Client aus nicht mehr erreichbar | Die Firewall lässt von aussen nur SSH und Port 2616 zu | so gewollt, Gitea über einen Tunnel vom Client erreichen | [6.1](../operations/security/) |
| Nach der Härtung keine Anmeldung mehr | Der Schlüssel des Clients fehlt auf dem Front-end oder passt nicht | An der Konsole des Front-ends anmelden, `/etc/ssh/sshd_config.d/10-cc-hardening.conf` entfernen, SSH mit `sudo systemctl reload ssh` neu laden, den Schlüssel mit `ssh-copy-id` eintragen und neu härten | [6.1](../operations/security/) |

## OpenTofu und k3s

| Symptom | Ursache | Was hilft | Kapitel |
|---|---|---|---|
| `tofu apply` scheitert, kein Knoten hat genug Speicher | VMs aus Teil 2 oder 3 laufen noch | `onehost list`, VMs beenden, Dienste mit `oneflow delete` löschen | [4.2](../platform/opentofu/) |
| `Inconsistent dependency lock file` | `tofu init` fehlt in dieser Kopie | `tofu init` im Ordner `tofu` | [4.2](../platform/opentofu/) |
| Der Provider meldet einen Fehler bei der Anmeldung | `OPENNEBULA_USERNAME` und `OPENNEBULA_PASSWORD` fehlen, etwa in einer neuen Shell | die beiden `export` aus 4.2 wiederholen | [4.2](../platform/opentofu/) |
| `tofu plan` zeigt nach einer Änderung am Startskript nur `update in-place` | Das Startskript beendet sich, wenn k3s schon installiert ist, eine laufende VM übernimmt die Änderung deshalb nicht | `tofu apply -replace` für die betroffenen VMs | [6.2](../operations/backup/) |
| Nodes werden nicht `Ready` | Das Startskript läuft noch oder ist gescheitert | Auf der VM `journalctl -u one-context` und `systemctl status k3s` oder `k3s-agent` lesen, etwa mit `ssh root@<CC_K3S_SERVER_IP>`, notfalls `tofu apply -replace` | [4.3](../platform/kubernetes/) |
| SSH oder kubectl verweigern nach einem Neubau | Alter Schlüssel in `known_hosts`, alte kubeconfig | `ssh-keygen -R <CC_K3S_SERVER_IP>` und `ssh-keygen -R <CC_K3S_AGENT_IP>`, kubeconfig mit `get-kubeconfig.sh` neu holen | [4.3](../platform/kubernetes/) |
| Ein Node ist `NotReady` | k3s läuft auf dieser VM nicht, oder die VM ist aus | `onevm list`, `ssh root@<CC_K3S_SERVER_IP> systemctl status k3s` oder `ssh root@<CC_K3S_AGENT_IP> systemctl status k3s-agent` | [4.3](../platform/kubernetes/) |
| Nach `tofu apply -replace` für den Agent bleibt `k3s-agent` `NotReady`, sein Log meldet «Node password rejected» | Der Server kennt für den Namen `k3s-agent` noch das Passwort der alten VM | `kubectl delete node k3s-agent`, danach tritt der neue Agent von selbst bei. Sein Log zeigt `ssh root@<CC_K3S_AGENT_IP> journalctl -u k3s-agent` | [4.2](../platform/opentofu/#ändern-ersetzen-und-neu-bauen), [4.3](../platform/kubernetes/) |
| Eine k3s-VM steht nach dem Start einer weiteren VM auf `poff` | Dem Knoten fehlte Speicher, der Kernel hat die VM beendet | `free -h` auf dem Knoten zeigt den Swap. Fehlt er, holst du dort mit `git -C ~/cc pull` den neuen Stand des Kursrepos und startest `sudo ~/cc/lab/prepare.sh` mit der Rolle des Knotens. Die weitere VM ausschalten und die k3s-VM mit `onevm resume` starten | [6.2](../operations/backup/#vms-in-opennebula) |
| Die Disk des Agents ist voll, `KubePersistentVolumeFillingUp` | Images, Modelle und Volumes füllen die 30 GB der VM | Nicht mehr gebrauchte Modelle löschen und ungenutzte Images mit `ssh root@<CC_K3S_AGENT_IP> k3s crictl rmi --prune` entfernen. Reicht das nicht, `disk_size` in `tofu/variables.tf` erhöhen und den Agent mit `tofu apply -replace` neu bauen | [5.5](../observability/advanced/#speicher-und-last) |

## GitOps

| Symptom | Ursache | Was hilft | Kapitel |
|---|---|---|---|
| Argo CD zeigt `authentication required` | Falsches Token oder ein Zeilenumbruch im Secret | Secret mit `bootstrap-argocd.sh` neu schreiben | [4.4](../platform/gitops/) |
| Applications bleiben `Unknown` | Der Platzhalter `FRONTEND` ist nicht ersetzt, oder Gitea läuft nicht | `grep -r FRONTEND ~/platform`, `systemctl status gitea` | [4.4](../platform/gitops/) |
| `git push` wird abgewiesen | Token oder `~/.git-credentials` falsch | Datei wie in 4.4 neu schreiben | [4.4](../platform/gitops/) |
| `git push` auf `main` scheitert mit «Not allowed to push to protected branch main» | Der Branch-Schutz aus Auftrag C von Kapitel 4.6 sperrt den direkten Push, auch für die Änderungen der Teile 5 und 6 | Die Änderung über einen Pull Request bringen, den das zweite Konto freigibt, oder die Ausnahme nutzen, die du in Auftrag C festgelegt hast | [4.6](../platform/advanced/#schutz-des-branches-auftrag-c) |
| Eine Application meldet einen Fehler beim Sync | Ein Commit enthält ein ungültiges Manifest | `kubectl -n argocd describe application <name>`, `git log`, den Commit mit `git revert --no-edit <commit>` zurücknehmen | [4.4](../platform/gitops/) |
| Pods hängen in `ImagePullBackOff` oder `ErrImagePull` | Falscher Image-Tag oder Image nicht erreichbar | `kubectl describe pod`, Tag in Git prüfen | [4.4](../platform/gitops/) |
| Eine Änderung von Hand verschwindet nach Sekunden | Self-Heal setzt den Stand aus Git zurück | so gewollt, die Änderung in Git machen | [4.4](../platform/gitops/) |
| Ein neuer Ordner unter `members` erscheint nicht | Push fehlt, oder das ApplicationSet hat noch nicht abgefragt | `git log origin/main`, eine Minute warten | [4.5](../platform/templates/) |
| Die ersten Anfragen eines neuen Pods scheitern mit `Connection refused` | Die NetworkPolicy kennt die Adresse des Pods noch nicht | einige Sekunden warten | [4.5](../platform/templates/) |
| Deployment synchron, aber keine Pods | Die Quota oder das Profil `restricted` weist sie ab | `kubectl -n <ns> get events`, Requests oder `securityContext` anpassen | [4.5](../platform/templates/), [6.1](../operations/security/) |

## Observability

| Symptom | Ursache | Was hilft | Kapitel |
|---|---|---|---|
| `monitoring` bleibt `OutOfSync` mit einer zu grossen Annotation | `ServerSideApply` fehlt in der Application | Application aus den Ergänzungen von Teil 5 übernehmen | [5.1](../observability/metrics/) |
| Grafana startet nicht, das Secret fehlt | `make-secrets.sh` lief nicht, oder nach einem Neubau fehlt der Schlüssel von Sealed Secrets | Skript ausführen oder Schlüssel einspielen, Pod neu starten | [5.1](../observability/metrics/), [6.2](../operations/backup/) |
| Ziele von OpenNebula sind `down` | Exporter nicht gestartet, oder Platzhalter für Adressen nicht ersetzt | `install-exporters.sh`, `grep -r _IP ~/platform/monitoring` | [5.1](../observability/metrics/) |
| Der OpenNebula-Exporter meldet 0 Hosts | Er läuft erst seit wenigen Sekunden | eine halbe Minute warten | [5.1](../observability/metrics/) |
| Der Webshop ist als Ziel `down` | Die NetworkPolicy lässt `monitoring` nicht zu | NetworkPolicy aus den Ergänzungen von Teil 5 übernehmen | [5.1](../observability/metrics/) |
| In Loki fehlen alle Logs | In den Werten von Alloy fehlt `NODE_NAME`. Ohne den Namen seines Nodes findet Alloy keinen Pod | Werte aus `monitoring/alloy.yaml` der Ergänzungen von Teil 5 übernehmen | [5.2](../observability/logs/#loki-und-alloy) |
| In Loki fehlen die Logs eines Nodes | Auf diesem Node läuft kein Pod von Alloy. Jeder liest nur die Pods seines eigenen Nodes | `kubectl -n monitoring get pods -o wide` zeigt die Pods von Alloy mit ihrem Node, `kubectl -n monitoring describe pod <pod>` den Grund | [5.2](../observability/logs/#loki-und-alloy) |
| Eine Abfrage wie `{namespace="velo"}` zeigt unter «Explore» Metriken statt Logs oder meldet einen «parse error» | Explore öffnet mit der Datenquelle Prometheus, LogQL versteht nur Loki | Oben links in «Explore» die Datenquelle Loki wählen | [5.2](../observability/logs/#logql) |
| Der Burn-Rate-Alert kommt nicht | Ohne Verkehr gibt es keine Fehler, etwa wenn der Pod `load` nach 1800 Sekunden fertig ist. Oder die neuen Pods mit `FAIL_PERCENT` laufen noch nicht, oder der Fehleranteil über eine Stunde liegt noch unter der Schwelle | `kubectl get pod load` zeigt die Last, `kubectl -n velo get pods` die neuen Pods. Warten, `FAIL_PERCENT` erhöhen oder `load` mit `kubectl delete pod load` löschen und neu starten | [5.3](../observability/slo/#einen-alert-auslösen) |
| Der HPA zeigt `<unknown>` | metrics-server braucht nach dem Start etwa eine Minute | warten | [5.4](../observability/autoscaling/) |
| Der HPA bleibt unter `maxReplicas`, Ereignis `exceeded quota` | Die Limits der Pods oder ihre Zahl passen nicht mehr in die Quota, beim Webshop zuerst `limits.cpu` | `kubectl -n <ns> describe resourcequota` zeigt, was voll ist. `maxReplicas` × Limit muss mit Reserve für den Rollout in die Quota passen, sonst Quota oder Limits anpassen | [5.4](../observability/autoscaling/#die-quota) |

## KI-Dienst und Triage

| Symptom | Ursache | Was hilft | Kapitel |
|---|---|---|---|
| Das Modell antwortet sehr langsam | Die VM sieht kein AVX2, `grep -c avx2 /proc/cpuinfo` gibt auf ihr 0 aus. In deinem `main.tf` fehlt der Block `cpumodel` mit `host-passthrough`, etwa in einer älteren Kopie | Den Block aus `~/cc/platform/repo/tofu/main.tf` übernehmen und die VM mit `tofu apply -replace` neu bauen | [5.5](../observability/advanced/#tokens-pro-sekunde) |
| Dein Triage-Dienst bekommt keine Alerts | Alertmanager hat keine Route zu deinem Empfänger, oder der Alert ist nicht `firing` | Oberfläche von Alertmanager auf Port 30093, Logs des Dienstes | [5.5](../observability/advanced/) |
| Der Alert eines neuen Mitglieds erreicht deinen Triage-Dienst nicht | Die Route in Alertmanager erfasst die Labels der neuen Regel nicht | Labels der Regel mit der Route vergleichen, etwa mit `amtool config routes test` | [6.5](../operations/advanced/) |

## Betrieb

| Symptom | Ursache | Was hilft | Kapitel |
|---|---|---|---|
| Ein Namespace hat das Profil `restricted` nicht | Ein Patch mit `op: add` auf `/metadata/labels` hat alle Labels ersetzt | Label als Merge-Patch setzen | [5.5](../observability/advanced/), [6.1](../operations/security/) |
| Ein SealedSecret meldet «not managed by SealedSecret» | Das Secret gab es schon, bevor der Controller kam | Annotation `sealedsecrets.bitnami.com/managed=true`, Controller neu starten | [6.1](../operations/security/) |
| Die Application `secrets` bleibt bei einem Fehler | Der Controller von Sealed Secrets läuft noch nicht | warten, die Application versucht es erneut | [6.1](../operations/security/) |
| `crontab: command not found` | Ubuntu 26.04 bringt kein cron mit | den Timer mit `install-backup-timer.sh` einrichten | [6.2](../operations/backup/) |
| Neue Snapshots kommen nicht auf dem Front-end an | Der Timer `cc-backup-k3s.timer` ist nicht aktiv | `systemctl list-timers`, Timer aktivieren | [6.2](../operations/backup/) |
| Nach dem Neubau des Clusters fehlen Metriken, Logs und das Audit-Log | Die Daten der Volumes lagen auf den Disks der alten VMs | so gewollt, vor dem Neubau Screenshots machen und das Audit-Log kopieren | [6.2](../operations/backup/) |
| Argo CD übernimmt nach einem Restore keine Commits | Die Controller arbeiten mit dem alten Stand | Controller in `argocd` und `monitoring` und den Controller von Sealed Secrets neu starten | [6.5](../operations/advanced/) |
| Der Knoten lagert aus, alle VMs werden langsam | Die VM eines Mitglieds ist zu gross für den freien Speicher | VM mit höchstens 1 GB | [6.4](../operations/cost/) |
