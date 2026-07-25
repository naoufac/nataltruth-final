/**
 * BirthMoment — precision path for civil birth time → UTC → Julian Day.
 * Single path used by all calcs (create, update, API).
 */

export type BirthTimeAccuracy = "exact" | "approximate" | "unknown";

export type BirthMomentInput = {
  /** YYYY-MM-DD */
  birthDate: string;
  /** HH:mm or HH:mm:ss — ignored when accuracy is unknown (policy applies) */
  birthTime?: string | null;
  birthTimeAccuracy: BirthTimeAccuracy;
  /** IANA timezone, e.g. Africa/Casablanca — preferred */
  timeZoneId?: string | null;
  /**
   * Fixed offset at birth if IANA not available, e.g. "+01:00" or "-05:00".
   * Used only when timeZoneId is missing.
   */
  utcOffset?: string | null;
  /**
   * Policy when time is unknown: default local noon (documented, flagged).
   */
  unknownTimeLocalHour?: number;
};

export type BirthMoment = {
  birthDate: string;
  birthTimeLocal: string;
  birthTimeAccuracy: BirthTimeAccuracy;
  timeZoneId: string | null;
  utcOffsetUsed: string;
  /** Absolute instant (UTC) used for ephemeris */
  utcIso: string;
  julianDay: number;
  notes: string[];
};

function assertDate(birthDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error("birthDate must be YYYY-MM-DD");
  }
}

function normalizeTime(
  birthTime: string | null | undefined,
  accuracy: BirthTimeAccuracy,
  unknownHour: number
): { time: string; notes: string[] } {
  const notes: string[] = [];
  if (accuracy === "unknown" || !birthTime) {
    const hh = String(unknownHour).padStart(2, "0");
    notes.push(
      `Birth time unknown — using local ${hh}:00:00 by product policy (flagged on snapshot).`
    );
    return { time: `${hh}:00:00`, notes };
  }
  const m = birthTime.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) throw new Error("birthTime must be HH:mm or HH:mm:ss");
  const hh = String(Math.min(23, parseInt(m[1], 10))).padStart(2, "0");
  const mm = m[2];
  const ss = m[3] ?? "00";
  if (accuracy === "approximate") {
    notes.push("Birth time marked approximate — orb/house sensitivity applies.");
  }
  return { time: `${hh}:${mm}:${ss}`, notes };
}

/**
 * Parse ±HH:MM offset into minutes east of UTC.
 */
function offsetToMinutes(utcOffset: string): number {
  const m = utcOffset.trim().match(/^([+-])(\d{1,2}):?(\d{2})$/);
  if (!m) throw new Error(`Invalid utcOffset: ${utcOffset}`);
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

/**
 * Convert local civil datetime + fixed offset to UTC Date.
 * (IANA conversion is applied when timeZoneId is resolvable at runtime —
 * for v1 API we accept explicit utcOffset from the client/geocoder.)
 */
function localWithOffsetToUtc(
  birthDate: string,
  timeLocal: string,
  utcOffset: string
): Date {
  const [y, mo, d] = birthDate.split("-").map(Number);
  const [hh, mm, ss] = timeLocal.split(":").map(Number);
  // Interpret components as local wall time, then subtract offset to get UTC
  const asIfUtc = Date.UTC(y, mo - 1, d, hh, mm, ss || 0);
  const offsetMin = offsetToMinutes(utcOffset);
  return new Date(asIfUtc - offsetMin * 60_000);
}

/**
 * Julian Day (UT) from a UTC Date — same formula family as legacy ephemeris.
 */
export function dateToJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;

  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jd =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  jd = jd + (hour - 12) / 24;
  return jd;
}

/**
 * Resolve birth civil time to UTC + JD.
 * Prefer passing utcOffset from geocoder for the city at that date.
 */
export function resolveBirthMoment(input: BirthMomentInput): BirthMoment {
  assertDate(input.birthDate);
  const unknownHour = input.unknownTimeLocalHour ?? 12;
  const { time, notes } = normalizeTime(
    input.birthTime,
    input.birthTimeAccuracy,
    unknownHour
  );

  let utcOffset = input.utcOffset?.trim() || null;
  const timeZoneId = input.timeZoneId?.trim() || null;

  if (!utcOffset && timeZoneId) {
    // Without a full IANA library here, require client to send offset
    // (geocoding service will compute it). Keep zone id for the record.
    notes.push(
      `timeZoneId=${timeZoneId} recorded; utcOffset required for JD until geo-tz wired server-side.`
    );
  }

  if (!utcOffset) {
    utcOffset = "+00:00";
    notes.push(
      "WARNING: no utcOffset provided — defaulting to UTC+00:00. Pass city offset for precision."
    );
  }

  const utcDate = localWithOffsetToUtc(input.birthDate, time, utcOffset);
  const jd = dateToJulianDay(utcDate);

  return {
    birthDate: input.birthDate,
    birthTimeLocal: time,
    birthTimeAccuracy: input.birthTimeAccuracy,
    timeZoneId,
    utcOffsetUsed: utcOffset,
    utcIso: utcDate.toISOString(),
    julianDay: jd,
    notes,
  };
}
