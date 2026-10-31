/**
 * Figures of part 1, cloud basics. Writes one SVG per language into site/src/assets/figures/<lang>/.
 *
 *   node figures/basics.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { escape, figure, label, note } from './diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TEXT = {
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
  const t = TEXT[lang];
  const id = `p1c2-responsibility-${lang}`;
  const left = 20;
  const colW = 150;
  const gap = 10;
  const top = 50;
  const rowH = 30;
  const rowGap = 4;
  const body = [];
  t.columns.forEach((name, c) => {
    const x = left + c * (colW + gap);
    body.push(label(x + colW / 2, 34, name, 'middle'));
    t.layers.forEach((layerName, r) => {
      const y = top + r * (rowH + rowGap);
      const fromBottom = t.layers.length - 1 - r;
      const provider = fromBottom < PROVIDER_LAYERS[c];
      body.push(`<rect class="${provider ? 'd-cell-provider' : 'd-tile'}" x="${x}" y="${y}" width="${colW}" height="${rowH}" rx="3"/>`);
      if (!provider) body.push(`<rect class="d-bar" x="${x}" y="${y}" width="4" height="${rowH}" rx="2"/>`);
      body.push(`<text class="${provider ? 'd-sub' : 'd-title-small'}" x="${x + colW / 2}" y="${y + rowH / 2 + 4}" text-anchor="middle">${escape(layerName)}</text>`);
    });
  });
  const legendY = top + t.layers.length * (rowH + rowGap) + 16;
  body.push(`<rect class="d-tile" x="${left}" y="${legendY}" width="28" height="16" rx="3"/>`);
  body.push(`<rect class="d-bar" x="${left}" y="${legendY}" width="4" height="16" rx="2"/>`);
  body.push(note(left + 36, legendY + 12, t.user));
  body.push(`<rect class="d-cell-provider" x="${left + 140}" y="${legendY}" width="28" height="16" rx="3"/>`);
  body.push(note(left + 176, legendY + 12, t.provider));
  return figure({ id, width: left * 2 + 4 * colW + 3 * gap, height: legendY + 30, title: t.title, desc: t.desc, body });
}

for (const lang of Object.keys(TEXT)) {
  const target = join(ROOT, 'site', 'src', 'assets', 'figures', lang, 'p1c2-responsibility.svg');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, responsibility(lang));
}
