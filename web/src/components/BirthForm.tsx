import { useState, type FormEvent } from "react";
import { api, type BirthInput, type CalculateResponse } from "../lib/api";

interface Props {
  onResult: (data: CalculateResponse) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const empty: BirthInput = {
  fullName: "",
  birthDate: "",
  birthTime: "",
  birthTimeAccuracy: "exact",
  birthPlaceLabel: "",
  latitude: 0,
  longitude: 0,
  utcOffset: "+00:00",
  engineMode: "swiss",
};

export default function BirthForm({ onResult, onLoadingChange }: Props) {
  const [form, setForm] = useState<BirthInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof BirthInput>(key: K, value: BirthInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    onLoadingChange?.(true);
    try {
      const data = await api.calculate(form);
      onResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed.");
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }

  const accuracyUnknown = form.birthTimeAccuracy === "unknown";

  return (
    <form onSubmit={submit} className="card flex flex-col gap-5 p-6 sm:p-8">
      <div>
        <label className="label" htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          className="input"
          required
          placeholder="Jane Example"
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          Used for the name-number reading across five traditions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="birthDate">Birth date</label>
          <input
            id="birthDate"
            type="date"
            className="input"
            required
            value={form.birthDate}
            onChange={(e) => set("birthDate", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="birthTime">Birth time</label>
          <input
            id="birthTime"
            type="time"
            className="input"
            disabled={accuracyUnknown}
            value={accuracyUnknown ? "" : form.birthTime ?? ""}
            onChange={(e) => set("birthTime", e.target.value)}
          />
        </div>
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="label w-full">Time accuracy</legend>
        {(["exact", "approximate", "unknown"] as const).map((opt) => (
          <label
            key={opt}
            className={`chip cursor-pointer ${
              form.birthTimeAccuracy === opt ? "!bg-primary-soft !text-primary-ink" : ""
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              name="accuracy"
              checked={form.birthTimeAccuracy === opt}
              onChange={() => set("birthTimeAccuracy", opt)}
            />
            {opt[0].toUpperCase() + opt.slice(1)}
          </label>
        ))}
      </fieldset>

      {accuracyUnknown && (
        <p className="rounded-xl bg-[color:var(--bg-subtle)] px-4 py-3 text-sm text-warn">
          Without a birth time, houses and your Rising sign aren&apos;t shown — we won&apos;t guess
          them. Planet positions use a noon estimate.
        </p>
      )}

      <div>
        <label className="label" htmlFor="place">Birthplace</label>
        <input
          id="place"
          className="input"
          required
          placeholder="Casablanca, Morocco"
          value={form.birthPlaceLabel}
          onChange={(e) => set("birthPlaceLabel", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="lat">Latitude</label>
          <input
            id="lat"
            type="number"
            step="any"
            min="-90"
            max="90"
            className="input font-mono"
            required
            placeholder="33.5731"
            value={form.latitude || ""}
            onChange={(e) => set("latitude", parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label className="label" htmlFor="lon">Longitude</label>
          <input
            id="lon"
            type="number"
            step="any"
            min="-180"
            max="180"
            className="input font-mono"
            required
            placeholder="-7.5898"
            value={form.longitude || ""}
            onChange={(e) => set("longitude", parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label className="label" htmlFor="offset">UTC offset</label>
          <input
            id="offset"
            className="input font-mono"
            placeholder="+01:00"
            value={form.utcOffset ?? ""}
            onChange={(e) => set("utcOffset", e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-[color:var(--bg-subtle)] px-4 py-3 text-sm text-warn">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
        {loading ? "Calculating…" : "Reveal my chart"}
      </button>
      <p className="text-xs text-ink-faint">
        Free, always. Nothing stored, nothing invented.
      </p>
    </form>
  );
}
