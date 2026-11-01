/**
 * Figures of part 3, tenants and self-service. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/tenants.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { arrow, band, figure, label, line, meta, note, tile } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TENANTS = {
  de: {
    title: 'Gruppen, Gruppenadmins und das VDC der Mitglieder',
    desc:
      'Oben fasst das VDC wolkenwerk die vier Gruppen praxis, treuhand, velo und gemeinde zusammen, eine pro ' +
      'Mitglied. Jede Gruppe hat einen Gruppenadmin wie praxis-admin, der in seiner Gruppe Benutzer anlegt. ' +
      'Jede Gruppe darf VMs, Images, Vorlagen und Dokumente anlegen und sieht nur ihre eigenen Objekte. Unten ' +
      'ist der Cluster 0 mit Knoten 1, Knoten 2, dem Netz cc-net und den Datastores, den das Plattform-Team ' +
      'dem VDC zuteilt.',
    vdc: 'VDC wolkenwerk',
    vdcMeta: 'eine Gruppe pro Mitglied',
    group: 'Gruppe',
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
      ['Knoten 1', 'KVM'],
      ['Knoten 2', 'KVM'],
      ['cc-net', 'internes Netz'],
      ['Datastores', 'Images, Disks'],
    ],
  },
  en: {
    title: 'Groups, group admins and the VDC of the members',
    desc:
      'At the top the VDC wolkenwerk holds the four groups praxis, treuhand, velo and gemeinde, one per member. ' +
      'Every group has a group admin such as praxis-admin who creates the users of the group. Every group may ' +
      'create VMs, images, templates and documents and only sees its own objects. At the bottom is cluster 0 ' +
      'with node 1, node 2, the network cc-net and the datastores, which the platform team assigns to the VDC.',
    vdc: 'VDC wolkenwerk',
    vdcMeta: 'one group per member',
    group: 'Group',
    members: [
      ['praxis', 'Praxis Rosenweg'],
      ['treuhand', 'Treuhand Aaregg'],
      ['velo', 'Veloatelier Matte'],
      ['gemeinde', 'Gemeinde Hinterbüel'],
    ],
    admin: 'group admin',
    users: ['Users', 'created by the admin'],
    rights: 'Every group may create VMs, images, templates and documents and only sees its own objects.',
    cluster: 'Cluster 0',
    clusterMeta: 'assigned to the VDC',
    resources: [
      ['Node 1', 'KVM'],
      ['Node 2', 'KVM'],
      ['cc-net', 'internal network'],
      ['Datastores', 'images, disks'],
    ],
  },
};

function tenants(lang) {
  const t = TENANTS[lang];
  const id = `p3c1-tenants-${lang}`;
  // Four columns of equal width inside the outer bands
  const W = 175;
  const col = (i) => 32 + i * (W + 12);
  const body = [
    band(16, 16, 768, 314, 1),
    label(32, 40, t.vdc),
    meta(768, 40, t.vdcMeta, 'end'),
  ];
  t.members.forEach(([group, name], i) => {
    const x = col(i);
    const cx = x + W / 2;
    body.push(band(x, 56, W, 234, 2));
    body.push(label(x + 12, 80, t.group));
    // Inside the group band the tiles keep 12 px to its border, the line shows who belongs to whom
    body.push(tile(x + 12, 92, W - 24, 50, group, name, { accent: true }));
    body.push(tile(x + 12, 158, W - 24, 50, `${group}-admin`, t.admin));
    body.push(tile(x + 12, 224, W - 24, 50, ...t.users));
    body.push(line([[cx, 142], [cx, 158]]));
    body.push(line([[cx, 208], [cx, 224]]));
  });
  body.push(note(400, 314, t.rights, 'middle'));
  body.push(arrow(id, [[400, 368], [400, 332]]));
  body.push(note(412, 355, 'onevdc addcluster', 'start', { code: true }));
  body.push(band(16, 370, 768, 104, 3));
  body.push(label(32, 394, t.cluster));
  body.push(meta(768, 394, t.clusterMeta, 'end'));
  t.resources.forEach(([name, sub], i) => body.push(tile(col(i), 408, W, 50, name, sub)));
  return figure({ id, width: 800, height: 490, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(TENANTS)) {
  const dir = join(ROOT, 'site', 'src', 'assets', 'figures', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'p3c1-tenants.svg'), tenants(lang));
}
