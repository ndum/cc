---
title: Zusatzaufträge
description: Die drei Zusatzaufträge von Meilenstein 2 mit dem Neubau der Plattform als Übung, einem eigenen Mitglied mit AppProject und dem Schutz des Branches main in Gitea.
tableOfContents:
  maxHeadingLevel: 2
sidebar:
  order: 6
  badge:
    text: Zusatz
    variant: note
---

:::assignment
Beat Kläy, der Präsident des Vorstands, schreibt dir nach der letzten Sitzung. «Eine Plattform aus Code klingt gut. Habt ihr schon einmal ausprobiert, wie lange der Webshop des Veloateliers stillsteht, wenn alles weg ist? Bevor das nächste Mitglied dazukommt, will ich sehen, dass es nur in seinem eigenen Bereich arbeiten kann. Und an der Plattform soll niemand etwas ändern, das keine zweite Person angeschaut hat, auch ihr nicht.»
:::

:::goals
Nach diesem Kapitel kannst du:

- Einen Neubau der Plattform als Übung planen, die Zeit messen und das Ergebnis prüfen
- Erklären, was State und Drift für einen Neubau bedeuten und was er nicht zurückbringt
- Die Grenzen eines Mitglieds aus seinem Bedarf herleiten und gegen den Cluster rechnen
- Ein Mitglied mit einem AppProject in Argo CD auf seinen Namespace beschränken
- Den Branch `main` in Gitea mit Regeln schützen und ihre Ausnahmen begründen
:::

## Rahmen und Bewertung

Die drei Aufträge dieses Kapitels gehen über die Basis hinaus. Anders als in den Kapiteln 4.1 bis 4.5 gibt es hier keine Befehle zum Abtippen und keine fertigen Dateien. Du entwirfst eine eigene Lösung, baust sie in deinem Lab und begründest deine Entscheide. Die Konzepte unten nennen dafür oft mehr als einen Weg.

Für die Aufträge gilt dieser Rahmen:

