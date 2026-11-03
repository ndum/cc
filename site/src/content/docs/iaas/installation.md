---
title: Installation mit OneDeploy
description: Wie Ansible mit Inventar, Playbooks, Rollen und Handlern arbeitet, wie OneDeploy aufgebaut ist, was es auf Front-end und Knoten einrichtet und wie du einen abgebrochenen Lauf liest.
sidebar:
  order: 2
---

:::assignment
«Der Vorstand hat sich für OpenNebula entschieden», schreibt Simone Wyss. «Die Software ist frei, kommt aus Europa und läuft auf unseren drei Servern. Kannst du sie so installieren, dass wir das bei einem neuen Server jederzeit wiederholen können? Und schreib bitte auf, was danach wo läuft, damit wir es auch in einem Jahr noch wissen.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Erklären, wie Ansible mit Inventar, Playbooks, Tasks, Modulen, Rollen und Handlern arbeitet
- Ein eigenes kleines Playbook ausführen und an seiner Ausgabe Idempotenz erkennen
- Den Aufbau von OneDeploy beschreiben
- OpenNebula 7.4 mit einem Lauf von OneDeploy installieren
- Nennen, welche Dienste danach auf dem Front-end und auf den Knoten laufen und wie sie zusammenarbeiten
- Die Meldung eines abgebrochenen Laufs lesen und den Fehler beheben
:::

## Ansible

Eine Cloud mit drei Servern könntest du von Hand einrichten. Bei dreissig Servern oder bei einem Server, der nach einem Defekt neu aufgesetzt werden muss, wird das langsam und fehleranfällig. Werkzeuge für das **Konfigurationsmanagement** beschreiben deshalb den gewünschten Zustand der Server in Dateien und stellen ihn her. Ansible ist eines davon und das Werkzeug, mit dem das OpenNebula-Projekt seine Installationen automatisiert.

Ansible arbeitet ohne Agent. Auf den Zielrechnern braucht es nur SSH und Python. Ansible läuft auf einem Steuerrechner, im Lab auf dem Front-end. Von dort verbindet es sich mit den Zielrechnern, kopiert kleine Programme hinüber, führt sie aus und löscht sie wieder. Man nennt das ein **Push-Modell**, weil der Steuerrechner die Änderungen anstösst.

Ansible beschreibt Zielzustände. Ein Shell-Skript sagt «installiere Paket X», ein Task in Ansible sagt «Paket X ist installiert». Ist das schon so, tut Ansible nichts und meldet `ok`. Muss es etwas ändern, meldet es `changed`. Diese Eigenschaft heisst **Idempotenz**. Du kannst einen Lauf beliebig oft wiederholen, das Ergebnis bleibt dasselbe.

### Begriffe

| Begriff | Bedeutung | Beispiel aus dem Lab |
|---|---|---|
| Inventar | Liste der Zielrechner, in Gruppen, mit Variablen | `inventory.yml` mit den Gruppen `frontend` und `node` |
| Playbook | YAML-Datei mit einem oder mehreren Plays | `opennebula.deploy.main` |
| Play | ordnet einer Gruppe von Rechnern Rollen oder Tasks zu | «auf allen Knoten die Rolle `kvm`» |
| Task | ein einzelner Schritt mit einem Modul | «Paket `opennebula-node-kvm` ist installiert» |
| Modul | das Programm, das einen Task ausführt | `apt`, `copy`, `template`, `service`, `user` |
| Rolle | Bündel aus Tasks, Vorlagen, Standardwerten und Handlern für eine Aufgabe | `database`, `opennebula/server`, `gui`, `kvm` |
| Handler | Task, der nur läuft, wenn ein anderer Task etwas geändert hat | Dienst neu starten, nachdem seine Konfiguration geändert wurde |
| Variable | Wert, der Tasks und Vorlagen steuert | `one_version: "7.4"` |
| Facts | Angaben, die Ansible über einen Zielrechner sammelt | Version von Ubuntu, Anzahl CPUs, Netzwerkkarten |
| become | Wechsel zu einem anderen Benutzer, meist root mit sudo | `ansible_become: true` |
| Collection | verpacktes Bündel aus Rollen, Modulen und Playbooks | `opennebula.deploy` |

## OneDeploy

OneDeploy ist eine Ansible-Collection des OpenNebula-Projekts. Sie installiert eine Cloud aus einem Front-end und mehreren Knoten, auf Wunsch auch mit hoher Verfügbarkeit, Ceph als Speicher oder einem gerouteten Netz. Der Kurs ist mit der Version `release-1.4.1` getestet und nutzt davon nur den einfachsten Aufbau mit lokalem Speicher.

