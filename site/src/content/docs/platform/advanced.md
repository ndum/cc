---
title: Zusatzaufträge
description: Die drei Zusatzaufträge von Meilenstein 2 mit dem Neubau der Plattform als Übung, einem eigenen Mitglied mit AppProject und dem Schutz des Branches main in Gitea.
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

## Eigene Lösungen

Die drei Aufträge in diesem Kapitel sind die Zusatzaufträge von [Meilenstein 2](../../assessment/milestone-2/). Für die Basis brauchst du sie nicht. Anders als in den Kapiteln 4.1 bis 4.5 findest du hier keine Befehle zum Abtippen und keine fertigen Dateien. Du entwirfst die Lösung selbst, baust sie in deinem Lab und begründest, warum du sie so gebaut hast. Die Abschnitte vor den Aufträgen erklären die Begriffe und Abwägungen, die du dafür brauchst. Bei jedem Auftrag findest du die Anforderungen an deine Lösung und Hinweise auf die Dokumentation.

Für alle drei Aufträge zusammen rechnest du mit vier bis sechs Stunden. Du kannst auch nur einzelne bearbeiten, denn jeder gibt für sich 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../../assessment/#stufen-der-zusatzaufträge). Ein Auftrag, der läuft, gibt 1 Punkt. Erklärst du ihn an deinem eigenen Lab mit deinen Werten und Ausgaben, gibt er 2 Punkte. Für 3 Punkte begründest du zusätzlich einen eigenen Entscheid mit einer Alternative und einer Abwägung. Die Abschnitte unten nennen darum oft mehr als einen Weg.