- Sie sind die Zusatzaufträge von [Meilenstein 2](../../assessment/milestone-2/), du kannst auch nur einzelne bearbeiten
- Für alle drei rechnest du mit vier bis sechs Stunden
- Du zeigst sie live im Unterricht oder in einem Screencast von höchstens zehn Minuten, wie es der Meilenstein unter [Zusatzaufträge zeigen](../../assessment/milestone-2/#zusatzaufträge-zeigen) beschreibt. Dabei beantwortest du die zwei Fragen aus dem Bericht des Checks `m2`.
- Jeder Auftrag braucht eine Dokumentation in fünf Teilen nach der [Leistungsbeurteilung](../../assessment/#dokumentation-der-zusatzaufträge), dazu kommt eine Kopie deines Repos `platform` ohne `.git`, State, Tokens und Passwörter
- Jeder Auftrag gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../../assessment/#stufen-der-zusatzaufträge), ohne Dokumentation höchstens 1 Punkt
- KI-Assistenten setzt du nach den [Regeln des Kurses](../../start/overview/#ki-werkzeuge) ein. In der Vorführung erklärst du jede Zeile selbst.

## Den Neubau üben

In Kapitel 4.1 wünschte sich Simone Wyss eine Plattform, die sich jederzeit aus dem Code neu bauen lässt. Ob der Code das hergibt, zeigt erst ein Neubau. Sonst fällt ein vergessener Schritt von Hand erst auf, wenn die Plattform weg ist. Betriebe üben den Ernstfall deshalb nach festem Ablauf.

| | Runbook | Skript |
|---|---|---|
| Ablauf | Schritte für Menschen, mit Prüfungen dazwischen | dieselben Schritte, jedes Mal gleich |
| Zeit | misst ein Mensch | misst das Skript nebenbei |

:::details[Zeitmessung, RTO und Abbruch eines Skripts]
Betriebe messen die Zeit, notieren, was nicht klappte, verbessern den Ablauf und wiederholen die Übung.

Solange der Neubau der einzige Weg zurück ist, kann Wolkenwerk dem Veloatelier keine kürzere Ausfallzeit versprechen als die gemessene. [Kapitel 6.2](../../operations/backup/#rpo-und-rto) nennt dieses Versprechen RTO. Erst die Zeit jedes Schritts zeigt, wo die Minuten liegen, im Abriss, beim Start der VMs, bei Kubernetes oder bei Argo CD.

Bricht ein Skript mitten im Neubau ab, muss jemand herausfinden, wo es stand.
:::

## Code, State und Handarbeit

Ein Neubau bringt genau das zurück, was der Code beschreibt. `tofu destroy` löscht genau die Objekte, die der State aufführt. Der State liegt neben dem Code auf dem Front-end, aber nicht in Git.

:::details[Objekte, Schlüssel und Daten nach dem Neubau]
| Was | Nach dem Neubau |
|---|---|
| VMs, Startskript, Applications, Vorlage und Mitglieder | entstehen aus dem Repo `platform` wieder |
| Das Netz `cc-net` und das Image, die der Code nur liest | bleiben stehen |
| Gitea mit dem Repo auf dem Front-end | läuft weiter |
| Nummern der VMs, Werte von OpenTofu wie das Token von k3s | sind neu |
| Der alte Hostschlüssel des Servers in `known_hosts` und die kubeconfig auf dem Front-end | passen nicht mehr, wie Kapitel 4.3 zeigt |
| Objekte ausserhalb von Git aus Skripten wie dem Bootstrap aus Kapitel 4.4, etwa das Secret mit dem Token für Gitea | legt das Skript neu an |
| Daten auf der Disk eines Nodes sowie Objekte, die jemand mit `kubectl` an Git vorbei angelegt hat | sind verloren |

Auf die verlorenen Daten kommt Kapitel 6.2 mit Backups zurück.
:::

## Drift vor dem Neubau

Vor dem Abriss zeigt die Drift, was der Neubau verändern wird. Danach ist sie weg, auch eine Korrektur von Hand, die nie in Git ankam. Suche sie darum vorher.

| | VMs | Cluster |
|---|---|---|
| Vergleich | `tofu plan`, nur für die Attribute, die der Provider kennt | Argo CD für jede Application, Self-Heal setzt Abweichungen zurück |
| Unbemerkt | Änderungen in einer VM selbst | Objekte, die jemand an Git vorbei angelegt hat |
| Nach `tofu destroy` | eine VM, die jemand neben dem Code angelegt hat, bleibt stehen und belegt weiter Speicher auf den knappen Knoten aus Kapitel 4.2 | auch die Objekte an Git vorbei sind weg |

## Grenzen für ein Mitglied

Die Werte der Gemeinde kamen aus deinen persönlichen Parametern, für ein eigenes Mitglied leitest du Requests und Limits der Quota selbst her. Ausgangspunkt sind Zahl, CPU und Speicher seiner Pods und die Frage, ob es Dateien speichert. Danach rechnest du gegen den Cluster.

:::details[LimitRange, Rechnung gegen den Cluster und Begründung]
Die LimitRange muss dem grössten Container erlauben, was er braucht, sonst lehnt Kubernetes ihn trotz freier Quota ab. Ihre Standardwerte gelten für Container ohne eigene Angaben.

Von den 8 vCPU und 12 GB der zwei VMs brauchen k3s und Argo CD einen Teil, Teil 5 bringt Prometheus, Loki und als Zusatz ein Sprachmodell. Die Summe der Limits darf wie in Kapitel 3.2 grösser sein als der Cluster, bei den Requests ist das riskanter. Der Scheduler startet keinen Pod mehr, wenn die reservierten Werte die Nodes füllen. Deine Begründung nennt Bedarf, Rechnung und die Folgen einer Spitze an der Grenze.
:::

## AppProjects

Bisher gehören alle Applications zum Projekt `default`, das alles erlaubt. Ein **AppProject** legt für die Applications, die es nennen, die erlaubten Repos, Cluster, Namespaces und Arten von Objekten fest.

| Arten von Objekten | Beispiele | Regel im AppProject |
|---|---|---|
| Im ganzen Cluster | das Objekt Namespace | nur die Arten auf einer Liste sind erlaubt |
| In einem Namespace | Deployment, ResourceQuota | einzelne Arten lassen sich verbieten |

:::details[Ausschlüsse, AppProjects aus Git und der Entscheid zur Vorlage]
Eine Regel mit `!` schliesst ein Ziel aus, etwa einen Namespace. AppProjects liegen im Namespace `argocd` und können wie Applications aus Git kommen.

Weil die Vorlage aus Kapitel 4.5 den Namespace als eigenes Objekt anlegt, braucht ihre Application ein Projekt, das diese Art erlaubt. Erlaubt ein Projekt dagegen alles ausser ResourceQuota, LimitRange und NetworkPolicy, wie ein Beispiel in der Dokumentation von Argo CD, kann eine Application die Grenzen ihres Namespaces nicht ändern.

Daraus folgt ein Entscheid. Entweder gehört die Application der Vorlage zum Projekt des Mitglieds. Oder sie bleibt beim Plattform-Team und das Mitglied bekommt für seine Anwendungen eine zweite Application in seinem Projekt.
:::

## Projekt und ApplicationSet

Das ApplicationSet `members` aus Kapitel 4.5 schreibt in jede Application `project: default`. Ein AppProject wirkt erst, wenn die Application des Mitglieds es nennt.

| Weg | Folge |
|---|---|
| Das ApplicationSet bildet den Namen des Projekts aus dem Ordner | jedes Mitglied braucht ein eigenes Projekt |
| Der Git-Generator schliesst den Ordner aus | eine eigene Application beschreibt das Mitglied |
| Die Application der Vorlage bleibt, wie sie ist | nur die Anwendungen des Mitglieds bekommen ein Projekt |

:::details[Sicherheit der Wege und Prüfung der Änderungen am Repo]
Welcher Weg sicher ist, hängt davon ab, wer das Repo ändern darf. Die Dokumentation von Argo CD warnt vor einem Projekt aus der Vorlage eines ApplicationSets, weil beim Git-Generator schon ein Pull Request mit einem neuen Ordner Applications in einem Projekt mit zu vielen Rechten erzeugen könnte. Die Dokumentation verlangt darum, dass Administratoren solche Pull Requests freigeben. Ein Projekt mit Zugriff auf den Namespace `argocd` hat faktisch Administratorrechte. Ein AppProject schützt also nur so gut wie die Prüfung der Änderungen am Repo, das Thema von Auftrag C.
:::

## Branch-Schutz in Gitea

Im Repo `wolkenwerk/platform` ist `main` der Soll-Zustand des Clusters. Gitea nimmt jeden Push mit Schreibrechten an, ob ihn jemand geprüft hat oder nicht.

Ein **geschützter Branch** macht die Prüfung zu einer Regel, die Gitea selbst durchsetzt, auch im Editor der Weboberfläche und über die API. Dafür gibt es diese Einstellungen:

- Den direkten Push sperren oder nur einer Liste von Konten erlauben
- Vor dem Merge Freigaben verlangen, von allen Konten mit Schreibrechten oder nur von einer Liste
- Alte Freigaben nach neuen Commits verwerfen
- Den Merge nach einer Ablehnung sperren
- Einzelne Dateien besonders schützen, etwa in `templates/member`, weil eine Änderung dort alle Mitglieder trifft

:::details[Argo CD, direkte Pushes und Status Checks]
Argo CD fragt jede Minute ab und rollt jeden neuen Commit aus. Die Anträge der Mitglieder prüft das Plattform-Team als Pull Request, eigene Änderungen schickt es bisher mit `git push` direkt auf `main`.

Status Checks einer CI gibt es im Lab nicht.
:::

## Ausnahmen von der Regel

Wer einen Pull Request geöffnet hat, kann ihn in Gitea nicht selbst freigeben. Administratoren eines Repos können einen Pull Request ohne Freigaben zusammenführen, solange «Administrators must follow branch protection rules» nicht gesetzt ist. Ob das Plattform-Team solche Hintertüren behält, ist eine Abwägung.

:::details[Zweites Konto, Liste für Ausnahmen und Notfallweg]
Im Lab öffnest du Pull Requests und gibst sie auch frei, dafür brauchst du ein zweites Konto mit Schreibrechten. Weil sich niemand selbst registrieren kann, legt es ein Administrator an.

Das Konto `platform` ist der Administrator deines Gitea und besitzt die Organisation `wolkenwerk`. Die Konten auf der Liste «Allow selected users or teams to bypass branch protection» von Gitea 28 umgehen die Regel auch dann, wenn «Administrators must follow branch protection rules» gesetzt ist.

Auch eine Korrektur im Notfall wartet auf ein Review, der Ausfall dauert dann länger. Teams halten darum oft einen dokumentierten Notfallweg bereit, den sie selten nutzen und danach prüfen. Argo CD liest das Repo nur und merkt vom Schutz nichts.
:::

## Neubau der Plattform (Auftrag A)

Beat Kläy will wissen, wie lange der Webshop des Veloateliers stillsteht, wenn alles weg ist. Du reisst die Plattform ab, baust sie allein aus dem Code wieder auf und misst die Ausfallzeit.

![Der Neubau der Plattform. Der Zielzustand von Auftrag A. Nach einem Abriss entsteht die Plattform neu aus dem Code. Oben links das Front-end, das stehen bleibt. Darauf liegen OpenTofu mit Code und State sowie Gitea mit dem Repo wolkenwerk/platform. Oben rechts der neue k3s-Cluster in cc-net. OpenTofu legt die zwei VMs k3s-server und k3s-agent neu an. Argo CD kommt mit dem Bootstrap dazu, holt den Soll-Zustand aus Gitea und wendet die Applications für den Webshop und die Mitglieder an. Unten misst dein Runbook oder Skript jeden Schritt, den Abriss, den Start der VMs, Kubernetes und Argo CD. Achte darauf, dass die Ausfallzeit vom Start des Abrisses bis zur ersten Antwort des Webshops reicht.](../../../assets/figures/de/p4c6-rebuild.svg)

| Ausgangslage | Ergebnis |
|---|---|
| Aus der Basis hast du die VMs `k3s-server` und `k3s-agent` aus OpenTofu mit ihrem State in `~/platform/tofu` auf dem Front-end (Kapitel 4.2) und k3s aus dem Startskript (Kapitel 4.3). Gitea auf dem Front-end hält das Repo `wolkenwerk/platform`. Daraus rollt Argo CD seit dem Bootstrap in Kapitel 4.4 die Applications `root`, `webshop`, `member-velo` und `member-gemeinde` aus, mit dem Webshop im Namespace `velo` und den Grenzen der Namespaces `velo` und `gemeinde` aus Kapitel 4.5. | Du hast die Plattform mit `tofu destroy` abgerissen und allein aus deinem Code und dem Repo in Gitea wieder aufgebaut. Der Webshop antwortet wieder, alle Applications sind `Synced` und `Healthy` und `tofu plan` zeigt keine Änderungen. Dein Runbook oder Skript hält die Zeit jedes Schritts fest. |

### Vorgehen

1. Halte den Stand vor dem Abriss fest und suche Drift in den VMs und im Cluster.
2. Schreibe den Ablauf von Abriss und Neubau als Runbook oder Skript, das jeden Schritt misst.
3. Reisse die Plattform ab und baue sie mit deinem Ablauf allein aus dem Code und dem Repo in Gitea wieder auf.
4. Prüfe die neue Plattform mit dem Plan, den Applications, dem Webshop und den Grenzen der Mitglieder.
5. Vergleiche den Stand danach mit dem Stand davor und kläre, was der Neubau nicht zurückgebracht hat.
6. Halte die Zeiten pro Schritt, die Probleme und deinen Entscheid zwischen Runbook und Skript für die Dokumentation fest.

:::caution[Neubau nach Teil 4]
Die Hinweise aus dem Lab zu diesem Auftrag gelten für den Stand von Teil 4. Ein späterer Neubau dauert länger und verliert die Metriken und Logs aus Teil 5. Bis Kapitel 6.1 führst du vor dem Bootstrap `make-secrets.sh` aus, ab Kapitel 6.1 sicherst du vor dem Abriss den Schlüssel von Sealed Secrets wie in Kapitel 6.2. Sonst startet Grafana nicht.
:::

### Anforderungen

1. Nach dem Abriss mit `tofu destroy` entsteht die Plattform allein aus deinem Code und dem Repo in Gitea. Ausser dem Bootstrap von Argo CD legst du im Cluster nichts von Hand an.
2. Du misst die Zeit vom Start des Abrisses bis zur ersten Antwort des Webshops und hältst die Zeit jedes Schritts fest.
3. Nach dem Neubau zeigt `tofu plan` keine Änderungen. Alle Applications sind `Synced` und `Healthy` und die Namespaces der Mitglieder haben wieder ihre Grenzen.
4. Der Ablauf steht in einem kurzen Runbook oder in einem Skript, mit dem eine andere Person den Neubau wiederholen könnte.
5. Du erklärst an deinem Lab, welche Rolle der State beim Abriss spielt, was mit einer Änderung von Hand geschieht und was der Neubau nicht zurückbringt.

### Vorführung

- Den Stand vor dem Abriss mit `tofu plan` und den Applications in Argo CD
- Abriss und Neubau mit deinem Runbook oder Skript und der laufenden Zeitmessung
- Die Plattform nach dem Neubau mit Webshop, Applications, Grenzen und `tofu plan`
- Deine Zeiten pro Schritt und was du daraus schliesst

:::details[Hinweise aus dem Lab]
- Mit dem Stand von Teil 4 dauerte der Neubau knapp drei Minuten, bis der Webshop wieder lief. Starte ihn deshalb früh in der Vorführung und erkläre deinen Code, während er läuft.
- Gitea auf dem Front-end bleibt während des Neubaus erreichbar
:::

:::details[Quellen]
- [Kapitel 4.1](../iac/#state) zu State, Plan und Drift
- [Kapitel 4.2](../opentofu/#ändern-ersetzen-und-neu-bauen) zu `tofu plan` und `tofu apply` für die VMs des Clusters
- [Kapitel 4.3](../kubernetes/#die-kubeconfig) zum Front-end nach einem neuen Cluster
- [Kapitel 4.4](../gitops/#argo-cd) zum Bootstrap von Argo CD
- Die Dokumentation von OpenTofu 1.13 zu [`tofu destroy`](https://opentofu.org/docs/v1.13/cli/commands/destroy/), zum [State](https://opentofu.org/docs/v1.13/language/state/) und zu den [Modi von `tofu plan`](https://opentofu.org/docs/v1.13/cli/commands/plan/), darunter `-refresh-only`, der den State an Änderungen ausserhalb von OpenTofu anpasst
- [Cluster Bootstrapping](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/cluster-bootstrapping/) in der Dokumentation von Argo CD 3.5 zum Muster App of Apps, auf dem der Bootstrap beruht
:::

## Ein eigenes Mitglied (Auftrag B)

Bevor das nächste Mitglied dazukommt, will Beat Kläy sehen, dass es nur in seinem eigenen Bereich arbeiten kann. Ein Mitglied nach deiner Wahl bekommt wie die Gemeinde per Pull Request einen Namespace aus der Vorlage, ein AppProject in Argo CD beschränkt seine Applications auf diesen Namespace.

![Ein eigenes Mitglied mit AppProject. Der Zielzustand von Auftrag B. Oben in Gitea beantragt ein Pull Request den Namespace aus der Vorlage, nach dem Review liegen der Ordner des Mitglieds und das AppProject auf main. In der Mitte holt Argo CD beide aus Git. Die Application des Mitglieds und eine Application zum Test nennen das AppProject, das als Ziel nur den Namespace des Mitglieds erlaubt. Unten im Cluster wendet Argo CD die Application des Mitglieds in seinem Namespace mit eigener Quota und LimitRange an. Achte auf die Application zum Test. Sie will in den Namespace velo eines anderen Mitglieds schreiben und Argo CD lehnt sie ab.](../../../assets/figures/de/p4c6-member.svg)

| Ausgangslage | Ergebnis |
|---|---|
| Aus der Basis hast du im Repo `wolkenwerk/platform` die Vorlage `templates/member` und das ApplicationSet `members`, das für jeden Ordner unter `members` eine Application im Projekt `default` erzeugt (Kapitel 4.5). Die Namespaces `velo` und `gemeinde` haben ihre Grenzen, den Antrag der Gemeinde hast du als Pull Request geprüft und zusammengeführt. Die Praxis und die Treuhand haben noch keinen Namespace. | Ein Mitglied deiner Wahl hat einen eigenen Namespace aus der Vorlage mit Grenzen, die du aus seinem Bedarf hergeleitet hast. Ein AppProject aus Git erlaubt seinen Applications nur diesen Namespace als Ziel. Argo CD lehnt eine Application des Projekts ab, die anderswohin schreiben will. |

### Vorgehen

1. Wähle ein Mitglied ohne Namespace und schätze Zahl, CPU und Speicher seiner Pods.
2. Leite daraus Quota und LimitRange her und rechne alle Quotas gegen den Cluster.
3. Beantrage den Namespace wie die Gemeinde mit einem Pull Request, prüfe ihn und führe ihn zusammen.
4. Entscheide, welche Applications zum Projekt des Mitglieds gehören. Lege das AppProject danach in Git an.
5. Prüfe mit einer Application zum Test, dass Argo CD ein Ziel ausserhalb des Namespaces ablehnt.
6. Halte Bedarf, Rechnung, die Ablehnung und deinen Entscheid zum Projekt für die Dokumentation fest.

### Anforderungen

1. Das Mitglied hat in Teil 4 noch keinen Namespace. Es kommt über einen Pull Request in Gitea, den du prüfst und zusammenführst.
2. Quota und LimitRange haben eigene Werte. Du leitest sie aus dem Bedarf des Mitglieds her und prüfst, ob alle Quotas zusammen zum Cluster passen.
3. Ein AppProject erlaubt als Ziel nur den Namespace dieses Mitglieds. Mindestens eine Application des Mitglieds gehört zu diesem Projekt.
4. Das AppProject liegt in Git und kommt über Argo CD in den Cluster.
5. Argo CD lehnt eine Application des Projekts ab, die in einen anderen Namespace schreiben will.

### Vorführung

- Den Pull Request des Mitglieds mit dem Diff und deiner Begründung der Werte
- Die Grenzen des Mitglieds im Cluster und deine Rechnung für alle Mitglieder
- Das AppProject in Git und die Applications, die dazu gehören
- Eine Application, die Argo CD wegen des Projekts ablehnt, mit dem Grund

:::details[Hinweise aus dem Lab]
- Bevor du den Pull Request öffnest, zeigt dir `kubectl kustomize`, was die Vorlage für dein Mitglied erzeugt
- Den Grund einer Ablehnung zeigt Argo CD in seiner Oberfläche bei der Application
:::

:::details[Quellen]
- [Kapitel 4.5](../templates/#kustomize) mit der Vorlage, dem Patch des Veloateliers und dem Antrag der Gemeinde
- [Kapitel 4.3](../kubernetes/#requests-limits-und-scheduling) zu Requests und Limits
- [Kapitel 3.2](../../tenants/quotas/#quota-und-überbuchung) zu Quotas und Überbuchung
- Die Dokumentation von Kubernetes 1.36 zu [ResourceQuota](https://v1-36.docs.kubernetes.io/docs/concepts/policy/resource-quotas/) und [LimitRange](https://v1-36.docs.kubernetes.io/docs/concepts/policy/limit-range/)
- Die Dokumentation von Argo CD 3.5 mit den Feldern eines AppProject unter [Projects](https://argo-cd.readthedocs.io/en/release-3.5/user-guide/projects/) und einem vollständigen AppProject als Datei unter [Declarative Setup](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/declarative-setup/)
- [Git-Generator](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/applicationset/Generators-Git/) mit der Auswahl und dem Ausschluss von Ordnern in einem ApplicationSet
- [ApplicationSet Security](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/applicationset/Security/) zum Risiko eines Projekts aus der Vorlage
:::

## Schutz des Branches (Auftrag C)

An der Plattform soll niemand etwas ändern, das keine zweite Person angeschaut hat. Auf `main` des Repos `wolkenwerk/platform` kommen Änderungen darum nur noch über einen Pull Request mit Review, Gitea setzt diese Regel selbst durch.

![Der geschützte Branch main. Der Zielzustand von Auftrag C. Links das Plattform-Team mit deinem Konto platform, das zugleich Administrator von Gitea ist. Daneben steht ein zweites Konto mit Schreibrechten. In der Mitte liegt in Gitea das Repo wolkenwerk/platform mit dem geschützten Branch main. Einen direkten Push von platform auf main weist Gitea ab. Ein Pull Request von platform braucht eine Freigabe. Das zweite Konto gibt ihn frei, erst danach führt Gitea ihn in main zusammen. Rechts holt Argo CD im k3s-Cluster main nur lesend und wendet die Änderung an wie bisher. Achte darauf, dass du selbst entscheidest, wer die Regel umgehen darf.](../../../assets/figures/de/p4c6-branch.svg)

| Ausgangslage | Ergebnis |
|---|---|
| Aus der Basis hast du Gitea auf dem Front-end mit dem Administrator `platform`, der Organisation `wolkenwerk` und dem Repo `platform` (Kapitel 4.4). Deine eigenen Änderungen schickst du mit `platform.token` direkt auf `main`, Argo CD liest das Repo mit `argocd.token` und rollt jeden neuen Commit aus. Ausser `platform` gibt es kein Konto, weil sich niemand selbst registrieren kann. | Gitea weist jeden direkten Push auf `main` ab und lässt einen Pull Request erst zusammenführen, wenn ein zweites Konto mit Schreibrechten ihn freigegeben hat. Argo CD rollt die Änderung danach aus wie bisher. Wer die Regel umgehen kann, hast du geprüft und entschieden, ob das so bleibt. |

### Vorgehen

1. Lege fest, wer auf `main` schreiben, freigeben und die Regel umgehen darf, auch für die Pushes der Teile 5 und 6.
2. Lege das zweite Konto an und gib ihm Schreibrechte auf das Repo.
3. Richte die Regel für `main` in den Einstellungen des Repos ein.
4. Prüfe die Regel mit einem direkten Push und mit einem Pull Request, den das zweite Konto freigibt.
5. Prüfe nach dem Merge, dass Argo CD die Änderung ausrollt.
6. Halte die Einstellungen, die Meldungen und deinen Entscheid zur Ausnahme für die Dokumentation fest.

:::caution[Push in den Teilen 5 und 6]
Die Teile 5 und 6 schicken Änderungen mit `git push` direkt auf `main`, mit dem Schutz aus diesem Auftrag weist Gitea sie ab. Entscheide darum vor dem Schutz, ob du dort über Pull Requests arbeitest oder über eine Ausnahme, die du selbst festlegst.
:::

### Anforderungen

1. Gitea weist einen direkten Push auf `main` des Repos `wolkenwerk/platform` ab.
2. Einen Pull Request auf `main` kannst du erst zusammenführen, wenn ein anderes Konto mit Schreibrechten ihn freigegeben hat.
3. Nach dem Merge rollt Argo CD die Änderung wie bisher aus.
4. Du zeigst, wer in deinem Gitea die Regel umgehen könnte. Ob diese Ausnahme bleibt, entscheidest und begründest du.

### Vorführung

- Die Regel für `main` in den Einstellungen des Repos
- Einen direkten Push, den Gitea abweist, mit der Meldung im Terminal
- Einen Pull Request, den Gitea erst nach der Freigabe zusammenführen lässt
- Die Änderung im Cluster nach dem Merge

:::details[Hinweise aus dem Lab]
- Ein weiteres Konto legst du in der Weboberfläche unter «Site Administration» an oder auf dem Front-end mit `sudo -u git gitea --config /etc/gitea/app.ini admin user create`. Ohne `sudo -u git` scheitert der Befehl, weil `/etc/gitea/app.ini` nur für `root` und die Gruppe `git` lesbar ist.
- Für das zweite Konto öffnest du in Firefox mit Ctrl+Shift+P ein privates Fenster. Der Browser hält für Gitea nur eine Anmeldung, das private Fenster hat eine eigene.
:::

:::details[Quellen]
- [Kapitel 4.4](../gitops/#gitea-auf-dem-front-end) zu Gitea ohne Registrierung, in dem nur ein Administrator Konten anlegt
- [Das Repo platform](../gitops/#das-repo-platform) in Kapitel 4.4 mit den Rechten der zwei Tokens
- [Kapitel 4.5](../templates/#der-antrag-der-gemeinde) mit dem Weg eines Antrags
- Die Dokumentation von Gitea 28 mit allen Einstellungen unter [Protected branches](https://docs.gitea.com/usage/access-control/protected-branches/) und den Befehlen für Konten in der [Befehlszeile von Gitea](https://docs.gitea.com/administration/command-line)
:::
