/**
 * Figures of the supplements. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/extras.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, escape, figure, label, line, measure, SIZE, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// The library sets every free text in one font and knows no strip with code in it, so the helpers
// below check free texts against their room and set lines that mix prose with code, all with the
// classes of course.css.

/** Width of a label in small capitals, with the letter spacing that course.css adds */
const labelWidth = (text) => measure(text.toUpperCase(), SIZE.label, { bold: true }) + 0.08 * SIZE.label * text.length;

/** Width of a line from parts in prose and in code, given as [text, isCode] pairs */
const mixedWidth = (parts) => parts.reduce((sum, [text, code]) => sum + measure(text, SIZE.sub, { mono: code }), 0);

/** Stops the script when a free text is wider than the room it has */
function room(parts, width) {
  const needed = mixedWidth(parts);
  if (needed > width) {
    const text = parts.map(([part]) => part).join('');
    throw new Error(`"${text}" needs about ${Math.ceil(needed)} px but has only ${Math.floor(width)} px. Move or shorten it.`);
  }
}

/** One line of secondary text from parts in prose and in code that has to stay within the given width */
function mixed(x, y, parts, width, anchor = 'start') {
  room(parts, width);
  const spans = parts.map(([text, code]) => (code ? `<tspan class="d-code">${escape(text)}</tspan>` : escape(text))).join('');
  return `<text class="d-sub" x="${x}" y="${y}" text-anchor="${anchor}">${spans}</text>`;
}

/** A free note in prose or in code that has to stay within the given width */
const fitted = (x, y, text, width, anchor = 'start', { code = false } = {}) => mixed(x, y, [[text, code]], width, anchor);

/** A label followed by a name in the monospace font, such as Bridge ccbr5862 */
function heading(x, y, name, code, { tone = '' } = {}) {
  return [label(x, y, name, 'start', { tone }), fitted(x + labelWidth(name) + 8, y, code, 400, 'start', { code: true })].join('\n');
}

/** A dashed strip across a band with a line that mixes prose and code, for what holds for the whole band */
function codeStrip(x, y, w, h, parts) {
  return [`<rect class="d-strip" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`, mixed(x + w / 2, y + h / 2 + 4, parts, w - 24, 'middle')].join('\n');
}

// Supplement «OpenNebula im Detail», oned with its services and drivers

