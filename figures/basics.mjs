/**
 * Figures of part 1, cloud basics. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/basics.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { band, escape, figure, label, line, measure, meta, note, PADDING, SIZE, strip, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Stops the script when a text does not fit the width with padding on both sides */
function fits(text, width, size, options = {}) {
  const needed = measure(text, size, options) + 2 * PADDING;
  if (needed > width) {
    throw new Error(`"${text}" needs about ${Math.ceil(needed)} px but has only ${Math.floor(width)} px.`);
  }
}

/** Width of a band label, which is set with a letter spacing of 0.08 em */
const labelWidth = (text) => measure(text.toUpperCase(), SIZE.label, { bold: true }) + text.length * 0.08 * SIZE.label;

const CHARACTERISTICS = {
  de: {
    title: 'Die fünf Merkmale einer Cloud bei Wolkenwerk Bern',
    desc:
      'In der Mitte steht die Cloud von Wolkenwerk Bern auf drei Servern. Fünf Karten rundherum zeigen die ' +
      'Merkmale einer Cloud nach NIST mit je einem Beispiel aus dem Lab. Ein Mitglied startet selbst eine VM in ' +
      'Sunstone (On-demand self-service). Weboberfläche, API und SSH sind über das Netz erreichbar (Broad network ' +
      'access). Alle Mitglieder teilen sich einen Pool (Resource pooling). Der Webshop skaliert unter Last (Rapid ' +
      'elasticity). Der Showback zeigt jedem Mitglied seinen Verbrauch (Measured service). Erst mit allen fünf ' +
      'Merkmalen bilden die drei Server eine Cloud.',
    center: ['Wolkenwerk Bern', 'Cloud auf drei Servern'],
    cards: [
      ['On-demand self-service', 'Mitglied startet VM in Sunstone'],
      ['Broad network access', 'Weboberfläche, API und SSH'],
      ['Resource pooling', 'ein Pool für alle Mitglieder'],
      ['Rapid elasticity', 'Webshop skaliert unter Last'],
      ['Measured service', 'Showback pro Mitglied'],
    ],
  },
  en: {
    title: 'The five characteristics of a cloud at Wolkenwerk Bern',
    desc:
      'The cloud of Wolkenwerk Bern on three servers sits in the middle. Five cards around it show the ' +
      'characteristics of a cloud according to NIST, each with an example from the lab. A member starts a VM in ' +
      'Sunstone on its own (On-demand self-service). The web interface, the API and SSH are reachable over the ' +
      'network (Broad network access). All members share one pool (Resource pooling). The web shop scales under ' +
      'load (Rapid elasticity). Showback shows every member its usage (Measured service). Only with all five ' +
      'characteristics do the three servers form a cloud.',
    center: ['Wolkenwerk Bern', 'a cloud on three servers'],
    cards: [
      ['On-demand self-service', 'a member starts a VM in Sunstone'],
      ['Broad network access', 'web interface, API and SSH'],
      ['Resource pooling', 'one pool for all members'],
      ['Rapid elasticity', 'the web shop scales under load'],
      ['Measured service', 'showback per member'],
    ],
  },
};

// Icons of the five characteristics in the order of NIST
const CHARACTERISTIC_ICONS = ['user', 'globe', 'group', 'chart', 'coin'];

