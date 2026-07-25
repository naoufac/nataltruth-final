/**
 * Letter-to-number systems for full-name calculation (multi-language).
 *
 * Systems:
 * - Pythagorean (1–9) — English + French (Latin letters; accents stripped)
 * - Chaldean (1–8) — Indian + Arabic practice on Latin transliteration; no letter value 9
 * - Arabic Abjad (1–1000) — traditional Eastern Abjad on Arabic script
 * - Hebrew Gematria Mispar Hechrechi (1–400) — Hebrew script
 * - Indian Vedic (1–8) — Chaldean mapping on Latin transliteration (standard practice)
 */

export type LetterSystemId =
  | "pythagorean"
  | "chaldean"
  | "abjad"
  | "hebrew"
  | "vedic";

export type LetterContribution = {
  char: string;
  value: number;
  skipped?: boolean;
};

export type SystemResult = {
  system: LetterSystemId;
  label: string;
  numberRange: string;
  notes: string;
  scriptDetected: string;
  total: number;
  reduced: number | null;
  /** Chaldean-style single digit 1–8 when applicable */
  reducedChaldean?: number | null;
  letters: LetterContribution[];
  ignoredChars: string[];
};

/** Pythagorean A=1…I=9, J=1…R=9, S=1…Z=8 */
const PYTHAGOREAN: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  I: 9,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  O: 6,
  P: 7,
  Q: 8,
  R: 9,
  S: 1,
  T: 2,
  U: 3,
  V: 4,
  W: 5,
  X: 6,
  Y: 7,
  Z: 8,
};

/**
 * Chaldean (no 9 for letters):
 * 1:A I J Q Y  2:B K R  3:C G L S  4:D M T
 * 5:E H N X    6:U V W  7:O Z      8:F P
 */
const CHALDEAN: Record<string, number> = {
  A: 1,
  I: 1,
  J: 1,
  Q: 1,
  Y: 1,
  B: 2,
  K: 2,
  R: 2,
  C: 3,
  G: 3,
  L: 3,
  S: 3,
  D: 4,
  M: 4,
  T: 4,
  E: 5,
  H: 5,
  N: 5,
  X: 5,
  U: 6,
  V: 6,
  W: 6,
  O: 7,
  Z: 7,
  F: 8,
  P: 8,
};

/** Arabic Abjad (Eastern order) */
const ABJAD: Record<string, number> = {
  ا: 1,
  أ: 1,
  إ: 1,
  آ: 1,
  ء: 1,
  ٱ: 1,
  ب: 2,
  ج: 3,
  د: 4,
  ه: 5,
  ة: 5,
  و: 6,
  ؤ: 6,
  ز: 7,
  ح: 8,
  ط: 9,
  ي: 10,
  ى: 10,
  ئ: 10,
  ك: 20,
  ل: 30,
  م: 40,
  ن: 50,
  س: 60,
  ع: 70,
  ف: 80,
  ص: 90,
  ق: 100,
  ر: 200,
  ش: 300,
  ت: 400,
  ث: 500,
  خ: 600,
  ذ: 700,
  ض: 800,
  ظ: 900,
  غ: 1000,
  // Persian/Urdu common extensions often treated via base forms; keep core Abjad
};

/**
 * Hebrew Mispar Hechrechi (1–400).
 * Finals ך ם ן ף ץ use same values as כ מ נ פ צ (standard Hechrechi).
 */
const HEBREW_HECHRECHI: Record<string, number> = {
  א: 1,
  ב: 2,
  ג: 3,
  ד: 4,
  ה: 5,
  ו: 6,
  ז: 7,
  ח: 8,
  ט: 9,
  י: 10,
  כ: 20,
  ך: 20,
  ל: 30,
  מ: 40,
  ם: 40,
  נ: 50,
  ן: 50,
  ס: 60,
  ע: 70,
  פ: 80,
  ף: 80,
  צ: 90,
  ץ: 90,
  ק: 100,
  ר: 200,
  ש: 300,
  ת: 400,
};

const SYSTEM_META: Record<
  LetterSystemId,
  { label: string; numberRange: string; notes: string }
> = {
  pythagorean: {
    label: "Pythagorean",
    numberRange: "1–9",
    notes: "Most common Western system. English + French (Latin letters; accents stripped).",
  },
  chaldean: {
    label: "Chaldean",
    numberRange: "1–8",
    notes: "No number 9 for letters. Used for Indian + Arabic names in Latin transliteration.",
  },
  abjad: {
    label: "Arabic Abjad",
    numberRange: "1–1000",
    notes: "Traditional Eastern Abjad values on Arabic script.",
  },
  hebrew: {
    label: "Hebrew Gematria (Mispar Hechrechi)",
    numberRange: "1–400",
    notes: "Standard Mispar Hechrechi on Hebrew letters (finals = same as non-final).",
  },
  vedic: {
    label: "Indian (Vedic)",
    numberRange: "1–8",
    notes: "In practice uses Chaldean letter values on Latin transliteration of Indian names.",
  },
};

