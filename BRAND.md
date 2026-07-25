# NatalTruth — Brand & Product Direction

> **Comfort. Truth. Trust. Readability. Generosity. Shareability.**
> Not luxury. Not mystic theater. A warm, honest tool people can actually read and trust enough to pass along.

This document is the source of truth for how NatalTruth looks, sounds, and behaves. The calculation engine is precise; the brand's job is to make that precision **feel human, calm, and worth sharing.**

---

## 1. Positioning (one paragraph)

NatalTruth is the astrology product for people who want the real thing without the costume. It does the math properly (real ephemeris, five name traditions) and explains it in plain language. It gives a genuinely useful reading away for free, because a reading that actually helps is the most shareable thing we can make. There is no velvet rope, no gold-foil mysticism — just a calm, trustworthy reading you'd send your sister.

---

## 2. Principles (what we say no to)

| We are | We are **not** |
|--------|----------------|
| Warm and calm | Dark, glossy, "cosmic luxury" |
| Plain language that explains | Mystifying jargon that intimidates |
| One clear, trustworthy accent color | Gold-on-black bling, neon gradients |
| Generous free value | Hard paywalls in front of the meaning |
| Built to be screenshot and shared | Built to be admired behind glass |
| Editorial readability | Centered marketing fluff |
| Honest about uncertainty | Fake-certainty horoscope bingo |

**Iron rule:** every screen and every sentence should make a first-time visitor feel *calmer and better informed*, not smaller.

---

## 3. Visual language

### Mood
Warm paper. Morning light. A well-made book. A trusted friend who happens to know astronomy. Quiet confidence over spectacle.

### Color tokens

A single warm, trustworthy accent (clay/terracotta) on a paper background — human, grounded, distinctive, and deliberately not gold.

```css
:root {
  /* Paper (light) — the default mode */
  --bg:           #FAF7F2;   /* warm paper */
  --bg-elevated:  #FFFFFF;   /* cards on paper */
  --bg-subtle:    #F1ECE3;   /* recessed surfaces */
  --ink:          #1F1B16;   /* primary text, warm near-black */
  --ink-soft:     #5C544A;   /* secondary text */
  --ink-faint:    #8A8077;   /* metadata, captions */
  --line:         #E4DCCF;   /* hairline borders */

  --primary:      #BF5A36;   /* warm clay — the one accent */
  --primary-ink:  #8E3F24;   /* hover/pressed */
  --primary-soft: #F3E0D6;   /* tint backgrounds */

  --trust:        #3F6B5A;   /* calm sage — for "verified/precise" cues */
  --trust-soft:   #DCE7E0;

  --warn:         #B5792B;   /* warm amber for caveats (unknown time, etc.) */
}

[data-theme="dark"] {
  --bg:           #16140F;   /* warm near-black, never pure #000 */
  --bg-elevated:  #211E18;
  --bg-subtle:    #2C281F;
  --ink:          #F2EDE4;   /* warm off-white */
  --ink-soft:     #C4BBAE;
  --ink-faint:    #948B7E;
  --line:         #3A352B;

  --primary:      #D8794F;   /* slightly lifted clay for dark */
  --primary-ink:  #EAA081;
  --primary-soft: #3A2418;

  --trust:        #7FB39A;
  --trust-soft:   #24332C;

  --warn:         #D9A85B;
}
```

Rules:
- One accent (`--primary`). `--trust` is reserved for precision/provenance cues ("Swiss Ephemeris", "verified"). `--warn` for honest caveats. No fourth color.
- No gradient backgrounds. No glassmorphism. No glow. Solid, warm, flat surfaces with hairline borders.
- Dark mode is warm near-black, never pure `#000` and never the old obsidian.

### Typography

Readable, editorial, slightly warm. A quality serif for headings (truth/editorial feel), a humanist sans for body (readability), a mono for astronomical data (precision).

```css
--font-serif: "Fraunces", "Source Serif Pro", Georgia, serif;   /* headings */
--font-sans:  "Inter", system-ui, -apple-system, sans-serif;    /* body, UI */
--font-mono:  "JetBrains Mono", ui-monospace, monospace;        /* degrees, coords, dates */
```

- Headings (H1–H3): Fraunces, optical size, generous tracking. Editorial, not decorative.
- Body: Inter, 17–18px base, line-height 1.6. **Big, comfortable reading is a feature.**
- Data (planet degrees, coordinates, times): JetBrains Mono — signals "this is a measured value."
- Reading-mode: a toggle that bumps body to 19–20px and widens measure for long-form.

### Layout

- Generous whitespace. Measure (text width) capped ~66ch for prose.
- Generous corner radius (12–16px) on cards — soft, not sharp.
- Mobile-first. Most reading happens on a phone.
- No centered hero stacks. Asymmetric, content-led.

---

## 4. Voice

- **Warm, then precise.** Lead with what it means for the person; follow with the astronomy.
- **Explain, don't mystify.** "Your Moon is in Pisces — that usually points to emotional sensitivity. Here's the actual position: 14°02′."
- **Name uncertainty honestly.** "You didn't give a birth time, so houses and your Rising sign aren't shown. We won't guess them."
- **No emoji mysticism.** No 🔮✨🌙 as interface ornament. Icons are functional, line-based, calm.
- **Second person, present tense.** "You tend to…" not "The native shall…"

---

## 5. The shareable reading (organic growth engine)

This is the product's growth strategy, by design:

1. **Every reading renders a clean, branded share card** — the big-three (Sun/Moon/Rising), one sharp insight, and a small "made on NatalTruth" mark. Sized for Instagram stories, X, and WhatsApp.
2. **One-tap share** with a link back to a public, branded reading page (not the user's private data).
3. **The free reading is genuinely complete enough to be useful.** A teaser that hides the meaning trains nobody to share. Generosity is the funnel.
4. **Provenance on the card.** "Swiss Ephemeris · Tropical · Placidus" in small type — the trust signal that distinguishes us from filler apps.

---

## 6. The trust strip (a recurring component)

A small, recurring line on every reading:

> ✦ Calculated with Swiss Ephemeris · positions shown to the arc-minute · [how we calculate ↗]

This quietly, repeatedly, makes the precision claim visible. It is the opposite of the old "mystic luxury" framing.

---

## 7. Naming & legacy

- The product is **NatalTruth**. Always.
- The old internal codename **"Gab44"** is retired. Do not reintroduce it in any string, localStorage key, package name, or comment.
- Domain: `nataltruth.com` (public), `nataltruth.<host>.sslip.io` (this server's staging).

---

## 8. What "done" looks like for the brand

A first-time visitor lands, enters their birth info, and within seconds is reading a calm, warm, genuinely useful chart in plain language — and the natural next instinct is to send it to someone. That is the whole brief.
