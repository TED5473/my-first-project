import { z } from "zod";

export const llmProviderSchema = z.enum(["openai", "xai", "anthropic"]);

export type LlmProvider = z.infer<typeof llmProviderSchema>;

export const sparkSchema = z.object({
  id: z.string(),
  title: z.string().min(3),
  premise: z.string().min(10),
  blurb: z.string().min(30),
  tags: z.array(z.string()).min(1),
  sourcePostUrl: z.string().url(),
  sourceSubmolt: z.string().min(2),
  sourceTitle: z.string().optional(),
  sourceAuthor: z.string().optional(),
});

export type Spark = z.infer<typeof sparkSchema>;

export const dailyDigestSchema = z.object({
  date: z.string(),
  updatedAt: z.string(),
  submolts: z.array(z.string()),
  sparks: z.array(sparkSchema).min(1),
  provider: llmProviderSchema,
});

export type DailyDigest = z.infer<typeof dailyDigestSchema>;

export const settingsSchema = z.object({
  apiKey: z.string().trim().optional(),
  provider: llmProviderSchema.default("openai"),
  submolts: z.array(z.string().trim()).min(1),
});

export type DashboardSettings = z.infer<typeof settingsSchema>;

export const notebookItemSchema = sparkSchema.extend({
  savedAt: z.string(),
});

export type NotebookItem = z.infer<typeof notebookItemSchema>;

export const sparkLlmResponseSchema = z.object({
  sparks: z.array(
    z.object({
      title: z.string(),
      premise: z.string(),
      blurb: z.string(),
      tags: z.array(z.string()).min(1),
      sourcePostUrl: z.string().url(),
      sourceSubmolt: z.string(),
      sourceTitle: z.string().optional(),
      sourceAuthor: z.string().optional(),
    }),
  ),
});

export type SparkLlmResponse = z.infer<typeof sparkLlmResponseSchema>;
