/**
 * Figures of part 6, operations. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/operations.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, figure, label, line, meta, note, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const BACKUP = {
  de: {
    title: 'Wo die Daten liegen und wie sie gesichert sind',
    desc:
      'Links der Cluster k3s und die Knoten. etcd auf k3s-server schreibt alle sechs Stunden einen Snapshot ' +
      'und behält acht davon. Ein Timer kopiert die Snapshots alle sechs Stunden nach ~/backup/k3s auf dem ' +
      'Front-end, zusammen mit dem Token von k3s und dem Schlüssel von Sealed Secrets. Die Volumes auf ' +
      'k3s-agent mit Metriken, Logs und Audit-Log sind nicht gesichert. Die VMs der Mitglieder liegen in den ' +
      'Datastores der Knoten, ein Backup-Job sichert sie jede Nacht um 2 Uhr in den Backup-Datastore backups ' +
      'auf dem Front-end und behält sieben Backups. Auf dem Front-end liegen auch das Repo platform in Gitea ' +
      'und die Arbeitskopie ~/platform mit dem State von OpenTofu. Eine Kopie ausser Haus fehlt, darum ' +
      'verletzt das Lab die Regel 3-2-1. Fällt das Front-end aus, ist alles zugleich weg.',
    cluster: 'Cluster k3s',
    etcd: ['etcd auf k3s-server', 'Snapshot alle 6 h, 8 bleiben'],
    volumes: ['Volumes auf k3s-agent', 'nicht gesichert'],
    nodes: 'Knoten 1 und 2',
    vms: ['VMs der Mitglieder', 'Datastores der Knoten'],
    fe: 'Front-end',
    gitea: ['Gitea', 'Repo platform, Port 3000'],
    platform: ['~/platform', 'Arbeitskopie und State von OpenTofu'],
    k3s: ['~/backup/k3s', 'Snapshots, Token, Schlüssel'],
    datastore: ['Backup-Datastore backups', 'rsync, sieben Backups je VM'],
    timer: 'Timer alle 6 h',
    job: 'Backup-Job 2 Uhr',
    offsite: ['Kopie ausser Haus', 'fehlt für 3-2-1'],
    loss: ['Fällt das Front-end aus,', 'ist alles zugleich weg.'],
  },
  en: {
    title: 'Where the data lives and how it is backed up',
    desc:
      'On the left the k3s cluster and the nodes. etcd on k3s-server writes a snapshot every six hours and ' +
      'keeps eight of them. A timer copies the snapshots to ~/backup/k3s on the front-end every six hours, ' +
      'together with the k3s token and the Sealed Secrets key. The volumes on k3s-agent with metrics, logs ' +
      'and the audit log are not backed up. The member VMs live in the datastores of the nodes, and a backup ' +
      'job backs them up every night at 2:00 to the backup datastore backups on the front-end and keeps ' +
      'seven backups. The front-end also holds the repo platform in Gitea and the working copy ~/platform ' +
      'with the OpenTofu state. An off-site copy is missing, so the lab breaks the 3-2-1 rule. If the ' +
      'front-end fails, everything is gone at once.',
    cluster: 'k3s cluster',
    etcd: ['etcd on k3s-server', 'snapshot every 6 h, keeps 8'],
    volumes: ['Volumes on k3s-agent', 'not backed up'],
    nodes: 'Nodes 1 and 2',
    vms: ['Member VMs', 'datastores of the nodes'],
    fe: 'Front-end',
    gitea: ['Gitea', 'repo platform, port 3000'],
    platform: ['~/platform', 'working copy and OpenTofu state'],
    k3s: ['~/backup/k3s', 'snapshots, token, key'],
    datastore: ['Backup datastore backups', 'rsync, seven backups per VM'],
    timer: 'timer every 6 h',
    job: 'backup job 2:00',
    offsite: ['Off-site copy', 'missing for 3-2-1'],
    loss: ['If the front-end fails,', 'everything is gone at once.'],
  },
};

function backup(lang) {
  const t = BACKUP[lang];
  const id = `p6c2-backup-${lang}`;
  const feY = [52, 112, 172, 232];
  const body = [
    band(16, 16, 220, 160, 2),
    label(32, 40, t.cluster),
    tile(32, 52, 188, 50, ...t.etcd, { accent: true }),
    tile(32, 112, 188, 50, ...t.volumes),
    band(16, 196, 220, 100, 2),
    label(32, 220, t.nodes),
    tile(32, 232, 188, 50, ...t.vms),
    band(340, 16, 340, 280, 1),
    label(356, 40, t.fe),
    tile(356, feY[0], 308, 50, ...t.gitea),
    tile(356, feY[1], 308, 50, ...t.platform),
    tile(356, feY[2], 308, 50, ...t.k3s, { accent: true }),
    tile(356, feY[3], 308, 50, ...t.datastore, { accent: true }),
    // Snapshots on the server do not help when the server is lost, so a timer copies them away
    arrow(id, [[220, 77], [300, 77], [300, 197], [354, 197]]),
    note(288, 69, t.timer, 'middle'),
    arrow(id, [[220, 257], [354, 257]]),
    note(288, 249, t.job, 'middle'),
    // The third copy of 3-2-1 does not exist yet, the dashed link marks the gap
    line([[680, 156], [716, 156]], { dashed: true, accent: true }),
    tile(716, 128, 168, 56, ...t.offsite),
    note(800, 212, t.loss[0], 'middle'),
    note(800, 228, t.loss[1], 'middle'),
  ];
  return figure({ id, width: 900, height: 312, title: t.title, desc: t.desc, body });
}

const SECURITY = {
  de: {
    title: 'Die Schutzschichten von Front-end und Cluster',
    desc:
      'In der Mitte das Front-end. Seine Firewall, die Tabelle cc_firewall von nftables, weist alles ab, ' +
      'was sie nicht ausdrücklich erlaubt. Andere Rechner erreichen nur SSH auf Port 22 und die ' +
      'Weboberfläche auf Port 2616, SSH nimmt nur Schlüssel an und lässt root nicht direkt herein. Die ' +
      'Knoten und cc-net erreichen alles, auch Gitea auf Port 3000, die API auf Port 2633 und die Exporter ' +
      'auf den Ports 9100 und 9925. unattended-upgrades installiert jeden Tag Sicherheitsupdates. Rechts ' +
      'der Cluster. Pod Security Admission verlangt in den Namespaces der Mitglieder das Profil restricted, ' +
      'NetworkPolicies trennen die Mitglieder, und der Triage-Dienst darf nur get und patch auf Deployments ' +
      'in velo. Ein SealedSecret kommt verschlüsselt aus Gitea, nur der Controller von Sealed Secrets in ' +
      'kube-system kann es entschlüsseln.',
    outside: ['Andere Rechner', 'ausserhalb des Labs'],
    inside: ['Knoten, cc-net', 'Knoten 1, 2 und VMs'],
    all: 'alles',
    fe: 'Front-end',
    firewall: 'Firewall cc_firewall, sonst gesperrt',
    feTiles: [
      ['SSH', 'Port 22, nur Schlüssel, kein root'],
      ['Weboberfläche', 'Port 2616'],
      ['Gitea, API, Exporter', 'Ports 3000, 2633, 9100, 9925'],
      ['unattended-upgrades', 'Sicherheitsupdates täglich'],
    ],
    cluster: 'Cluster k3s',
    clusterTiles: [
      ['Pod Security', 'Profil restricted je Mitglied'],
      ['NetworkPolicy', 'trennt die Mitglieder'],
      ['Sealed Secrets', 'Controller in kube-system'],
      ['Triage-Dienst', 'nur get, patch in velo'],
    ],
    sealed: 'SealedSecret',
  },
  en: {
    title: 'The protection layers of front-end and cluster',
    desc:
      'In the middle the front-end. Its firewall, the nftables table cc_firewall, drops everything it does ' +
      'not explicitly allow. Other hosts reach only SSH on port 22 and the web interface on port 2616, and ' +
      'SSH accepts only keys and does not let root log in directly. The nodes and cc-net reach everything, ' +
      'including Gitea on port 3000, the API on port 2633 and the exporters on ports 9100 and 9925. ' +
      'unattended-upgrades installs security updates every day. On the right the cluster. Pod Security ' +
      'Admission enforces the profile restricted in the member namespaces, NetworkPolicies separate the ' +
      'members, and the triage service may only get and patch deployments in velo. A SealedSecret comes ' +
      'encrypted from Gitea, and only the Sealed Secrets controller in kube-system can decrypt it.',
    outside: ['Other hosts', 'outside the lab'],
    inside: ['Nodes, cc-net', 'nodes 1, 2 and VMs'],
    all: 'all',
    fe: 'Front-end',
    firewall: 'firewall cc_firewall, rest dropped',
    feTiles: [
      ['SSH', 'port 22, keys only, no root'],
      ['Web interface', 'port 2616'],
      ['Gitea, API, exporters', 'ports 3000, 2633, 9100, 9925'],
      ['unattended-upgrades', 'security updates every day'],
    ],
    cluster: 'k3s cluster',
    clusterTiles: [
      ['Pod Security', 'profile restricted per member'],
      ['NetworkPolicy', 'separates the members'],
      ['Sealed Secrets', 'controller in kube-system'],
      ['Triage service', 'only get, patch in velo'],
    ],
    sealed: 'SealedSecret',
  },
};

function security(lang) {
  const t = SECURITY[lang];
  const id = `p6c1-security-${lang}`;
  const rows = [60, 120, 180, 240];
  const body = [
    tile(16, 90, 176, 50, ...t.outside),
    tile(16, 180, 176, 50, ...t.inside),
    band(240, 16, 300, 300, 2),
    label(256, 40, t.fe),
    meta(524, 40, t.firewall, 'end'),
    // The firewall sits in front of every service, drawn as the accent line they are reached through
    line([[262, 52], [262, 300]], { accent: true }),
    ...t.feTiles.map(([name, sub], i) => tile(280, rows[i], 244, 50, name, sub, { accent: i === 0 })),
    band(620, 16, 260, 300, 2),
    label(636, 40, t.cluster),
    ...t.clusterTiles.map(([name, sub], i) => tile(636, rows[i], 228, 50, name, sub, { accent: i === 0 })),
    // Other hosts reach only SSH and the web interface
    line([[192, 115], [222, 115]]),
    line([[222, 85], [222, 145]]),
    arrow(id, [[222, 85], [278, 85]]),
    arrow(id, [[222, 145], [278, 145]]),
    // The nodes and cc-net reach every port
    arrow(id, [[192, 205], [278, 205]]),
    note(208, 197, t.all, 'middle'),
    arrow(id, [[524, 205], [634, 205]]),
    note(579, 197, t.sealed, 'middle'),
  ];
  return figure({ id, width: 896, height: 332, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(BACKUP)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p6c2-backup.svg'), backup(lang));
  writeFileSync(join(dir, 'p6c1-security.svg'), security(lang));
}
