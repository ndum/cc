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

/** Width of a line made of parts, in the sizes of their classes */
function partsWidth(parts) {
  return parts.reduce((sum, [text, cls]) => {
    if (cls === 'd-code') return sum + measure(text, SIZE.code, { mono: true });
    if (cls === 'd-title-small') return sum + measure(text, SIZE.small, { bold: true });
    return sum + measure(text, SIZE.sub);
  }, 0);
}

/** A card with a title and several centred lines below it, each line made of parts in their own classes */
function stack(x, y, w, h, title, rows) {
  const check = (text, needed) => {
    if (needed + 2 * PADDING > w) throw new Error(`"${text}" needs about ${Math.ceil(needed + 2 * PADDING)} px but has only ${w} px.`);
  };
  check(title, measure(title, SIZE.title, { bold: true }));
  rows.forEach((parts) => check(parts.map(([text]) => text).join(''), partsWidth(parts)));
  // The title line and the rows form one block, centred in the card
  const LINE = 19;
  const top = y + (h - (16 + rows.length * LINE)) / 2;
  const cx = x + w / 2;
  return [
    `<rect class="d-shadow" x="${x}" y="${y + 1.5}" width="${w}" height="${h}" rx="10"/>`,
    `<rect class="d-tile" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`,
    `<text class="d-title" x="${cx}" y="${top + 12}" text-anchor="middle">${escape(title)}</text>`,
    ...rows.map((parts, i) => mixed(cx, top + 12 + LINE * (i + 1), parts, 'middle')),
  ].join('\n');
}

/** Stops the script when an arrow label does not fit the gap it stands in */
function gap(text, available) {
  const needed = measure(text, SIZE.sub) + 4;
  if (needed > available) throw new Error(`"${text}" needs about ${Math.ceil(needed)} px but has only ${available} px between the tiles.`);
}

/** A tag that ends at the right edge, as in the corner of a band */
function tagAt(right, y, text, options) {
  return tag(right - Math.ceil(measure(text, SIZE.sub, { bold: true })) - 14, y, text, options);
}

const MEMBER = {
  de: {
    title: 'Ein fünftes Mitglied auf beiden Ebenen',
    desc:
      'Oben die Ebene OpenNebula. Dort hat das neue Mitglied eine VM für seinen Dienst, eine Quota mit Preisen ' +
      'für den Showback und eine Gruppe mit Admin in einem VDC. Darunter der Cluster k3s mit dem Namespace des ' +
      'Mitglieds, in dem seine Anwendung und seine Alert-Regel liegen. Gruppe und Namespace wissen nichts ' +
      'voneinander, nur derselbe Name verbindet sie. Du bringst einen Pull Request und Commits nach Gitea. ' +
      'Argo CD holt sie dort mit dem ApplicationSet members und rollt sie im Namespace aus. Prometheus ' +
      'überwacht die Anwendung. Löst die Regel aus, schickt Prometheus einen Alert an Alertmanager, dessen ' +
      'Route ihn als Webhook an deinen Triage-Dienst weiterleitet. Was der Dienst im Namespace des Mitglieds ' +
      'darf, legst du selbst fest. Er legt dir einen Vorschlag vor und hält deinen Entscheid in seinem Audit-Log ' +
      'fest. Den Fehler löst du über Git aus und behebst ihn auch dort.',
    one: 'OpenNebula',
    vm: ['VM des Mitglieds', 'für seinen Dienst'],
    quota: ['Quota und Preise', 'Grenze und Showback'],
    group: ['Gruppe mit Admin', 'in einem VDC'],
    same: 'derselbe Name',
    cluster: 'Cluster k3s',
    gitea: ['Gitea', 'Repo platform'],
    argo: ['Argo CD', 'ApplicationSet members'],
    namespace: ['Namespace des Mitglieds', 'Anwendung und Alert-Regel'],
    triage: ['Triage-Dienst', 'mit Audit-Log'],
    alertmanager: ['Alertmanager', 'Route zur Triage'],
    prometheus: ['Prometheus', 'Regel löst aus'],
    you: ['Du', 'Plattform-Team'],
    pulls: 'holt',
    rollout: 'rollt aus',
    watches: 'überwacht',
    alert: 'Alert',
    webhook: 'Webhook',
    proposal: 'Vorschlag',
    decision: 'Entscheid',
    rights: 'Rechte nach deiner Wahl',
    git: ['Pull Request,', 'Fehler, Behebung'],
  },
  en: {
    title: 'A fifth member on both layers',
    desc:
      'At the top the OpenNebula layer. There the new member has a VM for its service, a quota with prices for ' +
      "showback and a group with an admin in a VDC. Below it the k3s cluster with the member's namespace, which " +
      'holds its application and its alert rule. Group and namespace know nothing of each other, only the same ' +
      'name links them. You bring a pull request and commits to Gitea. Argo CD pulls them from there with the ' +
      'ApplicationSet members and rolls them out in the namespace. Prometheus watches the application. When the ' +
      'rule fires, Prometheus sends an alert to Alertmanager, whose route forwards it as a webhook to your ' +
      "triage service. You decide what the service may do in the member's namespace. It shows you a proposal " +
      'and records your decision in its audit log. You cause the fault through Git and fix it there as well.',
    one: 'OpenNebula',
    vm: ['Member VM', 'for its service'],
    quota: ['Quota and prices', 'limit and showback'],
    group: ['Group with admin', 'in a VDC'],
    same: 'same name',
    cluster: 'k3s cluster',
    gitea: ['Gitea', 'repo platform'],
    argo: ['Argo CD', 'ApplicationSet members'],
    namespace: ['Member namespace', 'application and alert rule'],
    triage: ['Triage service', 'with audit log'],
    alertmanager: ['Alertmanager', 'route to triage'],
    prometheus: ['Prometheus', 'a rule fires'],
    you: ['You', 'platform team'],
    pulls: 'pulls',
    rollout: 'rolls out',
    watches: 'watches',
    alert: 'alert',
    webhook: 'webhook',
    proposal: 'proposal',
    decision: 'decision',
    rights: 'rights of your choice',
    git: ['pull request,', 'fault, fix'],
  },
};