const ONE = {
  de: {
    title: 'Dienste und Treiber von OpenNebula',
    desc:
      'Oben die Dienste auf dem Front-end. FireEdge liefert Sunstone auf Port 2616 aus. guacd auf Port 4822 bringt ' +
      'die Konsole einer VM in den Browser. OneFlow läuft auf Port 2474, OneGate auf Port 5030. Wie die CLI und ' +
      'OpenTofu rufen FireEdge, OneFlow und OneGate die API von oned auf, über XML-RPC auf Port 2633 oder gRPC auf ' +
      'Port 2634. oned speichert alle Objekte als XML in MariaDB und gibt die Arbeit an seine Treiber ab, die wie ' +
      'oned als oneadmin laufen. Scheduler und Datastore arbeiten nur auf dem Front-end. Die Treiber für ' +
      'Virtualisierung und Transfer erreichen die Knoten über SSH. Dort liegen ihre Skripte unter /var/tmp/one/, ' +
      'kopiert aus /var/lib/one/remotes/ auf dem Front-end. vmm/kvm startet die VMs mit libvirt und KVM, ' +
      'vnm/vxlan richtet ihr Netz ein. Der Transfertreiber legt disk.0 und disk.1 in den Datastore 0. Ein Agent ' +
      'führt die Proben aus im/kvm-probes.d/ aus und schickt die Werte an onemonitord auf Port 4124. Achte ' +
      'darauf, dass auf den Knoten kein Dienst von OpenNebula läuft. Dort arbeiten nur Skripte, die das Front-end ' +
      'über SSH startet.',
    fe: 'Front-end',
    feMeta: [['oned und Treiber laufen als ', false], ['oneadmin', true]],
    services: [
      ['guacd', 'Konsole, Port 4822'],
      ['FireEdge', 'Sunstone, Port 2616'],
      ['OneFlow', 'Dienste, Port 2474'],
      ['OneGate', 'Meldungen, Port 5030'],
    ],
    clients: ['Clients', 'CLI, OpenTofu'],
    oned: ['oned', 'API: XML-RPC 2633, gRPC 2634'],
    db: ['MariaDB', 'Objekte als XML'],
    drivers: [
      ['Scheduler', 'one_sched'],
      ['Datastore', 'one_datastore'],
      ['Virtualisierung', 'one_vmm_exec'],
      ['Monitoring', 'onemonitord'],
      ['Transfer', 'one_tm'],
    ],
    nodes: 'Knoten 1 und 2',
    vms: ['VMs', 'libvirt und KVM', 'one-<vm>'],
    vmNet: ['VM und Netz', 'vmm/kvm/', 'vnm/vxlan/'],
    probes: ['Monitoring', 'Agent mit Proben', 'im/kvm-probes.d/'],
    ds0: ['Datastore 0', 'Disks jeder VM', 'disk.0, disk.1'],
    ssh: 'SSH',
    port: 'Port 4124',
    scripts: [
      ['Skripte unter ', false],
      ['/var/tmp/one/', true],
      [', kopiert aus ', false],
      ['/var/lib/one/remotes/', true],
      [' auf dem Front-end', false],
    ],
  },
  en: {
    title: 'Services and drivers of OpenNebula',
    desc:
      'At the top the services on the front-end. FireEdge serves Sunstone on port 2616, and guacd on port 4822 ' +
      'brings the console of a VM into the browser. OneFlow runs on port 2474, OneGate on port 5030. Like the CLI ' +
      'and OpenTofu, FireEdge, OneFlow and OneGate call the oned API, through XML-RPC on port 2633 or gRPC on port ' +
      '2634. oned stores every object as XML in MariaDB and hands the work to its drivers, which run as oneadmin ' +
      'like oned. The scheduler and the datastore driver only work on the front-end. The drivers for ' +
      'virtualization and transfer reach the nodes over SSH. There their scripts sit in /var/tmp/one/, copied ' +
      'from /var/lib/one/remotes/ on the front-end. vmm/kvm starts the VMs with libvirt and KVM, and vnm/vxlan ' +
      'sets up their network. The transfer driver puts disk.0 and disk.1 into datastore 0. An agent runs the ' +
      'probes from im/kvm-probes.d/ and sends the values to onemonitord on port 4124. Notice that no OpenNebula ' +
      'service runs on the nodes. Only scripts work there, started by the front-end over SSH.',
    fe: 'Front-end',
    feMeta: [['oned and the drivers run as ', false], ['oneadmin', true]],
    services: [
      ['guacd', 'console, port 4822'],
      ['FireEdge', 'Sunstone, port 2616'],
      ['OneFlow', 'services, port 2474'],
      ['OneGate', 'VM reports, port 5030'],
    ],
    clients: ['Clients', 'CLI, OpenTofu'],
    oned: ['oned', 'API: XML-RPC 2633, gRPC 2634'],
    db: ['MariaDB', 'objects as XML'],
    drivers: [
      ['Scheduler', 'one_sched'],
      ['Datastore', 'one_datastore'],
      ['Virtualization', 'one_vmm_exec'],
      ['Monitoring', 'onemonitord'],
      ['Transfer', 'one_tm'],
    ],
    nodes: 'Nodes 1 and 2',
    vms: ['VMs', 'libvirt and KVM', 'one-<vm>'],
    vmNet: ['VM and network', 'vmm/kvm/', 'vnm/vxlan/'],
    probes: ['Monitoring', 'agent with probes', 'im/kvm-probes.d/'],
    ds0: ['Datastore 0', 'disks of each VM', 'disk.0, disk.1'],
    ssh: 'SSH',
    port: 'port 4124',
    scripts: [
      ['Driver scripts in ', false],
      ['/var/tmp/one/', true],
      [', copied from ', false],
      ['/var/lib/one/remotes/', true],
      [' on the front-end', false],
    ],
  },
};

