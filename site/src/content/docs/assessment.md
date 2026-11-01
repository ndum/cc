---
title: Leistungsbeurteilung
description: Wie die vier Meilensteine zwei Noten ergeben, wie du einen Meilenstein zeigst und abgibst und wie dein Abgabe-Repo aufgebaut ist.
---

Deine Modulnote setzt sich aus vier Meilensteinen zusammen. Je zwei davon gibst du gemeinsam ab, und jede Abgabe ergibt eine Note.

| Abgabe | Meilensteine | Gewicht |
|---|---|---|
| Abgabe 1 | Meilenstein 1 IaaS für Wolkenwerk und Meilenstein 2 Plattform per Code | 50 % |
| Abgabe 2 | Meilenstein 3 Observability, Skalierung und KI und Meilenstein 4 ein eigenes Mitglied | 50 % |

Die Modulnote ist der Durchschnitt der beiden Noten. Die Termine der Abgaben, den Weg der Abgabe und die Regeln zu Verspätungen erhältst du von deiner Dozentin oder deinem Dozenten.

## Die Meilensteine

Jeder Meilenstein ist eine Einzelarbeit in deinem eigenen Lab. Die Aufträge der Meilensteine erscheinen mit den Teilen, zu denen sie gehören. [Meilenstein 1](milestone-1/) gehört zu Teil 2 und Teil 3, [Meilenstein 2](milestone-2/) zu Teil 4, [Meilenstein 3](milestone-3/) zu Teil 5 und [Meilenstein 4](milestone-4/) zu Teil 6. In Meilenstein 4 entwirfst du ein fünftes Mitglied von Wolkenwerk Bern selbst und bringst es auf deine Plattform.

Jeder Meilenstein hat ein Bewertungsraster mit 30 Punkten. 15 Punkte gibt es für die Funktionen, die der Auftrag verlangt, 3 für eine eigene Erweiterung über den Kurs hinaus und 12 für deine Erklärungen und die Begründung deiner Entscheide. Das sind 60 % für das, was läuft, und 40 % für das, was du verstanden hast.

## Persönliche Werte und Fragen

Einige Werte, die ein Meilenstein verlangt, kommen aus deinem persönlichen Code, etwa die Quota der Gemeinde oder das Ziel des SLO. Der [Parameter-Generator](../start/parameters/) zeigt sie dir unter dem Inhalt von `/etc/cc-lab.env`. Zu jedem Meilenstein gibt es einen eigenen Check, `m1` bis `m4`. Er führt den Check des Teils aus, prüft deine persönlichen Werte und zieht aus deinem Code zwei Fragen aus einem Pool von sechs. Die Fragen beantwortest du im Screencast an deinem eigenen Lab.

Hilfe von anderen ist erlaubt, und eine Lösung zu besprechen, gehört zum Lernen. Deine persönlichen Werte und deine Fragen zeigen aber, ob du deine Lösung selbst verstehst.

## Stufen der Erklärungen

Jedes Erklärungskriterium gibt 0 bis 3 Punkte. Die Stufen gelten für alle Meilensteine.

| Punkte | Stufe |
|---|---|
| 0 | fehlt oder ist falsch |
| 1 | gibt wieder, was im Kurs steht, ohne Bezug zu deinem Lab |
| 2 | erklärt richtig, was in deinem Lab geschieht, mit deinen Werten und Ausgaben |
| 3 | begründet einen eigenen Entscheid, nennt eine Alternative und wägt ab |

Beantwortest du eine der zwei Fragen aus dem Bericht nicht oder falsch, bekommt das Kriterium, zu dem sie gehört, höchstens 1 Punkt.

## Zeigen

Einen Meilenstein zeigst du entweder live im Unterricht oder in einem Screencast. Der Screencast dauert höchstens zehn Minuten und ist eine einzige Aufnahme ohne Schnitt. Er beginnt mit deiner Datei `/etc/cc-lab.env` und dem Bericht des Checks des Meilensteins mit seinem Hash und deinen zwei Fragen. Danach führst du die verlangten Funktionen in deinem Lab vor und begründest zum Schluss zwei oder drei eigene Entscheide. Die Regeln stehen auch in [Kapitel 0.5](../start/tools/#screencasts).

## Abgeben

Du gibst über dein privates Abgabe-Repo ab, auf dem GitLab der Schule oder auf GitHub, mit Lesezugriff für deine Dozentin oder deinen Dozenten. Eine Abgabe ist ein Git-Tag, `abgabe-1` für die erste und `abgabe-2` für die zweite.

```text
cc-mmuster/
  README.md          dein Code, Name der Dozentin oder des Dozenten, Inhaltsverzeichnis
  reports/           die Berichte der Checks aus ~/cc-reports
  m1/README.md       Architektur, eigene Entscheide, Einsatz von KI, Link zum Screencast
  m2/README.md
  m3/README.md
  m4/README.md
  ...                dein Code, etwa OpenTofu, Manifeste und Skripte
```

Im README jedes Meilensteins hältst du fest, wofür du einen KI-Assistenten eingesetzt hast. Den Screencast legst du in den Ordner des Meilensteins oder verlinkst ihn, wenn er für das Repo zu gross ist, etwa auf OneDrive.
