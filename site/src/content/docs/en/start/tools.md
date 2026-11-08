---
title: The hand-in repo
description: The private hand-in repo on GitLab or GitHub, access from the front-end with a deploy key, the Git identity and uploading reports and screenshots.
sidebar:
  order: 5
---

:::assignment
"Before we go on, the board wants to know how we keep track of what we build," Simone Wyss writes. "Could you set up a repo where every step can be followed?"
:::

:::goals
After this chapter you can:

- Create your hand-in repo and share it with your instructor
- Give the front-end access to the repo with a deploy key
- Upload reports, screenshots and the copy of `/etc/cc-lab.env`
:::

## Creating the repo

For your milestones you create a private repo, either on your school's GitLab or on GitHub. Name it `cc-` followed by your code, for example `cc-mmuster`, and create it with a README. On GitHub this option is called "Add a README file", on GitLab "Initialize repository with a README". On GitLab you give your instructor the role Reporter, which can only read. On GitHub you invite your instructor as a collaborator, because a private repo of a personal account only knows write access there. Your instructor tells you the user name to use.

The repo holds the reports of the checks, a copy of `/etc/cc-lab.env` and the screenshots of the base for every milestone. For the advanced tasks their documentation, your code and your screencast or a link to it go there too. [Assessment](../../assessment/) describes the exact layout, the rules for screencasts and how you record them.

## Access from the front-end

Most of the files come from the front-end, so you clone the repo there. Log in with `ssh mmuster-fe`. Git writes your name and e-mail address into every commit. Set both once on the front-end, otherwise the first commit stops.

```bash
git config --global user.name "Max Muster"
git config --global user.email "max.muster@example.ch"
```

The key you created on the front-end in chapter 0.4 goes into your repo as a deploy key with write access. It has no passphrase, so it opens only this repo, not your whole account. `cat ~/.ssh/id_ed25519.pub` shows it on the front-end. Copy it in the terminal of the client and paste it in the browser of the client, on GitHub under "Settings" › "Deploy keys" with "Allow write access", on GitLab under "Settings" › "Repository" › "Deploy keys" with "Grant write permissions to this key". The guides of [GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) and [GitLab](https://docs.gitlab.com/user/project/deploy_keys/) show the steps as well.

Your repo shows the address for cloning under "Code", on GitHub in the tab "SSH", on GitLab under "Clone with SSH". At the first connection you confirm the key of GitHub or GitLab with `yes`.

```bash
git clone git@github.com:mmuster/cc-mmuster.git
```

## Uploading the report and screenshots

Put a copy of `/etc/cc-lab.env` and the report of the check `start` from chapter 0.4 into your repo and upload both. The block finds your repo through the code in `/etc/cc-lab.env`.

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

The check `start` is requirement 1 of milestone 1, so take a screenshot of it right away. Screenshots come from the client. With `scp` you copy them into the folder of the milestone on the front-end and upload them there with `git add`, `git commit` and `git push` as above.

```bash
scp 1-start.png mmuster-fe:cc-mmuster/m1/
```

::::exercise[Lab]
Create your hand-in repo and give the front-end access with a deploy key. Upload the copy of `/etc/cc-lab.env`, the report of the check `start` and a screenshot `1-start.png`.

:::solution
The repo holds `cc-lab.env`, `reports/start-<time>.txt` and `m1/1-start.png`. `git push` runs without a password because the deploy key matches the front-end's key. If the first commit stops with "Author identity unknown", the name and e-mail from `git config` are missing.
:::
::::
