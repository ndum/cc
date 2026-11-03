/**
 * Figures of part 3, tenants, self-service and the advanced tasks of chapter 3.5. Writes one SVG per
 * language into site/src/assets/figures/<lang>/.
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

// Chapter 3.5, the target states of the three advanced tasks. They show what runs at the end and how
// the parts work together, but no values that would answer a requirement.

/** A dimension line from x1 to x2 with end ticks and its text below, code sets the text in the monospace font */
function dimension(x1, x2, y, value, { accent = false, code = false } = {}) {
  check(value, x2 - x1 - 16, { mono: code });
  return [
    line([[x1, y], [x2, y]], { accent }),
    line([[x1, y - 5], [x1, y + 5]], { accent }),
    line([[x2, y - 5], [x2, y + 5]], { accent }),
    note((x1 + x2) / 2, y + 16, value, 'middle', { code }),
  ].join('\n');
}

const ONEFLOW = {
  de: {
    title: 'Der Dienst der Treuhand in OneFlow',
    desc:
      'Im Zielzustand von Auftrag A liest OneFlow oben auf dem Front-end die Rollen und Regeln deiner ' +
      'Dienstvorlage. Die Regeln nach Zeitplan richten sich nach der Systemzeit, die Regeln nach Last nach der ' +
      'CPU, die das Monitoring für jede VM misst. Nach diesen Werten ändert OneFlow die Kardinalität einer Rolle. Unten läuft ' +
      'der Dienst in der Gruppe treuhand. Ein Teil seiner VMs läuft immer, weitere VMs kommen nach Last oder ' +
      'Zeitplan dazu und gehen danach wieder. Daneben läuft treuhand-1, eine andere VM der Gruppe. Achte auf die ' +
      'Linien unter den VMs. Die Rolle bleibt zwischen min_vms und max_vms. Alle VMs des Dienstes passen ' +
      'zusammen mit treuhand-1 in die Quota der Treuhand.',
    fe: 'Front-end',
    template: ['Dienstvorlage', 'deine Rollen und Regeln'],
    clock: ['Systemzeit', 'Datum und Uhrzeit'],
    flow: ['OneFlow', 'prüft die Regeln', 'opennebula-flow'],
    monitor: ['Monitoring', 'CPU jeder VM'],
    rules: 'Regeln',
    schedule: 'Zeitplan',
    load: 'Last',
    cardinality: 'ändert die Kardinalität',
    group: 'Gruppe',
    service: 'Dienst',
    always: ['VMs der Rolle', 'laufen immer'],
    more: 'weitere VMs nach Last oder Zeitplan',
    other: ['treuhand-1', 'andere VM der Gruppe'],
    quota: 'Quota der Treuhand',
  },
  en: {
    title: 'The OneFlow service of the fiduciary office',
    desc:
      'In the target state of task A, OneFlow on the front-end at the top reads the roles and rules of your ' +
      'service template. Rules by schedule follow the system clock, and rules by load follow the CPU that ' +
      'monitoring measures for every VM. Based on these values OneFlow changes the cardinality of a role. At the bottom the ' +
      'service runs in the group treuhand. Some of its VMs always run, and more VMs join by load or by schedule ' +
      'and leave again afterwards. Next to them runs treuhand-1, another VM of the group. Notice the lines below ' +
      'the VMs. The role stays between min_vms and max_vms, and all VMs of the service fit into the quota of the ' +
      'fiduciary office together with treuhand-1.',
    fe: 'Front-end',
    template: ['Service template', 'your roles and rules'],
    clock: ['System clock', 'date and time'],
    flow: ['OneFlow', 'checks the rules', 'opennebula-flow'],
    monitor: ['Monitoring', 'CPU of every VM'],
    rules: 'rules',
    schedule: 'schedule',
    load: 'load',
    cardinality: 'changes the cardinality',
    group: 'Group',
    service: 'Service',
    always: ['VMs of the role', 'always running'],
    more: 'more VMs by load or by schedule',
    other: ['treuhand-1', 'another VM of the group'],
    quota: 'quota of the fiduciary office',
  },
};

