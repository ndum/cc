/**
 * Figures of part 5, observability, scaling and AI. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/observability.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, escape, figure, label, line, measure, meta, note, SIZE, strip, tag, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** One line of text with parts in different classes, such as plain text with a name in monospace */
function mixed(x, y, parts, anchor = 'start') {
  const spans = parts.map(([text, cls]) => `<tspan class="${cls}">${escape(text)}</tspan>`).join('');
  return `<text class="d-sub" x="${x}" y="${y}" text-anchor="${anchor}">${spans}</text>`;
}

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
    inside: [
      ['Webshop', 'Pods in velo, Port 8080', 'container'],
      ['kube-state-metrics', 'Zustand der Objekte', 'cluster'],
      ['node-exporter', 'k3s-server, k3s-agent', 'vm'],
    ],
    grafana: ['Grafana', 'Dashboards'],
    prometheus: ['Prometheus', 'Namespace monitoring'],
    pulls: [['holt ', 'd-sub'], ['/metrics', 'd-code'], [' ab', 'd-sub']],
    fe: 'Front-end',
    feTargets: [
      ['OpenNebula-Exporter', 'Port 9925', 'cog'],
      ['node_exporter', 'Port 9100', 'server'],
    ],
    nodes: 'Knoten 1 und 2',
    nodeTargets: [
      ['node_exporter', 'Port 9100', 'server'],
      ['Libvirt-Exporter', 'Port 9926', 'vm'],
    ],
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
    inside: [
      ['Web shop', 'pods in velo, port 8080', 'container'],
      ['kube-state-metrics', 'state of the objects', 'cluster'],
      ['node-exporter', 'k3s-server, k3s-agent', 'vm'],
    ],
    grafana: ['Grafana', 'dashboards'],
    prometheus: ['Prometheus', 'namespace monitoring'],
    pulls: [['scrapes ', 'd-sub'], ['/metrics', 'd-code']],
    fe: 'Front-end',
    feTargets: [
      ['OpenNebula exporter', 'port 9925', 'cog'],
      ['node_exporter', 'port 9100', 'server'],
    ],
    nodes: 'Nodes 1 and 2',
    nodeTargets: [
      ['node_exporter', 'port 9100', 'server'],
      ['Libvirt exporter', 'port 9926', 'vm'],
    ],
  },
};

function scrape(lang) {
  const t = SCRAPE[lang];
  const id = `p5c1-scrape-${lang}`;
  const H = 56;
  // Targets in the cluster on the left, Prometheus in the middle, the servers on the right
  const insideY = [142, 222, 302];
  const outsideY = [52, 132, 264, 344];
  const mid = (y) => y + H / 2;
  const tagW = (text) => Math.ceil(measure(text, SIZE.sub, { bold: true })) + 14;
  const body = [
    band(16, 16, 452, 400, 3),
    label(32, 40, t.cluster, 'start', { tone: 'violet' }),
    tag(468 - 16 - tagW('ServiceMonitor'), 26, 'ServiceMonitor'),
    band(516, 16, 228, 188, 2),
    label(532, 40, t.fe, 'start', { tone: 'blue' }),
    tag(744 - 16 - tagW('ScrapeConfig'), 26, 'ScrapeConfig'),
    band(516, 228, 228, 188, 2),
    label(532, 252, t.nodes, 'start', { tone: 'blue' }),
    tag(744 - 16 - tagW('ScrapeConfig'), 238, 'ScrapeConfig'),
    // Grafana asks, so this arrow points from Grafana to Prometheus
    arrow(id, [[366, 144], [366, 220]]),
    note(374, 186, 'PromQL', 'start', { code: true }),
    // Prometheus pulls, so the arrows point from Prometheus to the targets
    arrow(id, [[280, mid(222)], [226, mid(222)]], { accent: true }),
    arrow(id, [[252, mid(222)], [252, mid(142)], [226, mid(142)]], { accent: true }),
    arrow(id, [[252, mid(222)], [252, mid(302)], [226, mid(302)]], { accent: true }),
    line([[452, mid(222)], [492, mid(222)]], { accent: true }),
    line([[492, mid(outsideY[0])], [492, mid(outsideY[3])]], { accent: true }),
    ...outsideY.map((y) => arrow(id, [[492, mid(y)], [530, mid(y)]], { accent: true })),
    ...t.inside.map(([name, sub, icon], i) =>
      tile(32, insideY[i], 192, H, name, sub, { icon, tone: 'violet', code: i === 2 }),
    ),
    tile(280, 88, 172, H, ...t.grafana, { icon: 'chart', tone: 'violet' }),
    tile(280, 222, 172, H, ...t.prometheus, { icon: 'database', accent: true }),
    mixed(366, 300, t.pulls, 'middle'),
    ...t.feTargets.map(([name, sub, icon], i) => tile(532, outsideY[i], 196, H, name, sub, { icon })),
    ...t.nodeTargets.map(([name, sub, icon], i) => tile(532, outsideY[i + 2], 196, H, name, sub, { icon })),
  ];
  return figure({ id, width: 760, height: 432, title: t.title, desc: t.desc, body });
}

