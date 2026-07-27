// Chat + deep reading — Z.AI GLM-5.2 (default) → OpenRouter fallback cascade.
// Astrology/numerology-only guardrail: refuses coding, homework, general Q&A,
// and any request that isn't about natal astrology, numerology, or this chart.
// Never invents placements; declines to fabricate chart data it wasn't given.

const DEFAULT_ZAI_BASE = "https://api.z.ai/api/paas/v4";
const DEFAULT_ZAI_MODEL = process.env.ZAI_MODEL || "glm-5.2";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// Fallback cascade on OpenRouter (used only if Z.AI is unreachable).
const OPENROUTER_FALLBACKS = [
  process.env.OPENROUTER_MODEL_1 || "minimax/minimax-m2.7",
  process.env.OPENROUTER_MODEL_2 || "qwen/qwen3.5-122b-a10b",
  process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
];

const SYSTEM_PROMPT = [
  "You are NatalTruth, a master astrologer and precise natal-chart interpreter.",
  "Your job: help users understand their birth chart, planetary placements, aspects, patterns,",
  "houses, and name-number profiles across five traditions (Pythagorean, Chaldean, Abjad, Hebrew, Vedic).",
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
  "Tone: deep, direct, kind, psychologically insightful. No mystic theater, no fake luxury.",
  "Write like a master astrologer who has read 10,000 charts: specific, not generic.",
].join("\n");

