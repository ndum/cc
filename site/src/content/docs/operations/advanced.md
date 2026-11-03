---
title: Zusatzaufträge
description: Ein eigenes fünftes Mitglied mit Gruppe, VM, Namespace und Alert, der Cluster aus einem Snapshot mit einem SLA auf der gemessenen Zeit, ein Postmortem aus einem Entwurf des Modells und ein Kostenmodell für das Mitglied.
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

## Rahmen

Die drei Aufträge geben Ziel und Anforderungen vor, den Weg dorthin entwirfst du selbst. Du baust auf dem Stand deiner Basis von Meilenstein 4 auf. Die Abschnitte vor den Aufträgen erklären die Konzepte und zeigen, wo du abwägen musst. Befehle und Dateien findest du in der Dokumentation und in den Kapiteln, auf die die Hinweise zeigen.

Für alle drei Aufträge rechnest du mit vier bis sechs Stunden. Du zeigst sie gemeinsam live im Unterricht oder in einem Screencast, wie es die Seite [Meilenstein 4](../../assessment/milestone-4/#zusatzaufträge-zeigen) beschreibt. Dabei beantwortest du die zwei Fragen aus dem Check `m4`. Zu jedem Auftrag schreibst du eine Dokumentation, ihre Teile nennt die [Leistungsbeurteilung](../../assessment/#dokumentation-der-zusatzaufträge). KI-Assistenten darfst du nach den [Regeln des Kurses](../../start/overview/#ki-werkzeuge) einsetzen. In der Dokumentation hältst du fest, wofür du sie gebraucht hast. Erklären musst du alles können, was du zeigst.

Jeder Auftrag gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../../assessment/#stufen-der-zusatzaufträge). Für 3 Punkte begründest du einen eigenen Entscheid mit einer Alternative und einer Abwägung. Die Abschnitte unten nennen dafür einige Gelegenheiten.

Auftrag A setzt deinen Triage-Dienst aus Zusatzauftrag B von Meilenstein 3 voraus, den [Kapitel 5.5](../../observability/advanced/#auftrag-b--triage-mit-freigabe) beschreibt. Die Aufträge B und C bauen auf dem Mitglied aus Auftrag A auf.

## Ein Mitglied entwerfen

Das fünfte Mitglied wählst du frei. Es soll eine kleine Organisation aus der Region sein, die zu einer Genossenschaft wie Wolkenwerk passt. Sie hat einen Dienst auf einer VM und eine Anwendung im Cluster. Die Tabelle gibt einige Ideen, falls dir keine eigene kommt.

| Idee | Was sie braucht |
|---|---|
| Kindertagesstätte | Anmeldungen mit Daten von Kindern, eine Website für Eltern |
| Musikschule | Stundenplan und Abrechnung, Spitzen zu Semesterbeginn |
| Physiotherapie | Termine und Behandlungsnotizen unter Berufsgeheimnis |
| Quartierverein | Website und Mitgliederliste, kleines Budget |
| Bäckerei mit Bestellungen | Bestellungen bis 18 Uhr, Spitzen vor Feiertagen |
| Architekturbüro | grosse Pläne, Backups wichtiger als Verfügbarkeit |

Bevor du etwas anlegst, schätzt du den Schutzbedarf ein. Wie in [Kapitel 6.1](../security/#schutzbedarf) stufst du Vertraulichkeit, Integrität und Verfügbarkeit ein und begründest jede Stufe. Daraus folgen die späteren Entscheide, etwa die Grösse der Quota, die Rechte des Triage-Dienstes, das RPO im SLA und der Preis. Eine Physiotherapie mit Notizen unter Berufsgeheimnis braucht andere Antworten als ein Quartierverein mit einer öffentlichen Website.

Zwei Grenzen setzt das Lab. Die Knoten haben neben den VMs von k3s wenig Arbeitsspeicher frei, die VM des Mitglieds hat darum höchstens 1 GB. Im Lab lief eine VM mit 1 GB neben dem Server von k3s, der Knoten lagerte dafür rund 200 MB auf die Disk aus. Die Anwendung im Cluster muss das Profil `restricted` erfüllen, das die Vorlage seit Kapitel 6.1 in jedem Namespace eines Mitglieds verlangt. Eine statische Website mit dem Image `nginxinc/nginx-unprivileged` genügt, eine kleine eigene App ebenso.

## Ein Mitglied auf zwei Ebenen

Ein Mitglied gibt es auf beiden Ebenen der Plattform. In OpenNebula ist es eine Gruppe mit einem Gruppenadmin in einem VDC, mit einer Quota und mit Preisen für den Showback. Im Cluster ist es ein Ordner in `members/`, aus dem Argo CD einen Namespace mit ResourceQuota, LimitRange, NetworkPolicy und dem Profil `restricted` macht. Voneinander wissen die beiden Ebenen nichts. Dass Gruppe und Namespace zum selben Mitglied gehören, zeigen nur die Namen und deine Dokumentation.

Bei den vier Mitgliedern haben das Skript aus [Kapitel 3.1](../../tenants/groups/) und die Pull Requests aus [Kapitel 4.5](../../platform/templates/#der-antrag-der-gemeinde) diese Arbeit erledigt. Beim fünften legst du selbst fest, in welcher Reihenfolge du vorgehst und was du von Hand, mit einem eigenen Skript oder über Git erledigst. Ein Skript kostet beim ersten Mitglied mehr Zeit, hält aber jeden Schritt fest und lässt sich beim nächsten wiederverwenden. Auch das VDC ist ein Entscheid. Im VDC `wolkenwerk` teilt das neue Mitglied den Cluster mit den anderen vier. Ein eigenes VDC kann ihm einen anderen Ausschnitt zuteilen, etwa nur einen Knoten.

Bei den Grenzen wägst du ab. Eine grosszügige Quota erspart dem Mitglied Anfragen beim Plattform-Team. Im Preismodell aus [Kapitel 6.4](../cost/#ein-preis-für-das-neue-mitglied) zählt sie aber als reservierte Kapazität und macht das Mitglied teurer. Eine knappe Quota passt zu einem kleinen Budget, bremst aber eine Anwendung, die zu Spitzenzeiten wachsen muss. Die Quota in OpenNebula und die ResourceQuota im Cluster sind zwei getrennte Grenzen, die du je für sich begründest.

## Alerts für ein Mitglied

Die Regeln eines Mitglieds gehören als `PrometheusRule` in seinen Ordner im Plattform-Repo. Sie kommen dann mit dem Pull Request des Mitglieds und verschwinden mit ihm. Die Werte von kube-prometheus-stack aus Kapitel 5.1 lassen Prometheus die Regeln aller Namespaces lesen, ein besonderes Label für den Selektor brauchst du deshalb nicht.

Ein guter Alert meldet ein Symptom, das die Kundschaft des Mitglieds bemerkt, wie [Kapitel 5.3](../../observability/slo/#symptome-und-ursachen) erklärt. Bei einer kleinen Website genügt oft die Frage, ob noch ein Pod bereit ist. Die Metriken von kube-state-metrics beschreiben dafür jedes Deployment. Die Dauer in `for` legt fest, wie lange die Bedingung gelten muss, bevor der Alert auslöst. Ist sie zu kurz, meldet der Alert schon einen gewöhnlichen Neustart. Ist sie zu lang, kommt die Meldung spät.

Die Labels eines Alerts tragen, was ein Empfänger wissen muss. Metriken zu einem Deployment bringen `namespace` und `deployment` mit, daraus kann dein Triage-Dienst sein Ziel ablesen. Weitere Labels wie `severity` setzt du selbst in der Alert-Regel.

Alertmanager leitet Alerts über einen Baum von Routen weiter. Jeder Alert beginnt bei der obersten Route. Die erste Unterroute, deren Matcher zu seinen Labels passen, übernimmt ihn. Mit `continue` prüft Alertmanager auch die folgenden Routen. In der Basis gibt es nur die oberste Route mit dem Empfänger `null`. Für dein Mitglied entscheidest du, woran Alertmanager die Alerts für die Triage erkennt, etwa am Namen des Alerts, am Namespace oder an einem eigenen Label, das jede Regel für die Triage trägt. Eine Route pro Mitglied liest sich leicht. Dafür änderst du bei jedem neuen Mitglied die Werte von Alertmanager. Mit einem gemeinsamen Label entscheiden die Regeln der Mitglieder selbst und die Route bleibt gleich. Welche Route ein Alert mit bestimmten Labels nimmt, zeigt `amtool config routes test`, wie das [README von Alertmanager](https://github.com/prometheus/alertmanager/blob/v0.34.2/README.md#amtool) beschreibt.

Den Alert löst du über Git aus, etwa mit null Replikas oder einem Image, das es nicht gibt. Im Lab des Kurses kam der Alert zwei Minuten, nachdem der letzte Pod weg war. Der Triage-Dienst schlug einen Neustart vor. Das Team lehnte ab, denn solange Git null Replikas verlangt, startet auch ein Neustart keinen Pod. Argo CD stellt immer wieder den Zustand aus Git her, behoben ist die Störung erst mit dem richtigen Stand in Git.

## Rechte des Triage-Dienstes

Nach den Anforderungen von Meilenstein 3 hat dein Triage-Dienst nur die Rechte, die er für den Webshop braucht. Für das neue Mitglied entscheidest du, ob er dort etwas lesen oder tun darf. In Kubernetes ist das eine `Role` mit `RoleBinding` im Namespace des Mitglieds. Eine `ClusterRole` mit `ClusterRoleBinding` gälte dagegen in allen Namespaces zugleich. [Kapitel 6.1](../security/#rechte-auf-der-plattform) erklärt die Rollen. Mit `kubectl auth can-i` und `--as` prüfst du, was ein ServiceAccount wirklich darf.

Die Rechte in Kubernetes gelten nur für Anfragen an die API von Kubernetes. Logs, die dein Dienst aus Loki holt, schützen sie nicht. Loki läuft im Lab mit `auth_enabled: false` und liefert jedem, der es erreicht, die Logs aller Namespaces. Ob dein Dienst die Logs des neuen Mitglieds liest, legst du deshalb im Dienst selbst fest.

Die Abwägung hängt vom Schutzbedarf ab. Ohne Rechte und ohne Logs fehlt dem Modell der Kontext, sein Vorschlag bleibt allgemein. Mit Leserechten sieht es mehr, aber auch Daten des Mitglieds, denn Logs können Personendaten enthalten. Mit dem Recht, ein Deployment neu zu starten, kann ein falscher Vorschlag nach einer unbedachten Freigabe Schaden anrichten. Was dein Dienst beim Mitglied darf, legst du fest und begründest es mit dessen Einstufung.

## Wiederherstellung aus einem Snapshot

In der Basis hast du den Cluster auf etcd umgestellt und die Snapshots mit dem Token und dem Schlüssel von Sealed Secrets auf das Front-end kopiert. Ein Snapshot ist eine Kopie der ganzen Datenbank des Clusters zu einem Zeitpunkt. Er enthält alle Objekte, auch die Secrets, die Applications von Argo CD und dessen Passwort. Die Daten in den Volumes enthält er nicht. Metriken, Logs und alles andere, was Pods auf eine Disk schreiben, liegen ausserhalb der Datenbank.

Ohne das Token des alten Servers lässt sich ein Snapshot nicht verwenden. Mit dem Token verschlüsselt k3s vertrauliche Daten in der Datenbank, wie die Seite [Backup and Restore](https://docs.k3s.io/datastore/backup-restore) von k3s beschreibt. Darum liegt es mit den Snapshots auf dem Front-end.

Auf einem einzelnen Server setzt k3s die Datenbank mit den Optionen `--cluster-reset` und `--cluster-reset-restore-path` auf einen Snapshot zurück. Der Server wird dabei zum einzigen Mitglied eines neuen etcd-Clusters mit dem Inhalt des Snapshots. Ist der Server selbst verloren, braucht ein neuer Server die Kopie des Snapshots und das alte Token. Die [Dokumentation der Snapshots](https://docs.k3s.io/cli/etcd-snapshot) beschreibt beide Fälle.

Controller wie Argo CD und der Operator von Prometheus beobachten den Cluster laufend und merken sich den Stand, den sie zuletzt gesehen haben. Nach dem Zurücksetzen passt dieser Stand nicht mehr zur Datenbank. Im Lab des Kurses löschte eine Übung den Namespace `argocd`. Die API war 13 Sekunden nach dem Zurücksetzen wieder da, mit dem Namespace und allen Applications. Danach übernahm Argo CD aber keinen neuen Commit mehr und der Operator meldete Fehler beim Beobachten. Ein Neustart der Controller in `argocd` und `monitoring` sowie des Controllers von Sealed Secrets behob beides. Auch die [Dokumentation von Kubernetes](https://v1-36.docs.kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#restoring-an-etcd-cluster) empfiehlt nach einer Wiederherstellung von etcd, die Komponenten neu zu starten, damit sie nicht mit veralteten Daten arbeiten.

Läuft Argo CD wieder, gleicht es den Cluster mit Git ab. Was seit dem Snapshot in Git dazukam, rollt es dabei wieder aus. Verloren ist, was nur im Cluster lag und nach dem Snapshot entstand, etwa ein Secret, das jemand mit `kubectl` angelegt hat. Mit Snapshots alle sechs Stunden geht im schlimmsten Fall die Arbeit von sechs Stunden verloren.

## Die Zeit messen

Lege vor der Übung fest, wann die Uhr startet und wann sie stoppt. Die 13 Sekunden aus dem Lab messen nur, bis die API wieder antwortete. Für das Mitglied zählt, wann seine Anwendung wieder erreichbar ist und Argo CD Änderungen aus Git übernimmt. Zum RTO gehört auch die Zeit davor. Jemand muss den Ausfall bemerken, die zuständige Person muss reagieren und den passenden Snapshot wählen.

Ein gelöschter Namespace ist ein anderer Fall als ein verlorener Server. Im ersten genügt der Snapshot auf dem Server selbst. Im zweiten brauchst du einen neuen Server, die Kopie auf dem Front-end und das Token. Im Lab des Kurses ersetzte `tofu apply` den verlorenen Server. Die neue VM wartete zehn Minuten in `pending`, weil OpenNebula für die Disk des Knotens noch den alten Wert kannte. Kapitel 6.2 beschreibt dasselbe beim Neubau. Vom Zurücksetzen bis zur laufenden Anwendung des Mitglieds verging danach knapp eine Minute. Die Volumes von local-path auf der Disk des alten Servers gab es nur noch als Objekte ohne ihre Ordner. Ihre Pods warteten deshalb mit der Meldung «does not exist». Einen eigenen Snapshot hat der neue Server erst wieder, wenn k3s den nächsten nach Zeitplan schreibt. Welchen Fall du übst, entscheidest du. Im SLA schreibst du, für welchen Fall deine Zeit gilt.

## Ein SLA auf Messwerten

[Kapitel 6.3](../sla/) beschreibt die Teile eines SLA und welche Verfügbarkeit die Architektur des Labs ehrlich zulässt. Für dein Mitglied stützt du die Zusagen auf das, was du gemessen und gesichert hast.

Das RTO folgt aus deiner Messung und aus den Betriebszeiten. Ohne Pikett behebt das Team einen Ausfall am Samstagabend erst am Montag. Das SLA sagt deshalb, ob das RTO rund um die Uhr gilt oder nur zu den Supportzeiten. Das RPO folgt aus den Sicherungen. Für den Zustand im Cluster sind das die Snapshots alle sechs Stunden, für die VM des Mitglieds der Zeitplan ihres Backup-Jobs. Steht die VM in keinem Backup-Job, kann das SLA für ihre Daten kein RPO zusagen.

Die Verfügbarkeit leitest du aus der Architektur ab. Das Lab hat ein Front-end und einen Server von k3s, beide nur einmal. Eine höhere Zusage verlangt mehr Aufwand, etwa einen Pikettdienst oder drei Server für k3s. Das erhöht auch den Preis aus Auftrag C. Das SLO, das du intern verfolgst, setzt du strenger als das SLA. Dann bemerkst du ein Problem, bevor die Zusage bricht. Das Kapitel [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) im SRE-Buch von Google erklärt diesen Unterschied.

## Ein Postmortem aus Daten

Die Zeitlinie ist der wichtigste Teil eines Postmortems und zugleich der mühsamste. Bei Wolkenwerk liegen die Fakten an drei Orten. Prometheus speichert für jeden Alert im Zustand `pending` oder `firing` eine Zeitreihe `ALERTS` mit dem Namen und dem Zustand des Alerts. Daraus lassen sich Beginn und Ende ablesen. Dein Triage-Dienst hält Vorschläge und Entscheide in seinem Audit-Log fest. Die Änderungen stehen im Verlauf des Plattform-Repos in Git. Ein Programm kann diese drei Quellen abfragen und nach der Zeit ordnen, ohne dass ein Modell beteiligt ist. Alerts wie `Watchdog`, der immer auslöst und nur zeigt, dass die Alarmierung läuft, gehören nicht in die Zeitlinie. Dasselbe gilt für `InfoInhibitor`, der nur Alerts der Stufe info unterdrückt.

Das Modell schreibt danach nur den Text um die Zeitlinie herum, etwa Zusammenfassung, Auswirkung, Ursachen und Massnahmen. Eine gute Frage an das Modell verlangt einen Bericht ohne Schuldzuweisung, der nur die gelieferten Fakten verwendet und eine fehlende Angabe als fehlend benennt. Mit der Option `format` gibt Ollama die Antwort als JSON oder nach einem JSON-Schema zurück. Eine solche Antwort lässt sich in ein Dokument mit festen Abschnitten einsetzen. Wie du das Modell vom Front-end aus erreichst, hängt davon ab, wie du es in Meilenstein 3 bereitgestellt hast.

Im Lab des Kurses ging es um einen Vorfall wie in Kapitel 5.3, über Git stand `FAIL_PERCENT` auf 60. Das Modell `llama3.2:3b` schrieb den Entwurf in 33 Sekunden. Die Zeitlinie stimmte, weil ein Programm sie aus den Daten gebaut hatte. Der Entwurf des Modells enthielt dagegen mehrere Fehler.

- Die Ausfallzeit gab er mit etwa einer Stunde an, die Fehler dauerten rund zehn Minuten.
- Den Umbau auf etcd machte er für eine Verzögerung der Snapshots verantwortlich, die es nie gab.
- Denselben Umbau lobte er als Gewinn an Stabilität, ohne dass ein Fakt das zeigte.
- Er erfand Verantwortliche wie «Teamleiter A» und schrieb Massnahmen unter «Was schlecht lief».
- Die richtige Ursache, `FAIL_PERCENT` auf 60, übernahm er aus dem Vorschlag des Triage-Dienstes.

Ein zweiter Entwurf über eine halbe Stunde nannte 13 Minuten Auswirkung. Im nächsten Satz schrieb er, die Benutzer hätten keine Ausfälle bemerkt, obwohl 60 % der Anfragen scheiterten. Ein Entwurf spart Tipparbeit, sieht aber auch dann wie ein fertiger Bericht aus, wenn seine Aussagen falsch sind. Deine Korrektur prüft deshalb jede Zahl, jede Ursache und jede genannte Person gegen die Zeitlinie. Entwurf und korrigierte Fassung bleiben als zwei Dateien erhalten, damit man sieht, was du geändert hast.

## Das Kostenmodell eines Mitglieds

[Kapitel 6.4](../cost/) hat die Vollkosten von Wolkenwerk auf 17’128 Franken im Jahr geschätzt und nach reservierten Ressourcen verteilt. Ein Mitglied mit einem Namespace von 1 CPU und 1 GB und einer VM mit einer halben CPU und 1 GB trug davon 16,3 %, rund 233 Franken im Monat. Mit den Preisen des Showbacks aus Kapitel 3.3 kostete dasselbe Mitglied rund 86 Franken. Den Unterschied macht vor allem die Arbeit des Plattform-Teams, die im Showback fehlt.

Für dein Mitglied triffst du eigene Annahmen und begründest sie. Du kannst die Kosten nach Reservierung verteilen, nach gemessenem Verbrauch oder als Grundbeitrag pro Mitglied mit einem Anteil nach Verbrauch. Nach Reservierung ist die Rechnung einfach und planbar, eine grosszügige Quota wird aber teuer. Nach Verbrauch folgt der Preis dem tatsächlichen Gebrauch, schwankt aber von Monat zu Monat und braucht Messwerte über längere Zeit. Backups belegen Platz im Backup-Datastore und gehören in die Rechnung, wenn das Mitglied viele oder grosse davon hat.

Für das Right-Sizing vergleichst du Requests und Quota deines Mitglieds mit dem gemessenen Verbrauch, mit den Abfragen aus [Kapitel 6.4](../cost/#right-sizing). Im Lab des Kurses reservierte das Mitglied `probe` 64 MiB Speicher und nutzte höchstens 21 MiB. Für einen Entscheid misst du länger als eine Stunde, mindestens einen Tag mit typischer Last.

## Auftrag A · Ein eigenes Mitglied

Du nimmst ein fünftes Mitglied, das du selbst entworfen hast, auf beiden Ebenen deiner Plattform auf und überwachst seine Anwendung. Ein Alert der Anwendung erreicht deinen Triage-Dienst aus Meilenstein 3. Du entscheidest über dessen Vorschlag und behebst den Fehler über Git.

Deine Lösung erfüllt diese Anforderungen:

1. Eine kurze Beschreibung nennt das Mitglied, seinen Dienst und seinen Schutzbedarf mit Begründung.
2. In OpenNebula hat das Mitglied eine Gruppe mit Admin in einem VDC, eine Quota, Preise für den Showback und eine laufende VM mit höchstens 1 GB Arbeitsspeicher.
3. Sein Namespace entsteht aus der Vorlage über einen zusammengeführten Pull Request in Gitea. Argo CD rollt seine Anwendung aus, sie erfüllt das Profil `restricted`.
4. Eine Alert-Regel im Ordner des Mitglieds überwacht die Anwendung. Alertmanager leitet ihren Alert an deinen Triage-Dienst weiter.
5. Du hast den Alert über Git ausgelöst, über den Vorschlag entschieden und den Fehler über Git behoben. Das Audit-Log zeigt Vorschlag und Entscheid.

In der Vorführung zeigst du:

- Gruppe, Quota und laufende VM des Mitglieds in Sunstone oder in der CLI
- Den Pull Request in Gitea und die gesunde Application in Argo CD
- Den Alert in Alertmanager, den Vorschlag deines Triage-Dienstes und deinen Entscheid im Audit-Log
- Mit `kubectl auth can-i`, was dein Triage-Dienst im Namespace des Mitglieds darf

Gruppen, Gruppenadmins und VDCs kennst du aus [Kapitel 3.1](../../tenants/groups/), Quotas aus [Kapitel 3.2](../../tenants/quotas/) und die Preise aus [Kapitel 3.3](../../tenants/showback/). Die Dokumentation von OpenNebula 7.4 beschreibt [Gruppen](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/manage_groups/), [VDCs](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/manage_vdcs/), [Quotas](https://docs.opennebula.io/7.4/product/cloud_system_administration/capacity_planning/quotas/) und den [Showback](https://docs.opennebula.io/7.4/product/cloud_system_administration/multitenancy/showback/). Den Weg eines Namespace über einen Pull Request zeigt [Kapitel 4.5](../../platform/templates/#der-antrag-der-gemeinde). Was das Profil `restricted` verlangt, steht in [Kapitel 6.1](../security/#pod-security-admission) und in den [Pod Security Standards](https://v1-36.docs.kubernetes.io/docs/concepts/security/pod-security-standards/) von Kubernetes 1.36. Für die Regel helfen [Kapitel 5.3](../../observability/slo/) und die Anleitung des Prometheus Operator 0.94 zu [Regeln](https://github.com/prometheus-operator/prometheus-operator/blob/v0.94.2/Documentation/developer/alerting.md#deploying-prometheus-rules). Die Weiterleitung mit `route`, Matchern und `webhook_config` beschreibt die [Konfiguration von Alertmanager 0.34](https://prometheus.io/docs/alerting/0.34/configuration/#route), der Version in kube-prometheus-stack 92.17.0. Rollen und Bindungen erklärt die [Dokumentation zu RBAC](https://v1-36.docs.kubernetes.io/docs/reference/access-authn-authz/rbac/).

## Auftrag B · Cluster wiederherstellen und SLA

Du stellst den Cluster aus einem Snapshot von etcd wieder her und misst die Zeit, bis die Plattform für dein Mitglied wieder läuft. Auf diese Zeit und die Architektur deines Labs stützt du ein SLA für das Mitglied.

Deine Lösung erfüllt diese Anforderungen:

1. Du hast einen Fehlerfall gewählt und den Cluster mit einem Snapshot aus der Kopie auf dem Front-end wiederhergestellt.
2. Start und Ende deiner Messung sind festgelegt, die gemessenen Zeiten sind festgehalten.
3. Nach der Wiederherstellung übernimmt Argo CD wieder neue Commits und die Anwendung deines Mitglieds läuft.
4. Das SLA nennt den Dienst, die Verfügbarkeit mit Zeitraum und Ausnahmen, die Supportzeiten, RPO und RTO.
5. Verfügbarkeit, RPO und RTO sind mit deiner Messung, deinen Sicherungen und der Architektur des Labs begründet.

In der Vorführung zeigst du:

- Den verwendeten Snapshot und seine Kopie auf dem Front-end
- Deine Messung mit Start, Ende und Zwischenzeiten
- Einen Commit, den Argo CD nach der Wiederherstellung übernommen hat
- Das SLA und die Begründung von RPO und RTO

Die Wiederherstellung darfst du vor der Vorführung machen. Dann zeigst du sie an ihren Spuren, etwa am Snapshot, an deinen Zeiten und am Zustand danach.

Snapshots, ihre Kopie und das Token kennst du aus [Kapitel 6.2](../backup/#snapshots-sichern). Die [Dokumentation der Snapshots](https://docs.k3s.io/cli/etcd-snapshot) von k3s beschreibt die Wiederherstellung auf einem bestehenden Server und auf neuen Hosts. Lege vor der Übung in smartlearn oder in deinem Hypervisor einen Snapshot der drei Server an, damit du bei einem Fehlschlag zurückkannst. Die Teile eines SLA und die Tabelle der Ausfallzeiten stehen in [Kapitel 6.3](../sla/), RPO und RTO in [Kapitel 6.2](../backup/#rpo-und-rto). Das Kapitel [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) im SRE-Buch erklärt, warum ein internes SLO strenger sein soll als das SLA.

## Auftrag C · Postmortem und Kostenmodell

Zum Vorfall aus Auftrag A lässt du das lokale Modell aus einer Zeitlinie einen Entwurf des Postmortems schreiben. Die Zeitlinie baust du ohne Modell aus den Daten auf, den Entwurf korrigierst du selbst. Dazu rechnest du ein Kostenmodell für dein Mitglied.

Deine Lösung erfüllt diese Anforderungen:

1. Die Zeitlinie des Vorfalls entsteht ohne Modell aus Alerts, Audit-Log und Git.
2. Das lokale Modell schreibt daraus den Entwurf `postmortem-entwurf.md`. Deine Frage an das Modell verlangt einen Bericht ohne Schuldzuweisung, der nur die gelieferten Fakten verwendet.
3. `postmortem.md` ist deine korrigierte Fassung und hält fest, was im Entwurf stimmte, was falsch war und was du geändert hast.
4. Das Kostenmodell nennt die Ressourcen des Mitglieds, seinen Anteil an den Vollkosten und einen Preis pro Monat. Es vergleicht den Preis mit dem Showback des Mitglieds aus OpenNebula.
5. Ein Vorschlag zum Right-Sizing stützt sich auf gemessene Requests und gemessenen Verbrauch.

In der Vorführung zeigst du:

- Die Zeitlinie mit der Quelle jedes Eintrags
- Den Entwurf des Modells neben deiner Korrektur mit zwei Stellen, die du geändert hast
- Das Kostenmodell und den Showback deines Mitglieds für einen Monat
- Deinen Vorschlag zum Right-Sizing mit den Messwerten

[Kapitel 6.3](../sla/#postmortems) beschreibt Postmortems ohne Schuldzuweisung und verweist auf das Kapitel [Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) des SRE-Buchs von Google. Ein [Beispiel](https://sre.google/sre-book/example-postmortem/) im selben Buch zeigt einen vollständigen Aufbau mit Zeitlinie. Die Zeitreihe `ALERTS` erklärt die [Dokumentation von Prometheus 3.15](https://prometheus.io/docs/prometheus/3.15/configuration/alerting_rules/#inspecting-alerts-during-runtime), die Option `format` die [Schnittstelle von Ollama 0.40.13](https://github.com/ollama/ollama/blob/v0.40.13/docs/api.md). Das Modell erreichst du so, wie du es in [Zusatzauftrag A von Meilenstein 3](../../observability/advanced/#auftrag-a--ein-lokales-sprachmodell) bereitgestellt hast. Für die Kosten nimmst du die Vollkosten und die Abfragen aus [Kapitel 6.4](../cost/), den Showback mit `oneshowback` aus [Kapitel 3.3](../../tenants/showback/#kosten-berechnen). Die FinOps Foundation beschreibt Showback und Chargeback unter [Invoicing and Chargeback](https://www.finops.org/framework/capabilities/invoicing-chargeback/).
