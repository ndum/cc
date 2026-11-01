---
title: Leistungsbeurteilung
description: Wie die vier Umsetzungsnachweise zwei Noten ergeben, wie du einen Nachweis zeigst und abgibst und wie dein Abgabe-Repo aufgebaut ist.
---

Deine Modulnote setzt sich aus vier Umsetzungsnachweisen zusammen. Je zwei davon gibst du gemeinsam ab, und jede Abgabe ergibt eine Note.

| Abgabe | Nachweise | Zeitpunkt | Gewicht |
|---|---|---|---|
| Abgabe 1 | UN1 IaaS für Wolkenwerk und UN2 Plattform per Code | Ende Block 4 | 50 % |
| Abgabe 2 | UN3 Observability, Skalierung und KI und UN4 ein eigenes Mitglied | Ende Block 6 | 50 % |

Die Modulnote ist der Durchschnitt der beiden Noten. Block 7 gehört der Probeprüfung und ihrer Besprechung, sie zählt nicht für die Note. Die genauen Termine, den Weg der Abgabe und die Regeln zu Verspätungen erhältst du von deiner Lehrperson.

## Die Nachweise

Jeder Nachweis ist eine Einzelarbeit in deinem eigenen Lab. Die Aufträge der Nachweise erscheinen mit den Teilen, zu denen sie gehören. [UN1](un1/) gehört zu Teil 2 und Teil 3, [UN2](un2/) zu Teil 4, [UN3](un3/) zu Teil 5 und UN4 zu Teil 6. In UN4 entwirfst du ein fünftes Mitglied von Wolkenwerk Bern selbst und bringst es auf deine Plattform.

Jeder Nachweis hat ein Bewertungsraster. Etwa 60 % der Punkte gibt es für die Funktionen, die der Auftrag verlangt, etwa 40 % für deine Erklärungen und die Begründung deiner Entscheide.

## Zeigen

Einen Nachweis zeigst du entweder live im Unterricht oder in einem Screencast. Der Screencast dauert höchstens zehn Minuten und ist eine einzige Aufnahme ohne Schnitt. Er beginnt mit deiner Datei `/etc/cc-lab.env` und dem Bericht des Checks mit seinem Hash. Danach führst du die verlangten Funktionen in deinem Lab vor und begründest zum Schluss zwei oder drei eigene Entscheide. Die Regeln stehen auch in [Kapitel 0.5](../start/tools/#screencasts).

## Abgeben

Du gibst über dein privates Abgabe-Repo ab, auf dem GitLab der Schule oder auf GitHub, mit Lesezugriff für deine Lehrperson. Eine Abgabe ist ein Git-Tag, `abgabe-1` für die erste und `abgabe-2` für die zweite.

```text
cc-mmuster/
  README.md          dein Code, deine Lehrperson und ein Inhaltsverzeichnis
  reports/           die Berichte der Checks aus ~/cc-reports
  un1/README.md      Architektur, eigene Entscheide, Einsatz von KI, Link zum Screencast
  un2/README.md
  un3/README.md
  un4/README.md
  ...                dein Code, etwa OpenTofu, Manifeste und Skripte
```

Im README jedes Nachweises hältst du fest, wofür du einen KI-Assistenten eingesetzt hast. Den Screencast legst du in den Ordner des Nachweises oder verlinkst ihn, wenn er für das Repo zu gross ist, etwa auf OneDrive.

## Diplomprüfung

Nach dem Modul folgt die Diplomprüfung ausserhalb des Moduls. Sie ist praktisch, dauert 60 Minuten und ist Open Book. Die Probeprüfung in Block 7 hat dasselbe Format.
