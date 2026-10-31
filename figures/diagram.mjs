/**
 * Building blocks of the course figures: tiles, layer bands, strips, lines and arrows with exact
 * coordinates. The figure scripts compose them, site/src/styles/course.css maps the d-* classes to
 * the theme variables of the site, so the inlined figures follow light and dark mode and use the
 * font of the pages.
 */

export const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The arrowhead every figure uses, referenced as url(#<id>-head) */
export function defs(id) {
  return (
    `<defs><marker id="${id}-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" ` +
    `orient="auto-start-reverse"><path class="d-head" d="M 0 1 L 9 5 L 0 9 z"/></marker></defs>`
  );
}

/** A tinted band that groups the tiles of one layer, level 1 to 4 sets the strength of the tint */
export function band(x, y, w, h, level = 1) {
  return `<rect class="d-band d-band-${level}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
}

/** A tile with a centred title and an optional subtitle, accent marks the tile the figure is about */
export function tile(x, y, w, h, title, sub = '', { accent = false, code = false } = {}) {
  const cx = x + w / 2;
  const parts = [`<rect class="d-tile${accent ? ' d-tile-accent' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`];
  if (sub) {
    parts.push(`<text class="d-title" x="${cx}" y="${y + h / 2 - 3}" text-anchor="middle">${escape(title)}</text>`);
    parts.push(`<text class="${code ? 'd-code' : 'd-sub'}" x="${cx}" y="${y + h / 2 + 13}" text-anchor="middle">${escape(sub)}</text>`);
  } else {
    parts.push(`<text class="d-title" x="${cx}" y="${y + h / 2 + 4.5}" text-anchor="middle">${escape(title)}</text>`);
  }
  return parts.join('\n');
}

/** A flat strip across a band, for the base a layer runs on */
export function strip(x, y, w, h, text) {
  return [
    `<rect class="d-strip" x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>`,
    `<text class="d-sub" x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle">${escape(text)}</text>`,
  ].join('\n');
}

/** A label in the strong style, for the names of layers and groups */
export function label(x, y, text, anchor = 'start') {
  return `<text class="d-label" x="${x}" y="${y}" text-anchor="${anchor}">${escape(text)}</text>`;
}

/** Plain secondary text */
export function note(x, y, text, anchor = 'start', { code = false } = {}) {
  return `<text class="${code ? 'd-code' : 'd-sub'}" x="${x}" y="${y}" text-anchor="${anchor}">${escape(text)}</text>`;
}

/** A pill with a short tag such as the part of the course */
export function tag(x, y, text, width = 92) {
  return [
    `<rect class="d-tag" x="${x}" y="${y}" width="${width}" height="20" rx="10"/>`,
    `<text class="d-tag-text" x="${x + width / 2}" y="${y + 14}" text-anchor="middle">${escape(text)}</text>`,
  ].join('\n');
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
