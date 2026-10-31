/**
 * Figures of part 0, start. Writes one SVG per language into site/src/assets/figures/<lang>/.
 * Colours come from classes that site/src/styles/course.css maps to the theme variables of the
 * site, so the inlined figures follow light and dark mode.
 *
 *   node figures/start.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sketch } from './sketch.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TEXT = {
  de: {
    title: 'Das Lab mit drei VMs und zwei Netzen',
    desc:
      'Das Front-end und zwei Knoten hängen im Labnetz mit festen Adressen. Auf jedem Knoten laufen ' +
      'VMs der Cloud. Diese VMs und das Front-end teilen ein internes VXLAN-Netz. Das Front-end ist ' +
      'dessen Gateway und leitet den Verkehr mit NAT ins Internet.',
    internet: 'Internet',
    fe: 'Front-end',
    feSub: 'Gateway, Weboberfläche',
    node1: 'Knoten 1',
    node2: 'Knoten 2',
    kvm: 'KVM',
    vm: 'VM',
    labNet: 'Labnetz, feste Adressen',
    innerNet: 'internes Netz (VXLAN), zum Beispiel 172.28.217.0/24',
  },
  en: {
    title: 'The lab with three VMs and two networks',
    desc:
      'The front-end and two nodes sit on the lab network with fixed addresses. VMs of the cloud run ' +
      'on every node. These VMs and the front-end share an internal VXLAN network. The front-end is ' +
      'its gateway and forwards its traffic to the internet with NAT.',
    internet: 'Internet',
    fe: 'Front-end',
    feSub: 'gateway, web interface',
    node1: 'Node 1',
    node2: 'Node 2',
    kvm: 'KVM',
    vm: 'VM',
    labNet: 'lab network, fixed addresses',
    innerNet: 'internal network (VXLAN), for example 172.28.217.0/24',
  },
};

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function box(x, y, w, h, title, sub, strong = false) {
  const parts = [`<rect class="fig-box${strong ? ' fig-box-strong' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`];
  parts.push(`<text class="fig-text" x="${x + 14}" y="${y + 26}">${escape(title)}</text>`);
  if (sub) parts.push(`<text class="fig-sub" x="${x + 14}" y="${y + 48}">${escape(sub)}</text>`);
  return parts.join('\n');
}

function labMap(lang) {
  const t = TEXT[lang];
  const id = `p0c2-lab-${lang}`;
  const line = (d, dashed = false) => `<path class="fig-arrow" d="${d}"${dashed ? ' stroke-dasharray="6 5"' : ''}/>`;
  const arrow = (d) => `<path class="fig-arrow" d="${d}" marker-end="url(#${id}-head)"/>`;
  const vms = [
    { x: 296, node: 1 },
    { x: 384, node: 1 },
    { x: 526, node: 2 },
    { x: 614, node: 2 },
  ];
  const parts = [
    `<defs><marker id="${id}-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
      `<path class="fig-arrowhead" d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>`,
    box(40, 16, 200, 40, t.internet, ''),
    // NAT from the front-end to the internet
    arrow('M 110 130 L 110 60'),
    `<text class="fig-code" x="120" y="100">NAT</text>`,
    // The lab network joins the three VMs
    line('M 200 112 L 600 112'),
    line('M 200 112 L 200 130'),
    line('M 370 112 L 370 130'),
    line('M 600 112 L 600 130'),
    `<text class="fig-sub" x="390" y="102">${escape(t.labNet)}</text>`,
    box(40, 130, 200, 70, t.fe, t.feSub, true),
    box(280, 130, 190, 140, t.node1, t.kvm),
    box(510, 130, 190, 140, t.node2, t.kvm),
    ...vms.map((vm) => `<rect class="fig-box" x="${vm.x}" y="${206}" width="74" height="40" rx="4"/>` +
      `\n<text class="fig-text" x="${vm.x + 37}" y="${231}" text-anchor="middle">${t.vm}</text>`),
    // The internal network joins the front-end and the VMs of the cloud
    line('M 110 200 L 110 300', true),
    ...vms.map((vm) => line(`M ${vm.x + 37} 246 L ${vm.x + 37} 300`, true)),
    line(`M 110 300 L ${vms.at(-1).x + 37} 300`, true),
    `<text class="fig-sub" x="40" y="326">${escape(t.innerNet)}</text>`,
  ];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 340" role="img" aria-labelledby="${id}-title ${id}-desc">`,
    `<title id="${id}-title">${escape(t.title)}</title>`,
    `<desc id="${id}-desc">${escape(t.desc)}</desc>`,
    ...parts,
    '</svg>',
    '',
  ].join('\n');
}

const ARCH = {
  de: {
    title: 'Die Zielarchitektur des Kurses',
    desc:
      'Fünf Schichten übereinander. Unten laufen drei Lab-VMs mit Ubuntu auf SmartLearn oder Hyper-V. ' +
      'Darauf stellt OpenNebula die IaaS bereit, mit der API von oned, der Weboberfläche, Mandanten mit ' +
      'Quotas und einem internen Netz. Darüber läuft die Plattform k3s auf zwei VMs, per OpenTofu ' +
      'bereitgestellt, mit Argo CD, den Apps der Mitglieder, Prometheus, Loki und Ollama. Zuoberst nutzen ' +
      'die Mitglieder von Wolkenwerk Bern die Cloud. Neben jeder Schicht steht der Teil des Kurses, der sie aufbaut.',
    members: 'Mitglieder von Wolkenwerk Bern',
    memberNames: ['Praxis', 'Treuhand', 'Veloatelier', 'Gemeinde', 'eigenes Mitglied'],
    platform: 'Plattform, k3s auf zwei VMs',
    services: [
      ['Argo CD', 'GitOps'],
      ['Webshop', 'Apps der Mitglieder'],
      ['Prometheus', 'Metriken, Alerts'],
      ['Loki', 'Logs'],
      ['Ollama', 'KI-Dienst'],
    ],
    git: 'Git-Repo',
    triage: 'KI-Triage mit Freigabe',
    iaas: 'IaaS, OpenNebula 7.4',
    iaasParts: [
      ['oned', 'API, Scheduler'],
      ['Sunstone', 'Weboberfläche'],
      ['Mandanten', 'Quotas, Showback'],
      ['internes Netz', 'VXLAN, NAT'],
      ['VMs auf KVM', 'k3s, Mitglieder'],
    ],
    tofu: 'OpenTofu',
    lab: 'Lab-VMs mit Ubuntu 26.04',
    labVms: ['Front-end', 'Knoten 1', 'Knoten 2'],
    hypervisor: 'auf SmartLearn oder Hyper-V',
    parts: ['Teil 3 und 6', 'Teil 4 und 5', 'Teil 2 und 3', 'Teil 0'],
  },
  en: {
    title: 'The target architecture of the course',
    desc:
      'Five layers on top of each other. At the bottom, three lab VMs with Ubuntu run on SmartLearn or ' +
      'Hyper-V. On them, OpenNebula provides the IaaS with the API of oned, the web interface, tenants with ' +
      'quotas and an internal network. Above it runs the platform k3s on two VMs, provisioned with OpenTofu, ' +
      'with Argo CD, the apps of the members, Prometheus, Loki and Ollama. At the top, the members of ' +
      'Wolkenwerk Bern use the cloud. Next to each layer is the part of the course that builds it.',
    members: 'Members of Wolkenwerk Bern',
    memberNames: ['practice', 'fiduciary', 'bike shop', 'municipality', 'your member'],
    platform: 'Platform, k3s on two VMs',
    services: [
      ['Argo CD', 'GitOps'],
      ['Web shop', 'apps of members'],
      ['Prometheus', 'metrics, alerts'],
      ['Loki', 'logs'],
      ['Ollama', 'AI service'],
    ],
    git: 'Git repo',
    triage: 'AI triage with approval',
    iaas: 'IaaS, OpenNebula 7.4',
    iaasParts: [
      ['oned', 'API, scheduler'],
      ['Sunstone', 'web interface'],
      ['Tenants', 'quotas, showback'],
      ['Internal network', 'VXLAN, NAT'],
      ['VMs on KVM', 'k3s, members'],
    ],
    tofu: 'OpenTofu',
    lab: 'Lab VMs with Ubuntu 26.04',
    labVms: ['Front-end', 'Node 1', 'Node 2'],
    hypervisor: 'on SmartLearn or Hyper-V',
    parts: ['parts 3 and 6', 'parts 4 and 5', 'parts 2 and 3', 'part 0'],
  },
};

function architecture(lang) {
  const t = ARCH[lang];
  const id = `p0c1-architecture-${lang}`;
  const column = (index) => 34 + index * 132;
  const band = (y, h, title, part) =>
    [
      `<rect class="fig-box" x="20" y="${y}" width="680" height="${h}" rx="8" stroke-dasharray="7 5"/>`,
      `<text class="fig-text" x="34" y="${y + 24}">${escape(title)}</text>`,
      `<text class="fig-sub" x="686" y="${y + 24}" text-anchor="end">${escape(part)}</text>`,
    ].join('\n');
  const cell = (x, y, w, h, title, sub, strong = false) =>
    [
      `<rect class="fig-box${strong ? ' fig-box-strong' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>`,
      `<text class="fig-text" x="${x + w / 2}" y="${y + (sub ? 20 : 22)}" text-anchor="middle">${escape(title)}</text>`,
      ...(sub ? [`<text class="fig-sub" x="${x + w / 2}" y="${y + 38}" text-anchor="middle">${escape(sub)}</text>`] : []),
    ].join('\n');
  const arrow = (d) => `<path class="fig-arrow" d="${d}" marker-end="url(#${id}-head)"/>`;
  const parts = [
    `<defs><marker id="${id}-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
      `<path class="fig-arrowhead" d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>`,
    band(10, 76, t.members, t.parts[0]),
    ...t.memberNames.map((name, i) => cell(column(i), 42, 124, 34, name, '')),
    band(104, 152, t.platform, t.parts[1]),
    ...t.services.map(([name, sub], i) => cell(column(i), 136, 124, 48, name, sub, name === 'Ollama')),
    cell(column(0), 204, 124, 40, t.git, ''),
    arrow(`M ${column(0) + 62} 204 L ${column(0) + 62} 188`),
    cell(column(2), 204, 388, 40, t.triage, ''),
    arrow('M 160 292 L 160 260'),
    `<text class="fig-code" x="168" y="282">${escape(t.tofu)}</text>`,
    band(296, 112, t.iaas, t.parts[2]),
    ...t.iaasParts.map(([name, sub], i) => cell(column(i), 328, 124, 48, name, sub, name === 'oned')),
    band(426, 76, t.lab, t.parts[3]),
    ...t.labVms.map((name, i) => cell(298 + i * 132, 456, 124, 34, name, '')),
    `<text class="fig-sub" x="34" y="526">${escape(t.hypervisor)}</text>`,
  ];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 540" role="img" aria-labelledby="${id}-title ${id}-desc">`,
    `<title id="${id}-title">${escape(t.title)}</title>`,
    `<desc id="${id}-desc">${escape(t.desc)}</desc>`,
    ...parts,
    '</svg>',
    '',
  ].join('\n');
}

for (const lang of Object.keys(TEXT)) {
  const target = join(ROOT, 'site', 'src', 'assets', 'figures', lang, 'p0c2-lab.svg');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, sketch(labMap(lang), 'p0c2-lab'));
}

for (const lang of Object.keys(ARCH)) {
  const target = join(ROOT, 'site', 'src', 'assets', 'figures', lang, 'p0c1-architecture.svg');
  writeFileSync(target, sketch(architecture(lang), 'p0c1-architecture'));
}
