import {defineCollection, z} from 'astro:content';

const learnCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    sidebar_position: z.number().optional(),
    section: z.string().optional(),
    track: z.enum(['normal', 'hard']).optional(),
    week: z.number().optional(),
    description: z.string(),
  }),
});

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    sidebar_label: z.string().optional(),
    slug: z.string().optional(),
    description: z.string(),
  }),
});

export const collections = {
  learn: learnCollection,
  projects: projectsCollection,
};
