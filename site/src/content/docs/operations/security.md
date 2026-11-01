---
title: Sicherheit
description: Schutzbedarf der Mitglieder, ein gehärtetes Front-end mit SSH-Schlüsseln, Firewall und Updates, das Profil restricted für Pods, verschlüsselte Secrets in Git und wer auf der Plattform was darf.
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

SSH nimmt danach nur noch Schlüssel an, und `root` darf sich nicht direkt anmelden. Ein Passwort lässt sich erraten oder abfangen, ein privater Schlüssel verlässt deinen Rechner nicht. Die Firewall ist eine eigene Tabelle von nftables. Sie lässt die Knoten und cc-net alles erreichen, von anderswo nur SSH und die Weboberfläche. Die Tabelle `cc_gateway` mit der NAT für cc-net aus Kapitel 2.3 bleibt unberührt. Ubuntu installiert Sicherheitsupdates mit `unattended-upgrades` jeden Tag selbst, das Skript stellt sicher, dass es läuft.

Prüfe vorher, dass du dich mit deinem Schlüssel anmelden kannst. Lass die erste Verbindung offen, bis eine zweite mit dem Schlüssel klappt.

```bash
sudo ~/cc/platform/operations/harden-frontend.sh
ssh -o PubkeyAuthentication=no mmuster-fe
```

Die zweite Verbindung scheitert mit `Permission denied (publickey)`. Im Lab antwortete die Weboberfläche danach wie vorher, Gitea war vom Rechner der Dozentin oder des Dozenten aus nicht mehr erreichbar, und alle Ziele in Prometheus blieben `up`.

## Rechte auf der Plattform

Die Plattform trennt Rechte seit Teil 3 auf mehreren Ebenen. Das Prinzip ist immer dasselbe, jede Rolle bekommt nur, was sie für ihre Arbeit braucht.

| Ebene | Mechanismus | Kapitel |
|---|---|---|
| OpenNebula | Gruppen, Quotas und das VDC wolkenwerk | 3.1, 3.2 |
| Kubernetes | ein Namespace pro Mitglied mit Quota | 4.5 |
| Netz im Cluster | NetworkPolicy, Zugriff auf das Modell nur mit Label | 4.5, 5.5 |
| Automatisierung | eigene Rolle des Triage-Dienstes, nur `get` und `patch` in `velo` | 5.6 |
| Änderungen | Pull Requests in Gitea, Argo CD liest nur | 4.4 |

Eine Lücke bleibt, das Konto `oneadmin` und deine kubeconfig dürfen alles. Im Lab bist du das ganze Plattform-Team. In einem echten Team bekäme jede Person ein eigenes Konto, und die Rechte von Administratoren wären auf wenige Personen beschränkt.

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
Schätze den Schutzbedarf der vier Mitglieder von Wolkenwerk nach Vertraulichkeit, Integrität und Verfügbarkeit ein und begründe jede Stufe in einem Satz. Mach dasselbe für dein eigenes Mitglied aus Meilenstein 4.

:::solution
Eine mögliche Einschätzung ist die Praxis mit Vertraulichkeit sehr hoch, Integrität hoch und Verfügbarkeit normal, weil Gesundheitsdaten unter das Berufsgeheimnis fallen und die Praxis einen Ausfall von Stunden mit Papier überbrückt. Die Treuhand hat Vertraulichkeit hoch, Integrität sehr hoch und Verfügbarkeit hoch am Monatsende. Das Veloatelier hat Vertraulichkeit normal, Integrität normal und Verfügbarkeit hoch am Samstag. Die Gemeinde hat Vertraulichkeit hoch wegen Personendaten, Integrität hoch und Verfügbarkeit hoch zu den Schalterzeiten. Andere Stufen sind richtig, wenn die Begründung trägt.
:::
::::

::::exercise[Lab]
Härte dein Front-end, verschiebe das Passwort von Grafana in ein SealedSecret und setze das Profil `restricted` für alle Mitglieder. Zeige, dass ein Pod ohne Sicherheitsangaben abgewiesen wird.

:::solution
`ssh -o PubkeyAuthentication=no` scheitert, `systemctl is-active cc-firewall` zeigt `active`, und `kubectl get ns velo --show-labels` zeigt das Label `pod-security.kubernetes.io/enforce=restricted`. `kubectl -n velo run test --image=busybox -- sleep 5` endet mit `forbidden: violates PodSecurity`. Die ersten Prüfungen des Checks `operations` sind grün.
:::
::::

::::exercise[Images prüfen]
Für Schnelle. Prüfe das Image des Webshops mit Trivy auf bekannte Schwachstellen und überlege, wie die CI des Kursrepos ein Image mit kritischen Lücken stoppen könnte.

:::solution
`trivy image ghcr.io/ndum/cc/webshop:1.0.0` listet Schwachstellen der Pakete im Image mit ihrem Schweregrad. In der CI liefe derselbe Scan nach dem Bau, und `--exit-code 1 --severity CRITICAL` liesse den Job bei kritischen Funden scheitern. Ein kleines Basis-Image hat weniger Pakete und damit weniger Funde.
:::
::::
