---
title: Das Abgabe-Repo
description: Das private Abgabe-Repo auf GitLab oder GitHub, der Zugriff des Front-ends mit einem Deploy Key, die Identität von Git und das Hochladen von Berichten und Screenshots.
sidebar:
  order: 5
---

:::assignment
«Bevor wir weitermachen, will der Vorstand wissen, wie wir festhalten, was wir bauen», schreibt Simone Wyss. «Kannst du ein Repo anlegen, in dem jeder Schritt nachvollziehbar ist?»
:::

:::goals
Nach diesem Kapitel kannst du:

- Dein Abgabe-Repo anlegen und mit deiner Dozentin oder deinem Dozenten teilen
- Dem Front-end mit einem Deploy Key Zugriff auf das Repo geben
- Berichte, Screenshots und die Kopie von `/etc/cc-lab.env` hochladen
:::

## Das Repo anlegen

Für deine Meilensteine legst du ein privates Repo an, entweder auf dem GitLab deiner Schule oder auf GitHub. Nenne es `cc-` und deinen Code, also zum Beispiel `cc-mmuster`. Lege es gleich mit einer README an. Auf GitHub heisst diese Option «Add a README file», auf GitLab «Initialize repository with a README». Auf GitLab gibst du deiner Dozentin oder deinem Dozenten die Rolle Reporter, die nur lesen darf. Auf GitHub lädst du sie oder ihn als Collaborator ein, denn ein privates Repo eines persönlichen Kontos kennt dort nur Schreibzugriff. Den Benutzernamen dafür nennt dir deine Dozentin oder dein Dozent.

Trag noch vor dem Klonen im Browser deinen Code und den Namen deiner Dozentin oder deines Dozenten in die README ein. Dann beginnt der Klon auf dem Front-end schon mit diesem Stand.

In das Repo kommen die Berichte der Checks, eine Kopie von `/etc/cc-lab.env` und pro Meilenstein die Screenshots der Basis. Für die Zusatzaufträge kommen ihre Dokumentation und dein Code dazu, von einem Screencast nur sein Link. Die genaue Struktur, die Regeln für Screencasts und womit du sie aufnimmst, stehen unter [Leistungsbeurteilung](../../assessment/).

## Zugriff vom Front-end

