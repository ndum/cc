---
title: Service- und Bereitstellungsmodelle
description: IaaS, PaaS und SaaS mit der geteilten Verantwortung, Private, Community, Public und Hybrid Cloud und wo Wolkenwerk Bern darin steht.
sidebar:
  order: 2
---

:::assignment
«Die Praxis Rosenweg fragt, ob sie sich um die Updates ihrer Server selbst kümmern muss», schreibt Simone Wyss. «Und die Gemeinde will wissen, ob wir eine Public Cloud sind. Was sagen wir den beiden?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Die Servicemodelle IaaS, PaaS und SaaS unterscheiden
- Für jedes Servicemodell sagen, wer wofür verantwortlich ist
- Die Bereitstellungsmodelle Private, Community, Public und Hybrid Cloud erklären
- Wolkenwerk Bern und seine Dienste in diese Modelle einordnen
:::

## Servicemodelle

Die Servicemodelle sagen, welchen Teil des Stapels von der Hardware bis zur Anwendung der Anbieter liefert und welchen die Nutzenden selbst betreiben. NIST unterscheidet drei Modelle.

| Modell | Der Anbieter liefert | Die Nutzenden betreiben | Beispiel bei Wolkenwerk Bern |
|---|---|---|---|
| Infrastructure as a Service (IaaS) | Rechenleistung, Speicher, Netz, Virtualisierung | Betriebssystem, Laufzeit, Anwendung, Daten | VMs aus OpenNebula für die Mitglieder |
| Platform as a Service (PaaS) | zusätzlich Betriebssystem, Laufzeit und Werkzeuge | Anwendung und Daten | die Kubernetes-Plattform, auf die das Veloatelier seinen Webshop ausrollt |
| Software as a Service (SaaS) | die fertige Anwendung | nur ihre Daten und Einstellungen | das lokale Sprachmodell als Dienst mit einer API |

Mit jeder Stufe übernimmt der Anbieter mehr Arbeit, und die Nutzenden geben mehr Kontrolle ab. Eine VM aus IaaS kann die Praxis beliebig einrichten, muss sich aber selbst um Updates des Betriebssystems kümmern. Auf einer PaaS kümmert sich das Plattform-Team darum, dafür bestimmt es auch, welche Laufzeiten und Versionen es gibt.

## Geteilte Verantwortung

Die Abbildung zeigt die Schichten eines IT-Dienstes und wer sie im jeweiligen Modell betreibt. Dieses Bild heisst Modell der geteilten Verantwortung (Shared Responsibility Model). Die Daten und die Zugriffsrechte darauf bleiben in jedem Modell bei den Nutzenden. Auch wer eine Anwendung als SaaS bezieht, entscheidet selbst, wer darin welche Daten sieht.

![Geteilte Verantwortung in den Servicemodellen. Vier Spalten für den eigenen Betrieb, IaaS, PaaS und SaaS zeigen neun Schichten von Netz und Hardware bis zu Daten und Zugriffen. Im eigenen Betrieb betreiben die Nutzenden alle Schichten. Bei IaaS übernimmt der Anbieter Netz, Speicher, Server und Virtualisierung, bei PaaS zusätzlich Betriebssystem, Middleware und Laufzeit, bei SaaS auch die Anwendung. Daten und Zugriffe bleiben immer bei den Nutzenden.](../../../assets/figures/de/p1c2-responsibility.svg)

## Bereitstellungsmodelle

Die Bereitstellungsmodelle sagen, wer eine Cloud nutzen darf und wem sie gehört.

| Modell | Wer sie nutzt | Typisch |
|---|---|---|
| Private Cloud | eine einzige Organisation | eigene Hardware im eigenen Rechenzentrum oder bei einem Dienstleister |
| Community Cloud | mehrere Organisationen mit gemeinsamen Anforderungen | ein Verbund von Spitälern, Gemeinden oder Hochschulen |
| Public Cloud | die Öffentlichkeit, alle Kundinnen und Kunden eines Anbieters | grosse Anbieter mit Rechenzentren auf mehreren Kontinenten |
| Hybrid Cloud | eine Organisation, die zwei oder mehr dieser Modelle verbindet | eigene Private Cloud, die bei Lastspitzen Ressourcen aus einer Public Cloud dazunimmt |

Wolkenwerk Bern ist eine Community Cloud. Die Mitglieder teilen sich eine Infrastruktur, weil sie ähnliche Anforderungen haben. Sie wollen ihre Daten in der Schweiz und unter eigener Kontrolle, und keines der Mitglieder könnte eine solche Cloud allein betreiben. Technisch sieht eine Community Cloud aus wie eine Private Cloud. Der Unterschied liegt darin, dass mehrere Organisationen sie gemeinsam nutzen und gemeinsam über sie bestimmen.

## Public Clouds

Public Clouds bieten Hunderte von Diensten weltweit an, sofort verfügbar und nach Verbrauch abgerechnet. Für viele Organisationen sind sie der einfachste Weg in die Cloud. Dieser Kurs baut bewusst keine Public Cloud nach. Er zeigt, wie die Dienste darunter funktionieren, indem du sie selbst betreibst. Wer eine eigene Cloud gebaut hat, versteht auch die Angebote der grossen Anbieter besser, ihre Möglichkeiten und ihre Grenzen.

::::exercise[Verantwortung]
Die Praxis Rosenweg bezieht von Wolkenwerk Bern eine VM aus OpenNebula und betreibt darauf ihre Praxissoftware. Wer ist für die folgenden Punkte verantwortlich, die Praxis oder das Plattform-Team?

1. Sicherheitsupdates für Ubuntu in der VM
2. Ein defekter Arbeitsspeicher in einem Knoten
3. Wer in der Praxissoftware welche Patientendaten sieht
4. Das Backup der VM-Images
5. Die Firewall-Regeln innerhalb der VM

:::solution
1. Die Praxis, das Betriebssystem in der VM gehört bei IaaS zu den Nutzenden
2. Das Plattform-Team, die Hardware liefert der Anbieter
3. Die Praxis, Daten und Zugriffe bleiben immer bei den Nutzenden
4. Verhandlungssache, meist bietet das Plattform-Team Backups der Images als Dienst an. Ohne Vereinbarung ist die Praxis für ihre Daten selbst verantwortlich
5. Die Praxis, das Plattform-Team regelt nur das Netz ausserhalb der VM
:::
::::

::::exercise[Einordnen]
Die Gemeinde Hinterbüel fragt, ob Wolkenwerk Bern eine Public Cloud ist. Antworte in drei Sätzen und nenne das richtige Bereitstellungsmodell mit Begründung.

:::solution
Nein, Wolkenwerk Bern steht nicht der Öffentlichkeit offen, sondern nur den Mitgliedern der Genossenschaft. Weil mehrere Organisationen mit gemeinsamen Anforderungen sie gemeinsam nutzen und tragen, ist sie eine Community Cloud. Technisch funktioniert sie wie eine Private Cloud.
:::
::::
