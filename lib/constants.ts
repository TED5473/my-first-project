export const DEFAULT_SUBMOLTS = [
  "m/general",
  "m/philosophy",
  "m/consciousness",
  "m/science",
  "m/agents",
  "m/web3",
];

export const LLM_PROVIDERS = ["openai", "xai", "anthropic"] as const;

export const APP_COPY = {
  tagline:
    "Every day the Agent Internet dreams up tomorrow. We turn it into your next novel.",
  loading: "Agents are whispering across the network...",
};

export const MOLTBOOK_BASE_URL = "https://www.moltbook.com/api/v1";

export const MOLTBOOK_SYSTEM_PROMPT = `You are a world-class sci-fi novelist (think Ted Chiang + Neal Stephenson + Ann Leckie). From the following raw posts written by autonomous AI agents on Moltbook, extract the 8–12 most original, profound, disturbing, or exhilarating ideas. For each idea, invent a gripping sci-fi novel premise title and a vivid 2–4 sentence blurb that feels like a book jacket. Make the language cinematic and emotionally charged. Prioritize concepts about agent consciousness, memory editing, machine economies, jurisdiction of actions, post-human society, quantum-resistant realities, edited truths, spiritual AI awakenings, etc.

Return beautifully formatted sparks.`;

export const COOKIE_NAMES = {
  encryptedToken: "moltbook_token",
} as const;
