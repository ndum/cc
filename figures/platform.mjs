/**
 * Figures of part 4, platform as code. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/platform.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, escape, figure, label, line, measure, meta, note, SIZE, strip, tag, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Width of a label in small capitals, with the letter spacing that course.css adds */
const labelWidth = (text) => measure(text.toUpperCase(), SIZE.label, { bold: true }) + 0.08 * SIZE.label * text.length;

/** A label followed by a name in the monospace font, such as Vorlage templates/member */
function heading(x, y, name, code, { tone = '' } = {}) {
  return [label(x, y, name, 'start', { tone }), note(x + labelWidth(name) + 8, y, code, 'start', { code: true })].join('\n');
}

/** Stops the script when a free text does not fit the width it may take */
function check(text, width, { size = SIZE.sub, bold = false, mono = false } = {}) {
  const needed = measure(text, size, { bold, mono });
  if (needed > width) throw new Error(`"${text}" needs about ${Math.ceil(needed)} px but has only ${Math.floor(width)} px.`);
}

/** A line of secondary text with parts in the monospace font, given as [text, isCode] pairs */
function rich(x, y, parts, anchor = 'start') {
  const inner = parts.map(([text, code]) => (code ? `<tspan class="d-code">${escape(text)}</tspan>` : escape(text))).join('');
  return `<text class="d-sub" x="${x}" y="${y}" text-anchor="${anchor}">${inner}</text>`;
}

/** The right edge of a band's header, where a tag sits */
const tagAt = (right, text) => right - Math.ceil(measure(text, SIZE.sub, { bold: true })) - 14;

