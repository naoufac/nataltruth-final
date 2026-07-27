import { useState } from "react";
import { Link } from "react-router-dom";
import { SIGNS, getCompatibility, type ZodiacSign } from "../lib/zodiac";
import TrustStrip from "../components/TrustStrip";

export default function Compatibility() {
  const [selected, setSelected] = useState<{ a: ZodiacSign; b: ZodiacSign } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  function cellId(a: number, b: number) {
    return `${SIGNS[a].id}-${SIGNS[b].id}`;
  }

  function scoreColor(score: number) {
    switch (score) {
      case 5: return "bg-[#7BAE43] text-white";
      case 4: return "bg-[#A8C97A] text-[#1F1B16]";
      case 3: return "bg-[#E8A93C] text-[#1F1B16]";
      case 2: return "bg-[#D8794F] text-white";
      default: return "bg-[#BF5A36] text-white";
    }
  }

  return (
    <div className="container-prose py-10 sm:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="chip mb-4">Real astrological compatibility</p>
        <h1 className="text-3xl sm:text-4xl">Zodiac compatibility</h1>
        <p className="mt-3 text-ink-soft">
          Every pairing has a story. Tap any square to see the real dynamic — based on elements,
          modalities, and aspect relationships. No fake percentages.
        </p>
      </header>

      <div className="mb-8 max-w-xl">
        <TrustStrip showLink={false} />
      </div>

      {/* The 12×12 grid */}
      <div className="card overflow-x-auto p-4 sm:p-6">
        <table className="w-full border-collapse text-center text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-bg-elevated p-2"></th>
              {SIGNS.map((s) => (
                <th key={s.id} className="p-2 min-w-[44px]">
                  <div className="flex flex-col items-center">
                    <span className="text-lg leading-none">{s.symbol}</span>
                    <span className="mt-0.5 text-[10px] text-ink-faint">{s.name.slice(0, 3)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIGNS.map((rowSign, rowIdx) => (
              <tr key={rowSign.id}>
                <td className="sticky left-0 z-10 bg-bg-elevated p-2">
                  <div className="flex flex-col items-center">
                    <span className="text-lg leading-none">{rowSign.symbol}</span>
                    <span className="mt-0.5 text-[10px] text-ink-faint">{rowSign.name.slice(0, 3)}</span>
                  </div>
                </td>
                {SIGNS.map((colSign, colIdx) => {
                  const compat = getCompatibility(rowSign, colSign);
                  const id = cellId(rowIdx, colIdx);
                  const isSelected = selected?.a.id === rowSign.id && selected?.b.id === colSign.id;
                  return (
                    <td key={colSign.id} className="p-1">
                      <button
                        onClick={() => setSelected({ a: rowSign, b: colSign })}
                        onMouseEnter={() => setHovered(id)}
                        onMouseLeave={() => setHovered(null)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold transition hover:scale-110 hover:shadow-md ${scoreColor(compat.score)} ${isSelected ? "ring-2 ring-[var(--ink)] ring-offset-1 ring-offset-[var(--bg-elevated)]" : ""}`}
                        title={`${rowSign.name} × ${colSign.name}: ${compat.label}`}
                        aria-label={`${rowSign.name} and ${colSign.name} compatibility: ${compat.label}`}
                      >
                        {compat.score}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-faint">
        <span>Scoring:</span>
        <span className="flex items-center gap-1"><span className="inline-block h-4 w-4 rounded bg-[#7BAE43]"></span> 5 Natural</span>
        <span className="flex items-center gap-1"><span className="inline-block h-4 w-4 rounded bg-[#A8C97A]"></span> 4 Electric</span>
        <span className="flex items-center gap-1"><span className="inline-block h-4 w-4 rounded bg-[#E8A93C]"></span> 3 Workable</span>
        <span className="flex items-center gap-1"><span className="inline-block h-4 w-4 rounded bg-[#D8794F]"></span> 2 Puzzle</span>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="card mt-8 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{selected.a.symbol}</span>
              <span className="font-serif text-xl">{selected.a.name}</span>
            </div>
            <span className="text-2xl text-ink-faint">×</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{selected.b.symbol}</span>
              <span className="font-serif text-xl">{selected.b.name}</span>
            </div>
          </div>

          {(() => {
            const compat = getCompatibility(selected.a, selected.b);
            return (
              <>
                <div className="mt-5 flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${scoreColor(compat.score)}`}>
                    {compat.score}/5
                  </span>
                  <span className="text-lg font-medium">{compat.label}</span>
                </div>
                <p className="mt-4 text-ink-soft">{compat.description}</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-[color:var(--bg-subtle)] p-4">
                    <p className="text-sm font-medium text-trust">Strengths</p>
                    <p className="mt-1 text-sm text-ink-soft">{compat.strength}</p>
                  </div>
                  <div className="rounded-xl bg-[color:var(--bg-subtle)] p-4">
                    <p className="text-sm font-medium text-warn">Challenges</p>
                    <p className="mt-1 text-sm text-ink-soft">{compat.challenge}</p>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 rounded-2xl bg-primary-soft p-6">
                  <h3 className="text-lg text-primary-ink">See the full picture</h3>
                  <p className="mt-1 text-sm text-primary-ink/80">
                    Sun signs are just the start. Your Moon, Venus, Mars, and houses tell the real story.
                    Get your free chart to see it all.
                  </p>
                  <Link to="/reading" className="btn-primary mt-4">
                    Reveal my chart →
                  </Link>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {!selected && (
        <div className="card mt-8 p-8 text-center">
          <p className="text-ink-soft">👆 Tap any square above to see the compatibility breakdown.</p>
        </div>
      )}
    </div>
  );
}
