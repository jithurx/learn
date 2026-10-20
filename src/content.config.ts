import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const links = z.array(
  z.object({
    name: z.string(),
    url: z.string(),
    icon: z.string().optional(),
  }),
);

const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(0),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    links: links.default([]),
  }),
});

export const collections = { projects };
