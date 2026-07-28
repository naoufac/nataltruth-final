# NatalTruth Pricing — Exact Economics (never display ratios)

## Cost Tracking
GLM-5.2 returns usage per call: { completion_tokens, prompt_tokens, total_tokens }
Z.AI coding/paas/v4 endpoint is currently free but we track for when billing starts.
When using OpenRouter fallback, their pricing applies per model.

## Internal API cost estimation
- GLM-5.2: estimate at $0.002 per 1K completion tokens (hypothetical, currently free)
- A typical chat response: ~1000-2000 tokens (incl reasoning) ≈ $0.002-$0.004
- A 2000-word deep reading: ~3000 tokens output ≈ $0.006
- A 4000-word deep reading: ~6000 tokens output ≈ $0.012

## Per-user budget tracking
Each user has: api_budget_cents (plan allowance) + api_spent_cents (accumulated)
Costs tracked dynamically from actual token usage in each LLM response.

## Plan Economics

### Free ($0)
- api_budget_cents: 0
- AI chat: blocked (403)
- AI friend: blocked (403)
- Deep readings: 2 free (tracked separately via free_reports_used)
- All calculations, horoscope, blog: free

### Enthusiast ($29/month)
- api_budget_cents: 500 ($5.00 API budget included)
- AI chat: allowed until budget exhausted
- AI friend: allowed until budget exhausted
- Deep readings: $0.40 per report (deducted from budget, max 2000 words)
- When budget exhausted: pay-as-you-go at 1/6 ratio
- Monthly reset on subscription renewal

### Advanced ($79/month)
- api_budget_cents: unlimited (internally capped at 1/5 actual API cost)
- AI chat: unlimited
- AI friend: unlimited
- Deep readings: max 3000 words, included in subscription
- The 1/5 ratio is applied internally: if actual API cost is $0.01,
  we charge the user's internal meter $0.002 (1/5). Never displayed.

### Professional ($199/month)
- api_budget_cents: unlimited (1/5 ratio, discounted)
- Swiss-only calculations
- Deep readings: max 4000+ words
- Watermark on shared reports: free (included)
- API access
- Same 1/5 internal ratio as Advanced but with higher word limits

### Pay-as-you-go (when budget exhausted)
- Applies to Enthusiast ($29) when $5 budget runs out
- Ratio: 1/6 (user pays 1/6 of actual API cost)
- Charged via Stripe metered billing
- Never displayed to user

## What NEVER appears in UI
- API cost ratios (1/5, 1/6)
- Per-token costs
- API budget remaining
- Internal cost calculations
Only: "messages remaining today" or "reports included in your plan"
