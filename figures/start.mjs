/**
 * Figures of part 0, start. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/start.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, figure, label, line, meta, note, strip, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ARCH = {
  de: {
    title: 'Die Zielarchitektur des Kurses',
    desc:
      'Vier Schichten übereinander, daneben eine Spalte für die Automatisierung. Die Infrastruktur besteht ' +
      'aus dem Front-end und zwei Knoten mit Ubuntu auf smartlearn oder einem eigenen Hypervisor. Darauf stellt OpenNebula ' +
      'die IaaS bereit, mit oned, Sunstone, Mandanten und Netzen, die VMs laufen mit KVM auf den Knoten. ' +
      'Darüber läuft die Plattform k3s mit Argo CD, den Apps der Mitglieder, Prometheus, Loki, Ollama, ' +
      'Grafana mit Alertmanager und der KI-Triage. Zuoberst nutzen die Mitglieder von Wolkenwerk Bern die ' +
      'Cloud. Ansible mit OneDeploy baut die IaaS, OpenTofu legt die VMs von k3s an, Argo CD holt die Apps ' +
      'aus dem Git-Repo. Links steht bei jeder Schicht der Teil des Kurses, der sie aufbaut.',
    layers: ['Mitglieder', 'Plattform', 'IaaS', 'Infrastruktur'],
    tags: ['Teile 3 und 6', 'Teile 4 und 5', 'Teile 2 und 3', 'Teil 0'],
    members: [
      ['Praxis', 'Rosenweg'],
      ['Treuhand', 'Aaregg'],
      ['Veloatelier', 'Matte'],
      ['Gemeinde', 'Hinterbüel'],
      ['Mitglied 5', 'aus UN4'],
    ],
    platform: [
      ['Argo CD', 'GitOps'],
      ['Apps', 'Webshop'],
      ['Prometheus', 'Metriken'],
      ['Loki', 'Logs'],
      ['Ollama', 'KI-Dienst'],
    ],
    platformRow: ['Grafana und Alertmanager', 'KI-Triage mit Freigabe'],
    platformBase: 'Kubernetes k3s, k3s-server und k3s-agent als VMs',
    iaas: [
      ['oned', 'API, Scheduler'],
      ['Sunstone', 'Weboberfläche'],
      ['Mandanten', 'Quotas, Showback'],
      ['Netze', 'VXLAN, NAT'],
    ],
    iaasBase: 'OpenNebula 7.4, VMs mit KVM und libvirt auf den Knoten',
    infra: [
      ['Front-end', 'Ubuntu 26.04'],
      ['Knoten 1', 'Ubuntu 26.04'],
      ['Knoten 2', 'Ubuntu 26.04'],
    ],
    infraBase: 'smartlearn oder ein eigener Hypervisor',
    automation: 'Automatisierung',
    tools: [
      ['Git-Repo', 'Argo CD'],
      ['OpenTofu', 'k3s-VMs'],
      ['Ansible', 'OneDeploy'],
      ['prepare.sh', 'Lab-VMs'],
    ],
  },
  en: {
    title: 'The target architecture of the course',
    desc:
      'Four layers on top of each other with a column for automation next to them. The infrastructure is ' +
      'the front-end and two nodes with Ubuntu on smartlearn or a hypervisor of your own. On it, OpenNebula provides the IaaS ' +
      'with oned, Sunstone, tenants and networks, and the VMs run with KVM on the nodes. Above that runs the ' +
      'platform k3s with Argo CD, the apps of the members, Prometheus, Loki, Ollama, Grafana with ' +
      'Alertmanager and the AI triage. At the top, the members of Wolkenwerk Bern use the cloud. Ansible with ' +
      'OneDeploy builds the IaaS, OpenTofu creates the VMs of k3s, and Argo CD pulls the apps from the Git repo. ' +
      'On the left, each layer shows the part of the course that builds it.',
    layers: ['Members', 'Platform', 'IaaS', 'Infrastructure'],
    tags: ['parts 3 and 6', 'parts 4 and 5', 'parts 2 and 3', 'part 0'],
    members: [
      ['Practice', 'Rosenweg'],
      ['Fiduciary', 'Aaregg'],
      ['Bike shop', 'Matte'],
      ['Municipality', 'Hinterbüel'],
      ['Member 5', 'from UN4'],
    ],
    platform: [
      ['Argo CD', 'GitOps'],
      ['Apps', 'web shop'],
      ['Prometheus', 'metrics'],
      ['Loki', 'logs'],
      ['Ollama', 'AI service'],
    ],
    platformRow: ['Grafana and Alertmanager', 'AI triage with approval'],
    platformBase: 'Kubernetes k3s, k3s-server and k3s-agent as VMs',
    iaas: [
      ['oned', 'API, scheduler'],
      ['Sunstone', 'web interface'],
      ['Tenants', 'quotas, showback'],
      ['Networks', 'VXLAN, NAT'],
    ],
    iaasBase: 'OpenNebula 7.4, VMs with KVM and libvirt on the nodes',
    infra: [
      ['Front-end', 'Ubuntu 26.04'],
      ['Node 1', 'Ubuntu 26.04'],
      ['Node 2', 'Ubuntu 26.04'],
    ],
    infraBase: 'smartlearn or a hypervisor of your own',
    automation: 'Automation',
    tools: [
      ['Git repo', 'Argo CD'],
      ['OpenTofu', 'k3s VMs'],
      ['Ansible', 'OneDeploy'],
      ['prepare.sh', 'lab VMs'],
    ],
  },
};

// Layout of the architecture: a column for the layer names, the tiles, a column for the tools
const LEFT = 16;
const CONTENT = 150;
const CONTENT_W = 440;
const BAND_W = CONTENT + CONTENT_W + 14 - LEFT;
const TOOLS = LEFT + BAND_W + 16;
const TOOLS_W = 120;
const GAP = 8;

/** x positions and width of n tiles side by side in the content area */
function columns(n, x = CONTENT, w = CONTENT_W) {
  const width = (w - GAP * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({ x: x + i * (width + GAP), w: width }));
}

