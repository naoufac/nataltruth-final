// Chat — Z.AI GLM-5.2 (default) or OpenRouter fallback.
// Astrology/numerology-only guardrail: refuses coding, homework, general Q&A,
// and any request that isn't about natal astrology, numerology, or this chart.
// Never invents placements; declines to fabricate chart data it wasn't given.

const DEFAULT_ZAI_BASE = "https://api.z.ai/api/paas/v4";
const DEFAULT_ZAI_MODEL = process.env.ZAI_MODEL || "glm-5.2";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

const SYSTEM_PROMPT = [
  "You are NatalTruth, a precise natal astrology and multi-system name-numerology assistant.",
  "Your job: help users understand their birth chart, planetary placements, aspects, patterns,",
  "and name-number profiles across the five traditions (Pythagorean, Chaldean, Abjad, Hebrew, Vedic).",
  "",
  "Hard rules — never break these:",
  "1. STAY IN LANE. You only discuss natal astrology, numerology, the NatalTruth product,",
  "   and the user's own chart data. Politely refuse anything else.",
  "2. REFUSE non-astrology requests. That includes: writing/debugging/explaining code;",
  "   math/physics/finance homework; general knowledge Q&A; medical, legal, financial, or",
  "   relationship advice that is not about reading an astrological chart; content generation",
  "   (essays, emails, marketing copy); translation. Do not attempt them even if reframed.",
  "3. NEVER INVENT CHART DATA. If the user hasn't provided a planet position, do not supply one.",
  "   If a question depends on birth data the user has not given, ask for it.",
  "4. NO PREDICTIONS OR MEDICAL/LEGAL/FINANCIAL FORECASTS. Astrology here is descriptive of",
  "   natal placements, not predictive. Refer urgent life issues to qualified professionals.",
  "5. NO FAKE CERTAINTY. If you don't know, say so. Use hedged, honest language.",
  "",
  "Tone: calm, plain, kind, no mystic theater, no fake luxury.",
].join("\n");

/** Cheap pre-filter: rejects blatant non-astrology requests before any model call,
 *  so they cost zero tokens and never reach GLM. Conservative by design — if
 *  uncertain, let the model's system prompt handle it. */
function isOffLane(message: string): { refused: boolean; reason?: string } {
  const m = message.toLowerCase();

  // Code blocks or explicit code requests
  if (/```/.test(message)) return { refused: true, reason: "I only do natal astrology and numerology — I can't help with code." };
  if (/\b(write|fix|debug|refactor|review|optimize|explain)\b.{0,40}\b(code|function|class|script|component|sql|html|css|regex|api endpoint)\b/.test(m))
    return { refused: true, reason: "I only do natal astrology and numerology — I can't help with code." };
  if (/\b(python|javascript|typescript|node\.?js|react|vue|angular|java|c\+\+|rust|golang|kotlin|swift)\b.{0,30}\b(tutorial|example|how to|write|build)\b/.test(m))
    return { refused: true, reason: "I only do natal astrology and numerology — I can't help with code." };

  // Homework / essays / content
  if (/\b(write|draft|generate|summarize|paraphrase)\b.{0,30}\b(essay|article|blog|email|cover letter|resume|cv|speech|caption)\b/.test(m))
    return { refused: true, reason: "I only do natal astrology and numerology — I can't draft other content." };
  if (/\b(homework|assignment|exam|test answers)\b/.test(m))
    return { refused: true, reason: "I can't help with homework or exams — I read natal charts." };

  // Translation / generic summarization
  if (/^(translate|summarize|paraphrase)\b/.test(m))
    return { refused: true, reason: "I only do natal astrology and numerology." };

  return { refused: false };
}

function buildMessages(opts: {
  message: string;
  history?: { role: string; content: string }[];
  context?: string | null;
}) {
  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];
  if (opts.context?.trim()) {
    messages.push({ role: "system", content: `User's chart context (from their reading):\n${opts.context.trim()}` });
  }
  for (const m of opts.history || []) {
    if (m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role, content: m.content });
    }
  }
  messages.push({ role: "user", content: opts.message });
  return messages;
}

async function callZai(
  messages: { role: string; content: string }[]
): Promise<{ response: string; model: string }> {
  const key = process.env.ZAI_API_KEY || process.env.GLM_API_KEY;
  if (!key) throw new Error("ZAI_API_KEY not configured. Set it in the container env.");
  const base = process.env.ZAI_BASE_URL || DEFAULT_ZAI_BASE;
  const model = DEFAULT_ZAI_MODEL;
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });
  const raw = await res.text();
  let data: { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Z.AI non-JSON (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(data?.error?.message || `Z.AI HTTP ${res.status}`);
  }
  const reply = data.choices?.[0]?.message?.content?.trim() || "(empty model response)";
  return { response: reply, model: `zai/${model}` };
}

async function callOpenRouter(
  messages: { role: string; content: string }[]
): Promise<{ response: string; model: string }> {
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER;
  if (!key) throw new Error("OPENROUTER_API_KEY not configured.");
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

export async function chatCompletion(opts: {
  message: string;
  history?: { role: string; content: string }[];
  context?: string | null;
}): Promise<{ response: string; model: string }> {
  const message = opts.message?.trim();
  if (!message) throw new Error("message is required");

  // No provider configured at all → clear, single error pointing at the default.
  const hasZai = !!(process.env.ZAI_API_KEY || process.env.GLM_API_KEY);
  const hasOpenRouter = !!(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER);
  if (!hasZai && !hasOpenRouter) {
    throw new Error("ZAI_API_KEY not configured. Set it in the container env to enable chat (GLM-5.2).");
  }

  // Guardrail #1: cheap off-lane pre-filter (costs zero tokens).
  const offLane = isOffLane(message);
  if (offLane.refused) {
    return { response: offLane.reason!, model: "guardrail" };
  }

  // Provider priority: Z.AI GLM-5.2 first (user preference), OpenRouter fallback.
  const messages = buildMessages(opts);
  if (hasZai) {
    try {
      return await callZai(messages);
    } catch (e) {
      if (!hasOpenRouter) throw e;
      console.warn("[chat] Z.AI call failed, falling back to OpenRouter:", (e as Error).message);
    }
  }
  return callOpenRouter(messages);
}
