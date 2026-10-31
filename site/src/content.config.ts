import { defineCollection } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  // src/content/i18n/<lang>.json overrides Starlight's UI strings (see de-CH.json).
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