function oneflow(lang) {
  const t = ONEFLOW[lang];
  const id = `p3c5-oneflow-${lang}`;
  // OneFlow sits between its three inputs, the service of the group sits below it
  const flow = { x: 312, y: 56, w: 184, h: 136 };
  const down = flow.x + flow.w / 2;
  const up = 644;
  const gapLabel = (x1, x2, y, value) => {
    check(value, x2 - x1 - 8);
    return note((x1 + x2) / 2, y, value, 'middle');
  };
  check(t.cardinality, up - down - 24);
  const body = [
    band(16, 16, 728, 196, 2),
    label(32, 40, t.fe, 'start', { tone: 'blue' }),
    // The group holds the service and its other VM, all of them count against one quota
    band(16, 252, 728, 256, 1),
    heading(32, 276, t.group, 'treuhand'),
    band(232, 292, 496, 104, 3),
    label(248, 316, t.service, 'start', { tone: 'violet' }),
    // The rules come from the service template, the time from the clock and the load from monitoring
    arrow(id, [[248, 84], [flow.x - 2, 84]]),
    gapLabel(248, flow.x, 76, t.rules),
    arrow(id, [[248, 164], [flow.x - 2, 164]]),
    gapLabel(248, flow.x, 156, t.schedule),
    arrow(id, [[560, 124], [flow.x + flow.w + 2, 124]]),
    gapLabel(flow.x + flow.w, 560, 116, t.load),
    tile(32, 56, 216, 56, ...t.template, { icon: 'doc', accent: true }),
    tile(32, 136, 216, 56, ...t.clock, { icon: 'clock' }),
    tile(flow.x, flow.y, flow.w, flow.h, t.flow[0], t.flow[1], { icon: 'sync', detail: t.flow[2] }),
    tile(560, 96, 168, 56, ...t.monitor, { icon: 'chart' }),
    // OneFlow changes the number of VMs, the VMs report their CPU to monitoring
    arrow(id, [[down, flow.y + flow.h], [down, 290]], { accent: true }),
    note(down + 8, 236, t.cardinality),
    arrow(id, [[up, 292], [up, 154]]),
    note(up + 8, 236, 'CPU', 'start', { code: true }),
    tile(32, 328, 184, 52, ...t.other, { icon: 'vm', tone: 'violet' }),
    tile(248, 328, 168, 52, ...t.always, { icon: 'vm', tone: 'violet' }),
    strip(432, 328, 280, 52, t.more),
    dimension(248, 416, 412, 'min_vms', { code: true }),
    dimension(248, 712, 444, 'max_vms', { code: true }),
    dimension(32, 728, 476, t.quota, { accent: true }),
  ];
  return figure({ id, width: 760, height: 524, title: t.title, desc: t.desc, body });
}

const REPORT = {
  de: {
    title: 'Der monatliche Bericht aus dem Showback',
    desc:
      'Im Zielzustand von Auftrag B startet oben auf dem Front-end dein Timer einmal im Monat deinen Dienst, ' +
      'eine Unit von systemd. Der Dienst führt dein Skript aus. Das Skript fragt den Showback von OpenNebula ab ' +
      'und legt den Bericht des vergangenen Monats als CSV-Datei ab, die den Monat im Namen trägt. Daneben ' +
      'berechnet der Timer opennebula-showback.timer, den OpenNebula mitbringt, den Showback täglich. Unten ' +
      'berechnest du aus dem Bericht und den Kosten eines Monats die Kostendeckung, also die Summe des Showbacks ' +
      'geteilt durch alle Kosten. Die Kosten beruhen auf deinen Annahmen. Daraus machst du dem Vorstand einen ' +
      'Vorschlag. Achte darauf, dass zwei Timer am Showback arbeiten, deiner und der von OpenNebula.',
    fe: 'Front-end',
    timer: ['Dein Timer', 'einmal im Monat'],
    unit: ['Dein Dienst', 'Unit von systemd'],
    script: ['Dein Skript', 'Showback des Vormonats'],
    oneTimer: ['Timer von OpenNebula', 'opennebula-showback.timer'],
    showback: ['Showback', 'Kosten pro VM'],
    report: ['Bericht', 'CSV, Monat im Namen'],
    starts: 'startet',
    runs: 'führt aus',
    daily: 'täglich',
    asks: 'fragt ab',
    stores: 'legt ab',
    evaluation: 'Auswertung',
    board: ['Vorstand', 'erhält deinen Vorschlag'],
    coverage: ['Kostendeckung', 'Showback durch Kosten'],
    costs: ['Kosten im Monat', 'deine Annahmen'],
  },
  en: {
    title: 'The monthly showback report',
    desc:
      'In the target state of task B, your timer on the front-end at the top starts your service, a systemd unit, ' +
      'once a month. The service runs your script, which queries the showback of OpenNebula and stores the ' +
      'report of the past month as a CSV file with the month in its name. Next to it, the timer ' +
      'opennebula-showback.timer that OpenNebula ships calculates the showback every day. At the bottom you ' +
      'calculate the cost coverage from the report and the costs of a month, the showback total divided by all ' +
      'costs. The costs rest on your assumptions. From this you make a proposal to the board. Notice that two ' +
      'timers work on the showback, yours and the one of OpenNebula.',
    fe: 'Front-end',
    timer: ['Your timer', 'once a month'],
    unit: ['Your service', 'a systemd unit'],
    script: ['Your script', 'showback of last month'],
    oneTimer: ['OpenNebula timer', 'opennebula-showback.timer'],
    showback: ['Showback', 'cost per VM'],
    report: ['Report', 'CSV, month in the name'],
    starts: 'starts',
    runs: 'runs',
    daily: 'daily',
    asks: 'queries',
    stores: 'stores',
    evaluation: 'Evaluation',
    board: ['Board', 'gets your proposal'],
    coverage: ['Cost coverage', 'showback by costs'],
    costs: ['Costs of a month', 'your assumptions'],
  },
};

