import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, name || undefined);
      navigate("/my-charts", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-prose flex min-h-[70vh] flex-col justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl">Create your account</h1>
        <p className="mt-2 text-ink-soft">Save your charts and come back any time. Free.</p>

        <form onSubmit={submit} className="card mt-8 flex flex-col gap-4 p-6">
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input id="name" type="text" autoComplete="name" className="input"
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required className="input"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="new-password" required minLength={8} className="input"
              placeholder="At least 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="rounded-xl bg-[color:var(--bg-subtle)] px-4 py-3 text-sm text-warn">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary-ink">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
