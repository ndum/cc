---
title: VMs vorbereiten
description: SSH mit Schlüssel und Konfiguration auf dem Client, sudo ohne Passwort, das Kursrepo und das Vorbereitungsskript auf jedem Server, der Schlüssel vom Front-end zu den Knoten und der Check start.
sidebar:
  order: 4
---

:::assignment
«Die Server haben jetzt ihre Adressen», schreibt Simone Wyss. «Was fehlt noch, bevor die Cloud darauf kommt? Und bitte nicht jedes Mal ein Passwort eintippen, das hält niemand lange durch.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Mit einem SSH-Schlüssel und einer SSH-Konfiguration vom Client aus ohne Passwort auf die Server zugreifen
- Jeden Server mit dem Vorbereitungsskript für seine Rolle vorbereiten
- Erklären, was das Skript auf Front-end und Knoten einrichtet
- Vom Front-end ohne Passwort auf die Knoten zugreifen
- Den Check `start` ausführen und seinen Bericht lesen
:::

## SSH vom Client

Ein SSH-Schlüssel besteht aus zwei Dateien. Den privaten Schlüssel behältst du auf dem Client, den öffentlichen legst du auf jeden Server. Beim Anmelden beweist der Client mit dem privaten Schlüssel, dass er zum öffentlichen passt. Ein Passwort geht dabei nicht über das Netz.

Erzeuge den Schlüssel im Terminal des Clients. Den Speicherort bestätigst du mit Enter. Die Passphrase darfst du im Lab leer lassen, sonst fragt SSH bei jeder Anmeldung danach.

```bash
ssh-keygen -t ed25519 -C "cc-lab"
```

Der folgende Block trägt deine drei Server mit Hostname, neuer Adresse und dem Benutzer `vmadmin` in die Datei `~/.ssh/config` ein. Danach kopiert er deinen öffentlichen Schlüssel mit `ssh-copy-id` auf jeden Server. Den Code kennt der Generator noch aus Kapitel 0.3. Füge den Block im Terminal des Clients ein. `ssh-copy-id` fragt für jeden Server nach dem Passwort von `vmadmin`. Kennt der Client die neue Adresse eines Servers noch nicht, fragt es vorher, ob du seinem Schlüssel vertraust. Bricht es bei einem Server ab, startest du nur für diesen `ssh-copy-id` noch einmal, etwa `ssh-copy-id mmuster-fe`.

<cc-params part="ssh"></cc-params>

