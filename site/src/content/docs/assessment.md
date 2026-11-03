---
title: Leistungsbeurteilung
description: Wie die Meilensteine und die Prüfung deine Modulnote ergeben, was Basis und Zusatzaufträge verlangen, wie du die Basis belegst und die Zusatzaufträge dokumentierst und zeigst und wie dein Abgabe-Repo aufgebaut ist.
---

Deine Modulnote setzt sich aus zwei Noten zusammen.

| Note | Grundlage | Gewicht |
|---|---|---|
| Note 1 | Die vier Meilensteine in zwei Abgaben | 60 % |
| Note 2 | Die [Prüfung](exam/) gegen Ende des Moduls | 40 % |

Die Modulnote ist 0,6 × Note 1 + 0,4 × Note 2. Gerundet wird nach den Regeln der Schule. Eine Mindestnote für die einzelnen Noten gibt es nicht, eine bessere Note kann also eine schwächere ausgleichen. Die Termine der Abgaben und der Prüfung und die Regeln zu Verspätungen erfährst du von deiner Dozentin oder deinem Dozenten.

## Note 1 aus den Meilensteinen

Je zwei Meilensteine gibst du zusammen ab. Jede Abgabe ergibt eine Note, Note 1 ist der Durchschnitt dieser beiden Noten.

| Abgabe | Meilensteine |
|---|---|
| Abgabe 1 | [IaaS für Wolkenwerk (Meilenstein 1)](milestone-1/) und [Plattform per Code (Meilenstein 2)](milestone-2/) |
| Abgabe 2 | [Observability, Skalierung und KI (Meilenstein 3)](milestone-3/) und [Betrieb und ein eigenes Mitglied (Meilenstein 4)](milestone-4/) |

## Punkte und Note

Jeder Meilenstein gibt höchstens 30 Punkte, 21 für die Basis und 9 für die Zusatzaufträge. Eine Abgabe umfasst zwei Meilensteine und damit höchstens 60 Punkte. Die Note einer Abgabe ist 5 × Punkte / 60 + 1. Mit einer vollständigen Basis in beiden Meilensteinen erreichst du 42 Punkte und die Note 4,5, mit allen Zusatzaufträgen dazu die Note 6. Ohne Zusatzaufträge ist Note 1 also höchstens eine 4,5.

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

[Meilenstein 1](milestone-1/) gehört zu Teil 0 bis Teil 3, [Meilenstein 2](milestone-2/) zu Teil 4, [Meilenstein 3](milestone-3/) zu Teil 5 und [Meilenstein 4](milestone-4/) zu Teil 6. Jeder Meilenstein besteht aus der Basis mit sieben Anforderungen und aus drei Zusatzaufträgen, die darüber hinausgehen.

Du darfst im Team arbeiten. Eine Lösung miteinander zu besprechen und gemeinsam Fehler zu suchen gehört zum Lernen. Dein Lab baust du aber selbst auf und du gibst allein ab. Deshalb trägt jedes Lab seine eigenen [persönlichen Parameter](../start/parameters/). Dein Bericht und deine Antworten auf die Fragen zeigen, ob die Lösung in deinem Lab läuft und ob du sie verstehst.

## Basis

Die Basis umfasst die Arbeit, die du mit den Kapiteln und ihren Skripten im Unterricht und im Selbststudium erledigst. Jeder Meilenstein nennt sieben Anforderungen. Jede davon gibt 0 bis 3 Punkte.

| Punkte | Stand |
|---|---|
| 3 | der Bericht des Checks und ein Screenshot belegen die Anforderung |
| 2 | der Check ist grün, aber ein passender Screenshot fehlt |
| 1 | die Anforderung ist nur teilweise erfüllt, etwa zeigt der Screenshot sie, aber der Check ist rot |
| 0 | die Anforderung fehlt |

Prüft kein Check eine Anforderung, belegt sie der Screenshot allein.

Der Check des Meilensteins zeigt die Anforderungen der Basis mit `[ok]` oder `[!!]` und zählt nur sie. Spuren der Zusatzaufträge markiert er mit `[+ok]` oder `[+!!]` und zählt sie getrennt. Diese Zählung geht nicht in die Basis ein.

## Belege der Basis

Die Basis belegst du nur mit dem Bericht des Checks und mit Screenshots. Einen Text, eine Zeichnung oder einen Screencast brauchst du dafür nicht. Zu jeder der sieben Anforderungen legst du mindestens einen Screenshot in den Ordner des Meilensteins. Sein Dateiname beginnt mit der Nummer der Anforderung, etwa `4-migration.png`. Auf jedem Screenshot aus dem Terminal ist die Eingabeaufforderung mit dem Namen deiner VM zu sehen. Die Berichte der Checks `m1` bis `m4` legst du in `reports/`, für Meilenstein 1 dazu die Berichte von `start`, `install` und `iaas`.

## Zusatzaufträge

Jeder Meilenstein hat drei Zusatzaufträge A, B und C. Sie verlangen mehr eigene Arbeit als die Basis, rechne mit vier bis sechs Stunden pro Meilenstein. Du kannst einzelne Zusatzaufträge wählen, jeder gibt für sich 0 bis 3 Punkte. Die Kapitel, die dir dabei helfen, nennt der Meilenstein beim Auftrag.

