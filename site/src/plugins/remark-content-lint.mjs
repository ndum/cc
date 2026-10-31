/**
 * remark-content-lint: turns silent Markdown accidents into build errors with file and line.
 * Plain Markdown never fails on these, it just renders wrong.
 *
 * 1. A stray "<" that opens an HTML tag.
 *      "wenn a<b und c>d gilt"  ->  CommonMark reads <b und c> as a tag and the rest of the page
 *    turns bold. Component names in prose such as <ItemCard> do the same.
 *    Rule: raw HTML may only use tags on the allow-list below. Write `<ItemCard>` as inline code.
 *
 * 2. A heading made only of inline code.
 *      "## `defineProps`"  ->  the heading id becomes a bare word and the table of contents reads
 *    like code. Rule: a heading names the subject in words and may contain code next to them.
 */
import { visit } from 'unist-util-visit';

/** Raw HTML this course actually uses. Extend in astro.config.mjs when needed. */
const DEFAULT_ALLOWED_TAGS = [
  // prose-level
  'a', 'br', 'abbr', 'kbd', 'mark', 'sub', 'sup', 'span', 'div', 'details', 'summary',
  // tables written as HTML
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'p',
  // custom elements of this course
  'cc-params',
];

/** @param {{ allowedTags?: string[] }} [options] */
export default function remarkContentLint(options = {}) {
  const allowed = new Set(options.allowedTags ?? DEFAULT_ALLOWED_TAGS);

  return function transformer(tree, file) {
    visit(tree, (node) => {
      if (node.type === 'html') {
        for (const [, name] of node.value.matchAll(/<\/?([A-Za-z][A-Za-z0-9-]*)/g)) {
          if (!allowed.has(name.toLowerCase())) {
            file.fail(
              `Raw HTML tag <${name}> is not on the allow-list. A "<" followed by a letter starts a tag ` +
                'in Markdown. Write component names as inline code, for example `<ItemCard>`, or &lt; for a literal "<".',
              node,
            );
          }
        }
      }

      if (node.type === 'heading' && node.children.length > 0 && node.children.every((child) => child.type === 'inlineCode')) {
        file.fail('A heading made only of code names no subject. Write the subject in words, code may follow.', node);
      }
    });
  };
}
