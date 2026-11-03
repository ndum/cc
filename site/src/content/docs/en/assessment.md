---
title: Assessment
description: How the milestones and the exam make up your module grade, what the base and the advanced tasks ask for, how you prove the base and document and show the advanced tasks, and how your hand-in repo is organized.
---

Your module grade consists of two grades.

| Grade | Based on | Weight |
|---|---|---|
| Grade 1 | The four milestones in two hand-ins | 60% |
| Grade 2 | The [exam](exam/) towards the end of the module | 40% |

The module grade is 0.6 × grade 1 + 0.4 × grade 2. Rounding follows the school's rules. There is no minimum for either grade, so a weaker grade can be offset by the other one. Your instructor gives you the dates of the hand-ins and the exam and the rules for late submissions.

## Grade 1 from the milestones

You hand in two milestones together each time. Each hand-in gives one grade, and grade 1 is the average of these two grades.

| Hand-in | Milestones |
|---|---|
| Hand-in 1 | [IaaS for Wolkenwerk (Milestone 1)](milestone-1/) and [Platform as code (Milestone 2)](milestone-2/) |
| Hand-in 2 | [Observability, scaling and AI (Milestone 3)](milestone-3/) and [Operations and a member of your own (Milestone 4)](milestone-4/) |

## Points and grade

Each milestone is worth up to 30 points, 21 for the base and 9 for the advanced tasks. A hand-in covers two milestones and so up to 60 points. The grade of a hand-in is 5 × points / 60 + 1. A complete base in both milestones gives you 42 points and a 4.5, and with every advanced task on top you reach a 6. Without advanced tasks, grade 1 is therefore at most a 4.5.

| Points | Grade |
|---|---|
| 30 | 3.5 |
| 36 | 4.0 |
| 42 | 4.5 |
| 48 | 5.0 |
| 51 | 5.25 |
| 54 | 5.5 |
| 60 | 6.0 |

## The milestones

[Milestone 1](milestone-1/) belongs to parts 0 to 3, [milestone 2](milestone-2/) to part 4, [milestone 3](milestone-3/) to part 5 and [milestone 4](milestone-4/) to part 6. Each milestone consists of a base with seven requirements and three advanced tasks that go beyond it.

You may work in a team. Talking a solution through and hunting for errors together is part of learning. You build your lab yourself, though, and you hand in on your own, which is why every lab carries its own [personal parameters](../start/parameters/). Your report and your answers to the questions show whether the solution runs in your lab and whether you understand it.

## Base

The base is the work you do with the chapters and their scripts in class and in self-study. Each milestone lists seven requirements, and each one is worth 0 to 3 points.

| Points | State |
|---|---|
| 3 | the check report and a screenshot prove the requirement |
| 2 | the check is green, but a fitting screenshot is missing |
| 1 | the requirement is only partly met, for example the screenshot shows it but the check is red |
| 0 | the requirement is missing |

If no check tests a requirement, its screenshot alone proves it.

The milestone check marks the base requirements with `[ok]` or `[!!]` and counts only those. It marks traces of the advanced tasks with `[+ok]` or `[+!!]` and tallies them separately, outside the base.

## Proving the base

You prove the base with the check report and screenshots alone. You need no text, no drawing and no screencast for it. For each of the seven requirements you put at least one screenshot into the folder of the milestone, with a file name that starts with the number of the requirement, such as `4-migration.png`. Every terminal screenshot shows the prompt with the name of your VM. The reports of the checks `m1` to `m4` go into `reports/`, for milestone 1 together with the reports of `start`, `install` and `iaas`.

## Advanced tasks

Each milestone has three advanced tasks A, B and C. They take more work of your own than the base, so plan four to six hours per milestone. You can pick individual tasks, and each one is worth 0 to 3 points on its own. The milestone names the chapters that help with each task.

## Documenting the advanced tasks

For every advanced task you do, you write documentation in a format of your choice, Markdown, Word or PDF. It has these five parts.

1. A sketch of your solution with the components involved
2. Your implementation with your values, outputs and screenshots
3. A decision of your own with an alternative and a trade-off
4. The files the task names, such as scripts or manifests
5. What you used an AI assistant for

If the documentation or one of the parts 1, 2, 4 and 5 is missing, an advanced task gets at most 1 point, even if it runs in the showing. The decision of your own in part 3 separates level 2 from level 3.

## Levels of the advanced tasks

Every advanced task is graded on the same levels.

| Points | Level |
|---|---|
| 0 | missing |
| 1 | runs |
| 2 | runs and is explained on your own lab in the documentation and the showing, with your values and outputs |
| 3 | in addition, a decision of your own with an alternative and a trade-off |

## Showing the advanced tasks

You show the advanced tasks of a milestone in one showing, either live in class or in a screencast of at most ten minutes. For a live showing it is up to you to approach your instructor and book a slot.

:::caution[Deadline for the showing]
The showing must take place by the hand-in the milestone belongs to, and a screencast or its link and the documentation must be in the hand-in repo by then. A showing after that date, or a screencast added after it, no longer counts. So book a live slot early.
:::

The screencast is a single recording without cuts. It starts with `cat /etc/cc-lab.env` and the report of the milestone check with its hash and your two questions. Then you demonstrate the advanced tasks in your lab. [Chapter 0.5](../start/tools/#screencasts) lists the rules as well.

## Personal values and questions

Some values of the base come from your personal code, for example the municipality's quota or the SLO target. The [parameter generator](../start/parameters/) lists them in a table at the end. Each milestone has a check of its own, `m1` to `m4`. It runs the check of the part, verifies your personal values and uses your code to draw two questions. A solution taken from another lab therefore shows up in the check.

You answer the two questions during the showing of the advanced tasks, live or in the screencast. They can be about the base or about an advanced task. Every question you leave unanswered or answer wrongly costs 1 point of the advanced tasks of that milestone.

## Grade 2 from the exam

The exam is an individual exam of 60 minutes towards the end of the module. Every aid is allowed, including the internet and AI assistants, but no AI agents. Its form and date are not settled yet, and the page [Exam](exam/) collects what is known.

## Handing in

You hand in through your private repo on the school's GitLab or on GitHub, set up as [chapter 0.5](../start/tools/#the-hand-in-repo) describes. A hand-in is a Git tag, `abgabe-1` for the first one and `abgabe-2` for the second. You set it on the front-end with `git tag abgabe-1` and push it with `git push origin abgabe-1`.

```text
cc-mmuster/
  README.md          your code, name of your instructor, table of contents
  cc-lab.env         a copy of /etc/cc-lab.env
  reports/           the reports of the checks from ~/cc-reports
  m1/                screenshots of the base, documentation and files of the advanced tasks
  m2/
  m3/
  m4/
```

Put a screencast into the folder of the milestone. If it is too large for the repo, store it somewhere like OneDrive and link to it from the documentation of the advanced tasks.

:::caution[No secrets in the repo]
The OpenTofu state, tokens such as the k3s token, passwords and the Sealed Secrets key never belong in your hand-in repo. Once a file is in a commit, it stays in the Git history even if you delete it later. Before every commit, check with `git status` which files you are adding.
:::