function member(lang) {
  const t = MEMBER[lang];
  const id = `p6c5-member-${lang}`;
  const H = 56;
  // Gitea and the person stand outside the two layers, the alert runs right to left back to the person
  const top = 52;
  const row1 = 196;
  const row2 = 316;
  const low = 436;
  const mid = (y) => y + H / 2;
  const argo = { x: 232, w: 176 };
  const ns = { x: 456, w: 292 };
  const triage = { x: 232, w: 152 };
  const am = { x: 436, w: 140 };
  const prom = { x: 612, w: 136 };
  const gitea = { x: 16, w: 152 };
  gap(t.rollout, ns.x - argo.x - argo.w);
  gap(t.webhook, am.x - triage.x - triage.w);
  gap(t.alert, prom.x - am.x - am.w);
  gap(t.rights, 520 - 360);
  const body = [
    band(16, 16, 748, 108, 2),
    label(32, 40, t.one, 'start', { tone: 'blue' }),
    band(216, 156, 548, 232, 3),
    label(232, 180, t.cluster, 'start', { tone: 'violet' }),
    // Group and namespace know nothing of each other, only the name links them
    line([[638, top + H], [638, row1 - 2]], { dashed: true }),
    note(648, 144, t.same),
    // Argo CD fetches from Gitea and applies the member folder to its namespace
    arrow(id, [[argo.x, mid(row1)], [gitea.x + gitea.w + 2, mid(row1)]], { accent: true }),
    note((gitea.x + gitea.w + argo.x) / 2, mid(row1) - 8, t.pulls, 'middle'),
    arrow(id, [[argo.x + argo.w, mid(row1)], [ns.x - 2, mid(row1)]], { accent: true }),
    note((argo.x + argo.w + ns.x) / 2, mid(row1) - 8, t.rollout, 'middle'),
    // Prometheus watches the namespace, its alert travels to the triage service
    arrow(id, [[680, row2], [680, row1 + H + 2]]),
    note(670, 290, t.watches, 'end'),
    arrow(id, [[prom.x, mid(row2)], [am.x + am.w + 2, mid(row2)]], { accent: true }),
    note((am.x + am.w + prom.x) / 2, mid(row2) - 8, t.alert, 'middle'),
    arrow(id, [[am.x, mid(row2)], [triage.x + triage.w + 2, mid(row2)]], { accent: true }),
    note((triage.x + triage.w + am.x) / 2, mid(row2) - 8, t.webhook, 'middle'),
    // What the triage service may do in the namespace is the student's decision
    arrow(id, [[360, row2], [360, 284], [520, 284], [520, row1 + H + 2]], { dashed: true }),
    note(440, 276, t.rights, 'middle'),
    // The person decides on the proposal and changes the platform only through Git
    arrow(id, [[288, row2 + H], [288, low - 2]], { accent: true }),
    note(280, 416, t.proposal, 'end'),
    arrow(id, [[328, low], [328, row2 + H + 2]], { accent: true }),
    note(336, 416, t.decision),
    arrow(id, [[triage.x, mid(low)], [92, mid(low)], [92, row1 + H + 2]], { accent: true }),
    note(102, 332, t.git[0]),
    note(102, 348, t.git[1]),
    tile(32, top, 224, H, ...t.vm, { icon: 'vm', tone: 'violet' }),
    tile(280, top, 224, H, ...t.quota, { icon: 'coin' }),
    tile(528, top, 220, H, ...t.group, { icon: 'group' }),
    tile(gitea.x, row1, gitea.w, H, ...t.gitea, { icon: 'repo' }),
    tile(argo.x, row1, argo.w, H, ...t.argo, { icon: 'sync' }),
    tile(ns.x, row1, ns.w, H, ...t.namespace, { icon: 'container', tone: 'violet' }),
    tile(triage.x, row2, triage.w, H, ...t.triage, { icon: 'cog', accent: true }),
    tile(am.x, row2, am.w, H, ...t.alertmanager, { icon: 'bell' }),
    tile(prom.x, row2, prom.w, H, ...t.prometheus, { icon: 'database' }),
    tile(triage.x, low, triage.w, H, ...t.you, { icon: 'user', accent: true }),
  ];
  return figure({ id, width: 780, height: 508, title: t.title, desc: t.desc, body });
}

