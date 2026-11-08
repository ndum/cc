---
title: Sicherheit
description: Schutzbedarf der Mitglieder, ein gehärtetes Front-end mit SSH-Schlüsseln, Firewall und Updates, TLS und SSH-Tunnel, RBAC in Kubernetes, das Profil restricted für Pods, verschlüsselte Secrets in Git und wer auf der Plattform was darf.
sidebar:
  order: 1
---

:::assignment
«Eine fünfte Organisation will Mitglied werden», schreibt Beat Kläy, Präsident des Vorstands. «Bevor wir zusagen, will ich wissen, wie gut wir geschützt sind. Wer kommt an die Server und wo liegen die Passwörter? Was passiert, wenn ein Mitglied eine unsichere Anwendung mitbringt?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Den Schutzbedarf eines Mitglieds nach Vertraulichkeit, Integrität und Verfügbarkeit einschätzen
- Das Front-end mit SSH-Schlüsseln, einer Firewall und automatischen Updates härten
- Erklären, wie TLS eine Verbindung schützt und wo du im Lab stattdessen SSH-Tunnel nutzt
- Rollen und Bindings in Kubernetes erklären und die Rechte eines ServiceAccounts prüfen
- Pods der Mitglieder mit Pod Security Admission auf das Profil restricted verpflichten
- Secrets verschlüsselt in Git ablegen
- Zeigen, wer auf deiner Plattform was darf
:::

Die Kapitel von Teil 6 bauen auf deinem Lab nach Teil 5 auf.

## Schutzbedarf

Sicherheit kostet Zeit und Bequemlichkeit. Bevor du Massnahmen planst, klärst du darum, was zu schützen ist. Den Schutzbedarf von Daten und Diensten schätzt man nach drei Zielen ein.

| Ziel | Frage | Beispiel bei Wolkenwerk |
|---|---|---|
| Vertraulichkeit | Wer darf die Daten sehen? | Patientendaten der Praxis Rosenweg |
| Integrität | Bleiben die Daten richtig und vollständig? | Buchhaltung der Treuhand Aaregg |
| Verfügbarkeit | Ist der Dienst da, wenn man ihn braucht? | Schalterdienste der Gemeinde Hinterbüel |

Üblich sind die Stufen normal, hoch und sehr hoch. Massgebend ist der Schaden, den ein Verlust für Menschen, für das Mitglied und für Wolkenwerk anrichten würde. Gesundheitsdaten sind nach Art. 5 des Datenschutzgesetzes besonders schützenswert. Ärztinnen und Ärzte stehen zudem unter dem Berufsgeheimnis von Art. 321 StGB. Kapitel 1.4 hat beides eingeführt. Für die Praxis ist die Vertraulichkeit darum sehr hoch. Beim Webshop des Veloateliers zählt vor allem die Verfügbarkeit am Samstag.

Aus dem Schutzbedarf folgen die Massnahmen. Die Plattform braucht eine Grundsicherung für alle. Mitglieder mit hohem Bedarf bekommen mehr, etwa eine eigene VM statt eines Namespaces oder häufigere Backups.

## Die Angriffsfläche des Labs

Zur **Angriffsfläche** gehört alles, was ein Angreifer über das Netz erreicht. Nach Teil 5 nimmt dein Front-end Verbindungen auf mehreren Ports an.

| Port | Dienst | Wer braucht ihn |
|---|---|---|
| 22 | SSH | du |
| 2616 | Weboberfläche von OpenNebula | du und die Mitglieder |
| 2633 | API von OpenNebula | OpenTofu auf dem Front-end selbst |
| 3000 | Gitea | Argo CD im Cluster, du über einen Tunnel |
| 9100, 9925 | Exporter für Prometheus | Prometheus im Cluster |

Die Knoten und die VMs in cc-net sprechen mit dem Front-end über weitere Ports, etwa für das Monitoring von OpenNebula und für VXLAN. Von allen anderen Rechnern aus braucht es nur SSH und die Weboberfläche. Zu diesen Rechnern gehört auch der Client, von dem aus du arbeitest, auf smartlearn die Kali-VM, mit eigenem Hypervisor dein PC. Alles andere darf eine Firewall abweisen.

## Das Front-end härten

**Härten** heisst, alles abzuschalten oder abzuschotten, was nicht gebraucht wird. Das Skript des Kurses macht drei Dinge.

::code{file="platform/operations/harden-frontend.sh"}

