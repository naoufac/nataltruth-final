// Zodiac data: signs, elements, modalities, rulers, dates, symbols, traits,
// and a real element/modality-based compatibility matrix for the 12×12 table.

export type Element = "Fire" | "Earth" | "Air" | "Water";
export type Modality = "Cardinal" | "Fixed" | "Mutable";

export interface ZodiacSign {
  id: string;
  name: string;
  symbol: string;     // unicode glyph
  glyph: string;      // short letter
  element: Element;
  modality: Modality;
  ruler: string;
  dates: string;
  degree: number;     // 0-360 start
  keywords: string[];
  strengths: string[];
  growth: string[];
  bodyPart: string;
  color: string;
}

export const SIGNS: ZodiacSign[] = [
  { id: "aries", name: "Aries", symbol: "♈", glyph: "Ar", element: "Fire", modality: "Cardinal", ruler: "Mars", dates: "Mar 21 – Apr 19", degree: 0,
    keywords: ["initiative", "courage", "independence", "pioneering"],
    strengths: ["Bold", "Direct", "Energetic", "Natural leader", "Honest"],
    growth: ["Patience", "Considering others", "Finishing what you start"],
    bodyPart: "Head", color: "#E03A3E" },
  { id: "taurus", name: "Taurus", symbol: "♉", glyph: "Ta", element: "Earth", modality: "Fixed", ruler: "Venus", dates: "Apr 20 – May 20", degree: 30,
    keywords: ["stability", "patience", "sensuality", "endurance"],
    strengths: ["Reliable", "Patient", "Loyal", "Sensual", "Practical"],
    growth: ["Flexibility", "Letting go of stubbornness", "Embracing change"],
    bodyPart: "Throat & neck", color: "#7BAE43" },
  { id: "gemini", name: "Gemini", symbol: "♊", glyph: "Ge", element: "Air", modality: "Mutable", ruler: "Mercury", dates: "May 21 – Jun 20", degree: 60,
    keywords: ["communication", "curiosity", "versatility", "wit"],
    strengths: ["Curious", "Communicative", "Witty", "Adaptable", "Social"],
    growth: ["Follow-through", "Depth over breadth", "Consistency"],
    bodyPart: "Hands & lungs", color: "#E8A93C" },
  { id: "cancer", name: "Cancer", symbol: "♋", glyph: "Ca", element: "Water", modality: "Cardinal", ruler: "Moon", dates: "Jun 21 – Jul 22", degree: 90,
    keywords: ["nurturing", "intuition", "memory", "home"],
    strengths: ["Caring", "Intuitive", "Loyal", "Protective", "Empathetic"],
    growth: ["Emotional boundaries", "Not taking things personally", "Letting go"],
    bodyPart: "Chest & stomach", color: "#8FB5D9" },
  { id: "leo", name: "Leo", symbol: "♌", glyph: "Le", element: "Fire", modality: "Fixed", ruler: "Sun", dates: "Jul 23 – Aug 22", degree: 120,
    keywords: ["confidence", "warmth", "creativity", "generosity"],
    strengths: ["Confident", "Generous", "Creative", "Warm", "Charismatic"],
    growth: ["Sharing the spotlight", "Accepting feedback", "Humility"],
    bodyPart: "Heart & spine", color: "#E8902C" },
  { id: "virgo", name: "Virgo", symbol: "♍", glyph: "Vi", element: "Earth", modality: "Mutable", ruler: "Mercury", dates: "Aug 23 – Sep 22", degree: 150,
    keywords: ["precision", "service", "analysis", "health"],
    strengths: ["Analytical", "Diligent", "Helpful", "Detail-oriented", "Reliable"],
    growth: ["Self-criticism", "Perfectionism", "Trusting the process"],
    bodyPart: "Digestive system", color: "#9A8B5A" },
  { id: "libra", name: "Libra", symbol: "♎", glyph: "Li", element: "Air", modality: "Cardinal", ruler: "Venus", dates: "Sep 23 – Oct 22", degree: 180,
    keywords: ["balance", "harmony", "partnership", "justice"],
    strengths: ["Diplomatic", "Fair", "Charming", "Cooperative", "Aesthetic"],
    growth: ["Decision-making", "Conflict avoidance", "People-pleasing"],
    bodyPart: "Kidneys & lower back", color: "#C4A0D9" },
  { id: "scorpio", name: "Scorpio", symbol: "♏", glyph: "Sc", element: "Water", modality: "Fixed", ruler: "Pluto", dates: "Oct 23 – Nov 21", degree: 210,
    keywords: ["intensity", "transformation", "depth", "power"],
    strengths: ["Passionate", "Loyal", "Deep", "Determined", "Intuitive"],
    growth: ["Trust", "Letting go of control", "Forgiveness"],
    bodyPart: "Reproductive system", color: "#8B2C5C" },
  { id: "sagittarius", name: "Sagittarius", symbol: "♐", glyph: "Sa", element: "Fire", modality: "Mutable", ruler: "Jupiter", dates: "Nov 22 – Dec 21", degree: 240,
    keywords: ["freedom", "adventure", "philosophy", "truth"],
    strengths: ["Optimistic", "Adventurous", "Honest", "Philosophical", "Generous"],
    growth: ["Tact", "Commitment", "Following through"],
    bodyPart: "Hips & thighs", color: "#B84D2C" },
  { id: "capricorn", name: "Capricorn", symbol: "♑", glyph: "Cp", element: "Earth", modality: "Cardinal", ruler: "Saturn", dates: "Dec 22 – Jan 19", degree: 270,
    keywords: ["ambition", "discipline", "structure", "mastery"],
    strengths: ["Disciplined", "Responsible", "Ambitious", "Patient", "Strategic"],
    growth: ["Work-life balance", "Vulnerability", "Enjoying the present"],
    bodyPart: "Knees & bones", color: "#3D4A5C" },
  { id: "aquarius", name: "Aquarius", symbol: "♒", glyph: "Aq", element: "Air", modality: "Fixed", ruler: "Uranus", dates: "Jan 20 – Feb 18", degree: 300,
    keywords: ["innovation", "individuality", "humanity", "vision"],
    strengths: ["Original", "Independent", "Humanitarian", "Visionary", "Intellectual"],
    growth: ["Emotional intimacy", "Predictability", "Conventionality"],
    bodyPart: "Ankles & circulation", color: "#2C7B8B" },
  { id: "pisces", name: "Pisces", symbol: "♓", glyph: "Pi", element: "Water", modality: "Mutable", ruler: "Neptune", dates: "Feb 19 – Mar 20", degree: 330,
    keywords: ["compassion", "imagination", "spirituality", "dreams"],
    strengths: ["Compassionate", "Artistic", "Intuitive", "Gentle", "Wise"],
    growth: ["Boundaries", "Grounding", "Avoiding escapism"],
    bodyPart: "Feet", color: "#6E8FD9" },
];

