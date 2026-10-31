/**
 * Figures of part 2, building IaaS. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/iaas.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sketch } from './sketch.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TEXT = {
  de: {
    title: 'Wie OneDeploy das Lab einrichtet',
    desc:
      'Ansible auf dem Front-end liest das Inventar und die Playbooks von OneDeploy. Es richtet das ' +
      'Front-end lokal ein, mit oned, Scheduler und FireEdge, und die beiden Knoten über SSH, mit KVM ' +
      'und libvirt.',
    inventory: 'Inventar',
    onedeploy: 'OneDeploy',
    playbooks: 'Playbooks',
    ansible: 'Ansible',
    onFe: 'auf dem Front-end',
    fe: 'Front-end',
    feSub: 'oned, Scheduler, FireEdge',
    node1: 'Knoten 1',
    node2: 'Knoten 2',
    nodeSub: 'KVM, libvirt',
    local: 'lokal',
  },
  en: {
    title: 'How OneDeploy sets up the lab',
    desc:
      'Ansible on the front-end reads the inventory and the playbooks of OneDeploy. It sets up the ' +
      'front-end locally, with oned, the scheduler and FireEdge, and the two nodes over SSH, with KVM ' +
      'and libvirt.',
    inventory: 'Inventory',
    onedeploy: 'OneDeploy',
    playbooks: 'playbooks',
    ansible: 'Ansible',
    onFe: 'on the front-end',
    fe: 'Front-end',
    feSub: 'oned, scheduler, FireEdge',
    node1: 'Node 1',
    node2: 'Node 2',
    nodeSub: 'KVM, libvirt',
    local: 'local',
  },
};

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function box(x, y, w, h, title, sub, { strong = false, code = false } = {}) {
  const parts = [`<rect class="fig-box${strong ? ' fig-box-strong' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`];
  parts.push(`<text class="fig-text" x="${x + 14}" y="${y + 24}">${escape(title)}</text>`);
  if (sub) parts.push(`<text class="${code ? 'fig-code' : 'fig-sub'}" x="${x + 14}" y="${y + 44}">${escape(sub)}</text>`);
  return parts.join('\n');
}

function deployFlow(lang) {
  const t = TEXT[lang];
  const id = `p2c2-deploy-${lang}`;
  const arrow = (d) => `<path class="fig-arrow" d="${d}" marker-end="url(#${id}-head)"/>`;
  const parts = [
    `<defs><marker id="${id}-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
      `<path class="fig-arrowhead" d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>`,
    box(20, 30, 180, 56, t.inventory, 'inventory.yml', { code: true }),
    box(20, 130, 180, 56, t.onedeploy, t.playbooks),
    box(260, 80, 160, 56, t.ansible, t.onFe, { strong: true }),
    arrow('M 200 64 L 256 98'),
    arrow('M 200 152 L 256 120'),
    box(500, 16, 200, 56, t.fe, t.feSub),
    box(500, 96, 200, 56, t.node1, t.nodeSub),
    box(500, 176, 200, 56, t.node2, t.nodeSub),
    arrow('M 420 96 L 496 50'),
    arrow('M 420 108 L 496 124'),
    arrow('M 420 120 L 496 200'),
    `<text class="fig-code" x="440" y="62">${escape(t.local)}</text>`,
    `<text class="fig-code" x="448" y="110">SSH</text>`,
    `<text class="fig-code" x="430" y="176">SSH</text>`,
  ];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 250" role="img" aria-labelledby="${id}-title ${id}-desc">`,
    `<title id="${id}-title">${escape(t.title)}</title>`,
    `<desc id="${id}-desc">${escape(t.desc)}</desc>`,
    ...parts,
    '</svg>',
    '',
  ].join('\n');
}

for (const lang of Object.keys(TEXT)) {
  const target = join(ROOT, 'site', 'src', 'assets', 'figures', lang, 'p2c2-deploy.svg');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, sketch(deployFlow(lang), 'p2c2-deploy'));
}