Du zeigst die Aufträge live im Unterricht oder in einem Screencast von höchstens zehn Minuten, wie es die Seite des Meilensteins beschreibt. Dabei beantwortest du auch die zwei Fragen aus dem Bericht des Checks `m2`. KI-Assistenten darfst du nach den [Regeln des Kurses](../../start/overview/#ki-werkzeuge) einsetzen. Wofür du sie genutzt hast, hältst du in der Dokumentation fest. In der Vorführung erklärst du jede Zeile, die du zeigst, selbst.

## Den Neubau üben

In Kapitel 4.1 wünschte sich Simone Wyss eine Plattform, die sich jederzeit aus dem Code neu bauen lässt. Ob der Code das hergibt, zeigt erst ein Neubau. Ein Schritt, den jemand einmal von Hand gemacht hat, oder ein Wert, der nur in einem alten Terminal stand, fällt sonst erst auf, wenn die Plattform weg ist.

Betriebe üben den Ernstfall deshalb, bevor er eintritt. Eine solche Übung folgt einem festen Ablauf. Jemand misst die Zeit und schreibt auf, was nicht klappte. Danach verbessert das Team den Ablauf und wiederholt die Übung.

Die gemessene Zeit sagt, wie lange der Webshop nach einem Totalausfall mindestens stillsteht. Solange der Neubau der einzige Weg zurück ist, kann Wolkenwerk dem Veloatelier keine kürzere Ausfallzeit versprechen. [Kapitel 6.2](../../operations/backup/#rpo-und-rto) nennt dieses Versprechen RTO.

Den Ablauf hältst du als Runbook oder als Skript fest. Ein Runbook ist eine Liste von Schritten für Menschen, mit Prüfungen dazwischen. Ein Skript führt dieselben Schritte jedes Mal gleich aus und kann die Zeit nebenbei messen. Bricht es mitten im Neubau ab, muss aber jemand herausfinden, wo es stand. Eine Gesamtzeit allein sagt wenig. Erst die Zeit jedes Schritts zeigt, wo die Minuten liegen, beim Abriss, beim Start der VMs, bei Kubernetes oder bei Argo CD.

## Code, State und Handarbeit

Ein Neubau bringt genau das zurück, was der Code beschreibt. Die VMs, das Startskript, die Applications, die Vorlage und die Mitglieder stehen im Repo `platform` und entstehen wieder. Was der Code nur liest, das Netz `cc-net` und das Image, lässt der Abriss stehen. Gitea mit dem Repo liegt auf dem Front-end, wo Kapitel 4.4 es installiert hat, damit es während eines Neubaus weiterläuft.

Der State liegt neben dem Code auf dem Front-end, aber nicht in Git. `tofu destroy` löscht genau die Objekte, die er aufführt. `tofu apply` legt sie danach mit neuen Nummern wieder an. Werte, die OpenTofu selbst erzeugt, wie das Token von k3s, sind danach neu.

Verloren ist alles, was nur im Cluster existierte. Dazu gehören Daten, die Pods auf die Disk eines Nodes geschrieben haben, sowie jedes Objekt, das jemand mit `kubectl` an Git vorbei angelegt hat. Auch was auf dem Front-end zum alten Cluster gehörte, passt nicht mehr zum neuen. Kapitel 4.3 nennt dafür die Schlüssel für SSH und die kubeconfig. Skripte wie der Bootstrap aus Kapitel 4.4 legen einiges neu an, das nicht in Git steht, etwa das Secret mit dem Token für Gitea. In Kapitel 6.2 kommt die Frage mit Backups wieder.

## Drift vor dem Neubau

Vor dem Abriss zeigt eine Drift, was der Neubau verändern wird. Bei den VMs vergleicht `tofu plan` den Code mit dem Ist-Zustand in OpenNebula, allerdings nur die Attribute, die der Provider kennt. Änderungen in einer VM selbst bleiben unsichtbar. Eine VM, die jemand neben dem Code von Hand angelegt hat, steht in keinem State. `tofu destroy` lässt sie stehen und sie belegt weiter Speicher auf einem Knoten, der schon in Kapitel 4.2 knapp war.

Im Cluster setzt Argo CD mit Self-Heal jede Abweichung zurück, aber nur bei Objekten, die aus Git kommen. Ein Objekt, das jemand an Git vorbei angelegt hat, lässt Argo CD in Ruhe, bis der Neubau es entfernt. Nach einem Neubau ist im Cluster darum jede Drift weg, auch eine Korrektur von Hand, die nie in Git ankam. Wer vor dem Abriss sucht, findet sie noch. `tofu plan` vergleicht die VMs, Argo CD zeigt für jede Application, ob der Cluster vom Repo abweicht.

## Grenzen für ein Mitglied

Die Werte der Gemeinde kamen aus deinen persönlichen Parametern. Für ein eigenes Mitglied leitest du sie selbst her. Ausgangspunkt ist, was das Mitglied betreiben will. Dazu gehören die Zahl der Pods, CPU und Speicher für jeden davon und die Frage, ob es Dateien speichert. Daraus folgen Requests und Limits der Quota. Die LimitRange muss dem grössten Container erlauben, was er braucht, sonst lehnt Kubernetes ihn ab, obwohl die Quota noch Platz hätte. Ihre Standardwerte gelten für jeden Container ohne eigene Angaben.

Danach rechnest du gegen den Cluster. Die zwei VMs haben zusammen 8 vCPU und 12 GB, einen Teil davon brauchen k3s und Argo CD selbst. In Teil 5 kommen Prometheus und Loki dazu, als Zusatz auch ein Sprachmodell. Wie bei den Quotas in Kapitel 3.2 darf die Summe der Limits grösser sein als der Cluster. Bei den Requests ist das riskanter, denn der Scheduler startet keinen Pod mehr, wenn die reservierten Werte die Nodes füllen. Eine Begründung nennt den Bedarf, die Rechnung und was bei einer Spitze geschieht, wenn das Mitglied an seine Grenze stösst.

## AppProjects

Bisher gehören alle Applications des Kurses zum Projekt `default`. Es erlaubt jede Quelle, jedes Ziel und jede Art von Objekt. Ein AppProject legt engere Regeln für die Applications fest, die es nennen. Es bestimmt, aus welchen Repos sie lesen, in welche Cluster und Namespaces sie schreiben und welche Arten von Objekten sie anlegen dürfen. Ziele lassen sich auch ausschliessen, eine Regel mit `!` verbietet etwa einen bestimmten Namespace.

Bei den Arten von Objekten trennt ein AppProject zwei Gruppen. Deployments oder ResourceQuotas gehören zu einem Namespace. Andere Objekte gehören zum ganzen Cluster, darunter das Objekt Namespace selbst. Für diese zweite Gruppe führt ein AppProject eine Liste der erlaubten Arten, alles andere ist verboten. Die Vorlage aus Kapitel 4.5 legt den Namespace eines Mitglieds als eigenes Objekt an. In einem Projekt, das diese Art nicht erlaubt, kann die Application der Vorlage ihren Namespace deshalb nicht anlegen.

Für Objekte in einem Namespace kann ein Projekt einzelne Arten verbieten. Die Dokumentation von Argo CD zeigt ein Projekt, das alles erlaubt ausser ResourceQuota, LimitRange und NetworkPolicy. Eine Application in einem solchen Projekt kann die Grenzen ihres Namespaces nicht verändern.

Daraus folgt ein Entscheid. Entweder gehört die Application, die den Namespace aus der Vorlage baut, zum Projekt des Mitglieds. Oder sie bleibt beim Plattform-Team und das Mitglied bekommt für seine eigenen Anwendungen eine zweite Application in seinem Projekt. AppProjects liegen wie die Applications im Namespace `argocd` und können darum ebenso aus Git kommen.

## Projekt und ApplicationSet

Das ApplicationSet `members` aus Kapitel 4.5 schreibt in jede Application, die es erzeugt, `project: default`. Ein AppProject für ein Mitglied wirkt erst, wenn dessen Application es nennt. Dafür gibt es mehrere Wege. Das ApplicationSet kann den Namen des Projekts aus dem Namen des Ordners bilden. Dann braucht jedes Mitglied ein eigenes Projekt. Der Git-Generator kann auch einen Ordner ausschliessen, sodass eine eigene Application das neue Mitglied beschreibt. Oder die Application der Vorlage bleibt unverändert und nur die Anwendungen des Mitglieds bekommen ein Projekt.

Welcher Weg sicher ist, hängt davon ab, wer das Repo ändern darf. Die Dokumentation von Argo CD warnt vor einem Projekt, das aus der Vorlage eines ApplicationSets stammt. Wer Ordner im Repo anlegen darf, könnte damit Applications in einem Projekt mit zu vielen Rechten erzeugen. Beim Git-Generator genügt dafür ein Pull Request. Die Dokumentation verlangt darum, dass Administratoren solche Pull Requests freigeben. Ein Projekt mit Zugriff auf den Namespace `argocd` hat zudem faktisch die Rechte eines Administrators. Ein AppProject schützt also nur so gut, wie die Änderungen am Repo geprüft werden. Diese Prüfung ist das Thema von Auftrag C.

## Branch-Schutz in Gitea

Im Repo `wolkenwerk/platform` ist `main` der Soll-Zustand des Clusters. Argo CD fragt jede Minute ab und rollt jeden neuen Commit aus. Bisher prüft das Plattform-Team die Anträge der Mitglieder als Pull Request, seine eigenen Änderungen schickt es mit `git push` direkt auf `main`. Gitea lässt jeden Push mit Schreibrechten auf `main` zu, ob ihn jemand geprüft hat oder nicht.

Ein geschützter Branch macht die Prüfung zu einer Regel, die Gitea selbst durchsetzt, auch im Editor der Weboberfläche und über die API. Gitea kann den direkten Push ganz sperren oder nur einer Liste von Konten erlauben. Es kann eine Zahl von Freigaben verlangen, bevor ein Pull Request zusammengeführt werden darf. Dabei zählen die Reviews aller Konten mit Schreibrechten, ausser du beschränkst sie auf eine Liste. Weitere Einstellungen verwerfen alte Freigaben nach neuen Commits, sperren den Merge nach einer Ablehnung oder schützen einzelne Dateien besonders. Für `templates/member` kann das sinnvoll sein, weil eine Änderung dort alle Mitglieder trifft. Status Checks einer CI gibt es im Lab nicht.

## Ausnahmen von der Regel

Ein Review braucht eine zweite Person. Wer einen Pull Request geöffnet hat, kann ihn in Gitea nicht selbst freigeben. Im Lab spielst du beide Rollen und brauchst darum ein zweites Konto mit Schreibrechten. Weil sich niemand selbst registrieren kann, legt ein Administrator es an.

Das Konto `platform` ist der Administrator deines Gitea und besitzt die Organisation `wolkenwerk`. Administratoren eines Repos können einen Pull Request ohne die nötigen Freigaben mit «Force merge» zusammenführen, solange die Einstellung «Administrators must follow branch protection rules» nicht gesetzt ist. Ob das Plattform-Team diese Hintertür behält, ist eine Abwägung.

Der Schutz gilt auch im Notfall. Fällt der Webshop an einem Samstag aus und wartet die Korrektur auf ein Review, dauert der Ausfall länger. Teams halten darum oft einen dokumentierten Notfallweg bereit, den sie selten nutzen und danach prüfen. Auch der Kurs verlangt eine solche Abwägung. Die Teile 5 und 6 schicken Änderungen mit `git push` direkt auf `main`. Mit einem geschützten Branch geht das nur noch über Pull Requests oder über eine Ausnahme, die du selbst festlegst. Argo CD liest das Repo nur und merkt vom Schutz nichts.

## Auftrag A · Neubau der Plattform

Du reisst die Plattform ab, baust sie allein aus dem Code wieder auf und misst, wie lange der Webshop des Veloateliers dabei ausfällt. Danach weist du nach, dass alles aus Git zurück ist. Dabei erklärst du, was State und Drift für den Neubau bedeuten.

Deine Lösung erfüllt diese Anforderungen:

1. Nach dem Abriss mit `tofu destroy` entsteht die Plattform allein aus deinem Code und dem Repo in Gitea. Ausser dem Bootstrap von Argo CD legst du im Cluster nichts von Hand an.
2. Du misst die Zeit vom Start des Abrisses bis zur ersten Antwort des Webshops und hältst die Zeit jedes Schritts fest.
3. Nach dem Neubau zeigt `tofu plan` keine Änderungen. Alle Applications sind `Synced` und `Healthy` und die Namespaces der Mitglieder haben wieder ihre Grenzen.
4. Der Ablauf steht in einem kurzen Runbook oder in einem Skript, mit dem eine andere Person den Neubau wiederholen könnte.
5. Du erklärst an deinem Lab, welche Rolle der State beim Abriss spielt, was mit einer Änderung von Hand geschieht und was der Neubau nicht zurückbringt.

In der Vorführung zeigst du:

- Den Stand vor dem Abriss mit `tofu plan` und den Applications in Argo CD
- Abriss und Neubau mit deinem Runbook oder Skript und der laufenden Zeitmessung
- Die Plattform nach dem Neubau mit Webshop, Applications, Grenzen und `tofu plan`
- Deine Zeiten pro Schritt und was du daraus schliesst

[Kapitel 4.1](../iac/#state) erklärt State, Plan und Drift. [Kapitel 4.2](../opentofu/#ändern-ersetzen-und-neu-bauen) wendet `tofu plan` und `tofu apply` auf die VMs des Clusters an. Was sich nach einem neuen Cluster auf dem Front-end ändert, steht in [Kapitel 4.3](../kubernetes/#die-kubeconfig). Den Bootstrap beschreibt [Kapitel 4.4](../gitops/#argo-cd). Die Dokumentation von OpenTofu 1.13 erklärt [`tofu destroy`](https://opentofu.org/docs/v1.13/cli/commands/destroy/), den [State](https://opentofu.org/docs/v1.13/language/state/) und die [Modi von `tofu plan`](https://opentofu.org/docs/v1.13/cli/commands/plan/), darunter den Modus `-refresh-only`, der den State an Änderungen ausserhalb von OpenTofu anpasst. Das Muster App of Apps, auf dem der Bootstrap beruht, beschreibt die [Dokumentation von Argo CD 3.5](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/cluster-bootstrapping/).

Im Lab dauerte der Neubau mit dem Stand von Teil 4 knapp drei Minuten, bis der Webshop wieder lief. Starte ihn deshalb früh in der Vorführung und erkläre deinen Code, während er läuft. Gitea auf dem Front-end bleibt in dieser Zeit erreichbar.

## Auftrag B · Ein eigenes Mitglied

Ein weiteres Mitglied nach deiner Wahl bekommt einen Namespace aus der Vorlage, mit Grenzen, die zu seinem Bedarf passen. Wie die Gemeinde kommt es über einen Pull Request. Ein AppProject in Argo CD sorgt dafür, dass seine Applications nur in seinen eigenen Namespace schreiben.

Deine Lösung erfüllt diese Anforderungen:

1. Das Mitglied hat in Teil 4 noch keinen Namespace. Es kommt über einen Pull Request in Gitea, den du prüfst und zusammenführst.
2. Quota und LimitRange haben eigene Werte. Du leitest sie aus dem Bedarf des Mitglieds her und prüfst, ob alle Quotas zusammen zum Cluster passen.
3. Ein AppProject erlaubt als Ziel nur den Namespace dieses Mitglieds. Mindestens eine Application des Mitglieds gehört zu diesem Projekt.
4. Das AppProject liegt in Git und kommt über Argo CD in den Cluster.
5. Argo CD lehnt eine Application des Projekts ab, die in einen anderen Namespace schreiben will.

In der Vorführung zeigst du:

- Den Pull Request des Mitglieds mit dem Diff und deiner Begründung der Werte
- Die Grenzen des Mitglieds im Cluster und deine Rechnung für alle Mitglieder
- Das AppProject in Git und die Applications, die dazu gehören
- Eine Application, die Argo CD wegen des Projekts ablehnt, mit dem Grund

Die Vorlage, den Patch des Veloateliers und den Antrag der Gemeinde kennst du aus [Kapitel 4.5](../templates/#kustomize). Mit `kubectl kustomize` siehst du, was die Vorlage für dein Mitglied erzeugt, bevor du den Pull Request öffnest. Requests und Limits erklärt [Kapitel 4.3](../kubernetes/#requests-limits-und-scheduling), Quotas und Überbuchung [Kapitel 3.2](../../tenants/quotas/#quota-und-überbuchung). Die Dokumentation von Kubernetes 1.36 beschreibt [ResourceQuota](https://v1-36.docs.kubernetes.io/docs/concepts/policy/resource-quotas/) und [LimitRange](https://v1-36.docs.kubernetes.io/docs/concepts/policy/limit-range/).

Für Argo CD 3.5 stehen die Felder eines AppProject unter [Projects](https://argo-cd.readthedocs.io/en/release-3.5/user-guide/projects/), ein vollständiges AppProject als Datei zeigt [Declarative Setup](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/declarative-setup/). Wie der Git-Generator Ordner auswählt und ausschliesst, erklärt die Seite zum [Git-Generator](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/applicationset/Generators-Git/). Das Risiko eines Projekts aus der Vorlage beschreibt [ApplicationSet Security](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/applicationset/Security/). Den Grund einer Ablehnung zeigt Argo CD in seiner Oberfläche bei der Application.

## Auftrag C · Schutz des Branches

Im Repo `wolkenwerk/platform` kommen Änderungen nur noch über einen Pull Request mit Review auf `main`. Gitea setzt diese Regel selbst durch und weist einen direkten Push ab. Welche Ausnahmen es geben darf, entscheidest und begründest du.

Deine Lösung erfüllt diese Anforderungen:

1. Gitea weist einen direkten Push auf `main` des Repos `wolkenwerk/platform` ab.
2. Einen Pull Request auf `main` kannst du erst zusammenführen, wenn ein anderes Konto mit Schreibrechten ihn freigegeben hat.
3. Nach dem Merge rollt Argo CD die Änderung wie bisher aus.
4. Du zeigst, wer in deinem Gitea die Regel umgehen könnte. Ob diese Ausnahme bleibt, entscheidest und begründest du.

In der Vorführung zeigst du:

- Die Regel für `main` in den Einstellungen des Repos
- Einen direkten Push, den Gitea abweist, mit der Meldung im Terminal
- Einen Pull Request, den Gitea erst nach der Freigabe zusammenführen lässt
- Die Änderung im Cluster nach dem Merge

Seit [Kapitel 4.4](../gitops/#gitea-auf-dem-front-end) läuft Gitea mit ausgeschalteter Registrierung, Konten legt nur ein Administrator an. Welche Rechte die zwei Tokens haben, steht im Abschnitt [Das Repo platform](../gitops/#das-repo-platform). Den Weg eines Antrags zeigt [Kapitel 4.5](../templates/#der-antrag-der-gemeinde). Die Dokumentation von Gitea 28 beschreibt alle Einstellungen unter [Protected branches](https://docs.gitea.com/usage/access-control/protected-branches/). Ein weiteres Konto legst du in der Weboberfläche unter «Site Administration» an oder mit `gitea admin user create`, das die [Befehlszeile von Gitea](https://docs.gitea.com/administration/command-line) beschreibt.

Wie du nach dem Schutz in den Teilen 5 und 6 weiterarbeitest, legst du vorher fest.
