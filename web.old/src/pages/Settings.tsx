import { useAuth } from "../context/AuthContext";
import { usePrefs } from "../context/PrefsContext";
import { useNavigate } from "react-router-dom";

const SIZES = (["S", "M", "L", "XL"] as const);

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme, fontSize, setFontSize, readingMode, toggleReadingMode } = usePrefs();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="container-prose py-12">
      <h1 className="text-3xl sm:text-4xl">Settings</h1>
      <p className="mt-2 text-ink-soft">Make the reading comfortable for you.</p>

      <section className="card mt-8 p-6">
        <h2 className="text-lg">Text size</h2>
        <p className="mt-1 text-sm text-ink-faint">Bigger text is easier on the eyes.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                fontSize === s ? "bg-primary text-white" : "bg-bg-subtle text-ink-soft hover:text-ink"
              }`}
            >
              {s === "XL" ? "Extra large" : s === "L" ? "Large" : s === "M" ? "Medium" : "Small"}
            </button>
          ))}
        </div>
        <p className="mt-4 border-l-2 border-primary pl-4 text-ink-soft">
          The quick brown fox jumps over the lazy dog. Your Sun, your Moon, your way of reading.
        </p>
      </section>

      <section className="card mt-6 p-6">
        <h2 className="text-lg">Appearance</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`rounded-full px-5 py-2.5 text-sm font-medium ${theme === "light" ? "bg-primary text-white" : "bg-bg-subtle text-ink-soft"}`}
          >
            ☀︎ Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`rounded-full px-5 py-2.5 text-sm font-medium ${theme === "dark" ? "bg-primary text-white" : "bg-bg-subtle text-ink-soft"}`}
          >
            ☾ Dark
          </button>
          <button
            onClick={toggleReadingMode}
            className={`rounded-full px-5 py-2.5 text-sm font-medium ${readingMode ? "bg-primary text-white" : "bg-bg-subtle text-ink-soft"}`}
          >
            Reading mode {readingMode ? "✓" : ""}
          </button>
        </div>
        <p className="mt-3 text-sm text-ink-faint">Reading mode uses a serif typeface and wider lines for long articles.</p>
      </section>

      <section className="card mt-6 p-6">
        <h2 className="text-lg">Account</h2>
        <p className="mt-2 text-ink-soft">{user?.name} · {user?.email}</p>
        <button onClick={handleLogout} className="btn-ghost mt-4 text-warn">Sign out</button>
      </section>
    </div>
  );
}
