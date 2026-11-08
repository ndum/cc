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

Before you clone the repo, enter your code and the name of your instructor in the README in the browser. The clone on the front-end then starts with that state.

The repo holds the reports of the checks, a copy of `/etc/cc-lab.env` and the screenshots of the base for every milestone. For the advanced tasks their documentation and your code go there too, and of a screencast only its link. [Assessment](../../assessment/) describes the exact layout, the rules for screencasts and how you record them.

## Access from the front-end

Most of the files come from the front-end, so you clone the repo there. Log in with `ssh mmuster-fe`. Git writes your name and e-mail address into every commit. Set both once on the front-end, otherwise the first commit stops. The third line of the block makes `git pull` put your own commits on top of the new state from the repo when both sides have new commits. Without it, `git pull` stops in that case, as the [git pull documentation](https://git-scm.com/docs/git-pull) describes.

```bash
git config --global user.name "Max Muster"
git config --global user.email "max.muster@example.ch"
git config --global pull.rebase true
```

The key you created on the front-end in chapter 0.4 goes into your repo as a deploy key with write access. It has no passphrase, so it opens only this repo, not your whole account. `cat ~/.ssh/id_ed25519.pub` shows it on the front-end. Copy it in the terminal of the client and paste it in the browser of the client, on GitHub under "Settings" › "Deploy keys" with "Allow write access", on GitLab under "Settings" › "Repository" › "Deploy keys" with "Grant write permissions to this key". The guides of [GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) and [GitLab](https://docs.gitlab.com/user/project/deploy_keys/) show the steps as well.

Your repo shows the address for cloning under "Code", on GitHub in the tab "SSH", on GitLab under "Clone with SSH". At the first connection you confirm the key of GitHub or GitLab with `yes`.

```bash
git clone git@github.com:mmuster/cc-mmuster.git
```

If `git clone` or a later `git push` fails, the message usually names the cause already.

| Symptom | Cause | What helps |
|---|---|---|
| `git clone` stops after a while with "Connection timed out" | The network does not let SSH out on port 22 | On GitHub, connect over port 443 as [GitHub's guide](https://docs.github.com/en/authentication/troubleshooting-ssh/using-ssh-over-the-https-port) shows. For the school's GitLab, ask your instructor |
| "Permission denied (publickey)" | The deploy key is missing from the repo or does not match the front-end's key | Compare `cat ~/.ssh/id_ed25519.pub` with the deploy key in the repo and check the address for cloning |
| `git push` reports "read only" or "does not have write access" | The deploy key may only read | Delete the deploy key and add it again with write access |
| `git push` reports "rejected" and "fetch first" | The repo holds commits from the browser that the front-end lacks | `git pull`, then `git push` again |

## Uploading the report and screenshots

Put a copy of `/etc/cc-lab.env` and the report of the check `start` from chapter 0.4 into your repo and upload both. The block finds your repo through the code in `/etc/cc-lab.env`. `git pull` first fetches whatever is new in the repo.

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

If you later upload files in the browser, such as documentation in Word or PDF, or edit the README there, the front-end lacks these changes. So start every piece of work in the repo on the front-end with `git pull`. Otherwise `git push` rejects your next commit with "fetch first".

You take screenshots on the client with the screenshot tool of Kali and save them in your home folder under the number of the requirement, for example `5-trennung.png` for requirement 5 of milestone 1. To copy them, open a second tab in the terminal of the client. It stays on the client while the first tab is logged in to the front-end. There `scp` copies the picture into the folder of the milestone on the front-end. For the screenshot `1-start.png` from chapter 0.4 it looks like this.

```bash
scp ~/1-start.png mmuster-fe:cc-mmuster/m1/
```

Then upload it in the first tab with `git add`, `git commit` and `git push` as above. If you missed the screenshot in chapter 0.4, `cat ~/cc-reports/start-*.txt` on the front-end shows the saved report with its hash. Take the screenshot of that, because a new run of the check would write a new report with a different hash.

::::exercise[Lab]
Create your hand-in repo and give the front-end access with a deploy key. Upload the copy of `/etc/cc-lab.env`, the report of the check `start` and your screenshot `1-start.png` from chapter 0.4.

:::solution
The repo holds the README, `cc-lab.env`, `reports/start-<time>.txt` and `m1/1-start.png`. `git push` runs without a password because the deploy key matches the front-end's key. If the first commit stops with "Author identity unknown", the name and e-mail from `git config` are missing.
:::
::::
