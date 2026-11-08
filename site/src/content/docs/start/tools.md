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

In das Repo kommen die Berichte der Checks, eine Kopie von `/etc/cc-lab.env` und pro Meilenstein die Screenshots der Basis. Für die Zusatzaufträge kommen ihre Dokumentation, dein Code und dein Screencast oder ein Link darauf dazu. Die genaue Struktur, die Regeln für Screencasts und womit du sie aufnimmst, stehen unter [Leistungsbeurteilung](../../assessment/).

## Zugriff vom Front-end

Die meisten Dateien entstehen auf dem Front-end, deshalb klonst du das Repo dorthin. Melde dich mit `ssh mmuster-fe` an. Git schreibt in jeden Commit deinen Namen und deine E-Mail-Adresse. Lege beide auf dem Front-end einmal fest, sonst bricht der erste Commit ab.

```bash
git config --global user.name "Max Muster"
git config --global user.email "max.muster@example.ch"
```

Den Schlüssel, den du in Kapitel 0.4 auf dem Front-end erzeugt hast, legst du in deinem Repo als Deploy Key mit Schreibrecht ab. Er hat keine Passphrase und öffnet deshalb nur dieses Repo, nicht dein ganzes Konto. `cat ~/.ssh/id_ed25519.pub` zeigt ihn auf dem Front-end. Kopiere ihn im Terminal des Clients und füge ihn im Browser des Clients ein, auf GitHub unter «Settings» › «Deploy keys» mit «Allow write access», auf GitLab unter «Settings» › «Repository» › «Deploy keys» mit «Grant write permissions to this key». Die Schritte zeigen auch die Anleitungen von [GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) und von [GitLab](https://docs.gitlab.com/user/project/deploy_keys/).

Die Adresse zum Klonen zeigt dein Repo unter «Code», auf GitHub im Reiter «SSH», auf GitLab unter «Clone with SSH». Bei der ersten Verbindung bestätigst du den Schlüssel von GitHub oder GitLab mit `yes`.

```bash
git clone git@github.com:mmuster/cc-mmuster.git
```

## Bericht und Screenshots hochladen

Lege eine Kopie von `/etc/cc-lab.env` und den Bericht des Checks `start` aus Kapitel 0.4 in dein Repo und lade beides hoch. Der Block findet dein Repo über den Code in `/etc/cc-lab.env`.

```bash
. /etc/cc-lab.env
cd ~/cc-$CC_CODE
mkdir -p reports m1
cp /etc/cc-lab.env .
cp ~/cc-reports/start-*.txt reports/
git add .
git commit -m "Check start"
git push
```

Der Check `start` ist Anforderung 1 von Meilenstein 1. Mach deshalb gleich einen Screenshot davon. Screenshots entstehen auf dem Client. Mit `scp` kopierst du sie in den Ordner des Meilensteins auf dem Front-end und lädst sie dort wie oben mit `git add`, `git commit` und `git push` hoch.

```bash
scp 1-start.png mmuster-fe:cc-mmuster/m1/
```

::::exercise[Lab]
Lege dein Abgabe-Repo an und gib dem Front-end mit einem Deploy Key Zugriff. Lade die Kopie von `/etc/cc-lab.env`, den Bericht des Checks `start` und einen Screenshot `1-start.png` hoch.

:::solution
Im Repo liegen `cc-lab.env`, `reports/start-<zeit>.txt` und `m1/1-start.png`. `git push` läuft ohne Passwort, weil der Deploy Key zum Schlüssel des Front-ends passt. Bricht der erste Commit mit «Author identity unknown» ab, fehlen Name und E-Mail aus `git config`.
:::
::::
