/**
 * Draws the figures in the style of a sketch book. The figure scripts build their SVG
 * with rectangles and paths as before, and sketch() turns them into lines that look drawn by
 * hand, two strokes per line with a slight bend, and open arrowheads drawn at the end of an
 * arrow. An emphasized box gets hatching, inside when it holds no text, such as a bar, and as
 * a shadow beside it when it holds text, so the hatching never runs behind a label. A random generator seeded with the name of the
 * figure keeps every run identical, so CI can check that the figures are reproducible.
 * The handwriting font of the labels comes from course.css.
 */

const HATCH_GAP = 7;
const SHADOW = 7;
const SMALL_SHADOW = 4;
const HEAD_LENGTH = 9;
const HEAD_ANGLE = 0.5;

/** Seeded random numbers between 0 and 1 (mulberry32) */
function random(seedText) {
  let seed = 2166136261;
  for (const char of seedText) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value) => Math.round(value * 10) / 10;
const attr = (tag, name) => {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return match ? match[1] : undefined;
};

/** One stroke from a to b with a slight bend, as a hand draws a straight line */
function stroke(rnd, a, b, wobble) {
  const jitter = (amount) => (rnd() - 0.5) * 2 * amount;
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const bend = Math.min(2.2, length / 40) * wobble;
  const mx = (a.x + b.x) / 2 + ((b.y - a.y) / length) * jitter(bend) + jitter(0.6);
  const my = (a.y + b.y) / 2 - ((b.x - a.x) / length) * jitter(bend) + jitter(0.6);
  return `Q ${round(mx)} ${round(my)} ${round(b.x + jitter(0.5))} ${round(b.y + jitter(0.5))}`;
}

/** A rectangle drawn twice around its corners, the second time slightly off */
function sketchRect(rnd, x, y, w, h, passes) {
  const jitter = (amount) => (rnd() - 0.5) * 2 * amount;
  let d = '';
  for (let pass = 0; pass < passes; pass++) {
    const corners = [
      { x: x + jitter(1), y: y + jitter(1) },
      { x: x + w + jitter(1), y: y + jitter(1) },
      { x: x + w + jitter(1), y: y + h + jitter(1) },
      { x: x + jitter(1), y: y + h + jitter(1) },
    ];
    // A hand starts a box a little after the corner and overshoots at the end
    const start = { x: corners[0].x + 2 + jitter(1), y: corners[0].y + jitter(0.8) };
    d += `M ${round(start.x)} ${round(start.y)} `;
    let previous = start;
    for (const corner of [...corners.slice(1), corners[0]]) {
      d += `${stroke(rnd, previous, corner, 1)} `;
      previous = corner;
    }
    d += `${stroke(rnd, corners[0], { x: corners[0].x + 6 + jitter(2), y: corners[0].y + jitter(1) }, 0.5)} `;
  }
  return d.trim();
}

/** Diagonal hatching inside a rectangle, one path of short slightly uneven strokes */
function hatch(rnd, x, y, w, h, inset = 3) {
  const jitter = (amount) => (rnd() - 0.5) * 2 * amount;
  const left = x + inset;
  const top = y + inset;
  const right = x + w - inset;
  const bottom = y + h - inset;
  let d = '';
  for (let offset = HATCH_GAP; offset < right - left + bottom - top; offset += HATCH_GAP) {
    // Line x + y = left + top + offset, clipped to the inner rectangle
    const sum = left + top + offset;
    const x1 = Math.max(left, sum - bottom);
    const y1 = sum - x1;
    const x2 = Math.min(right, sum - top);
    const y2 = sum - x2;
    if (x2 - x1 < 3) continue;
    d += `M ${round(x1 + jitter(0.8))} ${round(y1 + jitter(0.8))} L ${round(x2 + jitter(0.8))} ${round(y2 + jitter(0.8))} `;
  }
  return d.trim();
}

