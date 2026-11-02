---
title: Ein lokaler KI-Dienst
description: Ein Sprachmodell mit Ollama im eigenen Cluster, Grösse des Modells gegen Geschwindigkeit und Qualität, die Vektorbefehle AVX2 und FMA, Inferenz als Last, Zugriff für Mitglieder und die OpenAI-kompatible Schnittstelle.
sidebar:
  order: 5
  badge:
    text: Zusatz
    variant: note
---

:::assignment
«Unsere Mitglieder fragen nach KI», schreibt Simone Wyss. «Die Praxis Rosenweg darf aber keine Patientendaten an einen Dienst im Ausland schicken. Könnt ihr ein Sprachmodell bei uns betreiben? Und was taugt es?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Begründen, wann ein lokales Modell einem Dienst im Internet vorzuziehen ist
- Ollama im Cluster aus Git betreiben und ein Modell laden
- Geschwindigkeit in Tokens pro Sekunde messen und erklären, wovon sie abhängt
- Inferenz als Last für die Plattform einordnen
- Den Zugriff der Mitglieder auf das Modell steuern
:::

:::note[Zusatzkapitel]
Dieses Kapitel gehört zu den Zusatzaufträgen von Meilenstein 3. Für die Basis brauchst du es nicht. Ollama läuft trotzdem in deinem Cluster, weil die Application `ai` aus Kapitel 5.1 es mit ausrollt.
:::

## Lokal oder im Internet

Ein grosses Sprachmodell erzeugt Text Token für Token, ein Token ist etwa ein Wortteil. Die bekannten Dienste laufen in Rechenzentren der Anbieter, oft im Ausland. Wer ihnen Text schickt, gibt ihn aus der Hand. Für die Praxis Rosenweg mit Gesundheitsdaten, die das Datenschutzgesetz als besonders schützenswert einstuft, ist das eine hohe Hürde. Ein Modell im eigenen Cluster verarbeitet den Text dort, wo er ohnehin liegt.

Die Modelle grosser Anbieter haben Hunderte Milliarden Parameter und laufen auf Grafikkarten. Im Lab stehen für ein Modell nur vier CPU-Kerne ohne Grafikkarte bereit, das reicht für kleine Modelle. Sie fassen zusammen, ordnen ein und schlagen vor, machen aber mehr Fehler. In diesem Kapitel misst du, was sie leisten, in Kapitel 5.6 setzt du eines im Betrieb ein.

## Ollama

Ollama lädt offene Sprachmodelle herunter und betreibt sie hinter einer HTTP-Schnittstelle. Es läuft im Namespace `ai` auf dem Agent, auf dem Server bleiben die Control Plane und die Überwachung. Die Dateien kamen mit dem Kopieren in Kapitel 5.1 in dein Repo, die Application `ai` rollt sie aus.

::code{file="platform/observability/repo/ai/ollama.yaml"}

`OLLAMA_KEEP_ALIVE` hält das Modell nach der letzten Anfrage 30 Minuten im Speicher. Ohne die Einstellung müsste Ollama es schon nach einer kürzeren Pause wieder von der Disk laden. `OLLAMA_NUM_PARALLEL` lässt zwei Anfragen gleichzeitig zu. Mehr Anfragen müssten sich die vier Kerne teilen, jede Antwort käme dann langsamer. `Recreate` beendet den alten Pod, bevor der neue startet, denn das Volume gehört zu einem einzigen Node.

Ein Job, den Argo CD nach jedem Sync startet, lädt das Modell herunter.

::code{file="platform/observability/repo/ai/pull-model.yaml"}

Im Lab war `llama3.2:3b` von Meta mit drei Milliarden Parametern 196 Sekunden nach dem Push bereit. Die Datei ist 2,0 GB gross. Die Gewichte sind auf etwa vier Bit pro Parameter verkleinert, man nennt das Quantisierung. Das kostet etwas Genauigkeit und macht das Modell klein genug für den Speicher des Agents.

## Die Disk

Das Image von Ollama ist mit seinen Bibliotheken für Grafikkarten gross, komprimiert 3,4 GB. Im Lab war die Disk des Agents danach zu 87 % voll. Prometheus meldete `KubePersistentVolumeFillingUp`, denn die Volumes von local-path liegen auf derselben Disk wie die Images. Darum gibt die Vorlage aus Kapitel 4.2 den VMs des Clusters 30 GB, festgelegt in der Variable `disk_size`. Im Lab hat `tofu apply` die Disks von 20 auf 30 GB vergrössert, ohne die VMs neu zu starten. Das Dateisystem wuchs dabei mit.

## Geschwindigkeit

Die Geschwindigkeit misst man in Tokens pro Sekunde, getrennt für das Lesen der Frage und das Schreiben der Antwort. Die Schnittstelle von Ollama liefert beide Werte mit. Auf dem Front-end leitest du ihren Port weiter und stellst eine Frage.

```bash
kubectl -n ai port-forward svc/ollama 11434:11434 &
curl -s localhost:11434/api/generate -d '{
  "model": "llama3.2:3b", "stream": false,
  "prompt": "Der Webshop beantwortet seit zehn Minuten 30 % der Anfragen mit Fehler 500. Was soll das Plattform-Team zuerst prüfen? Drei Sätze."
}' | python3 -c 'import json, sys; d = json.load(sys.stdin)
print(d["eval_count"] / d["eval_duration"] * 1e9, "Tokens/s"); print(d["response"])'
```

| Messung im Lab | Wert |
|---|---|
| Laden des Modells beim ersten Aufruf | 2,8 s |
| Lesen der Frage, 77 Tokens | 75 Tokens/s |
| Schreiben der Antwort | 22,6 Tokens/s |
| ganze Antwort, erster Aufruf | 10,3 s |
| ganze Antwort, zweiter Aufruf | 5,4 s |

