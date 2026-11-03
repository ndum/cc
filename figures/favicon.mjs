/**
 * Favicon of the site, the letters CC in white on a rounded square in the accent colour of the
 * site. A favicon loads no web fonts, so the letters are arcs.
 *
 *   node figures/favicon.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** A letter C as an open arc around (cx, cy) */
const letterC = (cx, cy, r) => {
  const angle = (deg) => (deg * Math.PI) / 180;
  const point = (deg) => `${(cx + r * Math.cos(angle(deg))).toFixed(2)} ${(cy - r * Math.sin(angle(deg))).toFixed(2)}`;
  return `M ${point(50)} A ${r} ${r} 0 1 0 ${point(-50)}`;
};

const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
  '<rect width="32" height="32" rx="7" fill="#3e5be6"/>',
  `<path d="${letterC(11, 16, 6)} ${letterC(22, 16, 6)}" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>`,
  '</svg>',
  '',
].join('\n');

writeFileSync(join(ROOT, 'site', 'public', 'favicon.svg'), svg);
