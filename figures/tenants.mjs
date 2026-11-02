/**
 * Figures of part 3, tenants and self-service. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/tenants.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, escape, figure, label, line, measure, meta, note, SIZE, strip, tag, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Width of a label in small capitals, with the letter spacing that course.css adds */
const labelWidth = (text) => measure(text.toUpperCase(), SIZE.label, { bold: true }) + 0.08 * SIZE.label * text.length;

/** A label followed by a name in the monospace font, such as VDC wolkenwerk */
function heading(x, y, name, code, { tone = '' } = {}) {
  return [label(x, y, name, 'start', { tone }), note(x + labelWidth(name) + 8, y, code, 'start', { code: true })].join('\n');
}

/** Stops the script when a free text does not fit the width it may take */
function check(text, width, { size = SIZE.sub, bold = false, mono = false } = {}) {
  const needed = measure(text, size, { bold, mono });
  if (needed > width) throw new Error(`"${text}" needs about ${Math.ceil(needed)} px but has only ${Math.floor(width)} px.`);
}

/** A text with a class of its own, for numbers and short labels in the charts */
const text = (x, y, value, cls, anchor = 'start') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${escape(value)}</text>`;

/** A filled bar of a chart */
const bar = (x, y, w, h, cls) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`;

const TENANTS = {
  de: {
    title: 'Gruppen, Gruppenadmins und das VDC der Mitglieder',
    desc:
      'Oben fasst das VDC wolkenwerk die vier Gruppen praxis, treuhand, velo und gemeinde zusammen, eine pro ' +
      'Mitglied. Jede Gruppe hat einen Gruppenadmin wie praxis-admin, der darin Benutzer anlegt. Die Gruppen ' +
      'dürfen VMs, Images, Vorlagen und Dokumente anlegen und sehen nur ihre eigenen Objekte. Unten liegt der ' +
      'Cluster 0 mit Knoten 1, Knoten 2, dem Netz cc-net und den Datastores. Das Plattform-Team teilt ihn dem VDC ' +
      'zu, deshalb teilen sich alle vier Gruppen dieselben Knoten.',
    vdc: 'VDC',
    vdcMeta: 'eine Gruppe pro Mitglied',
    members: [
      ['praxis', 'Praxis Rosenweg'],
      ['treuhand', 'Treuhand Aaregg'],
      ['velo', 'Veloatelier Matte'],
      ['gemeinde', 'Gemeinde Hinterbüel'],
    ],
    admin: 'Gruppenadmin',
    users: ['Benutzer', 'legt der Admin an'],
    rights: 'Jede Gruppe darf VMs, Images, Vorlagen und Dokumente anlegen und sieht nur ihre eigenen Objekte.',
    cluster: 'Cluster 0',
    clusterMeta: 'dem VDC zugeteilt',
    resources: [
      ['Knoten 1', 'KVM', 'server'],
      ['Knoten 2', 'KVM', 'server'],
      ['cc-net', 'internes Netz', 'network', 'violet'],
      ['Datastores', 'Images, Disks', 'database'],
    ],
  },
  en: {
    title: 'Groups, group admins and the VDC of the members',
    desc:
      'At the top the VDC wolkenwerk holds the four groups praxis, treuhand, velo and gemeinde, one per member. ' +
      "Each group has a group admin such as praxis-admin who creates the group's users. The groups may create VMs, " +
      'images, templates and documents and only see their own objects. At the bottom is cluster 0 with node 1, ' +
      'node 2, the network cc-net and the datastores. The platform team assigns it to the VDC, so all four groups ' +
      'share the same nodes.',
    vdc: 'VDC',
    vdcMeta: 'one group per member',
    members: [
      ['praxis', 'Praxis Rosenweg'],
      ['treuhand', 'Treuhand Aaregg'],
      ['velo', 'Veloatelier Matte'],
      ['gemeinde', 'Gemeinde Hinterbüel'],
    ],
    admin: 'Group admin',
    users: ['Users', 'created by the admin'],
    rights: 'Every group may create VMs, images, templates and documents and only sees its own objects.',
    cluster: 'Cluster 0',
    clusterMeta: 'assigned to the VDC',
    resources: [
      ['Node 1', 'KVM', 'server'],
      ['Node 2', 'KVM', 'server'],
      ['cc-net', 'internal network', 'network', 'violet'],
      ['Datastores', 'images, disks', 'database'],
    ],
  },
};

