/**
 * Figures of part 2, building IaaS. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/iaas.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, figure, label, meta, note, strip, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TEXT = {
  de: {
    title: 'Wie OneDeploy das Lab einrichtet',
    desc:
      'Ansible auf dem Front-end liest das Inventar und die Playbooks von OneDeploy. Es richtet das ' +
      'Front-end lokal ein, mit oned, Scheduler und FireEdge, und die beiden Knoten über SSH, mit KVM ' +
      'und libvirt.',
    input: 'Eingaben',
    inventory: ['Inventar', 'inventory.yml'],
    onedeploy: ['OneDeploy', 'Playbooks, Rollen'],
    control: 'Steuerung',
    ansible: ['Ansible', 'auf dem Front-end'],
    targets: 'Ziele',
    fe: ['Front-end', 'oned, Scheduler, FireEdge'],
    node1: ['Knoten 1', 'KVM, libvirt'],
    node2: ['Knoten 2', 'KVM, libvirt'],
    local: 'lokal',
  },
  en: {
    title: 'How OneDeploy sets up the lab',
    desc:
      'Ansible on the front-end reads the inventory and the playbooks of OneDeploy. It sets up the ' +
      'front-end locally, with oned, the scheduler and FireEdge, and the two nodes over SSH, with KVM ' +
      'and libvirt.',
    input: 'Input',
    inventory: ['Inventory', 'inventory.yml'],
    onedeploy: ['OneDeploy', 'playbooks, roles'],
    control: 'Control',
    ansible: ['Ansible', 'on the front-end'],
    targets: 'Targets',
    fe: ['Front-end', 'oned, scheduler, FireEdge'],
    node1: ['Node 1', 'KVM, libvirt'],
    node2: ['Node 2', 'KVM, libvirt'],
    local: 'local',
  },
};

function deployFlow(lang) {
  const t = TEXT[lang];
  const id = `p2c2-deploy-${lang}`;
  const body = [
    band(20, 20, 184, 224, 1),
    label(36, 44, t.input),
    tile(36, 60, 152, 50, t.inventory[0], t.inventory[1], { code: true }),
    tile(36, 172, 152, 50, ...t.onedeploy),
    band(268, 20, 184, 224, 2),
    label(284, 44, t.control),
    tile(284, 116, 152, 50, ...t.ansible, { accent: true }),
    band(516, 20, 204, 224, 1),
    label(532, 44, t.targets),
    tile(532, 60, 172, 50, ...t.fe),
    tile(532, 120, 172, 50, ...t.node1),
    tile(532, 180, 172, 50, ...t.node2),
    arrow(id, [[188, 85], [228, 85], [228, 133], [282, 133]]),
    arrow(id, [[188, 197], [228, 197], [228, 149], [282, 149]]),
    arrow(id, [[436, 133], [476, 133], [476, 85], [530, 85]]),
    arrow(id, [[436, 141], [530, 145]]),
    arrow(id, [[436, 149], [476, 149], [476, 205], [530, 205]]),
    note(484, 78, t.local, 'start', { code: true }),
    note(484, 138, 'SSH', 'start', { code: true }),
    note(484, 198, 'SSH', 'start', { code: true }),
  ];
  return figure({ id, width: 740, height: 264, title: t.title, desc: t.desc, body });
}

const ARCH = {
  de: {
    title: 'Die Bausteine von OpenNebula',
    desc:
      'Drei Bereiche nebeneinander. Links greifen Sunstone, die CLI und OpenTofu über die API auf das Front-end zu. ' +
      'In der Mitte verwaltet oned auf dem Front-end alle Objekte, speichert sie in MariaDB, lässt den Scheduler ' +
      'Knoten wählen und erhält Zustände von onemonitord. Die Treiber für Hosts, VMs, Transfer, Netze und ' +
      'Datastores führen die Aufträge aus. Rechts arbeiten die Knoten mit libvirt und KVM, die Treiber erreichen ' +
      'sie über SSH.',
    access: 'Zugang',
    clients: [
      ['Sunstone', 'Port 2616'],
      ['CLI', 'onevm, onehost'],
      ['OpenTofu', 'ab Teil 4'],
    ],
    api: 'API 2633',
    frontend: 'Front-end',
    oned: ['oned', 'verwaltet alle Objekte'],
    parts: [
      ['MariaDB', 'Datenbank'],
      ['Scheduler', 'wählt Knoten'],
      ['Monitoring', 'onemonitord'],
    ],
    nodes: 'Knoten',
    node: [['Knoten 1', 'libvirt, KVM'], ['Knoten 2', 'libvirt, KVM']],
  },
  en: {
    title: 'The building blocks of OpenNebula',
    desc:
      'Three areas side by side. On the left Sunstone, the CLI and OpenTofu reach the front-end through the API. ' +
      'In the middle oned on the front-end manages all objects, stores them in MariaDB, lets the scheduler pick ' +
      'nodes and receives states from onemonitord. The drivers for hosts, VMs, transfer, networks and datastores ' +
      'carry out the jobs. On the right the nodes work with libvirt and KVM, and the drivers reach them over SSH.',
    access: 'Access',
    clients: [
      ['Sunstone', 'port 2616'],
      ['CLI', 'onevm, onehost'],
      ['OpenTofu', 'from part 4'],
    ],
    api: 'API 2633',
    frontend: 'Front-end',
    oned: ['oned', 'manages all objects'],
    parts: [
      ['MariaDB', 'database'],
      ['Scheduler', 'picks nodes'],
      ['Monitoring', 'onemonitord'],
    ],
    nodes: 'Nodes',
    node: [['Node 1', 'libvirt, KVM'], ['Node 2', 'libvirt, KVM']],
  },
};

function architecture(lang) {
  const t = ARCH[lang];
  const id = `p2c1-architecture-${lang}`;
  const body = [
    band(16, 16, 168, 252, 1),
    label(32, 40, t.access),
    ...t.clients.map(([name, sub], i) => tile(32, 56 + i * 66, 136, 50, name, sub, { code: i === 1 })),
    band(204, 16, 360, 252, 2),
    label(220, 40, t.frontend),
    tile(220, 56, 328, 50, ...t.oned, { accent: true }),
    ...t.parts.map(([name, sub], i) => tile(220 + i * 112, 122, 104, 50, name, sub, { code: i === 2 })),
    strip(220, 188, 328, 64, ''),
    band(584, 16, 200, 252, 1),
    label(600, 40, t.nodes),
    ...t.node.map(([name, sub], i) => tile(600, 56 + i * 66, 168, 50, name, sub)),
    strip(600, 188, 168, 64, ''),
    arrow(id, [[168, 122], [218, 81]]),
    arrow(id, [[168, 88], [218, 81]]),
    arrow(id, [[168, 155], [218, 81]]),
    arrow(id, [[548, 220], [598, 220]]),
    note(573, 212, 'SSH', 'middle', { code: true }),
    meta(193, 112, t.api, 'middle'),
  ];
  // The two strips hold wrapped notes, so their text is set here line by line
  const driverLines = lang === 'de'
    ? ['Treiber führen die Aufträge aus', 'IM Hosts, VMM VMs, TM Transfer,', 'VNM Netze, DS Datastores']
    : ['drivers carry out the jobs', 'IM hosts, VMM VMs, TM transfer,', 'VNM networks, DS datastores'];
  driverLines.forEach((text, i) => body.push(note(384, 210 + i * 15, text, 'middle')));
  const dsLines = lang === 'de' ? ['Datastore 0', 'Disks laufender VMs'] : ['datastore 0', 'disks of running VMs'];
  dsLines.forEach((text, i) => body.push(note(684, 216 + i * 15, text, 'middle')));
  return figure({ id, width: 800, height: 284, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(TEXT)) {
  const target = join(ROOT, 'site', 'src', 'assets', 'figures', lang, 'p2c2-deploy.svg');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, deployFlow(lang));
}

for (const lang of Object.keys(ARCH)) {
  writeFileSync(join(ROOT, 'site', 'src', 'assets', 'figures', lang, 'p2c1-architecture.svg'), architecture(lang));
}
