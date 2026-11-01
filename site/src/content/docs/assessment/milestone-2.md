---
title: Meilenstein 2 · Plattform per Code
description: Der Auftrag des zweiten Meilensteins mit den sieben Anforderungen der Basis, den drei Zusatzaufträgen, der Vorführung, dem Inhalt der Abgabe und dem Bewertungsraster.
---

:::assignment
«Der Vorstand will sehen, dass ihr die Plattform jederzeit neu bauen könnt», schreibt Simone Wyss. «Werft sie vor seinen Augen weg und baut sie wieder auf, mit dem Webshop des Veloateliers und dem Platz für ein weiteres Mitglied.»
:::

Meilenstein 2 umfasst Teil 4. In der Basis baust du auf deiner Cloud einen Kubernetes-Cluster aus Code, rollst den Webshop mit GitOps aus und gibst den Mitgliedern Namespaces aus einer Vorlage. In den Zusatzaufträgen baust du die Plattform neu, nimmst ein eigenes Mitglied auf und schützt den Branch `main`. Meilenstein 2 ist eine Einzelarbeit und gehört mit Meilenstein 1 zur Abgabe 1.

## Basis

Alles läuft in deinem eigenen Lab mit deinen persönlichen Parametern aus Kapitel 0.3. Die Basis verlangt sieben Anforderungen.

1. Die beiden VMs des Clusters entstehen mit OpenTofu aus deinem Repo `platform`, `tofu plan` zeigt danach keine Änderungen, und der State liegt nicht in Git.
2. k3s läuft mit Server und Agent und dem Routing host-gw, kubectl arbeitet vom Front-end aus.
3. Gitea läuft auf dem Front-end mit dem privaten Repo `wolkenwerk/platform`, Argo CD liest es mit einem Token, das nur lesen darf.
4. Argo CD rollt den Webshop aus Git aus, du zeigst Self-Heal und eine Änderung über einen Pull Request.
5. Die Namespaces `velo` und `gemeinde` entstehen aus der Vorlage mit ResourceQuota, LimitRange und NetworkPolicy.
6. Die ResourceQuota der Gemeinde hat die Werte aus deinen [persönlichen Werten](../../start/parameters/) und kommt über einen Pull Request.
7. Du zeigst die Quota an ihrer Grenze und die Trennung der Namespaces durch die NetworkPolicy, der Check `m2` ist grün.

Die Dokumentation zeigt zu jeder Anforderung einen Screenshot mit einem oder zwei Sätzen dazu und enthält den Bericht des Checks `m2`. Für den Pull Request genügt ein Screenshot aus Gitea mit dem Diff und dem Merge.

## Zusatzaufträge

Für die drei Zusatzaufträge rechnest du mit vier bis sechs Stunden. Jeder gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../#stufen-der-zusatzaufträge).

### A · Neubau der Plattform

Du baust den Cluster mit `tofu destroy`, `tofu apply` und dem Bootstrap von Argo CD neu, misst die Zeit und zeigst, dass alles aus Git wieder steht. Dabei erklärst du, welche Rolle State und Drift beim Neubau spielen. [Kapitel 4.2](../../platform/opentofu/) zeigt die Befehle. Mit dem Stand von Teil 4 dauerte der Neubau im Lab bis zum laufenden Webshop knapp drei Minuten, starte ihn deshalb früh in der Vorführung und erkläre den Code, während er läuft.

### B · Ein eigenes Mitglied

Ein weiteres Mitglied nach deiner Wahl bekommt per Pull Request einen Namespace aus der Vorlage mit eigenen, begründeten Grenzen. Dazu legst du in Argo CD ein AppProject an, das nur den Namespace dieses Mitglieds erlaubt. [Kapitel 4.5](../../platform/templates/) zeigt die Vorlage, [Kapitel 4.4](../../platform/gitops/) Argo CD.

### C · Schutz des Branches

In Gitea schützt du den Branch `main` so, dass Änderungen nur über einen Pull Request mit Review hineinkommen. Du zeigst, dass ein direkter Push abgewiesen wird. [Kapitel 4.4](../../platform/gitops/) beschreibt Gitea und das Repo `platform`.

## Zusatzaufträge zeigen

Die Zusatzaufträge zeigst du live im Unterricht oder in einem Screencast von höchstens zehn Minuten. Für die Vorführung im Unterricht vereinbarst du selbst einen Termin mit deiner Dozentin oder deinem Dozenten. Der Screencast beginnt mit `cat /etc/cc-lab.env` und dem Bericht des Checks `m2` mit Hash und deinen zwei Fragen, die du in der Vorführung beantwortest.

## Abgabe

Im Ordner `m2/` deines Abgabe-Repos liegen die Dokumentation mit den Screenshots und `platform/`, eine Kopie deines Repos `platform` aus Gitea ohne den Ordner `.git`, ohne State und ohne Tokens. Für die Vorführung kommt der Screencast oder ein Link darauf dazu.

Die Berichte der Checks legst du in `reports/`. Wie das Repo aufgebaut ist und wie du einen Tag setzt, steht in der [Übersicht](../).

## Bewertungsraster

| Anforderung der Basis | Punkte |
|---|---|
| VMs des Clusters aus OpenTofu, Plan ohne Änderungen, State ausserhalb von Git | 3 |
| k3s mit Server, Agent und host-gw, kubectl vom Front-end | 3 |
| Gitea mit privatem Repo, Token mit Leserechten für Argo CD | 3 |
| Webshop mit Argo CD, Self-Heal und Änderung über Pull Request | 3 |
| Namespaces `velo` und `gemeinde` aus der Vorlage | 3 |
| ResourceQuota der Gemeinde mit den persönlichen Werten über Pull Request | 3 |
| Quota an der Grenze und NetworkPolicy gezeigt, Check `m2` | 3 |
| **Basis** | **21** |

| Zusatzauftrag | Punkte |
|---|---|
| A · Neubau der Plattform mit gemessener Zeit | 3 |
| B · Eigenes Mitglied mit AppProject | 3 |
| C · Schutz des Branches `main` | 3 |
| **Zusatz** | **9** |

Meilenstein 2 gibt zusammen höchstens 30 Punkte. Eine Anforderung der Basis gibt 3 Punkte, wenn Bericht und Screenshot sie belegen, und 1 Punkt, wenn sie nur teilweise erfüllt ist. Beantwortest du eine der zwei Fragen nicht oder falsch, bekommt der Zusatzauftrag, zu dem sie gehört, höchstens 1 Punkt.