function tenants(lang) {
  const t = TENANTS[lang];
  const id = `p3c1-tenants-${lang}`;
  // Four columns of cards, one per member, the cluster below uses the same columns
  const W = 160;
  const col = (i) => 32 + i * (W + 24);
  const mid = 388;
  const body = [band(16, 16, 744, 284, 1), heading(32, 40, t.vdc, 'wolkenwerk'), meta(744, 40, t.vdcMeta, 'end')];
  t.members.forEach(([group, name], i) => {
    const x = col(i);
    const cx = x + W / 2;
    // Each group has its admin, the admin creates the users
    body.push(line([[cx, 106], [cx, 130]]));
    body.push(line([[cx, 180], [cx, 204]]));
    body.push(tile(x, 56, W, 50, group, name, { icon: 'group' }));
    body.push(tile(x, 130, W, 50, t.admin, `${group}-admin`, { icon: 'user', code: true }));
    body.push(tile(x, 204, W, 50, ...t.users, { icon: 'user' }));
  });
  check(t.rights, 712);
  body.push(note(mid, 284, t.rights, 'middle'));
  // The platform team assigns cluster 0 to the VDC
  body.push(arrow(id, [[mid, 348], [mid, 302]], { accent: true }));
  body.push(note(mid + 12, 329, 'onevdc addcluster', 'start', { code: true }));
  body.push(band(16, 348, 744, 104, 2));
  body.push(label(32, 372, t.cluster, 'start', { tone: 'blue' }));
  body.push(meta(744, 372, t.clusterMeta, 'end'));
  t.resources.forEach(([name, sub, icon, tone = ''], i) => body.push(tile(col(i), 388, W, 50, name, sub, { icon, tone })));
  return figure({ id, width: 776, height: 468, title: t.title, desc: t.desc, body });
}

const QUOTA = {
  de: {
    title: 'Quota, Reservierung und Nutzung',
    desc:
      'Die Gruppe praxis hat die Werte des Kurses und die VMs praxis-1 und praxis-2 aus der Vorlage ubuntu. ' +
      'Bei der CPU erlaubt die Quota 1,5. Auf den Knoten reservieren die VMs 1,0, je 0,5 pro VM. Unter Last ' +
      'nutzen sie bis 2,0, weil jede VM eine ganze virtuelle CPU hat. Beim Arbeitsspeicher erlaubt die Quota ' +
      '2048 MB. Die beiden VMs reservieren mit je 1024 MB genau so viel und nutzen höchstens so viel, im ' +
      'Leerlauf weniger. Achte darauf, dass die Quota nur zählt, was reserviert ist. Wie stark die VMs ihre CPU ' +
      'auslasten, begrenzt sie nicht. Mit 2 von 2 VMs lehnt OpenNebula eine dritte VM ab.',
    group: 'Gruppe',
    groupMeta: 'praxis-1 und praxis-2 aus der Vorlage ubuntu',
    rows: ['Quota', 'Reserviert', 'Genutzt'],
    charts: [
      {
        name: 'CPU',
        unit: 'in Kernen',
        max: 2,
        ticks: [0, 0.5, 1, 1.5, 2],
        tick: (v) => String(v).replace('.', ','),
        quota: 1.5,
        reserved: [0.5, 0.5],
        used: 2,
        values: ['1,5', '1,0 = 2 × 0,5', 'bis 2,0 = 2 × VCPU 1'],
      },
      {
        name: 'Arbeitsspeicher',
        unit: 'in MB',
        max: 2048,
        ticks: [0, 512, 1024, 1536, 2048],
        tick: String,
        quota: 2048,
        reserved: [1024, 1024],
        used: 2048,
        values: ['2048', '2048 = 2 × 1024', 'bis 2048, im Leerlauf weniger'],
      },
    ],
    note: 'Die Quota begrenzt nur, was reserviert ist. Mit 2 von 2 VMs lehnt OpenNebula eine dritte VM ab.',
  },
  en: {
    title: 'Quota, reservation and use',
    desc:
      'The group praxis has the course values and the VMs praxis-1 and praxis-2 from the template ubuntu. For ' +
      'CPU the quota allows 1.5. On the nodes the VMs reserve 1.0, 0.5 each. Under load they use up to 2.0, ' +
      'because each VM has a full virtual CPU. For memory the quota allows 2048 MB. The two VMs reserve exactly ' +
      'that with 1024 MB each and use at most as much, less when idle. Notice that the quota only counts what ' +
      'is reserved and does not limit how hard the VMs work their CPU. With 2 of 2 VMs, OpenNebula rejects a ' +
      'third VM.',
    group: 'Group',
    groupMeta: 'praxis-1 and praxis-2 from the template ubuntu',
    rows: ['Quota', 'Reserved', 'Used'],
    charts: [
      {
        name: 'CPU',
        unit: 'in cores',
        max: 2,
        ticks: [0, 0.5, 1, 1.5, 2],
        tick: String,
        quota: 1.5,
        reserved: [0.5, 0.5],
        used: 2,
        values: ['1.5', '1.0 = 2 × 0.5', 'up to 2.0 = 2 × VCPU 1'],
      },
      {
        name: 'Memory',
        unit: 'in MB',
        max: 2048,
        ticks: [0, 512, 1024, 1536, 2048],
        tick: String,
        quota: 2048,
        reserved: [1024, 1024],
        used: 2048,
        values: ['2048', '2048 = 2 × 1024', 'up to 2048, less when idle'],
      },
    ],
    note: 'The quota only limits what is reserved. With 2 of 2 VMs, OpenNebula rejects a third VM.',
  },
};

