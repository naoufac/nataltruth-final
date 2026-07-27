import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  calculateChart,
  adaptChartForUi,
  resolveEngine,
} from "@/lib/nataltruth";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

/**
 * Shareable chart via query params (no token store on API yet).
 * Example: /chart/public/x?fullName=…&birthDate=…&latitude=…&longitude=…
 * Still fully API-linked via calculate.
 */
export default function PublicChartPage() {
  const [params] = useSearchParams();
  const [chart, setChart] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const birth = {
        fullName: params.get("fullName") || params.get("name") || "Guest",
        birth_date: params.get("birthDate") || params.get("birth_date"),
        birth_time: params.get("birthTime") || params.get("birth_time"),
        birth_place: params.get("place") || params.get("birth_place") || "Unknown",
        latitude: params.get("latitude") != null ? Number(params.get("latitude")) : null,
        longitude: params.get("longitude") != null ? Number(params.get("longitude")) : null,
        utc_offset: params.get("utcOffset") || params.get("utc_offset"),
      };
      if (!birth.birth_date || birth.latitude == null || Number.isNaN(birth.latitude) || birth.longitude == null) {
        setError(
          "This public link needs query params: birthDate, latitude, longitude (and optional fullName, birthTime). Example built from your Settings + Chart."
        );
        setLoading(false);
        return;
      }
      try {
        const engine = params.get("engine") === "moshier" ? "moshier" : "swiss";
        const raw = await calculateChart(birth, engine);
        setChart(adaptChartForUi(raw, birth));
      } catch (e) {
        setError(e?.message || "Calculate failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  return (
    <div className="min-h-screen bg-background cosmic-page-bg p-6">
      <div className="max-w-xl mx-auto text-center">
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
        <h1 className="font-serif text-2xl mb-4">Shared chart</h1>
        {loading && <p className="text-muted-foreground">Loading from api.nataltruth.com…</p>}
        {error && (
          <div className="text-left glass-card p-5 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Link to="/chart"><Button>Open my chart</Button></Link>
          </div>
        )}
        {chart && (
          <div className="glass-card rounded-xl p-6 border border-border text-left">
            <p className="text-sm text-muted-foreground mb-2">Live calculate result</p>
            <p className="font-serif text-xl">
              Sun {chart.sun_sign} · Moon {chart.moon_sign} · Rising {chart.rising_sign}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Planets {(Object.keys(chart.planets || {})).length} · Aspects {(chart.aspects || []).length} ·
              Patterns {(chart.patterns || []).length}
            </p>
            <Link to="/auth?mode=register" className="inline-block mt-6">
              <Button>Create your own on NatalTruth</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