function characteristics(lang) {
  const t = CHARACTERISTICS[lang];
  const id = `p1c1-characteristics-${lang}`;
  const width = 780;
  const cardW = 236;
  const cardH = 56;
  const leftX = 24;
  const rightX = width - 24 - cardW;
  const rows = [24, 112];
  const centerW = 184;
  const centerH = 60;
  const centerX = (width - centerW) / 2;
  // The cloud sits between the two rows, the fifth card below it
  const mid = (rows[0] + rows[1] + cardH) / 2;
  const centerY = mid - centerH / 2;
  const bottomY = 204;
  const spineLeft = (leftX + cardW + centerX) / 2;
  const spineRight = (centerX + centerW + rightX) / 2;
  const rowMid = rows.map((y) => y + cardH / 2);
  const body = [];
  // Lines first, so that the cards cover their ends
  body.push(line([[leftX + cardW, rowMid[0]], [spineLeft, rowMid[0]], [spineLeft, rowMid[1]], [leftX + cardW, rowMid[1]]]));
  body.push(line([[spineLeft, mid], [centerX, mid]]));
  body.push(line([[rightX, rowMid[0]], [spineRight, rowMid[0]], [spineRight, rowMid[1]], [rightX, rowMid[1]]]));
  body.push(line([[spineRight, mid], [centerX + centerW, mid]]));
  body.push(line([[width / 2, centerY + centerH], [width / 2, bottomY]]));
  // Reading order follows NIST, row by row and the last card below the cloud
  const places = [
    [leftX, rows[0]],
    [rightX, rows[0]],
    [leftX, rows[1]],
    [rightX, rows[1]],
    [(width - cardW) / 2, bottomY],
  ];
  t.cards.forEach(([title, sub], i) => {
    const [x, y] = places[i];
    body.push(tile(x, y, cardW, cardH, title, sub, { icon: CHARACTERISTIC_ICONS[i] }));
  });
  body.push(tile(centerX, centerY, centerW, centerH, ...t.center, { icon: 'cluster', accent: true }));
  return figure({ id, width, height: bottomY + cardH + 24, title: t.title, desc: t.desc, body });
}

const RESPONSIBILITY = {
  de: {
    title: 'Geteilte Verantwortung in den Servicemodellen',
    desc:
      'Vier Spalten für den eigenen Betrieb, IaaS, PaaS und SaaS zeigen neun Schichten von Netz und Hardware ' +
      'bis zu Daten und Zugriffen. Im eigenen Betrieb betreiben die Nutzenden alle Schichten. Bei IaaS übernimmt ' +
      'der Anbieter Netz, Speicher, Server und Virtualisierung, bei PaaS zusätzlich Betriebssystem, Middleware ' +
      'und Laufzeit, bei SaaS auch die Anwendung. Daten und Zugriffe bleiben immer bei den Nutzenden.',
    columns: ['Eigener Betrieb', 'IaaS', 'PaaS', 'SaaS'],
    layers: [
      'Daten und Zugriffe',
      'Anwendung',
      'Laufzeit',
      'Middleware',
      'Betriebssystem',
      'Virtualisierung',
      'Server',
      'Speicher',
      'Netz',
    ],
    user: 'Nutzende',
    provider: 'Anbieter',
  },
  en: {
    title: 'Shared responsibility in the service models',
    desc:
      'Four columns for running it yourself, IaaS, PaaS and SaaS show nine layers from network and hardware up ' +
      'to data and access. Running it yourself, the users operate every layer. With IaaS the provider takes over ' +
      'network, storage, servers and virtualization, with PaaS also the operating system, middleware and runtime, ' +
      'with SaaS the application as well. Data and access always stay with the users.',
    columns: ['On premises', 'IaaS', 'PaaS', 'SaaS'],
    layers: [
      'Data and access',
      'Application',
      'Runtime',
      'Middleware',
      'Operating system',
      'Virtualization',
      'Servers',
      'Storage',
      'Network',
    ],
    user: 'Users',
    provider: 'Provider',
  },
};

// How many layers from the bottom the provider runs in each column
const PROVIDER_LAYERS = [0, 4, 7, 8];

