---
title: Zusatzaufträge
description: Ein eigenes fünftes Mitglied mit Gruppe, VM, Namespace und Alert, der Cluster aus einem Snapshot mit einem SLA auf der gemessenen Zeit, ein Postmortem aus einem Entwurf des Modells und ein Kostenmodell für das Mitglied.
tableOfContents:
  maxHeadingLevel: 2
sidebar:
  order: 5
  badge:
    text: Zusatz
    variant: note
---

:::assignment
«Die fünfte Organisation will bei uns einsteigen», schreibt Simone Wyss. «Bringt sie bitte so auf unsere Plattform wie die anderen vier. Vor der Unterschrift will sie wissen, wie schnell wir nach einem schweren Fehler wieder laufen und was wir ihr zusagen. Geht bei ihr etwas schief, möchte der Vorstand einen ehrlichen Bericht. Beat Kläy fragt ausserdem, was sie uns kostet und welchen Preis wir verlangen sollen.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Ein neues Mitglied in OpenNebula und im Cluster aufnehmen
- Die Alerts eines Mitglieds an einen eigenen Dienst leiten und dessen Rechte begründen
- Den Cluster aus einem Snapshot von etcd wiederherstellen und die Zeit messen
- Ein SLA auf gemessene Zeiten und die Architektur stützen
- Die Zeitlinie eines Postmortems aus Daten aufbauen und den Entwurf eines Modells korrigieren
- Einen Preis für ein Mitglied aus den Vollkosten ableiten
:::

## Rahmen und Bewertung

Dieses Kapitel gibt dir keine Anleitung zum Nachbauen. Zu jedem Auftrag entwirfst du eine eigene Lösung, setzt sie in deinem Lab um und begründest deine Entscheide. Die Abschnitte vor den Aufträgen erklären die Konzepte und zeigen, wo du abwägen musst. Dabei gelten diese Bedingungen:

