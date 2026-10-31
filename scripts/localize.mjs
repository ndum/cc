/**
 * Generates the German and English variants of every bilingual source folder.
 *
 * A folder named `_source` holds a project whose interface texts are written as [%German|English%].
 * The script writes the German variant to the sibling folder `de` and the English variant to `en`,
 * removes generated files that no longer exist in the source and never touches installed or built files.
 *
 *   node scripts/localize.mjs           write the variants
 *   node scripts/localize.mjs --check   exit 1 when a variant is out of date
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LANGUAGES = ['de', 'en'];

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Installed and built files, and the reports that Playwright writes after a run
const SKIPPED_DIRS = new Set(['node_modules', '.git', '.wiki', 'alt', 'dist', 'coverage', '.vite', '.astro', 'test-results', 'playwright-report', 'blob-report']);
const TEXT_EXTENSIONS = new Set(['.sh', '.py', '.tf', '.tftpl', '.ps1', '.conf', '.vue', '.js', '.mjs', '.cjs', '.jsx', '.ts', '.json', '.webmanifest', '.html', '.css', '.md', '.txt', '.svg', '.yaml', '.yml']);
const TEXT_NAMES = new Set(['.gitignore', '.editorconfig', '.env.example']);
// [% and %] never occur in JavaScript, Vue templates, CSS or JSON, unlike [[ and ]] in nested arrays
const PAIR = /\[%([^%|]*)\|([^%|]*)%\]/g;

/** Replaces every [%German|English%] pair by the text of one language */
export function localize(text, lang) {
  const index = LANGUAGES.indexOf(lang);
  if (index === -1) throw new Error(`Unknown language ${lang}`);
  const result = text.replace(PAIR, (_, de, en) => (index === 0 ? de : en));
  const broken = /\[%|%\]/.exec(result);
  if (broken !== null) {
    const line = result.slice(0, broken.index).split('\n').length;
    throw new Error(`Unpaired [% or %] in line ${line}, a pair is written as [%German|English%]`);
  }
  return result;
}

export function isText(path) {
  const name = path.split(/[\\/]/).at(-1);
  return TEXT_NAMES.has(name) || TEXT_EXTENSIONS.has(extname(name));
}

/** Files below a folder as paths relative to it, skipping installed and built folders */
function listFiles(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) files.push(...listFiles(join(dir, entry.name), base));
    } else {
      files.push(relative(base, join(dir, entry.name)));
    }
  }
  return files;
}

/** Every `_source` folder of the repository */
export function sourceFolders(dir = ROOT) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || SKIPPED_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.name === '_source') found.push(path);
    else found.push(...sourceFolders(path));
  }
  return found;
}

/** Expected content of every file of one language variant */
function expectedFiles(source, lang) {
  const files = new Map();
  for (const file of listFiles(source)) {
    const raw = readFileSync(join(source, file));
    if (!isText(file)) {
      files.set(file, raw);
      continue;
    }
    try {
      files.set(file, Buffer.from(localize(raw.toString('utf8'), lang), 'utf8'));
    } catch (error) {
      throw new Error(`${relative(ROOT, join(source, file))}: ${error.message}`);
    }
  }
  return files;
}

/** Writes or checks the variants of one source folder, returns the paths that differ */
function sync(source, write) {
  const differences = [];
  for (const lang of LANGUAGES) {
    const target = join(dirname(source), lang);
    const expected = expectedFiles(source, lang);
    const present = existsSync(target) ? listFiles(target) : [];
    for (const [file, content] of expected) {
      const path = join(target, file);
      if (existsSync(path) && readFileSync(path).equals(content)) continue;
      differences.push(relative(ROOT, path));
      if (write) {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
      }
    }
    for (const file of present) {
      if (expected.has(file)) continue;
      differences.push(relative(ROOT, join(target, file)));
      if (write) rmSync(join(target, file));
    }
  }
  return differences;
}

function main() {
  const check = process.argv.includes('--check');
  const differences = sourceFolders().flatMap((source) => sync(source, !check));
  const shown = differences.map((path) => path.split(sep).join('/'));
  if (check && shown.length > 0) {
    process.stderr.write(`Out of date, run node scripts/localize.mjs:\n${shown.map((path) => `  ${path}`).join('\n')}\n`);
    process.exit(1);
  }
  if (!check) process.stdout.write(shown.length === 0 ? 'All variants are up to date\n' : `${shown.length} files written or removed\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