const LOGS = {
  de: {
    title: 'Der Weg der Logs im Cluster',
    desc:
      'Zwei Nodes des Clusters, k3s-server und k3s-agent. Auf jedem Node schreiben die Pods ihre Logs nach ' +
      'stdout und stderr. Alloy läuft als DaemonSet mit einem Pod pro Node, liest die Logs der Pods auf seinem ' +
      'Node und schickt sie mit den Labels namespace, pod, container und app an Loki. Loki läuft als ein ' +
      'einziger Prozess, legt einen Index nur über die Labels an und behält die Logs drei Tage. In Grafana ' +
      'fragst du Loki unter «Explore» mit LogQL ab. Eine Abfrage wie {namespace="velo", app="webshop"} |= "404" ' +
      'wählt zuerst die Streams über ihre Labels und durchsucht dann den Text. Sie findet auch Zeilen von Pods, ' +
      'die es nicht mehr gibt.',
    nodes: ['Node k3s-server', 'Node k3s-agent'],
    pods: ['Pods', 'stdout, stderr'],
    alloy: ['Alloy', 'DaemonSet'],
    loki: ['Loki', 'Logs für 3 Tage'],
    index: 'Index nur über die Labels',
    grafana: ['Grafana', 'Explore'],
    query: 'Abfrage mit LogQL',
    steps: [
      ['Streams über Labels wählen', '{namespace="velo", app="webshop"}', true],
      ['Text durchsuchen', '|= "404"', true],
      ['Zeilen mit 404', 'auch von ersetzten Pods', false],
    ],
  },
  en: {
    title: 'The path of the logs in the cluster',
    desc:
      'Two nodes of the cluster, k3s-server and k3s-agent. On each node the pods write their logs to stdout ' +
      'and stderr. Alloy runs as a DaemonSet with one pod per node, reads the logs of the pods on its node and ' +
      'sends them to Loki with the labels namespace, pod, container and app. Loki runs as a single process, ' +
      'indexes only the labels and keeps the logs for three days. In Grafana you query Loki under "Explore" ' +
      'with LogQL. A query such as {namespace="velo", app="webshop"} |= "404" first selects the streams by ' +
      'their labels and then searches the text. It also finds lines of pods that no longer exist.',
    nodes: ['Node k3s-server', 'Node k3s-agent'],
    pods: ['Pods', 'stdout, stderr'],
    alloy: ['Alloy', 'DaemonSet'],
    loki: ['Loki', 'logs for 3 days'],
    index: 'index only over the labels',
    grafana: ['Grafana', 'Explore'],
    query: 'Query with LogQL',
    steps: [
      ['Select streams by labels', '{namespace="velo", app="webshop"}', true],
      ['Search the text', '|= "404"', true],
      ['Lines with 404', 'also from replaced pods', false],
    ],
  },
};

