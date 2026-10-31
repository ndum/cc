---
title: Glossar
description: Die Fachbegriffe des Kurses in ein bis zwei Sätzen, mit dem Kapitel, das sie einführt.
---

Das Glossar erklärt die Fachbegriffe des Kurses kurz und verweist auf das Kapitel, das sie einführt. Viele Begriffe des Cloud Computing bleiben auch auf den deutschen Seiten englisch, etwa Front-end, Inventar oder Playbook. So findest du sie in der Dokumentation, in Fehlermeldungen und in den Werkzeugen wieder.

| Begriff | Bedeutung | Kapitel |
|---|---|---|
| Ansible | Ein Werkzeug, das Server über SSH in einen beschriebenen Zielzustand bringt. Ein zweiter Lauf ändert nur, was noch nicht stimmt. | [2.2](../iaas/installation/) |
| Front-end | Die VM, auf der OpenNebula die Cloud verwaltet, mit dem Dienst `oned`, dem Scheduler und der Weboberfläche. Im Kurs ist sie auch das Gateway des internen Netzes. | [0.2](../start/lab/) |
| Gateway | Der Rechner, über den die VMs eines Netzes andere Netze erreichen. Im Kurs leitet das Front-end den Verkehr des internen Netzes mit NAT ins Internet. | [0.2](../start/lab/) |
| Hash | Eine kurze Prüfsumme, die sich ändert, sobald sich der Inhalt ändert. Der Check-Bericht endet mit dem Hash seines Inhalts. | [0.3](../start/tools/) |
| Inventar | Die Datei, in der Ansible die Server und ihre Gruppen findet, dazu Werte, die für alle oder für einzelne gelten. | [2.2](../iaas/installation/) |
| Knoten | Eine VM, auf der OpenNebula die virtuellen Maschinen der Mitglieder ausführt. Im Kurs gibt es zwei Knoten mit KVM. | [0.2](../start/lab/) |
| KVM | Der Hypervisor im Linux-Kernel. Er nutzt die Virtualisierungsfunktionen der CPU, auf den Knoten führt er die VMs aus. | [0.2](../start/lab/) |
| NAT | Network Address Translation ersetzt die Absenderadresse von Paketen, damit Rechner eines internen Netzes über eine einzige Adresse ins Internet kommen. | [0.2](../start/lab/) |
| Nested Virtualization | Verschachtelte Virtualisierung. Eine VM reicht die Virtualisierungsfunktionen der CPU an ihr eigenes Betriebssystem weiter, sodass darin wieder VMs laufen. | [0.2](../start/lab/) |
| OneDeploy | Die Sammlung von Ansible-Playbooks, mit der das OpenNebula-Projekt eine Cloud aus Front-end und Knoten installiert. | [2.2](../iaas/installation/) |
| OpenNebula | Eine freie Plattform für Private Clouds. Sie verwaltet Knoten, Netze, Speicher und virtuelle Maschinen und teilt sie an Mandanten zu. | [2.2](../iaas/installation/) |
| Persönliche Parameter | Die Werte deines Labs, die aus deinem persönlichen Code entstehen, etwa Hostnamen, das interne Netz und die VXLAN-Kennung. Sie stehen in `/etc/cc-lab.env`. | [0.2](../start/lab/) |
| Playbook | Eine Datei, die beschreibt, welche Schritte Ansible auf welchen Servern ausführt. | [2.2](../iaas/installation/) |
| SSH-Schlüssel | Ein Paar aus privatem und öffentlichem Schlüssel, mit dem du dich ohne Passwort an einem Server anmeldest. | [0.3](../start/tools/) |
| VXLAN | Ein Verfahren, das ein Netz für VMs in UDP-Paketen über ein bestehendes Netz trägt. Im Kurs verbindet es die VMs deiner Cloud über das Front-end und die Knoten. | [0.2](../start/lab/) |