function responsibility(lang) {
  const t = RESPONSIBILITY[lang];
  const id = `p1c2-responsibility-${lang}`;
  const left = 24;
  const colW = 160;
  const gap = 24;
  const top = 50;
  const rowH = 28;
  const rowGap = 6;
  const pitch = rowH + rowGap;
  const count = t.layers.length;
  const body = [];
  t.columns.forEach((name, c) => {
    const x = left + c * (colW + gap);
    const firstProvider = count - PROVIDER_LAYERS[c];
    body.push(label(x + colW / 2, 32, name, 'middle'));
    // What the provider runs is one blue band at the bottom of the column, it grows from left to right
    if (firstProvider < count) body.push(band(x, top + firstProvider * pitch, colW, (count - firstProvider) * pitch - rowGap, 2));
    t.layers.forEach((layerName, r) => {
      const y = top + r * pitch;
      const textY = y + rowH / 2 + 4;
      if (r < firstProvider) {
        // What the users run stays a white card of its own
        fits(layerName, colW, 12, { bold: true });
        body.push(`<rect class="d-shadow" x="${x}" y="${y + 1.5}" width="${colW}" height="${rowH}" rx="8"/>`);
        body.push(`<rect class="d-tile" x="${x}" y="${y}" width="${colW}" height="${rowH}" rx="8"/>`);
        body.push(`<text class="d-title-small" x="${x + colW / 2}" y="${textY}" text-anchor="middle">${escape(layerName)}</text>`);
      } else {
        fits(layerName, colW, SIZE.sub);
        body.push(note(x + colW / 2, textY, layerName, 'middle'));
      }
    });
  });
  // Legend in the style of the cells, a white card for the users and a piece of the blue band for
  // the provider, each with its word inside, so that the two stay apart in the dark mode as well
  const legendY = top + count * pitch + 18;
  const userW = Math.ceil(measure(t.user, 12, { bold: true })) + 2 * PADDING + 8;
  body.push(`<rect class="d-shadow" x="${left}" y="${legendY + 1.5}" width="${userW}" height="${rowH}" rx="8"/>`);
  body.push(`<rect class="d-tile" x="${left}" y="${legendY}" width="${userW}" height="${rowH}" rx="8"/>`);
  body.push(`<text class="d-title-small" x="${left + userW / 2}" y="${legendY + rowH / 2 + 4}" text-anchor="middle">${escape(t.user)}</text>`);
  const providerX = left + userW + 16;
  const providerW = Math.ceil(measure(t.provider, SIZE.sub)) + 2 * PADDING + 8;
  body.push(`<rect class="d-band d-band-2" x="${providerX}" y="${legendY}" width="${providerW}" height="${rowH}" rx="8"/>`);
  body.push(note(providerX + providerW / 2, legendY + rowH / 2 + 4, t.provider, 'middle'));
  return figure({ id, width: left * 2 + 4 * colW + 3 * gap, height: legendY + rowH + 22, title: t.title, desc: t.desc, body });
}

const HYPERVISORS = {
  de: {
    title: 'Hypervisoren und verschachtelte Virtualisierung',
    desc:
      'Drei Stapel nebeneinander, jeder steht auf seiner Hardware. Ein Hypervisor vom Typ 1 wie ESXi, Hyper-V ' +
      'oder KVM läuft direkt auf der Hardware. Die VMs laufen darauf. Ein Hypervisor vom Typ 2 wie VirtualBox ' +
      'oder VMware Workstation läuft als Programm in einem Betriebssystem. Im Lab sind drei Ebenen verschachtelt. ' +
      'Auf smartlearn oder einem eigenen Hypervisor laufen die Knoten als VMs. Auf den Knoten führt KVM die VMs ' +
      'deiner Cloud aus. Die Knoten sind also VMs und zugleich Hypervisoren.',
    hardware: 'Hardware',
    vm: 'VM',
    type1: { name: 'Typ 1', meta: 'direkt auf der Hardware', hypervisor: ['Hypervisor', 'ESXi, Hyper-V, KVM'] },
    type2: {
      name: 'Typ 2',
      meta: 'als Programm im Betriebssystem',
      os: 'Betriebssystem',
      hypervisor: ['Hypervisor', 'VirtualBox, VMware Workstation'],
    },
    lab: {
      name: 'Im Lab',
      meta: 'drei Ebenen verschachtelt',
      outer: ['smartlearn', 'oder eigener Hypervisor'],
      nodes: ['Knoten 1 und 2', 'VMs mit KVM'],
    },
  },
  en: {
    title: 'Hypervisors and nested virtualization',
    desc:
      'Three stacks side by side, each standing on its hardware. A type 1 hypervisor such as ESXi, Hyper-V or ' +
      'KVM runs directly on the hardware, and the VMs run on top of it. A type 2 hypervisor such as VirtualBox or ' +
      'VMware Workstation runs as a program inside an operating system. The lab nests three levels. The nodes run ' +
      'as VMs on smartlearn or on a hypervisor of your own, and on the nodes KVM runs the VMs of your cloud. The ' +
      'nodes are VMs and hypervisors at the same time.',
    hardware: 'Hardware',
    vm: 'VM',
    type1: { name: 'Type 1', meta: 'directly on the hardware', hypervisor: ['Hypervisor', 'ESXi, Hyper-V, KVM'] },
    type2: {
      name: 'Type 2',
      meta: 'a program in an operating system',
      os: 'Operating system',
      hypervisor: ['Hypervisor', 'VirtualBox, VMware Workstation'],
    },
    lab: {
      name: 'In the lab',
      meta: 'three nested levels',
      outer: ['smartlearn', 'or a hypervisor of your own'],
      nodes: ['Nodes 1 and 2', 'VMs with KVM'],
    },
  },
};