function quota(lang) {
  const t = QUOTA[lang];
  const id = `p3c2-quota-${lang}`;
  // Bars start after the row names, every chart has a scale of its own
  const x0 = 152;
  const span = 352;
  const valueX = x0 + span + 20;
  const body = [band(16, 16, 728, 340, 1), heading(32, 40, t.group, 'praxis'), meta(728, 40, t.groupMeta, 'end')];
  t.charts.forEach((c, i) => {
    const top = 56 + i * 136;
    const at = (v) => x0 + (v / c.max) * span;
    body.push(`<rect class="d-shadow" x="32" y="${top + 1.5}" width="696" height="120" rx="10"/>`);
    body.push(`<rect class="d-tile" x="32" y="${top}" width="696" height="120" rx="10"/>`);
    body.push(text(48, top + 24, c.name, 'd-title'));
    body.push(meta(48 + measure(c.name, SIZE.title, { bold: true }) + 8, top + 24, c.unit));
    // Grid and scale under the bars
    c.ticks.forEach((v) => {
      body.push(`<path class="d-grid" d="M ${at(v)} ${top + 34} L ${at(v)} ${top + 96}"/>`);
      body.push(text(at(v), top + 110, c.tick(v), 'd-meta', 'middle'));
    });
    const rows = [top + 38, top + 58, top + 78];
    t.rows.forEach((name, r) => body.push(note(48, rows[r] + 10, name)));
    body.push(bar(x0, rows[0], at(c.quota) - x0, 12, 'd-fill-blue'));
    let x = x0;
    c.reserved.forEach((v, k) => {
      // One segment per VM with a small gap between them
      const w = (v / c.max) * span - (k < c.reserved.length - 1 ? 2 : 0);
      body.push(bar(x, rows[1], w, 12, 'd-fill-violet'));
      x += (v / c.max) * span;
    });
    body.push(bar(x0, rows[2], at(c.used) - x0, 12, 'd-fill-teal'));
    // The limit of the quota across all three rows
    body.push(line([[at(c.quota), top + 32], [at(c.quota), top + 96]], { accent: true, dashed: true }));
    c.values.forEach((v, r) => {
      check(v, 728 - 16 - valueX);
      body.push(note(valueX, rows[r] + 10, v));
    });
  });
  check(t.note, 696);
  body.push(note(32, 340, t.note));
  return figure({ id, width: 760, height: 372, title: t.title, desc: t.desc, body });
}

