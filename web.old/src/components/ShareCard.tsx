import { useRef } from "react";
import type { CalculateResponse } from "../lib/api";

// The shareable card — the organic growth lever (BRAND.md §5).
// Sized for Instagram stories (9:16-ish) and screenshot-friendly on phones.
export default function ShareCard({ data }: { data: CalculateResponse }) {
  const ref = useRef<HTMLDivElement>(null);
  const sun = data.snapshot.planets.find((p) => p.planet?.toLowerCase() === "sun");
  const moon = data.snapshot.planets.find((p) => p.planet?.toLowerCase() === "moon");

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My NatalTruth chart", text: "My chart, told straight.", url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied — paste it anywhere.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={ref}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-line bg-bg-elevated p-8"
        style={{ aspectRatio: "4 / 5" }}
      >
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 64 64" aria-hidden>
            <circle cx="32" cy="38" r="13" fill="none" stroke="var(--primary)" strokeWidth="3" />
            <path d="M6 42 H58" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="46" cy="20" r="4" fill="var(--primary)" />
          </svg>
          <span className="font-serif text-base font-semibold">NatalTruth</span>
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-wide text-ink-faint">Sun</p>
          <p className="font-serif text-4xl">{sun?.sign ?? "—"}</p>
          <p className="font-mono text-xs text-ink-soft">{sun?.signDegree.toFixed(2)}°</p>
        </div>
        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-ink-faint">Moon</p>
          <p className="font-serif text-3xl">{moon?.sign ?? "—"}</p>
        </div>

        <p className="absolute bottom-8 left-8 right-8 text-xs text-ink-faint">
          Swiss Ephemeris · Tropical · Placidus · made on nataltruth.com
        </p>
      </div>

      <button onClick={share} className="btn-primary w-full max-w-sm">
        Share my chart
      </button>
      <p className="text-xs text-ink-faint">
        Screenshot the card, or share the link. Your private details stay with you.
      </p>
    </div>
  );
}
