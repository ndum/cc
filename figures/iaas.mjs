/**
 * Figures of part 2, building IaaS. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/iaas.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, figure, label, line, meta, note, strip, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TEXT = {
  de: {
    title: 'Wie OneDeploy das Lab einrichtet',
    desc:
      'Ansible auf dem Front-end liest das Inventar und die Playbooks von OneDeploy. Es richtet das ' +
      'Front-end lokal ein, mit oned, Scheduler und FireEdge. Die beiden Knoten richtet es über SSH ein, ' +
      'mit KVM und libvirt.',
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

const PATH = {
  de: {
    title: 'Der Weg eines Pakets von der VM ins Internet',
    desc:
      'Links schickt eine VM auf Knoten 1 ihren Rahmen an die Bridge ccbr mit deiner Kennung und weiter ins ' +
      'VXLAN. In der Mitte reist der Rahmen im Labnetz in einem UDP-Paket an Port 8472. Der Kopf von VXLAN und ' +
      'das äussere Paket brauchen 36 Byte, der Ethernet-Kopf im Rahmen der VM weitere 14. Für das IP-Paket der ' +
      'VM bleiben so höchstens 1450 der 1500 Byte, darum die MTU 1450. Rechts ' +
      'packt cc-vxlan auf dem Front-end den Rahmen aus und gibt ihn an die Bridge cc-br mit der Adresse des ' +
      'Gateways. Die NAT-Regel in der nftables-Tabelle cc_gateway ersetzt die Absenderadresse. Danach ' +
      'geht das Paket über das Labnetz ins Internet.',
    node: 'Knoten 1',
    vm: ['VM', 'MTU 1450'],
    nodeBridge: ['Bridge', 'ccbr<CC_VNI>'],
    nodeVxlan: ['VXLAN', 'Kennung CC_VNI'],
    labNet: 'Labnetz',
    total: '1500 Byte pro Paket im Labnetz',
    header: '36 Byte',
    payload: 'Rahmen bis 1464 Byte',
    packet: ['IP', 'UDP 8472', 'VXLAN'],
    frame: 'Rahmen der VM',
    visible: 'sichtbar sind nur Front-end und Knoten',
    fe: 'Front-end',
    feVxlan: ['VXLAN', 'cc-vxlan'],
    feBridge: ['Bridge cc-br', 'Adresse des Gateways'],
    nat: ['NAT mit nftables', 'cc_gateway: masquerade'],
    internet: ['Internet', 'über das Labnetz'],
  },
  en: {
    title: 'How a packet travels from a VM to the internet',
    desc:
      'On the left a VM on node 1 hands its frame to the bridge ccbr with your identifier and on to the VXLAN. ' +
      'In the middle the frame crosses the lab network inside a UDP packet to port 8472. The VXLAN header and ' +
      'the outer packet take 36 bytes, and the Ethernet header inside the VM frame another 14. That leaves at ' +
      'most 1450 of the 1500 bytes for the IP packet of the VM, hence the MTU of 1450. On ' +
      'the right cc-vxlan on the front-end unwraps the frame and passes it to the bridge cc-br, which holds the ' +
      'gateway address. The NAT rule in the nftables table cc_gateway replaces the source address, and the ' +
      'packet leaves over the lab network for the internet.',
    node: 'Node 1',
    vm: ['VM', 'MTU 1450'],
    nodeBridge: ['Bridge', 'ccbr<CC_VNI>'],
    nodeVxlan: ['VXLAN', 'identifier CC_VNI'],
    labNet: 'Lab network',
    total: '1500 bytes per packet on the lab network',
    header: '36 bytes',
    payload: 'frame up to 1464 bytes',
    packet: ['IP', 'UDP 8472', 'VXLAN'],
    frame: 'Frame of the VM',
    visible: 'only the front-end and the nodes are visible',
    fe: 'Front-end',
    feVxlan: ['VXLAN', 'cc-vxlan'],
    feBridge: ['Bridge cc-br', 'gateway address'],
    nat: ['NAT with nftables', 'cc_gateway: masquerade'],
    internet: ['Internet', 'over the lab network'],
  },
};

function networkPath(lang) {
  const t = PATH[lang];
  const id = `p2c3-network-path-${lang}`;
  // Three rows of tiles shared by the node and the front-end, the VXLAN row carries the packet across
  const rows = [126, 200, 274];
  const body = [
    // Node, the frame goes down from the VM to the VXLAN interface
    band(16, 86, 208, 254, 2),
    label(32, 110, t.node),
    tile(32, rows[0], 176, 50, ...t.vm),
    tile(32, rows[1], 176, 50, ...t.nodeBridge, { code: true }),
    tile(32, rows[2], 176, 50, ...t.nodeVxlan),
    arrow(id, [[120, 176], [120, 198]]),
    arrow(id, [[120, 250], [120, 272]]),
    // Lab network with the layout of the packet and the MTU arithmetic
    band(244, 86, 376, 254, 1),
    label(260, 110, t.labNet),
    line([[262, 150], [590, 150]]),
    line([[262, 145], [262, 155]]),
    line([[590, 145], [590, 155]]),
    note(426, 140, t.total, 'middle'),
    line([[262, 184], [452, 184]]),
    line([[458, 184], [590, 184]], { accent: true }),
    note(357, 176, t.header, 'middle'),
    note(524, 176, t.payload, 'middle'),
    strip(262, 196, 40, 50, t.packet[0]),
    strip(306, 196, 80, 50, t.packet[1]),
    strip(390, 196, 62, 50, t.packet[2]),
    tile(458, 196, 132, 50, t.frame, '', { accent: true }),
    arrow(id, [[208, 299], [654, 299]]),
    note(432, 291, 'UDP 8472', 'middle', { code: true }),
    note(432, 322, t.visible, 'middle'),
    // Front-end, the frame goes up from the VXLAN interface to NAT and out
    band(640, 86, 208, 254, 2),
    label(656, 110, t.fe),
    meta(832, 110, 'cc-gateway', 'end'),
    tile(656, rows[0], 176, 50, ...t.nat, { code: true, accent: true }),
    tile(656, rows[1], 176, 50, ...t.feBridge),
    tile(656, rows[2], 176, 50, ...t.feVxlan, { code: true }),
    arrow(id, [[744, 274], [744, 252]]),
    arrow(id, [[744, 200], [744, 178]]),
    arrow(id, [[744, 126], [744, 68]]),
    tile(656, 16, 176, 50, ...t.internet),
  ];
  return figure({ id, width: 864, height: 356, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(TEXT)) {
  const target = join(ROOT, 'site', 'src', 'assets', 'figures', lang, 'p2c2-deploy.svg');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, deployFlow(lang));
}

for (const lang of Object.keys(ARCH)) {
  writeFileSync(join(ROOT, 'site', 'src', 'assets', 'figures', lang, 'p2c1-architecture.svg'), architecture(lang));
}

for (const lang of Object.keys(PATH)) {
  writeFileSync(join(ROOT, 'site', 'src', 'assets', 'figures', lang, 'p2c3-network-path.svg'), networkPath(lang));
}