function opennebula(lang) {
  const t = ONE[lang];
  const id = `ex-opennebula-${lang}`;
  // Services on top, oned in the middle, the drivers below it, the nodes in their own band. The two
  // drivers that stay on the front-end sit on the left, the three that reach the nodes on the right,
  // each above the part of the node it works with
  const services = [32, 212, 392, 572];
  const drivers = [
    { x: 32, w: 96 },
    { x: 152, w: 112 },
    { x: 288, w: 136 },
    { x: 448, w: 136 },
    { x: 608, w: 120 },
  ];
  const cx = (box) => box.x + box.w / 2;
  const [, , vmm, monitor, transfer] = drivers.map(cx);
  const bus = 140;
  const driverBus = 250;
  const gap = 372;
  const body = [
    band(16, 16, 728, 332, 2),
    label(32, 40, t.fe, 'start', { tone: 'blue' }),
    mixed(728, 40, t.feMeta, 728 - 32 - labelWidth(t.fe) - 24, 'end'),
    band(16, 388, 728, 170, 2),
    label(32, 412, t.nodes, 'start', { tone: 'blue' }),
    // guacd only serves the console that FireEdge shows, the other three call the API of oned
    line([[188, 84], [212, 84]]),
    ...[290, 470, 650].map((x) => line([[x, 112], [x, bus]], { accent: true })),
    line([[290, bus], [650, bus]], { accent: true }),
    arrow(id, [[vmm, bus], [vmm, 166]], { accent: true }),
    arrow(id, [[172, 196], [218, 196]], { accent: true }),
    line([[516, 196], [564, 196]]),
    // oned starts its drivers, the line through to the virtualization driver is one with the bus
    line([[vmm, 224], [vmm, 276]]),
    line([[cx(drivers[0]), driverBus], [cx(drivers[4]), driverBus]]),
    ...drivers.filter((box) => cx(box) !== vmm).map((box) => line([[cx(box), driverBus], [cx(box), 276]])),
    // Over the lab network: SSH to the nodes, the monitoring agent reports back on its own
    arrow(id, [[vmm, 332], [vmm, 426]], { accent: true }),
    arrow(id, [[monitor, 428], [monitor, 334]], { accent: true }),
    arrow(id, [[transfer, 332], [transfer, 426]], { accent: true }),
    fitted(vmm + 8, gap, t.ssh, monitor - vmm - 24),
    fitted(monitor + 8, gap, t.port, transfer - monitor - 24),
    fitted(transfer + 8, gap, t.ssh, 736 - transfer - 8),
    // deploy hands the VM to libvirt on the same node
    arrow(id, [[288, 464], [266, 464]]),
    codeStrip(32, 512, 696, 30, t.scripts),
    // Cards
    ...t.services.map(([name, sub], i) => tile(services[i], 56, 156, 56, name, sub)),
    tile(32, 168, 140, 56, ...t.clients, { icon: 'client' }),
    tile(220, 168, 296, 56, ...t.oned, { icon: 'cog', accent: true }),
    tile(564, 168, 164, 56, ...t.db, { icon: 'database' }),
    ...t.drivers.map(([name, program], i) => tile(drivers[i].x, 276, drivers[i].w, 56, name, program, { code: true })),
    tile(32, 428, 232, 72, t.vms[0], t.vms[1], { icon: 'vm', tone: 'violet', detail: t.vms[2] }),
    tile(288, 428, 136, 72, t.vmNet[0], t.vmNet[1], { code: true, detail: t.vmNet[2] }),
    tile(448, 428, 136, 72, t.probes[0], t.probes[1], { detail: t.probes[2] }),
    tile(608, 428, 120, 72, t.ds0[0], t.ds0[1], { detail: t.ds0[2] }),
  ];
  return figure({ id, width: 760, height: 574, title: t.title, desc: t.desc, body });
}

// Supplement «Linux-Netz im Lab», the devices of cc-net on the front-end and on a node

