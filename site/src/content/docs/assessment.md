---
title: Leistungsbeurteilung
description: Wie die vier Meilensteine zwei Noten ergeben, was Basis und Zusatzaufträge verlangen, wie du die Basis dokumentierst und die Zusatzaufträge zeigst und wie dein Abgabe-Repo aufgebaut ist.
---

Deine Modulnote setzt sich aus vier Meilensteinen zusammen. Je zwei davon gibst du gemeinsam ab, und jede Abgabe ergibt eine Note.

| Abgabe | Meilensteine | Gewicht |
|---|---|---|
| Abgabe 1 | Meilenstein 1 IaaS für Wolkenwerk und Meilenstein 2 Plattform per Code | 50 % |
| Abgabe 2 | Meilenstein 3 Observability, Skalierung und KI und Meilenstein 4 Betrieb und ein eigenes Mitglied | 50 % |

Die Modulnote ist der Durchschnitt der beiden Noten. Die Termine der Abgaben, den Weg der Abgabe und die Regeln zu Verspätungen erhältst du von deiner Dozentin oder deinem Dozenten.

## Punkte und Note

Jeder Meilenstein gibt höchstens 30 Punkte, 21 für die Basis und 9 für die Zusatzaufträge. Eine Abgabe umfasst zwei Meilensteine und damit höchstens 60 Punkte. Die Note einer Abgabe ist 5 × Punkte / 60 + 1. Mit einer vollständigen Basis in beiden Meilensteinen erreichst du 42 Punkte und die Note 4,5, mit allen Zusatzaufträgen dazu die Note 6. Gerundet wird nach den Regeln der Schule.

| Punkte | Note |
|---|---|
| 30 | 3,5 |
| 36 | 4,0 |
| 42 | 4,5 |
| 48 | 5,0 |
| 51 | 5,25 |
| 54 | 5,5 |
| 60 | 6,0 |

## Die Meilensteine

Jeder Meilenstein ist eine Einzelarbeit in deinem eigenen Lab. Die Aufträge der Meilensteine erscheinen mit den Teilen, zu denen sie gehören. [Meilenstein 1](milestone-1/) gehört zu Teil 0 bis Teil 3, [Meilenstein 2](milestone-2/) zu Teil 4, [Meilenstein 3](milestone-3/) zu Teil 5 und [Meilenstein 4](milestone-4/) zu Teil 6. Jeder Meilenstein hat zwei Teile, die Basis mit sieben Anforderungen und drei Zusatzaufträge, die über die Basis hinausgehen.

Hilfe unter Studierenden ist erlaubt, und eine Lösung zu besprechen, gehört zum Lernen. Deine persönlichen Werte, dein Bericht und deine Antworten auf die Fragen zeigen, ob die Lösung in deinem Lab läuft und ob du sie verstehst.

## Basis

Die Basis umfasst die Arbeit, die du mit den Kapiteln und ihren Skripten im Unterricht und im Selbststudium erledigst. Jeder Meilenstein nennt sieben Anforderungen, und jede gibt 0 bis 3 Punkte.

| Punkte | Stand |
|---|---|
| 3 | der Bericht des Checks und ein Screenshot belegen die Anforderung |
| 1 | die Anforderung ist nur teilweise erfüllt, etwa zeigt der Screenshot sie, aber der Check ist rot |
| 0 | die Anforderung fehlt |

Einige Anforderungen prüft kein Check, etwa eine Zeichnung oder eine Tabelle mit RPO und RTO. Diese belegst du allein mit der Dokumentation. Der Check des Meilensteins zeigt die Anforderungen der Basis mit `[ok]` oder `[!!]` und zählt nur sie. Spuren der Zusatzaufträge zeigt er mit `[+ok]` oder `[+!!]` in einer eigenen Zählung, die für die Basis nicht zählt.

## Dokumentation