const SHOWBACK = {
  de: {
    title: 'Die Berechnung des Showbacks',
    desc:
      'Links oben liefert das Accounting von OpenNebula die Laufzeit der VM treuhand-1, 720 Stunden in einem ' +
      'Monat. Daneben stehen die Preise pro Stunde aus der Vorlage ubuntu. oneshowback calculate rechnet daraus ' +
      'CPU-Stunden, MB-Stunden des Arbeitsspeichers und MB-Stunden der Disk und multipliziert sie mit CPU_COST, ' +
      'MEMORY_COST und DISK_COST. Das ergibt 18.00, 14.75 und 2.58 Franken, zusammen 35.33 Franken für die VM ' +
      'im Monat. Rechts unten listet oneshowback list -g treuhand die Kosten jeder VM der Gruppe, zusammen ' +
      'ergeben sie den Showback des Mitglieds. Ein Gruppenadmin sieht dabei nur die VMs seiner Gruppe. Achte ' +
      'darauf, dass jede Zeile mit denselben 720 Stunden rechnet, der Zeit, in der die VM Ressourcen auf einem ' +
      'Host belegt.',
    acct: 'Accounting',
    acctMeta: 'pro VM',
    vm: ['treuhand-1', 'Laufzeit im Monat', '720 h'],
    prices: 'Preise',
    pricesMeta: 'pro Stunde',
    tpl: ['Vorlage ubuntu', 'aus costs.tpl'],
    calc: 'oneshowback calculate',
    head: ['Ressource', 'Menge × Stunden', 'Preis', 'Franken'],
    rows: [
      ['CPU', '0.5 × 720 = 360', '× 0.05', '18.00'],
      ['Arbeitsspeicher', '1024 × 720 = 737280', '× 0.00002', '14.75'],
      ['Disk', '3584 × 720 = 2580480', '× 0.000001', '2.58'],
    ],
    sum: ['treuhand-1 im Monat', '35.33'],
    showback: 'Showback',
    list: 'oneshowback list -g treuhand',
    group: ['Gruppe treuhand', 'Summe ihrer VMs'],
    own: ['Ein Gruppenadmin sieht damit', 'nur die VMs seiner Gruppe.'],
  },
  en: {
    title: 'The showback calculation',
    desc:
      'At the top left the accounting of OpenNebula supplies the running time of the VM treuhand-1, 720 hours in ' +
      'one month. Next to it are the hourly prices from the template ubuntu. oneshowback calculate turns these ' +
      'into CPU hours, MB hours of memory and MB hours of disk and multiplies them by CPU_COST, MEMORY_COST and ' +
      'DISK_COST. That gives 18.00, 14.75 and 2.58 francs, together 35.33 francs for the VM in one month. At the ' +
      'bottom right, oneshowback list -g treuhand lists the cost of every VM of the group, and together they make ' +
      "up the member's showback. A group admin only sees the VMs of their own group. Notice that every row uses " +
      'the same 720 hours, the time in which the VM holds resources on a host.',
    acct: 'Accounting',
    acctMeta: 'per VM',
    vm: ['treuhand-1', 'running time', '720 h'],
    prices: 'Prices',
    pricesMeta: 'per hour',
    tpl: ['Template ubuntu', 'from costs.tpl'],
    calc: 'oneshowback calculate',
    head: ['Resource', 'Amount × hours', 'Price', 'Francs'],
    rows: [
      ['CPU', '0.5 × 720 = 360', '× 0.05', '18.00'],
      ['Memory', '1024 × 720 = 737280', '× 0.00002', '14.75'],
      ['Disk', '3584 × 720 = 2580480', '× 0.000001', '2.58'],
    ],
    sum: ['treuhand-1 in a month', '35.33'],
    showback: 'Showback',
    list: 'oneshowback list -g treuhand',
    group: ['Group treuhand', 'sum of its VMs'],
    own: ['A group admin only sees the', 'VMs of their own group.'],
  },
};

