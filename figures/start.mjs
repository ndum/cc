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

for (const lang of Object.keys(TEXT)) {
  const target = join(ROOT, 'site', 'src', 'assets', 'figures', lang, 'p0c2-lab.svg');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, sketch(labMap(lang), 'p0c2-lab'));
}