Die Basis belegst du mit einer Dokumentation in einem freien Format, als Markdown, Word oder PDF. Einen Screencast brauchst du dafür nicht. Die Dokumentation beginnt mit dem Inhalt deiner Datei `/etc/cc-lab.env`. Danach folgt zu jeder der sieben Anforderungen ein Screenshot mit einem oder zwei Sätzen, die sagen, was er belegt. Auf jedem Screenshot aus dem Terminal ist die Eingabeaufforderung mit dem Namen deiner VM zu sehen. Zur Dokumentation gehören der Bericht des Checks `m1` bis `m4` und die Dateien, die der Meilenstein verlangt.

## Zusatzaufträge

Jeder Meilenstein hat drei Zusatzaufträge A, B und C. Sie verlangen mehr eigene Arbeit als die Basis, rechne mit vier bis sechs Stunden pro Meilenstein. Du kannst einzelne Zusatzaufträge wählen, jeder gibt für sich 0 bis 3 Punkte. Die Kapitel, die dir dabei helfen, nennt der Meilenstein beim Auftrag.

## Stufen der Zusatzaufträge

Jeder Zusatzauftrag wird nach denselben Stufen bewertet.

| Punkte | Stufe |
|---|---|
| 0 | fehlt |
| 1 | läuft |
| 2 | läuft und ist an deinem eigenen Lab erklärt, mit deinen Werten und Ausgaben |
| 3 | dazu ein eigener Entscheid mit einer Alternative und einer Abwägung |

## Zusatzaufträge zeigen

Die Zusatzaufträge eines Meilensteins zeigst du in einer Vorführung, entweder live im Unterricht oder in einem Screencast von höchstens zehn Minuten. Für eine Vorführung im Unterricht gehst du selbst auf deine Dozentin oder deinen Dozenten zu und vereinbarst einen Termin. Bis wann die Vorführungen stattfinden, legt deine Dozentin oder dein Dozent fest.

Der Screencast ist eine einzige Aufnahme ohne Schnitt. Er beginnt mit `cat /etc/cc-lab.env` und dem Bericht des Checks des Meilensteins mit seinem Hash und deinen zwei Fragen. Danach führst du die Zusatzaufträge in deinem Lab vor. Die Regeln stehen auch in [Kapitel 0.5](../start/tools/#screencasts).

## Persönliche Werte und Fragen

Einige Werte der Basis kommen aus deinem persönlichen Code, etwa die Quota der Gemeinde oder das Ziel des SLO. Der [Parameter-Generator](../start/parameters/) zeigt sie dir unter dem Inhalt von `/etc/cc-lab.env`. Zu jedem Meilenstein gibt es einen eigenen Check, `m1` bis `m4`. Er führt den Check des Teils aus, prüft deine persönlichen Werte und zieht aus deinem Code zwei Fragen. Eine Lösung aus einem anderen Lab fällt deshalb im Check auf.

Die zwei Fragen beantwortest du in der Vorführung der Zusatzaufträge, live oder im Screencast. Jede Frage gehört zu einem Zusatzauftrag. Beantwortest du eine Frage nicht oder falsch, bekommt der Zusatzauftrag, zu dem sie gehört, höchstens 1 Punkt.

## Abgeben

Du gibst über dein privates Abgabe-Repo ab, auf dem GitLab der Schule oder auf GitHub, mit Lesezugriff für deine Dozentin oder deinen Dozenten. Eine Abgabe ist ein Git-Tag, `abgabe-1` für die erste und `abgabe-2` für die zweite.

```text
cc-mmuster/
  README.md          dein Code, Name der Dozentin oder des Dozenten, Inhaltsverzeichnis
  cc-lab.env         eine Kopie von /etc/cc-lab.env
  reports/           die Berichte der Checks aus ~/cc-reports
  m1/                Dokumentation mit Screenshots, Dateien, Link zum Screencast
  m2/
  m3/
  m4/
```

In der Dokumentation jedes Meilensteins hältst du fest, wofür du einen KI-Assistenten eingesetzt hast. Einen Screencast legst du in den Ordner des Meilensteins oder verlinkst ihn in der Dokumentation, wenn er für das Repo zu gross ist, etwa auf OneDrive.
