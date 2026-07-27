import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dest = (location.state as { from?: string })?.from || "/my-charts";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-prose flex min-h-[70vh] flex-col justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl">Welcome back</h1>
        <p className="mt-2 text-ink-soft">Sign in to see your saved charts.</p>

        <form onSubmit={submit} className="card mt-8 flex flex-col gap-4 p-6">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required className="input"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" required className="input"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="rounded-xl bg-[color:var(--bg-subtle)] px-4 py-3 text-sm text-warn">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          New here?{" "}
          <Link to="/register" className="font-medium text-primary-ink">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