function logs(lang) {
  const t = LOGS[lang];
  const id = `p5c2-logs-${lang}`;
  const H = 56;
  const body = [];
  // One band per node, each with its pods and the Alloy pod of the DaemonSet
  [16, 152].forEach((y, i) => {
    body.push(band(16, y, 328, 112, 3));
    body.push(label(32, y + 24, t.nodes[i], 'start', { tone: 'violet' }));
    body.push(arrow(id, [[178, y + 68], [208, y + 68]], { accent: true }));
    body.push(tile(32, y + 40, 146, H, ...t.pods, { icon: 'container', code: true }));
    body.push(tile(210, y + 40, 118, H, ...t.alloy, { icon: 'sync' }));
  });
  // Every Alloy pushes to the one Loki, Grafana asks Loki
  body.push(line([[328, 84], [372, 84], [372, 220], [328, 220]], { accent: true }));
  body.push(arrow(id, [[372, 152], [406, 152]], { accent: true }));
  body.push(arrow(id, [[614, 152], [568, 152]]));
  body.push(note(591, 144, 'LogQL', 'middle', { code: true }));
  body.push(tile(408, 124, 158, H, ...t.loki, { icon: 'database', accent: true }));
  body.push(tile(614, 124, 130, H, ...t.grafana, { icon: 'chart' }));
  body.push(note(487, 204, t.index, 'middle'));
  body.push(note(487, 220, 'namespace, pod, container, app', 'middle', { code: true }));
  // The query in Grafana, labels first, then the text
  body.push(band(16, 288, 728, 112, 1));
  body.push(label(32, 312, t.query));
  const steps = [
    { x: 32, w: 290 },
    { x: 362, w: 150 },
    { x: 552, w: 176 },
  ];
  steps.forEach((s, i) => body.push(tile(s.x, 328, s.w, H, t.steps[i][0], t.steps[i][1], { code: t.steps[i][2] })));
  body.push(arrow(id, [[322, 356], [360, 356]]));
  body.push(arrow(id, [[512, 356], [550, 356]]));
  return figure({ id, width: 760, height: 416, title: t.title, desc: t.desc, body });
}

const BUDGET = {
  de: {
    title: 'Fehlerbudget und Burn Rate des Webshops',
    desc:
      'Oben die Zahlen des Webshops. Das SLO verlangt 99,5 % der Anfragen ohne Serverfehler über 7 Tage, das ' +
      'Fehlerbudget beträgt 0,5 % der Anfragen. Bei einer Burn Rate von 1 reicht das Budget genau 7 Tage, bei ' +
      '14,4 ist es nach 12 Stunden weg. Darunter ein schematischer Verlauf bei gleichmässigem Verkehr. Ab dem ' +
      'Beginn der Fehler steigt die Burn Rate im Fenster über fünf Minuten schnell über die Schwelle von 14,4, ' +
      'also 7,2 % Fehler. Im Fenster über eine Stunde steigt sie langsam. Der Alert feuert erst, wenn beide ' +
      'Fenster zwei Minuten lang über der Schwelle liegen. Sobald die Behebung wirkt, fällt das kurze Fenster ' +
      'und der Alert endet, obwohl das lange Fenster noch hoch ist.',
    cards: [
      ['SLO 99,5 %', 'ohne Serverfehler, 7 Tage', 'chart'],
      ['Fehlerbudget 0,5 %', 'der Anfragen dürfen scheitern', 'coin'],
      ['Burn Rate 14,4', 'Budget nach 12 Stunden weg', 'clock'],
    ],
    chart: 'Burn Rate im kurzen und im langen Fenster',
    schematic: 'schematisch, bei gleichmässigem Verkehr',
    yTitle: 'Burn Rate',
    xTitle: 'Zeit',
    ticks: ['0', '10', '20'],
    threshold: '14,4',
    thresholdLabel: 'Schwelle 14,4, also 7,2 % Fehler',
    short: '5 Minuten',
    long: '1 Stunde',
    firing: 'Alert feuert',
    start: 'Fehler beginnen',
    fix: 'Behebung wirkt',
  },
  en: {
    title: 'Error budget and burn rate of the web shop',
    desc:
      'At the top the numbers of the web shop. The SLO asks for 99.5% of the requests without a server error ' +
      'over 7 days, so the error budget is 0.5% of the requests. At a burn rate of 1 the budget lasts exactly ' +
      '7 days, at 14.4 it is gone after 12 hours. Below, a schematic course with steady traffic. Once the errors ' +
      'start, the burn rate in the five-minute window quickly rises above the threshold of 14.4, which is 7.2% ' +
      'errors. In the one-hour window it rises slowly. The alert only fires when both windows have been above ' +
      'the threshold for two minutes. As soon as the fix takes effect, the short window drops and the alert ' +
      'ends, although the long window is still high.',
    cards: [
      ['SLO 99.5%', 'no server errors, 7 days', 'chart'],
      ['Error budget 0.5%', 'of the requests may fail', 'coin'],
      ['Burn rate 14.4', 'budget gone after 12 hours', 'clock'],
    ],
    chart: 'Burn rate in the short and the long window',
    schematic: 'schematic, with steady traffic',
    yTitle: 'Burn rate',
    xTitle: 'time',
    ticks: ['0', '10', '20'],
    threshold: '14.4',
    thresholdLabel: 'threshold 14.4, i.e. 7.2% errors',
    short: '5 minutes',
    long: '1 hour',
    firing: 'alert firing',
    start: 'errors start',
    fix: 'fix takes effect',
  },
};