Beim zweiten Aufruf war das Modell geladen und die gleiche Frage im Zwischenspeicher. Das Schreiben der Antwort braucht die meiste Zeit, denn jedes Token hängt vom vorherigen ab und muss einzeln berechnet werden.

## AVX2 und FMA

Auf der CPU rechnet ein Modell mit Vektorbefehlen wie AVX2 und FMA. In Kapitel 4.2 bekamen die VMs des Clusters `host-passthrough` und sehen damit die echte CPU des Knotens. Im Testaufbau sah eine VM ohne diese Einstellung nur eine allgemeine CPU ohne AVX2. Dasselbe Modell schrieb dort fast neunmal langsamer, 2,2 statt 19,4 Tokens pro Sekunde. Ob die Befehle in der VM ankommen, prüfst du auf dem Agent selbst.

```bash
ssh root@<adresse-des-agents> "grep -o -w -E 'avx2|fma' /proc/cpuinfo | sort | uniq -c"
```

## Inferenz als Last

Während einer Antwort belegt Ollama fast alle vier Kerne des Agents, im Testaufbau etwa 3,9. Das ist eine neue Art Last für die Plattform. Eine einzige Anfrage kann einen Node für Sekunden auslasten. Fragen zwei Mitglieder gleichzeitig, warten sie aufeinander. Eine Quota pro Namespace hilft hier nicht, denn alle Anfragen laufen im Pod von Ollama. Die Plattform steuert darum zuerst, wer das Modell überhaupt erreicht.

::code{file="platform/observability/repo/ai/networkpolicy.yaml"}

Ein Mitglied bekommt Zugriff, wenn sein Namespace das Label `ai: allowed` trägt. Das Label setzt du im Ordner des Mitglieds unter `members`, als Patch auf den Namespace. Kustomize fügt es zu den Labels hinzu, die der Namespace schon hat. Die Labels der Vorlage bleiben also erhalten.

```yaml
  - target:
      kind: Namespace
    patch: |-
      apiVersion: v1
      kind: Namespace
      metadata:
        name: velo
        labels:
          ai: allowed
```

Im Lab bekam ein Pod in `velo` zuerst keine Verbindung und nach dem Push mit dem Label die Antwort «Ollama is running». Wie viel ein Mitglied fragen darf, liesse sich erst mit einem Gateway vor Ollama begrenzen, das Anfragen pro Mitglied zählt.

## Die OpenAI-kompatible Schnittstelle

Viele Programme nutzen die Schnittstelle von OpenAI. Ollama bietet unter `/v1/chat/completions` dieselbe Form an. Ein Programm, das sonst einen Dienst im Internet nutzt, braucht dann nur eine andere Adresse und keinen Schlüssel.

```bash
curl -s localhost:11434/v1/chat/completions -H 'Content-Type: application/json' -d '{
  "model": "llama3.2:3b",
  "messages": [{"role": "user", "content": "Antworte nur mit OK."}]
}'
```

## Die Qualität der Antworten

Im Lab gab das Modell auf die Frage zu den Fehlern 500 plausible, aber allgemeine Ratschläge. Es empfahl, Server, Netzwerk und Datenbank zu prüfen, obwohl der Webshop keine Datenbank hat. Zudem schrieb es «anschliessend» mit Eszett. Das Modell kennt das System nicht und rät aus dem, was in ähnlichen Texten steht. Für eine brauchbare Antwort braucht es Kontext, etwa die Logs und den Zustand des Deployments. Den liefert ihm der Triage-Dienst in Kapitel 5.6, entscheiden muss dort ein Mensch.

::::exercise[Lab]
Rolle Ollama aus, miss die Geschwindigkeit dreimal mit derselben und einmal mit einer neuen Frage und prüfe, ob der Agent AVX2 sieht. Lass das Modell eine Frage aus deinem Fachgebiet beantworten und beurteile die Antwort.

:::solution
`kubectl -n ai get pods` zeigt `ollama` als bereit und den Job `pull-model` als abgeschlossen. Die Antwort kommt mit etwa 20 Tokens pro Sekunde, der erste Aufruf dauert wegen des Ladens länger. Eine neue Frage muss wieder ganz gelesen werden. Die Beurteilung nennt, was stimmt, was erfunden ist und was fehlt.
:::
::::

::::exercise[Zugriff]
Gib dem Veloatelier Zugriff auf das Modell, aber nicht der Gemeinde. Zeige beides mit einem Test-Pod.

:::solution
Der Patch mit `ai: allowed` kommt in `members/velo/kustomization.yaml`. Nach dem Push trägt der Namespace das Label. `wget -qO- http://ollama.ai.svc:11434/` aus einem Pod in `velo` gibt «Ollama is running», aus `gemeinde` scheitert die Verbindung.
:::
::::

::::exercise[Grösser oder schneller]
Die Treuhand will Belege zusammenfassen und fragt, ob ein grösseres Modell besser wäre. Was spricht dafür, was dagegen? Wie würdest du es prüfen?

:::solution
Ein grösseres Modell schreibt meist genauer, braucht aber mehr Speicher und schreibt langsamer. Mit acht Milliarden Parametern bräuchte es mehr als doppelt so viel Speicher. Das Limit des Pods von 4 GB würde dann nicht mehr reichen. Zum Prüfen nimmst du eine Handvoll echter Belege ohne Personendaten und notierst für jedes Modell Zeit und Qualität. Die Entscheidung hängt davon ab, ob die Treuhand auf eine Antwort warten kann.
:::
::::
