// Numbers the parts and their chapters in the navigation, such as «2 IaaS aufbauen» and
// «2.2 Installation mit OneDeploy», so a reference to chapter 1.4 is easy to find. The page
// titles keep their wording. The competence grid closes a part with the next number, the groups
// without a part stay unnumbered.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

const PARTS = ['start', 'basics', 'iaas', 'tenants', 'platform', 'observability', 'operations'];

/** Number of the part a link belongs to, or -1 */
function partOf(href) {
  const folder = href.split('/').filter(Boolean).find((segment) => PARTS.includes(segment));
  return folder === undefined ? -1 : PARTS.indexOf(folder);
}

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const numbered = new Map();
  for (const group of route.sidebar) {
    if (group.type !== 'group') continue;
    let part = -1;
    let chapter = 0;
    for (const link of group.entries) {
      if (link.type !== 'link') continue;
      const number = partOf(link.href);
      if (number < 0) continue;
      part = number;
      chapter += 1;
      link.label = `${part}.${chapter} ${link.label}`;
      numbered.set(link.href, link.label);
    }
    if (part >= 0) group.label = `${part} ${group.label}`;
  }
  // The links to the previous and the next page show the same numbers
  for (const key of ['prev', 'next']) {
    const link = route.pagination[key];
    if (link && numbered.has(link.href)) link.label = numbered.get(link.href);
  }
});
