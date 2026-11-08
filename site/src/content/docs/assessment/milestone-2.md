---
title: Plattform per Code (Meilenstein 2)
description: Der Auftrag des zweiten Meilensteins mit den sieben Anforderungen der Basis, den drei Zusatzaufträgen, der Vorführung, dem Inhalt der Abgabe und dem Bewertungsraster.
---

:::assignment
«Der Vorstand will sehen, dass ihr die Plattform jederzeit neu bauen könnt», schreibt Simone Wyss. «Werft sie vor seinen Augen weg und baut sie wieder auf, mit dem Webshop des Veloateliers und dem Platz für ein weiteres Mitglied.»
:::

Meilenstein 2 umfasst Teil 4. In der Basis baust du auf deiner Cloud einen Kubernetes-Cluster aus Code, rollst den Webshop mit GitOps aus und gibst den Mitgliedern Namespaces aus einer Vorlage. In den Zusatzaufträgen baust du die Plattform neu, nimmst ein eigenes Mitglied auf und schützt den Branch `main`. Meilenstein 2 gehört mit Meilenstein 1 zur Abgabe 1.

## Basis

Alles läuft in deinem eigenen Lab mit deinen persönlichen Parametern aus Kapitel 0.3. Die Basis umfasst sieben Anforderungen.

1. Die beiden VMs des Clusters entstehen mit OpenTofu aus deinem Repo `platform`, `tofu plan` zeigt danach keine Änderungen. Der State liegt nicht in Git.
2. Der Cluster k3s läuft mit Server und Agent und dem Routing host-gw, kubectl arbeitet vom Front-end aus.
3. Gitea läuft auf dem Front-end mit dem privaten Repo `wolkenwerk/platform`, Argo CD liest es mit einem Token, das nur lesen darf.
4. Argo CD rollt den Webshop aus Git aus, du zeigst Self-Heal und eine Änderung über Git.
5. Die Namespaces `velo` und `gemeinde` entstehen aus der Vorlage mit ResourceQuota, LimitRange und NetworkPolicy.
6. Die ResourceQuota der Gemeinde hat die Grenzen aus deinen [persönlichen Werten](../../start/parameters/#deine-werte-für-die-meilensteine) und kommt über einen Pull Request.
7. Du zeigst die Quota an ihrer Grenze und die Trennung der Namespaces durch die NetworkPolicy, der Check `m2` ist grün.

Die Basis belegst du mit dem Bericht des Checks `m2` und mit einem Screenshot zu jeder Anforderung, dessen Dateiname mit ihrer Nummer beginnt. Den Bericht erzeugt `python3 ~/cc/checks/check.py m2` auf dem Front-end. Für den Pull Request genügt ein Screenshot aus Gitea mit dem Diff und dem Merge. Für das Token zeigt der Screenshot die Antwort der API von Gitea mit den `scopes` des Tokens `argocd`, wie Kapitel 4.4 sie abfragt.

## Zusatzaufträge

Für die drei Zusatzaufträge rechnest du mit vier bis sechs Stunden. Jeder gibt 0 bis 3 Punkte nach den [Stufen der Zusatzaufträge](../#stufen-der-zusatzaufträge). Zu jedem Auftrag, den du machst, gehört eine [Dokumentation in fünf Teilen](../#dokumentation-der-zusatzaufträge). Die Begriffe dazu und die Anforderungen an jeden Auftrag stehen in [Kapitel 4.6](../../platform/advanced/).

### Neubau der Plattform (Auftrag A)

Du reisst den Cluster mit `tofu destroy` ab, baust ihn mit `tofu apply` und dem Bootstrap von Argo CD neu auf und misst die Zeit vom Start des Abrisses bis zur ersten Antwort des Webshops. Dabei erklärst du, was State und Drift für den Neubau bedeuten. Im Lab lief der Webshop mit dem Stand von Teil 4 nach knapp drei Minuten wieder. Starte den Neubau deshalb früh in der Vorführung und erkläre den Code, während er läuft. [Kapitel 4.6](../../platform/advanced/#neubau-der-plattform-auftrag-a) beschreibt den Auftrag.

### Ein eigenes Mitglied (Auftrag B)

Ein weiteres Mitglied nach deiner Wahl bekommt per Pull Request einen Namespace aus der Vorlage mit eigenen, begründeten Grenzen. Dazu legst du in Argo CD ein AppProject an, das nur den Namespace dieses Mitglieds erlaubt. [Kapitel 4.6](../../platform/advanced/#ein-eigenes-mitglied-auftrag-b) beschreibt den Auftrag, die Vorlage kennst du aus Kapitel 4.5.

### Schutz des Branches (Auftrag C)

In Gitea schützt du den Branch `main` so, dass Änderungen nur über einen Pull Request mit Review hineinkommen. Du zeigst, dass Gitea einen direkten Push abweist. [Kapitel 4.6](../../platform/advanced/#schutz-des-branches-auftrag-c) beschreibt den Auftrag.

## Zusatzaufträge zeigen

Die Zusatzaufträge zeigst du live im Unterricht oder in einem Screencast von höchstens zehn Minuten. Für die Vorführung im Unterricht vereinbarst du selbst einen Termin mit deiner Dozentin oder deinem Dozenten. Sie muss bis zur Abgabe 1 stattfinden. Der Screencast beginnt mit `cat /etc/cc-lab.env` und dem Bericht des Checks `m2` mit Hash und deinen zwei Fragen, die du in der Vorführung beantwortest.

## Abgabe

Im Ordner `m2/` deines Abgabe-Repos liegen die Screenshots der Basis. Für die Zusatzaufträge kommen ihre Dokumentation und `platform/` dazu, eine Kopie deines Repos `platform` aus Gitea ohne den Ordner `.git`, ohne State, Tokens und Passwörter. Für eine Vorführung im Screencast kommt sein Link dazu.

Die Berichte der Checks legst du in `reports/`. Wie das Repo aufgebaut ist und wie du einen Tag setzt, steht unter [Abgeben](../#abgeben).

## Bewertungsraster

| Anforderung der Basis | Punkte |
|---|---|
| VMs des Clusters aus OpenTofu, Plan ohne Änderungen, State ausserhalb von Git | 3 |
| k3s mit Server, Agent und host-gw, kubectl vom Front-end | 3 |
| Gitea mit privatem Repo, Token mit Leserechten für Argo CD | 3 |
| Webshop mit Argo CD, Self-Heal und Änderung über Git | 3 |
| Namespaces `velo` und `gemeinde` aus der Vorlage | 3 |
| ResourceQuota der Gemeinde mit den persönlichen Werten über Pull Request | 3 |
| Quota an der Grenze und NetworkPolicy gezeigt, Check `m2` | 3 |
| **Basis** | **21** |

| Zusatzauftrag | Punkte |
|---|---|
| Neubau der Plattform mit gemessener Zeit (Auftrag A) | 3 |
| Eigenes Mitglied mit AppProject (Auftrag B) | 3 |
| Schutz des Branches `main` (Auftrag C) | 3 |
| **Zusatz** | **9** |

Meilenstein 2 gibt zusammen höchstens 30 Punkte. Eine Anforderung der Basis gibt 3 Punkte, wenn Bericht und Screenshot sie belegen, 2 Punkte bei grünem Check ohne passenden Screenshot und 1 Punkt, wenn sie nur teilweise erfüllt ist. Jede der zwei Fragen, die du nicht oder falsch beantwortest, kostet 1 Punkt der Zusatzaufträge. Fehlt die Dokumentation oder einer ihrer Teile 1, 2, 4 und 5, gibt ein Zusatzauftrag höchstens 1 Punkt.