const NET = {
  de: {
    title: 'Bridges und VXLAN im Lab',
    desc:
      'Links das Front-end, rechts Knoten 1 mit zwei VMs. Auf beiden hat eth0 die MTU 1500 und eine Adresse im ' +
      'Labnetz. Auf dem Front-end legt cc-gateway die Bridge cc-br mit dem Gateway 172.31.160.1/24 an, darin das ' +
      'VXLAN-Gerät cc-vxlan, beide mit der MTU 1450. Pakete aus cc-net leitet der Kernel mit ip_forward=1 an eth0 ' +
      'weiter. Dabei ersetzt die Tabelle cc_gateway ihren Absender durch 192.168.210.137. Auf dem Knoten legt ' +
      'OpenNebula die Bridge ccbr5862 ohne Adresse an, darin das VXLAN-Gerät eth0.5862. Der Kernel gibt ihm die MTU ' +
      'von eth0 minus 50 Byte, also 1450. In derselben Bridge hängen die Karten der VMs wie one-12-0, libvirt gibt ' +
      'ihnen die MTU der Bridge. Die VMs selbst bekommen 1450 über den Kontext. Die beiden VXLAN-Geräte verbinden ' +
      'die Bridges zum Netz cc-net. Sie verpacken die Rahmen in UDP-Pakete an Port 8472 und finden einander über ' +
      'die Multicast-Gruppe 239.0.22.230 im Labnetz. Achte darauf, dass die Bridge auf dem Knoten keine Adresse ' +
      'hat. Von den Servern hat nur das Front-end eine Adresse in cc-net.',
    fe: 'Front-end',
    node: 'Knoten 1',
    nodeMeta: 'Bridge und VXLAN von OpenNebula',
    nat: ['NAT mit nftables', 'cc_gateway: masquerade'],
    bridge: 'Bridge',
    feBridge: [['172.31.160.1/24', true], [', MTU 1450', false]],
    nodeBridge: 'ohne Adresse, MTU 1450',
    vxlan: 'VXLAN',
    nic: 'Karte',
    vms: ['VM 12', 'Weitere VM'],
    mtu: 'MTU 1450',
    eth: ['Schnittstelle', 'MTU 1500'],
    labNet: 'Labnetz 192.168.210.0/24',
    tunnel: [['VXLAN 5862 über ', false], ['UDP 8472', true], [', Gruppe ', false], ['239.0.22.230', true]],
  },
  en: {
    title: 'Bridges and VXLAN in the lab',
    desc:
      'On the left the front-end, on the right node 1 with two VMs. On both, eth0 has an MTU of 1500 and an ' +
      'address on the lab network. On the front-end, cc-gateway creates the bridge cc-br with the gateway ' +
      '172.31.160.1/24 and in it the VXLAN device cc-vxlan, both with an MTU of 1450. The kernel forwards packets ' +
      'from cc-net to eth0 with ip_forward=1, and the table cc_gateway replaces their source with 192.168.210.137. ' +
      'On the node, OpenNebula creates the bridge ccbr5862 without an address and in it the VXLAN device ' +
      'eth0.5862. The kernel gives that device the MTU of eth0 minus 50 bytes, which is 1450. The VM NICs such as ' +
      'one-12-0 join the same bridge, and libvirt gives them the MTU of the bridge. The VMs themselves get 1450 ' +
      'through the context. The two VXLAN devices join the bridges into the network cc-net. They wrap the frames ' +
      'in UDP packets to port 8472 and find each other through the multicast group 239.0.22.230 on the lab ' +
      'network. Notice that the bridge on the node has no address. Of the servers, only the front-end has an ' +
      'address in cc-net.',
    fe: 'Front-end',
    node: 'Node 1',
    nodeMeta: 'bridge and VXLAN from OpenNebula',
    nat: ['NAT with nftables', 'cc_gateway: masquerade'],
    bridge: 'Bridge',
    feBridge: [['172.31.160.1/24', true], [', MTU 1450', false]],
    nodeBridge: 'without address, MTU 1450',
    vxlan: 'VXLAN',
    nic: 'NIC',
    vms: ['VM 12', 'Another VM'],
    mtu: 'MTU 1450',
    eth: ['Interface', 'MTU 1500'],
    labNet: 'Lab network 192.168.210.0/24',
    tunnel: [['VXLAN 5862 over ', false], ['UDP 8472', true], [', group ', false], ['239.0.22.230', true]],
  },
};

