---
title: Diplomprüfung
description: Das bekannte Format der Diplomprüfung, eine Checkliste zur Vorbereitung und Übungsszenarien mit Lösungen für dein eigenes Lab.
---

Nach dem Modul folgt die Diplomprüfung ausserhalb des Moduls. Sie ist praktisch, dauert 60 Minuten und ist Open Book. Wie in der [Probeprüfung](../mock-exam/) findest und behebst du Fehler in einer laufenden Umgebung und erweiterst sie.

## Eckdaten

| Punkt | Stand |
|---|---|
| Form | praktisch, an einer laufenden Umgebung |
| Dauer | 60 Minuten |
| Hilfsmittel | Open Book, die genaue Liste gibt die Schule bekannt |
| Umgebung | gibt die Schule bekannt |
| Termin | gibt die Schule bekannt |

Die Umgebung kann dein eigenes Lab sein oder eine Umgebung der Schule mit demselben Aufbau. Halte dich an die Angaben der Schule und nicht an Annahmen aus diesem Kurs.

## Vorbereitung

- Du findest dich in OpenNebula, OpenTofu, Kubernetes, Argo CD und Prometheus zurecht, ohne lange zu suchen. Die [Lab-Referenz](../../lab-reference/) fasst die Befehle zusammen.
- Du gehst bei einer Störung nach einem festen Ablauf vor, wie in der [Fehlerbehebung](../../troubleshooting/#vorgehen-bei-einer-störung).
- Du hast die Probeprüfung durchgespielt und die Tickets, bei denen du unsicher warst, noch einmal geübt.
- Du hast die Übungsszenarien unten in deinem Lab gelöst.
- Du kennst die Kompetenzraster der Teile 1 bis 6 und kannst jede Prüfaufgabe ohne Nachschauen lösen.
- Deine Notizen und Repos sind so geordnet, dass du in einer Minute findest, was du brauchst.

## Übungsszenarien

Spiele die Szenarien in deinem eigenen Lab durch. Lege vorher einen Snapshot in smartlearn an. Jedes Szenario sollte in zehn bis fünfzehn Minuten lösbar sein.

::::exercise[Monatsabschluss bei der Treuhand]
Treuhand Aaregg braucht für den Monatsabschluss eine Woche lang zwei zusätzliche VMs mit je 1 GB. Erhöhe die Quota so weit wie nötig, starte die VMs als Admin der Treuhand und setze die Quota danach auf den Wert aus Kapitel 3.2 zurück. Erkläre, was mit laufenden VMs passiert, wenn die Quota sinkt.

:::solution
Die Quota der Treuhand erlaubt 4 VMs, 2 CPU und 4096 MB. Für zwei weitere VMs mit je 1 GB reicht sie nur, wenn die Treuhand nicht schon VMs laufen hat. Sonst erhöhst du MEMORY und allenfalls VMS und CPU mit `onegroup quota treuhand`. Senkst du die Quota danach, laufen bestehende VMs weiter. OpenNebula verhindert nur neue VMs, bis der Verbrauch wieder unter der Quota liegt.
:::
::::

::::exercise[Aktion im Webshop]
Veloatelier Matte startet am Samstag eine Aktion. Der Webshop soll während der Aktion mit mindestens drei Pods laufen. Ändere das über Git und zeige, dass der Cluster die Änderung übernommen hat.

:::solution
Die Untergrenze steht als `minReplicas` in `webshop/hpa.yaml` im Plattform-Repo. Du setzt sie auf 3, öffnest einen Pull Request in Gitea und mergst ihn. Nach der nächsten Synchronisation zeigt `kubectl -n velo get hpa webshop` drei als Minimum, und es laufen drei Pods. Eine Änderung mit `kubectl scale` oder `kubectl edit` würde Argo CD mit Self-Heal wieder zurücksetzen.
:::
::::

::::exercise[Abgewiesener Pod]
Starte im Namespace `gemeinde` einen Pod mit `kubectl -n gemeinde run test --image=nginx`. Finde heraus, warum er nicht läuft, und bring einen Pod mit einem Webserver in diesem Namespace zum Laufen, der die Regeln erfüllt.

:::solution
Kubernetes weist den Pod mit `violates PodSecurity "restricted:latest"` ab, weil das Image als `root` läuft und die Sicherheitseinstellungen fehlen. Ein Pod mit `nginxinc/nginx-unprivileged`, `runAsNonRoot`, `seccompProfile` `RuntimeDefault`, `allowPrivilegeEscalation: false` und ohne Capabilities erfüllt das Profil `restricted`. Auf Dauer gehört er als Manifest in den Ordner der Gemeinde im Plattform-Repo.
:::
::::

::::exercise[Alert für die Gemeinde]
Die Gemeinde bekommt eine kleine Website mit `nginxinc/nginx-unprivileged`. Bring sie über Git in ihren Namespace. Die Gemeinde will wissen, wenn die Website länger als fünf Minuten ohne laufenden Pod ist. Schreibe die Alert-Regel, löse den Alert über Git aus und zeige, dass er beim Triage-Dienst ankommt.

:::solution
Die Website ist ein Deployment wie die App deines Mitglieds aus UN4, eingetragen in der `kustomization.yaml` der Gemeinde. Eine `PrometheusRule` im selben Ordner fragt `kube_deployment_status_replicas_available{namespace="gemeinde"} < 1` mit `for: 5m` ab und trägt das Label `triage: "true"`, damit Alertmanager den Alert an den Triage-Dienst schickt. Auslösen lässt er sich, indem du das Deployment über Git auf null Replikas setzt. Nach einigen Minuten steht der Alert im Audit-Log des Triage-Dienstes. Danach setzt du die Replikas über Git zurück.
:::
::::

::::exercise[Gelöscht]
Lösche den Namespace `gemeinde` mit `kubectl delete namespace gemeinde` und beobachte, was passiert. Lösche danach die VM deines eigenen Mitglieds aus UN4 und stelle sie aus dem letzten Backup wieder her. Erkläre den Unterschied zwischen beiden Fällen.

:::solution
Den Namespace legt Argo CD nach kurzer Zeit wieder an, weil der Soll-Zustand in Git steht. Daten, die nur im Namespace lagen, sind trotzdem weg. Die VM steht nicht in Git. Du holst sie mit `oneimage restore` aus dem Backup-Image zurück, startest sie aus der neuen Vorlage und gibst sie mit `onevm chown` wieder dem Mitglied. Alles, was nach dem letzten Backup geändert wurde, fehlt. Der Fall zeigt, warum Git und Backup sich ergänzen.
:::
::::
