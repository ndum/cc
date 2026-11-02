---
title: Assessment
description: How the four milestones make up two grades, what the base and the advanced tasks ask for, how you document the base and show the advanced tasks, and how your hand-in repo is organized.
---

Your module grade comes from four milestones. You hand in two of them together each time, and each hand-in gives one grade.

| Hand-in | Milestones | Weight |
|---|---|---|
| Hand-in 1 | Milestone 1 IaaS for Wolkenwerk and milestone 2 platform as code | 50% |
| Hand-in 2 | Milestone 3 observability, scaling and AI and milestone 4 operations and a member of your own | 50% |

Your module grade is the average of the two grades. Your instructor gives you the dates of the hand-ins, the way to hand in and the rules for late submissions.

## Points and grade

Each milestone is worth up to 30 points, 21 for the base and 9 for the advanced tasks. A hand-in covers two milestones and so up to 60 points. The grade of a hand-in is 5 × points / 60 + 1. A complete base in both milestones gives you 42 points and a 4.5, and with every advanced task on top you reach a 6. Rounding follows the school's rules.

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

Every milestone is individual work in your own lab. Its assignment comes out together with the parts of the course it belongs to. [Milestone 1](milestone-1/) belongs to parts 0 to 3, [milestone 2](milestone-2/) to part 4, [milestone 3](milestone-3/) to part 5 and [milestone 4](milestone-4/) to part 6. Each milestone consists of a base with seven requirements and three advanced tasks that go beyond it.

Students may help each other, and talking a solution through is part of learning. Your personal values, your report and your answers to the questions show whether the solution runs in your lab and whether you understand it.

## Base

The base is the work you do with the chapters and their scripts in class and in self-study. Each milestone lists seven requirements, and each one is worth 0 to 3 points.

| Points | State |
|---|---|
| 3 | the check report and a screenshot prove the requirement |
| 1 | the requirement is only partly met, for example the screenshot shows it but the check is red |
| 0 | the requirement is missing |

Some requirements have no check, such as a drawing or a table of RPO and RTO. You prove those with the documentation alone. The milestone check marks the base requirements with `[ok]` or `[!!]` and counts only those. It marks traces of the advanced tasks with `[+ok]` or `[+!!]` and tallies them separately, outside the base.

## Documentation

You prove the base with documentation in a format of your choice, Markdown, Word or PDF. You do not need a screencast for it. The documentation starts with the content of your file `/etc/cc-lab.env`. After that comes a screenshot for each of the seven requirements, with one or two sentences on what it proves. Every terminal screenshot shows the prompt with the name of your VM. The documentation also includes the report of the check `m1` to `m4` and the files the milestone asks for.

## Advanced tasks

Each milestone has three advanced tasks A, B and C. They take more work of your own than the base, so plan four to six hours per milestone. You can pick individual tasks, and each one is worth 0 to 3 points on its own. The milestone names the chapters that help with each task.

## Levels of the advanced tasks

Every advanced task is graded on the same levels.

| Points | Level |
|---|---|
| 0 | missing |
| 1 | runs |
| 2 | runs and is explained on your own lab, with your values and outputs |
| 3 | in addition, a decision of your own with an alternative and a trade-off |

## Showing the advanced tasks

You show the advanced tasks of a milestone in one showing, either live in class or in a screencast of at most ten minutes. For a live showing it is up to you to approach your instructor and book a slot. The showing must take place by the hand-in the milestone belongs to, and a screencast must be in the hand-in repo by then. A showing after that date, or a screencast added after it, no longer counts.

The screencast is a single recording without cuts. It starts with `cat /etc/cc-lab.env` and the report of the milestone check with its hash and your two questions. Then you demonstrate the advanced tasks in your lab. [Chapter 0.5](../start/tools/#screencasts) lists the rules as well.

## Personal values and questions

Some values of the base come from your personal code, for example the municipality's quota or the SLO target. The [parameter generator](../start/parameters/) shows them below the content of `/etc/cc-lab.env`. Each milestone has a check of its own, `m1` to `m4`. It runs the check of the part, verifies your personal values and uses your code to draw two questions. A solution taken from another lab therefore shows up in the check.

You answer the two questions during the showing of the advanced tasks, live or in the screencast. Each question belongs to one advanced task. If you leave a question unanswered or answer it wrongly, the task it belongs to gets at most 1 point.

## Handing in

You hand in through your private repo on the school's GitLab or on GitHub, with read access for your instructor. A hand-in is a Git tag, `abgabe-1` for the first one and `abgabe-2` for the second.

```text
cc-mmuster/
  README.md          your code, name of your instructor, table of contents
  cc-lab.env         a copy of /etc/cc-lab.env
  reports/           the reports of the checks from ~/cc-reports
  m1/                documentation with screenshots, files, link to the screencast
  m2/
  m3/
  m4/
```

The documentation of every milestone states what you used an AI assistant for. Put a screencast into the folder of the milestone, or link to it from the documentation if it is too large for the repo, for example on OneDrive.
