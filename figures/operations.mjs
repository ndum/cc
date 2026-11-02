/**
 * Figures of part 6, operations. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/operations.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, escape, figure, label, line, measure, meta, note, PADDING, SIZE, tag, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** One line of text with parts in different classes, such as an amount in bold and a share */
function mixed(x, y, parts, anchor = 'start') {
  const spans = parts.map(([text, cls]) => `<tspan class="${cls}">${escape(text)}</tspan>`).join('');
  return `<text class="d-sub" x="${x}" y="${y}" text-anchor="${anchor}">${spans}</text>`;
}

/** A card with a centred title and two lines below it, stops the script when a text does not fit */
function card(x, y, w, h, title, lines) {
  const check = (text, size, bold = false) => {
    const needed = measure(text, size, { bold }) + 2 * PADDING;
    if (needed > w) throw new Error(`"${text}" needs about ${Math.ceil(needed)} px but has only ${w} px.`);
  };
  check(title, SIZE.title, true);
  lines.forEach(([text, code]) => check(text, code ? SIZE.code : SIZE.sub));
  const cx = x + w / 2;
  return [
    `<rect class="d-shadow" x="${x}" y="${y + 1.5}" width="${w}" height="${h}" rx="10"/>`,
    `<rect class="d-tile" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`,
    `<text class="d-title" x="${cx}" y="${y + h / 2 - 10}" text-anchor="middle">${escape(title)}</text>`,
    ...lines.map(
      ([text, code], i) =>
        `<text class="${code ? 'd-code' : 'd-sub'}" x="${cx}" y="${y + h / 2 + 5 + i * 15}" text-anchor="middle">${escape(text)}</text>`,
    ),
  ].join('\n');
}

/** A card drawn only as a dashed outline, for something that is missing */
function missing(x, y, w, h, title, sub) {
  const check = (text, size, bold = false) => {
    const needed = measure(text, size, { bold }) + 2 * PADDING;
    if (needed > w) throw new Error(`"${text}" needs about ${Math.ceil(needed)} px but has only ${w} px.`);
  };
  check(title, SIZE.title, true);
  check(sub, SIZE.sub);
  return [
    `<rect class="d-strip" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`,
    `<text class="d-title" x="${x + w / 2}" y="${y + h / 2 - 3}" text-anchor="middle">${escape(title)}</text>`,
    `<text class="d-sub" x="${x + w / 2}" y="${y + h / 2 + 13}" text-anchor="middle">${escape(sub)}</text>`,
  ].join('\n');
}

