import { useState } from "react";
import BirthForm from "../components/BirthForm";
import Reading from "../components/Reading";
import ShareCard from "../components/ShareCard";
import type { CalculateResponse } from "../lib/api";

export default function ReadingPage() {
  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="container-prose py-10 sm:py-14">
      {!result && (
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl">Your reading</h1>
          <p className="mt-3 text-ink-soft">
            Enter your birth details. We calculate with the Swiss Ephemeris and return the full chart
            and name-number profile — nothing hidden behind a paywall, nothing invented.
          </p>
        </div>
      )}

      {!result && <BirthForm onResult={setResult} onLoadingChange={setLoading} />}

      {loading && (
        <p className="mt-8 text-ink-faint">Working the ephemeris…</p>
      )}

      {result && (
        <div className="flex flex-col gap-12">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl">Your chart, told straight</h1>
            <button
              className="btn-ghost text-sm"
              onClick={() => setResult(null)}
            >
              ↺ New reading
            </button>
          </div>
          <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
            <Reading data={result} />
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <ShareCard data={result} />
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
