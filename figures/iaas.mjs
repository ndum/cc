/**
 * Figures of part 2, building IaaS. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/iaas.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, escape, figure, label, line, measure, meta, note, SIZE, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// The library draws arrowheads only in grey and blue and sets every free text in one font, so the
// helpers below add violet arrows for links inside the internal network, dimension lines and lines
// that mix prose with code, all with the classes of course.css.

const pathOf = (points) => points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');

/** The violet arrowhead, referenced as url(#<id>-head-violet) */
const violetHead = (id) =>
  `<defs><marker id="${id}-head-violet" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" ` +
  `orient="auto-start-reverse"><path class="d-fill-violet" d="M 0 1 L 9 5 L 0 9 z"/></marker></defs>`;

/** A dashed violet arrow for a virtual link inside the internal network */
const violetArrow = (id, points) =>
  `<path class="d-line d-line-violet d-dashed" d="${pathOf(points)}" marker-end="url(#${id}-head-violet)"/>`;

/** Stops the script when a free text is wider than the room it has */
function room(text, width, options = {}) {
  const needed = measure(text, SIZE.sub, options);
  if (needed > width) {
    throw new Error(`"${text}" needs about ${Math.ceil(needed)} px but has only ${Math.floor(width)} px. Move or shorten it.`);
  }
}

/** A free note that has to stay within the given width */
function fitted(x, y, text, width, anchor = 'start', { code = false } = {}) {
  room(text, width, { mono: code });
  return note(x, y, text, anchor, { code });
}

/** One line of text from parts in prose and in code, such as an explanation that ends with a command */
function mixed(x, y, parts, anchor = 'start') {
  const spans = parts.map(([text, code]) => (code ? `<tspan class="d-code">${escape(text)}</tspan>` : escape(text)));
  return `<text class="d-sub" x="${x}" y="${y}" text-anchor="${anchor}">${spans.join('')}</text>`;
}

const mixedWidth = (parts) => parts.reduce((sum, [text, code]) => sum + measure(text, SIZE.sub, { mono: code }), 0);

/** A dimension line from x1 to x2 with end ticks and its text above or below */
function dimension(x1, x2, y, text, { accent = false, tone = '', below = false } = {}) {
  room(text, x2 - x1 - 16);
  const style = { accent, tone };
  return [
    line([[x1, y], [x2, y]], style),
    line([[x1, y - 5], [x1, y + 5]], style),
    line([[x2, y - 5], [x2, y + 5]], style),
    note((x1 + x2) / 2, below ? y + 18 : y - 9, text, 'middle'),
  ];
}

// Chapter 2.1, the building blocks of OpenNebula

const ARCH = {
  de: {
    title: 'Die Bausteine von OpenNebula',
    desc:
      'Die Bausteine von OpenNebula in drei Bereichen übereinander. Oben greifen Sunstone, die CLI und OpenTofu ' +
      'über die API auf Port 2633 auf oned zu. In der Mitte verwaltet oned auf dem Front-end alle Objekte, ' +
      'speichert sie in MariaDB, lässt den Scheduler Knoten wählen und erhält Zustände von onemonitord. Die ' +
      'Treiber für Hosts, VMs, Transfer, Netze und Datastores führen die Aufträge aus. Unten arbeiten die beiden ' +
      'Knoten mit libvirt und KVM. Ihr Datastore 0 hält die Disks laufender VMs. Achte darauf, dass auf den ' +
      'Knoten kein Dienst von OpenNebula läuft. Die Treiber erreichen sie über SSH.',
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
      ['MariaDB', 'Datenbank', 'database'],
      ['Scheduler', 'wählt Knoten', 'cog'],
      ['Monitoring', 'onemonitord', 'chart'],
    ],
    drivers: ['Treiber', 'IM, VMM, TM, VNM, DS'],
    nodes: ['Knoten 1', 'Knoten 2'],
    libvirt: ['libvirt', 'VMs mit KVM'],
    datastore: ['Datastore 0', 'Disks laufender VMs'],
  },
  en: {
    title: 'The building blocks of OpenNebula',
    desc:
      'The building blocks of OpenNebula in three areas stacked on top of each other. At the top Sunstone, the CLI ' +
      'and OpenTofu reach oned through the API on port 2633. In the middle oned on the front-end manages all ' +
      'objects, stores them in MariaDB, lets the scheduler pick nodes and receives states from onemonitord. The ' +
      'drivers for hosts, VMs, transfer, networks and datastores carry out the jobs. At the bottom the two nodes ' +
      'work with libvirt and KVM, and their datastore 0 holds the disks of running VMs. Notice that no OpenNebula ' +
      'service runs on the nodes. The drivers reach them over SSH.',
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
      ['MariaDB', 'database', 'database'],
      ['Scheduler', 'picks nodes', 'cog'],
      ['Monitoring', 'onemonitord', 'chart'],
    ],
    drivers: ['Drivers', 'IM, VMM, TM, VNM, DS'],
    nodes: ['Node 1', 'Node 2'],
    libvirt: ['libvirt', 'VMs with KVM'],
    datastore: ['Datastore 0', 'disks of running VMs'],
  },
};

