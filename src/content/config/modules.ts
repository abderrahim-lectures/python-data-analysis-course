import { defineCollection, z } from "astro:content";

const modulesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    section: z.string(),
    track: z.enum(["normal", "hard"]).default("normal"),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    estimatedHours: z.number().default(2),
    lessonCount: z.number().default(0),
    tags: z.array(z.string()).default([]),
    prerequisites: z.array(z.string()).default([]),
    icon: z.string().default("📚"),
  }),
});

export default modulesCollection;