/** Strip combining marks; map common Latin specials for FR/EN. */
export function normalizeLatinName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/gi, "AE")
    .replace(/œ/gi, "OE")
    .replace(/ß/g, "SS")
    .toUpperCase();
}

export function reduceToSingleDigit(
  num: number,
  keepMasters = true
): number {
  if (keepMasters && (num === 11 || num === 22 || num === 33)) return num;
  let n = Math.abs(Math.trunc(num));
  while (n > 9) {
    n = n
      .toString()
      .split("")
      .reduce((s, d) => s + parseInt(d, 10), 0);
    if (keepMasters && (n === 11 || n === 22 || n === 33)) return n;
  }
  return n;
}

/** Chaldean compound reduction often keeps reducing to 1–8 (not 9 master set). */
export function reduceChaldean(num: number): number {
  let n = Math.abs(Math.trunc(num));
  while (n > 9) {
    n = n
      .toString()
      .split("")
      .reduce((s, d) => s + parseInt(d, 10), 0);
  }
  // If 9 appears as sum, reduce again? Classic: keep 9 as compound display but single digit for "destiny" often re-sum until 1-9; Chaldean avoids 9 as letter — sum can still be 9.
  return n;
}

function scoreWithMap(
  chars: string[],
  map: Record<string, number>
): { total: number; letters: LetterContribution[]; ignored: string[] } {
  let total = 0;
  const letters: LetterContribution[] = [];
  const ignored: string[] = [];
  for (const ch of chars) {
    if (/\s/.test(ch) || ch === "-" || ch === "'" || ch === "’") {
      ignored.push(ch);
      continue;
    }
    const v = map[ch];
    if (v === undefined) {
      letters.push({ char: ch, value: 0, skipped: true });
      ignored.push(ch);
      continue;
    }
    letters.push({ char: ch, value: v });
    total += v;
  }
  return { total, letters, ignored };
}

function hasHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}
function hasArabic(s: string): boolean {
  return /[\u0600-\u06FF]/.test(s);
}

export function calculatePythagorean(name: string): SystemResult {
  const meta = SYSTEM_META.pythagorean;
  const normalized = normalizeLatinName(name);
  const chars = Array.from(normalized).filter(c => /[A-Z]/.test(c) || !/[A-Z0-9]/.test(c));
  // Only score A-Z after normalize
  const lettersOnly = Array.from(normalized).filter(c => /[A-Z]/.test(c));
  const { total, letters, ignored } = scoreWithMap(lettersOnly, PYTHAGOREAN);
  // ignored non-letters from original normalized
  const allIgnored = Array.from(normalized).filter(c => !/[A-Z]/.test(c) && c.trim());
  return {
    system: "pythagorean",
    ...meta,
    scriptDetected: "latin",
    total,
    reduced: reduceToSingleDigit(total),
    letters,
    ignoredChars: [...new Set([...ignored, ...allIgnored])],
  };
}

export function calculateChaldean(name: string): SystemResult {
  const meta = SYSTEM_META.chaldean;
  const normalized = normalizeLatinName(name);
  const lettersOnly = Array.from(normalized).filter(c => /[A-Z]/.test(c));
  const { total, letters, ignored } = scoreWithMap(lettersOnly, CHALDEAN);
  return {
    system: "chaldean",
    ...meta,
    scriptDetected: "latin-transliteration",
    total,
    reduced: reduceToSingleDigit(total, false),
    reducedChaldean: reduceChaldean(total),
    letters,
    ignoredChars: ignored,
  };
}

export function calculateAbjad(name: string): SystemResult {
  const meta = SYSTEM_META.abjad;
  // Prefer Arabic letters from original; if none, return empty with note via ignored
  const chars = Array.from(name.normalize("NFC"));
  const arabicChars = chars.filter(c => ABJAD[c] !== undefined || hasArabic(c));
  const mapChars = chars.filter(c => !/\s/.test(c));
  const { total, letters, ignored } = scoreWithMap(mapChars, ABJAD);
  return {
    system: "abjad",
    ...meta,
    scriptDetected: hasArabic(name) ? "arabic" : "none-latin-input",
    total,
    reduced: reduceToSingleDigit(total, false),
    letters,
    ignoredChars: ignored,
  };
}

export function calculateHebrew(name: string): SystemResult {
  const meta = SYSTEM_META.hebrew;
  const chars = Array.from(name.normalize("NFC")).filter(c => !/\s/.test(c));
  const { total, letters, ignored } = scoreWithMap(chars, HEBREW_HECHRECHI);
  return {
    system: "hebrew",
    ...meta,
    scriptDetected: hasHebrew(name) ? "hebrew" : "none-latin-input",
    total,
    reduced: reduceToSingleDigit(total, false),
    letters,
    ignoredChars: ignored,
  };
}