const span = (cols) => ({ x: cols[0].x, w: cols.at(-1).x + cols.at(-1).w - cols[0].x });

function architecture(lang) {
  const t = ARCH[lang];
  const id = `p0c1-architecture-${lang}`;
  const body = [];
  const layer = (index, y, h, level) => {
    body.push(band(LEFT, y, BAND_W, h, level));
    body.push(label(LEFT + 14, y + 24, t.layers[index]));
    body.push(meta(LEFT + 14, y + 42, t.tags[index]));
  };
  const five = columns(5);

  // Members
  layer(0, 16, 80, 1);
  five.forEach((c, i) => body.push(tile(c.x, 30, c.w, 52, ...t.members[i])));

  // Platform
  layer(1, 108, 168, 2);
  five.forEach((c, i) => body.push(tile(c.x, 122, c.w, 52, ...t.platform[i], { accent: i === 0 || i === 4 })));
  const a = span(five.slice(0, 2));
  const b = span(five.slice(2));
  body.push(tile(a.x, 182, a.w, 36, t.platformRow[0]));
  body.push(tile(b.x, 182, b.w, 36, t.platformRow[1]));
  body.push(strip(CONTENT, 228, CONTENT_W, 34, t.platformBase));

  // IaaS
  layer(2, 288, 124, 3);
  columns(4).forEach((c, i) => body.push(tile(c.x, 302, c.w, 52, ...t.iaas[i], { accent: i === 0 })));
  body.push(strip(CONTENT, 364, CONTENT_W, 34, t.iaasBase));

  // Infrastructure
  layer(3, 424, 124, 4);
  columns(3).forEach((c, i) => body.push(tile(c.x, 438, c.w, 52, ...t.infra[i])));
  body.push(strip(CONTENT, 500, CONTENT_W, 34, t.infraBase));

  // Automation tools, each with an arrow into the layer it builds
  body.push(band(TOOLS, 16, TOOLS_W + 24, 532, 1));
  body.push(label(TOOLS + 12, 40, t.automation));
  [
    { y: 122, target: 148 },
    { y: 228, target: 245 },
    { y: 302, target: 328 },
    { y: 438, target: 464 },
  ].forEach(({ y, target }, i) => {
    body.push(tile(TOOLS + 12, y, TOOLS_W, 52, ...t.tools[i], { code: i === 3 }));
    body.push(arrow(id, [[TOOLS + 12, target], [LEFT + BAND_W + 1, target]]));
  });

  return figure({ id, width: TOOLS + TOOLS_W + 24 + LEFT, height: 564, title: t.title, desc: t.desc, body });
}