/*
 * The curves of the chart follow from the definitions, not from a measurement: errors start at minute 0
 * with a burn rate of 24 and the fix takes effect at minute 45. The five-minute window reaches 24 after
 * five minutes, the one-hour window grows by 24 / 60 per minute and crosses 14.4 at minute 36, so the
 * alert fires at minute 38 after two minutes pending. After the fix the short window falls below 14.4
 * at minute 47 and the alert ends while the long window still stands at 18.
 */
const SHORT = [[-8, 0], [0, 0], [5, 24], [45, 24], [50, 0], [60, 0]];
const LONG = [[-8, 0], [0, 0], [45, 18], [60, 18]];

function budget(lang) {
  const t = BUDGET[lang];
  const id = `p5c3-budget-${lang}`;
  const body = [];
  // The numbers of the SLO in three cards
  t.cards.forEach(([title, sub, icon], i) => body.push(tile(16 + i * 251, 16, 226, 56, title, sub, { icon })));
  // The chart, burn rate 0 to 30 over minutes -8 to 60
  body.push(band(16, 96, 728, 256, 1));
  body.push(label(32, 120, t.chart));
  body.push(meta(728, 120, t.schematic, 'end'));
  const X0 = 96;
  const X1 = 728;
  const Y0 = 316;
  const x = (min) => X0 + ((min + 8) * (X1 - X0)) / 68;
  const y = (rate) => Y0 - (rate * 160) / 30;
  const path = (points) => points.map(([m, r], i) => `${i ? 'L' : 'M'} ${x(m).toFixed(1)} ${y(r).toFixed(1)}`).join(' ');
  [10, 20, 30].forEach((r) => body.push(`<path class="d-grid" d="M ${X0} ${y(r)} H ${X1}"/>`));
  t.ticks.forEach((text, i) => body.push(note(X0 - 8, y(i * 10) + 4, text, 'end')));
  body.push(note(X0 - 8, y(30) + 4, t.yTitle, 'end'));
  // When the alert fires, marked above the curves with guides down to the axis
  body.push(`<path class="d-grid" d="M ${x(38)} ${y(30) + 18} V ${Y0} M ${x(47)} ${y(30) + 18} V ${Y0}"/>`);
  body.push(`<rect class="d-tag" x="${x(38)}" y="${y(30)}" width="${x(47) - x(38)}" height="18" rx="9"/>`);
  body.push(`<text class="d-tag-text" x="${(x(38) + x(47)) / 2}" y="${y(30) + 12.5}" text-anchor="middle">${escape(t.firing)}</text>`);
  // The threshold of the alert
  body.push(`<path class="d-arrow" d="M ${X0} ${y(14.4)} H ${X1}"/>`);
  body.push(`<text class="d-title-small" x="${X0 - 8}" y="${y(14.4) + 4}" text-anchor="end">${escape(t.threshold)}</text>`);
  body.push(note(x(9), y(14.4) - 7, t.thresholdLabel));
  // The two windows, measured values in teal, the long one dashed
  body.push(`<path class="d-line d-line-teal" d="${path(SHORT)}"/>`);
  body.push(`<path class="d-line d-line-teal d-dashed" d="${path(LONG)}"/>`);
  body.push(note(x(16), y(24) - 8, t.short));
  body.push(note(x(51.5), y(18) - 8, t.long));
  // Axes and the events on the time axis
  body.push(`<path class="d-axis" d="M ${X0} ${y(30)} V ${Y0} H ${X1}"/>`);
  for (const [min, text] of [[0, t.start], [45, t.fix]]) {
    body.push(`<path class="d-axis" d="M ${x(min)} ${Y0} V ${Y0 + 5}"/>`);
    body.push(note(x(min), Y0 + 19, text, 'middle'));
  }
  body.push(note(X1, Y0 + 19, t.xTitle, 'end'));
  return figure({ id, width: 760, height: 368, title: t.title, desc: t.desc, body });
}

