---
title: Sicherheit
description: Schutzbedarf der Mitglieder, ein gehärtetes Front-end mit SSH-Schlüsseln, Firewall und Updates, TLS und SSH-Tunnel, RBAC in Kubernetes, das Profil restricted für Pods, verschlüsselte Secrets in Git und wer auf der Plattform was darf.
sidebar:
  order: 1
---

:::assignment
«Eine fünfte Organisation will Mitglied werden», schreibt Beat Kläy, Präsident des Vorstands. «Bevor wir zusagen, will ich wissen, wie gut wir geschützt sind. Wer kommt an die Server, wo liegen die Passwörter, und was passiert, wenn ein Mitglied eine unsichere Anwendung mitbringt?»
:::

:::goals
Nach diesem Kapitel kannst du

- den Schutzbedarf eines Mitglieds nach Vertraulichkeit, Integrität und Verfügbarkeit einschätzen,
- das Front-end mit SSH-Schlüsseln, einer Firewall und automatischen Updates härten,
- erklären, wie TLS eine Verbindung schützt und wo das Lab stattdessen auf SSH-Tunnel setzt,
- die Rechte eines ServiceAccounts mit Role und RoleBinding festlegen und prüfen,
- Pods der Mitglieder mit Pod Security Admission auf das Profil restricted verpflichten,
- Secrets verschlüsselt in Git ablegen,
- zeigen, wer auf deiner Plattform was darf.
:::

Die Kapitel von Teil 6 bauen auf deinem Lab nach Teil 5 auf.

## Schutzbedarf

Sicherheit kostet Zeit und Bequemlichkeit, darum beginnt sie mit der Frage, was zu schützen ist. Man schätzt den Schutzbedarf von Daten und Diensten nach drei Zielen ein.

| Ziel | Frage | Beispiel bei Wolkenwerk |
|---|---|---|
| Vertraulichkeit | Wer darf die Daten sehen? | Patientendaten der Praxis Rosenweg |
| Integrität | Bleiben die Daten richtig und vollständig? | Buchhaltung der Treuhand Aaregg |
| Verfügbarkeit | Ist der Dienst da, wenn man ihn braucht? | Schalterdienste der Gemeinde Hinterbüel |

Üblich sind drei Stufen, normal, hoch und sehr hoch. Massgebend ist der Schaden, den ein Verlust anrichten würde, für Menschen, für das Mitglied und für Wolkenwerk. Gesundheitsdaten sind nach Art. 5 des Datenschutzgesetzes besonders schützenswert, und Ärztinnen und Ärzte stehen unter dem Berufsgeheimnis von Art. 321 StGB. Kapitel 1.4 hat beides eingeführt. Für die Praxis ist die Vertraulichkeit darum sehr hoch. Beim Webshop des Veloateliers zählt vor allem die Verfügbarkeit am Samstag.

Aus dem Schutzbedarf folgen Massnahmen. Die Plattform braucht eine Grundsicherung für alle, und Mitglieder mit hohem Bedarf bekommen mehr, etwa eine eigene VM statt eines Namespaces oder kürzere Fristen für Backups.

## Die Angriffsfläche des Labs

Angreifen lässt sich nur, was erreichbar ist. Nach Teil 5 nimmt dein Front-end Verbindungen auf mehreren Ports an.

| Port | Dienst | Wer braucht ihn |
|---|---|---|
| 22 | SSH | du |
| 2616 | Weboberfläche von OpenNebula | du und die Mitglieder |
| 2633 | API von OpenNebula | OpenTofu auf dem Front-end selbst |
| 3000 | Gitea | Argo CD im Cluster, du über einen Tunnel |
| 9100, 9925 | Exporter für Prometheus | Prometheus im Cluster |

Die Knoten und die VMs in cc-net sprechen mit dem Front-end über weitere Ports, etwa für das Monitoring von OpenNebula und VXLAN. Von ausserhalb des Labs brauchst du nur SSH und die Weboberfläche. Alles andere darf eine Firewall abweisen.

## Das Front-end härten

Härten heisst, alles abzuschalten oder abzuschotten, was nicht gebraucht wird. Das Skript des Kurses macht drei Dinge.

