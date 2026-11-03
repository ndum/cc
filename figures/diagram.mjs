/**
 * Building blocks of the course figures: cards, bands, strips, labels, lines and arrows with exact
 * coordinates, plus a small set of line icons. The figure scripts compose them, and
 * site/src/styles/course.css maps the d-* classes to colours for light and dark mode, so the
 * inlined figures follow the theme of the site and use the font of the pages.
 */

export const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Font sizes in px, course.css sets the same values for the d-* classes */
export const SIZE = { title: 13, small: 12, sub: 11, code: 11, label: 11 };
/** Space between a text and the border of its card, on each side */
export const PADDING = 12;
/** Size of an icon in a card and the space it takes with its gap */
const ICON = 18;
const ICON_SPACE = PADDING + ICON + 10;

// Approximate advance widths of a sans-serif font as a share of the font size
const NARROW = new Set("iljtfrI.,:;'|!()[] ");
const WIDE = new Set('mwMW');

/** Estimated width of a text in px, bold adds about 6 percent, code uses a monospace advance */
export function measure(text, size, { bold = false, mono = false } = {}) {
  if (mono) return String(text).length * size * 0.6;
  let width = 0;
  for (const char of String(text)) {
    if (NARROW.has(char)) width += 0.3;
    else if (WIDE.has(char)) width += 0.86;
    else if (/[A-ZÄÖÜ]/.test(char)) width += 0.68;
    else if (/[0-9]/.test(char)) width += 0.58;
    else width += 0.55;
  }
  return width * size * (bold ? 1.06 : 1);
}

/** Stops the figure script when a text does not fit the given width with padding on both sides */
function fit(text, available, size, options = {}) {
  const needed = measure(text, size, options) + 2 * PADDING;
  if (needed > available) {
    throw new Error(`"${text}" needs about ${Math.ceil(needed)} px but has only ${Math.floor(available)} px. Widen the tile or shorten the text.`);
  }
}

/**
 * Line icons on a grid of 24, drawn with the stroke of their card. They are simple shapes of their
 * own, so the figures need no icon library.
 */
const ICONS = {
  server: '<rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/><path d="M8 7.5h.01M8 16.5h.01"/>',
  client: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  vm: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8.5" y="8.5" width="7" height="7" rx="1"/>',
  cluster: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M11 7.2 6.3 15.8M13 7.2l4.7 8.6M7.5 18h9"/>',
  container: '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  repo: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="9" r="2.5"/><path d="M6 8.5v7M18 11.5c0 3-6 2-10.5 5"/>',
  sync: '<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12A8 8 0 0 1 18.3 7.1"/><path d="M18.5 3v4.3h-4.3M5.5 21v-4.3h4.3"/>',
  chart: '<path d="M4 20h16"/><path d="M7 16v-4M12 16V8M17 16v-7"/>',
  logs: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  group: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.5"/><path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13"/><path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"/>',
  disk: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 14h.01M11 14h6"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 6l2.3 1.8M17.5 16.2l2.3 1.8M4.2 18l2.3-1.8M17.5 7.8 19.8 6M2.5 12h3M18.5 12h3"/>',
  shield: '<path d="M12 3 19 6v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  model: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/><path d="M10 10h4v4h-4z"/>',
  network: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9c-.5-1-1.5-1.5-2.5-1.5-1.7 0-2.8 1-2.8 2.2 0 2.9 5.6 1.6 5.6 4.5 0 1.2-1.2 2.3-2.8 2.3-1.1 0-2.2-.6-2.7-1.6M12 6v1.5M12 16.5V18"/>',
};

/** An icon at x, y with the given size, in the colour of the class or the card around it */
export function icon(name, x, y, size = ICON, tone = '') {
  const shape = ICONS[name];
  if (!shape) throw new Error(`Unknown icon "${name}". Known: ${Object.keys(ICONS).join(', ')}.`);
  const scale = size / 24;
  return `<g class="d-icon${tone ? ` d-icon-${tone}` : ''}" transform="translate(${x} ${y}) scale(${scale})">${shape}</g>`;
}

/** The arrowheads every figure uses, referenced as url(#<id>-head) and url(#<id>-head-accent) */
export function defs(id) {
  const head = (suffix, cls) =>
    `<marker id="${id}-${suffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" ` +
    `orient="auto-start-reverse"><path class="${cls}" d="M 0 1 L 9 5 L 0 9 z"/></marker>`;
  return `<defs>${head('head', 'd-head')}${head('head-accent', 'd-head d-head-accent')}</defs>`;
}

/**
 * A tinted band that groups the cards of one layer or one machine. Level 1 is neutral, 2 blue,
 * 3 violet and 4 teal, so neighbouring layers stay apart in light and dark mode.
 */
export function band(x, y, w, h, level = 1) {
  return `<rect class="d-band d-band-${level}" x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>`;
}

/**
 * A card with a title and an optional subtitle. Without an icon the text is centred, with an icon
 * it starts after the icon. Accent draws the card with a blue border, tone violet marks things that
 * live in an internal network such as the VMs of the cloud.
 */