const HPA = {
  de: {
    title: 'Der Regelkreis des HorizontalPodAutoscalers',
    desc:
      'Der metrics-server von k3s misst die CPU der Pods des Webshops. Der HorizontalPodAutoscaler vergleicht ' +
      'die mittlere Auslastung mit dem Ziel von 60 % des Requests und rechnet aufgerundet Pods mal Auslastung ' +
      'durch Ziel, zwei Pods mit 120 % ergeben vier Pods. Er bleibt zwischen 2 und 6 Pods und setzt replicas ' +
      'im Deployment webshop im Namespace velo. Jeder Pod hat einen Request von 50m und ein Limit von 250m. ' +
      'Darunter begrenzt die ResourceQuota member die Limits auf 2 CPU, sechs Pods brauchen 1,5 CPU, der Rest ' +
      'bleibt für die zusätzlichen Pods eines Rollouts.',
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
    quota: ['ResourceQuota member', 'limits.cpu 2, sechs Pods brauchen 1,5 CPU, der Rest bleibt für einen Rollout'],
    caps: 'begrenzt',
  },
  en: {
    title: 'The control loop of the HorizontalPodAutoscaler',
    desc:
      'The metrics-server of k3s measures the CPU of the web shop pods. The HorizontalPodAutoscaler compares ' +
      'the average utilization with the target of 60% of the request and computes pods times utilization ' +
      'divided by target, rounded up, so two pods at 120% give four pods. It stays between 2 and 6 pods and ' +
      'sets replicas in the deployment webshop in the namespace velo. Every pod has a request of 50m and a ' +
      'limit of 250m. Below, the ResourceQuota member caps the limits at 2 CPU. Six pods need 1.5 CPU, and ' +
      'the rest is left for the extra pods of a rollout.',
    loop: 'Control loop',
    metrics: ['metrics-server', 'CPU of the pods, from k3s'],
    hpa: ['HorizontalPodAutoscaler', 'target 60% of the request, 2 to 6 pods'],
    formula: 'ceil(pods × utilization / target)',
    example: 'example 2 pods × 120% / 60% = 4 pods',
    deployment: ['Deployment webshop', 'namespace velo, no replicas in Git'],
    pods: ['Web shop pods', 'request 50m, limit 250m'],
    usage: 'utilization',
    scales: 'scales',
    measures: 'measures',
    limit: 'Limit',
    quota: ['ResourceQuota member', 'limits.cpu 2, six pods need 1.5 CPU, the rest is left for a rollout'],
    caps: 'caps',
  },
};