![OneDeploy richtet das Lab ein. Ansible auf dem Front-end liest das Inventar und die Playbooks von OneDeploy. Es richtet das Front-end lokal mit oned, Scheduler und FireEdge ein, die beiden Knoten über SSH mit KVM und libvirt.](../../../assets/figures/de/p2c2-deploy.svg)

Das Playbook `opennebula.deploy.main` besteht aus zwei Teilen. Der Teil `pre` bereitet alle Rechner vor. Er prüft Python und die Namen der Rechner, verteilt SSH-Schlüssel und richtet die Zeitsynchronisation und die Protokollierung ein. Danach installiert der Teil `site` OpenNebula. Er besteht aus Plays für die Gruppen des Inventars:

1. Alle Rechner mit der Rolle `common`, gemeinsame Pakete und die Paketquelle von OpenNebula
2. Das Front-end mit den Rollen `database`, `opennebula/server`, `gate`, `flow`, `form` sowie `gui`
3. Die Knoten mit den Rollen `kvm`, `datastore/node` sowie `network/node`
4. Das Front-end noch einmal mit `datastore/frontend` und `network/frontend`, die Datastores und Netze anlegen und die Knoten als Hosts eintragen

Rollen für Funktionen, die das Inventar nicht einschaltet, etwa Ceph, ein geroutetes Netz oder Prometheus, überspringt der Lauf. Sie erscheinen in der Ausgabe als `skipping`.

## OneDeploy einrichten