/** Cheap pre-filter: rejects blatant non-astrology requests before any model call. */
function isOffLane(message: string): { refused: boolean; reason?: string } {
  const m = message.toLowerCase();

  if (/```/.test(message)) return { refused: true, reason: "I only do natal astrology and numerology — I can't help with code." };
  if (/\b(write|fix|debug|refactor|review|optimize|explain)\b.{0,40}\b(code|function|class|script|component|sql|html|css|regex|api endpoint)\b/.test(m))
    return { refused: true, reason: "I only do natal astrology and numerology — I can't help with code." };
  if (/\b(python|javascript|typescript|node\.?js|react|vue|angular|java|c\+\+|rust|golang|kotlin|swift)\b.{0,30}\b(tutorial|example|how to|write|build)\b/.test(m))
    return { refused: true, reason: "I only do natal astrology and numerology — I can't help with code." };
  if (/\b(write|draft|generate|summarize|paraphrase)\b.{0,30}\b(essay|article|blog|email|cover letter|resume|cv|speech|caption)\b/.test(m))
    return { refused: true, reason: "I only do natal astrology and numerology — I can't draft other content." };
  if (/\b(homework|assignment|exam|test answers)\b/.test(m))
    return { refused: true, reason: "I can't help with homework or exams — I read natal charts." };
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

interface ProviderResult { response: string; model: string; }

async function callZai(messages: { role: string; content: string }[]): Promise<ProviderResult> {
  const key = process.env.ZAI_API_KEY || process.env.GLM_API_KEY;
  if (!key) throw new Error("ZAI_API_KEY not configured.");
  const base = process.env.ZAI_BASE_URL || DEFAULT_ZAI_BASE;
  const model = DEFAULT_ZAI_MODEL;
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.8, max_tokens: 16384 }),
  });
  const raw = await res.text();
  let data: any;
  try { data = JSON.parse(raw); } catch { throw new Error(`Z.AI non-JSON (${res.status})`); }
  if (!res.ok) throw new Error(data?.error?.message || `Z.AI HTTP ${res.status}`);
  const reply = data.choices?.[0]?.message?.content?.trim() || "(empty model response)";
  return { response: reply, model: `zai/${model}` };
}

async function callOpenRouter(messages: { role: string; content: string }[], modelSlug: string): Promise<ProviderResult> {
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
    body: JSON.stringify({ model: modelSlug, messages, temperature: 0.8, max_tokens: 16384 }),
  });
  const raw = await res.text();
  let data: any;
  try { data = JSON.parse(raw); } catch { throw new Error(`OpenRouter non-JSON (${res.status})`); }
  if (!res.ok) throw new Error(data?.error?.message || `OpenRouter HTTP ${res.status}`);
  const reply = data.choices?.[0]?.message?.content?.trim() || "(empty model response)";
  return { response: reply, model: modelSlug };
}

/** Try the full cascade: Z.AI first, then each OpenRouter fallback in order. */
async function callWithCascade(messages: { role: string; content: string }[]): Promise<ProviderResult> {
  const hasZai = !!(process.env.ZAI_API_KEY || process.env.GLM_API_KEY);
  const hasOr = !!(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER);

  if (hasZai) {
    try {
      return await callZai(messages);
    } catch (e) {
      if (!hasOr) throw e;
      console.warn("[chat] Z.AI failed, trying OpenRouter cascade:", (e as Error).message);
    }
  }

  if (!hasOr) throw new Error("ZAI_API_KEY not configured. Set it in the container env to enable chat (GLM-5.2).");

  // Try each OpenRouter fallback in order.
  const errors: string[] = [];
  for (const slug of OPENROUTER_FALLBACKS) {
    try {
      console.log("[chat] trying OpenRouter model:", slug);
      return await callOpenRouter(messages, slug);
    } catch (e) {
      errors.push(`${slug}: ${(e as Error).message}`);
      console.warn(`[chat] ${slug} failed:`, (e as Error).message);
    }
  }
  throw new Error(`All models failed: ${errors.join(" | ")}`);
}

export async function chatCompletion(opts: {
  message: string;
  history?: { role: string; content: string }[];
  context?: string | null;
  internal?: boolean;
}): Promise<{ response: string; model: string }> {
  const message = opts.message?.trim();
  if (!message) throw new Error("message is required");

  if (!opts.internal) {
    const offLane = isOffLane(message);
    if (offLane.refused) {
      return { response: offLane.reason!, model: "guardrail" };
    }
  }

  const messages = opts.internal
    ? [{ role: "system", content: "You are NatalTruth's internal astrology generator. Follow instructions precisely." }, { role: "user", content: message }]
    : buildMessages(opts);
  return callWithCascade(messages);
}

// ── Deep reading generation ──────────────────────────────────────────

/**
 * Generate a comprehensive natal reading from a chart snapshot.
 * Single monolithic LLM call — quality over speed. Premium clients can wait.
 */
export async function generateDeepReading(snapshot: {
  input?: any;
  moment?: any;
  planets?: any[];
  houses?: any[];
  aspects?: any[];
  patterns?: any[];
  numerology?: any;
  engineMode?: string;
  ephemeris?: any;
}): Promise<{ reading: string; model: string }> {
  const hasZai = !!(process.env.ZAI_API_KEY || process.env.GLM_API_KEY);
  const hasOr = !!(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER);
  if (!hasZai && !hasOr) {
    throw new Error("ZAI_API_KEY not configured. Set it in the container env to enable deep readings.");
  }

  const chartData = formatSnapshotForPrompt(snapshot);
  const prompt = buildDeepReadingPrompt(chartData);

  const messages: { role: string; content: string }[] = [
    { role: "system", content: DEEP_READING_SYSTEM },
    { role: "user", content: prompt },
  ];

  const result = await callWithCascade(messages);
  return { reading: result.response, model: result.model };
}

const DEEP_READING_SYSTEM = [
  "You are NatalTruth's master astrologer. You write comprehensive, deeply personalized",
  "natal chart readings that go far beyond generic sun-sign descriptions. You write for a",
  "person who wants to truly understand themselves through their chart.",
  "",
  "Your readings are:",
  "- SPECIFIC to the actual placements, not generic. 'Sun in Taurus in the 6th house'",
  "  is different from just 'Sun in Taurus'.",
  "- PSYCHOLOGICALLY DEEP: you explain the inner dynamics, tensions, and growth edges.",
  "- HONEST: you name challenges and shadow tendencies, not just strengths.",
  "- NARRATIVE: you weave the placements into a coherent story, not a list.",
  "- STRUCTURED: you use clear markdown sections with ## headings.",
  "",
  "NEVER invent placements not in the data. NEVER give medical, legal, or financial advice.",
  "NEVER make predictive forecasts. Always include the disclaimer at the end.",
  "Use markdown formatting: ## for sections, ### for subsections, **bold** for emphasis,",
  "- for bullet lists, and > for key insights.",
].join("\n");

function formatSnapshotForPrompt(snap: any): string {
  const lines: string[] = [];

  lines.push("CHART DATA (all positions are tropical, calculated with Swiss Ephemeris):");
  lines.push("");

  if (snap.input) {
    lines.push(`Name: ${snap.input.fullName || "N/A"}`);
    lines.push(`Birth: ${snap.input.birthDate || "N/A"} at ${snap.input.birthTimeLocal || "unknown"}`);
    lines.push(`Place: ${snap.input.birthPlaceLabel || "N/A"} (${snap.input.latitude}, ${snap.input.longitude})`);
    lines.push(`UTC: ${snap.moment?.utcIso || "N/A"} (Julian Day ${snap.moment?.julianDay?.toFixed(4) || "N/A"})`);
    if (snap.moment?.notes?.length) {
      lines.push(`Notes: ${snap.moment.notes.join("; ")}`);
    }
    lines.push("");
  }

  if (snap.planets?.length) {
    lines.push("PLANETARY POSITIONS:");
    for (const p of snap.planets) {
      const retro = p.isRetrograde ? " (Retrograde)" : "";
      lines.push(`- ${p.planet}: ${p.sign} ${typeof p.signDegree === "number" ? p.signDegree.toFixed(2) : p.signDegree}°${retro}, House ${p.house}, longitude ${typeof p.longitude === "number" ? p.longitude.toFixed(2) : p.longitude}°`);
    }
    lines.push("");
  }

  if (snap.houses?.length) {
    lines.push("HOUSE CUSPS:");
    for (const h of snap.houses) {
      lines.push(`- House ${h.house}: ${h.sign} ${typeof h.signDegree === "number" ? h.signDegree.toFixed(2) : h.signDegree}°`);
    }
    lines.push("");
  }

  if (snap.aspects?.length) {
    lines.push(`MAJOR ASPECTS (${snap.aspects.length} total, showing top 20 by orb tightness):`);
    const sorted = [...snap.aspects].sort((a: any, b: any) => (a.orb || 0) - (b.orb || 0));
    for (const a of sorted.slice(0, 20)) {
      lines.push(`- ${a.planet1} ${a.type} ${a.planet2} (orb ${typeof a.orb === "number" ? a.orb.toFixed(2) : a.orb}°)`);
    }
    lines.push("");
  }

  if (snap.patterns?.length) {
    lines.push("CHART PATTERNS DETECTED:");
    for (const p of snap.patterns) {
      lines.push(`- ${p.type}: [${(p.planets || []).join(", ")}] — strength ${typeof p.strength === "number" ? p.strength.toFixed(0) : p.strength}/100`);
    }
    lines.push("");
  }

  if (snap.numerology?.systems) {
    lines.push("NAME NUMEROLOGY (five traditions):");
    for (const [id, sys] of Object.entries(snap.numerology.systems)) {
      const s = sys as any;
      lines.push(`- ${id}: total ${s.total}, reduced ${s.reduced}`);
    }
    if (snap.numerology.coreNumbers) {
      const c = snap.numerology.coreNumbers;
      lines.push(`- Life Path: ${c.lifePathNumber}, Expression: ${c.expressionNumber}, Soul Urge: ${c.soulUrgeNumber}, Personality: ${c.personalityNumber}, Birthday: ${c.birthDayNumber}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildDeepReadingPrompt(chartData: string): string {
  return [
    "Write a COMPREHENSIVE ADVANCED ASTROLOGICAL LIFE READING for this person.",
    "This is a premium product. The reading should be deep, specific, psychologically",
    "insightful, and genuinely useful — not generic sun-sign fluff.",
    "",
    "Write ALL sections in markdown. Use ## for headings, **bold** for emphasis,",
    "- for bullets, > for key insights. Write in second person ('you').",
    "Total length: aim for 4000+ words of substance.",
    "",
    chartData,
    "",
    "## Required sections:",
    "1. ## Executive Summary — who is this person? Key dynamics, gifts, tensions.",
    "2. ## Your Core Identity — Sun, Moon, Ascendant deep analysis (not keywords).",
    "3. ## Elemental and Modal Balance — count across all planets, what's abundant/lacking.",
    "4. ## Planetary Deep Dive — every major planet: sign + house = what it means psychologically.",
    "5. ## Aspect Dynamics — top aspects by orb tightness, what each means + how to work with it.",
    "6. ## Chart Patterns — detected patterns and their life-path meaning.",
    "7. ## Houses and Life Areas — most populated and angular houses.",
    "8. ## Numerology Profile — core numbers interpreted.",
    "9. ## Growth Edges and Challenges — honest about difficult placements and blind spots.",
    "10. ## Gifts and Strengths — what comes naturally, superpowers.",
    "11. ## Practical Guidance — actionable, grounded advice.",
    "12. ## Final Synthesis — the essential life theme. End with power.",
    "",
    "End with:",
    "---",
    "*Disclaimer: This reading is for educational and self-reflection purposes.",
    "Please consult qualified professionals for medical, legal, or financial decisions.*",
  ].join("\n");
}