::code{file="platform/operations/harden-frontend.sh"}

SSH nimmt danach nur noch Schlüssel an, und `root` darf sich nicht direkt anmelden. Ein Passwort lässt sich erraten oder abfangen, ein privater Schlüssel verlässt deinen Rechner nicht. Die Firewall ist eine eigene Tabelle von nftables. Sie lässt die Knoten und cc-net alles erreichen, von anderswo nur SSH und die Weboberfläche. Die Tabelle `cc_gateway` mit der NAT für cc-net aus Kapitel 0.4 bleibt unberührt. Ubuntu installiert Sicherheitsupdates mit `unattended-upgrades` jeden Tag selbst, das Skript stellt sicher, dass es läuft.

![Die Schutzschichten von Front-end und Cluster. In der Mitte das Front-end. Seine Firewall, die Tabelle cc_firewall von nftables, weist alles ab, was sie nicht ausdrücklich erlaubt. Andere Rechner erreichen nur SSH auf Port 22 und die Weboberfläche auf Port 2616, SSH nimmt nur Schlüssel an und lässt root nicht direkt herein. Die Knoten und cc-net erreichen alles, auch Gitea auf Port 3000, die API auf Port 2633 und die Exporter auf den Ports 9100 und 9925. unattended-upgrades installiert jeden Tag Sicherheitsupdates. Rechts der Cluster. Pod Security Admission verlangt in den Namespaces der Mitglieder das Profil restricted, NetworkPolicies trennen die Mitglieder, und der Triage-Dienst darf nur get und patch auf Deployments in velo. Ein SealedSecret kommt verschlüsselt aus Gitea, nur der Controller von Sealed Secrets in kube-system kann es entschlüsseln.](../../../assets/figures/de/p6c1-security.svg)

Prüfe vorher, dass du dich mit deinem Schlüssel anmelden kannst. Lass die erste Verbindung offen, bis eine zweite mit dem Schlüssel klappt.

```bash
sudo ~/cc/platform/operations/harden-frontend.sh
ssh -o PubkeyAuthentication=no mmuster-fe
```

Die zweite Verbindung scheitert mit `Permission denied (publickey)`. Im Lab antwortete die Weboberfläche danach wie vorher, Gitea war vom Rechner der Dozentin oder des Dozenten aus nicht mehr erreichbar, und alle Ziele in Prometheus blieben `up`.

Gitea erreichst du ab jetzt über einen Tunnel. Den lokalen Port 3000 belegt schon der Tunnel zu Grafana, darum nimmst du einen anderen, etwa `ssh -L 3001:localhost:3000 mmuster-fe`, und öffnest `http://localhost:3001/`.

## Transportverschlüsselung

Die Firewall bestimmt, wer einen Dienst erreicht. Was unterwegs mit den Daten geschieht, regelt sie nicht. Fast alle Weboberflächen im Lab sprechen reines HTTP, Sunstone auf Port 2616, Gitea auf Port 3000, Argo CD, Grafana und der Webshop. Wer den Verkehr zwischen Browser und Dienst mitlesen kann, sieht Passwörter, Session-Cookies und Inhalte im Klartext. Das gilt auch für das Token in `~/.git-credentials`, mit dem Git ins Repo `platform` pusht, und für die Verbindung, über die Argo CD das Repo aus Gitea holt.

TLS (Transport Layer Security) schützt eine Verbindung auf drei Arten. Die Verschlüsselung hält den Inhalt vertraulich. Jeder übertragene Block trägt einen Prüfwert, und eine Veränderung unterwegs fällt beim Empfänger auf, das sichert die Integrität. Der Server weist sich zudem mit einem Zertifikat aus, so weiss der Client, dass er mit dem richtigen Server spricht und nicht mit jemandem dazwischen. Die aktuelle Version TLS 1.3 ist in [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446) festgelegt.