export function tile(x, y, w, h, title, sub = '', { accent = false, code = false, icon: name = '', tone = '', detail = '' } = {}) {
  const left = Boolean(name);
  const space = left ? w - ICON_SPACE + PADDING : w;
  fit(title, space, SIZE.title, { bold: true });
  if (sub) fit(sub, space, code ? SIZE.code : SIZE.sub, { mono: code });
  if (detail) fit(detail, space, SIZE.code, { mono: true });
  const kind = tone ? ` d-tile-${tone}` : accent ? ' d-tile-accent' : '';
  const parts = [
    `<rect class="d-shadow" x="${x}" y="${y + 1.5}" width="${w}" height="${h}" rx="10"/>`,
    `<rect class="d-tile${kind}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`,
  ];
  if (left) parts.push(icon(name, x + PADDING, y + h / 2 - ICON / 2, ICON, tone || (accent ? 'accent' : '')));
  const tx = left ? x + ICON_SPACE : x + w / 2;
  const anchor = left ? 'start' : 'middle';
  const subClass = code ? 'd-code' : 'd-sub';
  const titleClass = `d-title${tone ? ` d-title-${tone}` : ''}`;
  if (detail) {
    // Three lines, the last one in the monospace font for an address or a name
    parts.push(`<text class="${titleClass}" x="${tx}" y="${y + h / 2 - 10}" text-anchor="${anchor}">${escape(title)}</text>`);
    parts.push(`<text class="${subClass}" x="${tx}" y="${y + h / 2 + 5}" text-anchor="${anchor}">${escape(sub)}</text>`);
    parts.push(`<text class="d-code" x="${tx}" y="${y + h / 2 + 20}" text-anchor="${anchor}">${escape(detail)}</text>`);
  } else if (sub) {
    parts.push(`<text class="${titleClass}" x="${tx}" y="${y + h / 2 - 3}" text-anchor="${anchor}">${escape(title)}</text>`);
    parts.push(`<text class="${subClass}" x="${tx}" y="${y + h / 2 + 13}" text-anchor="${anchor}">${escape(sub)}</text>`);
  } else {
    parts.push(`<text class="${titleClass}" x="${tx}" y="${y + h / 2 + 4.5}" text-anchor="${anchor}">${escape(title)}</text>`);
  }
  return parts.join('\n');
}

/** A flat strip across a band, for the base a layer runs on */
export function strip(x, y, w, h, text) {
  fit(text, w, SIZE.sub);
  return [
    `<rect class="d-strip" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`,
    `<text class="d-sub" x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle">${escape(text)}</text>`,
  ].join('\n');
}

/** The name of a layer, group or network in small capitals, tone blue or violet for networks */
export function label(x, y, text, anchor = 'start', { tone = '' } = {}) {
  const cls = `d-label${tone ? ` d-label-${tone}` : ''}`;
  return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${escape(text.toUpperCase())}</text>`;
}

/** Muted metadata under a label, such as the parts of the course that build a layer */
export function meta(x, y, text, anchor = 'start') {
  return `<text class="d-meta" x="${x}" y="${y}" text-anchor="${anchor}">${escape(text)}</text>`;
}

/** Plain secondary text, code sets it in the monospace font of the site */
export function note(x, y, text, anchor = 'start', { code = false } = {}) {
  return `<text class="${code ? 'd-code' : 'd-sub'}" x="${x}" y="${y}" text-anchor="${anchor}">${escape(text)}</text>`;
}

/** A small rounded tag such as KVM in the corner of a band */
export function tag(x, y, text, { tone = '' } = {}) {
  const w = Math.ceil(measure(text, SIZE.sub, { bold: true })) + 14;
  return [
    `<rect class="d-tag${tone ? ` d-tag-${tone}` : ''}" x="${x}" y="${y}" width="${w}" height="18" rx="9"/>`,
    `<text class="d-tag-text${tone ? ` d-tag-text-${tone}` : ''}" x="${x + w / 2}" y="${y + 12.5}" text-anchor="middle">${escape(text)}</text>`,
  ].join('\n');
}

const pathOf = (points) => points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px} ${py}`).join(' ');

/** A connecting line, accent in blue, tone violet for internal networks, dashed for virtual links */
export function line(points, { dashed = false, accent = false, tone = '' } = {}) {
  const classes = `d-line${accent ? ' d-line-accent' : ''}${tone ? ` d-line-${tone}` : ''}${dashed ? ' d-dashed' : ''}`;
  return `<path class="${classes}" d="${pathOf(points)}"/>`;
}

/** An arrow along the points, with its head at the last point, accent draws it in blue */
export function arrow(id, points, { accent = false, dashed = false } = {}) {
  const classes = `d-arrow${accent ? ' d-arrow-accent' : ''}${dashed ? ' d-dashed' : ''}`;
  return `<path class="${classes}" d="${pathOf(points)}" marker-end="url(#${id}-head${accent ? '-accent' : ''})"/>`;
}

/** The whole figure on its ground, with its accessible title and description */
export function figure({ id, width, height, title, desc, body }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title ${id}-desc">`,
    `<title id="${id}-title">${escape(title)}</title>`,
    `<desc id="${id}-desc">${escape(desc)}</desc>`,
    defs(id),
    `<rect class="d-ground" x="0" y="0" width="${width}" height="${height}" rx="14"/>`,
    ...body,
    '</svg>',
    '',
  ].join('\n');
}
