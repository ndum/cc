/**
 * Figures of part 4, platform as code. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/platform.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, figure, label, line, meta, note, strip, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const PLAN = {
  de: {
    title: 'Plan und Apply mit dem State',
    desc:
      'Links liegt der Code in Git als Soll-Zustand. tofu plan liest den Code, den State in terraform.tfstate ' +
      'und den Ist-Zustand in OpenNebula und zeigt die Unterschiede. tofu apply liest den Code, ändert die VMs ' +
      'in OpenNebula und schreibt den State. Rechts ändert jemand eine VM von Hand in Sunstone oder mit der CLI, ' +
      'diese Drift zeigt der nächste Plan.',
    desired: 'Soll-Zustand',
    code: ['Code in Git', 'tofu/*.tf'],
    tool: 'OpenTofu',
    plan: ['tofu plan', 'zeigt Änderungen'],
    state: ['State', 'terraform.tfstate'],
    apply: ['tofu apply', 'führt den Plan aus'],
    actual: 'Ist-Zustand',
    one: ['OpenNebula', 'API 2633, VMs'],
    drift: 'Drift',
    hand: ['Von Hand', 'Sunstone, CLI'],
    reads: 'liest',
    writes: 'schreibt',
    changes: 'ändert',
  },
  en: {
    title: 'Plan and apply with the state',
    desc:
      'On the left the code in Git is the desired state. tofu plan reads the code, the state in terraform.tfstate ' +
      'and the actual state in OpenNebula and shows the differences. tofu apply reads the code, changes the VMs ' +
      'in OpenNebula and writes the state. On the right someone changes a VM by hand in Sunstone or with the CLI, ' +
      'and the next plan shows this drift.',
    desired: 'Desired state',
    code: ['Code in Git', 'tofu/*.tf'],
    tool: 'OpenTofu',
    plan: ['tofu plan', 'shows changes'],
    state: ['State', 'terraform.tfstate'],
    apply: ['tofu apply', 'carries out the plan'],
    actual: 'Actual state',
    one: ['OpenNebula', 'API 2633, VMs'],
    drift: 'Drift',
    hand: ['By hand', 'Sunstone, CLI'],
    reads: 'reads',
    writes: 'writes',
    changes: 'changes',
  },
};

function planApply(lang) {
  const t = PLAN[lang];
  const id = `p4c1-plan-apply-${lang}`;
  // Three rows: plan on top, the state in the middle, apply at the bottom, so both state arrows run straight
  const top = 56;
  const mid = 141;
  const bottom = 226;
  const tall = bottom + 50 - top;
  // Four columns with gaps of 48 px, wide enough for the arrow labels
  const [a, b, c, d] = [
    { x: 16, w: 144 },
    { x: 208, w: 192 },
    { x: 448, w: 144 },
    { x: 640, w: 136 },
  ].map((col) => ({ ...col, tx: col.x + 16, tw: col.w - 32, end: col.x + col.w - 16 }));
  const gap = (left, right) => (left.end + right.tx) / 2;
  const cb = b.tx + b.tw / 2;
  const body = [
    band(a.x, 16, a.w, 276, 1),
    label(a.tx, 40, t.desired),
    tile(a.tx, top, a.tw, tall, ...t.code, { code: true }),
    band(b.x, 16, b.w, 276, 2),
    label(b.tx, 40, t.tool),
    tile(b.tx, top, b.tw, 50, ...t.plan),
    tile(b.tx, mid, b.tw, 50, ...t.state, { accent: true, code: true }),
    tile(b.tx, bottom, b.tw, 50, ...t.apply),
    band(c.x, 16, c.w, 276, 1),
    label(c.tx, 40, t.actual),
    tile(c.tx, top, c.tw, tall, ...t.one),
    band(d.x, 16, d.w, 276, 1),
    label(d.tx, 40, t.drift),
    tile(d.tx, mid, d.tw, 50, ...t.hand),
    // Code to plan and apply
    arrow(id, [[a.end, top + 25], [b.tx - 2, top + 25]]),
    arrow(id, [[a.end, bottom + 25], [b.tx - 2, bottom + 25]]),
    note(gap(a, b), top + 18, t.reads, 'middle'),
    note(gap(a, b), bottom + 18, t.reads, 'middle'),
    // State, read by plan and written by apply
    arrow(id, [[cb, mid], [cb, top + 52]]),
    arrow(id, [[cb, bottom], [cb, mid + 52]]),
    note(cb + 10, mid - 13, t.reads),
    note(cb + 10, bottom - 13, t.writes),
    // Actual state, read by plan and changed by apply
    arrow(id, [[c.tx, top + 25], [b.end + 2, top + 25]]),
    arrow(id, [[b.end, bottom + 25], [c.tx - 2, bottom + 25]]),
    note(gap(b, c), top + 18, t.reads, 'middle'),
    note(gap(b, c), bottom + 18, t.changes, 'middle'),
    // A change by hand is drift
    arrow(id, [[d.tx, mid + 25], [c.end + 2, mid + 25]]),
    note(gap(c, d), mid + 18, t.changes, 'middle'),
  ];
  return figure({ id, width: d.x + d.w + 16, height: 308, title: t.title, desc: t.desc, body });
}

const CLUSTER = {
  de: {
    title: 'Der k3s-Cluster in cc-net',
    desc:
      'Zwei VMs im internen Netz cc-net. k3s-server mit der Adresse CC_K3S_SERVER_IP enthält die Control Plane ' +
      'mit API-Server auf Port 6443 und der Datenbank SQLite und führt auch Pods aus. k3s-agent mit der Adresse ' +
      'CC_K3S_AGENT_IP tritt mit dem Token bei und führt Pods aus. Jeder Node bekommt für seine Pods ein /24 aus ' +
      '10.52.0.0/16, die Services liegen in 10.53.0.0/16. Mit host-gw hat jeder Node eine Route ins Pod-Netz des ' +
      'anderen über dessen Adresse in cc-net. kubectl auf dem Front-end spricht mit dem API-Server.',
    fe: 'Front-end',
    kubectl: ['kubectl', '~/.kube/config'],
    net: 'cc-net',
    netMeta: 'CC_GUEST_NET in 172.16.0.0/12',
    server: 'k3s-server',
    agent: 'k3s-agent',
    api: ['API-Server', 'Control Plane'],
    db: ['Datenbank', 'SQLite'],
    join: ['Agent', 'tritt mit dem Token bei'],
    pods: ['Pods', 'ein /24 aus 10.52.0.0/16'],
    routeServer: 'Route ins Pod-Netz des Agents',
    routeAgent: 'Route ins Pod-Netz des Servers',
    via: 'über',
    services: 'Services aus 10.53.0.0/16, gültig im ganzen Cluster',
  },
  en: {
    title: 'The k3s cluster in cc-net',
    desc:
      'Two VMs in the internal network cc-net. k3s-server with the address CC_K3S_SERVER_IP holds the control ' +
      'plane with the API server on port 6443 and the SQLite database and runs pods as well. k3s-agent with the ' +
      'address CC_K3S_AGENT_IP joins with the token and runs pods. Each node gets a /24 of 10.52.0.0/16 for its ' +
      'pods, and services live in 10.53.0.0/16. With host-gw each node has a route to the pod network of the ' +
      'other one through that node’s address in cc-net. kubectl on the front-end talks to the API server.',
    fe: 'Front-end',
    kubectl: ['kubectl', '~/.kube/config'],
    net: 'cc-net',
    netMeta: 'CC_GUEST_NET in 172.16.0.0/12',
    server: 'k3s-server',
    agent: 'k3s-agent',
    api: ['API server', 'control plane'],
    db: ['Database', 'SQLite'],
    join: ['Agent', 'joins with the token'],
    pods: ['Pods', 'a /24 of 10.52.0.0/16'],
    routeServer: 'route to the agent’s pod network',
    routeAgent: 'route to the server’s pod network',
    via: 'via',
    services: 'services from 10.53.0.0/16, valid across the cluster',
  },
};

function cluster(lang) {
  const t = CLUSTER[lang];
  const id = `p4c3-cluster-${lang}`;
  const vms = [
    { x: 232, w: 268, name: t.server, ip: 'CC_K3S_SERVER_IP', route: t.routeServer, peer: 'CC_K3S_AGENT_IP' },
    { x: 516, w: 252, name: t.agent, ip: 'CC_K3S_AGENT_IP', route: t.routeAgent, peer: 'CC_K3S_SERVER_IP' },
  ];
  const body = [
    band(16, 16, 160, 314, 1),
    label(28, 40, t.fe),
    tile(28, 96, 136, 46, ...t.kubectl, { code: true }),
    band(216, 16, 568, 314, 1),
    label(232, 40, t.net),
    meta(768, 40, t.netMeta, 'end'),
  ];
  vms.forEach((vm) => {
    const inner = vm.x + 16;
    const width = vm.w - 32;
    body.push(band(vm.x, 56, vm.w, 212, 2));
    body.push(label(inner, 80, vm.name));
    body.push(meta(inner + width, 80, vm.ip, 'end'));
    body.push(tile(inner, 152, width, 46, ...t.pods));
    // The route strip holds two lines, so its text is set as notes
    body.push(strip(inner, 208, width, 44, ''));
    body.push(note(inner + width / 2, 226, vm.route, 'middle'));
    body.push(note(inner + width / 2, 241, `${t.via} ${vm.peer}`, 'middle', { code: true }));
  });
  // The server holds the control plane, the agent only joins
  body.push(tile(248, 96, 113, 46, ...t.api, { accent: true }));
  body.push(tile(371, 96, 113, 46, ...t.db));
  body.push(tile(532, 96, 220, 46, ...t.join));
  // Pod traffic between the nodes goes straight over cc-net
  body.push(line([[484, 175], [532, 175]], { accent: true }));
  body.push(strip(232, 284, 536, 30, t.services));
  // kubectl reaches the API server over port 6443
  body.push(arrow(id, [[164, 119], [246, 119]]));
  body.push(note(196, 112, '6443', 'middle', { code: true }));
  return figure({ id, width: 800, height: 346, title: t.title, desc: t.desc, body });
}

const GITOPS = {
  de: {
    title: 'Der Kreislauf von GitOps',
    desc:
      'Das Plattform-Team schickt Änderungen mit git push an Gitea auf dem Front-end oder öffnet einen Pull ' +
      'Request, den jemand prüft und zusammenführt. Argo CD im Cluster holt das Repo wolkenwerk/platform jede ' +
      'Minute mit Leserechten, vergleicht den Soll-Zustand aus Git mit dem Ist-Zustand im Cluster und wendet die ' +
      'Unterschiede an, etwa beim Webshop im Namespace velo. Ändert jemand den Cluster von Hand mit kubectl, ' +
      'setzt Self-Heal die Änderung zurück.',
    team: ['Plattform-Team', 'Push oder Pull Request'],
    fe: 'Front-end',
    port: 'Port 3000',
    pr: ['Pull Request', 'prüfen, annehmen'],
    gitea: ['Gitea', 'wolkenwerk/platform'],
    push: 'git push',
    merge: 'Merge',
    cluster: 'k3s-Cluster',
    argo: ['Argo CD', 'vergleicht Soll und Ist'],
    shop: ['Webshop', 'Namespace velo'],
    hand: ['Von Hand', 'kubectl scale'],
    poll: ['holt jede Minute', 'nur lesen'],
    applies: 'wendet an',
    live: 'Ist-Zustand',
    heal: ['Self-Heal', 'setzt zurück'],
  },
  en: {
    title: 'The GitOps loop',
    desc:
      'The platform team sends changes with git push to Gitea on the front-end or opens a pull request that ' +
      'someone reviews and merges. Argo CD in the cluster polls the repo wolkenwerk/platform every minute with ' +
      'read-only access, compares the desired state from Git with the live state in the cluster and applies the ' +
      'differences, for example to the web shop in the namespace velo. If someone changes the cluster by hand with ' +
      'kubectl, self-heal reverts the change.',
    team: ['Platform team', 'push or pull request'],
    fe: 'Front-end',
    port: 'port 3000',
    pr: ['Pull request', 'review, merge'],
    gitea: ['Gitea', 'wolkenwerk/platform'],
    push: 'git push',
    merge: 'merge',
    cluster: 'k3s cluster',
    argo: ['Argo CD', 'compares desired and live'],
    shop: ['Web shop', 'namespace velo'],
    hand: ['By hand', 'kubectl scale'],
    poll: ['polls each minute', 'read only'],
    applies: 'applies',
    live: 'live state',
    heal: ['self-heal', 'reverts it'],
  },
};

function gitops(lang) {
  const t = GITOPS[lang];
  const id = `p4c4-gitops-${lang}`;
  // Two rows, the change enters on top left, travels down through Git and comes back up into the cluster
  const top = 60;
  const bottom = 180;
  const body = [
    tile(16, top, 150, 50, ...t.team),
    band(180, 16, 184, 234, 2),
    label(196, 40, t.fe),
    meta(348, 40, t.port, 'end'),
    tile(196, top, 152, 50, ...t.pr),
    tile(196, bottom, 152, 50, ...t.gitea, { code: true }),
    band(464, 16, 332, 234, 1),
    label(480, 40, t.cluster),
    tile(480, top, 160, 50, ...t.shop),
    tile(480, bottom, 160, 50, ...t.argo, { accent: true }),
    tile(668, top, 112, 50, ...t.hand, { code: true }),
    // Pull request on top, a direct push down the left side
    arrow(id, [[166, top + 25], [194, top + 25]]),
    arrow(id, [[86, top + 50], [86, bottom + 25], [194, bottom + 25]]),
    note(94, 150, t.push, 'start', { code: true }),
    arrow(id, [[272, top + 50], [272, bottom - 2]]),
    note(280, 150, t.merge),
    // Argo CD pulls, nobody pushes into the cluster
    arrow(id, [[348, bottom + 25], [478, bottom + 25]]),
    note(414, bottom + 18, t.poll[0], 'middle'),
    note(414, bottom + 40, t.poll[1], 'middle'),
    // Argo CD applies Git and reads the live state back
    arrow(id, [[532, bottom], [532, top + 52]]),
    note(524, 150, t.applies, 'end'),
    arrow(id, [[588, top + 50], [588, bottom - 2]]),
    note(596, 150, t.live),
    // A change by hand is drift, self-heal reverts it
    arrow(id, [[668, top + 25], [642, top + 25]]),
    note(724, 140, t.heal[0], 'middle'),
    note(724, 155, t.heal[1], 'middle'),
  ];
  return figure({ id, width: 812, height: 266, title: t.title, desc: t.desc, body });
}

const TREE = {
  de: {
    title: 'App of Apps im Plattform-Repo',
    desc:
      'Die Application root wird einmal beim Bootstrap angewendet und zeigt auf den Ordner apps. Darin liegen das ' +
      'ApplicationSet members und die Application webshop, die den Ordner webshop in den Namespace velo bringt. ' +
      'Das ApplicationSet erzeugt für jeden Ordner unter members eine Application, etwa member-velo und ' +
      'member-gemeinde.',
    boot: 'Bootstrap',
    bootMeta: 'einmal',
    apps: 'Ordner apps',
    gen: 'Erzeugt',
    genMeta: 'pro Ordner',
    root: ['root', 'Application, Ordner apps'],
    webshop: ['webshop', 'Application, Namespace velo'],
    members: ['members', 'ApplicationSet, members/*'],
    velo: ['member-velo', 'Ordner members/velo'],
    gemeinde: ['member-gemeinde', 'Ordner members/gemeinde'],
  },
  en: {
    title: 'App of apps in the platform repo',
    desc:
      'The application root is applied once during the bootstrap and points to the folder apps. It holds the ' +
      'application webshop, which brings the folder webshop into the namespace velo, and the ApplicationSet ' +
      'members. The ApplicationSet generates one application for each folder under members, such as member-velo ' +
      'and member-gemeinde.',
    boot: 'Bootstrap',
    bootMeta: 'once',
    apps: 'Folder apps',
    gen: 'Generated',
    genMeta: 'one per folder',
    root: ['root', 'Application, folder apps'],
    webshop: ['webshop', 'Application, namespace velo'],
    members: ['members', 'ApplicationSet, members/*'],
    velo: ['member-velo', 'folder members/velo'],
    gemeinde: ['member-gemeinde', 'folder members/gemeinde'],
  },
};

function appOfApps(lang) {
  const t = TREE[lang];
  const id = `p4c4-app-of-apps-${lang}`;
  const body = [
    band(16, 16, 196, 254, 1),
    label(32, 40, t.boot),
    meta(196, 40, t.bootMeta, 'end'),
    tile(32, 115, 164, 50, ...t.root, { accent: true }),
    band(252, 16, 216, 254, 2),
    label(268, 40, t.apps),
    tile(268, 60, 184, 50, ...t.webshop),
    tile(268, 170, 184, 50, ...t.members),
    // The generated applications sit next to the ApplicationSet that makes them
    band(508, 106, 216, 164, 1),
    label(524, 130, t.gen),
    meta(708, 130, t.genMeta, 'end'),
    tile(524, 146, 184, 50, ...t.velo),
    tile(524, 206, 184, 50, ...t.gemeinde),
    arrow(id, [[196, 132], [232, 132], [232, 85], [266, 85]]),
    arrow(id, [[196, 148], [232, 148], [232, 195], [266, 195]]),
    arrow(id, [[452, 187], [488, 187], [488, 171], [522, 171]]),
    arrow(id, [[452, 203], [488, 203], [488, 231], [522, 231]]),
  ];
  return figure({ id, width: 740, height: 286, title: t.title, desc: t.desc, body });
}

const MEMORY = {
  de: {
    title: 'Der Speicher eines Knotens',
    desc:
      'Ein Balken für die 8 GB eines Knotens. 0,8 GB bleiben dem Host, 7,2 GB meldet OpenNebula für VMs. Davon ' +
      'reserviert die k3s-VM 6 GB, frei bleiben 1,2 GB, genug für eine einzige VM mit 1 GB.',
    node: 'Knoten 1 oder Knoten 2',
    total: '8 GB Arbeitsspeicher',
    host: ['Host', '0,8 GB'],
    vm: ['k3s-VM', '6 GB, k3s-server oder k3s-agent'],
    free: ['frei', '1,2 GB'],
    forVms: '7,2 GB für VMs, ALLOCATED_MEM in onehost list',
  },
  en: {
    title: 'The memory of a node',
    desc:
      'A bar for the 8 GB of a node. 0.8 GB stays with the host, and OpenNebula reports 7.2 GB for VMs. Of that ' +
      'the k3s VM reserves 6 GB, and 1.2 GB stays free, enough for a single VM with 1 GB.',
    node: 'Node 1 or node 2',
    total: '8 GB of memory',
    host: ['Host', '0.8 GB'],
    vm: ['k3s VM', '6 GB, k3s-server or k3s-agent'],
    free: ['free', '1.2 GB'],
    forVms: '7.2 GB for VMs, ALLOCATED_MEM in onehost list',
  },
};

function memory(lang) {
  const t = MEMORY[lang];
  const id = `p4c2-memory-${lang}`;
  // 90 px per GB, a gap of 4 px between the parts
  const scale = 90;
  const x0 = 40;
  const host = 0.8 * scale;
  const vm = 6 * scale;
  const free = 1.2 * scale;
  const xVm = x0 + host;
  const xFree = xVm + vm;
  const end = xFree + free;
  return figure({
    id,
    width: 800,
    height: 172,
    title: t.title,
    desc: t.desc,
    body: [
      band(16, 16, 768, 140, 1),
      label(x0, 40, t.node),
      meta(end, 40, t.total, 'end'),
      tile(x0, 56, host - 4, 50, ...t.host),
      tile(xVm, 56, vm - 4, 50, ...t.vm, { accent: true }),
      tile(xFree, 56, free, 50, ...t.free),
      // A bracket under everything OpenNebula may hand out to VMs
      line([[xVm, 114], [xVm, 120], [end, 120], [end, 114]]),
      note((xVm + end) / 2, 140, t.forVms, 'middle'),
    ],
  });
}

for (const lang of Object.keys(PLAN)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p4c1-plan-apply.svg'), planApply(lang));
  writeFileSync(join(dir, 'p4c2-memory.svg'), memory(lang));
  writeFileSync(join(dir, 'p4c3-cluster.svg'), cluster(lang));
  writeFileSync(join(dir, 'p4c4-gitops.svg'), gitops(lang));
  writeFileSync(join(dir, 'p4c4-app-of-apps.svg'), appOfApps(lang));
}
