import { useState, useRef, useEffect, type FormEvent } from "react";
import { api, type BirthInput, type CalculateResponse } from "../lib/api";

interface Props {
  onResult: (data: CalculateResponse, input: BirthInput) => void;
  onLoadingChange?: (loading: boolean) => void;
}

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

interface ResolvedPlace {
  place: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffset: string;
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
  const [placeQuery, setPlaceQuery] = useState("");
  const [resolvedPlace, setResolvedPlace] = useState<ResolvedPlace | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  function set<K extends keyof BirthInput>(key: K, value: BirthInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // City autocomplete with debounce
  useEffect(() => {
    if (placeQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/places/autocomplete?q=${encodeURIComponent(placeQuery)}`
        );
        const data = await res.json();
        if (data.ok) {
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch {
        /* network */
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [placeQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function selectSuggestion(s: Suggestion) {
    setShowSuggestions(false);
    setPlaceQuery(s.description);
    resolvePlace(s.description);
  }

  async function resolvePlace(query: string) {
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/places/resolve?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.ok && data.place) {
        const p = data.place as ResolvedPlace;
        setResolvedPlace(p);
        set("birthPlaceLabel", p.place.split(",")[0] + ", " + (p.place.split(",").pop()?.trim() || ""));
        set("latitude", p.latitude);
        set("longitude", p.longitude);
        set("utcOffset", p.utcOffset);
      } else {
        setError("Couldn't find that place. Try a different spelling.");
      }
    } catch {
      setError("Couldn't look up that place. Check your connection.");
    } finally {
      setSearching(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!resolvedPlace) {
      setError("Please select your birthplace from the suggestions.");
      return;
    }
    if (form.birthTimeAccuracy !== "unknown" && !form.birthTime) {
      setError("Please enter your birth time, or set accuracy to 'Unknown'.");
      return;
    }

    setLoading(true);
    onLoadingChange?.(true);
    try {
      const data = await api.calculate(form);
      onResult(data, form);
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
      {/* Name */}
      <div>
        <label className="label" htmlFor="fullName">Your full name</label>
        <input
          id="fullName"
          className="input"
          required
          placeholder="Jane Example"
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
        />
        <p className="mt-1.5 text-xs text-ink-faint">Used for your name-number reading across five traditions.</p>
      </div>

      {/* Date + Time */}
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

      {/* Time accuracy */}
      <fieldset className="flex flex-wrap gap-2">
        <legend className="label w-full">Do you know the exact time?</legend>
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
            {opt === "exact" ? "Yes, exact" : opt === "approximate" ? "Roughly" : "No, I don't know it"}
          </label>
        ))}
      </fieldset>

      {accuracyUnknown && (
        <p className="rounded-xl bg-[color:var(--bg-subtle)] px-4 py-3 text-sm text-warn">
          Without a birth time, houses and your Rising sign won't be shown — we won't guess them.
          Planet positions use a noon estimate.
        </p>
      )}

      {/* City search — the key UX improvement */}
      <div className="relative" ref={suggestionsRef}>
        <label className="label" htmlFor="place">Birthplace</label>
        <div className="relative">
          <input
            id="place"
            className="input pr-10"
            required
            placeholder="Start typing a city name..."
            value={placeQuery}
            onChange={(e) => {
              setPlaceQuery(e.target.value);
              setResolvedPlace(null);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary" />
            </div>
          )}
          {resolvedPlace && !searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-trust">✓</div>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-bg-elevated shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="block w-full border-b border-line px-4 py-3 text-left last:border-0 hover:bg-bg-subtle"
              >
                <p className="font-medium">{s.mainText}</p>
                <p className="text-sm text-ink-faint">{s.secondaryText}</p>
              </button>
            ))}
          </div>
        )}

        {/* Resolved info */}
        {resolvedPlace && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
            <span className="font-mono">{resolvedPlace.latitude.toFixed(4)}°, {resolvedPlace.longitude.toFixed(4)}°</span>
            <span>·</span>
            <span>UTC {resolvedPlace.utcOffset}</span>
            <span>·</span>
            <span className="text-trust">Resolved</span>
          </div>
        )}

        <p className="mt-1.5 text-xs text-ink-faint">
          Type your birth city and select it from the list. We handle the coordinates automatically.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-[color:var(--bg-subtle)] px-4 py-3 text-sm text-warn">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full text-base sm:w-auto" disabled={loading || searching}>
        {loading ? "Calculating…" : searching ? "Locating…" : "Reveal my chart"}
      </button>
      <p className="text-xs text-ink-faint">
        Free, always. Nothing stored unless you save it.
      </p>
    </form>
  );
}