const BACKUP = {
  de: {
    title: 'Wo die Daten liegen und wie sie gesichert sind',
    desc:
      'Links der Cluster k3s und die Knoten. Auf k3s-server schreibt etcd alle sechs Stunden einen Snapshot ' +
      'und behält acht davon. Ein Timer kopiert die Snapshots alle sechs Stunden nach ~/backup/k3s auf dem ' +
      'Front-end, zusammen mit dem Token von k3s und dem Schlüssel von Sealed Secrets. Die Volumes auf ' +
      'k3s-agent mit Metriken und Logs sind nicht gesichert. Die VMs der Mitglieder liegen in den Datastores ' +
      'der Knoten. Ein Backup-Job sichert sie jede Nacht um 2 Uhr in den Backup-Datastore backups auf dem ' +
      'Front-end und behält sieben Backups. Auf dem Front-end liegen auch das Repo platform in Gitea und die ' +
      'Arbeitskopie ~/platform mit dem State von OpenTofu. Eine Kopie ausser Haus fehlt, darum verletzt das ' +
      'Lab die Regel 3-2-1. Fällt das Front-end aus, ist alles zugleich weg.',
    cluster: 'Cluster k3s',
    etcd: ['etcd auf k3s-server', 'Snapshot alle 6 h, 8 bleiben'],
    volumes: ['Volumes', 'auf k3s-agent, nicht gesichert'],
    nodes: 'Knoten 1 und 2',
    vms: ['VMs der Mitglieder', 'Datastores der Knoten'],
    fe: 'Front-end',
    k3s: ['Snapshots, Token, Schlüssel', '~/backup/k3s', true],
    gitea: ['Gitea', 'Repo platform, Port 3000', false],
    platform: ['Arbeitskopie, State', '~/platform', true],
    datastore: ['Backup-Datastore', 'sieben Backups je VM', false],
    timer: ['Timer', 'alle 6 h'],
    job: ['Job', 'um 2 Uhr'],
    offsite: ['Kopie ausser Haus', 'fehlt für 3-2-1'],
    loss: ['Fällt das Front-end aus,', 'ist alles zugleich weg.'],
  },
  en: {
    title: 'Where the data lives and how it is backed up',
    desc:
      'On the left the k3s cluster and the nodes. On k3s-server, etcd writes a snapshot every six hours and ' +
      'keeps eight of them. A timer copies the snapshots to ~/backup/k3s on the front-end every six hours, ' +
      'together with the k3s token and the Sealed Secrets key. The volumes on k3s-agent with metrics and logs ' +
      'are not backed up. The member VMs live in the datastores of the nodes, and a backup job backs them up ' +
      'every night at 2:00 to the backup datastore backups on the front-end and keeps seven backups. The ' +
      'front-end also holds the repo platform in Gitea and the working copy ~/platform with the OpenTofu ' +
      'state. An off-site copy is missing, so the lab breaks the 3-2-1 rule. If the front-end fails, ' +
      'everything is gone at once.',
    cluster: 'k3s cluster',
    etcd: ['etcd on k3s-server', 'snapshot every 6 h, keeps 8'],
    volumes: ['Volumes', 'on k3s-agent, not backed up'],
    nodes: 'Nodes 1 and 2',
    vms: ['Member VMs', 'datastores of the nodes'],
    fe: 'Front-end',
    k3s: ['Snapshots, token, key', '~/backup/k3s', true],
    gitea: ['Gitea', 'repo platform, port 3000', false],
    platform: ['Working copy, state', '~/platform', true],
    datastore: ['Backup datastore', 'seven backups per VM', false],
    timer: ['timer', 'every 6 h'],
    job: ['job', 'at 2:00'],
    offsite: ['Off-site copy', 'missing for 3-2-1'],
    loss: ['If the front-end fails,', 'everything is gone at once.'],
  },
};

function backup(lang) {
  const t = BACKUP[lang];
  const id = `p6c2-backup-${lang}`;
  const H = 56;
  const rows = [52, 132, 212, 292];
  const fe = [t.k3s, t.gitea, t.platform, t.datastore];
  const icons = ['disk', 'repo', 'doc', 'database'];
  const body = [
    band(16, 16, 236, 188, 3),
    label(32, 40, t.cluster, 'start', { tone: 'violet' }),
    band(16, 256, 236, 108, 2),
    label(32, 280, t.nodes, 'start', { tone: 'blue' }),
    band(316, 16, 272, 348, 2),
    label(332, 40, t.fe, 'start', { tone: 'blue' }),
    // Snapshots on the server do not help when the server is lost, so a timer copies them away
    arrow(id, [[236, 80], [330, 80]], { accent: true }),
    note(284, 58, t.timer[0], 'middle'),
    note(284, 72, t.timer[1], 'middle'),
    arrow(id, [[236, 320], [330, 320]], { accent: true }),
    note(284, 298, t.job[0], 'middle'),
    note(284, 312, t.job[1], 'middle'),
    // The third copy of 3-2-1 does not exist yet, the dashed link marks the gap
    line([[588, 190], [612, 190]], { dashed: true }),
    missing(612, 162, 152, H, ...t.offsite),
    tile(32, 52, 204, H, ...t.etcd, { icon: 'database', tone: 'violet' }),
    tile(32, 132, 204, H, ...t.volumes, { icon: 'disk', tone: 'violet' }),
    tile(32, 292, 204, H, ...t.vms, { icon: 'vm', tone: 'violet' }),
    ...fe.map(([name, sub, code], i) => tile(332, rows[i], 240, H, name, sub, { icon: icons[i], code, accent: i === 0 || i === 3 })),
    note(688, 246, t.loss[0], 'middle'),
    note(688, 262, t.loss[1], 'middle'),
  ];
  return figure({ id, width: 780, height: 380, title: t.title, desc: t.desc, body });
}