/** The points of a path with M, L, C and z, as segments with their end points and controls */
function parsePath(d) {
  const tokens = d.match(/[MLCZz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const segments = [];
  let command = '';
  let current = { x: 0, y: 0 };
  let start = current;
  const number = () => Number(tokens.shift());
  while (tokens.length > 0) {
    if (/[MLCZz]/.test(tokens[0])) command = tokens.shift();
    if (command === 'M') {
      current = { x: number(), y: number() };
      start = current;
      segments.push({ type: 'M', to: current });
      command = 'L';
    } else if (command === 'L') {
      const to = { x: number(), y: number() };
      segments.push({ type: 'L', from: current, to });
      current = to;
    } else if (command === 'C') {
      const c1 = { x: number(), y: number() };
      const c2 = { x: number(), y: number() };
      const to = { x: number(), y: number() };
      segments.push({ type: 'C', from: current, c1, c2, to });
      current = to;
    } else if (command === 'Z' || command === 'z') {
      segments.push({ type: 'L', from: current, to: start });
      current = start;
      command = '';
    } else {
      tokens.shift();
    }
  }
  return segments;
}

/** A path drawn once with bent strokes, curves with slightly moved controls */
function sketchPath(rnd, segments, wobble) {
  const jitter = (amount) => (rnd() - 0.5) * 2 * amount;
  let d = '';
  for (const segment of segments) {
    if (segment.type === 'M') d += `M ${round(segment.to.x + jitter(0.6))} ${round(segment.to.y + jitter(0.6))} `;
    else if (segment.type === 'L') d += `${stroke(rnd, segment.from, segment.to, wobble)} `;
    else {
      const c1 = `${round(segment.c1.x + jitter(2))} ${round(segment.c1.y + jitter(2))}`;
      const c2 = `${round(segment.c2.x + jitter(2))} ${round(segment.c2.y + jitter(2))}`;
      d += `C ${c1}, ${c2}, ${round(segment.to.x + jitter(0.5))} ${round(segment.to.y + jitter(0.5))} `;
    }
  }
  return d.trim();
}

/** An open arrowhead of two short strokes at the end of the last segment */
function arrowhead(rnd, segments) {
  const last = segments[segments.length - 1];
  const tip = last.to;
  const from = last.type === 'C' ? last.c2 : last.from;
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
  const jitter = (amount) => (rnd() - 0.5) * 2 * amount;
  let d = '';
  for (const side of [-1, 1]) {
    const a = angle + Math.PI + side * (HEAD_ANGLE + jitter(0.08));
    const length = HEAD_LENGTH + jitter(1.2);
    const end = { x: tip.x + Math.cos(a) * length, y: tip.y + Math.sin(a) * length };
    d += `M ${round(tip.x)} ${round(tip.y)} ${stroke(rnd, tip, end, 0.4)} `;
  }
  return d.trim();
}

/**
 * Turns the SVG of a figure into the sketch style. key names the figure and seeds the jitter,
 * so the German and the English figure share their lines where their shapes match.
 */
export function sketch(svg, key) {
  const rnd = random(key);
  // The arrowheads are drawn by hand now, the markers are no longer needed
  let out = svg.replace(/<defs>\s*<marker[\s\S]*?<\/marker>\s*<\/defs>\n?/g, '');
  // Where the labels stand, to tell a box with text from a bar
  const labels = [...out.matchAll(/<text\b[^>]*>/g)].map((match) => ({
    x: Number(attr(match[0], 'x')),
    y: Number(attr(match[0], 'y')),
  }));

  out = out.replace(/<rect class="(fig-box[^"]*)"([^>]*)\/>/g, (tag, classes) => {
    const x = Number(attr(tag, 'x'));
    const y = Number(attr(tag, 'y'));
    const w = Number(attr(tag, 'width'));
    const h = Number(attr(tag, 'height'));
    const dashed = attr(tag, 'stroke-dasharray');
    const strong = classes.includes('fig-box-strong');
    const holdsText = labels.some((label) => label.x >= x && label.x <= x + w && label.y >= y && label.y <= y + h + 2);
    const parts = [];
    if (strong && holdsText) {
      const offset = h < 30 ? SMALL_SHADOW : SHADOW;
      parts.push(`<path class="fig-hatch" d="${hatch(rnd, x + offset, y + offset, w, h, 0)}"/>`);
    }
    parts.push(`<rect class="fig-paper" x="${x}" y="${y}" width="${w}" height="${h}"/>`);
    if (strong && !holdsText) parts.push(`<path class="fig-hatch" d="${hatch(rnd, x, y, w, h)}"/>`);
    const line = `fig-line${strong ? ' fig-line-strong' : ''}`;
    if (dashed) parts.push(`<path class="${line}" d="${sketchRect(rnd, x, y, w, h, 1)}" stroke-dasharray="${dashed}"/>`);
    else parts.push(`<path class="${line}" d="${sketchRect(rnd, x, y, w, h, 2)}"/>`);
    return parts.join('');
  });

  out = out.replace(/<path class="fig-arrow"([^>]*)\/>/g, (tag) => {
    const segments = parsePath(attr(tag, 'd'));
    const dashed = attr(tag, 'stroke-dasharray');
    const head = attr(tag, 'marker-end') ? ` ${arrowhead(rnd, segments)}` : '';
    const passes = dashed ? 1 : 2;
    let d = '';
    for (let pass = 0; pass < passes; pass++) d += `${sketchPath(rnd, segments, pass === 0 ? 1 : 0.7)} `;
    const dash = dashed ? ` stroke-dasharray="${dashed}"` : '';
    // The head gets its own path, so a dashed arrow keeps a solid head
    return `<path class="fig-arrow" d="${d.trim()}"${dash}/>${head ? `<path class="fig-arrow" d="${head.trim()}"/>` : ''}`;
  });

  return out;
}