function network(lang) {
  const t = NET[lang];
  const id = `ex-network-${lang}`;
  // The front-end on the left, the node on the right, the bridges and the eth0 of both at the same
  // height, so the stacks read across. The ports of the node bridge share their columns with the VMs
  const ports = [364, 488, 612];
  const portW = 100;
  const pc = (x) => x + portW / 2;
  const feBridge = { x: 64, w: 204 };
  const fePort = { x: 80, w: 172 };
  const feMid = fePort.x + fePort.w / 2;
  const top = 136;
  const portY = 192;
  const ethY = 312;
  const bus = 424;
  const body = [
    band(16, 16, 268, 376, 2),
    label(32, 40, t.fe, 'start', { tone: 'blue' }),
    fitted(268, 40, 'cc-gateway', 268 - 32 - labelWidth(t.fe) - 16, 'end', { code: true }),
    band(332, 16, 412, 376, 2),
    label(348, 40, t.node, 'start', { tone: 'blue' }),
    fitted(728, 40, t.nodeMeta, 728 - 348 - labelWidth(t.node) - 24, 'end'),
    band(feBridge.x, top, feBridge.w, 136, 3),
    heading(feBridge.x + 16, top + 24, t.bridge, 'cc-br', { tone: 'violet' }),
    mixed(feBridge.x + 16, top + 41, t.feBridge, feBridge.w - 32),
    band(348, top, 380, 136, 3),
    heading(364, top + 24, t.bridge, 'ccbr5862', { tone: 'violet' }),
    fitted(364, top + 41, t.nodeBridge, pc(ports[1]) - 364 - 16),
    // Forwarding on the front-end: from the bridge up to NAT and down the side to eth0
    arrow(id, [[feMid, top], [feMid, 114]]),
    fitted(feMid + 8, 128, 'ip_forward=1', 268 - feMid - 8, 'start', { code: true }),
    arrow(id, [[feBridge.x, 84], [44, 84], [44, ethY - 2]]),
    // The NICs of the VMs are ports of the bridge, the VXLAN devices join both bridges into cc-net
    ...[1, 2].map((i) => line([[pc(ports[i]), 112], [pc(ports[i]), portY]], { dashed: true, tone: 'violet' })),
    line([[fePort.x + fePort.w, portY + 32], [ports[0], portY + 32]], { dashed: true, tone: 'violet' }),
    // Each VXLAN device sends its UDP packets out through eth0 of its server
    ...[feMid, pc(ports[0])].map((x) => line([[x, portY + 64], [x, ethY]], { accent: true })),
    fitted(feMid + 8, 296, 'UDP 8472', 268 - feMid - 8, 'start', { code: true }),
    fitted(pc(ports[0]) + 8, 296, 'UDP 8472', ports[1] - pc(ports[0]) - 16, 'start', { code: true }),
    // The lab network joins both servers
    ...[150, 538].map((x) => line([[x, ethY + 64], [x, bus]], { accent: true })),
    line([[24, bus], [736, bus]], { accent: true }),
    label(24, bus + 24, t.labNet, 'start', { tone: 'blue' }),
    mixed(736, bus + 24, t.tunnel, 736 - 24 - labelWidth(t.labNet) - 24, 'end'),
    // Cards
    tile(feBridge.x, 56, feBridge.w, 56, ...t.nat, { icon: 'cog', code: true }),
    tile(fePort.x, portY, fePort.w, 64, t.vxlan, t.mtu, { tone: 'violet', detail: 'cc-vxlan' }),
    tile(32, ethY, 236, 64, ...t.eth, { icon: 'network', detail: 'eth0 192.168.210.137' }),
    ...t.vms.map((name, i) => tile(ports[i + 1], 56, portW, 56, name, t.mtu, { tone: 'violet' })),
    tile(ports[0], portY, portW, 64, t.vxlan, t.mtu, { tone: 'violet', detail: 'eth0.5862' }),
    tile(ports[1], portY, portW, 64, t.nic, t.mtu, { tone: 'violet', detail: 'one-12-0' }),
    tile(ports[2], portY, portW, 64, t.nic, t.mtu, { tone: 'violet', detail: 'one-<vm>-0' }),
    tile(348, ethY, 380, 64, ...t.eth, { icon: 'network', detail: 'eth0 192.168.210.138' }),
  ];
  return figure({ id, width: 760, height: 464, title: t.title, desc: t.desc, body });
}

// Supplement «Kubernetes-Grundlagen», the objects of the web shop and the labels that join them

const KUBE = {
  de: {
    title: 'Die Objekte des Webshops',
    desc:
      'Alle Objekte liegen im Namespace velo. Oben der Weg einer Anfrage. Traefik setzt den Ingress webshop um, ' +
      'der alle Pfade an den Port http des Services webshop schickt. Der Service hat eine feste Adresse im ' +
      'Cluster und den Port 80. Über seinen Selektor app=webshop füllt Kubernetes die EndpointSlice mit den ' +
      'Adressen der bereiten Pods. Die Anfrage geht an Port 8080 eines dieser Pods. In der Mitte die beiden Pods ' +
      'webshop-7d4f56cb9b-chxkw und webshop-7d4f56cb9b-mjsjj. Unten das Deployment webshop. Es verwaltet das ' +
      'ReplicaSet webshop-7d4f56cb9b, das mit app=webshop und pod-template-hash seine beiden Pods auswählt und ' +
      'am Laufen hält. Achte darauf, dass Service, ReplicaSet und Deployment ihre Pods über das Label app=webshop ' +
      'finden, ohne deren Namen zu kennen.',
    ns: 'Namespace',
    ingress: ['Ingress', 'Regel für Traefik, Pfad /', 'webshop'],
    service: ['Service', 'ClusterIP, Port 80', 'webshop'],
    slice: ['EndpointSlice', 'Adressen bereiter Pods'],
    pod: ['Pod', 'Container, Port 8080'],
    deployment: ['Deployment', 'Vorlage der Pods', 'webshop'],
    replicaSet: ['ReplicaSet', 'hält 2 Pods am Laufen', 'webshop-7d4f56cb9b'],
    port: 'Port ',
    target: 'Port 8080',
  },
  en: {
    title: 'The objects of the web shop',
    desc:
      'All objects live in the namespace velo. At the top the path of a request. Traefik carries out the ingress ' +
      'webshop, which sends every path to the port http of the service webshop. The service has a fixed address ' +
      'in the cluster and port 80. Through its selector app=webshop, Kubernetes fills the EndpointSlice with the ' +
      'addresses of the ready pods, and the request goes to port 8080 of one of these pods. In the middle the two ' +
      'pods webshop-7d4f56cb9b-chxkw and webshop-7d4f56cb9b-mjsjj. At the bottom the deployment webshop. It manages ' +
      'the ReplicaSet webshop-7d4f56cb9b, which selects its two pods with app=webshop and pod-template-hash and ' +
      'keeps them running. Notice that the service, the ReplicaSet and the deployment find their pods through the ' +
      'label app=webshop without knowing their names.',
    ns: 'Namespace',
    ingress: ['Ingress', 'rule for Traefik, path /', 'webshop'],
    service: ['Service', 'ClusterIP, port 80', 'webshop'],
    slice: ['EndpointSlice', 'addresses of ready pods'],
    pod: ['Pod', 'container, port 8080'],
    deployment: ['Deployment', 'template of the pods', 'webshop'],
    replicaSet: ['ReplicaSet', 'keeps 2 pods running', 'webshop-7d4f56cb9b'],
    port: 'port ',
    target: 'port 8080',
  },
};