const RESTORE = {
  de: {
    title: 'Wiederherstellung aus einem Snapshot und SLA',
    desc:
      'Oben das Front-end mit der Kopie der Snapshots und des Tokens in ~/backup/k3s und mit Gitea. Darunter der ' +
      'Cluster k3s. Aus der Kopie stellst du k3s-server wieder her, je nach Fehlerfall den bestehenden Server oder ' +
      'einen neuen. Danach holt Argo CD wieder Commits aus Gitea und rollt die Anwendung deines Mitglieds aus. ' +
      'Unten links deine Messung für den Fehlerfall, den du gewählt hast, auf einer Zeitachse. Start und Ende ' +
      'legst du selbst fest, dazwischen hältst du Zwischenzeiten fest. Die gemessene Zeit geht in das SLA für ' +
      'dein Mitglied ein. Darin folgt die Verfügbarkeit aus der Architektur, das RPO aus den Sicherungen und das ' +
      'RTO aus deiner Messung und den Supportzeiten.',
    fe: 'Front-end',
    copy: ['Snapshots und Token', '~/backup/k3s'],
    gitea: ['Gitea', 'Repo platform'],
    cluster: 'Cluster k3s',
    server: ['k3s-server', 'bestehend oder neu'],
    app: ['Anwendung', 'deines Mitglieds'],
    argo: ['Argo CD', 'übernimmt Commits'],
    restore: 'Wiederherstellung',
    pulls: 'holt Commits',
    rollout: 'rollt aus',
    measure: 'Deine Messung',
    failure: 'Fehlerfall nach deiner Wahl',
    start: 'Start, von dir festgelegt',
    between: 'Zwischenzeiten',
    end: 'Ende, von dir festgelegt',
    measured: 'gemessene Zeit',
    sla: 'SLA für dein Mitglied',
    parts: [
      ['Verfügbarkeit', ' aus der Architektur'],
      ['RPO', ' aus den Sicherungen'],
      ['RTO', ' aus Messung und Supportzeiten'],
    ],
  },
  en: {
    title: 'Restore from a snapshot and SLA',
    desc:
      'At the top the front-end with the copy of the snapshots and the token in ~/backup/k3s, and Gitea. Below it ' +
      'the k3s cluster. From the copy you restore k3s-server, depending on the failure case the existing server ' +
      "or a new one. Argo CD then pulls commits from Gitea again and rolls out your member's application. At the " +
      'bottom left your measurement for the failure case you chose, on a timeline. You set the start and the end ' +
      'yourself and record intermediate times in between. The measured time goes into the SLA for your member. ' +
      'In it, the availability follows from the architecture, the RPO from the backups and the RTO from your ' +
      'measurement and the support hours.',
    fe: 'Front-end',
    copy: ['Snapshots and token', '~/backup/k3s'],
    gitea: ['Gitea', 'repo platform'],
    cluster: 'k3s cluster',
    server: ['k3s-server', 'existing or new'],
    app: ['Application', 'of your member'],
    argo: ['Argo CD', 'picks up commits'],
    restore: 'restore',
    pulls: 'pulls commits',
    rollout: 'rolls out',
    measure: 'Your measurement',
    failure: 'failure case of your choice',
    start: 'start, set by you',
    between: 'intermediate times',
    end: 'end, set by you',
    measured: 'measured time',
    sla: 'SLA for your member',
    parts: [
      ['Availability', ' from the architecture'],
      ['RPO', ' from the backups'],
      ['RTO', ' from measurement and support hours'],
    ],
  },
};

