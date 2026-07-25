import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import ReadingPage from "./pages/ReadingPage";

function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("nt-theme");
    if (stored) return stored === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("nt-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button className="btn-ghost text-sm" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
      {dark ? "Light" : "Dark"}
    </button>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-prose flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden>
            <circle cx="32" cy="38" r="13" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
            <path d="M6 42 H58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <circle cx="46" cy="20" r="4" className="fill-primary" />
          </svg>
          <span className="font-serif text-lg font-semibold tracking-tight">NatalTruth</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

function NotFound() {
  return (
    <div className="container-prose py-24 text-center">
      <h1 className="text-3xl">Page not found</h1>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/reading" element={<ReadingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/404" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-line">
        <div className="container-prose flex flex-col gap-1 py-8 text-sm text-ink-faint">
          <p>
            NatalTruth — real ephemeris math, plain language.{" "}
            <span className="text-trust">Swiss Ephemeris · Tropical · Placidus.</span>
          </p>
          <p>Calculated to the arc-minute. Nothing invented.</p>
        </div>
      </footer>
    </div>
  );
}