const SECURITY = {
  de: {
    title: 'Die Schutzschichten von Front-end und Cluster',
    desc:
      'In der Mitte das Front-end. Seine Firewall, die Tabelle cc_firewall von nftables, weist alles ab, ' +
      'was sie nicht ausdrücklich erlaubt. Der Client und andere Rechner erreichen nur SSH auf Port 22 und ' +
      'die Weboberfläche auf Port 2616. SSH nimmt nur Schlüssel an und lässt root nicht direkt herein. Die ' +
      'Knoten und cc-net erreichen alles, auch Gitea auf Port 3000, die API auf Port 2633 und die Exporter ' +
      'auf den Ports 9100 und 9925. Jeden Tag installiert unattended-upgrades die Sicherheitsupdates. Rechts ' +
      'der Cluster. Pod Security Admission verlangt in den Namespaces der Mitglieder das Profil restricted. ' +
      'NetworkPolicies trennen die Mitglieder, Prometheus darf in allen Namespaces nur lesen. Ein ' +
      'SealedSecret kommt verschlüsselt aus Gitea, nur der Controller von Sealed Secrets in kube-system kann ' +
      'es mit seinem Schlüssel entschlüsseln.',
    outside: ['Client, andere Rechner', 'ausserhalb der Cloud'],
    inside: ['Knoten, cc-net', 'Knoten 1, 2 und VMs'],
    all: 'alles',
    fe: 'Front-end',
    firewall: 'Firewall cc_firewall',
    feTiles: [
      ['SSH, Port 22', 'nur Schlüssel, kein root', 'lock'],
      ['Weboberfläche', 'Port 2616', 'globe'],
      ['Gitea, API, Exporter', '3000, 2633, 9100, 9925', 'repo', true],
      ['unattended-upgrades', 'Sicherheitsupdates täglich', 'sync'],
    ],
    cluster: 'Cluster k3s',
    clusterTiles: [
      ['Pod Security', 'Profil restricted', 'shield'],
      ['NetworkPolicy', 'trennt die Mitglieder', 'network'],
      ['Sealed Secrets', 'Schlüssel im Controller', 'lock'],
      ['Prometheus', 'liest nur, alle Namespaces', 'database'],
    ],
    sealed: 'versiegelt',
  },
  en: {
    title: 'The protection layers of front-end and cluster',
    desc:
      'In the middle the front-end. Its firewall, the nftables table cc_firewall, drops everything it does ' +
      'not explicitly allow. The client and other hosts reach only SSH on port 22 and the web interface on ' +
      'port 2616, and SSH accepts only keys and does not let root log in directly. The nodes and cc-net reach ' +
      'everything, including Gitea on port 3000, the API on port 2633 and the exporters on ports 9100 and ' +
      '9925. Every day, unattended-upgrades installs security updates. On the right the cluster. Pod Security ' +
      'Admission enforces the profile restricted in the member namespaces, NetworkPolicies separate the ' +
      'members, and Prometheus may only read, in all namespaces. A SealedSecret comes encrypted from Gitea, ' +
      'and only the Sealed Secrets controller in kube-system can decrypt it with its key.',
    outside: ['Client, other hosts', 'outside the cloud'],
    inside: ['Nodes, cc-net', 'nodes 1, 2 and VMs'],
    all: 'all',
    fe: 'Front-end',
    firewall: 'firewall cc_firewall',
    feTiles: [
      ['SSH, port 22', 'keys only, no root', 'lock'],
      ['Web interface', 'port 2616', 'globe'],
      ['Gitea, API, exporters', '3000, 2633, 9100, 9925', 'repo', true],
      ['unattended-upgrades', 'security updates every day', 'sync'],
    ],
    cluster: 'k3s cluster',
    clusterTiles: [
      ['Pod Security', 'profile restricted', 'shield'],
      ['NetworkPolicy', 'separates members', 'network'],
      ['Sealed Secrets', 'key in the controller', 'lock'],
      ['Prometheus', 'read only, all namespaces', 'database'],
    ],
    sealed: 'sealed',
  },
};

