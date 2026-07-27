import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type SavedChart } from "../lib/api";

export default function MyCharts() {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api.listCharts()
      .then((r) => setCharts(r.charts))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function remove(id: string) {
    if (!confirm("Delete this chart? This can't be undone.")) return;
    try {
      await api.deleteChart(id);
      setCharts((c) => c.filter((x) => x.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not delete.");
    }
  }

  return (
    <div className="container-prose py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">My charts</h1>
          <p className="mt-2 text-ink-soft">Your saved readings, ready whenever you are.</p>
        </div>
        <Link to="/reading" className="btn-primary">+ New chart</Link>
      </div>

      {loading && <p className="mt-8 text-ink-faint">Loading…</p>}
      {error && <p className="mt-8 text-warn">{error}</p>}

      <div className="mt-8 flex flex-col gap-3">
        {charts.map((c) => {
          const sun = c.snapshot.planets.find((p) => p.planet.toLowerCase() === "sun");
          const moon = c.snapshot.planets.find((p) => p.planet.toLowerCase() === "moon");
          return (
            <div key={c.id} className="card flex items-center justify-between gap-4 p-5">
              <Link to={`/chart/${c.id}`} className="flex-1">
                <p className="font-serif text-lg">{c.name}</p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {sun?.sign} Sun · {moon?.sign} Moon
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </Link>
              <div className="flex items-center gap-2">
                <Link to={`/chart/${c.id}`} className="btn-ghost text-sm">View</Link>
                <button onClick={() => remove(c.id)} className="btn-ghost text-sm text-warn">Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && charts.length === 0 && (
        <div className="card mt-8 p-8 text-center">
          <p className="text-ink-soft">You haven&apos;t saved any charts yet.</p>
          <Link to="/reading" className="btn-primary mt-4">Create your first chart</Link>
        </div>
      )}
    </div>
  );
}