Danach genügt `ssh` mit dem Namen des Servers, etwa `ssh mmuster-fe`, ohne Adresse und ohne Passwort. Alle Einträge der Datei beschreibt die [Handbuchseite zu ssh_config](https://manpages.ubuntu.com/manpages/resolute/man5/ssh_config.5.html), Schlüssel und `ssh-copy-id` zeigt die [Anleitung zu OpenSSH](https://ubuntu.com/server/docs/how-to/security/openssh-server/) in der Dokumentation von Ubuntu Server.

:::selfhost
Ohne Client arbeitest du auf deinem PC. Windows 11, macOS und Linux bringen OpenSSH mit, unter Windows erzeugst du den Schlüssel in der PowerShell mit demselben Befehl. Wie OpenSSH unter Windows mit Schlüsseln arbeitet, beschreibt die [Anleitung von Microsoft](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement). Der Block des Generators läuft in der Shell von Linux und macOS. Unter Windows trägst du die drei Hosts mit einem Editor in `%USERPROFILE%\.ssh\config` ein. Windows kennt kein `ssh-copy-id`, dort hängst du den öffentlichen Schlüssel mit diesem Befehl in der PowerShell an `~/.ssh/authorized_keys` jedes Servers an.

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh vmadmin@<adresse> "umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys"
```
:::

## Jeden Server vorbereiten

Nimm dir die Server der Reihe nach vor, zuerst die beiden Knoten und zuletzt das Front-end, auf dem es danach weitergeht. Melde dich an, etwa mit `ssh mmuster-node1`. Füge danach diesen Block ein. Er ist auf allen drei Servern gleich. Falls `sudo` dabei nach dem Passwort fragt, ist es das letzte Mal.

```bash
echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$USER
sudo apt update && sudo apt install -y git
git clone https://github.com/ndum/cc.git
```

Die erste Zeile erlaubt deinem Benutzer sudo ohne Passwort, denn Ansible führt in Kapitel 2.2 Befehle als Administrator aus, ohne nach einem Passwort zu fragen. Auf smartlearn darf `vmadmin` das schon. Mit der Zeile gilt es unabhängig von der Vorlage, auch auf einem eigenen Hypervisor. Was eine solche Zeile erlaubt, beschreibt die [Handbuchseite zu sudoers](https://manpages.ubuntu.com/manpages/resolute/man5/sudoers-rs.5.html) von Ubuntu 26.04. Die minimale Installation von Ubuntu enthält kein Git, die zweite Zeile installiert es. `git clone` legt das Kursrepo im neuen Ordner `cc` in deinem Home-Verzeichnis ab, wie die [Dokumentation von Git](https://git-scm.com/docs/git-clone) beschreibt.

Einen neueren Stand des Kursrepos kündigt dir deine Dozentin oder dein Dozent an. Du holst ihn dann auf jedem Server mit `git -C ~/cc pull`, die Option `-C` lässt Git im Ordner `~/cc` arbeiten. Den Block oben startest du dafür nicht noch einmal, denn `git clone` bricht ab, wenn der Ordner `cc` schon besteht.

Nach dem Block startest du das Vorbereitungsskript mit der Rolle des Servers, `node1`, `node2` oder `fe`. Melde dich anschliessend ab und wieder an, erst dann zeigt die Eingabeaufforderung den neuen Hostnamen.

```bash
sudo ~/cc/lab/prepare.sh node1
```

## Das Vorbereitungsskript

Das Skript `lab/prepare.sh` liest deine Parameter aus `/etc/cc-lab.env`. Auf jedem Server setzt es den Hostnamen, trägt die Namen aller drei Server in `/etc/hosts` ein und installiert rsyslog.

::code{file="lab/prepare.sh" lines="47-59"}

Auf den Knoten prüft es, ob die CPU-Virtualisierung ankommt. Es nennt dort auch die Netzwerkschnittstelle, die OpenNebula später braucht. Hat ein Knoten noch keinen Swap, legt das Skript die Datei `/swapfile` mit 2 GB an und trägt sie in `/etc/fstab` ein. OpenNebula vergibt den ganzen Arbeitsspeicher eines Knotens an VMs, obwohl der Knoten selbst einen Teil davon braucht. Reicht der Speicher nicht mehr, beendet der Kernel ohne Swap die grösste VM, wie [Kapitel 6.2](../../operations/backup/#vms-in-opennebula) zeigt. Auf dem Front-end installiert es acl und nftables und legt fest, dass Node.js später aus der Paketquelle von OpenNebula kommt. Ausserdem richtet es das Gateway für das interne Netz als Dienst `cc-gateway` ein, der bei jedem Start läuft.

Das Skript darf mehrmals laufen, es ändert nur, was noch nicht stimmt. Bricht es mit einer Fehlermeldung ab, nennt die Meldung, was fehlt, etwa eine falsche Adresse in `/etc/cc-lab.env` oder einen Knoten ohne verschachtelte Virtualisierung.

## Das Gateway

Der Dienst `cc-gateway` verbindet das Front-end mit dem internen Netz deiner Cloud. Er legt das VXLAN mit deiner Kennung an und gibt dem Front-end darin die Adresse des Gateways. Den Verkehr der Cloud leitet er mit NAT ins Internet. Seinen Zustand zeigt das Skript auf dem Front-end am Ende, später zeigt ihn dieser Befehl.

```bash
sudo cc-gateway status
```

Für den Code `mmuster` auf smartlearn gibt er diese vier Zeilen aus. Hinter der Adresse des Gateways kann noch eine IPv6-Adresse stehen, die mit `fe80::` beginnt.

```text
cc-br            UP             172.31.160.1/24
vxlan id 5862 group 239.0.22.230
ip_forward=1
		ip saddr 172.31.160.0/24 oifname "eth0" masquerade
```

Die erste Zeile zeigt die Brücke `cc-br` mit dem Zustand `UP` und der Adresse des Gateways im internen Netz. Die zweite nennt das VXLAN mit deiner Kennung und deiner Multicast-Gruppe. `ip_forward=1` heisst, dass das Front-end Pakete zwischen seinen Netzen weiterleitet. Die letzte Zeile ist die NAT-Regel. Bei jedem Paket aus deinem internen Netz, das über `eth0` ins Labnetz geht, ersetzt sie die Absenderadresse durch die Adresse des Front-ends. Diese Regel steht in der Tabelle `cc_gateway` von nftables. Regeln dieser Art erklärt die [Anleitung zu NAT](https://wiki.nftables.org/wiki-nftables/index.php/Performing_Network_Address_Translation_%28NAT%29) im Wiki von nftables.

Steht statt einer Zeile eine Meldung wie `cc-br is missing` oder `NAT rule is missing` oder zeigt die dritte Zeile `ip_forward=0`, startest du den Dienst mit `sudo systemctl restart cc-gateway` neu und prüfst noch einmal.

## SSH vom Front-end auf die Knoten

Ab Teil 2 arbeitest du vor allem auf dem Front-end. Von dort aus richtet Ansible die Knoten ein und die Check-Skripte prüfen sie. Dafür braucht das Front-end einen eigenen Schlüssel, der auf den Knoten eingetragen ist. Das Front-end selbst richtet Ansible lokal ein, ohne SSH.

Melde dich mit `ssh mmuster-fe` auf dem Front-end an und füge diesen Block ein. Er erzeugt dort einen Schlüssel ohne Passphrase und kopiert ihn auf beide Knoten, deren Namen er aus `/etc/cc-lab.env` liest. `ssh-copy-id` fragt für jeden Knoten, ob du ihm vertraust. Danach will es das Passwort von `vmadmin`.

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
source /etc/cc-lab.env
ssh-copy-id $CC_NODE1_HOST
ssh-copy-id $CC_NODE2_HOST
```

Danach gibt `ssh $CC_NODE1_HOST hostname` den Namen des Knotens aus, ohne nach einem Passwort zu fragen.

## Der Check `start`

Das Check-Skript prüft auf dem Front-end, ob dein Lab bereit ist. Es kontrolliert die Namen und Adressen, sudo ohne Passwort, das Gateway und die SSH-Verbindung zu den Knoten. Auf jedem Knoten prüft es Ubuntu, die CPU-Virtualisierung, rsyslog, sudo und den Swap.

```bash
python3 ~/cc/checks/check.py start
```

Jede Zeile des Berichts beginnt mit `[ok]` oder `[!!]`. Unter einer Zeile mit `[!!]` steht ein Hinweis, wo du suchen kannst. Das Skript speichert den Bericht in `~/cc-reports/`. Am Ende steht ein Hash über den ganzen Bericht. Wer den Bericht nachträglich von Hand ändert, macht diesen Hash ungültig. Weil das Skript öffentlich ist, beweist der Hash aber nicht, dass der Check wirklich gelaufen ist. Dafür braucht es deine Screenshots und die Vorführung der Zusatzaufträge.

::code{file="checks/check.py" lines="803-808"}

Der Check `start` ist Anforderung 1 von Meilenstein 1. Mach deshalb gleich nach dem Lauf einen Screenshot mit dem Screenshot-Werkzeug von Kali, denn jeder neue Lauf schreibt einen neuen Bericht mit einem anderen Hash. Auf dem Bild sind die Zeile mit dem Ergebnis, der Hash und die Eingabeaufforderung mit dem Namen des Front-ends zu sehen. Speichere es in deinem Home-Ordner auf dem Client als `1-start.png`. In Kapitel 0.5 kommt es zusammen mit dem Bericht in dein Abgabe-Repo.

Snapshots der drei Server legst du in der Weboberfläche von smartlearn an. Ein Snapshot nach dem grünen Check bringt dich zum vorbereiteten Lab zurück, falls später etwas schiefgeht.

::::exercise[Lab]
Richte SSH auf dem Client ein und bereite die drei Server vor, zuerst die Knoten und dann das Front-end. Verbinde danach das Front-end mit den Knoten, starte den Check `start` und mach den Screenshot `1-start.png`.

:::solution
Auf jedem Server endet das Skript mit dem Abschnitt «Done», auf dem Front-end zeigt es davor das Gateway mit VXLAN-Kennung und NAT-Regel. Der Check endet mit einer Zeile wie «27 von 27 Prüfungen der Basis erfüllt» und einem Hash. Eine fehlende SSH-Verbindung zeigt der Bericht mit `[!!] SSH ohne Passwort auf` und dem Namen des Knotens. Dann fehlt der Schlüssel des Front-ends auf diesem Knoten.
:::
::::