export const SIGN_MAP: Record<string, ZodiacSign> = Object.fromEntries(
  SIGNS.map((s) => [s.id, s])
);

// ── Compatibility logic ────────────────────────────────────────────
// Based on elemental harmony (trine/sextile) and modality tension (square).
// Produces an honest assessment, not a fake percentage.

export interface Compatibility {
  score: number;        // 1-5 (not a fake %, a real band)
  label: string;        // short: "Natural harmony", "Electric spark", etc.
  strength: string;     // what works
  challenge: string;    // what needs work
  description: string;  // fuller explanation
}

export function getCompatibility(signA: ZodiacSign, signB: ZodiacSign): Compatibility {
  if (signA.id === signB.id) {
    return {
      score: 3,
      label: "Mirror",
      strength: "Deep mutual understanding — you instinctively get each other.",
      challenge: "Same blind spots. Nobody balances the edges you both skip.",
      description: `Two ${signA.name}s understand each other instinctively. You share the same element (${signA.element}) and modality (${signA.modality}), which means deep resonance — but also the same growth edges. Growth comes from outside the comfort zone.`,
    };
  }

  const sameElement = signA.element === signB.element;
  const complementary: Record<Element, Element> = { Fire: "Air", Air: "Fire", Earth: "Water", Water: "Earth" };
  const isComplementary = complementary[signA.element] === signB.element;
  const sameModality = signA.modality === signB.modality;

  // Trine (same element, 120° apart) — natural flow
  if (sameElement) {
    return {
      score: 5,
      label: "Natural harmony",
      strength: `Same ${signA.element} element — you instinctively understand each other's core frequency. Effortless rapport.`,
      challenge: "Things can feel *too* easy. Without friction, growth slows. Consciously introduce new experiences.",
      description: `${signA.name} and ${signB.name} share the ${signA.element} element — a trine relationship in astrology. This is one of the most natural pairings: your fundamental energies flow in the same direction. The risk is complacency; the opportunity is a partnership that feels like home.`,
    };
  }

  // Sextile (complementary elements — Fire/Air, Earth/Water) — stimulating
  if (isComplementary) {
    return {
      score: 4,
      label: "Electric spark",
      strength: `Complementary elements (${signA.element} + ${signB.element}) — you energize and stimulate each other. Growth-oriented.`,
      challenge: "Different rhythms. You'll need to actively bridge your approaches rather than assuming alignment.",
      description: `${signA.name} (${signA.element}) and ${signB.name} (${signB.element}) are complementary — a sextile relationship. This pairing is stimulating: each sign offers what the other lacks. Fire warms Air's ideas into action; Earth gives Water's emotions a container. This is a growth-oriented match with real chemistry.`,
    };
  }

  // Same modality, different element (square, 90°) — productive friction
  if (sameModality) {
    return {
      score: 3,
      label: "Productive friction",
      strength: `Same modality (${signA.modality}) — you approach change the same way, which creates powerful forward motion when aligned.`,
      challenge: `Both ${signA.modality.toLowerCase()}, you can clash over direction. The tension is real but generative — it forces growth neither would attempt alone.`,
      description: `${signA.name} and ${signB.name} share the ${signA.modality} modality but different elements — a square relationship. This is the classic "opposite attracts and conflicts" dynamic. The friction is productive: it pushes both people to grow beyond their defaults. Not always easy, but rarely boring.`,
    };
  }

  // Quincunx (150°) — adjustment needed
  const degreeDiff = Math.abs(signA.degree - signB.degree);
  const normalized = Math.min(degreeDiff, 360 - degreeDiff);
  if (normalized === 150) {
    return {
      score: 2,
      label: "Fascinating puzzle",
      strength: "An intriguing mismatch that draws you in. You see the world so differently that it's endlessly interesting.",
      challenge: "Fundamentally different operating systems. Requires conscious, ongoing translation to truly connect.",
      description: `${signA.name} and ${signB.name} are a quincunx — 150° apart. In astrology, this aspect signals two energies that don't naturally understand each other but are oddly fascinated by the difference. It takes real work to bridge the gap, but the growth potential is immense.`,
    };
  }

  // Opposition (180°) — complementary tension
  if (normalized === 180) {
    return {
      score: 4,
      label: "Complementary opposites",
      strength: "You balance each other perfectly. What one lacks, the other provides — a full-spectrum partnership.",
      challenge: "Projection. You may see your own unowned traits in each other. Own your shadow and the tension becomes gold.",
      description: `${signA.name} and ${signB.name} sit directly opposite each other on the zodiac wheel — an opposition. This is the classic "two halves of a whole" dynamic. Your differences are complementary, not conflicting — but only if you resist the urge to make the other person be like you. The mirror is the gift.`,
    };
  }

  // Default (semi-square or other) — workable with awareness
  return {
    score: 3,
    label: "Worth the work",
    strength: "Different enough to learn from each other, similar enough to find common ground.",
    challenge: "Neither natural nor opposed — the relationship is what you make of it through conscious effort.",
    description: `${signA.name} and ${signB.name} occupy different places on the zodiac wheel. This isn't an automatic match, but it's not a clash either. The relationship's quality depends on the effort both people bring — and on the rest of the chart (Moon, Venus, Mars matter enormously). Don't judge a pairing by Sun signs alone.`,
  };
}