function restore(lang) {
  const t = RESTORE[lang];
  const id = `p6c5-restore-${lang}`;
  const H = 56;
  const app = { x: 280, w: 200 };
  const argo = { x: 532, w: 216 };
  gap(t.rollout, argo.x - app.x - app.w);
  // The time axis of the measurement, start and end are the student's choice
  const AXIS = 356;
  const X0 = 56;
  const X1 = 436;
  const between = [176, 246, 316];
  const marker = (x, r) => [
    `<circle class="d-ground" cx="${x}" cy="${AXIS}" r="${r + 2.5}"/>`,
    `<circle class="d-fill-blue" cx="${x}" cy="${AXIS}" r="${r}"/>`,
  ];
  const body = [
    band(16, 16, 748, 104, 2),
    label(32, 40, t.fe, 'start', { tone: 'blue' }),
    band(16, 152, 748, 104, 3),
    label(32, 176, t.cluster, 'start', { tone: 'violet' }),
    // The snapshot comes from the copy on the front-end, Argo CD then fetches Git again
    arrow(id, [[144, 52 + H], [144, 186]], { accent: true }),
    note(154, 140, t.restore),
    arrow(id, [[640, 188], [640, 52 + H + 2]], { accent: true }),
    note(650, 140, t.pulls),
    arrow(id, [[argo.x, 216], [app.x + app.w + 2, 216]], { accent: true }),
    note((app.x + app.w + argo.x) / 2, 208, t.rollout, 'middle'),
    tile(32, 52, 224, H, ...t.copy, { icon: 'disk', code: true, accent: true }),
    tile(argo.x, 52, argo.w, H, ...t.gitea, { icon: 'repo' }),
    tile(32, 188, 224, H, ...t.server, { icon: 'server', tone: 'violet' }),
    tile(app.x, 188, app.w, H, ...t.app, { icon: 'container', tone: 'violet' }),
    tile(argo.x, 188, argo.w, H, ...t.argo, { icon: 'sync', tone: 'violet' }),
    // The measurement for the chosen case, without values
    band(16, 288, 460, 124, 1),
    label(32, 312, t.measure),
    tagAt(460, 298, t.failure),
    line([[X0, AXIS], [X1, AXIS]], { accent: true }),
    ...marker(X0, 4.5),
    ...between.flatMap((x) => marker(x, 3)),
    ...marker(X1, 4.5),
    note(X0 - 7, AXIS - 16, t.start),
    note(between[1], AXIS - 16, t.between, 'middle'),
    note(X1 + 7, AXIS - 16, t.end, 'end'),
    line([[X0, 376], [X0, 382], [X1, 382], [X1, 376]]),
    note((X0 + X1) / 2, 398, t.measured, 'middle'),
    // The measured time is the base of the RTO in the SLA
    arrow(id, [[X1, 382], [514, 382]], { accent: true }),
    stack(516, 288, 248, 124, t.sla, t.parts.map(([term, rest]) => [[term, 'd-title-small'], [rest, 'd-sub']])),
  ];
  return figure({ id, width: 780, height: 428, title: t.title, desc: t.desc, body });
}

