import { useState } from "react";
import BirthForm from "../components/BirthForm";
import Reading from "../components/Reading";
import ShareCard from "../components/ShareCard";
import { api, type BirthInput, type CalculateResponse } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function ReadingPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [lastInput, setLastInput] = useState<BirthInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-14">
      {!result && (
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl">Your reading</h1>
          <p className="mt-3 text-ink-soft">
            Enter your birth details. We calculate with the Swiss Ephemeris and return the full chart
            and name-number profile — nothing hidden, nothing invented.
          </p>
        </div>
      )}

      {!result && (
        <BirthForm
          onResult={(data, input) => { setResult(data); setLastInput(input); setSaved(false); }}
          onLoadingChange={setLoading}
        />
      )}

      {loading && <p className="mt-8 text-ink-faint">Working the ephemeris…</p>}

      {result && (
        <div className="flex flex-col gap-12">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl">Your chart, told straight</h1>
            <button
              className="btn-ghost text-sm"
              onClick={() => { setResult(null); setLastInput(null); }}
            >
              ↺ New reading
            </button>
          </div>

          {/* Save to account */}
          {lastInput && (
            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                saved ? (
                  <span className="chip !bg-trust-soft !text-trust">✓ Saved to your charts</span>
                ) : (
                  <button
                    className="btn-primary"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await api.saveChart({
                          name: `${lastInput.fullName}'s chart`,
                          label: lastInput.birthPlaceLabel,
                          input: lastInput as unknown as Record<string, unknown>,
                          snapshot: result.snapshot as unknown as Record<string, unknown>,
                        });
                        setSaved(true);
                      } catch (e) {
                        alert(e instanceof Error ? e.message : "Could not save.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? "Saving…" : "Save to my charts"}
                  </button>
                )
              ) : (
                <p className="text-sm text-ink-soft">
                  <Link to="/login" className="font-medium text-primary-ink">Sign in</Link> to save this chart.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
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