Ein Zertifikat bindet einen öffentlichen Schlüssel an einen Namen, etwa den Hostnamen oder die IP-Adresse des Servers. Unterschrieben ist es von einer Zertifizierungsstelle, der Certificate Authority (CA). Der Client hat eine Liste von CAs, denen er vertraut, und prüft, ob das Zertifikat von einer davon stammt, noch gültig ist und zur aufgerufenen Adresse passt. Im Handshake beweist der Server danach, dass er den privaten Schlüssel zum Zertifikat besitzt. Ein Angreifer kann das Zertifikat kopieren, diesen Beweis aber nicht erbringen.

Im Lab siehst du das bei der API von Kubernetes auf Port 6443. k3s legt bei der Installation eigene CAs an und stellt damit das Zertifikat des API-Servers aus ([Dokumentation von k3s](https://docs.k3s.io/cli/certificate)). Das Zertifikat dieser CA steht in deiner kubeconfig, darum vertraut kubectl dem Server, ohne dass eine öffentliche CA beteiligt ist. Mit `openssl s_client` prüfst du die Verbindung von Hand, auf dem Front-end und ohne etwas zu ändern.

```bash
server=$(kubectl config view -o jsonpath='{.clusters[0].cluster.server}')
echo | openssl s_client -connect "${server#https://}" \
  -CAfile <(kubectl config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d) \
  2>/dev/null | grep -E 'subject=|issuer=|Protocol|Verify return'
```

```text
subject=O=k3s, CN=k3s
issuer=CN=k3s-server-ca@1793541775
Protocol: TLSv1.3
Verify return code: 0 (ok)
```

Die Zahl hinter `k3s-server-ca@` ist der Zeitpunkt, an dem k3s die CA angelegt hat, bei dir steht eine andere. Lässt du `-CAfile` weg, meldet openssl `Verify return code: 19 (self-signed certificate in certificate chain)`. Die Verbindung ist dann zwar verschlüsselt, aber openssl kennt die CA von k3s nicht und kann den Server nicht als echt erkennen.

Für die Weboberflächen genügt im Lab HTTP, weil kaum etwas davon offen im Netz liegt. Von anderen Rechnern erreichst du nach der Härtung nur SSH und Sunstone. Gitea, Argo CD, Grafana und den Webshop öffnest du über SSH-Tunnel, und SSH verschlüsselt die Verbindung selbst und weist den Server mit seinem Host-Schlüssel aus. Hinter dem Tunnel bleibt der Verkehr auf dem Front-end oder in cc-net, das nur die Knoten und die VMs des Labs erreichen. Sunstone bleibt die Ausnahme, seine Anmeldung geht im Netz des Schulzimmers im Klartext. Für eine Übungsumgebung mit Testdaten ist das vertretbar, für die Patientendaten der Praxis nicht.

Ein produktiver Betrieb stellt jeden Dienst hinter TLS. Für Weboberflächen nimmt man meist einen Reverse Proxy wie nginx oder Traefik, der TLS abschliesst und die Anfragen an den Dienst weitergibt, so etwa vor Sunstone. Im Cluster übernimmt das ein [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) mit einem Abschnitt `tls`, und k3s bringt Traefik als Ingress-Controller schon mit. Gitea kann HTTPS auch selbst anbieten ([Dokumentation von Gitea](https://docs.gitea.com/administration/https-setup)). Die Zertifikate stammen von einer internen CA, deren Zertifikat dann auf allen Geräten der Mitglieder installiert sein muss, oder von einer öffentlichen CA wie Let's Encrypt. Let's Encrypt stellt Zertifikate kostenlos und automatisch über das Protokoll ACME aus, dabei weist der Server nach, dass er die Domain kontrolliert ([How It Works](https://letsencrypt.org/how-it-works/)). Das setzt einen öffentlichen Domainnamen voraus. Mit HTTPS ginge auch das Token in `~/.git-credentials` nicht mehr im Klartext übers Netz. Auf der Platte bleibt es lesbar, darum darf nur dein Benutzer die Datei lesen, `ls -l ~/.git-credentials` zeigt `-rw-------`.

## Rechte auf der Plattform

Die Plattform trennt Rechte seit Teil 3 auf mehreren Ebenen. Das Prinzip ist immer dasselbe, jede Rolle bekommt nur, was sie für ihre Arbeit braucht.

| Ebene | Mechanismus | Kapitel |
|---|---|---|
| OpenNebula | Gruppen, Quotas und das VDC wolkenwerk | 3.1, 3.2 |
| Kubernetes | ein Namespace pro Mitglied mit Quota | 4.5 |
| Netz im Cluster | NetworkPolicy, Zugriff auf das Modell nur mit Label | 4.5, 5.5 |
| Automatisierung | eigene Rolle des Triage-Dienstes, nur `get` und `patch` in `velo` | 5.6 |
| Änderungen | Pull Requests in Gitea, Argo CD liest nur | 4.4 |

### Rollen in Kubernetes

Kubernetes regelt den Zugriff auf seine API mit Role-Based Access Control, kurz RBAC ([Dokumentation von Kubernetes](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)). Jede Anfrage an die API hat einen Absender, ein Verb und eine Ressource. Den Absender nennt RBAC Subject. Das kann ein Benutzer sein, eine Gruppe oder ein ServiceAccount. Benutzer und Gruppen verwaltet Kubernetes nicht selbst, sie stammen etwa aus dem Client-Zertifikat, mit dem sich jemand anmeldet. Ein ServiceAccount ist dagegen ein Objekt in einem Namespace und gibt einem Programm im Cluster eine eigene Identität. Das Verb sagt, was geschehen soll, etwa `get`, `list`, `watch`, `create`, `patch` oder `delete`. Die Ressource ist die Art des Objekts, etwa `deployments` aus der API-Gruppe `apps` oder `secrets` aus der Kerngruppe, die in YAML als `""` erscheint.

Rechte vergibst du in zwei Schritten. Eine Rolle zählt auf, welche Verben auf welchen Ressourcen erlaubt sind. Ein Binding verbindet danach Subjects mit genau einer Rolle. Von beiden gibt es eine Fassung für einen Namespace und eine für den ganzen Cluster.

| Objekt | Gilt in | Inhalt |
|---|---|---|
| Role | einem Namespace | Regeln aus API-Gruppen, Ressourcen und Verben |
| ClusterRole | dem ganzen Cluster | Regeln, auch für Ressourcen ohne Namespace wie Nodes |
| RoleBinding | einem Namespace | Subjects und eine Role oder ClusterRole |
| ClusterRoleBinding | dem ganzen Cluster | Subjects und eine ClusterRole |

Ein RoleBinding darf auf eine ClusterRole verweisen und gibt deren Rechte dann nur in seinem eigenen Namespace. So nutzt man die eingebauten ClusterRoles `view`, `edit` und `admin` als Vorlagen. Bekäme die Gemeinde Zugriff auf ihren Namespace, reichte ein RoleBinding in `gemeinde`, das ihre Gruppe an `edit` bindet. RBAC kennt nur Erlaubnisse. Was keine Regel erlaubt, ist verboten, und die Rechte aus mehreren Bindings zählen zusammen.

### Der Triage-Dienst als Beispiel

Der Triage-Dienst aus Kapitel 5.6 läuft im Namespace `ai` unter dem ServiceAccount `triage`. Er soll den Webshop neu starten können und sonst nichts.

::code{file="platform/observability/repo/ai/triage-rbac.yaml"}

Die Role liegt in `velo` und erlaubt `get` und `patch` auf Deployments der Gruppe `apps`. Für einen Neustart genügt das, weil er nur eine Anmerkung im Pod-Template des Deployments setzt. Das RoleBinding liegt ebenfalls in `velo` und nennt als Subject den ServiceAccount aus `ai`. Subject und Binding dürfen in verschiedenen Namespaces liegen, die Rechte gelten immer im Namespace des Bindings. Der Dienst kann darum weder Secrets lesen noch Deployments löschen noch etwas in `gemeinde` anfassen.

Dieses Vorgehen heisst Least Privilege. Jede Identität bekommt die kleinsten Rechte, mit denen sie ihre Aufgabe erfüllt ([RBAC Good Practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/)). Bringt jemand den Dienst unter seine Kontrolle, etwa über eine manipulierte Meldung, die das Modell zu einem falschen Vorschlag verleitet, bleibt der Schaden auf Neustarts in `velo` begrenzt.

Mit `kubectl auth can-i` prüfst du, ob die Regeln greifen. Die Option `--as` stellt die Frage im Namen eines anderen Subjects, ein ServiceAccount heisst dabei `system:serviceaccount:<namespace>:<name>` ([kubectl auth can-i](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_auth/kubectl_auth_can-i/)). Kapitel 5.6 hat einzelne Verben geprüft, `--list` zeigt alle Rechte in einem Namespace auf einmal.

```bash
kubectl auth can-i --list -n velo --as=system:serviceaccount:ai:triage
```

```text
Resources                                       Non-Resource URLs                      Resource Names   Verbs
selfsubjectreviews.authentication.k8s.io        []                                     []               [create]
selfsubjectaccessreviews.authorization.k8s.io   []                                     []               [create]
selfsubjectrulesreviews.authorization.k8s.io    []                                     []               [create]
deployments.apps                                []                                     []               [get patch]
                                                [/.well-known/openid-configuration/]   []               [get]
...
```

Die Zeile `deployments.apps` stammt aus der Role `triage`. Die drei Zeilen darüber und die URLs darunter bekommt jedes angemeldete Subject über eingebaute ClusterRoles wie `system:basic-user` und `system:discovery`, damit es seine eigenen Rechte abfragen und die API erkunden kann.

### Konten mit allen Rechten

Andere Konten auf der Plattform dürfen viel mehr. Der Application Controller von Argo CD hängt über ein ClusterRoleBinding an einer ClusterRole, die alle Verben auf allen Ressourcen erlaubt, weil er beliebige Objekte aus Git im ganzen Cluster anlegen muss. Die eigentliche Grenze ist darum Git. Wer auf `main` von `wolkenwerk/platform` pushen darf, verändert über Argo CD den ganzen Cluster.

Auch das Konto `oneadmin` und deine kubeconfig dürfen alles. `kubectl auth whoami` zeigt, dass dich deine kubeconfig als `system:admin` in der Gruppe `system:masters` ausweist. Wer in dieser Gruppe ist, umgeht jede Prüfung von RBAC. Darum funktioniert bei dir auch `--as`, denn eine fremde Identität anzunehmen ist selbst ein Recht, das Verb heisst `impersonate`. Im Lab bist du das ganze Plattform-Team. In einem echten Team bekäme jede Person ein eigenes Konto mit passenden Rollen, und die Rechte von Administratoren wären auf wenige Personen beschränkt.

## Pod Security Admission

Ein Mitglied bringt eigene Container mit. Läuft ein Container als `root` oder mit erweiterten Rechten des Kernels, kann ein Fehler in der Anwendung zum Ausbruch auf den Node führen. Kubernetes prüft das mit Pod Security Admission. Ein Label am Namespace bestimmt, welches Profil gilt.

| Profil | Bedeutung |
|---|---|
| privileged | keine Einschränkung |
| baseline | verhindert bekannte Wege zu mehr Rechten |
| restricted | streng, nach den aktuellen Empfehlungen für Pods |

Die Vorlage der Mitglieder setzt `restricted` in drei Modi. `enforce` weist Pods ab, `warn` zeigt eine Warnung beim Anwenden, und `audit` schreibt Verstösse ins Audit-Log von Kubernetes.

::code{file="platform/operations/repo/templates/member/namespace.yaml"}

Ein Pod erfüllt `restricted` nur, wenn er nicht als `root` läuft, keine zusätzlichen Rechte erlangen kann, alle Capabilities des Kernels abgibt und das Seccomp-Profil der Laufzeit nutzt. Der Webshop lief schon als gewöhnlicher Benutzer, ihm fehlten die drei anderen Angaben.

::code{file="platform/operations/repo/webshop/deployment.yaml" lines="16-29"}

Im Lab wies Kubernetes einen einfachen Test-Pod im Namespace `velo` danach ab und nannte jede fehlende Angabe.

```text
Error from server (Forbidden): pods "psa-test" is forbidden: violates PodSecurity "restricted:latest":
allowPrivilegeEscalation != false (container "psa-test" must set securityContext.allowPrivilegeEscalation=false), ...
```

Bei einem Deployment ist der Fehler weniger sichtbar. Argo CD meldet das Deployment als synchron, aber das ReplicaSet kann keine Pods anlegen, und `kubectl -n <namespace> get events` zeigt `FailedCreate`.

## Secrets in Git

In Teil 5 hast du das Passwort für Grafana von Hand als Secret angelegt, weil ein Secret in Git nur mit Base64 kodiert und damit lesbar wäre. Damit fehlt es aber in Git, und nach einem Neubau musst du daran denken. Sealed Secrets schliesst diese Lücke. Ein Controller im Cluster erzeugt ein Schlüsselpaar. Mit dem öffentlichen Schlüssel verschlüsselt `kubeseal` ein Secret zu einem SealedSecret, das in Git darf. Nur der Controller kann es mit seinem privaten Schlüssel wieder entschlüsseln.

Ein SealedSecret ist an Namen und Namespace gebunden. Wer es in einen anderen Namespace kopiert, um es dort auszulesen, bekommt nichts. Diese Bindung heisst `strict` und ist der Standard.

Kopiere zuerst die Ergänzungen von Teil 6 in dein Plattform-Repo. Sie bringen die Application für den Controller, die Application `secrets`, das Profil `restricted` in der Vorlage, den angepassten Webshop und die Vorlage für k3s aus Kapitel 6.2.

```bash
source /etc/cc-lab.env
cd ~/platform
cp -r ~/cc/platform/operations/repo/. .
sed -i "s#http://FRONTEND:3000#http://$CC_FE_IP:3000#" apps/*.yaml
git status
```

Hat ein Mitglied in deinem Repo ein eigenes Label am Namespace, etwa `ai: allowed` aus Kapitel 5.5, muss es als Merge-Patch formuliert sein. Ein Patch mit `op: add` auf `/metadata/labels` ersetzt alle Labels, und der Namespace verliert das Profil. Im Lab passierte genau das mit `velo`. Pushe die Änderungen und warte, bis der Controller läuft. Installiere dann `kubeseal` und versiegle das Passwort.

::code{file="platform/operations/seal-secrets.sh"}

```bash
git add -A && git commit -m "Sealed Secrets, Profil restricted für Mitglieder" && git push
kubectl -n kube-system rollout status deploy sealed-secrets-controller
sudo ~/cc/platform/operations/install-kubeseal.sh
~/cc/platform/operations/seal-secrets.sh
```

Das Secret aus Teil 5 existiert schon, und der Controller überschreibt kein Secret, das er nicht selbst angelegt hat. Im Lab meldete er «already exists and is not managed by SealedSecret». Eine Annotation übergibt es ihm, ein Neustart lässt ihn es neu versuchen.

```bash
git add secrets && git commit -m "Grafana-Passwort verschlüsselt in Git" && git push
kubectl -n monitoring annotate secret grafana-admin sealedsecrets.bitnami.com/managed=true
kubectl -n kube-system rollout restart deploy sealed-secrets-controller
kubectl -n monitoring get secret grafana-admin -o jsonpath='{.metadata.ownerReferences[0].kind}'
```

Die letzte Zeile gibt `SealedSecret` aus. Ohne den privaten Schlüssel des Controllers ist das SealedSecret in Git wertlos, auch für dich. Kapitel 6.2 sichert ihn darum mit.

## Updates

Das Front-end und die VMs von k3s bekommen Sicherheitsupdates von Ubuntu automatisch. Ein Neustart, etwa für einen neuen Kernel, geschieht nicht von selbst. `/var/run/reboot-required` zeigt, wann einer nötig ist. Die Software der Plattform aktualisierst du selbst, OpenNebula mit den Paketen, k3s über die Variable `k3s_version` und einen Neubau, die Charts über ihre Versionen in Git. Jede dieser Versionen steht in Git, so ist nachvollziehbar, was wann lief.

::::exercise[Schutzbedarf]
Nimm deine Einstufung der vier Mitglieder aus Kapitel 1.4 und prüfe, welche Massnahmen dieses Kapitels zu welchem Schutzziel beitragen. Machst du den Zusatzauftrag von Meilenstein 4, stufst du danach auch dein eigenes Mitglied nach Vertraulichkeit, Integrität und Verfügbarkeit ein und begründest jede Stufe in einem Satz.

:::solution
Die Einstufung aus Kapitel 1.4 gilt weiter, etwa die Praxis mit Vertraulichkeit sehr hoch, Integrität hoch und Verfügbarkeit hoch. Die Firewall, der Zugang nur mit Schlüssel und das Profil `restricted` schützen Vertraulichkeit und Integrität aller Mitglieder. Sealed Secrets halten Passwörter aus dem Klartext in Git. Für die sehr hohe Vertraulichkeit der Praxis reicht das allein nicht, weil die Weboberflächen im Lab ohne TLS laufen. Ein eigenes Mitglied wie eine Kindertagesstätte mit Daten von Kindern hätte eine sehr hohe Vertraulichkeit, eine hohe Integrität und eine normale Verfügbarkeit, weil sich Anmeldungen um einen Tag verschieben lassen. Andere Stufen sind richtig, wenn die Begründung trägt.
:::
::::

::::exercise[Lab]
Härte dein Front-end, verschiebe das Passwort von Grafana in ein SealedSecret und setze das Profil `restricted` für alle Mitglieder. Zeige, dass ein Pod ohne Sicherheitsangaben abgewiesen wird.

:::solution
`ssh -o PubkeyAuthentication=no` scheitert, `systemctl is-active cc-firewall` zeigt `active`, und `kubectl get ns velo --show-labels` zeigt das Label `pod-security.kubernetes.io/enforce=restricted`. `kubectl -n velo run test --image=busybox -- sleep 5` endet mit `forbidden: violates PodSecurity`. Die ersten Prüfungen des Checks `operations` sind grün.
:::
::::

::::exercise[Rechte prüfen]
Prüfe mit `kubectl auth can-i` und `--as=system:serviceaccount:ai:triage`, ob der Triage-Dienst Deployments in `velo` lesen und löschen, Deployments in `gemeinde` patchen und Secrets in `velo` lesen darf. Überlege danach, welche Regel die Role `triage` zusätzlich bräuchte, damit der Dienst die Logs der Pods in `velo` lesen kann. Ändere im Lab nichts.

:::solution
Nur die erste Frage beantwortet kubectl mit `yes`.

```bash
kubectl auth can-i get deployments -n velo --as=system:serviceaccount:ai:triage      # yes
kubectl auth can-i delete deployments -n velo --as=system:serviceaccount:ai:triage   # no
kubectl auth can-i patch deployments -n gemeinde --as=system:serviceaccount:ai:triage  # no
kubectl auth can-i get secrets -n velo --as=system:serviceaccount:ai:triage          # no
```

Löschen fehlt in der Liste der Verben, `gemeinde` hat kein RoleBinding für den Dienst, und Secrets sind eine andere Ressource. Für die Logs bräuchte die Role eine zweite Regel mit der API-Gruppe `""`, der Ressource `pods/log` und dem Verb `get`, dazu `list` auf `pods`, damit der Dienst die Namen der Pods findet. `kubectl auth can-i get pods/log -n velo` mit derselben Option `--as` antwortet heute `no`. Die neue Regel gehörte in die Datei im Plattform-Repo, und Argo CD würde sie anwenden.
:::
::::

::::exercise[Images prüfen]
Für Schnelle. Prüfe das Image des Webshops mit Trivy auf bekannte Schwachstellen und überlege, wie die CI des Kursrepos ein Image mit kritischen Lücken stoppen könnte.

:::solution
`trivy image ghcr.io/ndum/cc/webshop:1.0.0` listet Schwachstellen der Pakete im Image mit ihrem Schweregrad. In der CI liefe derselbe Scan nach dem Bau, und `--exit-code 1 --severity CRITICAL` liesse den Job bei kritischen Funden scheitern. Ein kleines Basis-Image hat weniger Pakete und damit weniger Funde.
:::
::::