const PODS = ['webshop-7d4f56cb9b-chxkw', 'webshop-7d4f56cb9b-mjsjj'];

function kubernetes(lang) {
  const t = KUBE[lang];
  const id = `ex-kubernetes-${lang}`;
  // The request runs along the top row to the pods in the middle, their owners sit in the bottom row
  const ingress = { x: 32, w: 164 };
  const service = { x: 292, w: 160 };
  const slice = { x: 568, w: 160 };
  const deployment = { x: 32, w: 152 };
  const replicaSet = { x: 292, w: 188 };
  const pods = [32, 404];
  const podW = 324;
  const cx = (box) => box.x + box.w / 2;
  const podX = pods.map((x) => x + podW / 2);
  const rs = cx(replicaSet);
  const selector = 'app: webshop';
  const body = [
    band(16, 16, 728, 412, 3),
    heading(32, 40, t.ns, 'velo', { tone: 'violet' }),
    // The request: ingress to the port http of the service, on to the ready pods of its EndpointSlice
    arrow(id, [[ingress.x + ingress.w, 92], [service.x - 2, 92]], { accent: true }),
    mixed((ingress.x + ingress.w + service.x) / 2, 84, [[t.port, false], ['http', true]], service.x - ingress.x - ingress.w - 16, 'middle'),
    arrow(id, [[service.x + service.w, 92], [slice.x - 2, 92]], { accent: true }),
    fitted((service.x + service.w + slice.x) / 2, 84, selector, slice.x - service.x - service.w - 16, 'middle', { code: true }),
    line([[cx(slice), 128], [cx(slice), 156], [podX[0], 156]], { accent: true }),
    ...podX.map((x) => arrow(id, [[x, 156], [x, 182]], { accent: true })),
    fitted(cx(slice) + 8, 146, t.target, 736 - cx(slice) - 8),
    // The owners: the deployment manages the ReplicaSet, which selects and keeps the pods
    arrow(id, [[deployment.x + deployment.w, 376], [replicaSet.x - 2, 376]]),
    fitted((deployment.x + deployment.w + replicaSet.x) / 2, 368, selector, replicaSet.x - deployment.x - deployment.w - 16, 'middle', { code: true }),
    line([[rs, 340], [rs, 284]]),
    line([[podX[0], 284], [podX[1], 284]]),
    ...podX.map((x) => arrow(id, [[x, 284], [x, 258]])),
    fitted(rs + 8, 306, selector, podX[1] - rs - 16, 'start', { code: true }),
    fitted(rs + 8, 320, 'pod-template-hash', podX[1] - rs - 16, 'start', { code: true }),
    // Cards
    tile(ingress.x, 56, ingress.w, 72, t.ingress[0], t.ingress[1], { detail: t.ingress[2] }),
    tile(service.x, 56, service.w, 72, t.service[0], t.service[1], { detail: t.service[2] }),
    tile(slice.x, 56, slice.w, 72, ...t.slice),
    ...PODS.map((name, i) => tile(pods[i], 184, podW, 72, ...t.pod, { icon: 'container', detail: name })),
    tile(deployment.x, 340, deployment.w, 72, t.deployment[0], t.deployment[1], { detail: t.deployment[2] }),
    tile(replicaSet.x, 340, replicaSet.w, 72, t.replicaSet[0], t.replicaSet[1], { detail: t.replicaSet[2] }),
  ];
  return figure({ id, width: 760, height: 444, title: t.title, desc: t.desc, body });
}

// Supplement «Werkzeuge der Plattform», how the tools reach the lab

