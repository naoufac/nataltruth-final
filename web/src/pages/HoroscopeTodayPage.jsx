import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/App";
import {
  calculateChart,
  adaptChartForUi,
  nameFull,
  loadLocalProfile,
  resolveEngine,
} from "@/lib/nataltruth";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Sun, Moon, Star } from "lucide-react";

/**
 * Personal sky snapshot from LIVE natal calculate + name — not a content CMS.
 * Uses api.nataltruth.com (no static placeholder).
 */
export default function HoroscopeTodayPage() {
  const { user } = useAuth();
  const [chart, setChart] = useState(null);
  const [name, setName] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = loadLocalProfile() || user || {};
        if (!profile.birth_date || profile.latitude == null || profile.longitude == null) {
          setError(
            "Add birth date + latitude/longitude in registration or Settings, then open this page again for a live chart-based reading."
          );
          return;
        }
        const engine = resolveEngine(profile);
        const raw = await calculateChart(profile, engine);
        setChart(adaptChartForUi(raw, profile));
        const fullName = profile.birth_name || profile.name || user?.name;
        if (fullName) {
          setName(await nameFull(fullName, profile.birth_date));
        }
      } catch (e) {
        setError(e?.message || "Could not load live chart from api.nataltruth.com");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background cosmic-page-bg">
      <header className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between border-b border-border">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <span className="font-serif text-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> NatalTruth
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-serif text-3xl mb-2">Your chart, today</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Live natal snapshot from <code className="text-xs">api.nataltruth.com</code> (not a canned sun-sign blurb).
          Transits-by-date product API is not built yet — this is your real chart used for guidance.
        </p>

        {loading && <div className="animate-pulse h-32 rounded-xl bg-muted/40" />}
        {error && (
          <div className="glass-card rounded-xl p-6 border border-border">
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Link to="/auth?mode=register"><Button>Set birth profile</Button></Link>
              <Link to="/chart"><Button variant="outline">Chart</Button></Link>
            </div>
          </div>
        )}

        {chart && !loading && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="glass-card rounded-xl p-4 border border-border text-center">
                <Sun className="w-5 h-5 mx-auto text-primary mb-2" />
                <div className="text-xs text-muted-foreground">Sun</div>
                <div className="font-serif text-xl">{chart.sun_sign || "—"}</div>
              </div>
              <div className="glass-card rounded-xl p-4 border border-border text-center">
                <Moon className="w-5 h-5 mx-auto text-primary mb-2" />
                <div className="text-xs text-muted-foreground">Moon</div>
                <div className="font-serif text-xl">{chart.moon_sign || "—"}</div>
              </div>
              <div className="glass-card rounded-xl p-4 border border-border text-center">
                <Star className="w-5 h-5 mx-auto text-primary mb-2" />
                <div className="text-xs text-muted-foreground">Rising</div>
                <div className="font-serif text-xl">{chart.rising_sign || "—"}</div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 border border-border">
              <h2 className="font-serif text-lg mb-3">Strong natal aspects (live)</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {(chart.aspects || []).slice(0, 8).map((a, i) => (
                  <li key={i}>
                    {a.planet1} {a.aspect || a.aspect_type} {a.planet2}
                    {a.orb != null ? ` · orb ${Number(a.orb).toFixed(2)}°` : ""}
                  </li>
                ))}
              </ul>
              {(chart.patterns || []).length > 0 && (
                <p className="text-xs mt-4 text-muted-foreground">
                  Patterns: {(chart.patterns || []).slice(0, 6).join(", ")}
                </p>
              )}
            </div>

            {name?.coreNumbers && (
              <div className="glass-card rounded-xl p-5 border border-border">
                <h2 className="font-serif text-lg mb-2">Name core numbers (live)</h2>
                <p className="text-sm text-muted-foreground">
                  Life path {name.coreNumbers.lifePathNumber ?? "—"} · Expression{" "}
                  {name.coreNumbers.expressionNumber ?? "—"} · Soul urge{" "}
                  {name.coreNumbers.soulUrgeNumber ?? "—"}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Link to="/chat"><Button>Ask AI coach about this chart</Button></Link>
              <Link to="/chart"><Button variant="outline">Full chart</Button></Link>
              <Link to="/numerology"><Button variant="outline">Numerology</Button></Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
