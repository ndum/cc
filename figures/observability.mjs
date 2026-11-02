/**
 * Figures of part 5, observability, scaling and AI. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/observability.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, figure, label, line, meta, note, strip, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SCRAPE = {
  de: {
    title: 'Was Prometheus abholt',
    desc:
      'Links der Cluster k3s. Prometheus läuft im Namespace monitoring und holt die Metriken im Cluster ' +
      'vom Webshop im Namespace velo, von kube-state-metrics und von node-exporter auf k3s-server und ' +
      'k3s-agent. Ausserhalb des Clusters holt es auf dem Front-end den OpenNebula-Exporter auf Port 9925 ' +
      'und node_exporter auf Port 9100 ab, auf beiden Knoten node_exporter auf Port 9100 und den ' +
      'Libvirt-Exporter auf Port 9926. Grafana fragt Prometheus mit PromQL ab. Im Cluster findet ' +
      'Prometheus die Ziele über ServiceMonitors, ausserhalb über drei ScrapeConfigs.',
    cluster: 'Cluster k3s',
    ns: 'Namespace monitoring',
    inside: [
      ['Webshop', 'Pods in velo, Port 8080'],
      ['kube-state-metrics', 'Zustand der Objekte'],
      ['node-exporter', 'k3s-server, k3s-agent'],
    ],
    grafana: ['Grafana', 'Port 30300'],
    prometheus: ['Prometheus', 'Port 30090'],
    fe: 'Front-end',
    feTargets: [
      ['OpenNebula-Exporter', 'Port 9925'],
      ['node_exporter', 'Port 9100'],
    ],
    nodes: 'Knoten 1 und 2',
    nodeTargets: [
      ['node_exporter', 'Port 9100'],
      ['Libvirt-Exporter', 'Port 9926'],
    ],
    footer: 'Im Cluster findet Prometheus die Ziele über ServiceMonitors, ausserhalb über drei ScrapeConfigs.',
  },
  en: {
    title: 'What Prometheus scrapes',
    desc:
      'On the left the k3s cluster. Prometheus runs in the namespace monitoring and scrapes the metrics in ' +
      'the cluster from the web shop in the namespace velo, from kube-state-metrics and from node-exporter on ' +
      'k3s-server and k3s-agent. Outside the cluster it scrapes the OpenNebula exporter on port 9925 and ' +
      'node_exporter on port 9100 on the front-end, and node_exporter on port 9100 and the libvirt exporter ' +
      'on port 9926 on both nodes. Grafana queries Prometheus with PromQL. Inside the cluster Prometheus ' +
      'finds its targets through ServiceMonitors, outside through three ScrapeConfigs.',
    cluster: 'k3s cluster',
    ns: 'namespace monitoring',
    inside: [
      ['Web shop', 'pods in velo, port 8080'],
      ['kube-state-metrics', 'state of the objects'],
      ['node-exporter', 'k3s-server, k3s-agent'],
    ],
    grafana: ['Grafana', 'port 30300'],
    prometheus: ['Prometheus', 'port 30090'],
    fe: 'Front-end',
    feTargets: [
      ['OpenNebula exporter', 'port 9925'],
      ['node_exporter', 'port 9100'],
    ],
    nodes: 'Nodes 1 and 2',
    nodeTargets: [
      ['node_exporter', 'port 9100'],
      ['Libvirt exporter', 'port 9926'],
    ],
    footer: 'Inside the cluster Prometheus finds its targets through ServiceMonitors, outside through three ScrapeConfigs.',
  },
};

function scrape(lang) {
  const t = SCRAPE[lang];
  const id = `p5c1-scrape-${lang}`;
  // Targets in the cluster sit in the left column, Prometheus in the middle, outside targets on the right
  const insideY = [96, 162, 228];
  const outsideY = [52, 104, 212, 264];
  const body = [
    band(16, 16, 440, 306, 2),
    label(32, 40, t.cluster),
    meta(440, 40, t.ns, 'end'),
    ...t.inside.map(([name, sub], i) => tile(32, insideY[i], 184, 50, name, sub)),
    tile(264, 56, 176, 50, ...t.grafana),
    tile(264, 162, 176, 50, ...t.prometheus, { accent: true }),
    arrow(id, [[352, 106], [352, 160]]),
    note(360, 138, 'PromQL', 'start', { code: true }),
    // Prometheus pulls, so the arrows point from Prometheus to the targets
    arrow(id, [[264, 177], [240, 177], [240, 121], [218, 121]]),
    arrow(id, [[264, 187], [218, 187]]),
    arrow(id, [[264, 197], [240, 197], [240, 253], [218, 253]]),
    band(520, 16, 304, 146, 1),
    label(536, 40, t.fe),
    ...t.feTargets.map(([name, sub], i) => tile(536, outsideY[i], 272, 46, name, sub)),
    band(520, 176, 304, 146, 1),
    label(536, 200, t.nodes),
    ...t.nodeTargets.map(([name, sub], i) => tile(536, outsideY[i + 2], 272, 46, name, sub)),
    line([[440, 187], [480, 187]]),
    line([[480, 75], [480, 287]]),
    ...outsideY.map((y) => arrow(id, [[480, y + 23], [534, y + 23]])),
    meta(16, 346, t.footer),
  ];
  return figure({ id, width: 840, height: 360, title: t.title, desc: t.desc, body });
}

const TRIAGE = {
  de: {
    title: 'Der Ablauf der Triage',
    desc:
      'Prometheus wertet die Regel WebshopErrorBudgetBurn aus und schickt den Alert an Alertmanager. ' +
      'Alertmanager leitet Alerts, deren alertname mit Webshop beginnt, als Webhook an den Triage-Dienst ' +
      'im Namespace ai. Der Dienst holt die Fehlerzeilen der letzten 15 Minuten aus Loki und den Zustand ' +
      'des Deployments aus der Kubernetes-API und fragt Ollama mit llama3.2:3b. Den Vorschlag zeigt er ' +
      'auf einer Webseite an Port 30880. Ein Mensch gibt ihn mit seinem Namen frei oder lehnt ihn ab. ' +
      'Nur eine freigegebene Aktion läuft, nur restart und nur auf velo/webshop. Jeder Schritt landet ' +
      'im Audit-Log.',
    context: 'Kontext',
    loki: ['Loki', 'Fehlerzeilen, 15 Minuten'],
    kube: ['Kubernetes-API', 'Zustand des Deployments'],
    prometheus: ['Prometheus', 'WebshopErrorBudgetBurn'],
    alertmanager: ['Alertmanager', 'alertname =~ Webshop.*'],
    triage: ['Triage-Dienst', 'Namespace ai'],
    ollama: ['Ollama', 'llama3.2:3b'],
    proposal: ['Vorschlag', 'Webseite, Port 30880'],
    human: ['Mensch', 'entscheidet mit Namen'],
    action: ['Aktion', 'restart, nur velo/webshop'],
    audit: ['Audit-Log', '/data/audit.jsonl'],
    alert: 'Alert',
    webhook: 'Webhook',
    approved: 'freigegeben',
    rejected: 'abgelehnt',
    footer: 'Der Dienst schreibt jeden Schritt ins Audit-Log, vom Alert über den Vorschlag bis zur Entscheidung.',
  },
  en: {
    title: 'The flow of the triage',
    desc:
      'Prometheus evaluates the rule WebshopErrorBudgetBurn and sends the alert to Alertmanager. ' +
      'Alertmanager routes alerts whose alertname starts with Webshop as a webhook to the triage service ' +
      'in the namespace ai. The service fetches the error lines of the last 15 minutes from Loki and the ' +
      'state of the deployment from the Kubernetes API and asks Ollama with llama3.2:3b. It shows the ' +
      'proposal on a web page on port 30880. A person approves it with their name or rejects it. Only an ' +
      'approved action runs, only restart and only on velo/webshop. Every step lands in the audit log.',
    context: 'Context',
    loki: ['Loki', 'error lines, 15 minutes'],
    kube: ['Kubernetes API', 'state of the deployment'],
    prometheus: ['Prometheus', 'WebshopErrorBudgetBurn'],
    alertmanager: ['Alertmanager', 'alertname =~ Webshop.*'],
    triage: ['Triage service', 'namespace ai'],
    ollama: ['Ollama', 'llama3.2:3b'],
    proposal: ['Proposal', 'web page, port 30880'],
    human: ['Person', 'decides by name'],
    action: ['Action', 'restart, only velo/webshop'],
    audit: ['Audit log', '/data/audit.jsonl'],
    alert: 'alert',
    webhook: 'webhook',
    approved: 'approved',
    rejected: 'rejected',
    footer: 'The service writes every step to the audit log, from the alert to the proposal and the decision.',
  },
};

function triage(lang) {
  const t = TRIAGE[lang];
  const id = `p5c6-triage-${lang}`;
  // Four columns, the flow runs right along the middle row and back left along the bottom row
  const X = [16, 244, 472, 700];
  const W = 172;
  const H = 50;
  const TOP = 16;
  const MID = 106;
  const LOW = 236;
  const body = [
    label(452, 46, t.context, 'end'),
    tile(X[2], TOP, W, H, ...t.loki),
    tile(X[3], TOP, W, H, ...t.kube),
    tile(X[0], MID, W, H, ...t.prometheus, { code: true }),
    tile(X[1], MID, W, H, ...t.alertmanager, { code: true }),
    tile(X[2], MID, W, H, ...t.triage, { accent: true }),
    tile(X[3], MID, W, H, ...t.ollama, { code: true }),
    tile(X[3], LOW, W, H, ...t.proposal),
    tile(X[2], LOW, W, H, ...t.human, { accent: true }),
    tile(X[1], LOW, W, H, ...t.action),
    tile(X[0], LOW, W, H, ...t.audit, { code: true }),
    // Middle row
    arrow(id, [[188, 131], [242, 131]]),
    note(215, 124, t.alert, 'middle'),
    arrow(id, [[416, 131], [470, 131]]),
    note(443, 124, t.webhook, 'middle'),
    arrow(id, [[644, 123], [698, 123]]),
    arrow(id, [[700, 139], [646, 139]]),
    // Context flows down into the service
    arrow(id, [[532, 66], [532, 104]]),
    arrow(id, [[760, 66], [760, 84], [620, 84], [620, 104]]),
    // The service shows its proposal, the person decides
    arrow(id, [[600, 156], [600, 196], [786, 196], [786, 234]]),
    arrow(id, [[700, 261], [646, 261]]),
    arrow(id, [[472, 261], [418, 261]]),
    note(445, 229, t.approved, 'middle'),
    arrow(id, [[244, 261], [190, 261]]),
    // A rejection ends in the audit log as well
    line([[558, 286], [558, 306], [102, 306]]),
    arrow(id, [[102, 306], [102, 288]]),
    note(330, 322, t.rejected, 'middle'),
    meta(16, 352, t.footer),
  ];
  return figure({ id, width: 888, height: 366, title: t.title, desc: t.desc, body });
}

const HPA = {
  de: {
    title: 'Der Regelkreis des HorizontalPodAutoscalers',
    desc:
      'Ein Regelkreis aus vier Teilen. Der metrics-server von k3s misst die CPU der Pods des Webshops. ' +
      'Der HorizontalPodAutoscaler vergleicht die mittlere Auslastung mit dem Ziel von 60 % des Requests ' +
      'und rechnet aufrunden aus Pods mal Auslastung durch Ziel, zwei Pods mit 120 % ergeben vier Pods. ' +
      'Er bleibt zwischen 2 und 6 Pods und setzt replicas im Deployment webshop im Namespace velo. Jeder ' +
      'Pod hat einen Request von 50m und ein Limit von 250m. Darunter begrenzt die ResourceQuota member ' +
      'die Limits auf 2 CPU, sechs Pods brauchen 1,5 CPU, der Rest bleibt für die zusätzlichen Pods eines Rollouts.',
    loop: 'Regelkreis',
    metrics: ['metrics-server', 'CPU der Pods, aus k3s'],
    hpa: ['HorizontalPodAutoscaler', 'Ziel 60 % des Requests, 2 bis 6 Pods'],
    formula: 'aufrunden(Pods × Auslastung / Ziel)',
    example: 'Beispiel 2 Pods × 120 % / 60 % = 4 Pods',
    deployment: ['Deployment webshop', 'Namespace velo, ohne replicas in Git'],
    pods: ['Pods des Webshops', 'Request 50m, Limit 250m'],
    usage: 'Auslastung',
    scales: 'skaliert',
    measures: 'misst',
    limit: 'Grenze',
    quota: ['ResourceQuota member', 'limits.cpu 2, sechs Pods brauchen 1,5 CPU, Rest für einen Rollout'],
    caps: 'begrenzt',
  },
  en: {
    title: 'The control loop of the HorizontalPodAutoscaler',
    desc:
      'A control loop of four parts. The metrics-server of k3s measures the CPU of the web shop pods. The ' +
      'HorizontalPodAutoscaler compares the average utilization with the target of 60 % of the request and ' +
      'computes ceil of pods times utilization divided by target, so two pods at 120 % give four pods. It ' +
      'stays between 2 and 6 pods and sets replicas in the deployment webshop in the namespace velo. Every ' +
      'pod has a request of 50m and a limit of 250m. Below, the ResourceQuota member caps the limits at 2 ' +
      'CPU. Six pods need 1.5 CPU, and the rest is left for the extra pods of a rollout.',
    loop: 'Control loop',
    metrics: ['metrics-server', 'CPU of the pods, from k3s'],
    hpa: ['HorizontalPodAutoscaler', 'target 60 % of the request, 2 to 6 pods'],
    formula: 'ceil(pods × utilization / target)',
    example: 'example 2 pods × 120 % / 60 % = 4 pods',
    deployment: ['Deployment webshop', 'namespace velo, no replicas in Git'],
    pods: ['Web shop pods', 'request 50m, limit 250m'],
    usage: 'utilization',
    scales: 'scales',
    measures: 'measures',
    limit: 'Limit',
    quota: ['ResourceQuota member', 'limits.cpu 2, six pods need 1.5 CPU, the rest is for a rollout'],
    caps: 'caps',
  },
};

function hpa(lang) {
  const t = HPA[lang];
  const id = `p5c4-hpa-${lang}`;
  const body = [
    band(16, 16, 728, 248, 1),
    label(32, 40, t.loop),
    tile(32, 56, 220, 56, ...t.metrics),
    tile(380, 56, 340, 56, ...t.hpa, { accent: true }),
    strip(380, 120, 340, 28, t.formula),
    meta(380, 168, t.example),
    tile(380, 196, 340, 52, ...t.deployment),
    tile(32, 196, 220, 52, ...t.pods),
    arrow(id, [[252, 84], [378, 84]]),
    note(316, 76, t.usage, 'middle'),
    arrow(id, [[680, 148], [680, 194]]),
    note(688, 176, 'replicas', 'start', { code: true }),
    arrow(id, [[380, 222], [254, 222]]),
    note(316, 214, t.scales, 'middle'),
    arrow(id, [[142, 196], [142, 114]]),
    note(150, 158, t.measures),
    band(16, 280, 728, 96, 2),
    label(32, 304, t.limit),
    tile(32, 316, 688, 48, ...t.quota),
    // The quota is not part of the loop, it only stops new pods, so the link is dashed
    line([[142, 316], [142, 250]], { dashed: true, accent: true }),
    note(150, 290, t.caps),
  ];
  return figure({ id, width: 760, height: 392, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(SCRAPE)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p5c1-scrape.svg'), scrape(lang));
  writeFileSync(join(dir, 'p5c6-triage.svg'), triage(lang));
  writeFileSync(join(dir, 'p5c4-hpa.svg'), hpa(lang));
}
