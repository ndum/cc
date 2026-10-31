---
title: Souveränität, Recht und Kosten
description: Das Datenschutzgesetz, besonders schützenswerte Daten, Auftragsbearbeitung, Daten im Ausland, das Berufsgeheimnis, der Zugriff ausländischer Behörden, der Schutzbedarf und die Kosten einer eigenen Cloud.
sidebar:
  order: 4
---

:::assignment
Beat Kläy legt nach. «Unsere Mitglieder könnten auch einfach einen der grossen Anbieter nehmen. Schreib mir auf einer Seite, welche rechtlichen Gründe für eine eigene Cloud sprechen und was sie uns kostet. Ich will nichts behaupten, was nicht stimmt.»
:::

:::goals
Nach diesem Kapitel kannst du

- sagen, welches Datenschutzrecht für die Mitglieder von Wolkenwerk Bern gilt,
- besonders schützenswerte Personendaten erkennen,
- die Pflichten bei einer Auftragsbearbeitung und bei Daten im Ausland erklären,
- einschätzen, was das Berufsgeheimnis für eine Arztpraxis in der Cloud bedeutet,
- den Schutzbedarf der Mitglieder grob einstufen,
- die Kosten einer eigenen Cloud in Investitionen und Betriebskosten gliedern.
:::

:::caution
Dieses Kapitel erklärt die Rechtslage für ein Fallbeispiel, es ist keine Rechtsberatung. Die Gesetzesartikel sind verlinkt, für einen echten Fall gehört eine Fachperson dazu. Stand der Angaben ist November 2026.
:::

## Das Datenschutzgesetz

