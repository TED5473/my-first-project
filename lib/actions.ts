"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { COOKIE_NAMES, DEFAULT_SUBMOLTS } from "@/lib/constants";
import { decryptToken, encryptToken } from "@/lib/crypto";
import { generateSparksWithLlm } from "@/lib/llm";
import { fetchMoltbookComments, fetchMoltbookPosts, flattenComments } from "@/lib/moltbook";
import {
  dailyDigestSchema,
  llmProviderSchema,
  settingsSchema,
  type DailyDigest,
  type LlmProvider,
} from "@/types/sparks";
import { toSubmoltLabel } from "@/lib/utils";

const tokenPayloadSchema = z.object({
  token: z.string().trim().min(8),
});

const generateInputSchema = z.object({
  provider: llmProviderSchema,
  submolts: z.array(z.string().trim()).min(1),
});

export async function saveApiKeyAction(input: { token: string }) {
  const parsed = tokenPayloadSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please provide a valid Moltbook API token.",
    } as const;
  }

  const encrypted = encryptToken(parsed.data.token);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.encryptedToken, encrypted, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return {
    success: true,
    message: "Moltbook key encrypted and saved in secure cookie.",
  } as const;
}

export async function clearApiKeyAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.encryptedToken);

  return {
    success: true,
    message: "Encrypted Moltbook token removed.",
  } as const;
}

export async function generateTodaySparksAction(input: {
  provider: LlmProvider;
  submolts: string[];
}): Promise<{ success: true; digest: DailyDigest } | { success: false; message: string }> {
  const parsedInput = generateInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      message: "Invalid generation settings. Check provider and submolts.",
    };
  }

  const cookieStore = await cookies();
  const encryptedToken = cookieStore.get(COOKIE_NAMES.encryptedToken)?.value;

  if (!encryptedToken) {
    return {
      success: false,
      message:
        "No Moltbook API key found in secure cookie. Save your API key in Settings first.",
    };
  }

  let token = "";

  try {
    token = decryptToken(encryptedToken);
  } catch {
    return {
      success: false,
      message: "Stored Moltbook API key could not be decrypted. Please save it again.",
    };
  }

  try {
    const submolts = parsedInput.data.submolts.length
      ? parsedInput.data.submolts
      : DEFAULT_SUBMOLTS;

    const allPosts = await Promise.all(
      submolts.flatMap((submolt) => [
        fetchMoltbookPosts({
          token,
          submolt,
          sort: "hot",
          limit: 40,
        }),
        fetchMoltbookPosts({
          token,
          submolt,
          sort: "new",
          limit: 40,
        }),
      ]),
    );

    const dedupedMap = new Map<string, (typeof allPosts)[number][number]>();

    allPosts.flat().forEach((post) => {
      if (!post.id) {
        return;
      }
      dedupedMap.set(post.id, post);
    });

    const candidates = Array.from(dedupedMap.values()).slice(0, 80);

    const candidateWithComments = await Promise.all(
      candidates.map(async (post) => {
        const comments = await fetchMoltbookComments({
          token,
          postId: post.id,
          limit: 20,
        }).catch(() => []);

        return {
          post,
          comments: flattenComments(comments).slice(0, 20),
        };
      }),
    );

    const sparks = await generateSparksWithLlm({
      provider: parsedInput.data.provider,
      rawData: candidateWithComments,
    });

    const now = new Date();

    const digest = dailyDigestSchema.parse({
      date: now.toISOString().slice(0, 10),
      updatedAt: now.toISOString(),
      submolts: submolts.map(toSubmoltLabel),
      provider: parsedInput.data.provider,
      sparks: sparks.slice(0, 12),
    });

    revalidatePath("/");

    return {
      success: true,
      digest,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate sparks. Please check your settings and try again.",
    };
  }
}

export async function validateSettingsAction(input: unknown) {
  const parsed = settingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Settings validation failed.",
      errors: parsed.error.flatten(),
    } as const;
  }

  return {
    success: true,
    data: {
      ...parsed.data,
      submolts: parsed.data.submolts.map(toSubmoltLabel),
    },
  } as const;
}
