import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro:content';

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema({
    extend: z.object({
      number: z.number().optional(),
      date: z.date().optional(),
      tags: z.array(z.string()).default([]),
      repo: z.string().url().optional(),
      recording: z.string().url().optional(),
      slides: z.string().optional(),
      pptx: z.string().optional(),
      codeZip: z.string().optional(),
      coverImage: z.string().optional(),
    }),
  }),
});

export const collections = { docs };