const TOOLS = {
  de: {
    title: 'Die Werkzeuge der Plattform',
    desc:
      'Oben das Front-end mit Helm, Gitea und kubeseal. Helm installiert Argo CD einmal mit bootstrap-argocd.sh in ' +
      'den Namespace argocd. Argo CD holt dein Plattform-Repo jede Minute aus Gitea. Ordner wie webshop/ und ' +
      'members/ rendert es mit Kustomize und bringt so Webshop und Mitglieder in die Namespaces velo und gemeinde. ' +
      'Charts rendert es mit Helm. So kommen Prometheus, Alertmanager, Grafana, Loki und Alloy in den Namespace ' +
      'monitoring, der Controller von Sealed Secrets nach kube-system. kubeseal verschlüsselt ein Secret, ' +
      'seal-secrets.sh legt es als SealedSecret in dein Repo. Achte darauf, dass Helm auf dem Front-end nur ' +
      'Argo CD installiert. Alles andere bringt Argo CD aus Git in den Cluster.',
    fe: 'Front-end',
    helm: ['Helm', 'Paketmanager', 'bootstrap-argocd.sh'],
    gitea: ['Gitea', 'dein Plattform-Repo'],
    kubeseal: ['kubeseal', 'verschlüsselt Secrets', 'seal-secrets.sh'],
    once: 'installiert einmal',
    poll: 'holt jede Minute',
    sealed: 'SealedSecret',
    ns: 'Namespace',
    nss: 'Namespaces',
    argo: ['Argo CD', 'gleicht den Cluster an Git an', 'argo-cd 10.11.6'],
    members: [
      ['Webshop', 'webshop/'],
      ['Mitglieder', 'members/'],
    ],
    kustomize: 'Kustomize',
    charts: 'Helm-Charts',
    chart: 'Helm-Chart',
    chartMeta: [['Charts ', false], ['kube-prometheus-stack, loki, alloy', true]],
    monitoring: [
      ['Prometheus', 'holt Metriken ab', 'chart'],
      ['Alertmanager', 'gruppiert Alerts', 'bell'],
      ['Grafana', 'Dashboards', 'client'],
      ['Loki', 'speichert Logs', 'logs'],
      ['Alloy', 'sammelt die Logs der Pods', 'sync'],
    ],
    sealedSecrets: ['Sealed Secrets', 'öffnet SealedSecrets'],
  },
  en: {
    title: 'The tools of the platform',
    desc:
      'At the top the front-end with Helm, Gitea and kubeseal. Helm installs Argo CD once with bootstrap-argocd.sh ' +
      'into the namespace argocd. Argo CD polls your platform repo in Gitea every minute. It renders folders such ' +
      'as webshop/ and members/ with Kustomize, which brings the web shop and the members into the namespaces velo ' +
      'and gemeinde. It renders charts with Helm, which brings Prometheus, Alertmanager, Grafana, Loki and Alloy ' +
      'into the namespace monitoring and the Sealed Secrets controller into kube-system. kubeseal encrypts a ' +
      'Secret, and seal-secrets.sh puts it into your repo as a SealedSecret. Notice that Helm on the front-end only ' +
      'installs Argo CD. Argo CD brings everything else from Git into the cluster.',
    fe: 'Front-end',
    helm: ['Helm', 'package manager', 'bootstrap-argocd.sh'],
    gitea: ['Gitea', 'your platform repo'],
    kubeseal: ['kubeseal', 'encrypts Secrets', 'seal-secrets.sh'],
    once: 'installs once',
    poll: 'polls every minute',
    sealed: 'SealedSecret',
    ns: 'Namespace',
    nss: 'Namespaces',
    argo: ['Argo CD', 'keeps the cluster in line with Git', 'argo-cd 10.11.6'],
    members: [
      ['Web shop', 'webshop/'],
      ['Members', 'members/'],
    ],
    kustomize: 'Kustomize',
    charts: 'Helm charts',
    chart: 'Helm chart',
    chartMeta: [['charts ', false], ['kube-prometheus-stack, loki, alloy', true]],
    monitoring: [
      ['Prometheus', 'scrapes metrics', 'chart'],
      ['Alertmanager', 'groups alerts', 'bell'],
      ['Grafana', 'dashboards', 'client'],
      ['Loki', 'stores logs', 'logs'],
      ['Alloy', 'collects the pod logs', 'sync'],
    ],
    sealedSecrets: ['Sealed Secrets', 'opens SealedSecrets'],
  },
};

