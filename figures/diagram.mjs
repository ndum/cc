/**
 * Building blocks of the course figures: tiles, layer bands, strips, lines and arrows with exact
 * coordinates. The figure scripts compose them, site/src/styles/course.css maps the d-* classes to
 * the theme variables of the site, so the inlined figures follow light and dark mode and use the
 * font of the pages.
 */

export const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Font sizes in px, course.css sets the same values for the d-* classes */
export const SIZE = { title: 13, small: 12, sub: 11, code: 11, label: 11 };
/** Space between a text and the border of its tile, on each side */
export const PADDING = 12;

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

/** The arrowhead every figure uses, referenced as url(#<id>-head) */
export function defs(id) {
  return (
    `<defs><marker id="${id}-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" ` +
    `orient="auto-start-reverse"><path class="d-head" d="M 0 1 L 9 5 L 0 9 z"/></marker></defs>`
  );
}

/** A light band that groups the tiles of one layer, level 1 to 4 sets the strength of the tint */
export function band(x, y, w, h, level = 1) {
  return `<rect class="d-band d-band-${level}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
}

/** A tile with a centred title and an optional subtitle, accent marks a tile with a bar on its left */
export function tile(x, y, w, h, title, sub = '', { accent = false, code = false } = {}) {
  const cx = x + w / 2;
  fit(title, w, SIZE.title, { bold: true });
  if (sub) fit(sub, w, code ? SIZE.code : SIZE.sub, { mono: code });
  const parts = [`<rect class="d-tile" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`];
  if (accent) parts.push(`<rect class="d-bar" x="${x}" y="${y}" width="4" height="${h}" rx="2"/>`);
  if (sub) {
    parts.push(`<text class="d-title" x="${cx}" y="${y + h / 2 - 3}" text-anchor="middle">${escape(title)}</text>`);
    parts.push(`<text class="${code ? 'd-code' : 'd-sub'}" x="${cx}" y="${y + h / 2 + 14}" text-anchor="middle">${escape(sub)}</text>`);
  } else {
    parts.push(`<text class="d-title" x="${cx}" y="${y + h / 2 + 5}" text-anchor="middle">${escape(title)}</text>`);
  }
  return parts.join('\n');
}

/** A flat strip across a band, for the base a layer runs on */
export function strip(x, y, w, h, text) {
  fit(text, w, SIZE.sub);
  return [
    `<rect class="d-strip" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`,
    `<text class="d-sub" x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle">${escape(text)}</text>`,
  ].join('\n');
}

/** The name of a layer or group, set in small capitals */
export function label(x, y, text, anchor = 'start') {
  return `<text class="d-label" x="${x}" y="${y}" text-anchor="${anchor}">${escape(text.toUpperCase())}</text>`;
}

/** Muted metadata under a label, such as the parts of the course that build a layer */
export function meta(x, y, text, anchor = 'start') {
  return `<text class="d-meta" x="${x}" y="${y}" text-anchor="${anchor}">${escape(text)}</text>`;
}

/** Plain secondary text */
export function note(x, y, text, anchor = 'start', { code = false } = {}) {
  return `<text class="${code ? 'd-code' : 'd-sub'}" x="${x}" y="${y}" text-anchor="${anchor}">${escape(text)}</text>`;
}

const pathOf = (points) => points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px} ${py}`).join(' ');

/** A connecting line, dashed for logical or virtual connections */
export function line(points, { dashed = false, accent = false } = {}) {
  const classes = `d-line${accent ? ' d-line-accent' : ''}${dashed ? ' d-dashed' : ''}`;
  return `<path class="${classes}" d="${pathOf(points)}"/>`;
}

/** An arrow along the points, with its head at the last point */
export function arrow(id, points) {
  return `<path class="d-arrow" d="${pathOf(points)}" marker-end="url(#${id}-head)"/>`;
}

/** The whole figure with its accessible title and description */
export function figure({ id, width, height, title, desc, body }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title ${id}-desc">`,
    `<title id="${id}-title">${escape(title)}</title>`,
    `<desc id="${id}-desc">${escape(desc)}</desc>`,
    defs(id),
    ...body,
    '</svg>',
    '',
  ].join('\n');
}