Die meisten Dateien entstehen auf dem Front-end, deshalb klonst du das Repo dorthin. Melde dich mit `ssh mmuster-fe` an. Git schreibt in jeden Commit deinen Namen und deine E-Mail-Adresse. Lege beide auf dem Front-end einmal fest, sonst bricht der erste Commit ab. Die dritte Zeile des Blocks sorgt dafür, dass `git pull` deine eigenen Commits auf den neuen Stand aus dem Repo setzt, wenn beide Seiten neue Commits haben. Ohne sie bricht `git pull` in diesem Fall ab, wie die [Dokumentation von git pull](https://git-scm.com/docs/git-pull) beschreibt.

```bash
git config --global user.name "Max Muster"
git config --global user.email "max.muster@example.ch"
git config --global pull.rebase true
```

Den Schlüssel, den du in Kapitel 0.4 auf dem Front-end erzeugt hast, legst du in deinem Repo als Deploy Key mit Schreibrecht ab. Er hat keine Passphrase und öffnet deshalb nur dieses Repo, nicht dein ganzes Konto. `cat ~/.ssh/id_ed25519.pub` zeigt ihn auf dem Front-end. Kopiere ihn im Terminal des Clients und füge ihn im Browser des Clients ein, auf GitHub unter «Settings» › «Deploy keys» mit «Allow write access», auf GitLab unter «Settings» › «Repository» › «Deploy keys» mit «Grant write permissions to this key». Die Schritte zeigen auch die Anleitungen von [GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) und von [GitLab](https://docs.gitlab.com/user/project/deploy_keys/).

Die Adresse zum Klonen zeigt dein Repo unter «Code», auf GitHub im Reiter «SSH», auf GitLab unter «Clone with SSH». Bei der ersten Verbindung bestätigst du den Schlüssel von GitHub oder GitLab mit `yes`.

```bash
git clone git@github.com:mmuster/cc-mmuster.git
```

Bricht `git clone` oder später `git push` ab, nennt die Meldung meist schon die Ursache.

| Symptom | Ursache | Was hilft |
|---|---|---|
| `git clone` bricht nach einer Weile mit «Connection timed out» ab | Das Netz lässt SSH auf Port 22 nicht hinaus | Auf GitHub über Port 443 verbinden, wie es die [Anleitung von GitHub](https://docs.github.com/en/authentication/troubleshooting-ssh/using-ssh-over-the-https-port) zeigt. Beim GitLab der Schule fragst du deine Dozentin oder deinen Dozenten |
| «Permission denied (publickey)» | Im Repo fehlt der Deploy Key oder er passt nicht zum Schlüssel des Front-ends | `cat ~/.ssh/id_ed25519.pub` mit dem Deploy Key im Repo vergleichen und die Adresse zum Klonen prüfen |
| `git push` meldet «read only» oder «does not have write access» | Der Deploy Key darf nur lesen | Den Deploy Key löschen und mit Schreibrecht neu eintragen |
| `git push` meldet «rejected» und «fetch first» | Im Repo liegen Commits aus dem Browser, die auf dem Front-end fehlen | `git pull`, danach noch einmal `git push` |

## Bericht und Screenshots hochladen

Lege eine Kopie von `/etc/cc-lab.env` und den Bericht des Checks `start` aus Kapitel 0.4 in dein Repo und lade beides hoch. Der Block findet dein Repo über den Code in `/etc/cc-lab.env`. `git pull` holt zuerst, was im Repo neu ist.

```bash
source /etc/cc-lab.env
cd ~/cc-$CC_CODE
git pull
mkdir -p reports m1
cp /etc/cc-lab.env .
cp ~/cc-reports/start-*.txt reports/
git add .
git commit -m "Check start"
git push
```

Lädst du später Dateien im Browser hoch, etwa eine Dokumentation als Word oder PDF, oder änderst du dort die README, fehlen diese Änderungen auf dem Front-end. Beginne deshalb jede Arbeit im Repo auf dem Front-end mit `git pull`. Sonst weist `git push` deinen nächsten Commit mit «fetch first» ab.

Screenshots machst du auf dem Client mit dem Screenshot-Werkzeug von Kali. Du speicherst sie in deinem Home-Ordner unter der Nummer der Anforderung, etwa `5-trennung.png` für Anforderung 5 von Meilenstein 1. Zum Kopieren öffnest du im Terminal des Clients einen zweiten Tab. Er bleibt auf dem Client, während der erste Tab am Front-end angemeldet ist. Dort kopiert `scp` das Bild in den Ordner des Meilensteins auf dem Front-end. Für den Screenshot `1-start.png` aus Kapitel 0.4 sieht das so aus.

```bash
scp ~/1-start.png mmuster-fe:cc-mmuster/m1/
```

Im ersten Tab lädst du ihn danach wie oben mit `git add`, `git commit` und `git push` hoch. Fehlt dir der Screenshot aus Kapitel 0.4, zeigt `cat ~/cc-reports/start-*.txt` auf dem Front-end den gespeicherten Bericht mit seinem Hash. Mach den Screenshot dann davon, denn ein neuer Lauf des Checks gäbe einen neuen Bericht mit einem anderen Hash.

::::exercise[Lab]
Lege dein Abgabe-Repo an und gib dem Front-end mit einem Deploy Key Zugriff. Lade die Kopie von `/etc/cc-lab.env`, den Bericht des Checks `start` und deinen Screenshot `1-start.png` aus Kapitel 0.4 hoch.

:::solution
Im Repo liegen die README, `cc-lab.env`, `reports/start-<zeit>.txt` und `m1/1-start.png`. `git push` läuft ohne Passwort, weil der Deploy Key zum Schlüssel des Front-ends passt. Bricht der erste Commit mit «Author identity unknown» ab, fehlen Name und E-Mail aus `git config`.
:::
::::
