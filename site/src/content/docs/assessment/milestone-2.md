---
title: Meilenstein 2 · Plattform per Code
description: Der Auftrag des zweiten Meilensteins mit den verlangten Funktionen, dem Ablauf des Screencasts, dem Inhalt der Abgabe und dem Bewertungsraster.
---

:::assignment
«Der Vorstand will sehen, dass ihr die Plattform jederzeit neu bauen könnt», schreibt Simone Wyss. «Werft sie vor seinen Augen weg und baut sie wieder auf, mit dem Webshop des Veloateliers und dem Platz für ein weiteres Mitglied.»
:::

Meilenstein 2 umfasst Teil 4. Du baust auf deiner Cloud einen Kubernetes-Cluster aus Code, rollst den Webshop mit GitOps aus, gibst den Mitgliedern Namespaces aus einer Vorlage und erklärst deine Entscheide. Meilenstein 2 ist eine Einzelarbeit und gehört mit Meilenstein 1 zur Abgabe 1.

## Verlangte Funktionen

Alles läuft in deinem eigenen Lab mit deinen persönlichen Parametern aus Kapitel 0.3.

1. Die beiden VMs des Clusters entstehen mit OpenTofu aus deinem Repo `platform`, `tofu plan` zeigt danach keine Änderungen, und der State liegt nicht in Git.
2. k3s läuft mit Server und Agent, eigenen Bereichen für Pods und Services und dem Routing host-gw, kubectl arbeitet vom Front-end aus.
3. Gitea läuft auf dem Front-end mit dem privaten Repo `wolkenwerk/platform`, Argo CD liest es mit einem Token, das nur lesen darf.
4. Argo CD rollt den Webshop aus Git aus, du zeigst Self-Heal und eine Änderung über Git.
5. Die Namespaces `velo` und `gemeinde` entstehen aus der Vorlage mit ResourceQuota, LimitRange und NetworkPolicy, die Gemeinde per Pull Request und mit der ResourceQuota aus deinen [persönlichen Werten](../../start/parameters/).
6. Ein weiteres Mitglied nach deiner Wahl bekommt per Pull Request einen Namespace mit eigenen, begründeten Grenzen.
7. Du zeigst die Quota an ihrer Grenze und die Trennung der Namespaces durch die NetworkPolicy.
8. Du baust den Cluster mit `tofu destroy`, `tofu apply` und dem Bootstrap von Argo CD neu, und alles aus Git steht wieder, der Check `m2` ist grün.

## Eigene Erweiterung

Zu den Funktionen gehört eine Erweiterung, die über den Kurs hinausgeht. Sie soll zu Wolkenwerk passen und in deinem Lab laufen. Eigene Ideen sind willkommen, die Liste hilft beim Einstieg.

- ein AppProject in Argo CD pro Mitglied, das nur dessen Namespace erlaubt
- Branch-Schutz in Gitea, der für `main` einen Pull Request verlangt
- ein Ingress mit eigenem Hostnamen für die App eines Mitglieds
- ein Overlay mit Kustomize für eine Testumgebung des Webshops

Die Erweiterung gibt bis zu 3 Punkte. 1 Punkt gibt es, wenn sie läuft, 2, wenn du sie im README begründest, und 3, wenn du sie im Screencast vorführst und ihre Grenzen beurteilst.

## Erklärungen und Entscheide

Im README von Meilenstein 2 und im Screencast erklärst du

- die Architektur deiner Plattform mit einer eigenen Zeichnung von OpenNebula, den VMs des Clusters, Gitea, Argo CD und den Namespaces,
- den Unterschied zwischen deinem Klickpfad aus Teil 2 und dem Code von Teil 4, mit State, Drift und Idempotenz,
- warum der Cluster eigene Adressbereiche, das Routing host-gw und je 6 GB braucht,
- warum Gitea ausserhalb des Clusters läuft und wer welche Rechte hat,
- wie du die Grenzen deines eigenen Mitglieds festgelegt hast und ob die Summe der Quotas zum Cluster passt,
- was beim Ausfall des Servers geschieht und was es für eine höhere Verfügbarkeit bräuchte.