function architecture(lang) {
  const t = ARCH[lang];
  const id = `p2c1-architecture-${lang}`;
  const access = [32, 272, 512];
  const parts = [32, 202, 372];
  const nodes = [16, 392];
  const body = [
    band(16, 16, 728, 108, 1),
    label(32, 40, t.access),
    band(16, 164, 728, 188, 2),
    label(32, 188, t.frontend, 'start', { tone: 'blue' }),
  ];
  nodes.forEach((x, i) => body.push(band(x, 400, 352, 108, 2), label(x + 16, 424, t.nodes[i], 'start', { tone: 'blue' })));
  // All three ways of access use the same API of oned
  access.forEach((x) => body.push(arrow(id, [[x + 108, 108], [x + 108, 198]], { accent: true })));
  body.push(meta(388, 148, t.api));
  // oned keeps its objects in MariaDB, asks the scheduler and hears from monitoring, the drivers do the work
  parts.forEach((x) => body.push(line([[x + 73, 256], [x + 73, 280]])));
  body.push(arrow(id, [[635, 256], [635, 278]], { accent: true }));
  // The drivers reach both nodes over SSH
  body.push(line([[635, 336], [635, 376]], { accent: true }), line([[192, 376], [635, 376]], { accent: true }));
  nodes.forEach((x) => body.push(arrow(id, [[x + 176, 376], [x + 176, 398]], { accent: true })));
  body.push(note(643, 368, 'SSH'));
  // Cards
  t.clients.forEach(([name, sub], i) => body.push(tile(access[i], 52, 216, 56, name, sub, { code: i === 1 })));
  body.push(tile(32, 200, 696, 56, ...t.oned, { accent: true }));
  t.parts.forEach(([name, sub, icon], i) => body.push(tile(parts[i], 280, 146, 56, name, sub, { icon, code: i === 2 })));
  body.push(tile(542, 280, 186, 56, ...t.drivers, { icon: 'doc', code: true }));
  nodes.forEach((x) => {
    body.push(tile(x + 16, 436, 130, 56, ...t.libvirt, { icon: 'vm' }));
    body.push(tile(x + 170, 436, 166, 56, ...t.datastore, { icon: 'disk' }));
  });
  return figure({ id, width: 760, height: 524, title: t.title, desc: t.desc, body });
}

// Chapter 2.2, OneDeploy sets up the lab