## Dokumentation der Zusatzaufträge

Zu jedem Zusatzauftrag, den du machst, schreibst du eine Dokumentation in einem freien Format, als Markdown, Word oder PDF. Sie enthält diese fünf Teile.

1. Eine Skizze deiner Lösung mit den beteiligten Komponenten
2. Deine Umsetzung mit deinen Werten, Ausgaben und Screenshots
3. Deinen eigenen Entscheid mit einer Alternative und einer Abwägung
4. Die Dateien, die der Auftrag nennt, etwa Skripte oder Manifeste
5. Wofür du einen KI-Assistenten eingesetzt hast

Fehlt die Dokumentation oder einer der Teile 1, 2, 4 und 5, gibt ein Zusatzauftrag höchstens 1 Punkt, auch wenn er in der Vorführung läuft. Der eigene Entscheid in Teil 3 trennt Stufe 2 von Stufe 3.

## Stufen der Zusatzaufträge

Jeder Zusatzauftrag wird nach denselben Stufen bewertet.

| Punkte | Stufe |
|---|---|
| 0 | fehlt |
| 1 | läuft |
| 2 | läuft und ist in der Dokumentation und in der Vorführung an deinem eigenen Lab erklärt, mit deinen Werten und Ausgaben |
| 3 | dazu ein eigener Entscheid mit einer Alternative und einer Abwägung |

## Zusatzaufträge zeigen

Die Zusatzaufträge eines Meilensteins zeigst du in einer Vorführung, entweder live im Unterricht oder in einem Screencast von höchstens zehn Minuten. Für eine Vorführung im Unterricht gehst du selbst auf deine Dozentin oder deinen Dozenten zu und vereinbarst einen Termin.

:::caution[Frist der Vorführung]
Die Vorführung muss bis zur Abgabe stattgefunden haben, zu der der Meilenstein gehört. Ein Screencast oder sein Link und die Dokumentation liegen bis dahin im Abgabe-Repo. Eine spätere Vorführung oder ein Screencast, der erst danach im Repo liegt, zählt nicht mehr. Vereinbare einen Termin im Unterricht deshalb früh.
:::

Der Screencast ist eine einzige Aufnahme ohne Schnitt. Er beginnt mit `cat /etc/cc-lab.env` und dem Bericht des Checks des Meilensteins mit seinem Hash und deinen zwei Fragen. Danach führst du die Zusatzaufträge in deinem Lab vor. Die Regeln stehen auch in [Kapitel 0.5](../start/tools/#screencasts).

## Persönliche Werte und Fragen

Einige Werte der Basis kommen aus deinem persönlichen Code, etwa die Quota der Gemeinde oder das Ziel des SLO. Der [Parameter-Generator](../start/parameters/) zeigt sie dir am Ende in einer Tabelle. Zu jedem Meilenstein gibt es einen eigenen Check, `m1` bis `m4`. Er führt den Check des Teils aus, prüft deine persönlichen Werte und zieht aus deinem Code zwei Fragen. Eine Lösung aus einem anderen Lab fällt deshalb im Check auf.

Die zwei Fragen beantwortest du in der Vorführung der Zusatzaufträge, live oder im Screencast. Sie können die Basis oder einen Zusatzauftrag betreffen. Jede Frage, die du nicht oder falsch beantwortest, kostet 1 Punkt der Zusatzaufträge dieses Meilensteins.

## Note 2 aus der Prüfung

Die Prüfung ist eine Einzelprüfung von 60 Minuten gegen Ende des Moduls. Alle Hilfsmittel sind erlaubt, auch das Internet und KI-Assistenten, aber keine KI-Agenten. Form und Termin stehen noch nicht fest. Die Seite [Prüfung](exam/) sammelt, was bekannt ist.

## Abgeben

Du gibst über dein privates Abgabe-Repo ab, auf dem GitLab der Schule oder auf GitHub, wie es [Kapitel 0.5](../start/tools/#das-abgabe-repo) einrichtet. Eine Abgabe ist ein Git-Tag, `abgabe-1` für die erste und `abgabe-2` für die zweite. Du setzt ihn auf dem Front-end mit `git tag abgabe-1` und lädst ihn mit `git push origin abgabe-1` hoch.

```text
cc-mmuster/
  README.md          dein Code, Name der Dozentin oder des Dozenten, Inhaltsverzeichnis
  cc-lab.env         eine Kopie von /etc/cc-lab.env
  reports/           die Berichte der Checks aus ~/cc-reports
  m1/                Screenshots der Basis, Dokumentation und Dateien der Zusatzaufträge
  m2/
  m3/
  m4/
```

Einen Screencast legst du in den Ordner des Meilensteins. Ist er für das Repo zu gross, liegt er etwa auf OneDrive und die Dokumentation der Zusatzaufträge verlinkt ihn.

:::caution[Keine Geheimnisse im Repo]
Der State von OpenTofu, Tokens wie das von k3s, Passwörter und der Schlüssel von Sealed Secrets gehören nie in dein Abgabe-Repo. Was einmal in einem Commit steht, bleibt in der Versionsgeschichte von Git, auch wenn du die Datei später löschst. Prüfe deshalb vor jedem Commit mit `git status`, welche Dateien dazukommen.
:::
