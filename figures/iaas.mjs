/**
 * Figures of part 2, building IaaS. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/iaas.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, figure, label, note, tile } from './diagram.mjs';

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

for (const lang of Object.keys(TEXT)) {
  const target = join(ROOT, 'site', 'src', 'assets', 'figures', lang, 'p2c2-deploy.svg');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, deployFlow(lang));
}
