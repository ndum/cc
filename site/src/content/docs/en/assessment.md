---
title: Assessment
description: How the four implementation proofs make up two grades, how you show and hand in a proof, and how your hand-in repo is organized.
---

Your grade comes from four implementation proofs. You hand in two of them together each time, and each hand-in gives one grade.

| Hand-in | Proofs | When | Weight |
|---|---|---|---|
| Hand-in 1 | UN1 IaaS for Wolkenwerk and UN2 platform as code | end of block 4 | 50% |
| Hand-in 2 | UN3 observability, scaling and AI and UN4 a member of your own | end of block 6 | 50% |

Your module grade is the average of the two grades. Block 7 is reserved for the mock exam and its discussion, which does not count toward the grade. Your teacher gives you the exact dates, the way to hand in and the rules for late submissions.

## The proofs

Every proof is individual work in your own lab. The assignments of the proofs come with the parts they belong to. UN1 belongs to part 2 and part 3, UN2 to part 4, UN3 to part 5 and UN4 to part 6. In UN4 you design a fifth member of Wolkenwerk Bern yourself and bring it onto your platform.

Every proof has a rubric. About 60% of the points are for the features the assignment asks for, about 40% for your explanations and the reasons behind your decisions.

## Showing

You show a proof either live in class or in a screencast. The screencast lasts at most ten minutes and is a single recording without cuts. It starts with your file `/etc/cc-lab.env` and the report of the check with its hash. Then you demonstrate the required features in your lab, and at the end you explain two or three of your own decisions. [Chapter 0.3](../start/tools/#screencasts) lists the rules as well.

## Handing in

You hand in through your private repo on the school's GitLab or on GitHub, with read access for your teacher. A hand-in is a Git tag, `abgabe-1` for the first one and `abgabe-2` for the second.

```text
cc-mmuster/
  README.md          your code, your teacher and a table of contents
  reports/           the reports of the checks from ~/cc-reports
  un1/README.md      architecture, own decisions, use of AI, link to the screencast
  un2/README.md
  un3/README.md
  un4/README.md
  ...                your code, such as OpenTofu, manifests and scripts
```

The README of every proof states what you used an AI assistant for. Put the screencast into the folder of the proof, or link to it if it is too large for the repo, for example on OneDrive.

## Diploma exam

The diploma exam follows after the module, outside of it. It is practical, takes 60 minutes and is open book. The mock exam in block 7 has the same format.