Weichst du von den Werten des Kurses ab, etwa bei Speicher, Quotas oder der Vorlage, begründest du das. Eigene Entscheide geben mehr Punkte als übernommene Werte.

## Screencast

Der Screencast dauert höchstens zehn Minuten in einer einzigen Aufnahme. Ein Vorschlag für den Ablauf.

| Minuten | Was du zeigst |
|---|---|
| 0 bis 1 | `/etc/cc-lab.env`, den Bericht des Checks `m2` mit Hash und deine Zeichnung |
| 1 bis 2 | `tofu destroy` und `tofu apply` starten, während der Cluster entsteht, das Repo in Gitea |
| 2 bis 4 | `main.tf` und das Startskript, Adressbereiche und host-gw |
| 4 bis 5 | Bootstrap von Argo CD, die Applications kommen zurück |
| 5 bis 6 | Webshop im Browser, Self-Heal, eine Änderung über Git |
| 6 bis 8 | Vorlage, Pull Request deines eigenen Mitglieds, Quota an der Grenze, NetworkPolicy |
| 8 bis 10 | `tofu plan` ohne Änderungen, die zwei Fragen aus dem Bericht, deine Erweiterung und eigene Entscheide |

Mit dem Stand von Teil 4 dauerte der Neubau im Lab bis zum laufenden Webshop knapp drei Minuten. Starte ihn früh in der Aufnahme und erkläre den Code, während er läuft. Zeigst du Meilenstein 2 live im Unterricht, gilt derselbe Ablauf.

## Abgabe

Im Ordner `m2/` deines Abgabe-Repos liegen

- `README.md` mit Zeichnung, Erklärungen, Entscheiden und deinem Einsatz von KI,
- `platform/`, eine Kopie deines Repos `platform` aus Gitea ohne den Ordner `.git`, ohne State und ohne Tokens,
- der Screencast oder ein Link darauf.

Die Berichte der Checks legst du in `reports/`. Wie das Repo aufgebaut ist und wie du einen Tag setzt, steht in der [Übersicht](../).

## Bewertungsraster

| Kriterium | Punkte |
|---|---|
| VMs des Clusters aus OpenTofu, Plan ohne Änderungen, State ausserhalb von Git | 2 |
| k3s mit eigenen Adressbereichen und host-gw, kubectl vom Front-end | 2 |
| Gitea mit privatem Repo, Token mit Leserechten für Argo CD | 2 |
| Webshop mit Argo CD, Self-Heal und Änderung über Git | 2 |
| Namespaces aus der Vorlage, Gemeinde mit den persönlichen Werten, Quota und NetworkPolicy gezeigt | 2 |
| Eigenes Mitglied mit eigenen Grenzen | 2 |
| Neubau des Clusters, alles aus Git wieder da, Check `m2` | 3 |
| Eigene Erweiterung | 3 |
| **Funktionen** | **18** |
| Architektur mit eigener Zeichnung | 3 |
| Klickpfad und Code, State, Drift und Idempotenz erklärt | 3 |
| Adressbereiche, Speicher und Ort von Gitea begründet | 3 |
| Grenzen des eigenen Mitglieds, Summe der Quotas und Ausfall des Servers begründet | 3 |
| **Erklärungen und Entscheide** | **12** |
| **Total** | **30** |

Die Funktionen mit der Erweiterung ergeben 60 % der Punkte, die Erklärungen und Entscheide 40 %. Jedes Erklärungskriterium bewertet deine Dozentin oder dein Dozent nach den [Stufen 0 bis 3](../#stufen-der-erklärungen). Beantwortest du eine der zwei Fragen aus dem Bericht nicht oder falsch, bekommt das Kriterium, zu dem sie gehört, höchstens 1 Punkt. Die Note der Abgabe 1 berechnet deine Dozentin oder dein Dozent aus den Punkten von Meilenstein 1 und 2 nach den Regeln der Schule.
