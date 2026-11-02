/**
 * remark-learn-blocks: the course's building blocks, written as plain Markdown directives
 * (remark-directive syntax), so the pages stay readable on GitHub and never need MDX.
 *
 *   :::assignment                     the client's assignment that opens a chapter
 *   :::goals                          learning goals of a chapter
 *   :::deepdive[Title]                optional deep dive
 *   :::exercise[Level]                exercise, the label names the level
 *   :::selfcheck                      self-check questions
 *   :::solution[Optional title]       collapsible <details>, code allowed inside
 *   :::selfhost[Optional title]       collapsed <details> with steps that only a lab on an own
 *                                     hypervisor needs, so that smartlearn users can skip them
 *   :::tabs[Optional accessible name]
 *   ::tab{label="Template"}           starts a tab panel (leaf directive, no closing line)
 *   :::
 *   ::code{file="lab/prepare.sh" lines="3-9"}
 *                                     embeds a tested file of the repository, {lang} becomes de or en
 *   :::quiz                           a test whose answers are checked in the browser (src/scripts/quiz.js)
 *   ::::question{answer="object|'object'" unit="variables"}
 *
 * The outer container needs more colons than the inner one, for example a solution inside an
 * exercise is `::::exercise` around `:::solution`. Output is plain HTML, without JavaScript every
 * panel and every file is visible. Mistakes fail the build with file and line.
 */
import { existsSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

import { visit } from 'unist-util-visit';

/** UI words per language. The language comes from the folder under content/docs. */
const DEFAULT_LABELS = {
  de: {
    assignment: 'Auftrag',
    exercise: 'Aufgabe',
    solution: 'Lösung',
    deepdive: 'Exkurs',
    goals: 'Lernziele',
    selfcheck: 'Selbstcheck',
    optional: 'optional',
    tabs: 'Code-Variante',
    files: 'Dateien',
    quiz: 'Test',
    question: 'Frage',
    selfhost: 'Eigener Hypervisor',
    selfhostHint: 'Auf smartlearn überspringst du diesen Teil.',
  },
  en: {
    assignment: 'Assignment',
    exercise: 'Exercise',
    solution: 'Solution',
    deepdive: 'Deep dive',
    goals: 'Learning goals',
    selfcheck: 'Self-check',
    optional: 'optional',
    tabs: 'Code variant',
    files: 'Files',
    quiz: 'Test',
    question: 'Question',
    selfhost: 'Own hypervisor',
    selfhostHint: 'On smartlearn you skip this part.',
  },
};

/** Starlight's own :::note, :::tip, :::caution and :::danger stay untouched. */
const STARLIGHT_ASIDES = new Set(['note', 'tip', 'caution', 'danger']);
const BOXES = new Set(['assignment', 'exercise', 'deepdive', 'goals', 'selfcheck']);
const CODE_LANGUAGES = {
  '.sh': 'bash',
  '.ps1': 'powershell',
  '.py': 'python',
  '.tf': 'hcl',
  '.tftpl': 'bash',
  '.yaml': 'yaml',
  '.conf': 'ini',
  '.js': 'js',
  '.mjs': 'js',
  '.jsx': 'jsx',
  '.ts': 'ts',
  '.json': 'json',
  '.webmanifest': 'json',
  '.html': 'html',
  '.css': 'css',
  '.txt': 'text',
  '.md': 'md',
  '.yml': 'yaml',
};
/** Folders of the repository whose files a page may embed. */
const EMBED_ROOTS = ['lab', 'platform', 'checks', 'case', 'examples'];

/**
 * @param {{ root?: string, defaultLang?: string, labels?: Record<string, Record<string, string>> }} [options]
 */
export default function remarkLearnBlocks(options = {}) {
  const labels = options.labels ?? DEFAULT_LABELS;
  const defaultLang = options.defaultLang ?? 'de';
  const root = options.root ?? process.cwd();

  return function transformer(tree, file) {
    const lang = languageOf(file.path, labels, defaultLang);
    const t = labels[lang] ?? labels[defaultLang];
    let boxCount = 0;

    visit(tree, (node, index, parent) => {
      if (node.type === 'containerDirective') {
        if (node.name === 'tabs') return void transformTabs(node, file, t);
        if (node.name === 'solution') return void transformSolution(node, t);
        if (node.name === 'selfhost') return void transformSelfhost(node, t);
        if (node.name === 'quiz') return void transformQuiz(node, file, t, `lt-box-${++boxCount}`);
        // transformQuiz already turned the questions of a quiz into boxes
        if (node.name === 'question') {
          if (!node.data?.hName) file.fail('"question" is only valid directly inside "quiz".', node);
          return;
        }
        if (BOXES.has(node.name)) return void transformBox(node, t, `lt-box-${++boxCount}`);
        if (STARLIGHT_ASIDES.has(node.name)) return;
        file.fail(
          `Unknown directive ":::${node.name}". Known: assignment, goals, deepdive, exercise, selfcheck, solution, selfhost, ` +
            `tabs, quiz (and Starlight's note, tip, caution, danger).`,
          node,
        );
      }
      if (node.type === 'leafDirective' && node.name === 'code') {
        embedCode(node, file, root, lang);
        return;
      }
      // A ::tab that no :::tabs parent consumed is a mistake
      if (node.type === 'leafDirective' && node.name === 'tab') {
        file.fail('"::tab" is only valid directly inside ":::tabs".', node);
      }
    });
  };
}

/** `src/content/docs/en/...` is English, everything else uses the default (root) language. */
function languageOf(path, labels, defaultLang) {
  const match = /\/content\/docs\/([^/]+)\//.exec((path ?? '').replace(/\\/g, '/'));
  return match && match[1] in labels ? match[1] : defaultLang;
}

/** remark-directive parses the `[...]` label as a first paragraph flagged `directiveLabel`. */
function takeLabel(node) {
  const first = node.children[0];
  if (first?.type === 'paragraph' && first.data && 'directiveLabel' in first.data) {
    node.children.shift();
    return first.children;
  }
  return null;
}

function plainText(nodes) {
  return nodes.map((n) => ('value' in n ? n.value : n.children ? plainText(n.children) : '')).join('');
}

/** Title of a box: a small kind word and, if given, the label as the actual title. */
function titleChildren(kindWord, label) {
  const kind = { type: 'ltKind', data: { hName: 'span', hProperties: { className: ['lt-box-kind'] } }, children: [{ type: 'text', value: kindWord }] };
  return label ? [kind, { type: 'text', value: ' ' }, ...label] : [kind];
}

/** An id from the words of a title, lower case with hyphens, as the ids of Markdown headings */
function slugOf(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

function transformBox(node, t, boxId) {
  const kind = node.name;
  const label = takeLabel(node);
  const word = kind === 'deepdive' ? `${t.deepdive} (${t.optional})` : t[kind];
  // A deep dive with a title is a heading, so it shows in the table of contents of the page and
  // learners see the optional parts of a chapter before they read it
  const heading = kind === 'deepdive' && label !== null;
  const id = heading ? slugOf(`${t.deepdive} ${plainText(label)}`) : boxId;
  node.data = {
    hName: 'div',
    hProperties: { className: ['lt-box', `lt-${kind}`], role: 'group', ariaLabelledBy: id },
  };
  node.children.unshift({
    type: 'ltTitle',
    data: { hName: heading ? 'h3' : 'p', hProperties: { className: ['lt-box-title'], id } },
    children: titleChildren(word, label),
  });
}

function transformSolution(node, t) {
  const label = takeLabel(node);
  node.data = {
    hName: 'details',
    hProperties: {
      className: ['lt-box', 'lt-solution'],
      ...(node.attributes && 'open' in node.attributes ? { open: true } : {}),
    },
  };
  node.children.unshift({
    type: 'ltTitle',
    data: { hName: 'summary' },
    // A solution's label already says what it is, so it replaces the kind word
    children: label ?? [{ type: 'text', value: t.solution }],
  });
}

/** Steps for an own hypervisor stay closed, smartlearn users read the summary and move on */
function transformSelfhost(node, t) {
  const label = takeLabel(node);
  node.data = { hName: 'details', hProperties: { className: ['lt-box', 'lt-selfhost'] } };
  node.children.unshift({
    type: 'ltTitle',
    data: { hName: 'summary' },
    children: titleChildren(t.selfhost, label ?? [{ type: 'text', value: t.selfhostHint }]),
  });
}

/** Resolves a repository path below one of the embed roots, {lang} becomes the page language. */
function repoPath(raw, node, file, root, lang, what) {
  if (!raw) file.fail(`"::${what}" needs a path.`, node);
  const path = raw.replaceAll('{lang}', lang);
  const absolute = resolve(root, path);
  const inside = EMBED_ROOTS.some((folder) => {
    const rel = relative(resolve(root, folder), absolute);
    return rel !== '' && !rel.startsWith('..');
  });
  if (!inside) file.fail(`"::${what}" may only use files below ${EMBED_ROOTS.join(', ')}, not ${path}.`, node);
  if (!existsSync(absolute)) file.fail(`"::${what}" cannot find ${path}.`, node);
  return { path, absolute };
}

/** Keeps the lines "from-to" (1-based, inclusive) of a text. */
function pickLines(text, range, node, file) {
  if (!range) return text;
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) file.fail(`lines="${range}" must look like lines="3-9".`, node);
  const [from, to] = [Number(match[1]), Number(match[2])];
  const lines = text.split('\n');
  if (from < 1 || to < from || to > lines.length) file.fail(`lines="${range}" is outside the ${lines.length} lines of the file.`, node);
  return lines.slice(from - 1, to).join('\n');
}

function readText(absolute) {
  return readFileSync(absolute, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '');
}

/**
 * Replaces ::code{file="..."} by a code block with the content of a tested file.
 */
function embedCode(node, file, root, lang) {
  const { path, absolute } = repoPath(node.attributes?.file, node, file, root, lang, 'code');
  const name = path.split('/').at(-1);
  const value = pickLines(readText(absolute), node.attributes?.lines, node, file);
  const codeLang = CODE_LANGUAGES[extname(name)] ?? 'text';
  Object.assign(node, { type: 'code', lang: codeLang, meta: `title="${name}"`, value });
  delete node.name;
  delete node.attributes;
  delete node.children;
}

/**
 * :::quiz holds ::::question blocks. Each question becomes a numbered box that carries its answers
 * and the slug of its workshop unit, so quiz.js can check typed answers and list units to repeat.
 */
function transformQuiz(node, file, t, id) {
  const label = takeLabel(node);
  let number = 0;
  for (const child of node.children) {
    if (child.type !== 'containerDirective' || child.name !== 'question') {
      file.fail('Inside ":::quiz" only "::::question{answer=... unit=...}" blocks are allowed.', child);
    }
    const answer = child.attributes?.answer;
    if (!answer || answer.trim() === '') file.fail('A question needs an answer, alternatives separated by |, e.g. answer="object".', child);
    if (!child.attributes?.unit) file.fail('A question needs the slug of its workshop unit, e.g. unit="variables".', child);
    number += 1;
    const titleId = `${id}-q${number}`;
    child.data = {
      hName: 'div',
      hProperties: {
        className: ['lt-box', 'lt-question'],
        role: 'group',
        ariaLabelledBy: titleId,
        dataAnswer: answer,
        dataUnit: child.attributes.unit,
      },
    };
    child.children.unshift({
      type: 'ltTitle',
      data: { hName: 'p', hProperties: { className: ['lt-box-title'], id: titleId } },
      children: titleChildren(`${t.question} ${number}`, takeLabel(child)),
    });
  }
  if (number === 0) file.fail(':::quiz needs at least one ::::question.', node);
  node.data = { hName: 'lt-quiz', hProperties: { dataLabel: label ? plainText(label) : t.quiz } };
}



function slug(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function transformTabs(node, file, t) {
  const label = takeLabel(node);
  const panels = [];
  let current = null;

  for (const child of node.children) {
    if (child.type === 'leafDirective' && child.name === 'tab') {
      const text = (child.attributes?.label ?? plainText(child.children ?? [])).trim();
      if (!text) file.fail('"::tab" needs a label, e.g. ::tab{label="Template"}.', child);
      const key = slug(child.attributes?.key || text);
      if (panels.some((p) => p.key === key)) {
        file.fail(`Duplicate tab "${text}" (key "${key}") in one :::tabs group.`, child);
      }
      current = { label: text, key, children: [] };
      panels.push(current);
    } else if (current) {
      current.children.push(child);
    } else {
      file.fail('Content before the first "::tab" inside ":::tabs". Start every panel with ::tab{label="..."}.', child);
    }
  }
  if (panels.length < 2) file.fail(':::tabs needs at least two "::tab" panels.', node);

  node.data = { hName: 'lt-tabs', hProperties: { dataLabel: label ? plainText(label) : t.tabs } };
  node.children = panels.map((p) => ({
    type: 'ltPanel',
    data: { hName: 'div', hProperties: { className: ['lt-panel'], dataKey: p.key, dataLabel: p.label } },
    children: [
      // Visible label when JavaScript is off, the script hides it and builds real tabs
      {
        type: 'ltTitle',
        data: { hName: 'p', hProperties: { className: ['lt-panel-label'] } },
        children: [{ type: 'text', value: p.label }],
      },
      ...p.children,
    ],
  }));
}