function hpa(lang) {
  const t = HPA[lang];
  const id = `p5c4-hpa-${lang}`;
  const H = 56;
  const body = [
    band(16, 16, 728, 268, 1),
    label(32, 40, t.loop),
    // The loop runs clockwise: measure, compare, set replicas, scale
    arrow(id, [[264, 84], [438, 84]], { accent: true }),
    note(351, 76, t.usage, 'middle'),
    arrow(id, [[704, 156], [704, 206]], { accent: true }),
    note(696, 196, 'replicas', 'end', { code: true }),
    arrow(id, [[440, 236], [266, 236]], { accent: true }),
    note(353, 228, t.scales, 'middle'),
    arrow(id, [[148, 208], [148, 114]], { accent: true }),
    note(156, 165, t.measures),
    tile(32, 56, 232, H, ...t.metrics, { icon: 'chart' }),
    tile(440, 56, 288, H, ...t.hpa, { icon: 'sync', accent: true }),
    strip(440, 128, 288, 28, t.formula),
    meta(440, 178, t.example),
    tile(440, 208, 288, H, ...t.deployment, { icon: 'doc' }),
    tile(32, 208, 232, H, ...t.pods, { icon: 'container' }),
    band(16, 308, 728, 108, 1),
    label(32, 332, t.limit),
    // The quota is not part of the loop, it only stops new pods, so the link is dashed
    line([[148, 344], [148, 264]], { dashed: true }),
    note(156, 300, t.caps),
    tile(32, 344, 696, H, ...t.quota, { icon: 'shield' }),
  ];
  return figure({ id, width: 760, height: 432, title: t.title, desc: t.desc, body });
}

const TRIAGE = {
  de: {
    title: 'Der Ablauf einer Triage',
    desc:
      'Prometheus wertet eine Regel aus und schickt den Alert an Alertmanager. Ein eigener Empfänger leitet ' +
      'ihn als Webhook an deinen Triage-Dienst weiter. Der Dienst holt Logzeilen aus Loki und den Zustand des ' +
      'betroffenen Deployments aus der Kubernetes-API und fragt damit ein lokales Sprachmodell. Den Vorschlag ' +
      'mit Ursache und Aktion legt er einer Person vor. Sie gibt ihn mit ihrem Namen frei oder lehnt ihn ab. ' +
      'Nur eine freigegebene Aktion von einer festen Liste läuft, mit den Rechten, die sie braucht. Jeder ' +
      'Alert, jeder Vorschlag und jeder Entscheid landet im Audit-Log.',
    context: 'Kontext',
    loki: ['Loki', 'Logzeilen'],
    kube: ['Kubernetes-API', 'Zustand des Ziels'],
    prometheus: ['Prometheus', 'Regel löst aus'],
    alertmanager: ['Alertmanager', 'eigener Empfänger'],
    triage: ['Triage-Dienst', 'deine Lösung'],
    model: ['Sprachmodell', 'lokal im Cluster'],
    proposal: ['Vorschlag', 'Ursache, Aktion'],
    human: ['Mensch', 'gibt frei, lehnt ab'],
    action: ['Aktion', 'nur von fester Liste'],
    audit: ['Audit-Log', 'jeder Schritt'],
    alert: 'Alert',
    webhook: 'Webhook',
    approved: 'freigegeben',
    rejected: 'abgelehnt',
  },
  en: {
    title: 'The flow of a triage',
    desc:
      'Prometheus evaluates a rule and sends the alert to Alertmanager. A receiver of your own forwards it as ' +
      'a webhook to your triage service. The service fetches log lines from Loki and the state of the affected ' +
      'deployment from the Kubernetes API and asks a local language model with this context. It shows the ' +
      'proposal with cause and action to a person, who approves it with their name or rejects it. Only an ' +
      'approved action from a fixed list runs, with only the rights it needs. Every alert, proposal and ' +
      'decision lands in the audit log.',
    context: 'Context',
    loki: ['Loki', 'log lines'],
    kube: ['Kubernetes API', 'state of the target'],
    prometheus: ['Prometheus', 'a rule fires'],
    alertmanager: ['Alertmanager', 'own receiver'],
    triage: ['Triage service', 'your solution'],
    model: ['Language model', 'local in the cluster'],
    proposal: ['Proposal', 'cause, action'],
    human: ['Person', 'approves or rejects'],
    action: ['Action', 'from a fixed list only'],
    audit: ['Audit log', 'every step'],
    alert: 'alert',
    webhook: 'webhook',
    approved: 'approved',
    rejected: 'rejected',
  },
};