const DEPLOY = {
  de: {
    title: 'OneDeploy richtet das Lab ein',
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
    title: 'OneDeploy sets up the lab',
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
  const t = DEPLOY[lang];
  const id = `p2c2-deploy-${lang}`;
  const rows = [52, 132, 212];
  const body = [
    band(16, 16, 192, 268, 1),
    label(32, 40, t.input),
    band(256, 16, 184, 268, 2),
    label(272, 40, t.control, 'start', { tone: 'blue' }),
    band(512, 16, 232, 268, 1),
    label(528, 40, t.targets),
    // The two inputs join into one arrow to Ansible
    line([[192, 80], [232, 80], [232, 240], [192, 240]]),
    arrow(id, [[232, 160], [270, 160]]),
    // Ansible sets up the front-end locally and the nodes over SSH
    line([[424, 160], [464, 160]], { accent: true }),
    ...rows.map((y) => arrow(id, [[464, 160], [464, y + 28], [526, y + 28]], { accent: true })),
    fitted(472, 72, t.local, 36),
    fitted(472, 152, 'SSH', 36),
    fitted(472, 232, 'SSH', 36),
    tile(32, rows[0], 160, 56, ...t.inventory, { icon: 'doc', code: true }),
    tile(32, rows[2], 160, 56, ...t.onedeploy, { icon: 'doc' }),
    tile(272, rows[1], 152, 56, ...t.ansible, { icon: 'cog', accent: true }),
    tile(528, rows[0], 200, 56, ...t.fe, { icon: 'server' }),
    tile(528, rows[1], 200, 56, ...t.node1, { icon: 'server' }),
    tile(528, rows[2], 200, 56, ...t.node2, { icon: 'server' }),
  ];
  return figure({ id, width: 760, height: 300, title: t.title, desc: t.desc, body });
}

// Chapter 2.3, the path of a packet from a VM through VXLAN and NAT to the internet

const PATH = {
  de: {
    title: 'Der Weg eines Pakets von der VM ins Internet',
    desc:
      'Der Weg eines Pakets von einer VM ins Internet. Links schickt eine VM im Netz cc-net auf Knoten 1 ihren ' +
      'Rahmen an die Bridge ccbr mit deiner Kennung und weiter ins VXLAN. In der Mitte reist der Rahmen im Labnetz in einem ' +
      'UDP-Paket an Port 8472. Rechts packt cc-vxlan auf dem Front-end den Rahmen aus und gibt ihn an die Bridge ' +
      'cc-br mit der Adresse des Gateways. Die NAT-Regel in der nftables-Tabelle cc_gateway ersetzt die ' +
      'Absenderadresse. Danach geht das Paket über das Labnetz ins Internet. Unten steht der Aufbau eines Pakets ' +
      'im Labnetz. Der Kopf von VXLAN und das äussere Paket brauchen 36 Byte, der Ethernet-Kopf im Rahmen der VM ' +
      'weitere 14. Für das IP-Paket der VM bleiben so höchstens 1450 der 1500 Byte, darum die MTU 1450. Achte ' +
      'darauf, dass von der Cloud im Labnetz nur Front-end und Knoten sichtbar sind.',
    node: 'Knoten 1',
    vm: ['VM', 'in cc-net, MTU 1450'],
    nodeBridge: ['Bridge', 'ccbr<CC_VNI>'],
    nodeVxlan: ['VXLAN', 'Kennung CC_VNI'],
    labNet: 'Labnetz',
    visible: 'sichtbar sind nur Front-end und Knoten',
    fe: 'Front-end',
    nat: ['NAT mit nftables', 'cc_gateway: masquerade'],
    feBridge: ['Bridge cc-br', 'Adresse des Gateways'],
    feVxlan: ['VXLAN', 'cc-vxlan'],
    internet: ['Internet', 'über das Labnetz'],
    packet: 'Aufbau eines Pakets im Labnetz',
    total: '1500 Byte pro Paket',
    fields: [
      ['IP-Kopf', '20 Byte'],
      ['UDP-Kopf', '8 Byte'],
      ['VXLAN-Kopf', '8 Byte'],
      ['Ethernet-Kopf', '14 Byte'],
      ['IP-Paket der VM', 'höchstens 1450 Byte, die MTU'],
    ],
    header: '36 Byte',
    frame: 'Rahmen der VM, bis 1464 Byte',
  },
  en: {
    title: 'The path of a packet from a VM to the internet',
    desc:
      'The path of a packet from a VM to the internet. On the left a VM in the network cc-net on node 1 hands its ' +
      'frame to the bridge ccbr with your identifier and on to the VXLAN. In the middle the frame crosses the lab network inside a UDP ' +
      'packet to port 8472. On the right cc-vxlan on the front-end unwraps the frame and passes it to the bridge ' +
      'cc-br, which holds the gateway address. The NAT rule in the nftables table cc_gateway replaces the source ' +
      'address, and the packet leaves over the lab network for the internet. At the bottom is the layout of a ' +
      'packet on the lab network. The VXLAN header and the outer packet take 36 bytes, and the Ethernet header ' +
      'inside the VM frame another 14. That leaves at most 1450 of the 1500 bytes for the IP packet of the VM, ' +
      'hence the MTU of 1450. Notice that of the cloud only the front-end and the nodes show up on the lab network.',
    node: 'Node 1',
    vm: ['VM', 'in cc-net, MTU 1450'],
    nodeBridge: ['Bridge', 'ccbr<CC_VNI>'],
    nodeVxlan: ['VXLAN', 'identifier CC_VNI'],
    labNet: 'Lab network',
    visible: 'only the front-end and the nodes are visible',
    fe: 'Front-end',
    nat: ['NAT with nftables', 'cc_gateway: masquerade'],
    feBridge: ['Bridge cc-br', 'gateway address'],
    feVxlan: ['VXLAN', 'cc-vxlan'],
    internet: ['Internet', 'over the lab network'],
    packet: 'Layout of a packet on the lab network',
    total: '1500 bytes per packet',
    fields: [
      ['IP header', '20 bytes'],
      ['UDP header', '8 bytes'],
      ['VXLAN header', '8 bytes'],
      ['Ethernet header', '14 bytes'],
      ['IP packet of the VM', 'at most 1450 bytes, the MTU'],
    ],
    header: '36 bytes',
    frame: 'frame of the VM, up to 1464 bytes',
  },
};

function networkPath(lang) {
  const t = PATH[lang];
  const id = `p2c3-network-path-${lang}`;
  // Three rows on the node and on the front-end, the VXLAN row carries the packet across
  const rows = [52, 140, 228];
  const mid = 368;
  const body = [
    violetHead(id),
    band(16, 16, 208, 284, 2),
    label(32, 40, t.node, 'start', { tone: 'blue' }),
    band(512, 16, 232, 284, 2),
    label(528, 40, t.fe, 'start', { tone: 'blue' }),
    note(728, 40, 'cc-gateway', 'end', { code: true }),
    // Inside the hosts the frame stays in the internal network
    violetArrow(id, [[120, 108], [120, 138]]),
    violetArrow(id, [[120, 196], [120, 226]]),
    violetArrow(id, [[628, 228], [628, 198]]),
    violetArrow(id, [[628, 140], [628, 110]]),
    // On the lab network it travels as UDP from node to front-end, after NAT it leaves for the internet
    arrow(id, [[208, 256], [526, 256]], { accent: true }),
    arrow(id, [[528, 80], [470, 80]], { accent: true }),
    label(mid, 226, t.labNet, 'middle', { tone: 'blue' }),
    note(mid, 246, 'UDP 8472', 'middle', { code: true }),
    fitted(mid, 278, t.visible, 272, 'middle'),
    tile(32, rows[0], 176, 56, ...t.vm, { icon: 'vm', tone: 'violet' }),
    tile(32, rows[1], 176, 56, ...t.nodeBridge, { icon: 'network', tone: 'violet', code: true }),
    tile(32, rows[2], 176, 56, ...t.nodeVxlan, { icon: 'network', tone: 'violet' }),
    tile(528, rows[0], 200, 56, ...t.nat, { icon: 'cog', accent: true, code: true }),
    tile(528, rows[1], 200, 56, ...t.feBridge, { icon: 'network', tone: 'violet' }),
    tile(528, rows[2], 200, 56, ...t.feVxlan, { icon: 'network', tone: 'violet', code: true }),
    tile(268, 52, 200, 56, ...t.internet, { icon: 'globe' }),
  ];
  // The packet on the lab network, outer headers in white, the frame of the VM in violet
  const top = 324;
  body.push(band(16, top, 728, 172, 1), label(32, top + 24, t.packet));
  body.push(...dimension(32, 728, top + 52, t.total));
  const widths = [100, 108, 124, 136, 204];
  let x = 32;
  const starts = widths.map((w) => {
    const start = x;
    x += w + 6;
    return start;
  });
  t.fields.forEach(([name, sub], i) =>
    body.push(tile(starts[i], top + 64, widths[i], 56, name, sub, { tone: i >= 3 ? 'violet' : '' })),
  );
  const headerEnd = starts[2] + widths[2];
  body.push(...dimension(32, headerEnd, top + 136, t.header, { accent: true, below: true }));
  body.push(...dimension(starts[3], 728, top + 136, t.frame, { tone: 'violet', below: true }));
  return figure({ id, width: 760, height: top + 188, title: t.title, desc: t.desc, body });
}

// Chapter 2.4, a VM from image, template and context

const TEMPLATE = {
  de: {
    title: 'Eine VM aus Image, Vorlage und Kontext',
    desc:
      'Eine VM aus Image, Vorlage und Kontext. Oben liegen auf dem Front-end das Image ubuntu-26.04 im Datastore ' +
      'default und die Vorlage ubuntu. Deren DISK verweist auf das Image. onetemplate instantiate ubuntu --name ' +
      'web-1 legt daraus die VM web-1 auf einem Knoten an. Dabei kopiert OpenNebula das Image als Disk in den ' +
      'Datastore system des Knotens und hängt die Werte aus CONTEXT als CD-Laufwerk mit context.sh an. Beim ' +
      'ersten Start liest one-context diese Datei und richtet die VM ein. NETWORK gibt ihr Adresse, Gateway, DNS ' +
      'und MTU aus cc-net. SET_HOSTNAME macht den Namen der VM zum Hostnamen, SSH_PUBLIC_KEY legt den Schlüssel ' +
      'von oneadmin in authorized_keys von root ab. Achte darauf, dass das Image für alle VMs gleich bleibt. ' +
      'Adresse, Name und Schlüssel bekommt jede VM erst über den Kontext.',
    fe: 'Front-end',
    image: ['Image', 'im Datastore default'],
    template: ['Vorlage', 'mit DISK, NIC und CONTEXT'],
    vm: 'VM web-1',
    onNode: 'auf einem Knoten',
    copy: 'Kopie beim Start',
    disk: ['Disk', 'Kopie im Datastore system'],
    cd: ['CD-Laufwerk', 'Werte aus der Vorlage'],
    firstBoot: ' beim ersten Start',
    results: [
      ['Adresse aus cc-net', 'mit Gateway, DNS und MTU', 'NETWORK = "YES"', 'network'],
      ['Hostname', 'der Name der VM', 'SET_HOSTNAME', 'vm'],
      ['SSH-Schlüssel', 'von oneadmin für root', 'SSH_PUBLIC_KEY', 'lock'],
    ],
  },
  en: {
    title: 'A VM from image, template and context',
    desc:
      'A VM from image, template and context. At the top the front-end holds the image ubuntu-26.04 in the ' +
      'datastore default and the template ubuntu, whose DISK points to the image. onetemplate instantiate ubuntu ' +
      '--name web-1 creates the VM web-1 on a node from them. OpenNebula copies the image into the system ' +
      'datastore of the node as the disk of the VM and attaches the values from CONTEXT as a CD drive with ' +
      'context.sh. At first boot one-context reads that file and sets up the VM. NETWORK gives it address, ' +
      'gateway, DNS and MTU from cc-net, SET_HOSTNAME makes the name of the VM its host name, and SSH_PUBLIC_KEY ' +
      "puts the key of oneadmin into root's authorized_keys. Notice that the image stays the same for every VM. " +
      'Each VM gets its address, name and key only through the context.',
    fe: 'Front-end',
    image: ['Image', 'in the datastore default'],
    template: ['Template', 'with DISK, NIC and CONTEXT'],
    vm: 'VM web-1',
    onNode: 'on a node',
    copy: 'copy at start',
    disk: ['Disk', 'copy in the system datastore'],
    cd: ['CD drive', 'values from the template'],
    firstBoot: ' at first boot',
    results: [
      ['Address from cc-net', 'with gateway, DNS and MTU', 'NETWORK = "YES"', 'network'],
      ['Host name', 'the name of the VM', 'SET_HOSTNAME', 'vm'],
      ['SSH key', 'from oneadmin for root', 'SSH_PUBLIC_KEY', 'lock'],
    ],
  },
};

function template(lang) {
  const t = TEMPLATE[lang];
  const id = `p2c4-template-${lang}`;
  const instantiate = 'onetemplate instantiate ubuntu --name web-1';
  const contextLine = [['one-context', true], [t.firstBoot, false]];
  room(t.copy, 304 - 172 - 16);
  if (mixedWidth(contextLine) > 588 - 296 - 24) throw new Error('The line of one-context does not fit beside the disk.');
  const results = [32, 272, 512];
  const body = [
    band(16, 16, 728, 128, 2),
    label(32, 40, t.fe, 'start', { tone: 'blue' }),
    band(16, 184, 728, 264, 3),
    label(32, 208, t.vm, 'start', { tone: 'violet' }),
    meta(728, 208, t.onNode, 'end'),
    // The template names the image in DISK
    arrow(id, [[464, 90], [298, 90]]),
    note(380, 82, 'DISK', 'middle', { code: true }),
    // At the start the image becomes the disk of the VM and CONTEXT its CD drive
    arrow(id, [[164, 128], [164, 218]], { accent: true }),
    note(172, 168, t.copy),
    arrow(id, [[596, 128], [596, 218]], { accent: true }),
    fitted(588, 168, instantiate, 588 - 172 - measure(t.copy, SIZE.sub) - 24, 'end', { code: true }),
    // At first boot one-context sets up address, host name and key
    line([[596, 296], [596, 332]], { accent: true }),
    line([[140, 332], [620, 332]], { accent: true }),
    ...results.map((x) => arrow(id, [[x + 108, 332], [x + 108, 354]], { accent: true })),
    mixed(588, 320, contextLine, 'end'),
    tile(32, 52, 264, 76, ...t.image, { icon: 'disk', detail: 'ubuntu-26.04' }),
    tile(464, 52, 264, 76, ...t.template, { icon: 'doc', accent: true, detail: 'ubuntu' }),
    tile(32, 220, 264, 76, ...t.disk, { icon: 'disk', tone: 'violet' }),
    tile(464, 220, 264, 76, ...t.cd, { icon: 'doc', tone: 'violet', detail: 'context.sh' }),
    ...t.results.map(([name, sub, detail, icon], i) =>
      tile(results[i], 356, 216, 76, name, sub, { icon, tone: 'violet', detail }),
    ),
  ];
  return figure({ id, width: 760, height: 464, title: t.title, desc: t.desc, body });
}

// Chapter 2.5, the states of a VM and the commands between them

const STATES = {
  de: {
    title: 'Die Zustände einer VM',
    desc:
      'Die Zustände einer VM mit der Kurzform, die onevm list in der Spalte STAT zeigt. onetemplate instantiate ' +
      'legt eine VM in pend an, wo sie auf den Scheduler wartet. Hat er einen Knoten gewählt, kopiert OpenNebula ' +
      'in prol die Disks dorthin. In boot legt der Hypervisor die VM an, danach läuft sie in runn. onevm migrate ' +
      'verschiebt eine laufende VM auf einen anderen Knoten. onevm poweroff schaltet sie nach poff aus, ihre Disks ' +
      'bleiben auf dem Knoten. onevm undeploy bringt sie nach unde, die Disks liegen dann wieder auf dem Front-end. ' +
      'onevm resume startet die VM aus beiden Zuständen wieder, aus poff direkt über boot, aus unde über pend. ' +
      'onevm terminate beendet sie mit done. Ein Fehler beim ' +
      'Kopieren, beim Start oder bei einer Migration führt nach fail. Nach einem Blick ins Log holt onevm recover ' +
      'die VM zurück. Fällt ihr Knoten aus, steht sie auf unkn. Achte auf den Unterschied zwischen poff und unde. ' +
      'Nur in unde gibt eine VM ihren Platz auf dem Knoten frei.',
    pend: ['Wartet', 'auf den Scheduler', 'pend'],
    prol: ['Kopiert', 'Disks zum Knoten', 'prol'],
    boot: ['Startet', 'Hypervisor legt VM an', 'boot'],
    runn: ['Läuft', 'auf einem Knoten', 'runn'],
    unde: ['Ausgeschaltet', 'Disks auf dem Front-end', 'unde'],
    poff: ['Ausgeschaltet', 'Disks auf dem Knoten', 'poff'],
    done: ['Beendet', 'nicht mehr aufgelistet', 'done'],
    unkn: ['Unbekannt', 'nicht mehr erreichbar', 'unkn'],
    fail: ['Fehlgeschlagen', [['Ursache im Log, zurück mit ', false], ['onevm recover', true]], 'fail'],
    error: 'Fehler',
    migration: ['Fehler bei', 'Migration'],
    failure: 'Ausfall des Knotens',
  },
  en: {
    title: 'The states of a VM',
    desc:
      'The states of a VM with the short form that onevm list shows in the column STAT. onetemplate instantiate ' +
      'creates a VM in pend, where it waits for the scheduler. Once the scheduler has picked a node, OpenNebula ' +
      'copies the disks there in prol. In boot the hypervisor creates the VM, which then runs in runn. onevm ' +
      'migrate moves a running VM to another node. onevm poweroff switches it off to poff, and its disks stay on ' +
      'the node. onevm undeploy takes it to unde, with the disks back on the front-end. onevm resume starts the ' +
      'VM again from both states, from poff directly through boot and from unde through pend. onevm terminate ' +
      'ends it in done. An error while copying, booting or ' +
      'migrating leads to fail, and after a look at the log onevm recover brings the VM back. If its node fails, ' +
      'the VM shows unkn. Notice the difference between poff and unde. Only in unde does a VM free its place on ' +
      'the node.',
    pend: ['Waiting', 'for the scheduler', 'pend'],
    prol: ['Copying', 'disks to the node', 'prol'],
    boot: ['Booting', 'hypervisor creates VM', 'boot'],
    runn: ['Running', 'on a node', 'runn'],
    unde: ['Switched off', 'disks on the front-end', 'unde'],
    poff: ['Switched off', 'disks on the node', 'poff'],
    done: ['Terminated', 'no longer listed', 'done'],
    unkn: ['Unknown', 'no longer reachable', 'unkn'],
    fail: ['Failed', [['read the log, then ', false], ['onevm recover', true]], 'fail'],
    error: 'error',
    migration: ['error during', 'migration'],
    failure: 'node failure',
  },
};

function vmStates(lang) {
  const t = STATES[lang];
  const id = `p2c5-states-${lang}`;
  // Four columns of cards: fail on top, the life cycle in the first row of states, the switched-off states
  // under the states that onevm resume starts again, the end states at the bottom
  const col = [32, 213, 395, 576];
  const w = 152;
  const h = 72;
  const center = (i) => col[i] + w / 2;
  const r0 = 24;
  const r1 = 152;
  const r2 = 272;
  const bus = 380;
  const r3 = 416;
  const failX = col[1];
  const failW = col[2] + w - col[1];
  const [failTitle, failLine, failCode] = t.fail;
  if (mixedWidth(failLine) > failW - 24) throw new Error('The recover line does not fit the card of fail.');
  const exit = col[3] + 16;
  const busX = col[3] + 140;
  const body = [
    // A new VM starts in pend and runs through prol and boot to runn
    fitted(col[0], 112, 'onetemplate instantiate', failX - col[0] + 40, 'start', { code: true }),
    arrow(id, [[center(0), 120], [center(0), r1 - 2]], { accent: true }),
    ...[0, 1, 2].map((i) => arrow(id, [[col[i] + w, r1 + h / 2], [col[i + 1] - 2, r1 + h / 2]], { accent: true })),
    // Errors while copying, booting or migrating lead up to fail
    arrow(id, [[center(1), r1], [center(1), r0 + h + 2]]),
    arrow(id, [[center(2), r1], [center(2), r0 + h + 2]]),
    fitted(center(1) + 8, 130, t.error, w / 2 - 16),
    fitted(center(2) + 8, 130, t.error, w / 2 - 16),
    arrow(id, [[exit, r1], [exit, r0 + h / 2], [failX + failW + 2, r0 + h / 2]]),
    fitted(exit + 8, 84, `${t.migration[0]} ${t.migration[1]}`, busX - exit + 8),
    // A migration keeps the VM in runn on another node
    arrow(id, [[col[3] + 64, r1], [col[3] + 64, r1 - 20], [col[3] + 128, r1 - 20], [col[3] + 128, r1 - 2]]),
    note(col[3] + 96, r1 - 28, 'onevm migrate', 'middle', { code: true }),
    // onevm poweroff keeps the VM on its node, onevm resume starts it again through boot
    arrow(id, [[exit, r1 + h], [exit, r2 + h / 2], [col[2] + w + 2, r2 + h / 2]]),
    fitted(exit + 8, 252, 'onevm poweroff', busX - exit - 16, 'start', { code: true }),
    arrow(id, [[center(2), r2], [center(2), r1 + h + 2]]),
    fitted(center(2) + 8, 252, 'onevm resume', exit - center(2) - 24, 'start', { code: true }),
    // onevm undeploy frees the node, onevm resume starts the VM again through pend
    arrow(id, [[col[0] + 40, r2], [col[0] + 40, r1 + h + 2]]),
    fitted(col[0] + 48, 252, 'onevm resume', failX - col[0] - 56, 'start', { code: true }),
    line([[busX, r1 + h], [busX, bus]]),
    line([[col[0] + 110, bus], [busX, bus]]),
    arrow(id, [[col[0] + 110, bus], [col[0] + 110, r2 + h + 2]]),
    fitted(col[0] + 118, 368, 'onevm undeploy', busX - col[0] - 126, 'start', { code: true }),
    // The end states, onevm terminate and a failed node
    arrow(id, [[col[1] + 24, bus], [col[1] + 24, r3 - 2]]),
    fitted(col[1] + 32, 402, 'onevm terminate', col[2] - col[1], 'start', { code: true }),
    arrow(id, [[col[2] + 24, bus], [col[2] + 24, r3 - 2]]),
    fitted(col[2] + 32, 402, t.failure, col[3] - col[2]),
    // Cards
    tile(failX, r0, failW, h, failTitle, '', { detail: failCode }),
    mixed(failX + failW / 2, r0 + h / 2 + 5, failLine, 'middle'),
    ...['pend', 'prol', 'boot', 'runn'].map((key, i) =>
      tile(col[i], r1, w, h, t[key][0], t[key][1], { detail: t[key][2], accent: key === 'runn' }),
    ),
    tile(col[0], r2, w, h, t.unde[0], t.unde[1], { detail: t.unde[2] }),
    tile(col[2], r2, w, h, t.poff[0], t.poff[1], { detail: t.poff[2] }),
    tile(col[1], r3, w, h, t.done[0], t.done[1], { detail: t.done[2] }),
    tile(col[2], r3, w, h, t.unkn[0], t.unkn[1], { detail: t.unkn[2] }),
  ];
  return figure({ id, width: 760, height: r3 + h + 24, title: t.title, desc: t.desc, body });
}

const FIGURES = {
  'p2c1-architecture': architecture,
  'p2c2-deploy': deployFlow,
  'p2c3-network-path': networkPath,
  'p2c4-template': template,
  'p2c5-states': vmStates,
};

for (const lang of ['de', 'en']) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  for (const [name, draw] of Object.entries(FIGURES)) writeFileSync(join(dir, `${name}.svg`), draw(lang));
}