function report(lang) {
  const t = REPORT[lang];
  const id = `p3c5-report-${lang}`;
  // Three columns on the front-end, the evaluation below runs back from right to left
  const gapLabel = (x1, x2, y, value) => {
    check(value, x2 - x1 - 8);
    return note((x1 + x2) / 2, y, value, 'middle');
  };
  check(t.stores, 744 - 688 - 16);
  const body = [
    band(16, 16, 728, 212, 2),
    label(32, 40, t.fe, 'start', { tone: 'blue' }),
    // Your timer starts your service, the service runs your script
    arrow(id, [[232, 84], [286, 84]]),
    gapLabel(232, 288, 76, t.starts),
    arrow(id, [[464, 84], [518, 84]]),
    gapLabel(464, 520, 76, t.runs),
    // OpenNebula calculates the showback every day, your script asks for it and stores the report
    arrow(id, [[264, 180], [310, 180]]),
    gapLabel(264, 312, 172, t.daily),
    arrow(id, [[552, 112], [552, 134], [400, 134], [400, 150]]),
    gapLabel(400, 552, 127, t.asks),
    arrow(id, [[680, 112], [680, 150]]),
    note(688, 136, t.stores),
    tile(32, 56, 200, 56, ...t.timer, { icon: 'clock', accent: true }),
    tile(288, 56, 176, 56, ...t.unit, { icon: 'cog' }),
    tile(520, 56, 208, 56, ...t.script, { icon: 'doc', accent: true }),
    tile(32, 152, 232, 56, ...t.oneTimer, { icon: 'clock', code: true }),
    tile(312, 152, 176, 56, ...t.showback, { icon: 'database' }),
    tile(520, 152, 208, 56, ...t.report, { icon: 'doc' }),
    // From the report and the costs to the coverage and on to the board
    band(16, 252, 728, 120, 1),
    label(32, 276, t.evaluation),
    arrow(id, [[624, 208], [624, 240], [388, 240], [388, 290]], { accent: true }),
    arrow(id, [[536, 320], [490, 320]]),
    arrow(id, [[288, 320], [234, 320]], { accent: true }),
    tile(32, 292, 200, 56, ...t.board, { icon: 'group' }),
    tile(288, 292, 200, 56, ...t.coverage, { icon: 'chart', accent: true }),
    tile(536, 292, 192, 56, ...t.costs, { icon: 'coin' }),
  ];
  return figure({ id, width: 760, height: 388, title: t.title, desc: t.desc, body });
}

