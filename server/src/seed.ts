// First-run seeding: an admin account (from env) + a few honest starter posts.
import { db } from "./db.js";
import { findUserByEmail, createUser, signToken } from "./auth.js";

export function seed(): void {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim();
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const existing = findUserByEmail(ADMIN_EMAIL);
    if (existing) {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
    } else {
      const admin = createUser(ADMIN_EMAIL, ADMIN_PASSWORD, "Admin");
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(admin.id);
      console.log(`[seed] Admin account created: ${ADMIN_EMAIL}`);
    }
    // The seed token is just so an operator can confirm the password works; not used at runtime.
    void signToken;
  }

  const hasPosts = (db.prepare("SELECT COUNT(*) AS n FROM posts").get() as { n: number }).n;
  if (hasPosts > 0) return;

  const posts = [
    {
      slug: "what-is-a-natal-chart",
      title: "What is a natal chart, actually?",
      excerpt:
        "A natal chart is a snapshot of where every planet was the moment you were born. Here's what that means — in plain words.",
      cover: "✦",
      body_md: `A **natal chart** is a map of the sky at the exact moment and place you were born.

Think of it as a photograph of the solar system taken from your birthplace at your birth time. Each planet was in a particular *sign* (its position along the zodiac), and — if your birth time is known — in a particular *house* (which area of life it lights up).

### The three things most people start with

- **Your Sun sign** — the one most horoscopes use. It's the shape of your core identity.
- **Your Moon sign** — your emotional world. How you process feelings and find safety.
- **Your Rising sign (Ascendant)** — the sign coming up over the horizon when you were born. It colors how you meet the world. (This one needs your birth *time*.)

### Why precision matters

The Moon moves about 12 degrees a day. Get the time wrong by a few hours and the Moon can change signs entirely. That's why we calculate with the **Swiss Ephemeris** — the same precision astronomers use — and why we won't invent a Rising sign if you don't have a birth time.

A real chart is reproducible: the same birth data always gives the same chart. That's the standard we hold.`,
      published: 1,
    },
    {
      slug: "why-we-say-no-to-fake-certainty",
      title: "Why we'd rather say \"we don't know\" than guess",
      excerpt:
        "Most astrology apps invent a Rising sign when you skip the birth time. We don't. Here's the honest approach — and why it serves you better.",
      cover: "✦",
      body_md: `There's a quiet problem in a lot of astrology software: when you don't enter a birth time, the app quietly fills in a guess and presents it as fact.

We think that's a bad deal. Here's how NatalTruth handles missing data instead.

### No birth time, no Rising sign

Your Rising sign and your houses both depend on the exact time and place. The sky literally rotates about one degree every four minutes. Without a time, those are unknowable — so we **leave them out**, and we tell you plainly.

We don't replace them with a noon estimate dressed up as certainty.

### What we *do* show without a time

The planets (except the Moon, which moves fast) barely move in a day. So without a birth time we can still show you accurate positions for the Sun through Pluto — labeled clearly as a noon estimate.

### Why this matters for trust

A reading you can't trust is worse than no reading. If we told you a confident-sounding lie about your Rising sign, the rest of the reading would be contaminated by it. Honesty about the edges is what makes the rest of it worth reading.

This is the whole standard of NatalTruth: nothing invented, everything reproducible, the gaps named honestly.`,
      published: 1,
    },
    {
      slug: "name-numerology-five-traditions",
      title: "Your name in numbers: five traditions, explained",
      excerpt:
        "Pythagorean, Chaldean, Abjad, Hebrew, Vedic — your name maps to numbers a different way in each. Here's what each one is doing.",
      cover: "✦",
      body_md: `Your name can be read as numbers, and different cultures have mapped letters to numbers in different ways. NatalTruth calculates **all five** of the major traditions at once — here's a plain-language guide to each.

### Pythagorean (1–9)
The most common Western system. Each letter gets a value 1–9. It's the one most "numerology" sites use by default.

### Chaldean (1–8)
An older system where no letter is assigned the number 9 (9 was considered sacred). Widely used for Indian and Arabic names written in Latin letters.

### Arabic Abjad (1–1000)
The classical Eastern system, computed on **Arabic script**. If you enter a Latin-only name, the total is correctly 0 — because there are no Arabic letters to value. That's not a bug; it's the system being honest about its input.

### Hebrew Gematria (1–400)
*Mispar Hechrechi*, the standard value system on Hebrew letters. Same as Abjad: Hebrew names get real totals; Latin-only names return 0.

### Indian (Vedic)
In practice this uses Chaldean letter values applied to Latin transliterations of Indian names.

### The point

None of these is "more correct" than the others — they're different lenses. Reading several at once gives you a richer picture than any single one. That's why we show you all of them, every time.`,
      published: 1,
    },
  ];

  const stmt = db.prepare(
    `INSERT INTO posts(id, slug, title, excerpt, body_md, cover, category, published, published_at, created_at, updated_at)
     VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const now = new Date().toISOString();
  const base = Date.now() - posts.length * 86400000;
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const ts = new Date(base + i * 86400000).toISOString();
    stmt.run(`seed_${i}`, p.slug, p.title, p.excerpt, p.body_md, p.cover, "understanding", p.published, ts, ts, now);
  }
  console.log(`[seed] Inserted ${posts.length} starter posts.`);
}