function triage(lang) {
  const t = TRIAGE[lang];
  const id = `p5c6-triage-${lang}`;
  // Four columns, the flow runs right along the middle row and back left along the bottom row
  const X = [16, 192, 420, 604];
  const WS = [136, 158, 158, 158];
  const H = 56;
  const TOP = 16;
  const MID = 112;
  const LOW = 232;
  const c = (i) => X[i] + WS[i] / 2;
  const r = (i) => X[i] + WS[i];
  const body = [
    label(X[2] - 16, TOP + 32, t.context, 'end'),
    // Main flow from the alert to the person and on to the action
    arrow(id, [[r(0), MID + 28], [X[1] - 2, MID + 28]], { accent: true }),
    note((r(0) + X[1]) / 2, MID + 20, t.alert, 'middle'),
    arrow(id, [[r(1), MID + 28], [X[2] - 2, MID + 28]], { accent: true }),
    note((r(1) + X[2]) / 2, MID + 20, t.webhook, 'middle'),
    arrow(id, [[c(2), MID + H], [c(2), 200], [c(3), 200], [c(3), LOW - 2]], { accent: true }),
    arrow(id, [[X[3], LOW + 28], [r(2) + 2, LOW + 28]], { accent: true }),
    arrow(id, [[X[2], LOW + 28], [r(1) + 2, LOW + 28]], { accent: true }),
    note((r(1) + X[2]) / 2, LOW + 20, t.approved, 'middle'),
    // Context and the language model on the side
    arrow(id, [[c(2) - 30, TOP + H], [c(2) - 30, MID - 2]]),
    arrow(id, [[c(3), TOP + H], [c(3), 84], [c(2) + 30, 84], [c(2) + 30, MID - 2]]),
    arrow(id, [[r(2), MID + 20], [X[3] - 2, MID + 20]]),
    arrow(id, [[X[3], MID + 36], [r(2) + 2, MID + 36]]),
    // Every step lands in the audit log, a rejection as well
    arrow(id, [[X[1], LOW + 28], [r(0) + 2, LOW + 28]]),
    line([[c(2), LOW + H], [c(2), 312], [c(0), 312]]),
    arrow(id, [[c(0), 312], [c(0), LOW + H + 2]]),
    note((c(0) + c(2)) / 2, 328, t.rejected, 'middle'),
    tile(X[2], TOP, WS[2], H, ...t.loki, { icon: 'database' }),
    tile(X[3], TOP, WS[3], H, ...t.kube, { icon: 'cluster' }),
    tile(X[0], MID, WS[0], H, ...t.prometheus, { icon: 'database' }),
    tile(X[1], MID, WS[1], H, ...t.alertmanager, { icon: 'bell' }),
    tile(X[2], MID, WS[2], H, ...t.triage, { icon: 'cog', accent: true }),
    tile(X[3], MID, WS[3], H, ...t.model, { icon: 'model' }),
    tile(X[3], LOW, WS[3], H, ...t.proposal, { icon: 'doc' }),
    tile(X[2], LOW, WS[2], H, ...t.human, { icon: 'user', accent: true }),
    tile(X[1], LOW, WS[1], H, ...t.action, { icon: 'sync' }),
    tile(X[0], LOW, WS[0], H, ...t.audit, { icon: 'logs' }),
  ];
  return figure({ id, width: 778, height: 344, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(SCRAPE)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p5c1-scrape.svg'), scrape(lang));
  writeFileSync(join(dir, 'p5c2-logs.svg'), logs(lang));
  writeFileSync(join(dir, 'p5c3-budget.svg'), budget(lang));
  writeFileSync(join(dir, 'p5c4-hpa.svg'), hpa(lang));
  writeFileSync(join(dir, 'p5c6-triage.svg'), triage(lang));
}
