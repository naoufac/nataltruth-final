import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/App";
import { BACKEND_URL } from "@/lib/apiConfig";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * Founder admin view: shows live entitlement for current email + link to nao.
 * Full CMS remains nao.nataltruth.com; this is API-linked, not a dead /admin/* shell.
 */
export default function AdminPage() {
  const { user } = useAuth();
  const [ent, setEnt] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`${BACKEND_URL}/v1/entitlements?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setEnt(d.entitlement);
        else setErr(d.error || "failed");
      })
      .catch((e) => setErr(e.message));
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-lg mx-auto">
        <Link to="/dashboard" className="text-sm text-muted-foreground flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="font-serif text-2xl mb-4">Account / plan</h1>
        <div className="glass-card rounded-xl p-5 border border-border space-y-2 text-sm">
          <p>
            Email: <strong>{user?.email || "—"}</strong>
          </p>
          <p>
            Plan (from API): <strong>{ent?.plan || user?.plan || "…"}</strong>
          </p>
          <p>
            Default engine: <strong>{ent?.engineDefault || user?.engineDefault || "—"}</strong>
          </p>
          {err && <p className="text-destructive">{err}</p>}
          <p className="text-xs text-muted-foreground pt-2">
            Entitlements: GET {BACKEND_URL}/v1/entitlements — founder{" "}
            <code>nchobah@gmail.com</code> is seeded <strong>ultra</strong>.
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Product admin UI host:{" "}
          <a className="text-primary underline" href="https://nao.nataltruth.com">
            nao.nataltruth.com
          </a>{" "}
          (backend remains api.nataltruth.com).
        </p>
        <Link to="/chart" className="inline-block mt-4">
          <Button>Open chart (Swiss for Ultra)</Button>
        </Link>
      </div>
    </div>
  );
}
