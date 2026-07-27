import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/App";
import {
  calculateChart,
  adaptChartForUi,
  loadLocalProfile,
  resolveEngine,
} from "@/lib/nataltruth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap } from "lucide-react";

/**
 * Natal dynamics from live calculate (aspects + patterns).
 * Honest: not ephemeris-of-today transits until that API exists.
 */
export default function TransitsPage() {
  const { user } = useAuth();
  const [chart, setChart] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const profile = loadLocalProfile() || user || {};
        if (!profile.birth_date || profile.latitude == null || profile.longitude == null) {
          setError("Birth date + lat/lon required. Set them in Settings.");
          return;
        }
        const raw = await calculateChart(profile, resolveEngine(profile));
        setChart(adaptChartForUi(raw, profile));
      } catch (e) {
        setError(e?.message || "Calculate failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background cosmic-page-bg p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="text-sm text-muted-foreground flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="font-serif text-3xl mb-2 flex items-center gap-2">
          <Zap className="w-7 h-7 text-primary" /> Chart dynamics
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Live aspects & patterns from <strong>your natal chart</strong> (Swiss/Moshier API).
          Sky-right-now transit tables are not on the API yet — this page is still fully useful and API-backed.
        </p>
        {loading && <div className="h-24 animate-pulse bg-muted/40 rounded-xl" />}
        {error && (
          <div className="glass-card p-6 rounded-xl border border-border">
            <p className="mb-4 text-muted-foreground">{error}</p>
            <Link to="/settings"><Button>Open settings</Button></Link>
          </div>
        )}
        {chart && (
          <>
            <div className="glass-card rounded-xl p-5 border border-border mb-4">
              <h2 className="font-serif text-lg mb-3">Aspects (live)</h2>
              <ul className="space-y-2 text-sm text-muted-foreground max-h-96 overflow-auto">
                {(chart.aspects || []).map((a, i) => (
                  <li key={i} className="border-b border-border/50 pb-1">
                    {a.planet1} · {a.aspect || a.aspect_type} · {a.planet2}
                    {a.orb != null ? ` (${Number(a.orb).toFixed(2)}°)` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-xl p-5 border border-border mb-6">
              <h2 className="font-serif text-lg mb-2">Patterns (live)</h2>
              <p className="text-sm text-muted-foreground">
                {(chart.patterns || []).length
                  ? (chart.patterns || []).join(", ")
                  : "No multi-planet patterns flagged for this chart."}
              </p>
            </div>
            <Link to="/chat"><Button>Discuss with AI coach</Button></Link>
          </>
        )}
      </div>
    </div>
  );
}