function tools(lang) {
  const t = TOOLS[lang];
  const id = `ex-tools-${lang}`;
  // The front-end on top, Argo CD and the namespaces it fills below. Every arrow into a namespace
  // ends at the edge of its band, the namespace as a whole is the target
  const helm = { x: 32, w: 184 };
  const gitea = { x: 248, w: 184 };
  const kubeseal = { x: 520, w: 208 };
  const argo = { x: 32, w: 280 };
  const cx = (box) => box.x + box.w / 2;
  const toGitea = 300;
  const toMonitoring = 176;
  const toSystem = 280;
  const system = { x: 544, w: 200 };
  const row = [408, 488];
  const third = (472 - 48) / 3;
  const half = (472 - 24) / 2;
  const cards = [
    { x: 32, y: row[0], w: third },
    { x: 32 + third + 24, y: row[0], w: third },
    { x: 32 + 2 * (third + 24), y: row[0], w: third },
    { x: 32, y: row[1], w: half },
    { x: 32 + half + 24, y: row[1], w: half },
  ];
  const body = [
    band(16, 16, 728, 128, 2),
    label(32, 40, t.fe, 'start', { tone: 'blue' }),
    band(16, 192, 312, 128, 3),
    heading(32, 216, t.ns, 'argocd', { tone: 'violet' }),
    band(416, 192, 328, 128, 3),
    heading(432, 216, t.nss, 'velo, gemeinde', { tone: 'violet' }),
    band(16, 368, 504, 192, 3),
    heading(32, 392, t.ns, 'monitoring', { tone: 'violet' }),
    mixed(504, 392, t.chartMeta, 504 - 32 - labelWidth(t.ns) - 8 - measure('monitoring', SIZE.code, { mono: true }) - 24, 'end'),
    band(system.x, 368, system.w, 112, 3),
    heading(system.x + 16, 392, t.ns, 'kube-system', { tone: 'violet' }),
    // Helm installs Argo CD once, from then on Argo CD pulls the desired state from Gitea itself
    arrow(id, [[cx(helm), 128], [cx(helm), 190]], { accent: true }),
    fitted(cx(helm) + 8, 166, t.once, toGitea - cx(helm) - 24),
    arrow(id, [[toGitea, 232], [toGitea, 130]], { accent: true }),
    fitted(toGitea + 8, 166, t.poll, 736 - toGitea - 8),
    arrow(id, [[kubeseal.x, 92], [gitea.x + gitea.w + 2, 92]]),
    fitted((gitea.x + gitea.w + kubeseal.x) / 2, 84, t.sealed, kubeseal.x - gitea.x - gitea.w - 16, 'middle'),
    // Argo CD renders folders with Kustomize and charts with Helm and applies the result
    arrow(id, [[argo.x + argo.w, 268], [414, 268]], { accent: true }),
    fitted((328 + 416) / 2, 260, t.kustomize, 416 - 328 - 16, 'middle'),
    arrow(id, [[toMonitoring, 304], [toMonitoring, 366]], { accent: true }),
    fitted(toMonitoring + 8, 354, t.charts, toSystem - toMonitoring - 24),
    arrow(id, [[toSystem, 304], [toSystem, 336], [cx(system), 336], [cx(system), 366]], { accent: true }),
    fitted(cx(system) + 8, 356, t.chart, 736 - cx(system) - 8),
    // Cards
    tile(helm.x, 56, helm.w, 72, t.helm[0], t.helm[1], { icon: 'cog', detail: t.helm[2] }),
    tile(gitea.x, 56, gitea.w, 72, ...t.gitea, { icon: 'repo' }),
    tile(kubeseal.x, 56, kubeseal.w, 72, t.kubeseal[0], t.kubeseal[1], { icon: 'lock', detail: t.kubeseal[2] }),
    tile(argo.x, 232, argo.w, 72, t.argo[0], t.argo[1], { icon: 'sync', accent: true, detail: t.argo[2] }),
    ...t.members.map(([name, folder], i) => tile(432 + i * 160, 232, 136, 72, name, folder, { code: true })),
    ...t.monitoring.map(([name, sub, icon], i) => tile(cards[i].x, cards[i].y, cards[i].w, 56, name, sub, { icon })),
    tile(system.x + 16, row[0], system.w - 32, 56, ...t.sealedSecrets, { icon: 'shield' }),
  ];
  return figure({ id, width: 760, height: 576, title: t.title, desc: t.desc, body });
}

const FIGURES = {
  'ex-opennebula': opennebula,
  'ex-network': network,
  'ex-kubernetes': kubernetes,
  'ex-tools': tools,
};

for (const lang of ['de', 'en']) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  for (const [name, draw] of Object.entries(FIGURES)) writeFileSync(join(dir, `${name}.svg`), draw(lang));
}
