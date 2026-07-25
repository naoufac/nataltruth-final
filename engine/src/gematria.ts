/**
 * Name calculation entry — re-exports multi-system engine.
 * Full implementation: nameSystems.ts
 */
export {
  calculateCompleteProfile,
  calculateFullNameProfile,
  calculatePythagorean,
  calculateChaldean,
  calculateAbjad,
  calculateHebrew,
  calculateVedic,
  listLetterSystems,
  normalizeLatinName,
  reduceToSingleDigit,
  type FullNameProfile,
  type SystemResult,
  type LetterSystemId,
} from "./nameSystems.js";