const LAB = {
  de: {
    title: 'Das Lab mit drei VMs und zwei Netzen',
    desc:
      'Das Front-end und zwei Knoten hängen im Labnetz mit festen Adressen. Auf jedem Knoten laufen ' +
      'VMs der Cloud. Diese VMs und das Front-end teilen ein internes VXLAN-Netz. Das Front-end ist ' +
      'dessen Gateway und leitet den Verkehr mit NAT ins Internet.',
    internet: 'Internet',
    fe: ['Front-end', 'Gateway, Weboberfläche'],
    nodes: ['Knoten 1', 'Knoten 2'],
    kvm: 'KVM',
    vm: 'VM',
    labNet: 'Labnetz, feste Adressen',
    innerNet: 'internes Netz (VXLAN), zum Beispiel 172.28.217.0/24',
  },
  en: {
    title: 'The lab with three VMs and two networks',
    desc:
      'The front-end and two nodes sit on the lab network with fixed addresses. VMs of the cloud run ' +
      'on every node. These VMs and the front-end share an internal VXLAN network. The front-end is ' +
      'its gateway and forwards its traffic to the internet with NAT.',
    internet: 'Internet',
    fe: ['Front-end', 'gateway, web interface'],
    nodes: ['Node 1', 'Node 2'],
    kvm: 'KVM',
    vm: 'VM',
    labNet: 'lab network, fixed addresses',
    innerNet: 'internal network (VXLAN), for example 172.28.217.0/24',
  },
};

function labMap(lang) {
  const t = LAB[lang];
  const id = `p0c2-lab-${lang}`;
  const body = [];
  const nodes = [
    { x: 290, name: t.nodes[0] },
    { x: 510, name: t.nodes[1] },
  ];
  // Internet and NAT
  body.push(tile(40, 20, 200, 40, t.internet));
  body.push(arrow(id, [[140, 140], [140, 64]]));
  body.push(note(150, 106, 'NAT', 'start', { code: true }));
  // Lab network
  body.push(line([[190, 116], [620, 116]]));
  body.push(line([[190, 116], [190, 140]]));
  nodes.forEach((n) => body.push(line([[n.x + 90, 116], [n.x + 90, 140]])));
  body.push(note(620, 108, t.labNet, 'end'));
  // Front-end and nodes
  body.push(tile(40, 140, 200, 56, ...t.fe, { accent: true }));
  const vms = [];
  nodes.forEach((n) => {
    body.push(band(n.x, 140, 180, 132, 2));
    body.push(label(n.x + 12, 160, n.name));
    body.push(note(n.x + 168, 160, t.kvm, 'end'));
    [n.x + 12, n.x + 96].forEach((x) => {
      body.push(tile(x, 178, 72, 40, t.vm));
      vms.push(x + 36);
    });
  });
  // Internal network
  body.push(line([[140, 196], [140, 300]], { dashed: true, accent: true }));
  vms.forEach((x) => body.push(line([[x, 218], [x, 300]], { dashed: true, accent: true })));
  body.push(line([[140, 300], [vms.at(-1), 300]], { dashed: true, accent: true }));
  body.push(note(40, 326, t.innerNet));
  return figure({ id, width: 720, height: 340, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(ARCH)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p0c1-architecture.svg'), architecture(lang));
  writeFileSync(join(dir, 'p0c2-lab.svg'), labMap(lang));
}