function security(lang) {
  const t = SECURITY[lang];
  const id = `p6c1-security-${lang}`;
  const H = 56;
  const rows = [60, 140, 220, 300];
  const mid = (i) => rows[i] + H / 2;
  const tagW = Math.ceil(measure(t.firewall, SIZE.sub, { bold: true })) + 14;
  const body = [
    band(228, 16, 244, 356, 2),
    label(244, 40, t.fe, 'start', { tone: 'blue' }),
    tag(472 - 16 - tagW, 26, t.firewall),
    band(540, 16, 224, 356, 3),
    label(556, 40, t.cluster, 'start', { tone: 'violet' }),
    // The firewall stands in front of every service of the front-end, drawn as the blue line they are reached through
    line([[242, 56], [242, 360]], { accent: true }),
    // Other hosts reach only SSH and the web interface
    line([[188, 128], [208, 128]], { accent: true }),
    line([[208, mid(0)], [208, mid(1)]], { accent: true }),
    arrow(id, [[208, mid(0)], [254, mid(0)]], { accent: true }),
    arrow(id, [[208, mid(1)], [254, mid(1)]], { accent: true }),
    // The nodes and cc-net reach every port
    arrow(id, [[188, mid(2)], [254, mid(2)]], { accent: true }),
    note(215, mid(2) - 8, t.all, 'middle'),
    // A SealedSecret travels from Gitea through Argo CD into the cluster
    arrow(id, [[456, mid(2)], [554, mid(2)]]),
    note(506, mid(2) - 8, t.sealed, 'middle'),
    tile(16, 100, 172, H, ...t.outside),
    tile(16, 220, 172, H, ...t.inside),
    ...t.feTiles.map(([name, sub, icon, code], i) => tile(256, rows[i], 200, H, name, sub, { icon, code, accent: i === 0 })),
    ...t.clusterTiles.map(([name, sub, icon], i) => tile(556, rows[i], 192, H, name, sub, { icon, tone: 'violet' })),
  ];
  return figure({ id, width: 780, height: 388, title: t.title, desc: t.desc, body });
}

