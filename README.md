# CC

The pages of the course are published at https://ndum.github.io/cc/.

Cloud computing with a private cloud of your own, a course for computer science students at Swiss higher vocational schools (HF) in the focus platform engineering. The course is called *HFI - Cloud Computing (CC)*. It is written in German and English and made for self-study, with short inputs in class.

Students build a private cloud on three virtual machines. OpenNebula runs as the infrastructure, a Kubernetes cluster is provisioned on top of it with OpenTofu and managed with GitOps, and Prometheus, Grafana and Loki watch it. In the advanced tasks a local language model runs as a service on the student's own platform.

## The running case

The chapters follow one case. Wolkenwerk Bern, a fictional cooperative in Bern, runs a shared cloud for its members, among them a medical practice, a fiduciary office, a bike shop with a web shop and a small municipality. Each part adds what the cooperative needs next.

## Repository

| Folder | Content |
|---|---|
| `site/` | the course site, built with Astro and Starlight, German at the root and English under `/en/` |
| `lab/` | the scripts that create and prepare the virtual machines of the lab and install OpenNebula |
| `platform/` | the platform on top of the cloud, tools, Gitea, Argo CD, the template of the platform repo with OpenTofu code and its additions for monitoring, the local model and operations with security and backup |
| `case/` | the container app of the case, the web shop with its load generator |
| `checks/` | the check scripts that test the state of a lab and write a report |
| `figures/` | the scripts that draw the figures and the favicon |
| `scripts/` | the checks of the course, the localization and the parameter generator |

## Working with the repo

Students clone the repo onto the virtual machines of their lab. Chapter 0.2 of the course explains the lab, chapter 0.4 how to prepare it.

```bash
git clone https://github.com/ndum/cc.git
```

The site and the checks need Node.js 22.18 or newer, pnpm 12 and Python 3, the CI uses Node.js 26. `corepack enable` provides the version of pnpm that `package.json` names.

```bash
pnpm install
pnpm --filter ./site run dev
pnpm --filter ./site run build
node --test "scripts/*.test.mjs"
python scripts/check_style.py
python scripts/check_parity.py
```

## License

Text, figures and screenshots are licensed under CC BY-SA 4.0, code under the MIT License. The license texts are in [LICENSES](LICENSES), `REUSE.toml` assigns them to the files.

The screenshots show the web interfaces of OpenNebula, Gitea, Argo CD, Prometheus, Alertmanager and Grafana in the lab of the course, to explain how to use them. These interfaces, their names and their logos belong to their projects.