const POSTMORTEM = {
  de: {
    title: 'Postmortem und Kostenmodell eines Mitglieds',
    desc:
      'Oben das Postmortem. Drei Quellen, die Zeitreihe ALERTS, das Audit-Log des Triage-Dienstes und der ' +
      'Verlauf des Plattform-Repos, ergeben ohne Modell eine nach der Zeit geordnete Zeitlinie. Mit deiner Frage ' +
      'und der Zeitlinie schreibt das lokale Modell aus Meilenstein 3 den Entwurf postmortem-entwurf.md. Du ' +
      'prüfst ihn gegen die Fakten der Zeitlinie und hältst deine Korrektur in postmortem.md fest. Unten das ' +
      'Kostenmodell. Aus den Ressourcen des Mitglieds, seiner Quota und seiner VM, leitest du über seinen Anteil ' +
      'an den Vollkosten einen Preis pro Monat ab. Die Verteilung wählst du selbst. Den Preis vergleichst du mit ' +
      'dem Showback aus OpenNebula. Aus gemessenen Requests und gemessenem Verbrauch entsteht dein Vorschlag zum ' +
      'Right-Sizing.',
    postmortem: 'Postmortem',
    sources: 'Drei Quellen',
    lines: [
      [['Zeitreihe ', 'd-sub'], ['ALERTS', 'd-code']],
      [['Audit-Log des Triage-Dienstes', 'd-sub']],
      [['Verlauf des Plattform-Repos', 'd-sub']],
    ],
    timeline: ['Zeitlinie', 'ohne Modell'],
    model: ['Lokales Modell', 'aus Meilenstein 3'],
    draft: ['Entwurf', 'des Modells', 'postmortem-entwurf.md'],
    correction: ['Korrektur', 'deine Fassung', 'postmortem.md'],
    ordered: 'geordnet',
    question: 'deine Frage',
    writes: 'schreibt',
    check: 'du prüfst',
    facts: 'Fakten',
    cost: 'Kostenmodell',
    resources: ['Ressourcen', 'Quota und VM'],
    price: ['Preis pro Monat', 'nach deiner Verteilung'],
    showback: ['Showback', 'aus OpenNebula'],
    share: ['Anteil der', 'Vollkosten'],
    compare: 'Vergleich',
    metrics: ['Messwerte', 'Requests und Verbrauch'],
    sizing: ['Right-Sizing', 'dein Vorschlag'],
  },
  en: {
    title: 'Postmortem and cost model of a member',
    desc:
      'At the top the postmortem. Three sources, the series ALERTS, the audit log of the triage service and the ' +
      'history of the platform repo, are ordered by time into a timeline without the model. With your question ' +
      'and the timeline, the local model from milestone 3 writes the draft postmortem-entwurf.md. You check it ' +
      'against the facts of the timeline and record your correction in postmortem.md. At the bottom the cost ' +
      "model. From the member's resources, its quota and its VM, you derive a monthly price through its share of " +
      'the full cost, with a split of your choice. You compare the price with the showback from OpenNebula. ' +
      'Measured requests and measured use lead to your right-sizing proposal.',
    postmortem: 'Postmortem',
    sources: 'Three sources',
    lines: [
      [['series ', 'd-sub'], ['ALERTS', 'd-code']],
      [['audit log of the triage service', 'd-sub']],
      [['history of the platform repo', 'd-sub']],
    ],
    timeline: ['Timeline', 'without the model'],
    model: ['Local model', 'from milestone 3'],
    draft: ['Draft', 'by the model', 'postmortem-entwurf.md'],
    correction: ['Correction', 'your version', 'postmortem.md'],
    ordered: 'ordered',
    question: 'question',
    writes: 'writes',
    check: 'you check',
    facts: 'facts',
    cost: 'Cost model',
    resources: ['Resources', 'quota and VM'],
    price: ['Monthly price', 'split of your choice'],
    showback: ['Showback', 'from OpenNebula'],
    share: ['share of the', 'full cost'],
    compare: 'comparison',
    metrics: ['Measurements', 'requests and use'],
    sizing: ['Right-sizing', 'your proposal'],
  },
};

