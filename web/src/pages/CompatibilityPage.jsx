import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

/**
 * Two-person compare using LIVE calculate + name/full for each person.
 * Not classical synastry midpoints (no synastry API yet) — still real data.
 */
export default function CompatibilityPage() {
  const { user } = useAuth();
  const me = loadLocalProfile() || user || {};
  const [b, setB] = useState({
    fullName: "",
    birth_date: "",
    birth_time: "12:00",
    birth_place: "",
    latitude: "",
    longitude: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setB({ ...b, [e.target.name]: e.target.value });

  const run = async (e) => {
    e.preventDefault();
    if (!me.birth_date || me.latitude == null || me.longitude == null) {
      toast.error("Complete your own birth profile (date + lat/lon) first.");
      return;
    }
    if (!b.fullName || !b.birth_date || b.latitude === "" || b.longitude === "") {
      toast.error("Person B needs name, date, latitude, longitude.");
      return;
    }
    setLoading(true);
    try {
      const engine = resolveEngine(me);
      const [rawA, rawB, nameA, nameB] = await Promise.all([
        calculateChart(me, engine),
        calculateChart(
          {
            fullName: b.fullName,
            birth_date: b.birth_date,
            birth_time: b.birth_time,
            birth_place: b.birth_place || "Unknown",
            latitude: Number(b.latitude),
            longitude: Number(b.longitude),
          },
          engine
        ),
        nameFull(me.birth_name || me.name || "A", me.birth_date),
        nameFull(b.fullName, b.birth_date),
      ]);
      setResult({
        a: adaptChartForUi(rawA, me),
        b: adaptChartForUi(rawB, b),
        nameA,
        nameB,
      });
    } catch (err) {
      toast.error(err?.message || "Compare failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background cosmic-page-bg p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="text-sm text-muted-foreground flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="font-serif text-3xl mb-2">Compare two charts</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Runs <code className="text-xs">POST /v1/calculate/*</code> and{" "}
          <code className="text-xs">POST /v1/name/full</code> twice — real API data for you + person B.
        </p>

        <form onSubmit={run} className="glass-card rounded-xl p-5 border border-border space-y-3 mb-8">
          <p className="text-sm font-medium">Person B</p>
          <div>
            <Label>Full name</Label>
            <Input name="fullName" value={b.fullName} onChange={onChange} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Birth date</Label>
              <Input type="date" name="birth_date" value={b.birth_date} onChange={onChange} required />
            </div>
            <div>
              <Label>Birth time</Label>
              <Input name="birth_time" value={b.birth_time} onChange={onChange} placeholder="HH:mm" />
            </div>
          </div>
          <div>
            <Label>Place label</Label>
            <Input name="birth_place" value={b.birth_place} onChange={onChange} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Latitude</Label>
              <Input name="latitude" value={b.latitude} onChange={onChange} required />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input name="longitude" value={b.longitude} onChange={onChange} required />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Calculating…" : "Compare with my chart (live API)"}
          </Button>
        </form>

        {result && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "You", c: result.a, n: result.nameA },
              { label: "Person B", c: result.b, n: result.nameB },
            ].map(({ label, c, n }) => (
              <div key={label} className="glass-card rounded-xl p-4 border border-border">
                <h2 className="font-serif text-lg mb-2">{label}</h2>
                <p className="text-sm text-muted-foreground">
                  Sun {c.sun_sign} · Moon {c.moon_sign} · Rising {c.rising_sign}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Life path {n?.coreNumbers?.lifePathNumber ?? "—"} · Expression{" "}
                  {n?.coreNumbers?.expressionNumber ?? "—"}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Aspects: {(c.aspects || []).length} · Patterns: {(c.patterns || []).length}
                </p>
              </div>
            ))}
            <div className="sm:col-span-2">
              <Link to="/chat">
                <Button variant="outline">Open AI coach to discuss both charts</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
