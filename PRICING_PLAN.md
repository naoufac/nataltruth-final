# NatalTruth Pricing Plan — Implementation Specification
# Never display ratios. All API cost ratios invisible to user.

## Plans

### 1. Free — $0
- All calculation endpoints (Swiss + Moshier + name numerology)
- NO AI coach, NO AI friend
- 2 free reports (deep reading), then locked
- Blog, horoscope (per-sign daily), compatibility matrix

### 2. Enthusiast — $29/month
- Everything in Free
- AI Coach (limited): 50 messages/day
- AI Friend: 50 messages/day
- Deep readings: max 2000 words each (cost: $0.40 each, invisible to user)
- Daily guidance + transits
- Pay-as-you-go when limit reached: $0.50/report (1/5 ratio, never shown)

### 3. Advanced — $79/month
- Everything in Enthusiast
- AI Coach: unlimited (capped at 1/5 API ratio internally)
- AI Friend: unlimited
- Deep readings: max 3000 words (mentioned in plan description)
- Priority generation queue

### 4. Professional — $199/month
- Everything in Advanced
- Swiss-only calculations (Moshier hidden)
- Deep readings: max 4000+ words
- Watermark on shared reports: "Made with NatalTruth" (free watermark, removable for premium)
- API access (for coaches who want programmatic access)
- Discounted API ratio: 1/6 (never shown)

## Stripe Integration
- Test keys configured
- Webhook for subscription status updates
- Pay-as-you-go metering via Stripe Metered billing
- Never display cost ratios anywhere in the UI

## Database Changes
- users table: add subscription_tier TEXT DEFAULT 'free', stripe_customer_id TEXT, subscription_id TEXT
- api_usage table: track per-user per-day message counts + report generations
- reading_orders table: for one-time $19 personal readings