const INCIDENT = {
  de: {
    title: 'Die Zeitlinie einer Störung',
    desc:
      'Eine Störung auf einer Zeitachse in fünf Phasen. Nach ihrem Beginn erkennt Prometheus die Störung ' +
      'und schickt einen Alert. Danach ordnet das Team die Störung mit den Logs in Loki und den letzten ' +
      'Commits in Git ein. Es behebt sie mit git revert, das Argo CD ausrollt, bis der Dienst wieder läuft. ' +
      'Dann informiert es die betroffenen Mitglieder und schreibt später ein Postmortem ohne ' +
      'Schuldzuweisung mit Zeitlinie und Massnahmen. Unter der Achse stehen die Zeit bis zum Alert und die ' +
      'Zeit bis zur Wiederherstellung. Der Mittelwert der Zeit bis zur Wiederherstellung über viele ' +
      'Störungen ist die MTTR.',
    phases: [
      ['Erkennen', [['Alert aus', false], ['Prometheus', false]]],
      ['Einordnen', [['Logs in Loki,', false], ['Commits in Git', false]]],
      ['Beheben', [['git revert,', true], ['Argo CD rollt aus', false]]],
      ['Informieren', [['betroffene', false], ['Mitglieder', false]]],
      ['Postmortem', [['ohne Schuldzuweisung', false], ['Zeitlinie, Massnahmen', false]]],
    ],
    events: ['Störung beginnt', 'Alert', 'Ursache gefunden', 'Dienst läuft wieder'],
    later: 'später',
    toAlert: 'Zeit bis zum Alert',
    toRestore: 'Zeit bis zur Wiederherstellung',
    mttr: [['MTTR', 'd-title-small'], [', ihr Mittelwert über viele Störungen', 'd-sub']],
  },
  en: {
    title: 'The timeline of an incident',
    desc:
      'An incident on a timeline in five phases. After the incident starts, Prometheus detects it and sends ' +
      'an alert. The team then assesses the incident with the logs in Loki and the latest commits ' +
      'in Git and fixes it with git revert, which Argo CD rolls out, until the service runs again. It then ' +
      'informs the affected members and later writes a blameless postmortem with a timeline and measures. ' +
      'Below the axis are the time to the alert and the time to restore. The mean of the time to restore ' +
      'over many incidents is the MTTR.',
    phases: [
      ['Detect', [['alert from', false], ['Prometheus', false]]],
      ['Assess', [['logs in Loki,', false], ['commits in Git', false]]],
      ['Fix', [['git revert,', true], ['Argo CD rolls out', false]]],
      ['Inform', [['the affected', false], ['members', false]]],
      ['Postmortem', [['blameless', false], ['timeline, measures', false]]],
    ],
    events: ['incident starts', 'alert', 'cause found', 'service restored'],
    later: 'later',
    toAlert: 'time to the alert',
    toRestore: 'time to restore',
    mttr: [['MTTR', 'd-title-small'], [', its mean over many incidents', 'd-sub']],
  },
};

function incident(lang) {
  const t = INCIDENT[lang];
  const id = `p6c3-incident-${lang}`;
  // Phases between the events, each 144 px of time, the postmortem follows after a gap
  const B = [24, 168, 312, 456, 590];
  const AXIS = 132;
  const body = [];
  B.forEach((x) => body.push(`<path class="d-grid" d="M ${x} 16 V ${AXIS}"/>`));
  t.phases.slice(0, 4).forEach(([title, lines], i) => body.push(card(B[i] + 12, 24, B[i + 1] - B[i] - 24, 72, title, lines)));
  body.push(card(620, 24, 144, 72, ...t.phases[4]));
  // The time axis, blue while the service is down
  body.push(line([[B[0], AXIS], [B[3], AXIS]], { accent: true }));
  body.push(line([[B[3], AXIS], [B[4], AXIS]]));
  body.push(line([[B[4], AXIS], [620, AXIS]], { dashed: true }));
  body.push(arrow(id, [[620, AXIS], [762, AXIS]]));
  body.push(note(605, AXIS + 20, t.later, 'middle'));
  B.slice(0, 4).forEach((x, i) => {
    body.push(`<circle class="d-ground" cx="${x}" cy="${AXIS}" r="7"/>`);
    body.push(`<circle class="d-fill-blue" cx="${x}" cy="${AXIS}" r="4.5"/>`);
    body.push(note(i === 0 ? x - 4 : x, AXIS + 20, t.events[i], i === 0 ? 'start' : 'middle'));
  });
  // The two durations below the axis
  const bracket = (x1, x2, y) => line([[x1, y - 6], [x1, y], [x2, y], [x2, y - 6]]);
  body.push(bracket(B[0], B[1], 178));
  body.push(note((B[0] + B[1]) / 2, 194, t.toAlert, 'middle'));
  body.push(bracket(B[0], B[3], 222));
  body.push(note((B[0] + B[3]) / 2, 238, t.toRestore, 'middle'));
  body.push(mixed((B[0] + B[3]) / 2, 255, t.mttr, 'middle'));
  return figure({ id, width: 780, height: 272, title: t.title, desc: t.desc, body });
}

