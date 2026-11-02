/**
 * Figures of part 0, start. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/start.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, figure, label, line, measure, meta, note, SIZE, strip, tag, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ARCH = {
  de: {
    title: 'Die Zielarchitektur des Kurses',
    desc:
      'Vier Schichten übereinander. Die Infrastruktur besteht aus dem Front-end und zwei Knoten mit Ubuntu ' +
      'auf smartlearn oder einem eigenen Hypervisor, eingerichtet mit prepare.sh. Darauf stellt OpenNebula die ' +
      'IaaS bereit, mit oned, Sunstone, Mandanten und Netzen, installiert mit Ansible und OneDeploy, die VMs ' +
      'laufen mit KVM auf den Knoten. Darüber läuft die Plattform k3s, von OpenTofu angelegt, mit Argo CD, ' +
      'Prometheus, Grafana, Loki, dem Webshop, Ollama und der KI-Triage. Die Apps holt Argo CD aus einem ' +
      'Git-Repo. Ollama und die KI-Triage sind mit «Zusatz» markiert, weil du sie in den Zusatzaufträgen von ' +
      'Teil 5 baust. Zuoberst nutzen die Mitglieder von Wolkenwerk Bern die Cloud. Jede Schicht nennt die Teile ' +
      'des Kurses, die sie aufbauen.',
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
      ['Mitglied 5', 'aus Meilenstein 4'],
    ],
    tools: [
      ['Argo CD', 'GitOps'],
      ['Prometheus', 'Metriken, Alerts'],
      ['Grafana', 'Dashboards'],
      ['Loki', 'Logs'],
    ],
    services: [
      ['Webshop', 'Apps der Mitglieder'],
      ['Ollama', 'KI-Dienst'],
      ['KI-Triage', 'mit Freigabe'],
    ],
    advanced: 'Zusatz',
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
      'smartlearn or a hypervisor of your own, set up with prepare.sh. On it OpenNebula provides the IaaS with ' +
      'oned, Sunstone, tenants and networks, installed with Ansible and OneDeploy, and the VMs run with KVM on the ' +
      'nodes. Above that runs the platform k3s, created by OpenTofu, with Argo CD, Prometheus, Grafana, Loki, the ' +
      'web shop, Ollama and the AI triage, and Argo CD pulls the apps from a Git repo. Ollama and the AI triage ' +
      'are marked as advanced because you build them in the advanced tasks of part 5. At the top the members of ' +
      'Wolkenwerk Bern use the cloud. Every layer names the parts of the course that build it.',
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
      ['Member 5', 'from milestone 4'],
    ],
    tools: [
      ['Argo CD', 'GitOps'],
      ['Prometheus', 'metrics, alerts'],
      ['Grafana', 'dashboards'],
      ['Loki', 'logs'],
    ],
    services: [
      ['Web shop', 'apps of the members'],
      ['Ollama', 'AI service'],
      ['AI triage', 'with approval'],
    ],
    advanced: 'Advanced',
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

// Icons of the tiles, the same in both languages. The members stay without an icon, five cards
// with an icon would not leave room for their names between gaps of 24 px
const ARCH_ICONS = {
  tools: ['sync', 'chart', 'client', 'logs'],
  services: ['container', 'model', 'bell'],
  iaas: ['cog', 'globe', 'group', 'network'],
  infra: ['server', 'server', 'server'],
};
// Ollama and the triage are built only in the advanced tasks of part 5
const ADVANCED_SERVICES = [1, 2];

// One column of bands, each with a header line, rows of tiles and the base it runs on
const X = 16;
const W = 748;
const INNER = 20;
const GAP = 24;
const TILE_H = 46;
const ROW_GAP = 24;
const STRIP_GAP = 12;
const BAND_GAP = 16;
const HEADER = 38;
const STRIP_H = 30;
const TAG_H = 18;

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
  // A layer is a tinted band with its name and parts on the left, the tool that builds it on
  // the right, its rows of tiles and, where it has one, the base it runs on
  const layer = (index, level, rows, base = '') => {
    const height = HEADER + rows.length * TILE_H + (rows.length - 1) * ROW_GAP + (base ? STRIP_GAP + STRIP_H : 0) + 18;
    const head = t.layers[index];
    body.push(band(X, y, W, height, level));
    body.push(label(X + INNER, y + 24, head.name));
    // The label is set with a letter spacing of 0.08 em, which measure() does not know
    const labelWidth = measure(head.name.toUpperCase(), SIZE.label, { bold: true }) + head.name.length * 0.08 * SIZE.label;
    body.push(meta(X + INNER + 14 + labelWidth, y + 24, head.parts));
    body.push(meta(X + W - INNER, y + 24, head.tools, 'end'));
    let top = y + HEADER;
    for (const { tiles, icons = [], tagged = [] } of rows) {
      columns(tiles.length).forEach((c, i) => {
        body.push(tile(c.x, top, c.w, TILE_H, ...tiles[i], { icon: icons[i] ?? '' }));
        if (tagged.includes(i)) body.push(cardTag(c, top, tiles[i]));
      });
      top += TILE_H + ROW_GAP;
    }
    if (base) body.push(strip(X + INNER, top - ROW_GAP + STRIP_GAP, W - 2 * INNER, STRIP_H, base));
    y += height + BAND_GAP;
  };
  // A tag at the right end of a card for what the advanced tasks add, it must not touch the text
  const cardTag = (c, top, [title, sub]) => {
    const width = Math.ceil(measure(t.advanced, SIZE.sub, { bold: true })) + 14;
    const x = c.x + c.w - 12 - width;
    const textEnd = c.x + 40 + Math.max(measure(title, SIZE.title, { bold: true }), measure(sub, SIZE.sub));
    if (textEnd + 8 > x) throw new Error(`The tag "${t.advanced}" does not fit beside "${title}". Widen the tile.`);
    return tag(x, top + (TILE_H - TAG_H) / 2, t.advanced);
  };

  // The bands follow the colours of the lab figure, the servers on the lab network in blue and
  // the VMs that OpenNebula provides in violet
  layer(0, 1, [{ tiles: t.members }]);
  layer(
    1,
    4,
    [
      { tiles: t.tools, icons: ARCH_ICONS.tools },
      { tiles: t.services, icons: ARCH_ICONS.services, tagged: ADVANCED_SERVICES },
    ],
    t.platformBase,
  );
  layer(2, 3, [{ tiles: t.iaas, icons: ARCH_ICONS.iaas }], t.iaasBase);
  layer(3, 2, [{ tiles: t.infra, icons: ARCH_ICONS.infra }], t.infraBase);

  return figure({ id, width: X * 2 + W, height: y - BAND_GAP + 16, title: t.title, desc: t.desc, body });
}

const LAB = {
  de: {
    title: 'Das Lab mit drei Servern, dem Client und zwei Netzen',
    desc:
      'Front-end, zwei Knoten und der Client hängen im Labnetz 192.168.210.0/24, hier mit den Beispieladressen ' +
      'von mmuster. Das Labnetz erreicht das Internet über das Gateway .1. Vom Client aus erreichst du die Server ' +
      'per SSH und ihre Weboberflächen im Browser. Auf jedem Knoten laufen VMs der Cloud. Diese VMs und das ' +
      'Front-end teilen ein internes VXLAN-Netz. Das Front-end ist dessen Gateway und leitet den Verkehr mit NAT ' +
      'ins Internet.',
    internet: ['Internet', 'über das Gateway .1'],
    client: ['Client', 'Kali, Browser, SSH', '192.168.210.10'],
    fe: ['Front-end', 'OpenNebula, Gateway, NAT', '192.168.210.137'],
    nodes: ['Knoten 1', 'Knoten 2'],
    nodeIps: ['192.168.210.138', '192.168.210.139'],
    kvm: 'KVM',
    vm: 'VM',
    labNet: 'Labnetz 192.168.210.0/24',
    innerNet: 'Internes Netz (VXLAN), zum Beispiel 172.28.217.0/24',
  },
  en: {
    title: 'The lab with three servers, the client and two networks',
    desc:
      'The front-end, two nodes and the client sit on the lab network 192.168.210.0/24, here with the example ' +
      'addresses of mmuster. The lab network reaches the internet through the gateway .1. From the client you ' +
      'reach the servers over SSH and their web interfaces in the browser. VMs of the cloud run on every node. ' +
      'These VMs and the front-end share an internal VXLAN network. The front-end is its gateway and forwards its ' +
      'traffic to the internet with NAT.',
    internet: ['Internet', 'through the gateway .1'],
    client: ['Client', 'Kali, browser, SSH', '192.168.210.10'],
    fe: ['Front-end', 'OpenNebula, gateway, NAT', '192.168.210.137'],
    nodes: ['Node 1', 'Node 2'],
    nodeIps: ['192.168.210.138', '192.168.210.139'],
    kvm: 'KVM',
    vm: 'VM',
    labNet: 'Lab network 192.168.210.0/24',
    innerNet: 'Internal network (VXLAN), for example 172.28.217.0/24',
  },
};

function labMap(lang) {
  const t = LAB[lang];
  const id = `p0c2-lab-${lang}`;
  const body = [];
  const bus = 150;
  const inner = 372;
  const nodes = [
    { x: 256, name: t.nodes[0], ip: t.nodeIps[0] },
    { x: 506, name: t.nodes[1], ip: t.nodeIps[1] },
  ];
  // Node bands first, then the networks, then the cards on top
  nodes.forEach((n) => {
    body.push(band(n.x, 186, 230, 150, 2));
    body.push(label(n.x + 16, 210, n.name, 'start', { tone: 'blue' }));
    body.push(note(n.x + 16, 227, n.ip, 'start', { code: true }));
    body.push(tag(n.x + 230 - 52, 196, t.kvm));
  });
  // Lab network with its name, every server and the client hang on it
  body.push(line([[24, bus], [736, bus]], { accent: true }));
  body.push(label(24, bus - 10, t.labNet, 'start', { tone: 'blue' }));
  for (const [x, top] of [[305, 88], [570, 100]]) body.push(line([[x, top], [x, bus]], { accent: true }));
  for (const x of [122, 371, 621]) body.push(line([[x, bus], [x, 186]], { accent: true }));
  // Internal network from the front-end to every VM
  const vms = [];
  nodes.forEach((n) => [n.x + 16, n.x + 120].forEach((x) => vms.push(x)));
  body.push(line([[122, 262], [122, inner], [vms.at(-1) + 47, inner]], { dashed: true, tone: 'violet' }));
  vms.forEach((x) => body.push(line([[x + 47, 284], [x + 47, inner]], { dashed: true, tone: 'violet' })));
  body.push(label(24, inner + 26, t.innerNet, 'start', { tone: 'violet' }));
  // Cards
  body.push(tile(220, 24, 170, 64, t.internet[0], t.internet[1], { icon: 'globe' }));
  body.push(tile(470, 24, 200, 76, t.client[0], t.client[1], { icon: 'client', detail: t.client[2] }));
  body.push(tile(24, 186, 196, 76, t.fe[0], t.fe[1], { icon: 'server', detail: t.fe[2] }));
  vms.forEach((x) => body.push(tile(x, 240, 94, 44, t.vm, '', { icon: 'vm', tone: 'violet' })));
  return figure({ id, width: 760, height: 420, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(ARCH)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p0c1-architecture.svg'), architecture(lang));
  writeFileSync(join(dir, 'p0c2-lab.svg'), labMap(lang));
}
