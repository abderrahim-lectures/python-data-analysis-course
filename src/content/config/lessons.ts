import { defineCollection, z } from "astro:content";

const lessonsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    module: z.string(),
    order: z.number(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    estimatedMinutes: z.number().default(15),
    learningObjectives: z.array(z.string()).default([]),
    prerequisites: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    hasPlayground: z.boolean().default(true),
    hasChallenge: z.boolean().default(true),
    hasQuiz: z.boolean().default(true),
    xpReward: z.number().default(10),
    section: z.string().optional(),
    track: z.enum(["normal", "hard"]).optional(),
  }),
});

export default lessonsCollection;