Danach nimmt SSH nur noch Schlüssel an. Direkt als `root` kann sich niemand mehr anmelden. Die Optionen dazu beschreibt die [Handbuchseite von sshd_config](https://manpages.ubuntu.com/manpages/resolute/man5/sshd_config.5.html). Ein Passwort lässt sich erraten oder abfangen, ein privater Schlüssel verlässt den Client nie. Die Firewall ist eine eigene Tabelle von nftables. Sie lässt die Knoten und cc-net alles erreichen, alle anderen Rechner nur SSH und die Weboberfläche. Wie eine solche Tabelle aufgebaut ist, zeigt der [einfache Regelsatz für einen Server](https://wiki.nftables.org/wiki-nftables/index.php/Simple_ruleset_for_a_server) im Wiki von nftables. Die Tabelle `cc_gateway` mit der NAT für cc-net aus Kapitel 0.4 bleibt unberührt. Sicherheitsupdates installiert Ubuntu jeden Tag selbst mit dem Paket `unattended-upgrades`. Das Skript schaltet das mit der Datei `/etc/apt/apt.conf.d/20auto-upgrades` ein. Gemäss dieser Datei holt `apt-daily.timer` die Paketlisten und `apt-daily-upgrade.timer` installiert die Updates. Der Dienst `unattended-upgrades`, den das Skript ebenfalls einschaltet, installiert selbst nichts. Er sorgt nur dafür, dass ein laufendes Update beim Herunterfahren sauber endet. Die Einstellungen erklärt die [Anleitung zu automatischen Updates](https://ubuntu.com/server/docs/how-to/software/automatic-updates/) von Ubuntu Server.

![Die Schutzschichten von Front-end und Cluster. In der Mitte das Front-end. Seine Firewall, die Tabelle cc_firewall von nftables, weist alles ab, was sie nicht ausdrücklich erlaubt. Der Client und andere Rechner erreichen nur SSH auf Port 22 und die Weboberfläche auf Port 2616. SSH nimmt nur Schlüssel an und lässt root nicht direkt herein. Die Knoten und cc-net erreichen alles, auch Gitea auf Port 3000, die API auf Port 2633 und die Exporter auf den Ports 9100 und 9925. Jeden Tag installiert unattended-upgrades die Sicherheitsupdates. Rechts der Cluster. Pod Security Admission verlangt in den Namespaces der Mitglieder das Profil restricted. NetworkPolicies trennen die Mitglieder, Prometheus darf in allen Namespaces nur lesen. Ein SealedSecret kommt verschlüsselt aus Gitea, nur der Controller von Sealed Secrets in kube-system kann es mit seinem Schlüssel entschlüsseln.](../../../assets/figures/de/p6c1-security.svg)

:::caution[Anmeldung mit Schlüssel prüfen]
Nach der Härtung nimmt SSH kein Passwort mehr an und vom Client aus erreichst du nur noch SSH und Sunstone. Prüfe deshalb vorher, dass du dich vom Client aus mit deinem Schlüssel anmelden kannst. Lass die bestehende Verbindung offen, bis eine neue Anmeldung mit dem Schlüssel klappt. Sonst erreichst du das Front-end nur noch über seine Konsole.
:::

Prüfe zuerst im Terminal des Clients, ob die Anmeldung mit dem Schlüssel klappt. Der Befehl gibt den Hostnamen des Front-ends aus, ohne nach einem Passwort zu fragen.

```bash
ssh mmuster-fe hostname
```

Fragt SSH nach dem Passwort von `vmadmin`, liegt dein Schlüssel noch nicht auf dem Front-end. Kopiere ihn dann zuerst wie in [Kapitel 0.4](../../start/prepare/#ssh-vom-client) mit `ssh-copy-id mmuster-fe` hinüber. Starte danach das Skript auf dem Front-end. Am Ende zeigt es `permitrootlogin no`, `passwordauthentication no` und die Regeln der Tabelle `cc_firewall`.

```bash
sudo ~/cc/platform/operations/harden-frontend.sh
```

Lass diese Verbindung zum Front-end offen. Öffne im Terminal des Clients einen zweiten Tab und prüfe dort die Anmeldung ohne und mit Schlüssel sowie die Firewall.

```bash
ssh -o PubkeyAuthentication=no mmuster-fe
ssh mmuster-fe hostname
ssh mmuster-fe systemctl is-active cc-firewall
```

Der Versuch ohne Schlüssel scheitert mit `Permission denied (publickey)`. Mit dem Schlüssel gibt SSH wieder `mmuster-fe` aus, die Firewall meldet `active`. Im Lab antwortete die Weboberfläche danach wie vorher und alle Ziele in Prometheus blieben `up`. Gitea war vom Client aus nicht mehr erreichbar.

Diese drei Ausgaben belegen Anforderung 1 von Meilenstein 4. Mach davon einen Screenshot mit dem Screenshot-Werkzeug von Kali. Speichere ihn in deinem Home-Ordner unter einem Namen, der mit der Nummer der Anforderung beginnt, etwa `1-haertung.png`. Im zweiten Tab legst du auf dem Front-end den Ordner `m4` in deinem Abgabe-Repo an und kopierst den Screenshot hinein. Die Screenshots der übrigen Anforderungen entstehen in diesem Kapitel und in Kapitel 6.2. Hochladen kannst du alle am Ende von Kapitel 6.2 zusammen mit dem Bericht des Checks `m4`.

```bash
ssh mmuster-fe mkdir -p cc-mmuster/m4
scp ~/1-haertung.png mmuster-fe:cc-mmuster/m4/
```

Gitea öffnest du von nun an über einen Tunnel. Den lokalen Port 3000 belegt auf dem Client schon der Tunnel zu Grafana aus Kapitel 5.1, nimm darum einen anderen. Den Tunnel startest du in einem weiteren Tab des Terminals auf dem Client.

```bash
ssh -N -L 3001:localhost:3000 mmuster-fe
```

`-N` öffnet nur den Tunnel und keine Shell. `localhost:3000` meint dabei das Front-end selbst, auf dem Gitea läuft. Solange der Tunnel offen ist, zeigt der Browser des Clients Gitea unter `http://localhost:3001/`. Du meldest dich wie in Kapitel 4.4 als `platform` an, das Passwort zeigt `cat ~/cc-lab/gitea/platform.pass` auf dem Front-end. Manche Links bildet Gitea mit der Adresse aus seiner Konfiguration, also mit Port 3000 des Front-ends. Ein solcher Link, etwa die Adresse zum Klonen, führt vom Client aus ins Leere. Bleib im Browser darum bei `localhost:3001`. Ctrl+C im Tab des Tunnels schliesst ihn wieder.

Die Knoten härtet der Kurs nicht. Auf ihnen nimmt SSH weiterhin Passwörter an, node_exporter auf Port 9100 und der Libvirt-Exporter auf Port 9926 antworten jedem. Zudem bietet jeder Knoten die Konsolen seiner VMs über VNC an allen Adressen und ohne Passwort an, ab Port 5900. Sunstone holt sie über das Front-end von dort ab. Wer die Knoten erreicht, kann also die Messwerte lesen und die Konsolen der VMs bedienen. Das sind dein Client, deine drei Server und über die NAT des Front-ends auch die VMs in cc-net, darunter die VMs der Mitglieder. Für ein Lab mit Testdaten ist das vertretbar. Ein produktiver Betrieb härtet die Knoten wie das Front-end und schützt die Konsolen mit einem Passwort, das OpenNebula mit `RANDOM_PASSWD` in der Vorlage für jede VM erzeugt ([Referenz der Vorlagen](https://docs.opennebula.io/7.4/product/operation_references/configuration_references/template/)).

Die Passwörter und Tokens des Labs liegen in deinem Home-Verzeichnis auf dem Front-end und nur du darfst sie lesen. Die [Lab-Referenz](../../lab-reference/#zugangsdateien) zählt sie unter «Zugangsdateien» auf.

## Die Ergänzungen von Teil 6

Die Ergänzungen für Teil 6 liegen im Kursrepo unter `platform/operations/repo`. Sie bringen die Application für den Controller von Sealed Secrets, die Application `secrets`, das Profil `restricted` in der Vorlage der Mitglieder, den angepassten Webshop und die Vorlage für k3s aus Kapitel 6.2. Wie in Kapitel 5.1 kopierst du sie über dein Plattform-Repo und ersetzt den Platzhalter durch die Adresse deines Front-ends. Was sie bewirken, erklären die Abschnitte zu Pod Security Admission und zu Secrets in Git weiter unten.

```bash
source /etc/cc-lab.env
cd ~/platform
cp -r ~/cc/platform/operations/repo/. .
sed -i "s#http://FRONTEND:3000#http://$CC_FE_IP:3000#" apps/*.yaml
git status
```

`git status` zeigt die zwei neuen Applications und drei geänderte Dateien, die Vorlage des Namespace, den Webshop und die Vorlage für k3s. Die Werte von kube-prometheus-stack aus Teil 5 lässt die Kopie unberührt. Eine Route zum Triage-Dienst aus Zusatzauftrag B von Meilenstein 3 bleibt also erhalten. Hast du eine der drei Dateien selbst angepasst, zeigt `git diff`, was die Kopie überschrieben hat.

Hat ein Mitglied in deinem Repo ein eigenes Label am Namespace, etwa für den Zugriff auf das Modell aus Kapitel 5.5, muss es als Merge-Patch formuliert sein. Ein Patch mit `op: add` auf `/metadata/labels` ersetzt alle Labels. Der Namespace verliert dabei das Profil, im Lab passierte das mit `velo`. Pushe die Ergänzungen danach.

```bash
git add -A && git commit -m "Sealed Secrets, Profil restricted für Mitglieder" && git push
```

Argo CD übernimmt die Änderungen bei der nächsten Abfrage des Repos. Es rollt den Webshop mit den neuen Angaben aus, setzt die Labels an die Namespaces der Mitglieder und legt den Controller von Sealed Secrets an. Bis der Ordner `secrets` im Repo liegt, zeigt die Application `secrets` den Zustand `Unknown` mit «app path does not exist». Das ist an dieser Stelle normal.

## Transportverschlüsselung

Die Firewall bestimmt, wer einen Dienst erreicht. Was unterwegs mit den Daten geschieht, regelt sie nicht. Fast alle Weboberflächen im Lab sprechen reines HTTP, darunter Sunstone auf Port 2616, Gitea auf Port 3000, Argo CD, Grafana und der Webshop. Wer den Verkehr zwischen Browser und Dienst mitlesen kann, sieht Passwörter, Session-Cookies und Inhalte im Klartext. Dasselbe gilt für das Token in `~/.git-credentials`, mit dem Git ins Repo `platform` pusht. Auch die Verbindung, über die Argo CD das Repo aus Gitea holt, ist nicht verschlüsselt.

**TLS** (Transport Layer Security) schützt eine Verbindung auf drei Arten. Die Verschlüsselung hält den Inhalt vertraulich. Jeder übertragene Block trägt einen Prüfwert, an dem der Empfänger eine Veränderung unterwegs erkennt. Das sichert die Integrität. Zudem weist sich der Server mit einem Zertifikat aus. Daran erkennt die Gegenseite, etwa ein Browser, ob sie mit dem richtigen Server spricht oder mit jemandem dazwischen. Die aktuelle Version TLS 1.3 ist in [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446) festgelegt.

Ein Zertifikat bindet einen öffentlichen Schlüssel an einen Namen, etwa den Hostnamen oder die IP-Adresse des Servers. Unterschrieben ist es von einer Zertifizierungsstelle, der Certificate Authority (CA). Browser und andere Programme führen eine Liste von CAs, denen sie vertrauen. Beim Verbindungsaufbau prüfen sie, ob das Zertifikat von einer dieser CAs stammt, noch gültig ist und zur aufgerufenen Adresse passt. Im Handshake beweist der Server danach, dass er den privaten Schlüssel zum Zertifikat besitzt. Ein Angreifer kann das Zertifikat kopieren, diesen Beweis aber nicht erbringen.

Im Lab siehst du das bei der API von Kubernetes auf Port 6443. Bei der Installation legt k3s eigene CAs an und stellt damit das Zertifikat des API-Servers aus ([Dokumentation von k3s](https://docs.k3s.io/cli/certificate)). Das Zertifikat dieser CA steht in deiner kubeconfig. Darum vertraut kubectl dem Server, ohne dass eine öffentliche CA beteiligt ist. Auf dem Front-end prüfst du die Verbindung mit `openssl s_client` von Hand. Der Befehl ändert nichts.

```bash
server=$(kubectl config view -o jsonpath='{.clusters[0].cluster.server}')
echo | openssl s_client -connect "${server#https://}" \
  -CAfile <(kubectl config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d) \
  2>/dev/null | grep -E '^(subject=|issuer=|Protocol|Verify return)' | awk '!seen[$0]++'
```

```text
subject=O=k3s, CN=k3s
issuer=CN=k3s-server-ca@1793541775
Protocol: TLSv1.3
Verify return code: 0 (ok)
```

`awk '!seen[$0]++'` gibt jede Zeile nur einmal aus, sonst stehen `Protocol` und `Verify return code` unter Ubuntu 26.04 manchmal doppelt da. Die Zahl hinter `k3s-server-ca@` ist der Zeitpunkt, an dem k3s die CA angelegt hat. Bei dir steht dort eine andere Zahl. Lässt du `-CAfile` weg, meldet openssl `Verify return code: 19 (self-signed certificate in certificate chain)`. Die Verbindung ist dann zwar verschlüsselt, aber openssl kennt die CA von k3s nicht und kann den Server nicht als echt erkennen.

Für die Weboberflächen genügt im Lab HTTP, weil kaum eine davon offen im Netz liegt. Nach der Härtung erreichst du vom Client und von anderen Rechnern aus nur noch SSH und Sunstone. Gitea, Argo CD, Grafana und den Webshop öffnest du über SSH-Tunnel vom Client aus. SSH verschlüsselt die Verbindung selbst und weist den Server mit seinem Host-Schlüssel aus. Hinter dem Tunnel bleibt der Verkehr auf dem Front-end oder in cc-net, das nur die Knoten und die VMs des Labs erreichen. Sunstone bleibt die Ausnahme. Seine Anmeldung geht im Klartext durch das Labnetz. Für eine Übungsumgebung mit Testdaten ist das vertretbar, für die Patientendaten der Praxis nicht.

Ein produktiver Betrieb stellt jeden Dienst hinter TLS. Vor Weboberflächen wie Sunstone steht dafür meist ein Reverse Proxy, etwa nginx oder Traefik. Er schliesst TLS ab und gibt die Anfragen an den Dienst weiter. Im Cluster übernimmt das ein [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) mit einem Abschnitt `tls`. Traefik als Ingress-Controller bringt k3s schon mit. Gitea kann HTTPS auch selbst anbieten ([Dokumentation von Gitea](https://docs.gitea.com/administration/https-setup)). Die Zertifikate stammen von einer internen CA, deren Zertifikat dann auf allen Geräten der Mitglieder installiert sein muss, oder von einer öffentlichen CA wie Let's Encrypt. Let's Encrypt stellt Zertifikate kostenlos und automatisch über das Protokoll ACME aus. Der Server weist dabei nach, dass er die Domain kontrolliert ([How It Works](https://letsencrypt.org/how-it-works/)). Das setzt einen öffentlichen Domainnamen voraus. Mit HTTPS ginge auch das Token in `~/.git-credentials` nicht mehr im Klartext übers Netz. Auf der Platte bleibt es lesbar. Darum darf nur dein Benutzer die Datei lesen, `ls -l ~/.git-credentials` zeigt `-rw-------`.

## Rechte auf der Plattform

Die Plattform trennt Rechte seit Teil 3 auf mehreren Ebenen. Auf jeder Ebene bekommt eine Rolle nur, was sie für ihre Arbeit braucht.

| Ebene | Mechanismus | Kapitel |
|---|---|---|
| OpenNebula | Gruppen, Quotas und das VDC wolkenwerk | 3.1, 3.2 |
| Kubernetes | ein Namespace pro Mitglied mit Quota | 4.5 |
| Netz im Cluster | NetworkPolicy, Zugriff auf das Modell nur mit Label | 4.5, 5.5 |
| Automatisierung | eigene Rolle pro Dienst, etwa für Prometheus nur lesende Rechte | 5.1 |
| Änderungen | Pull Requests in Gitea, Argo CD liest nur | 4.4 |

### Rollen in Kubernetes

Kubernetes regelt den Zugriff auf seine API mit Role-Based Access Control, kurz **RBAC** ([Dokumentation von Kubernetes](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)). Jede Anfrage an die API hat einen Absender, ein Verb und eine Ressource. Den Absender nennt RBAC Subject. Das kann ein Benutzer sein, eine Gruppe oder ein ServiceAccount. Benutzer und Gruppen verwaltet Kubernetes nicht selbst. Sie stammen etwa aus dem Client-Zertifikat, mit dem sich jemand anmeldet. Ein ServiceAccount ist dagegen ein Objekt in einem Namespace und gibt einem Programm im Cluster eine eigene Identität. Das Verb sagt, was geschehen soll, etwa `get`, `list`, `watch`, `create`, `patch` oder `delete`. Die Ressource ist die Art des Objekts, etwa `deployments` aus der API-Gruppe `apps` oder `secrets` aus der Kerngruppe, die in YAML als `""` erscheint.

Rechte vergibst du in zwei Schritten. Eine Rolle zählt auf, welche Verben auf welchen Ressourcen erlaubt sind. Ein Binding verbindet danach Subjects mit genau einer Rolle. Von beiden gibt es eine Fassung für einen Namespace und eine für den ganzen Cluster.

| Objekt | Gilt in | Inhalt |
|---|---|---|
| Role | einem Namespace | Regeln aus API-Gruppen, Ressourcen und Verben |
| ClusterRole | dem ganzen Cluster | Regeln, auch für Ressourcen ohne Namespace wie Nodes |
| RoleBinding | einem Namespace | Subjects und eine Role oder ClusterRole |
| ClusterRoleBinding | dem ganzen Cluster | Subjects und eine ClusterRole |

Ein RoleBinding darf auf eine ClusterRole verweisen und gibt deren Rechte dann nur in seinem eigenen Namespace. Auf diese Weise dienen die eingebauten ClusterRoles `view`, `edit` und `admin` als Vorlagen. Bekäme die Gemeinde Zugriff auf ihren Namespace, reichte ein RoleBinding in `gemeinde`, das ihre Gruppe an `edit` bindet. RBAC kennt nur Erlaubnisse. Was keine Regel erlaubt, ist verboten. Die Rechte aus mehreren Bindings zählen zusammen.

### Prometheus als Beispiel

Prometheus aus Kapitel 5.1 läuft im Namespace `monitoring` unter einem eigenen ServiceAccount. Um seine Ziele zu finden, muss es Pods, Services und Endpoints in allen Namespaces lesen. Ändern muss es nichts. Das Chart kube-prometheus-stack legt dafür eine ClusterRole an, die auf diesen Ressourcen nur die Verben `get`, `list` und `watch` erlaubt. Ein ClusterRoleBinding verbindet den ServiceAccount mit ihr. Die Rechte gelten darum in jedem Namespace, aber nur zum Lesen.

```bash
kubectl get clusterrolebinding -o wide | grep prometheus
kubectl get clusterrole monitoring-kube-prometheus-prometheus -o yaml
```

Die erste Zeile zeigt das Binding mit dem ServiceAccount, die zweite die Regeln der Rolle. Ihre Namen bildet das Chart aus dem Namen `monitoring`, unter dem Argo CD es installiert. Secrets kommen in den Regeln nicht vor. Prometheus kann also kein Passwort lesen, auch das von Grafana nicht.

Dieses Vorgehen heisst **Least Privilege**. Jede Identität bekommt die kleinsten Rechte, mit denen sie ihre Aufgabe erfüllt ([RBAC Good Practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/)). Bringt jemand Prometheus unter seine Kontrolle, kann er Objekte im Cluster lesen, aber nichts ändern oder löschen. Ein Dienst, der handeln soll, braucht dagegen eine Role mit den wenigen Verben, die er braucht, in genau dem Namespace, in dem er handelt. Der Triage-Dienst der Zusatzaufträge in Kapitel 5.5 ist ein solcher Fall.

Mit `kubectl auth can-i` prüfst du, ob die Regeln greifen. Die Option `--as` stellt die Frage im Namen eines anderen Subjects. Ein ServiceAccount heisst dabei `system:serviceaccount:<namespace>:<name>` ([kubectl auth can-i](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_auth/kubectl_auth_can-i/)). Mit `--list` siehst du alle Rechte in einem Namespace auf einmal.

```bash
kubectl auth can-i --list -n velo --as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus
```

Für `pods`, `services` und `endpoints` stehen nur die Verben `get`, `list` und `watch`. Zeilen wie `selfsubjectaccessreviews` und URLs wie `/.well-known/openid-configuration/` bekommt jedes angemeldete Subject über eingebaute ClusterRoles wie `system:basic-user` und `system:discovery`. Damit kann es seine eigenen Rechte abfragen und die API erkunden.

### Konten mit allen Rechten

Andere Konten auf der Plattform dürfen viel mehr. Der Application Controller von Argo CD hängt über ein ClusterRoleBinding an einer ClusterRole, die alle Verben auf allen Ressourcen erlaubt, weil er beliebige Objekte aus Git im ganzen Cluster anlegen muss. Die Grenze liegt darum bei Git. Wer auf `main` von `wolkenwerk/platform` pushen darf, verändert über Argo CD den ganzen Cluster.

Auch das Konto `oneadmin` und deine kubeconfig dürfen alles. `kubectl auth whoami` zeigt, dass dich deine kubeconfig als `system:admin` in der Gruppe `system:masters` ausweist. Wer in dieser Gruppe ist, umgeht jede Prüfung von RBAC. Darum funktioniert bei dir auch `--as`. Eine fremde Identität anzunehmen ist nämlich selbst ein Recht, das Verb dazu heisst `impersonate`. Im Lab bist du das ganze Plattform-Team. In einem echten Team bekäme jede Person ein eigenes Konto mit passenden Rollen. Administratorrechte hätten nur wenige.

## Pod Security Admission

Ein Mitglied bringt eigene Container mit. Läuft ein Container als `root` oder mit erweiterten Rechten des Kernels, kann ein Fehler in der Anwendung zum Ausbruch auf den Node führen. Kubernetes prüft das mit Pod Security Admission. Ein Label am Namespace bestimmt, welches Profil gilt.

| Profil | Bedeutung |
|---|---|
| privileged | keine Einschränkung |
| baseline | verhindert bekannte Wege zu mehr Rechten |
| restricted | streng, nach den aktuellen Empfehlungen für Pods |

Die Vorlage der Mitglieder setzt `restricted` in drei Modi. `enforce` weist Pods ab, `warn` zeigt beim Anwenden eine Warnung. `audit` vermerkt Verstösse im Audit-Log des API-Servers. Dieses Log schreibt der API-Server aber nur mit einer Audit-Policy, wie die Seite [Auditing](https://v1-36.docs.kubernetes.io/docs/tasks/debug/debug-cluster/audit/) beschreibt. Im Lab startet k3s ihn ohne eine solche Policy, `audit` hinterlässt dort also keine Spur. Die Labels und ihre Modi beschreibt die [Dokumentation von Pod Security Admission](https://v1-36.docs.kubernetes.io/docs/concepts/security/pod-security-admission/) für Kubernetes 1.36.

::code{file="platform/operations/repo/templates/member/namespace.yaml"}

Ein Pod erfüllt `restricted` nur, wenn er nicht als `root` läuft, keine zusätzlichen Rechte erlangen kann, alle Capabilities des Kernels abgibt und das Seccomp-Profil der Laufzeit nutzt. Jede dieser Angaben listen die [Pod Security Standards](https://v1-36.docs.kubernetes.io/docs/concepts/security/pod-security-standards/#restricted) auf. Der Webshop lief schon als gewöhnlicher Benutzer. Ihm fehlten die drei anderen Angaben.

::code{file="platform/operations/repo/webshop/deployment.yaml" lines="16-29"}

Die Labels kamen mit den Ergänzungen von Teil 6 in die Vorlage. Prüfe sie am Namespace `velo` und starte dort danach einen einfachen Test-Pod ohne Sicherheitsangaben.

```bash
kubectl get ns velo --show-labels
kubectl -n velo run psa-test --restart=Never --image=busybox:1.37 -- sleep 5
```

In der Spalte `LABELS` steht unter anderem `pod-security.kubernetes.io/enforce=restricted`. Fehlt das Label noch, hat Argo CD die Ergänzungen noch nicht übernommen. Warte dann eine Minute und versuche es erneut. Den Test-Pod weist Kubernetes ab und nennt jede fehlende Angabe.

```text
Error from server (Forbidden): pods "psa-test" is forbidden: violates PodSecurity "restricted:latest":
allowPrivilegeEscalation != false (container "psa-test" must set securityContext.allowPrivilegeEscalation=false), ...
```

Die beiden Ausgaben belegen Anforderung 3 von Meilenstein 4. Mach davon einen Screenshot wie für Anforderung 1, etwa `3-restricted.png`.

Bei einem Deployment fällt der Fehler weniger auf. Argo CD meldet das Deployment als synchron, aber das ReplicaSet kann keine Pods anlegen. `kubectl -n <namespace> get events` zeigt dann `FailedCreate`.

## Secrets in Git

In Teil 5 hast du das Passwort für Grafana von Hand als Secret angelegt, weil ein Secret in Git nur mit Base64 kodiert und damit lesbar wäre. Dadurch fehlt es aber in Git. Nach einem Neubau musst du selbst daran denken. Mit Sealed Secrets kann das Passwort trotzdem in Git liegen. Ein Controller im Cluster erzeugt ein Schlüsselpaar. Mit dem öffentlichen Schlüssel verschlüsselt `kubeseal` ein Secret zu einem SealedSecret, das in Git darf. Nur der Controller kann es mit seinem privaten Schlüssel wieder entschlüsseln.

Ein SealedSecret ist an Namen und Namespace gebunden. Kopiert es jemand in einen anderen Namespace, um es dort auszulesen, entschlüsselt der Controller es nicht. Diese Bindung heisst `strict` und ist der Standard.

Den Controller legt Argo CD mit den Ergänzungen von Teil 6 an, im Lab zwei bis drei Minuten nach dem Push. Fehlt er noch, wartet die Schleife mit `until` auf ihn. `rollout status` wartet danach, bis er läuft. Installiere dann `kubeseal` und versiegle das Passwort. Den Controller und `kubeseal` beschreibt die [Anleitung zur Installation von Sealed Secrets 0.41.2](https://github.com/bitnami/sealed-secrets/blob/v0.41.2/README.md#installation).

::code{file="platform/operations/seal-secrets.sh"}

```bash
until kubectl -n kube-system get deploy sealed-secrets-controller >/dev/null 2>&1; do sleep 10; done
kubectl -n kube-system rollout status deploy sealed-secrets-controller
sudo ~/cc/platform/operations/install-kubeseal.sh
~/cc/platform/operations/seal-secrets.sh
```

Das Secret aus Teil 5 existiert schon. Der Controller überschreibt kein Secret, das er nicht selbst angelegt hat, im Lab meldete er «already exists and is not managed by SealedSecret». Eine Annotation übergibt ihm das Secret. Setze sie deshalb, bevor du das SealedSecret pushst. Die Annotation beschreibt der Abschnitt [Managing existing secrets](https://github.com/bitnami/sealed-secrets/blob/v0.41.2/README.md#managing-existing-secrets) der Dokumentation.

```bash
cd ~/platform
kubectl -n monitoring annotate secret grafana-admin sealedsecrets.bitnami.com/managed=true
git add secrets && git commit -m "Grafana-Passwort verschlüsselt in Git" && git push
until kubectl -n monitoring get secret grafana-admin -o jsonpath='{.metadata.ownerReferences[0].kind}' | grep SealedSecret; do sleep 10; done
```

Die Schleife endet mit der Ausgabe `SealedSecret`, sobald Argo CD das SealedSecret ausgerollt und der Controller das Secret übernommen hat. Im Lab dauerte das 40 Sekunden bis gut eineinhalb Minuten. Diese Ausgabe belegt Anforderung 2 von Meilenstein 4, mach davon einen Screenshot, etwa `2-sealedsecret.png`. Endet die Schleife nach einigen Minuten nicht, brichst du sie mit Ctrl+C ab. Den Grund zeigt dann `kubectl -n kube-system logs deploy/sealed-secrets-controller`. Kam das SealedSecret vor der Annotation an, startest du den Controller nach der Annotation mit `kubectl -n kube-system rollout restart deploy sealed-secrets-controller` neu. Danach versucht er es erneut. Ohne den privaten Schlüssel des Controllers ist das SealedSecret in Git wertlos, auch für dich. Kapitel 6.2 sichert ihn darum mit.

## Updates

Das Front-end und die VMs von k3s bekommen Sicherheitsupdates von Ubuntu automatisch. Ein Neustart, etwa für einen neuen Kernel, geschieht nicht von selbst. Gibt es die Datei `/var/run/reboot-required`, ist einer nötig. Die Software der Plattform aktualisierst du selbst, OpenNebula mit den Paketen, k3s über die Variable `k3s_version` und einen Neubau, die Charts über ihre Versionen in Git. Weil jede dieser Versionen in Git steht, lässt sich nachvollziehen, was wann lief.

::::exercise[Schutzbedarf]
Nimm deine Einstufung der vier Mitglieder aus Kapitel 1.4 und prüfe, welche Massnahmen dieses Kapitels zu welchem Schutzziel beitragen. Machst du Zusatzauftrag A aus Kapitel 6.5, stufst du danach auch dein eigenes Mitglied nach Vertraulichkeit, Integrität und Verfügbarkeit ein und begründest jede Stufe in einem Satz.

:::solution
Die Einstufung aus Kapitel 1.4 gilt weiter, etwa die Praxis mit Vertraulichkeit sehr hoch, Integrität hoch und Verfügbarkeit hoch. Die Firewall und der Zugang nur mit Schlüssel schützen das Front-end, das Profil `restricted` erschwert den Ausbruch aus einem Container auf den Node. Beides dient vor allem der Vertraulichkeit und der Integrität aller Mitglieder. Dank Sealed Secrets liegen keine Passwörter im Klartext in Git. Für die sehr hohe Vertraulichkeit der Praxis reicht das allein nicht. Die Weboberflächen laufen im Lab ohne TLS. Zudem sind die Knoten nicht gehärtet. Über VNC erreicht sogar die VM eines anderen Mitglieds die Konsolen der Praxis ohne Passwort. Ein eigenes Mitglied wie eine Kindertagesstätte mit Daten von Kindern hätte eine sehr hohe Vertraulichkeit, eine hohe Integrität und eine normale Verfügbarkeit, weil sich Anmeldungen um einen Tag verschieben lassen. Andere Stufen sind ebenso richtig, wenn du sie schlüssig begründest.
:::
::::

::::exercise[Lab]
Härte dein Front-end, verschiebe das Passwort von Grafana in ein SealedSecret und setze das Profil `restricted` für alle Mitglieder. Zeige, dass ein Pod ohne Sicherheitsangaben abgewiesen wird. Lege dabei die Screenshots für die Anforderungen 1 bis 3 von Meilenstein 4 an.

:::solution
Vom Client aus scheitert `ssh -o PubkeyAuthentication=no`, `ssh mmuster-fe hostname` gibt `mmuster-fe` aus. Auf dem Front-end zeigt `systemctl is-active cc-firewall` den Zustand `active`, `kubectl get ns velo --show-labels` zeigt das Label `pod-security.kubernetes.io/enforce=restricted`. `kubectl -n velo run psa-test --restart=Never --image=busybox:1.37 -- sleep 5` endet mit `forbidden: violates PodSecurity`. `kubectl -n monitoring get secret grafana-admin -o jsonpath='{.metadata.ownerReferences[0].kind}'` gibt `SealedSecret` aus. In `~/cc-mmuster/m4` liegen die Screenshots der Anforderungen 1 bis 3. Die ersten Prüfungen des Checks `operations` sind grün.
:::
::::

::::exercise[Rechte prüfen]
Prüfe mit `kubectl auth can-i` und `--as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus`, ob Prometheus Pods in `velo` lesen und löschen, Deployments in `gemeinde` ändern und Secrets in `velo` lesen darf. Überlege danach, warum Prometheus keine Role in einem Namespace hat, sondern eine ClusterRole. Ändere im Lab nichts.

:::solution
Nur die erste Frage beantwortet kubectl mit `yes`.

```bash
kubectl auth can-i get pods -n velo --as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus                # yes
kubectl auth can-i delete pods -n velo --as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus             # no
kubectl auth can-i patch deployments -n gemeinde --as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus   # no
kubectl auth can-i get secrets -n velo --as=system:serviceaccount:monitoring:monitoring-kube-prometheus-prometheus             # no
```

Löschen und Ändern fehlen in der Liste der Verben, Secrets sind eine andere Ressource. Prometheus findet seine Ziele in allen Namespaces, auch in denen, die ein neues Mitglied später bekommt. Eine Role müsste in jedem Namespace einzeln entstehen. Die ClusterRole mit ihrem ClusterRoleBinding deckt alle auf einmal ab, bleibt aber auf lesende Verben beschränkt.
:::
::::

::::exercise[Images prüfen]
Für Schnelle. Prüfe das Image des Webshops mit Trivy auf bekannte Schwachstellen und überlege, wie die CI des Kursrepos ein Image mit kritischen Lücken stoppen könnte. Wie du Trivy installierst, beschreibt die [Anleitung zur Installation von Trivy 0.76](https://trivy.dev/docs/v0.76/getting-started/installation/).

:::solution
`trivy image ghcr.io/ndum/cc/webshop:1.0.0` listet Schwachstellen der Pakete im Image mit ihrem Schweregrad. In der CI liefe derselbe Scan nach dem Bau. Mit `--exit-code 1 --severity CRITICAL` würde der Job bei kritischen Funden scheitern. Ein kleines Basis-Image hat weniger Pakete und damit weniger Funde.
:::
::::
