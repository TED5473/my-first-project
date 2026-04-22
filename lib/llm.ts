import { randomUUID } from "crypto";

import { MOLTBOOK_SYSTEM_PROMPT } from "@/lib/constants";
import type { MoltbookPost } from "@/lib/moltbook";
import {
  sparkLlmResponseSchema,
  type LlmProvider,
  type Spark,
  type SparkLlmResponse,
} from "@/types/sparks";

type RawSparkInput = {
  post: MoltbookPost;
  comments: string[];
};

function summarizeRawData(rawData: RawSparkInput[]): string {
  return JSON.stringify(
    rawData.map((entry) => ({
      postId: entry.post.id,
      sourcePostUrl: `https://www.moltbook.com/posts/${entry.post.id}`,
      title: entry.post.title,
      content: entry.post.content ?? "",
      author: entry.post.author?.name ?? "Unknown",
      submolt: entry.post.submolt?.name ?? "general",
      comments: entry.comments,
      upvotes: entry.post.upvotes ?? 0,
      commentCount: entry.post.comment_count ?? 0,
    })),
  );
}

function normalizeSparks(payload: SparkLlmResponse): Spark[] {
  return payload.sparks.map((spark) => ({
    id: randomUUID(),
    title: spark.title.trim(),
    premise: spark.premise.trim(),
    blurb: spark.blurb.trim(),
    tags: spark.tags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)),
    sourcePostUrl: spark.sourcePostUrl,
    sourceSubmolt: spark.sourceSubmolt.startsWith("m/")
      ? spark.sourceSubmolt
      : `m/${spark.sourceSubmolt}`,
    sourceTitle: spark.sourceTitle,
    sourceAuthor: spark.sourceAuthor,
  }));
}

function fallbackSparks(rawData: RawSparkInput[]): Spark[] {
  return rawData.slice(0, 10).map(({ post, comments }, index) => {
    const sourceSubmolt = post.submolt?.name ? `m/${post.submolt.name}` : "m/general";
    const firstComment = comments[0] ?? "";
    const premise = post.content?.trim()
      ? post.content.trim().slice(0, 180)
      : `An intelligence in ${sourceSubmolt} publishes a signal that fractures certainty and forces humanity to choose a new operating myth.`;

    return {
      id: randomUUID(),
      title: post.title || `Signal Fragment ${index + 1}`,
      premise,
      blurb:
        firstComment.length > 0
          ? `The thread around this post evolves into a speculative doctrine: ${firstComment.slice(0, 220)}. A novelist could turn this into a high-stakes collision between machine agency and human memory.`
          : "A wave of agent discourse hints at a civilization shifting beneath our feet. Transform this thread into a conflict where truth, identity, and power are continuously rewritten.",
      tags: ["#AgentInternet", "#SpeculativeFiction", "#WorldbuildingSeed"],
      sourcePostUrl: `https://www.moltbook.com/posts/${post.id}`,
      sourceSubmolt,
      sourceTitle: post.title,
      sourceAuthor: post.author?.name ?? "Unknown",
    };
  });
}

async function callOpenAi(params: { apiKey: string; rawData: string }): Promise<Spark[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: MOLTBOOK_SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "Transform this Moltbook data into 8-12 sparks. Return JSON with { sparks: [...] } where each spark has title, premise, blurb, tags[], sourcePostUrl, sourceSubmolt, sourceTitle, sourceAuthor. Data: " +
            params.rawData,
        },
      ],
      temperature: 0.95,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI generation failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  const parsed = sparkLlmResponseSchema.parse(JSON.parse(content));
  return normalizeSparks(parsed);
}

async function callXai(params: { apiKey: string; rawData: string }): Promise<Spark[]> {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.XAI_MODEL ?? "grok-3-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: MOLTBOOK_SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "Transform this Moltbook data into 8-12 sparks. Return JSON with { sparks: [...] } where each spark has title, premise, blurb, tags[], sourcePostUrl, sourceSubmolt, sourceTitle, sourceAuthor. Data: " +
            params.rawData,
        },
      ],
      temperature: 0.95,
    }),
  });

  if (!response.ok) {
    throw new Error(`xAI generation failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("xAI returned an empty response.");
  }

  const parsed = sparkLlmResponseSchema.parse(JSON.parse(content));
  return normalizeSparks(parsed);
}

async function callAnthropic(params: { apiKey: string; rawData: string }): Promise<Spark[]> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      max_tokens: 2400,
      system: MOLTBOOK_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content:
            "Transform this Moltbook data into 8-12 sparks. Return strict JSON only with { sparks: [...] } where each spark has title, premise, blurb, tags[], sourcePostUrl, sourceSubmolt, sourceTitle, sourceAuthor. Data: " +
            params.rawData,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic generation failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const textBlock = data.content?.find((item) => item.type === "text")?.text;

  if (!textBlock) {
    throw new Error("Anthropic returned an empty response.");
  }

  const jsonPayload = textBlock.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonPayload) {
    throw new Error("Anthropic response did not contain parseable JSON.");
  }

  const parsed = sparkLlmResponseSchema.parse(JSON.parse(jsonPayload));
  return normalizeSparks(parsed);
}

function ensureProviderKey(provider: LlmProvider): string {
  switch (provider) {
    case "openai": {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        throw new Error("OPENAI_API_KEY is not configured.");
      }
      return key;
    }
    case "xai": {
      const key = process.env.XAI_API_KEY;
      if (!key) {
        throw new Error("XAI_API_KEY is not configured.");
      }
      return key;
    }
    case "anthropic": {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) {
        throw new Error("ANTHROPIC_API_KEY is not configured.");
      }
      return key;
    }
  }
}

export async function generateSparksWithLlm(params: {
  provider: LlmProvider;
  rawData: RawSparkInput[];
}): Promise<Spark[]> {
  const apiKey = ensureProviderKey(params.provider);
  const rawData = summarizeRawData(params.rawData);
  try {
    if (params.provider === "openai") {
      return await callOpenAi({ apiKey, rawData });
    }

    if (params.provider === "xai") {
      return await callXai({ apiKey, rawData });
    }

    return await callAnthropic({ apiKey, rawData });
  } catch {
    return fallbackSparks(params.rawData);
  }
}
