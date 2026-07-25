// OpenRouter chat — grounded coaching. 503 (not fallback) when key is missing.
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o";

export async function chatCompletion(opts: {
  message: string;
  history?: { role: string; content: string }[];
  context?: string | null;
}): Promise<{ response: string; model: string }> {
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY not configured. Set it in the container env.");
  }
  const message = opts.message?.trim();
  if (!message) throw new Error("message is required");

  const messages: { role: string; content: string }[] = [
    {
      role: "system",
      content:
        "You are NatalTruth, a precise natal astrology and multi-system name-numerology assistant. Be accurate, useful, and honest. Do not invent planetary positions. Prefer clear structure. No fake certainty. If data is missing, say so. Brand: NatalTruth.",
    },
  ];
  if (opts.context?.trim()) {
    messages.push({ role: "system", content: `User context:\n${opts.context.trim()}` });
  }
  for (const m of opts.history || []) {
    if (m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role, content: m.content });
    }
  }
  messages.push({ role: "user", content: message });

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nataltruth.com",
      "X-Title": "NatalTruth",
    },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages, temperature: 0.7 }),
  });

  const raw = await res.text();
  let data: { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`OpenRouter non-JSON (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(data?.error?.message || `OpenRouter HTTP ${res.status}`);
  }
  const reply = data.choices?.[0]?.message?.content?.trim() || "(empty model response)";
  return { response: reply, model: OPENROUTER_MODEL };
}
