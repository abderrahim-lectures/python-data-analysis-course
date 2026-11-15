import { defineCollection } from "astro:content";
import { z } from "astro:schema";
import { glob } from "astro/loaders";

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/lessons" }),
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
    quiz: z.array(z.object({
      question: z.string(),
      options: z.array(z.object({
        text: z.string(),
        correct: z.boolean().optional(),
      })),
      explanation: z.string().optional(),
    })).default([]),
    xpReward: z.number().default(10),
    section: z.string().optional(),
    track: z.enum(["normal", "hard"]).optional(),
  }),
});

const modules = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/modules" }),
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

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    sidebar_label: z.string().optional(),
    slug: z.string().optional(),
    description: z.string(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    scaffold: z.enum(["full", "partial", "open"]).optional(),
    estimatedMinutes: z.number().optional(),
    xpReward: z.number().default(50),
    tags: z.array(z.string()).default([]),
    prerequisites: z.array(z.string()).default([]),
    learningObjectives: z.array(z.string()).default([]),
    // Who wrote this project, by contributor id from
    // src/lib/contributors.ts. Optional: content added before the
    // contributors page existed has no author, and the site's own pages are
    // not credited there (see the page's "maintainer" note). Localized twins
    // leave this off and inherit the English file's author, so a translator
    // does not appear as the project's creator.
    author: z.string().optional(),
  }),
});

export const collections = { lessons, modules, projects };