const FAILURE = {
  de: {
    title: 'Der Ausfall eines Knotens',
    desc:
      'Im Zielzustand von Auftrag C laufen unten auf Knoten 1 und Knoten 2 VMs mehrerer Mitglieder. Ihre Disks ' +
      'liegen im Datastore system ihres Knotens. Im Beispiel ist Knoten 2 hart ausgeschaltet. Seine VMs und Disks ' +
      'sind nicht mehr erreichbar, Knoten 1 läuft weiter. Oben prüft das Monitoring auf dem Front-end die Knoten ' +
      'regelmässig und bekommt von Knoten 2 keine Antwort mehr. Rechts hältst du die Zustände mit Zeiten in ' +
      'deinem Protokoll fest. Darauf stützt sich dein Vorschlag mit Regel, Alternative und Abwägung. Er legt ' +
      'fest, wie der Scheduler neue VMs auf die Knoten verteilt. Achte darauf, dass die Disks auf dem ' +
      'ausgefallenen Knoten liegen. Solange er aus ist, kommt niemand an sie heran.',
    fe: 'Front-end',
    scheduler: ['Scheduler', 'platziert neue VMs auf den Knoten'],
    monitoring: ['Monitoring', 'prüft die Knoten regelmässig'],
    work: 'Deine Auswertung',
    proposal: ['Dein Vorschlag', 'Regel, Alternative, Abwägung'],
    log: ['Dein Protokoll', 'Zustände mit Zeiten'],
    nodes: ['Knoten 1', 'Knoten 2'],
    running: 'läuft weiter',
    off: 'hart ausgeschaltet',
    vms: ['VMs', 'der Mitglieder'],
    disks: ['Datastore system', 'Disks der VMs'],
    lostVms: 'VMs nicht erreichbar',
    lostDisks: 'Disks nicht erreichbar',
    silent: 'keine Antwort',
  },
  en: {
    title: 'The failure of a node',
    desc:
      'In the target state of task C, node 1 and node 2 at the bottom run VMs of several members, and the disks of ' +
      'these VMs live in the system datastore of their node. In the example node 2 has been switched off hard. Its VMs ' +
      'and disks can no longer be reached, while node 1 keeps running. At the top, monitoring on the front-end ' +
      'checks the nodes regularly and gets no answer from node 2 anymore. On the right you record the states ' +
      'with times in your log. Your proposal with a rule, an alternative and the trade-off builds on this log ' +
      'and decides how the scheduler places new VMs on the nodes. Notice that the disks stay on the failed node. ' +
      'As long as it is off, nobody can reach them.',
    fe: 'Front-end',
    scheduler: ['Scheduler', 'places new VMs on the nodes'],
    monitoring: ['Monitoring', 'checks the nodes regularly'],
    work: 'Your analysis',
    proposal: ['Your proposal', 'rule, alternative, trade-off'],
    log: ['Your log', 'states with times'],
    nodes: ['Node 1', 'Node 2'],
    running: 'keeps running',
    off: 'switched off hard',
    vms: ['VMs', 'of the members'],
    disks: ['System datastore', 'disks of the VMs'],
    lostVms: 'VMs out of reach',
    lostDisks: 'disks out of reach',
    silent: 'no answer',
  },
};

function failure(lang) {
  const t = FAILURE[lang];
  const id = `p3c5-failure-${lang}`;
  // The front-end and your analysis at the top, the two nodes below, node 2 is the one that fails
  const probe = 208;
  const lost = 568;
  check(t.silent, 744 - lost - 24);
  const body = [
    band(16, 16, 384, 196, 2),
    label(32, 40, t.fe, 'start', { tone: 'blue' }),
    band(424, 16, 320, 196, 1),
    label(440, 40, t.work),
    // States go into your log, the log into your proposal, the proposal into the rules of the scheduler
    arrow(id, [[384, 164], [438, 164]]),
    arrow(id, [[584, 136], [584, 114]]),
    arrow(id, [[440, 84], [386, 84]], { dashed: true }),
    tile(32, 56, 352, 56, ...t.scheduler, { icon: 'cog' }),
    tile(32, 136, 352, 56, ...t.monitoring, { icon: 'chart' }),
    tile(440, 56, 288, 56, ...t.proposal, { icon: 'doc', accent: true }),
    tile(440, 136, 288, 56, ...t.log, { icon: 'logs' }),
    // Monitoring still reaches node 1, node 2 no longer answers
    arrow(id, [[probe, 192], [probe, 250]], { accent: true }),
    line([[probe, 232], [lost, 232]], { dashed: true }),
    arrow(id, [[lost, 232], [lost, 250]], { dashed: true }),
    note(lost + 8, 246, t.silent),
  ];
  t.nodes.forEach((name, i) => {
    const x = 16 + i * 376;
    body.push(band(x, 252, 352, 120, 2), label(x + 16, 276, name, 'start', { tone: 'blue' }));
  });
  body.push(meta(352, 276, t.running, 'end'));
  body.push(tag(408 + labelWidth(t.nodes[1]) + 8, 263, t.off));
  body.push(tile(32, 292, 136, 56, ...t.vms, { icon: 'vm', tone: 'violet' }));
  body.push(tile(184, 292, 168, 56, ...t.disks, { icon: 'disk' }));
  body.push(strip(408, 292, 136, 56, t.lostVms));
  body.push(strip(560, 292, 168, 56, t.lostDisks));
  return figure({ id, width: 760, height: 388, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(TENANTS)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p3c1-tenants.svg'), tenants(lang));
  writeFileSync(join(dir, 'p3c2-quota.svg'), quota(lang));
  writeFileSync(join(dir, 'p3c3-showback.svg'), showback(lang));
  writeFileSync(join(dir, 'p3c4-roles.svg'), roles(lang));
  writeFileSync(join(dir, 'p3c5-oneflow.svg'), oneflow(lang));
  writeFileSync(join(dir, 'p3c5-report.svg'), report(lang));
  writeFileSync(join(dir, 'p3c5-failure.svg'), failure(lang));
}