const COST = {
  de: {
    title: 'Die Vollkosten von Wolkenwerk pro Jahr',
    desc:
      'Waagrechte Balken für die vier Posten der Vollkostenrechnung, nach Grösse sortiert. Die Arbeit kostet ' +
      '13’000 Franken im Jahr, die Hardware 1’800, die übrigen Posten 1’500 und der Strom 828 Franken. ' +
      'Zusammen sind es 17’128 Franken. Die Arbeit macht drei Viertel der Kosten aus, der Strom keine 5 %.',
    items: [
      ['Arbeit', 13000, '13’000 Franken', '75,9 %', '10 % einer Vollzeitstelle zu 130’000 Franken mit Sozialabgaben'],
      ['Hardware', 1800, '1’800 Franken', '10,5 %', 'zwei Knoten für 7’000 und ein Front-end für 2’000 Franken, fünf Jahre'],
      ['Übriges', 1500, '1’500 Franken', '8,8 %', 'Internet, Platz im Rack, Kopie der Backups ausser Haus'],
      ['Strom', 828, '828 Franken', '4,8 %', 'durchschnittlich 300 Watt, 2’628 kWh zu 31,5 Rappen'],
    ],
    total: 'Total',
    sum: '17’128 Franken pro Jahr',
  },
  en: {
    title: "Wolkenwerk's full cost per year",
    desc:
      'Horizontal bars for the four items of the full cost calculation, sorted by size. Labor costs 13,000 ' +
      'francs a year, hardware 1,800, other items 1,500 and power 828 francs, 17,128 francs in total. Labor ' +
      'makes up three quarters of the cost, power less than 5%.',
    items: [
      ['Labor', 13000, '13,000 francs', '75.9%', '10% of a full-time position at 130,000 francs including social charges'],
      ['Hardware', 1800, '1,800 francs', '10.5%', 'two nodes for 7,000 and a front-end for 2,000 francs, five years'],
      ['Other', 1500, '1,500 francs', '8.8%', 'internet, rack space, offsite copy of the backups'],
      ['Power', 828, '828 francs', '4.8%', '300 watts on average, 2,628 kWh at 31.5 centimes'],
    ],
    total: 'Total',
    sum: '17,128 francs per year',
  },
};

function cost(lang) {
  const t = COST[lang];
  const id = `p6c4-cost-${lang}`;
  const X0 = 136;
  const SCALE = 440 / 13000;
  const body = [];
  t.items.forEach(([name, value, amount, share, assumption], i) => {
    const y = 28 + i * 64;
    const w = value * SCALE;
    body.push(`<text class="d-title" x="32" y="${y + 15}">${escape(name)}</text>`);
    body.push(`<rect class="d-fill-blue" x="${X0}" y="${y}" width="${w.toFixed(1)}" height="20" rx="3"/>`);
    body.push(mixed(X0 + w + 10, y + 15, [[amount, 'd-title-small'], [`, ${share}`, 'd-sub']]));
    body.push(meta(X0, y + 38, assumption));
  });
  body.push(`<path class="d-axis" d="M 32 ${28 + 4 * 64 - 8} H 728"/>`);
  body.push(`<text class="d-title" x="32" y="${28 + 4 * 64 + 18}">${escape(t.total)}</text>`);
  body.push(`<text class="d-title" x="${X0}" y="${28 + 4 * 64 + 18}">${escape(t.sum)}</text>`);
  return figure({ id, width: 760, height: 332, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(BACKUP)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p6c1-security.svg'), security(lang));
  writeFileSync(join(dir, 'p6c2-backup.svg'), backup(lang));
  writeFileSync(join(dir, 'p6c3-incident.svg'), incident(lang));
  writeFileSync(join(dir, 'p6c4-cost.svg'), cost(lang));
}
