---
title: Mock exam
description: Schedule, preparation, allowed aids and evaluation of the mock exam in block 7, with three faults and one extension in your own lab.
---

Block 7 is where you practice the format of the diploma exam on your own lab. A script breaks three things and asks for one extension. You have 60 minutes to find and fix the faults and to put the extension into operation. The mock exam does not count toward your grade. It shows you where you are still unsure while there is time left to practice.

## Schedule

| Lesson | What happens |
|---|---|
| 25 | Questions about the format, snapshots in smartlearn, getting the script, start |
| 25 to 27 | 60 minutes of mock exam |
| 27 and 28 | Discussion of every fault, self-assessment, reset, outlook on the diploma exam |

## Preparation

Your lab needs to be in the state it had after part 6. Before block 7, make sure the checks `platform`, `observability` and `operations` are green. A fault that was already there before the start costs you time during the exam.

At the beginning of lesson 25, take a snapshot of all three VMs in smartlearn. It is your safety net. If something goes so wrong that you cannot repair it after the exam, you roll the VMs back to the snapshot.

Your teacher provides the script `cc-exam.py` in smartlearn. Copy it to your home directory on the front-end and start it with the round number your teacher announces.

```bash
python3 ~/cc-exam.py start 7
```

The script asks about the snapshots, breaks things and shows you three tickets and the extension. `python3 ~/cc-exam.py tickets` shows them again at any time.

## Tickets and extension

Each ticket describes a symptom the way a member or the management would report it. It does not name the cause. One ticket concerns the IaaS layer with OpenNebula, one the platform with k3s and GitOps, and one operations with security, backup and monitoring. Which faults you get depends on your personal code and the round number, so your neighbors have different ones.

The extension asks for a sixth member of Wolkenwerk, with a group and a quota in OpenNebula and a namespace with an app on the platform. The values are in the assignment.

For each ticket, write three sentences in a text file, one each on the cause, the fix and how to prevent it. [Troubleshooting](../../troubleshooting/#handling-a-fault) describes how to approach a fault.

## Checking

With `check`, the script tests whether the tickets are fixed and the extension runs. You can run it as often as you like.

```bash
python3 ~/cc-exam.py check
```

Like the course checks, the report goes to `~/cc-reports` and ends with a hash. Some repairs take a few minutes to show, for example when Argo CD has to sync again or OpenNebula has to monitor a node again.

## Allowed aids

You may use the course site, the documentation of the tools, the internet and your own notes and repos. AI assistants and any communication with other people are not allowed. The school announces which aids apply in the diploma exam.

## Evaluation

The mock exam does not count toward your grade. In the discussion, assess yourself using the report and your notes.

| Part | Points |
|---|---|
| Each ticket fixed | 1 each |
| Each ticket with the right cause | 1 each |
| Each ticket with a sensible prevention | 1 each |
| Extension with group and quota | 1 |
| Extension with namespace from the template | 1 |
| Extension with app from Git | 1 |
| **Total** | **12** |

After the exam, `python3 ~/cc-exam.py reveal` shows which faults the script introduced. In the discussion, the class goes through every fault that anyone got.

## Afterward

Reset whatever is still broken after the exam. The script only repairs the faults, the extension stays.

```bash
python3 ~/cc-exam.py restore
python3 ~/cc/checks/check.py operations
```

If the check is still not green and you cannot find the reason, roll the three VMs back to the snapshot in smartlearn.
