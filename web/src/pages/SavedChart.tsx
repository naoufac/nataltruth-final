import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type SavedChart } from "../lib/api";
import Reading from "../components/Reading";
import ShareCard from "../components/ShareCard";

export default function SavedChartPage() {
  const { id } = useParams();
  const [chart, setChart] = useState<SavedChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getChart(id!)
      .then((r) => setChart(r.chart))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container-prose py-20 text-ink-faint">Loading…</div>;
  if (error || !chart) {
    return (
      <div className="container-prose py-20 text-center">
        <h1 className="text-2xl">That chart couldn&apos;t be found.</h1>
        <Link to="/my-charts" className="btn-primary mt-6">Back to my charts</Link>
      </div>
    );
  }

  // Re-wrap the stored snapshot into the shape Reading/ShareCard expect.
  const data = {
    ok: true,
    engineMode: chart.snapshot.engineMode,
    ephemeris: chart.snapshot.ephemeris,
    planetaryPositions: chart.snapshot.planets,
    houseCusps: chart.snapshot.houses,
    aspects: chart.snapshot.aspects,
    patterns: chart.snapshot.patterns,
    name: chart.snapshot.numerology,
    snapshot: chart.snapshot,
  } as any;

  return (
    <div className="container-prose py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl">{chart.name}</h1>
        <Link to="/my-charts" className="btn-ghost text-sm">← My charts</Link>
      </div>
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_22rem]">
        <Reading data={data} />
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ShareCard data={data} />
        </aside>
      </div>
    </div>
  );
}