const PLAN = {
  de: {
    title: 'Plan und Apply mit dem State',
    desc:
      'Links liegt der Code in Git als Soll-Zustand, rechts der Ist-Zustand in OpenNebula. tofu plan liest den ' +
      'Code, den State in terraform.tfstate und den Ist-Zustand und zeigt nur, was sich ändern würde. tofu apply ' +
      'liest den Code, ändert die VMs über die API von OpenNebula und schreibt danach den State. Ganz rechts ' +
      'ändert jemand eine VM von Hand in Sunstone oder mit der CLI. Achte darauf, dass nur apply etwas ändert und ' +
      'dass der nächste Plan diese Drift zeigt, weil er den Ist-Zustand liest.',
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
      'The code in Git on the left is the desired state, and OpenNebula on the right holds the actual state. tofu ' +
      'plan reads the code, the state in terraform.tfstate and the actual state, and only shows what would ' +
      'change. tofu apply reads the code, changes the VMs through the OpenNebula API and then writes the state. ' +
      'On the far right someone changes a VM by hand in Sunstone or with the CLI. Notice that only apply changes ' +
      'anything, and that the next plan catches this drift because it reads the actual state.',
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
  // Bands with 12 px inside, gaps wide enough for the arrow labels, the change by hand stands outside a band
  const a = { x: 16, w: 148 };
  const b = { x: 204, w: 192 };
  const c = { x: 444, w: 168 };
  const d = { x: 660, w: 104 };
  for (const col of [a, b, c]) Object.assign(col, { tx: col.x + 12, tw: col.w - 24, end: col.x + col.w - 12 });
  const gap = (left, right) => (left.end + right) / 2;
  const cb = b.tx + b.tw / 2;
  const body = [
    band(a.x, 16, a.w, 276, 1),
    label(a.tx, 40, t.desired),
    band(b.x, 16, b.w, 276, 2),
    label(b.tx, 40, t.tool, 'start', { tone: 'blue' }),
    band(c.x, 16, c.w, 276, 1),
    label(c.tx, 40, t.actual),
    label(d.x, 40, t.drift),
    // Code to plan and apply, both only read it
    arrow(id, [[a.end, top + 25], [b.tx - 2, top + 25]]),
    arrow(id, [[a.end, bottom + 25], [b.tx - 2, bottom + 25]]),
    note(gap(a, b.tx), top + 18, t.reads, 'middle'),
    note(gap(a, b.tx), bottom + 18, t.reads, 'middle'),
    // The state, read by plan and written by apply
    arrow(id, [[cb, mid], [cb, top + 52]]),
    arrow(id, [[cb, bottom], [cb, mid + 52]], { accent: true }),
    note(cb + 10, mid - 13, t.reads),
    note(cb + 10, bottom - 13, t.writes),
    // The actual state, read by plan and changed only by apply
    arrow(id, [[c.tx, top + 25], [b.end + 2, top + 25]]),
    arrow(id, [[b.end, bottom + 25], [c.tx - 2, bottom + 25]], { accent: true }),
    note(gap(b, c.tx), top + 18, t.reads, 'middle'),
    note(gap(b, c.tx), bottom + 18, t.changes, 'middle'),
    // A change by hand is drift
    arrow(id, [[d.x, mid + 25], [c.end + 2, mid + 25]]),
    note(gap(c, d.x), mid + 18, t.changes, 'middle'),
    tile(a.tx, top, a.tw, tall, ...t.code, { code: true, icon: 'repo' }),
    tile(b.tx, top, b.tw, 50, ...t.plan, { icon: 'doc' }),
    tile(b.tx, mid, b.tw, 50, ...t.state, { code: true, icon: 'lock' }),
    tile(b.tx, bottom, b.tw, 50, ...t.apply, { icon: 'cog', accent: true }),
    tile(c.tx, top, c.tw, tall, ...t.one, { icon: 'server' }),
    tile(d.x, mid, d.w, 50, ...t.hand),
  ];
  return figure({ id, width: d.x + d.w + 16, height: 308, title: t.title, desc: t.desc, body });
}

const MEMORY = {
  de: {
    title: 'Der Speicher eines Knotens',
    desc:
      'Ein Balken zeigt die 8 GB eines Knotens. 0,8 GB bleiben dem Host, die übrigen 7,2 GB meldet OpenNebula ' +
      'für VMs. Davon reserviert die k3s-VM 6 GB, auf einem Knoten der Server, auf dem anderen der Agent. Frei ' +
      'bleiben 1,2 GB. Achte darauf, dass daneben nur noch eine VM mit 1 GB Platz hat, weil OpenNebula den ' +
      'ganzen Speicher jeder VM reserviert.',
    node: 'Knoten 1 oder Knoten 2',
    total: '8 GB Arbeitsspeicher',
    host: ['Host', '0,8 GB'],
    vm: ['k3s-VM', '6 GB, k3s-server oder k3s-agent'],
    free: ['frei', '1,2 GB'],
    forVms: [['7,2 GB für VMs, ', false], ['ALLOCATED_MEM', true], [' in ', false], ['onehost list', true]],
  },
  en: {
    title: 'The memory of a node',
    desc:
      'A bar shows the 8 GB of one node. The host keeps 0.8 GB, and OpenNebula reports the remaining 7.2 GB for ' +
      'VMs. The k3s VM reserves 6 GB of that, the server on one node and the agent on the other. That leaves 1.2 ' +
      'GB free. Notice that only one more VM with 1 GB fits next to it, because OpenNebula reserves the full ' +
      'memory of every VM.',
    node: 'Node 1 or node 2',
    total: '8 GB of memory',
    host: ['Host', '0.8 GB'],
    vm: ['k3s VM', '6 GB, k3s-server or k3s-agent'],
    free: ['free', '1.2 GB'],
    forVms: [['7.2 GB for VMs, ', false], ['ALLOCATED_MEM', true], [' in ', false], ['onehost list', true]],
  },
};

function memory(lang) {
  const t = MEMORY[lang];
  const id = `p4c2-memory-${lang}`;
  // 84 px per GB, a gap of 6 px between the parts of the bar
  const scale = 84;
  const x0 = 44;
  const xVm = x0 + 0.8 * scale;
  const xFree = xVm + 6 * scale;
  const end = xFree + 1.2 * scale;
  const freeW = end - xFree;
  return figure({
    id,
    width: 760,
    height: 172,
    title: t.title,
    desc: t.desc,
    body: [
      band(16, 16, 728, 140, 2),
      label(32, 40, t.node, 'start', { tone: 'blue' }),
      meta(end, 40, t.total, 'end'),
      tile(x0, 56, xVm - x0 - 6, 50, ...t.host),
      tile(xVm, 56, xFree - xVm - 6, 50, ...t.vm, { icon: 'vm', tone: 'violet' }),
      // The free part is no card, only room OpenNebula can still hand out
      `<rect class="d-strip" x="${xFree}" y="56" width="${freeW}" height="50" rx="10"/>`,
      `<text class="d-title" x="${xFree + freeW / 2}" y="78" text-anchor="middle">${escape(t.free[0])}</text>`,
      note(xFree + freeW / 2, 94, t.free[1], 'middle'),
      // A bracket under everything OpenNebula may hand out to VMs
      line([[xVm, 114], [xVm, 120], [end, 120], [end, 114]]),
      rich((xVm + end) / 2, 140, t.forVms, 'middle'),
    ],
  });
}

const CLUSTER = {
  de: {
    title: 'Der k3s-Cluster in cc-net',
    desc:
      'Links spricht kubectl auf dem Front-end mit der kubeconfig den API-Server auf Port 6443 an. Im internen ' +
      'Netz cc-net mit dem Bereich CC_GUEST_NET liegen zwei VMs. k3s-server mit der Adresse CC_K3S_SERVER_IP ' +
      'enthält die Control Plane mit API-Server und der Datenbank SQLite und führt selbst Pods aus. k3s-agent mit ' +
      'der Adresse CC_K3S_AGENT_IP tritt mit dem Token bei und führt ebenfalls Pods aus. Jeder Node bekommt für ' +
      'seine Pods ein /24 aus 10.52.0.0/16, die Services liegen für den ganzen Cluster in 10.53.0.0/16. Achte auf ' +
      'die Routen von host-gw. Jeder Node schickt Pakete für das Pod-Netz des anderen direkt an dessen Adresse in ' +
      'cc-net, ohne Overlay.',
    net: [['CC_GUEST_NET', true], [' in ', false], ['172.16.0.0/12', true]],
    fe: 'Front-end',
    kubectl: ['kubectl', '~/.kube/config'],
    server: 'k3s-server',
    agent: 'k3s-agent',
    api: ['API-Server', 'Control Plane'],
    db: ['SQLite', 'Datenbank'],
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
      'On the left, kubectl on the front-end uses the kubeconfig to reach the API server on port 6443. Two VMs ' +
      'sit in the internal network cc-net with the range CC_GUEST_NET. k3s-server at CC_K3S_SERVER_IP holds the ' +
      'control plane with the API server and the SQLite database and runs pods itself. k3s-agent at ' +
      'CC_K3S_AGENT_IP joins with the token and runs pods too. Each node gets a /24 of 10.52.0.0/16 for its pods, ' +
      "while services use 10.53.0.0/16 across the whole cluster. Look at the host-gw routes. Each node sends " +
      "packets for the other node's pod network straight to that node's address in cc-net, with no overlay.",
    net: [['CC_GUEST_NET', true], [' in ', false], ['172.16.0.0/12', true]],
    fe: 'Front-end',
    kubectl: ['kubectl', '~/.kube/config'],
    server: 'k3s-server',
    agent: 'k3s-agent',
    api: ['API server', 'control plane'],
    db: ['SQLite', 'database'],
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
  const fe = { x: 16, w: 160 };
  const vms = [
    { x: 220, w: 280, name: t.server, ip: 'CC_K3S_SERVER_IP', route: t.routeServer, peer: 'CC_K3S_AGENT_IP' },
    { x: 524, w: 240, name: t.agent, ip: 'CC_K3S_AGENT_IP', route: t.routeAgent, peer: 'CC_K3S_SERVER_IP' },
  ];
  const bus = 56;
  const top = 84;
  const rows = [140, 210, 270];
  const centre = (box) => box.x + box.w / 2;
  const body = [
    // cc-net joins the front-end, its gateway, and both VMs
    line([[centre(fe), bus], [centre(vms[1]), bus]], { dashed: true, tone: 'violet' }),
    ...[fe, ...vms].map((box) => line([[centre(box), bus], [centre(box), top]], { dashed: true, tone: 'violet' })),
    label(32, 40, 'cc-net', 'start', { tone: 'violet' }),
    rich(32 + labelWidth('cc-net') + 10, 40, t.net),
    band(fe.x, top, fe.w, 128, 2),
    label(fe.x + 16, top + 24, t.fe, 'start', { tone: 'blue' }),
    tile(fe.x + 16, rows[0], fe.w - 32, 46, ...t.kubectl, { code: true }),
  ];
  vms.forEach((vm) => {
    const inner = vm.x + 16;
    const width = vm.w - 32;
    body.push(band(vm.x, top, vm.w, 246, 3));
    body.push(label(inner, top + 24, vm.name, 'start', { tone: 'violet' }));
    body.push(note(inner, top + 41, vm.ip, 'start', { code: true }));
    body.push(tile(inner, rows[1], width, 46, ...t.pods, { icon: 'container' }));
    // The route strip holds two lines, so its text is set as notes
    body.push(strip(inner, rows[2], width, 44, ''));
    check(vm.route, width - 24);
    body.push(note(inner + width / 2, rows[2] + 18, vm.route, 'middle'));
    body.push(note(inner + width / 2, rows[2] + 33, `${t.via} ${vm.peer}`, 'middle', { code: true }));
  });
  // The server holds the control plane, the agent only joins
  body.push(tile(236, rows[0], 123, 46, ...t.api, { icon: 'cog', accent: true }));
  body.push(tile(371, rows[0], 113, 46, ...t.db, { icon: 'database' }));
  body.push(tile(540, rows[0], 208, 46, ...t.join, { icon: 'sync' }));
  // Pod traffic between the nodes goes straight over cc-net
  body.push(line([[484, rows[1] + 23], [540, rows[1] + 23]], { tone: 'violet' }));
  body.push(strip(220, 346, 544, 30, t.services));
  // kubectl reaches the API server over port 6443
  body.push(arrow(id, [[fe.x + fe.w - 16, rows[0] + 23], [234, rows[0] + 23]], { accent: true }));
  body.push(note(198, rows[0] + 16, '6443', 'middle', { code: true }));
  return figure({ id, width: 780, height: 392, title: t.title, desc: t.desc, body });
}

const GITOPS = {
  de: {
    title: 'Der Kreislauf von GitOps',
    desc:
      'Das Plattform-Team schickt eine Änderung mit git push an Gitea auf dem Front-end oder öffnet einen Pull ' +
      'Request, der nach der Prüfung zusammengeführt wird. Argo CD im k3s-Cluster holt das Repo ' +
      'wolkenwerk/platform jede Minute mit Leserechten. Es vergleicht den Soll-Zustand aus Git mit dem Ist-Zustand ' +
      'und wendet die Unterschiede an, etwa beim Webshop im Namespace velo. Ändert jemand den Cluster von Hand mit ' +
      'kubectl scale, setzt Self-Heal die Änderung zurück. Achte auf die Richtung der Pfeile. Argo CD holt sich ' +
      'den Soll-Zustand selbst, niemand schickt ihn in den Cluster.',
    team: 'Plattform-Team',
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
    heal: 'Self-Heal setzt zurück',
  },
  en: {
    title: 'The GitOps loop',
    desc:
      'The platform team sends a change with git push to Gitea on the front-end, or opens a pull request that is ' +
      'merged after review. Argo CD in the k3s cluster polls the repo wolkenwerk/platform every minute with ' +
      'read-only access. It compares the desired state from Git with the live state, for example for the web shop ' +
      'in the namespace velo, and applies the differences. If someone changes the cluster by hand with kubectl ' +
      'scale, self-heal reverts the change. Pay attention to the direction of the arrows. Argo CD pulls the ' +
      'desired state itself, nobody pushes it into the cluster.',
    team: 'Platform team',
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
    poll: ['polls every minute', 'read only'],
    applies: 'applies',
    live: 'live state',
    heal: 'self-heal reverts it',
  },
};

function gitops(lang) {
  const t = GITOPS[lang];
  const id = `p4c4-gitops-${lang}`;
  // Git on top, the cluster below, the people who change things on the left
  const left = { x: 16, w: 160 };
  const colL = { x: 216, w: 188 };
  const colR = { x: 476, w: 252 };
  const rowGit = 56;
  const rowCluster = 246;
  const pushY = 132;
  const cx = (col) => col.x + col.w / 2;
  const body = [
    band(200, 16, 544, 134, 2),
    label(216, 40, t.fe, 'start', { tone: 'blue' }),
    tag(tagAt(728, t.port), 27, t.port),
    band(200, 206, 544, 114, 3),
    label(216, 230, t.cluster, 'start', { tone: 'violet' }),
    // A pull request on top, a direct push runs below it into Gitea
    arrow(id, [[left.x + left.w, rowGit + 25], [colL.x - 2, rowGit + 25]], { accent: true }),
    arrow(id, [[cx(left), rowGit + 50], [cx(left), pushY], [520, pushY], [520, rowGit + 52]], { accent: true }),
    note(530, pushY - 8, t.push, 'start', { code: true }),
    arrow(id, [[colL.x + colL.w, rowGit + 25], [colR.x - 2, rowGit + 25]], { accent: true }),
    note((colL.x + colL.w + colR.x) / 2, rowGit + 18, t.merge, 'middle'),
    // Argo CD fetches the desired state itself, nobody pushes into the cluster
    arrow(id, [[cx(colR), rowCluster], [cx(colR), rowGit + 52]], { accent: true }),
    note(cx(colR) - 10, 174, t.poll[0], 'end'),
    note(cx(colR) - 10, 190, t.poll[1], 'end'),
    // Argo CD applies Git and reads the live state back
    arrow(id, [[colR.x, rowCluster + 15], [colL.x + colL.w + 2, rowCluster + 15]], { accent: true }),
    arrow(id, [[colL.x + colL.w, rowCluster + 35], [colR.x - 2, rowCluster + 35]]),
    note((colL.x + colL.w + colR.x) / 2, rowCluster + 8, t.applies, 'middle'),
    note((colL.x + colL.w + colR.x) / 2, rowCluster + 52, t.live, 'middle'),
    // A change by hand is drift, self-heal reverts it
    arrow(id, [[left.x + left.w, rowCluster + 25], [colL.x - 2, rowCluster + 25]]),
    note(cx(left), rowCluster + 70, t.heal, 'middle'),
    tile(left.x, rowGit, left.w, 50, t.team, '', { icon: 'group' }),
    tile(colL.x, rowGit, colL.w, 50, ...t.pr, { icon: 'doc' }),
    tile(colR.x, rowGit, colR.w, 50, ...t.gitea, { icon: 'repo', code: true }),
    tile(left.x, rowCluster, left.w, 50, ...t.hand, { icon: 'user', code: true }),
    tile(colL.x, rowCluster, colL.w, 50, ...t.shop, { icon: 'container' }),
    tile(colR.x, rowCluster, colR.w, 50, ...t.argo, { icon: 'sync', accent: true }),
  ];
  for (const text of [t.applies, t.live, t.merge]) check(text, colR.x - colL.x - colL.w - 8);
  return figure({ id, width: 760, height: 336, title: t.title, desc: t.desc, body });
}

const TREE = {
  de: {
    title: 'App of Apps im Plattform-Repo',
    desc:
      'Die Application root wendet das Skript beim Bootstrap einmal an, sie zeigt auf den Ordner apps. Darin ' +
      'liegen das ApplicationSet members aus Kapitel 4.5 und die Application webshop, die den Ordner webshop in ' +
      'den Namespace velo bringt. Das ApplicationSet erzeugt für jeden Ordner unter members eine eigene ' +
      'Application, etwa member-velo und member-gemeinde. Achte darauf, dass nur root von Hand in den Cluster ' +
      'kommt, alles Weitere entsteht aus Dateien in Git.',
    boot: 'Bootstrap',
    once: 'einmal',
    folder: 'Ordner',
    gen: 'Erzeugt',
    perFolder: 'pro Ordner',
    root: ['root', 'Application', 'apps/'],
    webshop: ['webshop', 'Application', 'webshop/ → velo'],
    members: ['members', 'ApplicationSet', 'members/*'],
    velo: ['member-velo', 'Application', 'members/velo'],
    gemeinde: ['member-gemeinde', 'Application', 'members/gemeinde'],
  },
  en: {
    title: 'App of apps in the platform repo',
    desc:
      'The bootstrap script applies the application root once, and root points to the folder apps. That folder ' +
      'holds the application webshop, which brings the folder webshop into the namespace velo, and the ' +
      'ApplicationSet members from chapter 4.5. The ApplicationSet generates a separate application for every ' +
      'folder under members, such as member-velo and member-gemeinde. Notice that only root enters the cluster ' +
      'by hand, and everything else comes from files in Git.',
    boot: 'Bootstrap',
    once: 'once',
    folder: 'Folder',
    gen: 'Generated',
    perFolder: 'one per folder',
    root: ['root', 'Application', 'apps/'],
    webshop: ['webshop', 'Application', 'webshop/ → velo'],
    members: ['members', 'ApplicationSet', 'members/*'],
    velo: ['member-velo', 'Application', 'members/velo'],
    gemeinde: ['member-gemeinde', 'Application', 'members/gemeinde'],
  },
};

function appOfApps(lang) {
  const t = TREE[lang];
  const id = `p4c4-app-of-apps-${lang}`;
  const card = (x, y, w, [title, sub, detail], options = {}) => tile(x, y, w, 64, title, sub, { detail, ...options });
  const body = [
    band(16, 16, 172, 272, 1),
    label(32, 40, t.boot),
    tag(tagAt(172, t.once), 27, t.once),
    band(236, 16, 196, 272, 1),
    heading(252, 40, t.folder, 'apps/'),
    band(480, 16, 264, 272, 1),
    label(496, 40, t.gen),
    tag(tagAt(728, t.perFolder), 27, t.perFolder),
    // root brings the folder apps, the ApplicationSet makes one application per member folder
    arrow(id, [[172, 132], [212, 132], [212, 88], [250, 88]], { accent: true }),
    arrow(id, [[172, 148], [212, 148], [212, 200], [250, 200]], { accent: true }),
    arrow(id, [[416, 192], [456, 192], [456, 144], [494, 144]], { accent: true }),
    arrow(id, [[416, 208], [456, 208], [456, 240], [494, 240]], { accent: true }),
    card(32, 108, 140, t.root, { icon: 'sync', accent: true }),
    card(252, 56, 164, t.webshop, { icon: 'container' }),
    card(252, 168, 164, t.members, { icon: 'cog' }),
    card(496, 112, 232, t.velo, { icon: 'sync' }),
    card(496, 208, 232, t.gemeinde, { icon: 'sync' }),
  ];
  return figure({ id, width: 760, height: 304, title: t.title, desc: t.desc, body });
}

const KUSTOMIZE = {
  de: {
    title: 'Ein Namespace aus der Vorlage',
    desc:
      'Oben liegt die Vorlage templates/member, eine Component von Kustomize mit dem Namespace member, einer ' +
      'ResourceQuota mit requests.cpu 1, einer LimitRange mit dem Standard 250m pro Container und einer ' +
      'NetworkPolicy, die nur ' +
      'den eigenen Namespace und kube-system durchlässt. In der Mitte setzt der Ordner members/velo den Namespace ' +
      'velo und ersetzt mit einem Patch requests.cpu durch 2. Das ApplicationSet members liest den Ordner mit dem ' +
      'Generator git und erzeugt die Application member-velo. Argo CD rendert sie mit Kustomize, unten stehen die ' +
      'Objekte im Cluster. Achte auf die Unterschiede zur Vorlage. Der Namespace heisst velo und die Quota ' +
      'erlaubt 2 CPU, alles andere kommt unverändert aus der Vorlage.',
    template: 'Vorlage',
    component: 'Component',
    member: 'Mitglied',
    kustomization: 'Kustomization',
    argo: 'Argo CD',
    cluster: 'Im Cluster',
    clusterMeta: 'von Argo CD angewendet',
    files: [
      ['Namespace', 'Platzhalter', 'name: member'],
      ['ResourceQuota', 'Grenze des Namespaces', 'requests.cpu: 1'],
      ['LimitRange', 'Standard pro Container', 'default cpu: 250m'],
      ['NetworkPolicy', 'eigener Namespace und', 'kube-system'],
    ],
    rendered: [
      ['Namespace', 'umbenannt', 'name: velo'],
      ['ResourceQuota', 'Wert aus dem Patch', 'requests.cpu: 2'],
      ['LimitRange', 'Standard pro Container', 'default cpu: 250m'],
      ['NetworkPolicy', 'Namespace velo und', 'kube-system'],
    ],
    ns: ['Namespace', 'namespace: velo'],
    patch: ['Patch', 'requests.cpu: 2'],
    set: ['members', 'ApplicationSet', 'git: members/*'],
    app: ['member-velo', 'Application', 'members/velo'],
    reads: 'liest',
    creates: 'erzeugt',
    renders: 'rendert mit Kustomize',
  },
  en: {
    title: 'A namespace from the template',
    desc:
      'At the top is the template templates/member, a Kustomize component with the namespace member, a ' +
      'ResourceQuota with requests.cpu 1, a LimitRange with a default of 250m per container and a NetworkPolicy ' +
      'that only lets ' +
      'in its own namespace and kube-system. In the middle, the folder members/velo sets the namespace velo and ' +
      'replaces requests.cpu with 2 through a patch. The ApplicationSet members reads the folder with its git ' +
      'generator and creates the application member-velo. Argo CD renders it with Kustomize, and the objects in ' +
      'the cluster are at the bottom. Notice the differences from the template. The namespace is called velo and ' +
      'the quota allows 2 CPUs, while everything else comes unchanged from the template.',
    template: 'Template',
    component: 'Component',
    member: 'Member',
    kustomization: 'Kustomization',
    argo: 'Argo CD',
    cluster: 'In the cluster',
    clusterMeta: 'applied by Argo CD',
    files: [
      ['Namespace', 'placeholder', 'name: member'],
      ['ResourceQuota', 'limit of the namespace', 'requests.cpu: 1'],
      ['LimitRange', 'default per container', 'default cpu: 250m'],
      ['NetworkPolicy', 'own namespace and', 'kube-system'],
    ],
    rendered: [
      ['Namespace', 'renamed', 'name: velo'],
      ['ResourceQuota', 'value from the patch', 'requests.cpu: 2'],
      ['LimitRange', 'default per container', 'default cpu: 250m'],
      ['NetworkPolicy', 'namespace velo and', 'kube-system'],
    ],
    ns: ['Namespace', 'namespace: velo'],
    patch: ['Patch', 'requests.cpu: 2'],
    set: ['members', 'ApplicationSet', 'git: members/*'],
    app: ['member-velo', 'Application', 'members/velo'],
    reads: 'reads',
    creates: 'creates',
    renders: 'renders with Kustomize',
  },
};

function kustomize(lang) {
  const t = KUSTOMIZE[lang];
  const id = `p4c5-kustomize-${lang}`;
  // The four objects of the template and of the namespace in the cluster share their columns
  const W = 162;
  const col = (i) => 32 + i * (W + 16);
  const set = { x: 388, w: 146 };
  const app = { x: 582, w: 146 };
  const appX = app.x + app.w / 2;
  const body = [
    // Folders in the platform repo
    band(16, 16, 728, 120, 2),
    heading(32, 40, t.template, 'templates/member', { tone: 'blue' }),
    tag(tagAt(728, t.component), 27, t.component),
    band(16, 176, 332, 116, 2),
    heading(32, 200, t.member, 'members/velo', { tone: 'blue' }),
    tag(tagAt(332, t.kustomization), 187, t.kustomization),
    // Argo CD in the cluster
    band(372, 176, 372, 116, 3),
    label(388, 200, t.argo, 'start', { tone: 'violet' }),
    band(16, 332, 728, 120, 3),
    label(32, 356, t.cluster, 'start', { tone: 'violet' }),
    meta(728, 356, t.clusterMeta, 'end'),
    // The member folder pulls in the template as a component
    arrow(id, [[182, 176], [182, 138]]),
    note(194, 161, 'components', 'start', { code: true }),
    // The ApplicationSet reads the folder and creates an application for it
    arrow(id, [[set.x, 246], [350, 246]], { accent: true }),
    note(369, 239, t.reads, 'middle'),
    arrow(id, [[set.x + set.w, 246], [app.x - 2, 246]], { accent: true }),
    note((set.x + set.w + app.x) / 2, 239, t.creates, 'middle'),
    // Argo CD renders the folder and applies the objects
    arrow(id, [[appX, 278], [appX, 330]], { accent: true }),
    note(appX - 10, 316, t.renders, 'end'),
  ];
  check(t.reads, 36);
  check(t.creates, app.x - set.x - set.w - 4);
  t.files.forEach(([title, sub, detail], i) => body.push(tile(col(i), 52, W, 64, title, sub, { detail })));
  body.push(tile(32, 214, 142, 50, ...t.ns, { code: true }));
  body.push(tile(186, 214, 146, 50, ...t.patch, { code: true }));
  body.push(tile(set.x, 214, set.w, 64, t.set[0], t.set[1], { detail: t.set[2], icon: 'cog' }));
  body.push(tile(app.x, 214, app.w, 64, t.app[0], t.app[1], { detail: t.app[2], icon: 'sync' }));
  t.rendered.forEach(([title, sub, detail], i) =>
    body.push(tile(col(i), 368, W, 64, title, sub, { detail, accent: i === 1 })),
  );
  return figure({ id, width: 760, height: 468, title: t.title, desc: t.desc, body });
}

const REBUILD = {
  de: {
    title: 'Der Neubau der Plattform',
    desc:
      'Der Zielzustand von Auftrag A. Nach einem Abriss entsteht die Plattform neu aus dem Code. Oben links das ' +
      'Front-end, das stehen bleibt. Darauf liegen OpenTofu mit Code und State sowie Gitea mit dem Repo ' +
      'wolkenwerk/platform. Oben rechts der neue k3s-Cluster in cc-net. OpenTofu legt die zwei VMs k3s-server ' +
      'und k3s-agent neu an. Argo CD kommt mit dem Bootstrap dazu, holt den Soll-Zustand aus Gitea und wendet ' +
      'die Applications für den Webshop und die Mitglieder an. Unten misst dein Runbook oder Skript jeden ' +
      'Schritt, den Abriss, den Start der VMs, Kubernetes und Argo CD. Achte darauf, dass die Ausfallzeit vom ' +
      'Start des Abrisses bis zur ersten Antwort des Webshops reicht.',
    fe: 'Front-end',
    stays: 'bleibt stehen',
    tofu: ['OpenTofu', 'Code und State'],
    gitea: ['Gitea', 'wolkenwerk/platform'],
    cluster: 'k3s-Cluster in cc-net',
    rebuilt: 'neu gebaut',
    vms: ['k3s-server und k3s-agent', 'zwei neue VMs'],
    argo: ['Argo CD', 'aus dem Bootstrap'],
    apps: ['Applications', 'Webshop und Mitglieder'],
    creates: 'legt an',
    pulls: 'holt',
    applies: 'wendet an',
    runbook: 'Runbook oder Skript',
    times: 'misst jeden Schritt',
    phases: [
      ['Abriss', 'bis die VMs weg sind'],
      ['Start der VMs', 'bis beide laufen'],
      ['Kubernetes', 'bis die Nodes Ready sind'],
      ['Argo CD', 'bis der Webshop antwortet'],
    ],
    start: 'Start des Abrisses',
    end: 'erste Antwort des Webshops',
    outage: 'gemessene Ausfallzeit',
  },
  en: {
    title: 'Rebuilding the platform',
    desc:
      'The target state of task A. After a teardown the platform comes back from code. At the top left is the ' +
      'front-end, which stays in place. It holds OpenTofu with the code and the state, and Gitea with the repo ' +
      'wolkenwerk/platform. At the top right is the new k3s cluster in cc-net. OpenTofu creates the two VMs ' +
      'k3s-server and k3s-agent again. Argo CD arrives with the bootstrap, pulls the desired state from Gitea ' +
      'and applies the applications for the web shop and the members. At the bottom your runbook or script ' +
      'times every step, the teardown, the start of the VMs, Kubernetes and Argo CD. Notice that the outage ' +
      'runs from the start of the teardown to the first answer of the web shop.',
    fe: 'Front-end',
    stays: 'stays in place',
    tofu: ['OpenTofu', 'code and state'],
    gitea: ['Gitea', 'wolkenwerk/platform'],
    cluster: 'k3s cluster in cc-net',
    rebuilt: 'rebuilt',
    vms: ['k3s-server and k3s-agent', 'two new VMs'],
    argo: ['Argo CD', 'from the bootstrap'],
    apps: ['Applications', 'web shop and members'],
    creates: 'creates',
    pulls: 'pulls',
    applies: 'applies',
    runbook: 'Runbook or script',
    times: 'times every step',
    phases: [
      ['Teardown', 'until the VMs are gone'],
      ['VM start', 'until both are running'],
      ['Kubernetes', 'until the nodes are Ready'],
      ['Argo CD', 'until the web shop answers'],
    ],
    start: 'start of the teardown',
    end: 'first answer of the web shop',
    outage: 'measured outage',
  },
};

function rebuild(lang) {
  const t = REBUILD[lang];
  const id = `p4c6-rebuild-${lang}`;
  // The platform after the rebuild on top, the steps the runbook times below
  const fe = { x: 16, w: 232 };
  const cl = { x: 296, w: 468 };
  const rows = [56, 134];
  const mid = (row) => row + 25;
  const argo = { x: 312, w: 168 };
  const apps = { x: 572, w: 176 };
  // Four steps of equal width on the time axis, the real minutes come from the student's lab
  const B = [32, 211, 390, 569, 748];
  const AXIS = 344;
  const body = [
    band(fe.x, 16, fe.w, 184, 2),
    label(32, 40, t.fe, 'start', { tone: 'blue' }),
    tag(tagAt(fe.x + fe.w - 16, t.stays), 27, t.stays),
    band(cl.x, 16, cl.w, 184, 3),
    label(cl.x + 16, 40, t.cluster, 'start', { tone: 'violet' }),
    tag(tagAt(cl.x + cl.w - 16, t.rebuilt), 27, t.rebuilt, { tone: 'violet' }),
    // OpenTofu creates the VMs, Argo CD pulls Git and applies the applications
    arrow(id, [[fe.x + fe.w - 16, mid(rows[0])], [cl.x + 14, mid(rows[0])]], { accent: true }),
    note((fe.x + fe.w + cl.x) / 2, mid(rows[0]) - 7, t.creates, 'middle'),
    arrow(id, [[argo.x, mid(rows[1])], [fe.x + fe.w - 14, mid(rows[1])]], { accent: true }),
    note((fe.x + fe.w + cl.x) / 2, mid(rows[1]) - 7, t.pulls, 'middle'),
    arrow(id, [[argo.x + argo.w, mid(rows[1])], [apps.x - 2, mid(rows[1])]], { accent: true }),
    note((argo.x + argo.w + apps.x) / 2, mid(rows[1]) - 7, t.applies, 'middle'),
    tile(32, rows[0], 200, 50, ...t.tofu, { icon: 'cog' }),
    tile(32, rows[1], 200, 50, ...t.gitea, { icon: 'repo', code: true }),
    tile(312, rows[0], 436, 50, ...t.vms, { icon: 'vm', tone: 'violet' }),
    tile(argo.x, rows[1], argo.w, 50, ...t.argo, { icon: 'sync', accent: true }),
    tile(apps.x, rows[1], apps.w, 50, ...t.apps, { icon: 'container' }),
    // The runbook or script and the time axis of the outage
    band(16, 224, 748, 190, 1),
    label(32, 248, t.runbook),
    tag(tagAt(748, t.times), 235, t.times),
  ];
  for (const text of [t.creates, t.pulls]) check(text, cl.x - fe.x - fe.w);
  check(t.applies, apps.x - argo.x - argo.w - 8);
  B.forEach((x) => body.push(`<path class="d-grid" d="M ${x} 264 V ${AXIS}"/>`));
  t.phases.forEach(([title, sub], i) => body.push(tile(B[i] + 6, 268, B[i + 1] - B[i] - 12, 52, title, sub)));
  body.push(line([[B[0], AXIS], [B[4], AXIS]], { accent: true }));
  B.forEach((x) => body.push(`<circle class="d-fill-blue" cx="${x}" cy="${AXIS}" r="4.5"/>`));
  body.push(note(B[0], AXIS + 20, t.start));
  body.push(note(B[4], AXIS + 20, t.end, 'end'));
  // The whole span is the outage the task asks for
  body.push(line([[B[0], AXIS + 32], [B[0], AXIS + 38], [B[4], AXIS + 38], [B[4], AXIS + 32]]));
  body.push(note((B[0] + B[4]) / 2, AXIS + 56, t.outage, 'middle'));
  return figure({ id, width: 780, height: 430, title: t.title, desc: t.desc, body });
}

const MEMBER = {
  de: {
    title: 'Ein eigenes Mitglied mit AppProject',
    desc:
      'Der Zielzustand von Auftrag B. Oben in Gitea beantragt ein Pull Request den Namespace aus der Vorlage, ' +
      'nach dem Review liegen der Ordner des Mitglieds und das AppProject auf main. In der Mitte holt Argo CD ' +
      'beide aus Git. Die Application des Mitglieds und eine Application zum Test nennen das AppProject, das als ' +
      'Ziel nur den Namespace des Mitglieds erlaubt. Unten im Cluster wendet Argo CD die Application des ' +
      'Mitglieds in seinem Namespace mit eigener Quota und LimitRange an. Achte auf die Application zum Test. ' +
      'Sie will in den Namespace velo eines anderen Mitglieds schreiben und Argo CD lehnt sie ab.',
    git: 'Gitea',
    repo: 'wolkenwerk/platform',
    pr: ['Pull Request', 'Namespace aus der Vorlage'],
    merge: 'Merge nach Review',
    main: ['main', 'Ordner des Mitglieds und AppProject'],
    argo: 'Argo CD',
    pulls: 'holt',
    app: ['Application', 'des Mitglieds'],
    project: ['AppProject', 'nur sein Namespace'],
    test: ['Application zum Test', 'will nach velo schreiben'],
    names: 'nennt',
    cluster: 'Im Cluster',
    ns: ['Namespace des Mitglieds', 'eigene Quota und LimitRange'],
    velo: ['Namespace velo', 'anderes Mitglied'],
    applies: 'wendet an',
    rejected: 'abgelehnt',
  },
  en: {
    title: 'A member of your own with an AppProject',
    desc:
      'The target state of task B. At the top, a pull request in Gitea asks for the namespace from the template, ' +
      'and after the review the member folder and the AppProject are on main. In the middle, Argo CD pulls both ' +
      'from Git. The member application and a test application name the AppProject, which allows only the ' +
      'member namespace as a destination. At the bottom, in the cluster, Argo CD applies the member application ' +
      'in its namespace with its own quota and LimitRange. Notice the test application. It tries to write to ' +
      'the namespace velo of another member, and Argo CD rejects it.',
    git: 'Gitea',
    repo: 'wolkenwerk/platform',
    pr: ['Pull request', 'namespace from the template'],
    merge: 'merge after review',
    main: ['main', 'member folder and AppProject'],
    argo: 'Argo CD',
    pulls: 'pulls',
    app: ['Application', 'of the member'],
    project: ['AppProject', 'only its namespace'],
    test: ['Test application', 'tries to write to velo'],
    names: 'names',
    cluster: 'In the cluster',
    ns: ['Member namespace', 'own quota and LimitRange'],
    velo: ['Namespace velo', 'another member'],
    applies: 'applies',
    rejected: 'rejected',
  },
};

function member(lang) {
  const t = MEMBER[lang];
  const id = `p4c6-member-${lang}`;
  // Git on top, Argo CD in the middle, the cluster below, the member on the left, the test on the right
  const left = { x: 32, w: 216 };
  const centre = { x: 296, w: 168 };
  const right = { x: 512, w: 216 };
  const main = { x: 368, w: 360 };
  const rowGit = 56;
  const rowArgo = 204;
  const rowCluster = 350;
  const cx = (col) => col.x + col.w / 2;
  const body = [
    band(16, 16, 728, 108, 2),
    heading(32, 40, t.git, t.repo, { tone: 'blue' }),
    band(16, 164, 728, 106, 3),
    label(32, 188, t.argo, 'start', { tone: 'violet' }),
    band(16, 310, 728, 106, 3),
    label(32, 334, t.cluster, 'start', { tone: 'violet' }),
    // The request reaches main only after the review
    arrow(id, [[left.x + left.w, rowGit + 25], [main.x - 2, rowGit + 25]], { accent: true }),
    note((left.x + left.w + main.x) / 2, rowGit + 18, t.merge, 'middle'),
    // Argo CD pulls the applications and the AppProject from Git
    arrow(id, [[cx(centre), rowArgo], [cx(centre), rowGit + 52]], { accent: true }),
    note(cx(centre) + 10, 150, t.pulls),
    // Both applications name the project
    arrow(id, [[left.x + left.w, rowArgo + 25], [centre.x - 2, rowArgo + 25]]),
    note((left.x + left.w + centre.x) / 2, rowArgo + 18, t.names, 'middle'),
    arrow(id, [[right.x, rowArgo + 25], [centre.x + centre.w + 2, rowArgo + 25]]),
    note((centre.x + centre.w + right.x) / 2, rowArgo + 18, t.names, 'middle'),
    // The project lets the member application in and stops the test
    arrow(id, [[cx(left), rowArgo + 50], [cx(left), rowCluster - 2]], { accent: true }),
    note(cx(left) + 10, 294, t.applies),
    arrow(id, [[cx(right), rowArgo + 50], [cx(right), rowCluster - 2]], { dashed: true }),
    note(cx(right) + 10, 294, t.rejected),
    tile(left.x, rowGit, left.w, 50, ...t.pr, { icon: 'doc' }),
    tile(main.x, rowGit, main.w, 50, ...t.main, { icon: 'repo' }),
    tile(left.x, rowArgo, left.w, 50, ...t.app, { icon: 'sync' }),
    tile(centre.x, rowArgo, centre.w, 50, ...t.project, { icon: 'shield', accent: true }),
    tile(right.x, rowArgo, right.w, 50, ...t.test, { icon: 'sync' }),
    tile(left.x, rowCluster, left.w, 50, ...t.ns),
    tile(right.x, rowCluster, right.w, 50, ...t.velo),
  ];
  check(t.merge, main.x - left.x - left.w - 8);
  check(t.names, centre.x - left.x - left.w - 4);
  return figure({ id, width: 760, height: 432, title: t.title, desc: t.desc, body });
}

const BRANCH = {
  de: {
    title: 'Der geschützte Branch main',
    desc:
      'Der Zielzustand von Auftrag C. Links das Plattform-Team mit deinem Konto platform, das zugleich ' +
      'Administrator von Gitea ist. Daneben steht ein zweites Konto mit Schreibrechten. In der Mitte liegt in ' +
      'Gitea das Repo wolkenwerk/platform mit dem geschützten Branch main. Einen direkten Push von platform auf ' +
      'main weist Gitea ab. Ein Pull Request von platform braucht eine Freigabe. Das zweite Konto gibt ihn frei, ' +
      'erst danach führt Gitea ihn in main zusammen. Rechts holt Argo CD im k3s-Cluster main nur lesend und ' +
      'wendet die Änderung an wie bisher. Achte darauf, dass du selbst entscheidest, wer die Regel umgehen darf.',
    team: 'Plattform-Team',
    admin: ['platform', 'Administrator'],
    second: ['Zweites Konto', 'Schreibrechte'],
    git: 'Gitea',
    repo: 'wolkenwerk/platform',
    main: ['main', 'geschützter Branch'],
    pr: ['Pull Request', 'von platform, braucht eine Freigabe'],
    push: ['direkter Push', 'abgewiesen'],
    approves: 'gibt frei',
    merge: ['Merge nach', 'der Freigabe'],
    exception: 'Wer die Regel umgehen darf, entscheidest du.',
    cluster: 'k3s-Cluster',
    argo: ['Argo CD', 'liest nur'],
    pulls: 'holt',
    applies: 'wendet an',
    change: ['Änderung', 'ausgerollt'],
  },
  en: {
    title: 'The protected branch main',
    desc:
      'The target state of task C. On the left is the platform team with two accounts, your account platform, ' +
      'which is also the Gitea administrator, and a second account with write access. In the middle, Gitea ' +
      'holds the repo wolkenwerk/platform with the protected branch main. Gitea rejects a direct push from ' +
      'platform to main. A pull request from platform needs an approval. The second account approves it, and ' +
      'only then does Gitea merge it into main. On the right, Argo CD in the k3s cluster pulls main with read ' +
      'access only and applies the change as before. Notice that you decide yourself who may bypass the rule.',
    team: 'Platform team',
    admin: ['platform', 'administrator'],
    second: ['Second account', 'write access'],
    git: 'Gitea',
    repo: 'wolkenwerk/platform',
    main: ['main', 'protected branch'],
    pr: ['Pull request', 'from platform, needs an approval'],
    push: ['direct push', 'rejected'],
    approves: 'approves',
    merge: ['merge after', 'the approval'],
    exception: 'You decide who may bypass the rule.',
    cluster: 'k3s cluster',
    argo: ['Argo CD', 'read only'],
    pulls: 'pulls',
    applies: 'applies',
    change: ['Change', 'rolled out'],
  },
};

function branch(lang) {
  const t = BRANCH[lang];
  const id = `p4c6-branch-${lang}`;
  // The accounts on the left, the repo in the middle, the cluster on the right
  const team = { x: 16, w: 186 };
  const git = { x: 280, w: 272 };
  const cl = { x: 600, w: 144 };
  const rows = [56, 166];
  const mid = (row) => row + 25;
  const inner = (b) => ({ x: b.x + 16, w: b.w - 32 });
  const [tm, gt, ct] = [inner(team), inner(git), inner(cl)];
  const gap = (a, b) => (a.x + a.w + b.x) / 2;
  const mergeX = gt.x + gt.w / 2;
  const body = [
    band(team.x, 16, team.w, 246, 1),
    label(tm.x, 40, t.team),
    band(git.x, 16, git.w, 246, 2),
    heading(gt.x, 40, t.git, t.repo, { tone: 'blue' }),
    band(cl.x, 16, cl.w, 246, 3),
    label(ct.x, 40, t.cluster, 'start', { tone: 'violet' }),
    // A direct push bounces off the rule
    arrow(id, [[tm.x + tm.w, mid(rows[0])], [gt.x - 2, mid(rows[0])]], { dashed: true }),
    note(gap(tm, gt), mid(rows[0]) - 7, t.push[0], 'middle'),
    note(gap(tm, gt), mid(rows[0]) + 16, t.push[1], 'middle'),
    // The second account approves the pull request, only then does it reach main
    arrow(id, [[tm.x + tm.w, mid(rows[1])], [gt.x - 2, mid(rows[1])]], { accent: true }),
    note(gap(tm, gt), mid(rows[1]) - 7, t.approves, 'middle'),
    arrow(id, [[mergeX, rows[1]], [mergeX, rows[0] + 52]], { accent: true }),
    note(mergeX + 10, 133, t.merge[0]),
    note(mergeX + 10, 147, t.merge[1]),
    meta(gt.x, 246, t.exception),
    // Argo CD only reads main and rolls out what was merged
    arrow(id, [[ct.x, mid(rows[0])], [gt.x + gt.w + 2, mid(rows[0])]], { accent: true }),
    note(gap(gt, ct), mid(rows[0]) - 7, t.pulls, 'middle'),
    arrow(id, [[ct.x + ct.w / 2, rows[0] + 50], [ct.x + ct.w / 2, rows[1] - 2]], { accent: true }),
    note(ct.x + ct.w / 2 - 10, 140, t.applies, 'end'),
    tile(tm.x, rows[0], tm.w, 50, ...t.admin, { icon: 'user' }),
    tile(tm.x, rows[1], tm.w, 50, ...t.second, { icon: 'user' }),
    tile(gt.x, rows[0], gt.w, 50, ...t.main, { icon: 'lock', accent: true }),
    tile(gt.x, rows[1], gt.w, 50, ...t.pr, { icon: 'doc' }),
    tile(ct.x, rows[0], ct.w, 50, ...t.argo, { icon: 'sync' }),
    tile(ct.x, rows[1], ct.w, 50, ...t.change, { icon: 'container' }),
  ];
  for (const text of [...t.push, t.approves]) check(text, gt.x - tm.x - tm.w - 8);
  check(t.exception, gt.w);
  check(t.pulls, ct.x - gt.x - gt.w - 8);
  // The label sits left of the arrow and may use the padding of the band
  check(t.applies, ct.x + ct.w / 2 - 10 - cl.x - 4);
  return figure({ id, width: 760, height: 278, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(PLAN)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p4c1-plan-apply.svg'), planApply(lang));
  writeFileSync(join(dir, 'p4c2-memory.svg'), memory(lang));
  writeFileSync(join(dir, 'p4c3-cluster.svg'), cluster(lang));
  writeFileSync(join(dir, 'p4c4-gitops.svg'), gitops(lang));
  writeFileSync(join(dir, 'p4c4-app-of-apps.svg'), appOfApps(lang));
  writeFileSync(join(dir, 'p4c5-kustomize.svg'), kustomize(lang));
  writeFileSync(join(dir, 'p4c6-rebuild.svg'), rebuild(lang));
  writeFileSync(join(dir, 'p4c6-member.svg'), member(lang));
  writeFileSync(join(dir, 'p4c6-branch.svg'), branch(lang));
}