function hypervisors(lang) {
  const t = HYPERVISORS[lang];
  const id = `p1c3-hypervisors-${lang}`;
  const header = 38;
  const inner = 14;
  const cardH = 46;
  const rowGap = 12;
  const stripH = 30;
  // Every stack stands on its hardware at the same height, so that the levels line up
  const bandBottom = 16 + header + 3 * (cardH + rowGap) + stripH + 16;
  const stripY = bandBottom - 16 - stripH;
  const rowY = (level) => stripY - (level + 1) * (cardH + rowGap);
  // A layer is a card with an icon or a pair of VMs, listed from the bottom up
  const stacks = [
    { x: 16, w: 220, head: t.type1, layers: [{ card: t.type1.hypervisor, icon: 'cog' }, { vms: true }] },
    {
      x: 252,
      w: 260,
      head: t.type2,
      layers: [{ card: [t.type2.os, ''], icon: 'client' }, { card: t.type2.hypervisor, icon: 'cog' }, { vms: true }],
    },
    {
      x: 528,
      w: 236,
      head: t.lab,
      layers: [{ card: t.lab.outer, icon: 'cog' }, { card: t.lab.nodes, icon: 'server', accent: true }, { vms: true }],
    },
  ];
  const body = [];
  for (const { x, w, head, layers } of stacks) {
    const top = rowY(layers.length - 1) - header;
    fits(`${head.name.toUpperCase()}  ${head.meta}`, w, SIZE.label, { bold: true });
    body.push(band(x, top, w, bandBottom - top, 1));
    body.push(label(x + inner, top + 24, head.name));
    body.push(meta(x + inner + 12 + labelWidth(head.name), top + 24, head.meta));
    body.push(strip(x + inner, stripY, w - 2 * inner, stripH, t.hardware));
    const cardW = w - 2 * inner;
    layers.forEach((layer, level) => {
      const y = rowY(level);
      if (layer.vms) {
        const vmW = (cardW - 16) / 2;
        for (const vx of [x + inner, x + inner + vmW + 16]) body.push(tile(vx, y, vmW, cardH, t.vm, '', { icon: 'vm', tone: 'violet' }));
      } else {
        body.push(tile(x + inner, y, cardW, cardH, ...layer.card, { icon: layer.icon, accent: Boolean(layer.accent) }));
      }
    });
  }
  return figure({ id, width: 780, height: bandBottom + 16, title: t.title, desc: t.desc, body });
}

const FIGURES = {
  'p1c1-characteristics': characteristics,
  'p1c2-responsibility': responsibility,
  'p1c3-hypervisors': hypervisors,
};

for (const lang of Object.keys(RESPONSIBILITY)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  for (const [name, draw] of Object.entries(FIGURES)) writeFileSync(join(dir, `${name}.svg`), draw(lang));
}
