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

Jeder Meilenstein hat ein Bewertungsraster. Etwa 60 % der Punkte gibt es für die Funktionen, die der Auftrag verlangt, etwa 40 % für deine Erklärungen und die Begründung deiner Entscheide.

## Zeigen

Einen Meilenstein zeigst du entweder live im Unterricht oder in einem Screencast. Der Screencast dauert höchstens zehn Minuten und ist eine einzige Aufnahme ohne Schnitt. Er beginnt mit deiner Datei `/etc/cc-lab.env` und dem Bericht des Checks mit seinem Hash. Danach führst du die verlangten Funktionen in deinem Lab vor und begründest zum Schluss zwei oder drei eigene Entscheide. Die Regeln stehen auch in [Kapitel 0.5](../start/tools/#screencasts).

## Abgeben

Du gibst über dein privates Abgabe-Repo ab, auf dem GitLab der Schule oder auf GitHub, mit Lesezugriff für deine Dozentin oder deinen Dozenten. Eine Abgabe ist ein Git-Tag, `abgabe-1` für die erste und `abgabe-2` für die zweite.

```text
cc-mmuster/
  README.md          dein Code, Name der Dozentin oder des Dozenten, Inhaltsverzeichnis
  reports/           die Berichte der Checks aus ~/cc-reports
  m1/README.md       Architektur, eigene Entscheide, Einsatz von KI, Link zum Screencast
  un2/README.md
  un3/README.md
  un4/README.md
  ...                dein Code, etwa OpenTofu, Manifeste und Skripte
```

Im README jedes Meilensteins hältst du fest, wofür du einen KI-Assistenten eingesetzt hast. Den Screencast legst du in den Ordner des Meilensteins oder verlinkst ihn, wenn er für das Repo zu gross ist, etwa auf OneDrive.