- Die Aufträge sind die Zusatzaufträge von [Meilenstein 4](../../assessment/milestone-4/) und bauen auf dem Stand deiner Basis auf
- Auftrag A setzt deinen Triage-Dienst aus Zusatzauftrag B von Meilenstein 3 voraus, wie ihn [Kapitel 5.5](../../observability/advanced/#triage-mit-freigabe-auftrag-b) beschreibt. Die Aufträge B und C bauen auf dem Mitglied aus Auftrag A auf.
- Für alle drei Aufträge zusammen rechnest du mit vier bis sechs Stunden
- Du zeigst sie live im Unterricht oder in einem Screencast von höchstens zehn Minuten, wie es der Meilenstein unter [Zusatzaufträge zeigen](../../assessment/milestone-4/#zusatzaufträge-zeigen) beschreibt. Dabei beantwortest du die zwei Fragen aus dem Check `m4`.
- Zu jedem Auftrag schreibst du eine Dokumentation in fünf Teilen, wie sie die [Leistungsbeurteilung](../../assessment/#dokumentation-der-zusatzaufträge) beschreibt
- Jeder Auftrag gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../../assessment/#stufen-der-zusatzaufträge), 3 Punkte nur mit einem eigenen Entscheid samt Alternative und Abwägung. Ohne Dokumentation gibt er höchstens 1 Punkt.
- KI-Assistenten setzt du nach den [Regeln des Kurses](../../start/overview/#ki-werkzeuge) ein. Jede Zeile deiner Lösung musst du in der Vorführung erklären können.

## Ein Mitglied entwerfen

Das fünfte Mitglied wählst du frei, eine kleine Organisation aus der Region mit einem Dienst auf einer VM und einer Anwendung im Cluster. Die Tabelle gibt einige Ideen.

| Idee | Was sie braucht |
|---|---|
| Kindertagesstätte | Anmeldungen mit Daten von Kindern, eine Website für Eltern |
| Musikschule | Stundenplan und Abrechnung, Spitzen zu Semesterbeginn |
| Physiotherapie | Termine und Behandlungsnotizen unter Berufsgeheimnis |
| Quartierverein | Website und Mitgliederliste, kleines Budget |
| Bäckerei mit Bestellungen | Bestellungen bis 18 Uhr, Spitzen vor Feiertagen |
| Architekturbüro | grosse Pläne, Backups wichtiger als Verfügbarkeit |

:::details[Schutzbedarf und die Grenzen des Labs]
Bevor du etwas anlegst, stufst du den Schutzbedarf des Mitglieds wie in [Kapitel 6.1](../security/#schutzbedarf) ein und begründest jede Stufe. Daraus folgen deine Entscheide zu Quota, Rechten des Triage-Dienstes, RPO und Preis. Das Lab setzt dabei zwei Grenzen:

- Die VM des Mitglieds hat höchstens 1 GB Arbeitsspeicher. Schon damit lagerte ein Knoten im Lab neben dem Server von k3s rund 200 MB auf die Disk aus.
- Die Anwendung im Cluster erfüllt das Profil `restricted`, das die Vorlage seit Kapitel 6.1 verlangt. Eine statische Website mit dem Image `nginxinc/nginx-unprivileged` genügt, eine kleine eigene App ebenso.
:::

## Ein Mitglied auf zwei Ebenen

Ein Mitglied gibt es auf beiden Ebenen der Plattform. Die Ebenen wissen nichts voneinander, nur die Namen und deine Dokumentation zeigen, dass Gruppe und Namespace zusammengehören.

| Ebene | Das Mitglied | Seine Grenze |
|---|---|---|
| OpenNebula | eine Gruppe mit Gruppenadmin in einem VDC und mit Preisen für den Showback | die Quota der Gruppe |
| Cluster | ein Ordner in `members/`, aus dem Argo CD einen Namespace mit LimitRange, NetworkPolicy und dem Profil `restricted` macht | die ResourceQuota im Namespace |

:::details[Wege zur Aufnahme, ein eigenes VDC und die Grösse der Quota]
Bei den vier Mitgliedern legte das Skript aus [Kapitel 3.1](../../tenants/groups/) die Gruppen an. Einen Namespace haben nur das Veloatelier aus der Vorlage des Repos und die Gemeinde mit ihrem Pull Request aus [Kapitel 4.5](../../platform/templates/#der-antrag-der-gemeinde). Beim fünften wählst du zwischen Handarbeit, einem eigenen Skript und Git. Ein Skript kostet beim ersten Mitglied mehr Zeit, hält aber jeden Schritt fest und lässt sich wiederverwenden. Ein eigenes VDC statt `wolkenwerk` kann dem Mitglied einen anderen Ausschnitt geben, etwa nur einen Knoten.

Beide Grenzen begründest du je für sich. Eine grosszügige Quota erspart dem Mitglied Anfragen beim Plattform-Team, zählt im Preismodell aus [Kapitel 6.4](../cost/#ein-preis-für-das-neue-mitglied) aber als reservierte Kapazität. Eine knappe Quota passt zu einem kleinen Budget, bremst aber eine Anwendung, die zu Spitzenzeiten wachsen muss.
:::

## Alerts für ein Mitglied

Die Regeln eines Mitglieds liegen als `PrometheusRule` in seinem Ordner im Plattform-Repo und kommen und gehen mit seinem Pull Request. Dank der Werte von kube-prometheus-stack aus Kapitel 5.1 liest Prometheus die Regeln aller Namespaces, ein besonderes Label braucht es nicht. Woran Alertmanager die Alerts für die Triage erkennt, entscheidest du, etwa am Namen, am Namespace oder an einem eigenen Label.

| Weg | Vorteil | Nachteil |
|---|---|---|
| Eine Route pro Mitglied | leicht zu lesen | bei jedem neuen Mitglied änderst du die Werte von Alertmanager |
| Ein gemeinsames Label für die Triage | die Route bleibt gleich, die Regeln der Mitglieder entscheiden | jede Regel für die Triage muss das Label tragen |

:::details[Symptome, Labels, Dauer und Routen von Alertmanager]
Ein guter Alert meldet ein Symptom, das die Kundschaft bemerkt, wie [Kapitel 5.3](../../observability/slo/#symptome-und-ursachen) erklärt. Bei einer kleinen Website genügt oft die Frage, ob noch ein Pod bereit ist. Die Metriken von kube-state-metrics liefern dazu die Labels `namespace` und `deployment`, aus denen dein Triage-Dienst sein Ziel ablesen kann. Labels wie `severity` setzt du selbst in der Alert-Regel. Mit einer zu kurzen Dauer in `for` meldet der Alert schon einen gewöhnlichen Neustart, mit einer zu langen kommt er spät.

Alertmanager reicht jeden Alert von der obersten Route an die erste Unterroute weiter, deren Matcher zu seinen Labels passen. Mit `continue` prüft er auch die folgenden Routen. In der Basis gibt es nur die oberste Route mit dem Empfänger `null`. `amtool config routes test` zeigt, welche Route ein Alert nimmt, wie das [README von Alertmanager](https://github.com/prometheus/alertmanager/blob/v0.34.2/README.md#amtool) beschreibt.
:::

## Rechte des Triage-Dienstes

Nach Meilenstein 3 darf dein Triage-Dienst nur, was er für den Webshop braucht. Was er beim neuen Mitglied lesen oder tun darf, legst du mit einer `Role` und einem `RoleBinding` in dessen Namespace fest. Diese Rechte gelten nur für die API von Kubernetes, nicht für die Logs in Loki.

| Rechte beim Mitglied | Folge |
|---|---|
| Keine Rechte, keine Logs | dem Modell fehlt der Kontext, sein Vorschlag bleibt allgemein |
| Leserechte | das Modell sieht mehr, auch Daten des Mitglieds, denn Logs können Personendaten enthalten |
| Neustart eines Deployments | ein falscher Vorschlag kann nach einer unbedachten Freigabe Schaden anrichten |

:::details[ClusterRole, Prüfung der Rechte und Zugriff auf Loki]
Eine `ClusterRole` mit `ClusterRoleBinding` gälte in allen Namespaces zugleich. [Kapitel 6.1](../security/#rechte-auf-der-plattform) erklärt die Rollen, `kubectl auth can-i` mit `--as` zeigt, was ein ServiceAccount wirklich darf.

Loki läuft im Lab mit `auth_enabled: false` und liefert jedem, der es erreicht, die Logs aller Namespaces. Ob dein Dienst die Logs des Mitglieds liest, regelst du deshalb im Dienst selbst und begründest es mit dem Schutzbedarf.
:::

## Wiederherstellung aus einem Snapshot

Ein **Snapshot** ist eine Kopie der ganzen Datenbank des Clusters zu einem Zeitpunkt, mit allen Objekten bis zu den Secrets, den Applications von Argo CD und dessen Passwort. Was Pods in Volumes schreiben, etwa Metriken und Logs, enthält er nicht. Ohne das Token des alten Servers ist er nutzlos, denn damit verschlüsselt k3s vertrauliche Daten in der Datenbank, wie die Seite [Backup and Restore](https://docs.k3s.io/datastore/backup-restore) von k3s beschreibt.

:::details[Zurücksetzen, verlorener Server, Neustart der Controller und Messwerte aus dem Lab]
Auf einem bestehenden Server setzt k3s die Datenbank mit `--cluster-reset` und `--cluster-reset-restore-path` auf einen Snapshot zurück. Der Server wird dabei zum einzigen Mitglied eines neuen etcd-Clusters. Ist der Server verloren, braucht ein neuer Server die Kopie des Snapshots und das alte Token. Die [Dokumentation der Snapshots](https://docs.k3s.io/cli/etcd-snapshot) beschreibt beide Fälle.

Controller wie Argo CD und der Operator von Prometheus merken sich den zuletzt gesehenen Stand, der nach dem Zurücksetzen nicht mehr stimmt. Im Lab des Kurses war die API 13 Sekunden nach dem Zurücksetzen mit dem zuvor gelöschten Namespace `argocd` und allen Applications zurück. Argo CD übernahm aber keine Commits mehr und der Operator meldete Fehler beim Beobachten, bis die Controller in `argocd` und `monitoring` und der Controller von Sealed Secrets neu gestartet waren. Diesen Neustart empfiehlt auch die [Dokumentation von Kubernetes](https://v1-36.docs.kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#restoring-an-etcd-cluster). Danach rollt Argo CD aus, was seit dem Snapshot in Git dazukam. Verloren ist, was nach dem Snapshot nur im Cluster entstand, etwa ein Secret aus `kubectl`. Bei Snapshots alle sechs Stunden ist das höchstens die Arbeit von sechs Stunden.
:::

## Die Zeit messen

Lege vor der Übung fest, wann die Uhr startet und wann sie stoppt. Im Lab des Kurses antwortete die API 13 Sekunden nach dem Zurücksetzen wieder. Diese Zeit misst aber nur die API. Für das Mitglied zählt, wann seine Anwendung läuft und Argo CD Änderungen aus Git übernimmt.

| Fall | Du brauchst | Im Lab des Kurses |
|---|---|---|
| Gelöschter Namespace | den Snapshot auf dem Server selbst | API nach 13 Sekunden zurück, danach Neustart der Controller |
| Verlorener Server | einen neuen Server, die Kopie des Snapshots auf dem Front-end und das Token | vom Zurücksetzen bis zur laufenden Anwendung des Mitglieds knapp eine Minute |

:::details[Reaktionszeit, Volumes des verlorenen Servers und Wahl des Falls]
Zum RTO gehört auch die Zeit, bis jemand den Ausfall bemerkt, reagiert und den passenden Snapshot wählt.

Die Volumes von local-path auf der Disk des verlorenen Servers blieben nur als Objekte ohne ihre Ordner zurück, ihre Pods warteten mit der Meldung «does not exist». Welchen Fall du übst, entscheidest du. Im SLA schreibst du, für welchen Fall deine Zeit gilt.
:::

## Ein SLA auf Messwerten

[Kapitel 6.3](../sla/) beschreibt die Teile eines SLA und die Verfügbarkeit, die das Lab ehrlich zulässt. Für dein Mitglied stützt du jede Zusage auf Messungen und Sicherungen.

- Das RTO folgt aus deiner Messung und den Betriebszeiten. Ohne Pikett wird ein Ausfall am Samstagabend erst am Montag behoben. Das SLA sagt deshalb, ob das RTO rund um die Uhr oder nur zu den Supportzeiten gilt.
- Das RPO folgt aus den Sicherungen, für den Cluster aus den Snapshots alle sechs Stunden, für die VM aus ihrem Backup-Job. Ohne Backup-Job kann das SLA für die Daten der VM kein RPO zusagen.
- Die Verfügbarkeit folgt aus der Architektur mit nur einem Front-end und einem Server von k3s. Eine höhere Zusage verlangt etwa einen Pikettdienst oder drei Server für k3s und erhöht den Preis aus Auftrag C.

:::details[Ein internes SLO, strenger als das SLA]
Intern setzt du das SLO strenger als das SLA, damit du ein Problem bemerkst, bevor die Zusage bricht. Das Kapitel [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) im SRE-Buch von Google erklärt den Unterschied.
:::

## Ein Postmortem aus Daten

Die Zeitlinie ist der wichtigste und mühsamste Teil eines Postmortems. Bei Wolkenwerk liegen ihre Fakten an drei Orten.

| Quelle | Was sie liefert |
|---|---|
| Zeitreihe `ALERTS` in Prometheus | Name und Zustand jedes Alerts in `pending` oder `firing`, daraus Beginn und Ende |
| Audit-Log deines Triage-Dienstes | Vorschläge und Entscheide |
| Verlauf des Plattform-Repos in Git | die Änderungen |

:::details[Programm und Modell, Entwürfe aus dem Lab und ihre Fehler]
Ein Programm fragt diese Quellen ab und ordnet sie nach der Zeit, ganz ohne Modell. Das Modell schreibt nur den Text darum herum, etwa Zusammenfassung, Auswirkung, Ursachen und Massnahmen. Eine gute Frage verlangt einen Bericht ohne Schuldzuweisung, der nur die gelieferten Fakten verwendet und Fehlendes als fehlend benennt. Mit der Option `format` antwortet Ollama in JSON oder nach einem JSON-Schema, passend für ein Dokument mit festen Abschnitten.

Im Lab des Kurses stand über Git `FAIL_PERCENT` auf 60 wie beim Vorfall in Kapitel 5.3. Das Modell `llama3.2:3b` schrieb den Entwurf in 33 Sekunden. Die Zeitlinie aus dem Programm stimmte, der Entwurf enthielt dagegen mehrere Fehler.

- Er gab etwa eine Stunde Ausfall an, die Fehler dauerten rund zehn Minuten
- Er machte den Umbau auf etcd für eine Verzögerung der Snapshots verantwortlich, die es nie gab
- Er lobte denselben Umbau ohne einen Fakt als Gewinn an Stabilität
- Er erfand Verantwortliche wie «Teamleiter A» und schrieb Massnahmen unter «Was schlecht lief»
- Die richtige Ursache übernahm er aus dem Vorschlag des Triage-Dienstes

Ein zweiter Entwurf über eine halbe Stunde nannte 13 Minuten Auswirkung und schrieb gleich danach, die Benutzer hätten keine Ausfälle bemerkt, obwohl 60 % der Anfragen scheiterten. Weil ein Entwurf auch mit falschen Aussagen fertig aussieht, prüft deine Korrektur jede Zahl, jede Ursache und jede genannte Person gegen die Zeitlinie.
:::

## Das Kostenmodell eines Mitglieds

In [Kapitel 6.4](../cost/) kostete ein Mitglied mit einem Namespace von 1 CPU und 1 GB und einer VM mit einer halben CPU und 1 GB rund 233 Franken im Monat, 16,3 % der Vollkosten von 17’128 Franken im Jahr. Nach den Preisen des Showbacks aus Kapitel 3.3 waren es rund 86 Franken, vor allem weil dort die Arbeit des Plattform-Teams fehlt.

Für dein Mitglied wählst du die Verteilung und begründest deine Annahmen.

| Verteilung | Eigenschaft |
|---|---|
| Nach Reservierung | einfach und planbar, eine grosszügige Quota wird aber teuer |
| Nach gemessenem Verbrauch | folgt dem tatsächlichen Gebrauch, schwankt aber von Monat zu Monat und braucht Messwerte über längere Zeit |
| Grundbeitrag und Anteil nach Verbrauch | der Grundbeitrag deckt die Arbeit, der Verbrauch kommt nach Showback dazu |

:::details[Backups, Right-Sizing und Messwerte aus dem Lab]
Backups im Backup-Datastore gehören in die Rechnung, wenn das Mitglied viele oder grosse davon hat. Für das Right-Sizing vergleichst du Requests und Quota deines Mitglieds mit dem Verbrauch aus den Abfragen von [Kapitel 6.4](../cost/#right-sizing). Im Lab des Kurses reservierte das Mitglied `probe` 64 MiB Speicher und nutzte höchstens 21 MiB.
:::

## Ein eigenes Mitglied (Auftrag A)

Du nimmst ein fünftes Mitglied, das du selbst entworfen hast, auf beiden Ebenen deiner Plattform auf und überwachst seine Anwendung. Ihr Alert erreicht deinen Triage-Dienst aus Meilenstein 3, du entscheidest über dessen Vorschlag und behebst den Fehler über Git.

![Ein fünftes Mitglied auf beiden Ebenen. Oben die Ebene OpenNebula. Dort hat das neue Mitglied eine VM für seinen Dienst, eine Quota mit Preisen für den Showback und eine Gruppe mit Admin in einem VDC. Darunter der Cluster k3s mit dem Namespace des Mitglieds, in dem seine Anwendung und seine Alert-Regel liegen. Gruppe und Namespace wissen nichts voneinander, nur derselbe Name verbindet sie. Du bringst einen Pull Request und Commits nach Gitea. Argo CD holt sie dort mit dem ApplicationSet members und rollt sie im Namespace aus. Prometheus überwacht die Anwendung. Löst die Regel aus, schickt Prometheus einen Alert an Alertmanager, dessen Route ihn als Webhook an deinen Triage-Dienst weiterleitet. Was der Dienst im Namespace des Mitglieds darf, legst du selbst fest. Er legt dir einen Vorschlag vor und hält deinen Entscheid in seinem Audit-Log fest. Den Fehler löst du über Git aus und behebst ihn auch dort.](../../../assets/figures/de/p6c5-member.svg)

| Ausgangslage | Ergebnis |
|---|---|
| Aus der Basis hast du die Gruppen `praxis`, `treuhand`, `velo` und `gemeinde` der vier Mitglieder im VDC `wolkenwerk`, die Vorlage `ubuntu` und das Netz `cc-net`. Das ApplicationSet `members` aus Kapitel 4.5 macht aus jedem Ordner unter `members` im Repo `wolkenwerk/platform` einen Namespace nach der Vorlage `templates/member`, die seit Kapitel 6.1 das Profil `restricted` verlangt. Dein Triage-Dienst aus Zusatzauftrag B von Meilenstein 3 läuft mit seinem Audit-Log, seine Route und sein Empfänger stehen in den Werten von kube-prometheus-stack. | In OpenNebula gibt es dein fünftes Mitglied als Gruppe mit Admin in einem VDC, mit Quota, Preisen für den Showback und einer laufenden VM. Im Cluster läuft seine Anwendung in einem eigenen Namespace, eine Alert-Regel in seinem Ordner überwacht sie. Einen Vorfall hast du über Git ausgelöst und behoben, das Audit-Log deines Triage-Dienstes zeigt den Vorschlag und deinen Entscheid dazu. |

### Vorgehen

1. Entwirf das Mitglied mit seinem Dienst und stufe seinen Schutzbedarf ein.
2. Lege das Mitglied in OpenNebula mit Gruppe, Admin, Quota und Preisen an und starte seine VM.
3. Beantrage seinen Namespace mit der Anwendung über einen Pull Request in Gitea und nimm ihn an.
4. Ergänze eine Alert-Regel im Ordner des Mitglieds und leite ihren Alert an deinen Triage-Dienst weiter.
5. Lege fest, was dein Triage-Dienst im Namespace des Mitglieds lesen und tun darf.
6. Löse den Alert über Git aus, entscheide über den Vorschlag und behebe den Fehler über Git.
7. Halte Werte, Zeiten und deine Entscheide mit ihren Alternativen für die Dokumentation fest.

### Anforderungen

1. Eine kurze Beschreibung nennt das Mitglied, seinen Dienst und seinen Schutzbedarf mit Begründung.
2. In OpenNebula hat das Mitglied eine Gruppe mit Admin in einem VDC, eine Quota, Preise für den Showback und eine laufende VM mit höchstens 1 GB Arbeitsspeicher.
3. Sein Namespace entsteht aus der Vorlage über einen zusammengeführten Pull Request in Gitea. Argo CD rollt seine Anwendung aus, sie erfüllt das Profil `restricted`.
4. Eine Alert-Regel im Ordner des Mitglieds überwacht die Anwendung. Alertmanager leitet ihren Alert an deinen Triage-Dienst weiter.
5. Du hast den Alert über Git ausgelöst, über den Vorschlag entschieden und den Fehler über Git behoben. Das Audit-Log zeigt Vorschlag und Entscheid.

### Vorführung

- Gruppe, Quota und laufende VM des Mitglieds in Sunstone oder in der CLI
- Den Pull Request in Gitea und die gesunde Application in Argo CD
- Den Alert in Alertmanager, den Vorschlag deines Triage-Dienstes und deinen Entscheid im Audit-Log
- Mit `kubectl auth can-i`, was dein Triage-Dienst im Namespace des Mitglieds darf

:::details[Hinweise aus dem Lab]
- Den Alert löst du über Git aus, etwa mit null Replikas oder einem Image, das es nicht gibt
- Im Lab des Kurses kam der Alert zwei Minuten, nachdem der letzte Pod weg war
- Der Triage-Dienst schlug dort einen Neustart vor. Das Team lehnte ab, denn solange Git null Replikas verlangt, startet auch ein Neustart keinen Pod.
- Argo CD stellt immer wieder den Zustand aus Git her, behoben ist die Störung erst mit dem richtigen Stand in Git
:::

:::details[Quellen]
- [Kapitel 3.1](../../tenants/groups/) zu Gruppen, Gruppenadmins und VDCs, [Kapitel 3.2](../../tenants/quotas/) zu Quotas und [Kapitel 3.3](../../tenants/showback/) zu den Preisen
- Die Dokumentation von OpenNebula 7.4 zu [Gruppen](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/manage_groups/), [VDCs](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/manage_vdcs/), [Quotas](https://docs.opennebula.io/7.4/product/cloud_system_administration/capacity_planning/quotas/) und zum [Showback](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/)
- [Kapitel 4.5](../../platform/templates/#der-antrag-der-gemeinde) mit dem Weg eines Namespace über einen Pull Request
- [Kapitel 6.1](../security/#pod-security-admission) und die [Pod Security Standards](https://v1-36.docs.kubernetes.io/docs/concepts/security/pod-security-standards/) von Kubernetes 1.36 zum Profil `restricted`
- [Kapitel 5.3](../../observability/slo/) und die Anleitung des Prometheus Operator 0.94 zu [Regeln](https://github.com/prometheus-operator/prometheus-operator/blob/v0.94.2/Documentation/developer/alerting.md#deploying-prometheus-rules) für die Alert-Regel
- Die [Konfiguration von Alertmanager 0.34](https://prometheus.io/docs/alerting/0.34/configuration/#route), der Version in kube-prometheus-stack 92.17.0, zu `route`, Matchern und `webhook_config`
- Die [Dokumentation zu RBAC](https://v1-36.docs.kubernetes.io/docs/reference/access-authn-authz/rbac/) zu Rollen und Bindungen
:::

## Cluster wiederherstellen und SLA (Auftrag B)

Du stellst den Cluster aus einem Snapshot von etcd wieder her und misst die Zeit, bis die Plattform für dein Mitglied wieder läuft. Auf diese Zeit und die Architektur deines Labs stützt du ein SLA für das Mitglied.

![Wiederherstellung aus einem Snapshot und SLA. Oben das Front-end mit der Kopie der Snapshots und des Tokens in ~/backup/k3s und mit Gitea. Darunter der Cluster k3s. Aus der Kopie stellst du k3s-server wieder her, je nach Fehlerfall den bestehenden Server oder einen neuen. Danach holt Argo CD wieder Commits aus Gitea und rollt die Anwendung deines Mitglieds aus. Unten links deine Messung für den Fehlerfall, den du gewählt hast, auf einer Zeitachse. Start und Ende legst du selbst fest, dazwischen hältst du Zwischenzeiten fest. Die gemessene Zeit geht in das SLA für dein Mitglied ein. Darin folgt die Verfügbarkeit aus der Architektur, das RPO aus den Sicherungen und das RTO aus deiner Messung und den Supportzeiten.](../../../assets/figures/de/p6c5-restore.svg)

| Ausgangslage | Ergebnis |
|---|---|
| Seit Kapitel 6.2 läuft dein Cluster mit etcd, auf `k3s-server` entsteht alle sechs Stunden ein Snapshot. Ein Timer kopiert die Snapshots mit dem Token und dem Schlüssel von Sealed Secrets nach `~/backup/k3s` auf dem Front-end. Die Anwendung deines Mitglieds aus Auftrag A läuft, Argo CD rollt sie aus dem Repo `wolkenwerk/platform` aus. | Der Cluster läuft wieder aus einem Snapshot dieser Kopie, Argo CD übernimmt neue Commits und die Anwendung deines Mitglieds ist zurück. Deine Messung hält Start, Ende und Zwischenzeiten fest. Ein SLA für das Mitglied stützt Verfügbarkeit, Supportzeiten, RPO und RTO auf diese Messung, auf deine Sicherungen und auf die Architektur deines Labs. |

### Vorgehen

1. Wähle einen Fehlerfall und lege fest, wann deine Messung beginnt und wann sie endet.
2. Sichere vorher das Audit-Log aus Auftrag A, halte den Timer aus Kapitel 6.2 an und lege in smartlearn oder in deinem Hypervisor einen Snapshot der drei Server an.
3. Löse den Fehlerfall aus und stelle den Cluster mit einem Snapshot aus der Kopie auf dem Front-end wieder her.
4. Prüfe, dass Argo CD wieder neue Commits übernimmt und die Anwendung deines Mitglieds läuft.
5. Schreibe das SLA für dein Mitglied und begründe Verfügbarkeit, RPO und RTO.
6. Halte die Zeiten, den verwendeten Snapshot und deinen Entscheid mit seiner Alternative für die Dokumentation fest.

:::caution[Vor der Wiederherstellung]
Ein Snapshot von etcd bringt keine Daten aus Volumes zurück. Kopiere deshalb vorher das Audit-Log deines Triage-Dienstes aus Auftrag A in dein Abgabe-Repo. Lege zudem in smartlearn oder in deinem Hypervisor einen Snapshot der drei Server an, damit du bei einem Fehlschlag zurückkannst. Halte ausserdem den Timer aus Kapitel 6.2 mit `sudo systemctl stop cc-backup-k3s.timer` an. Läuft die Kopie gegen einen neuen Server, überschreibt sie in `~/backup/k3s` das Token des alten Servers, das die Wiederherstellung braucht. Nach der Wiederherstellung startest du den Timer mit `sudo systemctl start cc-backup-k3s.timer` wieder.
:::

### Anforderungen

1. Du hast einen Fehlerfall gewählt und den Cluster mit einem Snapshot aus der Kopie auf dem Front-end wiederhergestellt.
2. Start und Ende deiner Messung sind festgelegt, die gemessenen Zeiten sind festgehalten.
3. Nach der Wiederherstellung übernimmt Argo CD wieder neue Commits und die Anwendung deines Mitglieds läuft.
4. Das SLA nennt den Dienst, die Verfügbarkeit mit Zeitraum und Ausnahmen, die Supportzeiten, RPO und RTO.
5. Verfügbarkeit, RPO und RTO sind mit deiner Messung, deinen Sicherungen und der Architektur des Labs begründet.

### Vorführung

- Den verwendeten Snapshot und seine Kopie auf dem Front-end
- Deine Messung mit Start, Ende und Zwischenzeiten
- Einen Commit, den Argo CD nach der Wiederherstellung übernommen hat
- Das SLA und die Begründung von RPO und RTO

:::details[Hinweise aus dem Lab]
- Die Wiederherstellung darfst du vor der Vorführung machen. Dort zeigst du sie an ihren Spuren, etwa am Snapshot, an deinen Zeiten und am Zustand danach.
- Als `tofu apply` im Lab einen verlorenen Server ersetzte, wartete die neue VM zehn Minuten in `pending`. Wie beim Neubau in Kapitel 6.2 kannte OpenNebula für die Disk des Knotens noch den alten Wert.
- Einen eigenen Snapshot hat ein neuer Server erst wieder, wenn k3s den nächsten nach Zeitplan schreibt
:::

:::details[Quellen]
- [Kapitel 6.2](../backup/#snapshots-sichern) zu den Snapshots, ihrer Kopie und dem Token
- Die [Dokumentation der Snapshots](https://docs.k3s.io/cli/etcd-snapshot) von k3s zur Wiederherstellung auf einem bestehenden Server und auf neuen Hosts
- [Kapitel 6.3](../sla/) mit den Teilen eines SLA und der Tabelle der Ausfallzeiten, [Kapitel 6.2](../backup/#rpo-und-rto) mit RPO und RTO
- Das Kapitel [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) im SRE-Buch, das erklärt, warum ein internes SLO strenger sein soll als das SLA
:::

## Postmortem und Kostenmodell (Auftrag C)

Zum Vorfall aus Auftrag A schreibt das lokale Modell einen Entwurf des Postmortems aus einer Zeitlinie, die du ohne Modell aus den Daten aufbaust. Du korrigierst den Entwurf und rechnest dazu ein Kostenmodell für dein Mitglied.

![Postmortem und Kostenmodell eines Mitglieds. Oben das Postmortem. Drei Quellen, die Zeitreihe ALERTS, das Audit-Log des Triage-Dienstes und der Verlauf des Plattform-Repos, ergeben ohne Modell eine nach der Zeit geordnete Zeitlinie. Mit deiner Frage und der Zeitlinie schreibt das lokale Modell aus Meilenstein 3 den Entwurf postmortem-entwurf.md. Du prüfst ihn gegen die Fakten der Zeitlinie und hältst deine Korrektur in postmortem.md fest. Unten das Kostenmodell. Aus den Ressourcen des Mitglieds, seiner Quota und seiner VM, leitest du über seinen Anteil an den Vollkosten einen Preis pro Monat ab. Die Verteilung wählst du selbst. Den Preis vergleichst du mit dem Showback aus OpenNebula. Aus gemessenen Requests und gemessenem Verbrauch entsteht dein Vorschlag zum Right-Sizing.](../../../assets/figures/de/p6c5-postmortem.svg)

| Ausgangslage | Ergebnis |
|---|---|
| Der Vorfall aus Auftrag A hat Spuren an drei Orten hinterlassen, als Alert in der Zeitreihe `ALERTS` von Prometheus, als Einträge im Audit-Log deines Triage-Dienstes und als Commits im Repo `wolkenwerk/platform`. Das lokale Modell aus Zusatzauftrag A von Meilenstein 3 erreichst du vom Front-end aus. Die Vollkosten von Wolkenwerk stehen in Kapitel 6.4, die Preise für den Showback deines Mitglieds hast du in Auftrag A gesetzt. | Es gibt eine Zeitlinie des Vorfalls, die ohne Modell aus diesen Daten entstanden ist, den Entwurf `postmortem-entwurf.md` des Modells und deine korrigierte Fassung `postmortem.md`. Dazu kommt ein Kostenmodell mit einem Preis pro Monat für dein Mitglied, dem Vergleich mit seinem Showback und einem Vorschlag zum Right-Sizing aus Messwerten. |

### Vorgehen

1. Sammle die Fakten des Vorfalls aus Alerts, Audit-Log und Git und ordne sie ohne Modell zu einer Zeitlinie.
2. Formuliere deine Frage an das Modell und lass es aus der Zeitlinie einen Entwurf des Postmortems schreiben.
3. Prüfe den Entwurf gegen die Zeitlinie und halte deine Korrektur in einer eigenen Datei fest.
4. Bestimme die Ressourcen deines Mitglieds, wähle eine Verteilung der Vollkosten und leite einen Preis pro Monat ab.
5. Vergleiche den Preis mit dem Showback deines Mitglieds aus OpenNebula.
6. Miss Requests und Verbrauch deines Mitglieds über längere Zeit und leite daraus einen Vorschlag zum Right-Sizing ab.
7. Halte Werte, Annahmen und deinen Entscheid mit seiner Alternative für die Dokumentation fest.

### Anforderungen

1. Die Zeitlinie des Vorfalls entsteht ohne Modell aus Alerts, Audit-Log und Git.
2. Das lokale Modell schreibt daraus den Entwurf `postmortem-entwurf.md`. Deine Frage an das Modell verlangt einen Bericht ohne Schuldzuweisung, der nur die gelieferten Fakten verwendet.
3. `postmortem.md` ist deine korrigierte Fassung und hält fest, was im Entwurf stimmte, was falsch war und was du geändert hast.
4. Das Kostenmodell nennt die Ressourcen des Mitglieds, seinen Anteil an den Vollkosten und einen Preis pro Monat. Es vergleicht den Preis mit dem Showback des Mitglieds aus OpenNebula.
5. Ein Vorschlag zum Right-Sizing stützt sich auf gemessene Requests und gemessenen Verbrauch.

### Vorführung

- Die Zeitlinie mit der Quelle jedes Eintrags
- Den Entwurf des Modells neben deiner Korrektur mit zwei Stellen, die du geändert hast
- Das Kostenmodell und den Showback deines Mitglieds für einen Monat
- Deinen Vorschlag zum Right-Sizing mit den Messwerten

:::details[Hinweise aus dem Lab]
- `Watchdog` löst immer aus und zeigt nur, dass die Alarmierung läuft. Er gehört nicht in die Zeitlinie, ebenso wenig `InfoInhibitor`, der nur Alerts der Stufe info unterdrückt.
- Für einen Entscheid zum Right-Sizing misst du länger als eine Stunde, mindestens einen Tag mit typischer Last
- Entwurf und Korrektur bleiben als zwei Dateien erhalten, damit man sieht, was du geändert hast
:::

:::details[Quellen]
- [Kapitel 6.3](../sla/#postmortems) zu Postmortems ohne Schuldzuweisung und das Kapitel [Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) des SRE-Buchs von Google
- Ein [Beispiel](https://sre.google/sre-book/example-postmortem/) im selben Buch mit einem vollständigen Aufbau samt Zeitlinie
- Die [Dokumentation von Prometheus 3.15](https://prometheus.io/docs/prometheus/3.15/configuration/alerting_rules/#inspecting-alerts-during-runtime) zur Zeitreihe `ALERTS`
- Die [Schnittstelle von Ollama 0.40.13](https://github.com/ollama/ollama/blob/v0.40.13/docs/api.md) mit der Option `format`
- [Zusatzauftrag A von Meilenstein 3](../../observability/advanced/#ein-lokales-sprachmodell-auftrag-a), denn das Modell erreichst du vom Front-end aus so, wie du es dort bereitgestellt hast
- [Kapitel 6.4](../cost/) zu den Vollkosten und Abfragen und [Kapitel 3.3](../../tenants/showback/#kosten-berechnen) zum Showback mit `oneshowback`
- [Invoicing and Chargeback](https://www.finops.org/framework/capabilities/invoicing-chargeback/) der FinOps Foundation zu Showback und Chargeback
:::