function showback(lang) {
  const t = SHOWBACK[lang];
  const id = `p3c3-showback-${lang}`;
  // Columns of the bill in the middle, numbers end at the right edge of their column
  const bill = { x: 32, y: 196, w: 444, h: 148 };
  const cols = [bill.x + 16, bill.x + 128, bill.x + 284, bill.x + bill.w - 16];
  const rowY = (r) => bill.y + 50 + r * 24;
  const sumY = rowY(2) + 32;
  const body = [
    // Sources of the calculation
    band(16, 16, 224, 112, 1),
    label(32, 40, t.acct),
    meta(224, 40, t.acctMeta, 'end'),
    band(264, 16, 228, 112, 1),
    label(280, 40, t.prices),
    meta(476, 40, t.pricesMeta, 'end'),
    // The calculation itself
    band(16, 164, 476, 196, 2),
    note(32, 188, t.calc, 'start', { code: true }),
    // Running time and prices go into the bill
    arrow(id, [[208, 112], [208, bill.y - 2]], { accent: true }),
    arrow(id, [[360, 112], [360, bill.y - 2]], { accent: true }),
    tile(32, 52, 192, 60, ...t.vm.slice(0, 2), { icon: 'vm', tone: 'violet', detail: t.vm[2] }),
    tile(280, 52, 196, 60, ...t.tpl, { icon: 'coin' }),
    `<rect class="d-shadow" x="${bill.x}" y="${bill.y + 1.5}" width="${bill.w}" height="${bill.h}" rx="10"/>`,
    `<rect class="d-tile" x="${bill.x}" y="${bill.y}" width="${bill.w}" height="${bill.h}" rx="10"/>`,
  ];
  t.head.forEach((h, c) => body.push(text(cols[c], bill.y + 24, h, 'd-meta', c === 3 ? 'end' : 'start')));
  t.rows.forEach(([name, hours, price, cost], r) => {
    body.push(note(cols[0], rowY(r), name));
    body.push(note(cols[1], rowY(r), hours, 'start', { code: true }));
    body.push(note(cols[2], rowY(r), price, 'start', { code: true }));
    body.push(note(cols[3], rowY(r), cost, 'end', { code: true }));
  });
  body.push(`<path class="d-axis" d="M ${cols[0]} ${rowY(2) + 10} L ${cols[3]} ${rowY(2) + 10}"/>`);
  body.push(text(cols[0], sumY, t.sum[0], 'd-title'));
  body.push(text(cols[3], sumY, t.sum[1], 'd-title', 'end'));
  // The showback of the group collects the costs of its VMs
  body.push(band(516, 164, 228, 196, 1));
  body.push(label(532, 188, t.showback));
  check(t.list, 196, { mono: true });
  body.push(note(532, 206, t.list, 'start', { code: true }));
  t.own.forEach((l, k) => {
    check(l, 196);
    body.push(note(532, 234 + k * 16, l));
  });
  body.push(arrow(id, [[bill.x + bill.w, sumY - 4], [530, sumY - 4]], { accent: true }));
  body.push(tile(532, sumY - 27, 196, 46, ...t.group, { icon: 'group' }));
  return figure({ id, width: 760, height: 376, title: t.title, desc: t.desc, body });
}