Seit dem 1. September 2023 gilt in der Schweiz das revidierte [Bundesgesetz über den Datenschutz](https://www.fedlex.admin.ch/eli/cc/2022/491/de) (DSG, SR 235.1). Es gilt für private Personen und Organisationen und für die Bundesorgane. Für Kantone und Gemeinden gilt das Datenschutzrecht des Kantons. Bei Wolkenwerk Bern unterstehen die Genossenschaft, die Praxis, die Treuhand und das Veloatelier dem DSG, die Gemeinde Hinterbüel dagegen dem Datenschutzrecht des Kantons Bern.

Das DSG kennt besonders schützenswerte Personendaten (Art. 5 Bst. c). Dazu gehören unter anderem Daten über die Gesundheit, über religiöse, weltanschauliche oder politische Ansichten, genetische und biometrische Daten, Daten über Strafverfahren und über Massnahmen der Sozialhilfe. Die Praxis Rosenweg bearbeitet täglich Gesundheitsdaten, die Gemeinde Daten der Sozialhilfe.

## Datensicherheit und Auftragsbearbeitung

Wer Personendaten bearbeitet, muss sie mit technischen und organisatorischen Massnahmen schützen, angemessen zum Risiko (Art. 8 DSG). Die Mindestanforderungen stehen in der [Datenschutzverordnung](https://www.fedlex.admin.ch/eli/cc/2022/568/de) (DSV).

Wenn Wolkenwerk Bern die Daten eines Mitglieds auf seiner Plattform speichert, ist die Genossenschaft eine Auftragsbearbeiterin (Art. 9 DSG). Das Mitglied bleibt verantwortlich und muss sich vergewissern, dass Wolkenwerk die Datensicherheit gewährleisten kann. Wolkenwerk darf die Daten nur so bearbeiten, wie das Mitglied selbst es dürfte, und darf weitere Dienstleister nur mit vorheriger Zustimmung des Mitglieds beiziehen. In der Praxis regelt das ein Vertrag über die Auftragsbearbeitung.

## Daten im Ausland

Personendaten dürfen ins Ausland gehen, wenn der Bundesrat festgestellt hat, dass dort ein angemessener Schutz besteht (Art. 16 DSG). Die Liste dieser Staaten steht in Anhang 1 der DSV. Die Vereinigten Staaten stehen seit dem 15. September 2024 darauf, aber nur für Unternehmen, die nach dem Swiss-U.S. Data Privacy Framework zertifiziert sind. Für andere Staaten und nicht zertifizierte Unternehmen braucht es andere Garantien, etwa Standardvertragsklauseln, oder eine der Ausnahmen in Art. 17 DSG wie die ausdrückliche Einwilligung der betroffenen Person.

Unabhängig vom Ort der Speicherung verpflichtet der amerikanische [CLOUD Act](https://www.govinfo.gov/content/pkg/USCODE-2023-title18/html/USCODE-2023-title18-partI-chap121-sec2713.htm) von 2018 amerikanische Anbieter, Daten auf behördliche Anordnung herauszugeben, die sich in ihrem Besitz, Gewahrsam oder unter ihrer Kontrolle befinden, auch wenn sie in einem Rechenzentrum in der Schweiz liegen.

## Das Berufsgeheimnis

Ärztinnen und Ärzte unterstehen dem Berufsgeheimnis nach [Art. 321 StGB](https://www.fedlex.admin.ch/eli/cc/54/757_781_799/de), zusammen mit ihren Hilfspersonen. Wer ein solches Geheimnis offenbart, kann mit Freiheitsstrafe bis zu drei Jahren oder Geldstrafe bestraft werden. Treuhänderinnen und Treuhänder stehen nicht in dieser Liste. Für die Treuhand Aaregg gelten der Vertrag mit ihren Kundinnen und Kunden und das DSG.

Ob ein Cloud-Anbieter als Hilfsperson einer Praxis gelten kann, ist eine Frage der Auslegung. Eine Seite des [Kantons Zürich](https://www.zh.ch/de/wirtschaft-arbeit/wirtschaftsstandort/innovation-sandbox/phase-ii/medizinische-dokumentation/2-datenschutz-berufsgeheimnis-und-die-cloud.html) nennt zwei Wege. Entweder ist der Anbieter ebenso zur Verschwiegenheit verpflichtet, arbeitet nach Weisung und ist vertraglich und organisatorisch in die Praxis eingebunden, oder er hat keinen Zugriff auf die Schlüssel, mit denen die Daten verschlüsselt sind. Für öffentliche Organe hat die Konferenz der Datenschutzbeauftragten [privatim](https://www.privatim.ch/de/privatim-verabschiedet-resolution-zu-internationalen-cloud-losungen/) 2025 festgehalten, dass internationale Cloud-Dienste für besonders schützenswerte Daten nur in Frage kommen, wenn das Organ selbst verschlüsselt und der Anbieter keinen Zugriff auf den Schlüssel hat.

Eine Community Cloud wie Wolkenwerk Bern hat hier Vorteile. Die Daten bleiben in der Schweiz, die Genossenschaft untersteht keinem ausländischen Recht wie dem CLOUD Act, und die Mitglieder bestimmen selbst über sie.

## Schutzbedarf

Der Schutzbedarf sagt, wie schlimm es wäre, wenn Daten bekannt, verändert oder unerreichbar würden. Man beurteilt ihn meist für drei Schutzziele, die Vertraulichkeit, die Integrität und die Verfügbarkeit, in Stufen wie normal, hoch und sehr hoch. Aus dem Schutzbedarf folgen die Massnahmen, etwa Verschlüsselung, Trennung der Mandanten, Backups oder ein zweiter Standort. Bei einem hohen Risiko für die betroffenen Personen verlangt das DSG eine Datenschutz-Folgenabschätzung im Voraus (Art. 22 DSG), etwa bei der umfangreichen Bearbeitung besonders schützenswerter Personendaten.

## Kosten

Eine eigene Cloud kostet zuerst Investitionen und dann laufend Betriebskosten. Investitionen (CapEx) sind Ausgaben, die einen Vermögenswert schaffen, bei Wolkenwerk die Server, die Netzwerkgeräte und die Einrichtung. Betriebskosten (OpEx) fallen in jeder Periode an, etwa Strom, Kühlung, Platz im Rechenzentrum, Internetanschluss, Wartung und vor allem die Arbeitszeit des Plattform-Teams. Lizenzkosten fallen bei OpenNebula, Kubernetes und den übrigen Werkzeugen des Kurses nicht an, weil sie freie Software sind. Bei einer Public Cloud fallen fast nur Betriebskosten an, abgerechnet nach Verbrauch.

Die Gesamtkosten über mehrere Jahre heissen Total Cost of Ownership. Sie zu kennen hilft beim Vergleich mit einem Angebot aus der Public Cloud. Damit die Mitglieder ihren Anteil sehen, misst Wolkenwerk den Verbrauch pro Mitglied. Zeigt die Genossenschaft den Mitgliedern ihren Verbrauch nur zur Information, heisst das Showback. Stellt sie ihn in Rechnung, heisst das Chargeback. Die [FinOps Foundation](https://www.finops.org/framework/capabilities/invoicing-chargeback/) hält fest, dass Showback in jeder Organisation nötig ist, Chargeback dagegen von ihren Regeln der Buchhaltung abhängt. In Kapitel 3.3 richtest du Showback in OpenNebula ein.

::::exercise[Schutzbedarf]
Stufe für jedes Mitglied den Schutzbedarf für Vertraulichkeit, Integrität und Verfügbarkeit als normal, hoch oder sehr hoch ein und begründe jede Stufe in einem Satz.

:::solution
Eine mögliche Einstufung:

| Mitglied | Vertraulichkeit | Integrität | Verfügbarkeit |
|---|---|---|---|
| Praxis Rosenweg | sehr hoch, Gesundheitsdaten unter Berufsgeheimnis | hoch, falsche Befunde gefährden Patientinnen und Patienten | hoch, ohne Daten keine Sprechstunde |
| Treuhand Aaregg | hoch, Finanzdaten der Kundschaft | hoch, Buchhaltungen müssen stimmen | hoch am Monatsende, sonst normal |
| Veloatelier Matte | normal, vor allem Bestellungen und Adressen | normal | hoch an Samstagen im Frühling |
| Gemeinde Hinterbüel | hoch, Daten der Einwohnerinnen und Einwohner, teils der Sozialhilfe | hoch, amtliche Daten | hoch zu Schalterzeiten |
:::
::::

::::exercise[Briefing]
Schreibe für Beat Kläy eine Seite mit den rechtlichen Gründen für eine eigene Cloud und einer Gliederung der Kosten. Verwende nur Aussagen, die du mit einem Gesetzesartikel oder einer Quelle aus diesem Kapitel belegen kannst.

:::solution
Eine gute Seite nennt das DSG und für die Gemeinde das kantonale Recht, die Gesundheitsdaten der Praxis als besonders schützenswert, die Rolle von Wolkenwerk als Auftragsbearbeiterin mit Vertrag, die Regeln für Daten im Ausland, den CLOUD Act als Risiko bei amerikanischen Anbietern und das Berufsgeheimnis der Praxis. Bei den Kosten trennt sie Investitionen und Betriebskosten, nennt die Arbeitszeit des Plattform-Teams als grössten laufenden Posten und erklärt Showback.
:::
::::