/** Vedic practice = Chaldean on transliterated Latin names. */
export function calculateVedic(name: string): SystemResult {
  const base = calculateChaldean(name);
  const meta = SYSTEM_META.vedic;
  return {
    ...base,
    system: "vedic",
    label: meta.label,
    numberRange: meta.numberRange,
    notes: meta.notes,
    scriptDetected: "latin-transliteration-vedic",
  };
}

export type FullNameProfile = {
  fullName: string;
  birthDate: string | null;
  systems: {
    pythagorean: SystemResult;
    chaldean: SystemResult;
    abjad: SystemResult;
    hebrew: SystemResult;
    vedic: SystemResult;
  };
  /** Classic Western core numbers (Pythagorean letters + birth date) */
  coreNumbers: {
    lifePathNumber: number | null;
    expressionNumber: number;
    soulUrgeNumber: number;
    personalityNumber: number;
    birthDayNumber: number | null;
  };
  computedAt: string;
};

const VOWELS_PYTH = new Set(["A", "E", "I", "O", "U"]);

function expressionPythagorean(name: string): number {
  return calculatePythagorean(name).reduced ?? 0;
}

function soulUrgePythagorean(name: string): number {
  const normalized = normalizeLatinName(name);
  let sum = 0;
  for (const ch of normalized) {
    if (VOWELS_PYTH.has(ch) && PYTHAGOREAN[ch]) sum += PYTHAGOREAN[ch];
  }
  return reduceToSingleDigit(sum);
}

function personalityPythagorean(name: string): number {
  const normalized = normalizeLatinName(name);
  let sum = 0;
  for (const ch of normalized) {
    if (/[A-Z]/.test(ch) && !VOWELS_PYTH.has(ch) && PYTHAGOREAN[ch])
      sum += PYTHAGOREAN[ch];
  }
  return reduceToSingleDigit(sum);
}

function lifePath(birthDate: string): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  const total =
    reduceToSingleDigit(y) + reduceToSingleDigit(m) + reduceToSingleDigit(d);
  return reduceToSingleDigit(total);
}

function birthDay(birthDate: string): number {
  return reduceToSingleDigit(parseInt(birthDate.split("-")[2], 10));
}

/**
 * Full multi-system name profile.
 * Always runs all five systems (empty totals if script not present).
 */
export function calculateFullNameProfile(
  fullName: string,
  birthDate?: string | null
): FullNameProfile {
  if (!fullName?.trim()) throw new Error("fullName is required");
  const date =
    birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : null;

  return {
    fullName: fullName.trim(),
    birthDate: date,
    systems: {
      pythagorean: calculatePythagorean(fullName),
      chaldean: calculateChaldean(fullName),
      abjad: calculateAbjad(fullName),
      hebrew: calculateHebrew(fullName),
      vedic: calculateVedic(fullName),
    },
    coreNumbers: {
      lifePathNumber: date ? lifePath(date) : null,
      expressionNumber: expressionPythagorean(fullName),
      soulUrgeNumber: soulUrgePythagorean(fullName),
      personalityNumber: personalityPythagorean(fullName),
      birthDayNumber: date ? birthDay(date) : null,
    },
    computedAt: new Date().toISOString(),
  };
}

export function listLetterSystems() {
  return (Object.keys(SYSTEM_META) as LetterSystemId[]).map(id => ({
    id,
    ...SYSTEM_META[id],
    route: `POST /v1/name/${id}`,
  }));
}

/** Back-compat wrapper used by chart pipeline. */
export function calculateCompleteProfile(name: string, birthDate: string) {
  const full = calculateFullNameProfile(name, birthDate);
  return {
    systems: full.systems,
    coreNumbers: full.coreNumbers,
    // legacy-shaped fields for older clients
    englishGematria: {
      ordinal: full.systems.pythagorean.total,
      reduced: full.systems.pythagorean.reduced,
    },
    hebrewGematria: {
      value: full.systems.hebrew.total,
      reduced: full.systems.hebrew.reduced,
      method: "mispar_hechrechi",
    },
    numerology: {
      lifePathNumber: full.coreNumbers.lifePathNumber,
      expressionNumber: full.coreNumbers.expressionNumber,
      soulUrgeNumber: full.coreNumbers.soulUrgeNumber,
      personalityNumber: full.coreNumbers.personalityNumber,
      birthDayNumber: full.coreNumbers.birthDayNumber,
      system: "pythagorean",
    },
    letterBreakdown: full.systems.pythagorean.letters.map(l => ({
      letter: l.char,
      ordinalValue: l.value,
      reducedValue: reduceToSingleDigit(l.value, false),
    })),
  };
}
