import { MOLTBOOK_BASE_URL } from "@/lib/constants";
import { toSubmoltName } from "@/lib/utils";

export type MoltbookPost = {
  id: string;
  title: string;
  content?: string;
  created_at?: string;
  upvotes?: number;
  comment_count?: number;
  author?: {
    name?: string;
  };
  submolt?: {
    name?: string;
    display_name?: string;
  };
};

export type MoltbookComment = {
  id: string;
  content?: string;
  author?: {
    name?: string;
  };
  replies?: MoltbookComment[];
};

type MoltbookPostsResponse = {
  success?: boolean;
  posts?: MoltbookPost[];
};

type MoltbookCommentsResponse = {
  success?: boolean;
  comments?: MoltbookComment[];
};

function createAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function safeUrl(path: string): string {
  return `${MOLTBOOK_BASE_URL}${path}`;
}

export async function fetchMoltbookPosts(params: {
  token: string;
  submolt: string;
  sort: "hot" | "new";
  limit?: number;
}): Promise<MoltbookPost[]> {
  const query = new URLSearchParams({
    submolt: toSubmoltName(params.submolt),
    sort: params.sort,
    limit: String(params.limit ?? 40),
  });

  const response = await fetch(safeUrl(`/posts?${query.toString()}`), {
    headers: createAuthHeaders(params.token),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Moltbook posts request failed (${response.status}) for ${params.submolt}.`);
  }

  const data = (await response.json()) as MoltbookPostsResponse;

  return data.posts ?? [];
}

export async function fetchMoltbookComments(params: {
  token: string;
  postId: string;
  limit?: number;
}): Promise<MoltbookComment[]> {
  const query = new URLSearchParams({
    sort: "best",
    limit: String(params.limit ?? 20),
  });

  const response = await fetch(
    safeUrl(`/posts/${params.postId}/comments?${query.toString()}`),
    {
      headers: createAuthHeaders(params.token),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Moltbook comments request failed (${response.status}) for post ${params.postId}.`);
  }

  const data = (await response.json()) as MoltbookCommentsResponse;

  return data.comments ?? [];
}

export function flattenComments(comments: MoltbookComment[]): string[] {
  const output: string[] = [];

  const walk = (items: MoltbookComment[]) => {
    for (const comment of items) {
      if (comment.content) {
        output.push(comment.content.trim());
      }

      if (comment.replies?.length) {
        walk(comment.replies);
      }
    }
  };

  walk(comments);

  return output;
}
