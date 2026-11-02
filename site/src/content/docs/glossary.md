---
title: Glossar
description: Die Fachbegriffe des Kurses in ein bis zwei Sätzen, mit dem Kapitel, das sie einführt.
sidebar:
  order: 1
---

Das Glossar erklärt die Fachbegriffe des Kurses kurz und verweist auf das Kapitel, das sie einführt. Viele Begriffe des Cloud Computing bleiben auch auf den deutschen Seiten englisch, etwa Front-end, Deployment oder Snapshot, damit du sie in Dokumentationen, Fehlermeldungen und Werkzeugen wiedererkennst.

| Begriff | Bedeutung | Kapitel |
|---|---|---|
| Alertmanager | Nimmt die auslösenden Alerts von Prometheus entgegen, fasst ähnliche zusammen, unterdrückt Wiederholungen und leitet sie an Empfänger wie einen Webhook weiter. | [5.3](../observability/slo/) |
| Alloy | Der Agent, der auf jedem Node die Logs der Pods liest und an Loki schickt. | [5.2](../observability/logs/) |
| Ansible | Ein Werkzeug, das Server über SSH in einen beschriebenen Zielzustand bringt. Ein zweiter Lauf ändert nur, was noch nicht stimmt. | [2.2](../iaas/installation/) |
| Application | Ein Objekt von Argo CD, das festlegt, welcher Ordner welches Repos in welchen Namespace gehört. | [4.4](../platform/gitops/) |
| ApplicationSet | Erzeugt Applications nach einem Muster, im Kurs eine pro Ordner unter `members`. | [4.5](../platform/templates/) |
| Argo CD | Ein Satz von Controllern im Cluster, der Manifeste aus Git liest, mit dem Cluster vergleicht und ihn an Git angleicht. | [4.4](../platform/gitops/) |
| Burn Rate | Wie schnell ein Dienst sein Fehlerbudget verbraucht. Bei einer Burn Rate von 1 ist das Budget genau am Ende des Zeitraums aufgebraucht. | [5.3](../observability/slo/) |
| Chargeback | Der Verbrauch wird dem Budget des Bereichs belastet, der ihn verursacht hat. | [3.3](../tenants/showback/) |
| Client | Die VM, von der aus du auf smartlearn arbeitest, ein Kali-Linux-Desktop mit einem Browser für die Weboberflächen und einem Terminal für SSH zu den Servern. Mit eigenem Hypervisor übernimmt dein PC diese Rolle. | [0.2](../start/lab/) |
| Container | Ein Prozess mit eigener Sicht auf Dateisystem, Netz und Prozesse. Er teilt den Kernel mit dem Rechner und bringt nur seine Anwendung mit. | [1.3](../basics/virtualization/) |
| Control Plane | Der Teil von Kubernetes, der den Cluster steuert, mit API-Server, Scheduler, Controllern und Datenbank. In k3s läuft sie auf dem Server. | [4.3](../platform/kubernetes/) |
| Datastore | Ein Speicherort von OpenNebula. `default` hält die Images, `system` die Disks laufender VMs, `files` kleinere Dateien. | [2.4](../iaas/images/) |
| Deployment | Hält eine Zahl gleicher Pods am Laufen und tauscht sie bei einem Update aus. | [4.3](../platform/kubernetes/) |
| Drift | Eine Abweichung des Ist-Zustands vom Code, etwa nach einer Änderung von Hand. `tofu plan` zeigt sie. | [4.1](../platform/iac/) |
| Elastizität | Ressourcen wachsen mit der Last und schrumpfen wieder, nach Regeln und ohne Eingriff von Hand. | [3.5](../tenants/advanced/) |
| etcd | Eine verteilte Datenbank für den Zustand eines Clusters. Im Kurs ersetzt sie in Teil 6 SQLite, damit k3s Snapshots schreiben kann. | [6.2](../operations/backup/) |
| Exporter | Ein Programm, das Messwerte eines Systems im Format von Prometheus anbietet, etwa node_exporter auf Port 9100. | [5.1](../observability/metrics/) |
| Fehlerbudget | Der Anteil an Fehlern, den ein SLO erlaubt. Beim Webshop sind das 0,5 % der Anfragen über sieben Tage. | [5.3](../observability/slo/) |
| Front-end | Die VM, auf der OpenNebula die Cloud verwaltet, mit dem Dienst `oned`, dem Scheduler und der Weboberfläche. Im Kurs ist sie auch das Gateway des internen Netzes. | [0.2](../start/lab/) |
| Gateway | Der Rechner, über den die VMs eines Netzes andere Netze erreichen. Im Kurs leitet das Front-end den Verkehr des internen Netzes mit NAT ins Internet. | [0.2](../start/lab/) |
| Gitea | Ein schlanker Git-Server mit Weboberfläche und Pull Requests. Im Kurs läuft er auf dem Front-end und hält das Repo `platform`. | [4.4](../platform/gitops/) |
| GitOps | Der Soll-Zustand liegt versioniert in Git, ein Agent im Cluster holt ihn sich und gleicht laufend ab. Änderungen machst du deshalb in Git. | [4.4](../platform/gitops/) |
| Grafana | Zeigt Abfragen an Prometheus und Loki als Dashboards. | [5.1](../observability/metrics/) |
| Gruppe | Fasst in OpenNebula die Benutzer eines Mandanten zusammen. Ein Gruppenadmin verwaltet die Leute seines Mitglieds selbst. | [3.1](../tenants/groups/) |
| Härten | Alles abschalten oder abschotten, was nicht gebraucht wird, im Kurs mit SSH nur über Schlüssel, einer Firewall und automatischen Updates. | [6.1](../operations/security/) |
| Hash | Eine kurze Prüfsumme, die sich ändert, sobald sich der Inhalt ändert. Der Check-Bericht endet mit dem Hash seines Inhalts. | [0.5](../start/tools/) |
| Helm | Installiert Pakete in Kubernetes, sogenannte Charts, mit Werten, die du anpasst. | [4.2](../platform/opentofu/) |
| HorizontalPodAutoscaler | Passt die Zahl der Pods eines Deployments an eine Metrik an, meist an die CPU in Prozent des Requests. Kurz HPA. | [5.4](../observability/autoscaling/) |
| Hypervisor | Teilt einen physischen Rechner in mehrere virtuelle Maschinen mit eigenen CPUs, eigenem Speicher und eigenen Disks auf. | [1.3](../basics/virtualization/) |
| IaaS | Infrastructure as a Service. Der Anbieter liefert VMs, Netze und Speicher, Betriebssystem und Anwendung betreiben die Nutzenden selbst. | [1.2](../basics/models/) |
| Image | Eine Disk, aus der VMs starten, etwa ein vorbereitetes Ubuntu. Es liegt in einem Datastore. | [2.4](../iaas/images/) |
| Infrastructure as Code | Infrastruktur wird in Dateien beschrieben, versioniert und von einem Werkzeug angelegt, statt von Hand. | [4.1](../platform/iac/) |
| Inventar | Die Datei, in der Ansible die Server und ihre Gruppen findet, dazu Werte, die für alle oder für einzelne gelten. | [2.2](../iaas/installation/) |
| k3s | Eine schlanke Kubernetes-Distribution als einzelnes Programm. Ein Server enthält die Control Plane, ein Agent führt nur Pods aus. | [4.3](../platform/kubernetes/) |
| Knoten | Eine VM, auf der OpenNebula die virtuellen Maschinen der Mitglieder ausführt. Im Kurs gibt es zwei Knoten mit KVM. | [0.2](../start/lab/) |
| Kontextualisierung | OpenNebula gibt einer VM beim Start Adresse, Namen, Schlüssel und Skripte mit, das Paket `one-context` richtet sie damit ein. | [2.4](../iaas/images/) |
| Kustomize | Setzt aus einer Vorlage und kleinen Anpassungen die Objekte für jedes Mitglied zusammen, ohne die Vorlage zu kopieren. | [4.5](../platform/templates/) |
| KVM | Der Hypervisor im Linux-Kernel. Er nutzt die Virtualisierungsfunktionen der CPU und führt die VMs auf den Knoten aus. | [0.2](../start/lab/) |
| LimitRange | Setzt Standardwerte und Obergrenzen für Requests und Limits jedes Containers in einem Namespace. | [4.5](../platform/templates/) |
| LogQL | Die Abfragesprache von Loki. Eine Abfrage wählt zuerst Streams nach Labels und filtert dann den Text. | [5.2](../observability/logs/) |
| Loki | Sammelt Logs zentral und behält sie über das Ende eines Pods hinaus. Es indexiert nur wenige Labels, nicht den Text. | [5.2](../observability/logs/) |
| Mandant | Eine Organisation, die eine Cloud mit anderen teilt und nur ihre eigenen Ressourcen sieht. Englisch Tenant. | [3.1](../tenants/groups/) |
| NAT | Network Address Translation ersetzt die Absenderadresse von Paketen, damit Rechner eines internen Netzes über eine einzige Adresse ins Internet kommen. | [0.2](../start/lab/) |
| Namespace | Ein abgegrenzter Bereich im Kubernetes-Cluster. Im Kurs bekommt jedes Mitglied einen eigenen mit Quota und Regeln. | [4.3](../platform/kubernetes/) |
| Nested Virtualization | Verschachtelte Virtualisierung. Eine VM reicht die Virtualisierungsfunktionen der CPU an ihr eigenes Betriebssystem weiter, sodass darin wieder VMs laufen. | [0.2](../start/lab/) |
| NetworkPolicy | Legt fest, wer einen Pod im Netz des Clusters ansprechen darf. Ohne Regel erreicht jeder Pod jeden anderen. | [4.5](../platform/templates/) |
| nftables | Das Paketfilter-Werkzeug von Linux. Im Kurs hält es die NAT des Gateways und die Firewall des Front-ends in je einer eigenen Tabelle. | [6.1](../operations/security/) |
| Ollama | Lädt offene Sprachmodelle und bietet sie über eine HTTP-Schnittstelle an. In den Zusatzaufträgen von Teil 5 kann es das lokale Sprachmodell der Plattform bereitstellen. | [5.5](../observability/advanced/) |
| OneDeploy | Die Sammlung von Ansible-Playbooks, mit der das OpenNebula-Projekt eine Cloud aus Front-end und Knoten installiert. | [2.2](../iaas/installation/) |
| OneFlow | Verwaltet in OpenNebula Dienste aus mehreren VMs in Rollen und passt die Zahl der VMs nach Regeln an. | [3.5](../tenants/advanced/) |
| OpenNebula | Eine freie Plattform für Private Clouds. Sie verwaltet Knoten, Netze, Speicher und virtuelle Maschinen und teilt sie an Mandanten zu. | [2.2](../iaas/installation/) |
| OpenTofu | Ein Werkzeug für Infrastructure as Code, ein freier Fork von Terraform. Im Kurs legt es die VMs von k3s in OpenNebula an. | [4.2](../platform/opentofu/) |
| PaaS | Platform as a Service. Der Anbieter betreibt auch Betriebssystem und Laufzeitumgebung, die Nutzenden bringen nur ihre Anwendung. | [1.2](../basics/models/) |
| Persönliche Parameter | Die Werte deines Labs, die aus deinem persönlichen Code entstehen, etwa Hostnamen, das interne Netz und die Kennung des VXLAN. Sie liegen in `/etc/cc-lab.env`. | [0.3](../start/parameters/) |
| Playbook | Eine Datei, die beschreibt, welche Schritte Ansible auf welchen Servern ausführt. | [2.2](../iaas/installation/) |
| Pod | Die kleinste Einheit in Kubernetes, ein oder mehrere Container mit gemeinsamer Adresse. | [4.3](../platform/kubernetes/) |
| Pod Security Admission | Prüft Pods gegen ein Sicherheitsprofil, das ein Label am Namespace festlegt. Das Profil `restricted` weist Pods ab, die etwa als `root` laufen. | [6.1](../operations/security/) |
| Postmortem | Ein Bericht nach einer Störung mit Ablauf, Auswirkung, beitragenden Ursachen und Massnahmen, ohne Schuldige zu suchen. | [6.3](../operations/sla/) |
| Private Cloud | Eine Cloud für eine einzige Organisation. Teilen sich mehrere Organisationen mit gemeinsamen Anforderungen eine Cloud, wie bei Wolkenwerk Bern, heisst sie Community Cloud. | [1.2](../basics/models/) |
| Prometheus | Fragt Messwerte in festen Abständen ab und speichert sie als Zeitreihen, ein Name mit Labels und Werten mit Zeitstempel. | [5.1](../observability/metrics/) |
| PromQL | Die Abfragesprache von Prometheus, etwa für Raten, Summen und Perzentile über Zeitreihen. | [5.1](../observability/metrics/) |
| Provider | Übersetzt in OpenTofu die Blöcke im Code in Aufrufe einer API, etwa der API von OpenNebula auf Port 2633. | [4.2](../platform/opentofu/) |
| Pull Request | Ein Antrag in Gitea, einen Branch in `main` zu übernehmen. Andere prüfen die Änderung, bevor sie gilt. | [4.5](../platform/templates/) |
| Quota | Eine Obergrenze für die Ressourcen, die eine Gruppe oder ein Benutzer belegen darf. | [3.2](../tenants/quotas/) |
| Recording Rule | Eine Regel, die Prometheus regelmässig ausrechnet und als neue Zeitreihe speichert, damit Alerts und Dashboards schnell darauf zugreifen. | [5.3](../observability/slo/) |
| Regel 3-2-1 | Drei Kopien wichtiger Daten auf zwei verschiedenen Medien, eine davon ausser Haus. | [6.2](../operations/backup/) |
| ResourceQuota | Begrenzt, was alle Pods eines Namespaces zusammen an CPU, Speicher und Objekten anfordern dürfen. | [4.5](../platform/templates/) |
| Right-Sizing | Die reservierten Ressourcen an den gemessenen Verbrauch anpassen. | [6.4](../operations/cost/) |
| RPO | Recovery Point Objective. Der Zeitpunkt, bis zu dem Daten nach einem Ausfall wiederhergestellt sein müssen, also wie viel Datenverlust tragbar ist. | [6.2](../operations/backup/) |
| RTO | Recovery Time Objective. Die längste Zeit, die ein Dienst ausfallen darf, bevor der Schaden nicht mehr tragbar ist. | [6.2](../operations/backup/) |
| SaaS | Software as a Service. Die Nutzenden beziehen eine fertige Anwendung und verwalten nur ihre Daten und Zugriffsrechte. | [1.2](../basics/models/) |
| Schutzbedarf | Wie stark Daten und Dienste bei Vertraulichkeit, Integrität und Verfügbarkeit zu schützen sind, gemessen am Schaden eines Verlusts. | [1.4](../basics/sovereignty/) |
| Sealed Secrets | Verschlüsselt ein Secret mit dem öffentlichen Schlüssel eines Controllers zu einem SealedSecret, das in Git darf. Nur der Controller kann es entschlüsseln. | [6.1](../operations/security/) |
| Self-Heal | Argo CD setzt zurück, was jemand im Cluster von Hand ändert, damit der Cluster wieder Git entspricht. | [4.4](../platform/gitops/) |
| Self-Service | Ein Mitglied holt sich Ressourcen selbst, wenn es sie braucht, innerhalb des Rahmens, den das Plattform-Team vorgibt. | [3.4](../tenants/self-service/) |
| Showback | Zeigt jedem Bereich, was er verbraucht hat, ohne dass Geld fliesst. OpenNebula rechnet dafür mit Preisen aus der Vorlage. | [3.3](../tenants/showback/) |
| SLA | Service Level Agreement. Eine Vereinbarung mit dem Mitglied über die Qualität eines Dienstes, mit Folgen, wenn sie verfehlt wird. | [6.3](../operations/sla/) |
| SLI | Service Level Indicator. Eine Messung, wie gut ein Dienst aus Sicht der Kundschaft arbeitet, meist als Anteil guter Ereignisse. | [5.3](../observability/slo/) |
| SLO | Service Level Objective. Das interne Ziel für einen SLI über einen Zeitraum, beim Webshop 99,5 % der Anfragen ohne Serverfehler über sieben Tage. | [5.3](../observability/slo/) |
| Snapshot | Eine Kopie der Datenbank von k3s zu einem Zeitpunkt. Mit ihr und dem Token des Servers lässt sich der Cluster auf diesen Stand zurücksetzen. | [6.2](../operations/backup/) |
| Sprachmodell | Ein Modell, das Text Token für Token erzeugt. Es schreibt wahrscheinliche Texte und prüft nicht, ob sie stimmen. | [5.5](../observability/advanced/) |
| SSH-Schlüssel | Ein Paar aus privatem und öffentlichem Schlüssel, mit dem du dich ohne Passwort an einem Server anmeldest. | [0.5](../start/tools/) |
| State | Die Datei, in der OpenTofu festhält, welches Objekt in OpenNebula zu welchem Block im Code gehört. Sie enthält geheime Werte und gehört nicht in Git. | [4.1](../platform/iac/) |
| Sunstone | Die Weboberfläche von OpenNebula auf Port 2616 des Front-ends, für das Plattform-Team und die Mitglieder. | [2.1](../iaas/architecture/) |
| Triage | Die erste Einschätzung eines Alerts. In den Zusatzaufträgen baust du einen Dienst, der mit dem lokalen Modell eine Ursache und eine Aktion aus einer festen Liste vorschlägt. Ein Mensch gibt sie frei. | [5.5](../observability/advanced/) |
| VDC | Virtual Data Center. Ein Ausschnitt der Infrastruktur, den OpenNebula einer oder mehreren Gruppen zuteilt. | [3.1](../tenants/groups/) |
| Vollkosten | Alle Kosten eines Dienstes, neben Hardware und Strom auch Arbeit und weitere Posten. Bei einer kleinen Plattform macht die Arbeit den grössten Teil aus. | [6.4](../operations/cost/) |
| Vorlage | Beschreibt in OpenNebula eine VM, aus der du beliebig viele VMs startest, im Kurs etwa `ubuntu`. | [2.4](../iaas/images/) |
| VXLAN | Ein Verfahren, das ein Netz für VMs in UDP-Paketen über ein bestehendes Netz trägt. Im Kurs verbindet es die VMs deiner Cloud über das Front-end und die Knoten. | [2.3](../iaas/networks/) |
