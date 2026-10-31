/**
 * remark-inline-figures: replaces a paragraph that holds only an image of a generated figure
 * (`![alt](.../assets/figures/<lang>/name.svg)`) with the SVG itself inside a <figure>.
 *
 * Inline SVG follows the site's light and dark theme through CSS variables, which an <img>
 * cannot. The figure's own <title> and <desc> carry the accessible name and description, the
 * Markdown alt text says the same so the page stays understandable on GitHub.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { visit } from 'unist-util-visit';

export default function remarkInlineFigures() {
  return function transformer(tree, file) {
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || index === undefined || node.children.length !== 1) return;
      const image = node.children[0];
      if (image.type !== 'image' || !/\/assets\/figures\/[^/]+\/[^/]+\.svg$/.test(image.url)) return;
      const path = resolve(dirname(file.path), image.url);
      let svg;
      try {
        svg = readFileSync(path, 'utf8').trim();
      } catch {
        file.fail(`Figure ${image.url} does not exist. Run node figures/components.mjs.`, node);
      }
      parent.children[index] = { type: 'html', value: `<figure class="lt-figure fig">${svg}</figure>` };
    });
  };
}
