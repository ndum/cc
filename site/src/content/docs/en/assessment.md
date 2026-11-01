---
title: Assessment
description: How the four milestones make up two grades, how you show and hand in a milestone, and how your hand-in repo is organized.
---

Your grade comes from four milestones. You hand in two of them together each time, and each hand-in gives one grade.

| Hand-in | Milestones | Weight |
|---|---|---|
| Hand-in 1 | Milestone 1 IaaS for Wolkenwerk and milestone 2 platform as code | 50% |
| Hand-in 2 | Milestone 3 observability, scaling and AI and milestone 4 a member of your own | 50% |

Your module grade is the average of the two grades. Your instructor gives you the dates of the hand-ins, the way to hand in and the rules for late submissions.

## The milestones

Every milestone is individual work in your own lab. The assignments of the milestones come with the parts they belong to. [Milestone 1](milestone-1/) belongs to part 2 and part 3, [milestone 2](milestone-2/) to part 4, [milestone 3](milestone-3/) to part 5 and [milestone 4](milestone-4/) to part 6. In milestone 4 you design a fifth member of Wolkenwerk Bern yourself and bring it onto your platform.

Every milestone has a rubric. About 60% of the points are for the features the assignment asks for, about 40% for your explanations and the reasons behind your decisions.

## Showing

You show a milestone either live in class or in a screencast. The screencast lasts at most ten minutes and is a single recording without cuts. It starts with your file `/etc/cc-lab.env` and the report of the check with its hash. Then you demonstrate the required features in your lab, and at the end you explain two or three of your own decisions. [Chapter 0.5](../start/tools/#screencasts) lists the rules as well.

## Handing in

You hand in through your private repo on the school's GitLab or on GitHub, with read access for your instructor. A hand-in is a Git tag, `abgabe-1` for the first one and `abgabe-2` for the second.

```text
cc-mmuster/
  README.md          your code, name of your instructor, table of contents
  reports/           the reports of the checks from ~/cc-reports
  m1/README.md       architecture, own decisions, use of AI, link to the screencast
  un2/README.md
  un3/README.md
  un4/README.md
  ...                your code, such as OpenTofu, manifests and scripts
```

The README of every milestone states what you used an AI assistant for. Put the screencast into the folder of the milestone, or link to it if it is too large for the repo, for example on OneDrive.
