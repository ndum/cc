/**
 * Figures of part 0, start. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/start.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, figure, label, line, measure, meta, note, SIZE, strip, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ARCH = {
  de: {
    title: 'Die Zielarchitektur des Kurses',
    desc:
      'Vier Schichten übereinander. Die Infrastruktur besteht aus dem Front-end und zwei Knoten mit Ubuntu ' +
      'auf smartlearn, eingerichtet mit prepare.sh. Darauf stellt OpenNebula die IaaS bereit, mit oned, ' +
      'Sunstone, Mandanten und Netzen, installiert mit Ansible und OneDeploy, die VMs laufen mit KVM auf den ' +
      'Knoten. Darüber läuft die Plattform k3s, von OpenTofu angelegt, mit Argo CD, dem Webshop, Ollama, der ' +
      'KI-Triage, Prometheus, Grafana und Loki, die Apps holt Argo CD aus einem Git-Repo. Zuoberst nutzen die ' +
      'Mitglieder von Wolkenwerk Bern die Cloud. Jede Schicht nennt die Teile des Kurses, die sie aufbauen.',
    layers: [
      { name: 'Mitglieder', parts: 'Teile 3 und 6', tools: 'Self-Service über Sunstone und Git' },
      { name: 'Plattform', parts: 'Teile 4 und 5', tools: 'aufgebaut mit OpenTofu und Argo CD' },
      { name: 'IaaS', parts: 'Teile 2 und 3', tools: 'installiert mit Ansible und OneDeploy' },
      { name: 'Infrastruktur', parts: 'Teil 0', tools: 'vorbereitet mit prepare.sh' },
    ],
    members: [
      ['Praxis', 'Rosenweg'],
      ['Treuhand', 'Aaregg'],
      ['Veloatelier', 'Matte'],
      ['Gemeinde', 'Hinterbüel'],
      ['Mitglied 5', 'aus UN4'],
    ],
    apps: [
      ['Argo CD', 'GitOps'],
      ['Webshop', 'Apps der Mitglieder'],
      ['Ollama', 'KI-Dienst'],
      ['KI-Triage', 'mit Freigabe'],
    ],
    observe: [
      ['Prometheus', 'Metriken, Alerts'],
      ['Grafana', 'Dashboards'],
      ['Loki', 'Logs'],
    ],
    platformBase: 'Kubernetes k3s auf zwei VMs aus OpenNebula',
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
  },
  en: {
    title: 'The target architecture of the course',
    desc:
      'Four layers on top of each other. The infrastructure is the front-end and two nodes with Ubuntu on ' +
      'smartlearn, set up with prepare.sh. On it OpenNebula provides the IaaS with oned, Sunstone, tenants and ' +
      'networks, installed with Ansible and OneDeploy, and the VMs run with KVM on the nodes. Above that runs the ' +
      'platform k3s, created by OpenTofu, with Argo CD, the web shop, Ollama, the AI triage, Prometheus, Grafana ' +
      'and Loki, and Argo CD pulls the apps from a Git repo. At the top the members of Wolkenwerk Bern use the ' +
      'cloud. Every layer names the parts of the course that build it.',
    layers: [
      { name: 'Members', parts: 'parts 3 and 6', tools: 'self-service through Sunstone and Git' },
      { name: 'Platform', parts: 'parts 4 and 5', tools: 'built with OpenTofu and Argo CD' },
      { name: 'IaaS', parts: 'parts 2 and 3', tools: 'installed with Ansible and OneDeploy' },
      { name: 'Infrastructure', parts: 'part 0', tools: 'prepared with prepare.sh' },
    ],
    members: [
      ['Practice', 'Rosenweg'],
      ['Fiduciary', 'Aaregg'],
      ['Bike shop', 'Matte'],
      ['Municipality', 'Hinterbüel'],
      ['Member 5', 'from UN4'],
    ],
    apps: [
      ['Argo CD', 'GitOps'],
      ['Web shop', 'apps of the members'],
      ['Ollama', 'AI service'],
      ['AI triage', 'with approval'],
    ],
    observe: [
      ['Prometheus', 'metrics, alerts'],
      ['Grafana', 'dashboards'],
      ['Loki', 'logs'],
    ],
    platformBase: 'Kubernetes k3s on two VMs from OpenNebula',
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
  },
};

// One column of bands, each with a header line and its tiles below
const X = 16;
const W = 688;
const INNER = 20;
const GAP = 10;
const TILE_H = 46;

/** x positions and width of n tiles side by side inside a band */
function columns(n) {
  const width = (W - 2 * INNER - GAP * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({ x: X + INNER + i * (width + GAP), w: width }));
}

function architecture(lang) {
  const t = ARCH[lang];
  const id = `p0c1-architecture-${lang}`;
  const body = [];
  let y = 16;
  const header = (index, top, level, height) => {
    const layer = t.layers[index];
    body.push(band(X, top, W, height, level));
    body.push(label(X + INNER, top + 24, layer.name));
    body.push(meta(X + INNER + 10 + measure(layer.name.toUpperCase(), SIZE.label, { bold: true }) * 1.1, top + 24, layer.parts));
    body.push(meta(X + W - INNER, top + 24, layer.tools, 'end'));
  };
  const row = (tiles, top, accents = []) =>
    columns(tiles.length).forEach((c, i) => body.push(tile(c.x, top, c.w, TILE_H, ...tiles[i], { accent: accents.includes(i) })));
  const base = (top, text) => body.push(strip(X + INNER, top, W - 2 * INNER, 30, text));

  // Members
  header(0, y, 1, 96);
  row(t.members, y + 36);
  y += 96 + 12;

  // Platform
  header(1, y, 2, 184);
  row(t.apps, y + 36, [0, 2]);
  row(t.observe, y + 36 + TILE_H + 8);
  base(y + 36 + 2 * TILE_H + 16, t.platformBase);
  y += 184 + 12;

  // IaaS
  header(2, y, 3, 136);
  row(t.iaas, y + 36, [0]);
  base(y + 36 + TILE_H + 8, t.iaasBase);
  y += 136 + 12;

  // Infrastructure
  header(3, y, 4, 136);
  row(t.infra, y + 36);
  base(y + 36 + TILE_H + 8, t.infraBase);
  y += 136;

  return figure({ id, width: X * 2 + W, height: y + 16, title: t.title, desc: t.desc, body });
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