const ROLES = {
  de: {
    title: 'Rollen und Ansichten in Sunstone',
    desc:
      'Links steht das Plattform-Team als oneadmin mit der Ansicht admin. Es betreibt Knoten, Netze und ' +
      'Datastores, legt die Mitglieder mit ihren Admins an, setzt Quotas und Preise und pflegt die gemeinsame ' +
      'Vorlage ubuntu. Rechts steht das Mitglied praxis. Sein Gruppenadmin praxis-admin hat die Ansicht ' +
      'groupadmin. Er legt die Benutzer der Gruppe an, verwaltet alle VMs der Gruppe, setzt die Quotas seiner ' +
      'Benutzer und kopiert Vorlagen. Die Vorlage ubuntu darf er nicht ändern. Die MPA praxis-mpa hat die Ansicht ' +
      'cloud. Sie startet VMs aus fertigen Vorlagen und passt höchstens Grösse und Disks an. Ihre VMs zählen ' +
      'gegen die Quota der Gruppe. Achte auf die Zeile unten. Eine Ansicht blendet nur Reiter aus. Ob ein Auftrag ' +
      'erlaubt ist, entscheiden die Rechte und die ACLs.',
    team: 'Plattform-Team',
    member: 'Mitglied',
    memberMeta: 'Praxis Rosenweg',
    view: 'Ansicht',
    roles: [
      {
        name: 'oneadmin',
        sub: 'darf alles',
        items: ['Betreibt Knoten, Netze, Datastores', 'Legt Mitglieder mit Admins an', 'Setzt Quotas und Preise', 'Pflegt die Vorlage ubuntu'],
        view: 'admin',
        sees: 'Alles, auch Hosts und VDCs',
      },
      {
        name: 'praxis-admin',
        sub: 'Gruppenadmin',
        items: ['Legt Benutzer der Gruppe an', 'Verwaltet alle VMs der Gruppe', 'Setzt Quotas seiner Benutzer', 'Kopiert ubuntu, ändert es nicht'],
        view: 'groupadmin',
        sees: 'VMs, Images, Netze, Benutzer',
      },
      {
        name: 'praxis-mpa',
        sub: 'MPA der Praxis',
        items: ['Startet VMs aus Vorlagen', 'Passt Grösse und Disks an', 'Belegt die Quota der Gruppe'],
        view: 'cloud',
        sees: 'VMs, Vorlagen, Dienste, Konto',
      },
    ],
    api: 'Jede Ansicht nutzt dieselbe API wie die CLI. Ob ein Auftrag erlaubt ist, entscheiden die Rechte und die ACLs.',
  },
  en: {
    title: 'Roles and views in Sunstone',
    desc:
      'On the left is the platform team as oneadmin with the view admin. It runs the nodes, networks and ' +
      'datastores, creates the members with their admins, sets quotas and prices and maintains the shared ' +
      'template ubuntu. On the right is the member praxis. Its group admin praxis-admin has the view groupadmin ' +
      'and creates the users of the group, manages all VMs of the group, sets the quotas of their users and copies ' +
      'templates, but may not change the template ubuntu. The medical assistant praxis-mpa has the view cloud. ' +
      'This account starts VMs from ready-made templates and at most adjusts size and disks, and these VMs count against ' +
      "the group's quota. Look at the line at the bottom. A view only hides tabs. Permissions and ACLs decide " +
      'whether a request is allowed.',
    team: 'Platform team',
    member: 'Member',
    memberMeta: 'Praxis Rosenweg',
    view: 'View',
    roles: [
      {
        name: 'oneadmin',
        sub: 'may do anything',
        items: ['Runs nodes, networks, datastores', 'Creates members with admins', 'Sets quotas and prices', 'Maintains the template ubuntu'],
        view: 'admin',
        sees: 'Everything, hosts and VDCs too',
      },
      {
        name: 'praxis-admin',
        sub: 'group admin',
        items: ['Creates the users of the group', 'Manages all VMs of the group', 'Sets quotas for their users', 'Copies ubuntu, cannot change it'],
        view: 'groupadmin',
        sees: 'VMs, images, networks, users',
      },
      {
        name: 'praxis-mpa',
        sub: 'medical assistant',
        items: ['Starts VMs from templates', 'Adjusts size and disks', "Uses the group's quota"],
        view: 'cloud',
        sees: 'VMs, templates, services, account',
      },
    ],
    api: 'Every view uses the same API as the CLI. Permissions and ACLs decide whether a request is allowed.',
  },
};

function roles(lang) {
  const t = ROLES[lang];
  const id = `p3c4-roles-${lang}`;
  // One column per role, the two roles of the member share its band
  const cols = [
    { x: 32, w: 200 },
    { x: 280, w: 216 },
    { x: 528, w: 216 },
  ];
  const body = [
    band(16, 16, 232, 268, 1),
    label(32, 40, t.team),
    band(264, 16, 496, 268, 1),
    heading(280, 40, t.member, 'praxis'),
    meta(744, 40, t.memberMeta, 'end'),
    // oneadmin creates the group with its admin, the admin creates the users
    arrow(id, [[232, 81], [278, 81]]),
    arrow(id, [[496, 81], [526, 81]]),
  ];
  t.roles.forEach((role, i) => {
    const c = cols[i];
    body.push(tile(c.x, 56, c.w, 50, role.name, role.sub, { icon: 'user' }));
    role.items.forEach((item, k) => {
      check(item, c.w);
      body.push(note(c.x, 132 + k * 20, item));
    });
    // The view of Sunstone the role gets and what it shows
    body.push(label(c.x, 228, t.view));
    body.push(tag(c.x + labelWidth(t.view) + 8, 215, role.view));
    check(role.sees, c.w);
    body.push(note(c.x, 254, role.sees));
  });
  body.push(strip(16, 300, 744, 34, t.api));
  return figure({ id, width: 776, height: 350, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(TENANTS)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p3c1-tenants.svg'), tenants(lang));
  writeFileSync(join(dir, 'p3c2-quota.svg'), quota(lang));
  writeFileSync(join(dir, 'p3c3-showback.svg'), showback(lang));
  writeFileSync(join(dir, 'p3c4-roles.svg'), roles(lang));
}