function postmortem(lang) {
  const t = POSTMORTEM[lang];
  const id = `p6c5-postmortem-${lang}`;
  const H = 56;
  // Three columns in both bands, the postmortem turns down on the right and back to the middle
  const W = 192;
  const col = [32, 294, 556];
  const gapX = col[1] - col[0] - W;
  [t.ordered, t.question, t.check, t.compare, ...t.share].forEach((text) => gap(text, gapX));
  const right = (i) => col[i] + W;
  const centre = (i) => col[i] + W / 2;
  const body = [
    band(16, 16, 748, 248, 1),
    label(32, 40, t.postmortem),
    // The facts come from the data, the model only writes the text around them
    arrow(id, [[right(0), 100], [col[1] - 2, 100]], { accent: true }),
    note((right(0) + col[1]) / 2, 92, t.ordered, 'middle'),
    arrow(id, [[right(1), 100], [col[2] - 2, 100]], { accent: true }),
    note((right(1) + col[2]) / 2, 92, t.question, 'middle'),
    arrow(id, [[centre(2), 128], [centre(2), 182]], { accent: true }),
    note(centre(2) + 10, 160, t.writes),
    arrow(id, [[col[2], 216], [right(1) + 2, 216]], { accent: true }),
    note((right(1) + col[2]) / 2, 208, t.check, 'middle'),
    arrow(id, [[centre(1), 128], [centre(1), 182]], { dashed: true }),
    note(centre(1) + 10, 160, t.facts),
    stack(col[0], 52, W, 96, t.sources, t.lines),
    tile(col[1], 72, W, H, ...t.timeline, { icon: 'clock', accent: true }),
    tile(col[2], 72, W, H, ...t.model, { icon: 'model' }),
    tile(col[1], 184, W, 64, t.correction[0], t.correction[1], { detail: t.correction[2], icon: 'doc', accent: true }),
    tile(col[2], 184, W, 64, t.draft[0], t.draft[1], { detail: t.draft[2], icon: 'doc' }),
    band(16, 296, 748, 180, 1),
    label(32, 320, t.cost),
    // The price follows from a share of the full cost, showback is the comparison
    arrow(id, [[right(0), 360], [col[1] - 2, 360]], { accent: true }),
    note((right(0) + col[1]) / 2, 338, t.share[0], 'middle'),
    note((right(0) + col[1]) / 2, 352, t.share[1], 'middle'),
    line([[right(1), 360], [col[2], 360]], { dashed: true }),
    note((right(1) + col[2]) / 2, 352, t.compare, 'middle'),
    arrow(id, [[right(0), 432], [col[1] - 2, 432]], { accent: true }),
    tile(col[0], 332, W, H, ...t.resources, { icon: 'vm' }),
    tile(col[1], 332, W, H, ...t.price, { icon: 'coin', accent: true }),
    tile(col[2], 332, W, H, ...t.showback, { icon: 'chart' }),
    tile(col[0], 404, W, H, ...t.metrics, { icon: 'database' }),
    tile(col[1], 404, W, H, ...t.sizing, { icon: 'sync', accent: true }),
  ];
  return figure({ id, width: 780, height: 492, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(BACKUP)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p6c1-security.svg'), security(lang));
  writeFileSync(join(dir, 'p6c2-backup.svg'), backup(lang));
  writeFileSync(join(dir, 'p6c3-incident.svg'), incident(lang));
  writeFileSync(join(dir, 'p6c4-cost.svg'), cost(lang));
  writeFileSync(join(dir, 'p6c5-member.svg'), member(lang));
  writeFileSync(join(dir, 'p6c5-restore.svg'), restore(lang));
  writeFileSync(join(dir, 'p6c5-postmortem.svg'), postmortem(lang));
}