Das Skript `lab/one-deploy/install.sh` installiert Ansible aus den Paketen von Ubuntu, holt OneDeploy in der Kursversion nach `~/cc-lab/one-deploy` und installiert die Ansible-Collections, die OneDeploy braucht. Dieselben Schritte zeigt die [Anleitung zu den Playbooks](https://github.com/OpenNebula/one-deploy/wiki/sys_use) im Wiki von OneDeploy einzeln.

```bash
~/cc/lab/one-deploy/install.sh
```

::code{file="lab/one-deploy/install.sh" lines="16-23"}

Beim Installieren der Collections meldet Git, es sei im Zustand «detached HEAD». OneDeploy verlangt eine Collection in einer festen Version, Git holt dafür einen Tag statt eines Branches. Die Meldung ist deshalb kein Fehler. Das Skript ist erfolgreich, wenn es mit der Zeile `one-deploy release-1.4.1 is ready` endet.

## Das Inventar

Das Inventar beschreibt dein Lab für OneDeploy. Das Skript `make-inventory.sh` schreibt es aus deinen persönlichen Parametern und erzeugt beim ersten Aufruf ein zufälliges Passwort für den Benutzer `oneadmin`, den Administrator von OpenNebula. Das Passwort liegt danach in `~/cc-lab/oneadmin.pass`.

```bash
~/cc/lab/one-deploy/make-inventory.sh > ~/cc-lab/inventory.yml
chmod 600 ~/cc-lab/inventory.yml
```

::code{file="lab/one-deploy/make-inventory.sh" lines="18-42"}

Die Gruppe `frontend` enthält das Front-end, die Gruppe `node` die beiden Knoten. Weil Ansible auf dem Front-end läuft, verbindet es sich dort lokal statt über SSH. Diese Verbindungsart wählt `ansible_connection: local`. Unter `vars` stehen Werte, die für alle Rechner gelten. `one_version` legt die Version von OpenNebula fest, `ds` mit `mode: ssh` bedeutet, dass die Knoten Images über SSH erhalten und kein gemeinsamer Speicher nötig ist. Netze für die VMs deiner Mitglieder legst du in Kapitel 2.3 selbst an, das Inventar enthält deshalb noch keine. Wie Ansible Gruppen, Variablen und Verbindungsarten in einem Inventar liest, beschreibt die [Anleitung zum Inventar](https://docs.ansible.com/projects/ansible-core/2.20/inventory_guide/intro_inventory.html) von ansible-core 2.20.

Vor der Installation prüfst du, ob Ansible alle drei VMs erreicht.

```bash
cd ~/cc-lab/one-deploy
ansible -i ../inventory.yml all -m ping
```

Jede VM antwortet mit `SUCCESS` und `ping: pong`. Davor warnt Ansible für jede VM, dass es den Python-Interpreter selbst gesucht hat. Diese Warnung kannst du übergehen.

## Ein erstes Playbook

Das Beispiel des Kurses hinterlegt auf jedem Knoten einen Gruss mit dem Namen der Genossenschaft. Es installiert ein Paket, schreibt eine Datei mit Facts der Knoten und zeigt die Datei über einen Handler an.

::code{file="examples/ansible/motd.yml"}

Starte es zweimal. Im ersten Lauf melden beide Tasks `changed`, worauf der Handler läuft. Den Gruss selbst siehst du bei der nächsten Anmeldung an einem Knoten oder mit `cat /etc/motd`. Der zweite Lauf meldet überall `ok` und `changed=0`. Der Handler läuft diesmal nicht, weil sich nichts geändert hat. Die Zeile `gather_facts: true` ist nötig, weil OneDeploy in seiner Konfiguration das automatische Sammeln von Facts abschaltet. Aufbau, Ablauf und Idempotenz eines Playbooks erklärt die [Einführung in Playbooks](https://docs.ansible.com/projects/ansible-core/2.20/playbook_guide/playbooks_intro.html) von ansible-core 2.20.

```bash
cd ~/cc-lab/one-deploy
ansible-playbook -i ../inventory.yml ~/cc/examples/ansible/motd.yml
```

## OpenNebula installieren

Der Lauf von OneDeploy dauert einige Minuten, im Lab des Kurses zwischen eineinhalb und drei, bei einem langsamen Netz deutlich länger. Ansible zeigt dabei jede Rolle und jeden Task mit dem Ergebnis pro Rechner. Den Ablauf mit Steuerrechner, Inventar und Playbooks beschreibt auch die [Anleitung zu OneDeploy](https://docs.opennebula.io/7.4/getting_started/install_opennebula/one_deploy/one_deploy_overview/) von OpenNebula 7.4.

```bash
cd ~/cc-lab/one-deploy
ansible-playbook -i ../inventory.yml opennebula.deploy.main | tee ../deploy.log
```

Am Ende steht der Abschnitt `PLAY RECAP` mit einer Zeile pro VM. Bei einer erfolgreichen Installation zeigt jede Zeile `failed=0`. Die Zahl bei `ok` gibt an, wie viele Tasks schon stimmten. `changed` zählt die Tasks, die etwas geändert haben, `skipped` die Tasks, die dein Lab nicht brauchte.

## Die installierten Dienste

Nach dem Lauf ist OpenNebula vollständig installiert. Die folgenden Angaben stammen aus einem Lab des Kurses mit OpenNebula 7.4.1 auf Ubuntu 26.04.

### Auf dem Front-end

| Dienst | Paket | Port | Aufgabe |
|---|---|---|---|
| `oned` | `opennebula` | 2633 (XML-RPC), 2634 (gRPC) | der Kern von OpenNebula, verwaltet alle Objekte und bietet die API, über die CLI, Weboberfläche und OpenTofu arbeiten |
| Scheduler | `opennebula` | | ein Treiber von `oned`, der für jede neue VM einen passenden Knoten wählt |
| `onemonitord` | `opennebula` | 4124 | sammelt den Zustand der Knoten und VMs |
| MariaDB | `mariadb-server` | 3306, nur lokal | Datenbank von `oned` mit allen Benutzern, Hosts, Images, Netzen und VMs |
| FireEdge | `opennebula-fireedge` | 2616 | die Weboberfläche Sunstone |
| guacd | `opennebula-guacd` | 4822 | zeigt die Konsole einer VM im Browser |
| OneFlow | `opennebula-flow` | 2474 | Dienste aus mehreren VMs mit Regeln für die Elastizität, Thema von Kapitel 3.5 |
| OneGate | `opennebula-gate` | 5030, nur lokal | über OneGate melden VMs Werte an OpenNebula, OneFlow braucht das |
| OneForm | `opennebula-form` | 13013 | stellt neue Cluster bei Anbietern bereit, im Kurs nicht genutzt |
| Hook-Manager | `opennebula` | 2101 und 2102, nur lokal | führt Skripte aus, wenn sich ein Objekt ändert |
| SSH-Agent | `opennebula` | | hält den Schlüssel von `oneadmin` für die Verbindungen zu den Knoten |

Dazu kommen der Benutzer `oneadmin` mit einem SSH-Schlüsselpaar, die Zeitsynchronisation mit chrony und die Konfiguration unter `/etc/one/`, vor allem `oned.conf`. In OpenNebula selbst legt der Lauf drei Datastores an. Der Datastore `system` mit der Nummer 0 hält die Disks laufender VMs, `default` mit der Nummer 1 die Images und `files` mit der Nummer 2 Dateien wie Kernel oder Skripte für den Kontext. Alle drei verwenden den Transfertreiber `ssh`.

### Auf den Knoten

| Dienst | Paket | Aufgabe |
|---|---|---|
| KVM mit QEMU | `qemu-system-x86` | führt die VMs mit der Virtualisierung der CPU aus |
| libvirt | `libvirt-daemon-system` | verwaltet die VMs auf dem Knoten, dazu `virtlogd` für die Protokolle und `virtlockd` gegen doppelt geöffnete Disks |
| Knotenpaket | `opennebula-node-kvm` | richtet den Benutzer `oneadmin` mit den Gruppen `kvm` und `libvirt` ein und konfiguriert libvirt für OpenNebula |

Auf den Knoten läuft kein eigener Dienst von OpenNebula. Der Schlüssel von `oneadmin` aus dem Front-end steht dort in `authorized_keys`.

### Zusammenspiel von Front-end und Knoten

Startest du eine VM, legt `oned` sie in der Datenbank an und der Scheduler wählt einen Knoten mit genug freier CPU und genug Speicher. Das Front-end verbindet sich als `oneadmin` per SSH mit diesem Knoten. Der Transfertreiber `ssh` kopiert das Image der VM in den Datastore `system` des Knotens unter `/var/lib/one/datastores/0/`. Dann startet ein Treiber auf dem Knoten die VM über libvirt mit KVM. Die Treiber sind kleine Programme in Ruby und Shell, die das Front-end nach `/var/tmp/one/` auf jeden Knoten kopiert. Das erledigt der Handler «Sync Remotes» am Ende eines Laufs. Von da an fragt `onemonitord` regelmässig den Zustand von Knoten und VMs ab, den `oned` in `onehost list` und in der Weboberfläche zeigt.

## Einen abgebrochenen Lauf lesen

Bricht ein Lauf ab, steht weiter oben eine Zeile mit `fatal:` und dem Namen der VM, darunter die Meldung. Davor nennt Ansible den gescheiterten Task und die Datei, in der dieser Task steht. Lies zuerst die Meldung, dann den Task. Meist erklärt die Meldung den Fehler schon.

Bei der Entwicklung dieses Kurses brach der Lauf viermal ab. Das Vorbereitungsskript aus [Kapitel 0.4](../../start/prepare/) beugt heute jedem dieser Abbrüche vor:

| Meldung | Ursache | Lösung im Kurs |
|---|---|---|
| `Please make sure each cluster member can resolve all Front-end hostnames` | Die VMs kannten die Namen der anderen nicht. | `prepare.sh` schreibt alle Namen in `/etc/hosts`, das Inventar setzt `ensure_hosts`. |
| `Could not find the requested service rsyslog.service` | Das minimale Ubuntu 26.04 enthält rsyslog nicht. | `prepare.sh` installiert rsyslog auf allen VMs. |
| `opennebula-fireedge ... Depends nodejs (<= 21)` | Ubuntu bietet ein neueres Node.js an, als die Weboberfläche verträgt. | `prepare.sh` legt fest, dass Node.js aus dem Repo von OpenNebula kommt. |
| `Failed to set permissions on the temporary files Ansible needs to create when becoming an unprivileged user` | Ansible wechselt auf dem Front-end zum Benutzer `oneadmin` und braucht dafür das Paket acl. | `prepare.sh` installiert acl auf dem Front-end. |

Nach einer Korrektur startest du den Lauf noch einmal. Weil Ansible den Zielzustand beschreibt, ändert es nur, was noch nicht stimmt.

## Die CLI als dein Benutzer

Die Befehle von OpenNebula wie `onehost` oder `onevm` melden sich mit dem Benutzer und Passwort aus der Datei `~/.one/one_auth` an der API an. Damit du nicht jedes Mal zu `oneadmin` wechseln musst, legst du diese Datei mit dem Passwort aus dem Inventar für deinen eigenen Benutzer an. Nur du darfst sie lesen. Welche Variablen und Dateien die CLI sonst noch liest, steht in der [Konfiguration der CLI](https://docs.opennebula.io/7.4/product/operation_references/command_line_interface/cli_configuration/) von OpenNebula 7.4.

```bash
mkdir -p ~/.one
(umask 077; echo "oneadmin:$(cat ~/cc-lab/oneadmin.pass)" > ~/.one/one_auth)
```

Für ein Lab ist das bequem. In einer echten Cloud arbeitet das Plattform-Team mit eigenen Benutzern statt mit `oneadmin`. Wie Benutzer und Gruppen in OpenNebula funktionieren, zeigt Kapitel 3.1.

:::caution[Kein Passwort in Git]
Das Passwort von `oneadmin` steht im Klartext in `~/cc-lab/oneadmin.pass`, im Inventar und in `~/.one/one_auth`. Diese Dateien bleiben auf dem Front-end. Kopiere sie nie in dein Abgabe-Repo, auch nicht als Beleg.
:::

## Prüfen

Ob OpenNebula läuft und beide Knoten bereit sind, zeigt `onehost list`. In der Spalte `STAT` muss bei beiden Knoten `on` stehen. OneDeploy trägt die Knoten mit ihren IP-Adressen als Namen ein.

```bash
onehost list
```

Welche Dienste auf dem Front-end laufen und auf welchen Ports sie warten, zeigen `systemctl` und `ss`.

```bash
systemctl list-units 'opennebula*' mariadb.service
sudo ss -ltnp
```

Die Weboberfläche öffnest du im Browser des Clients, auf smartlearn die Kali-VM, mit eigenem Hypervisor dein PC. Sie ist auf Port 2616 des Front-ends erreichbar, zum Beispiel unter `http://192.168.210.137:2616/`. Du meldest dich als `oneadmin` mit dem Passwort aus `~/cc-lab/oneadmin.pass` an.

Nach der Anmeldung zeigt Sunstone das Dashboard.

![Das Dashboard von Sunstone nach der Anmeldung als oneadmin. Vier Kacheln zählen VMs, Hosts, virtuelle Netze und Images. Die Karte Hosts darunter zeigt, wie viel CPU und Arbeitsspeicher der Cluster schon an VMs vergeben hat. Das Bild stammt aus Teil 3, deshalb laufen hier schon neun VMs.](../../../assets/screenshots/sunstone-dashboard.png)

Der Check dieses Kapitels prüft den Dienst, die Version, beide Hosts und die Weboberfläche.

```bash
python3 ~/cc/checks/check.py install
```

::::exercise[Einstieg]
Richte OneDeploy ein, erzeuge das Inventar und starte das Playbook `motd.yml` zweimal. Vergleiche die beiden `PLAY RECAP` und erkläre, warum der Handler beim zweiten Lauf nicht läuft.

:::solution
Der erste Lauf meldet bei beiden Knoten `changed=2`, weil htop neu installiert und `/etc/motd` neu geschrieben wurde. Der zweite Lauf meldet `changed=0`. Weil der Task «Write the greeting» nichts geändert hat, benachrichtigt er den Handler nicht, der deshalb auch nicht läuft.
:::
::::

::::exercise[Lab]
Installiere OpenNebula 7.4 mit OneDeploy, richte die CLI für deinen Benutzer ein, prüfe die Hosts mit `onehost list`, melde dich an der Weboberfläche an und lade den Bericht des Checks `install` in dein Abgabe-Repo.

:::solution
Der Check endet mit «8 von 8 Prüfungen der Basis erfüllt». `onehost list` zeigt beide Knoten mit `on` in der Spalte `STAT`. Steht dort `err`, nennt `onehost show` mit dem Namen des Hosts den Grund im Abschnitt `MONITORING INFORMATION`, oft eine fehlende SSH-Verbindung vom Front-end zum Knoten.
:::
::::

::::exercise[Vertiefung]
Ordne jeden Port, den `sudo ss -ltnp` auf deinem Front-end zeigt, einem Dienst aus der Tabelle zu. Welche Ports sind nur lokal erreichbar und warum ist das bei der Datenbank sinnvoll?

:::solution
Nur lokal, also auf `127.0.0.1`, warten MariaDB auf 3306, OneGate auf 5030 und der Hook-Manager auf 2101 und 2102. Die Datenbank braucht nur `oned` auf demselben Rechner. Wäre sie im Netz erreichbar, könnte jemand mit ihrem Passwort alle Daten der Cloud lesen oder ändern, an der API von OpenNebula vorbei. SSH auf Port 22 und der lokale DNS-Cache `systemd-resolved` auf Port 53 der Adressen `127.0.0.53` und `127.0.0.54` gehören zu Ubuntu und fehlen deshalb in der Tabelle.
:::
::::
