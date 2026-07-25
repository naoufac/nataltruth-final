import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePrefs } from "../context/PrefsContext";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="NatalTruth home">
      <svg width="24" height="24" viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="38" r="13" fill="none" stroke="var(--primary)" strokeWidth="3" />
        <path d="M6 42 H58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="46" cy="20" r="4" fill="var(--primary)" />
      </svg>
      <span className="font-serif text-lg font-semibold tracking-tight">NatalTruth</span>
    </Link>
  );
}

const navItems = [
  { to: "/reading", label: "My chart" },
  { to: "/compatibility", label: "Compatibility" },
  { to: "/blog", label: "Blog" },
];

export default function Nav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = usePrefs();
  const [open, setOpen] = useState(false); // mobile menu
  const [menu, setMenu] = useState(false); // account dropdown
  const navRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    await logout();
    setMenu(false);
    setOpen(false);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <nav className="container-prose flex h-16 items-center justify-between gap-4" ref={navRef}>
        <Logo />

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-[15px] transition ${
                  isActive ? "bg-primary-soft text-primary-ink font-medium" : "text-ink-soft hover:bg-bg-subtle hover:text-ink"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="rounded-full p-2.5 text-ink-soft transition hover:bg-bg-subtle hover:text-ink"
            aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? "☀︎" : "☾"}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenu((m) => !m)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-medium text-white"
                aria-label="Account menu"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-bg-elevated shadow-lg">
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-ink-faint">{user.email}</p>
                  </div>
                  <MenuLink to="/my-charts" onClick={() => setMenu(false)}>My charts</MenuLink>
                  <MenuLink to="/settings" onClick={() => setMenu(false)}>Settings</MenuLink>
                  {user.role === "admin" && (
                    <MenuLink to="/admin" onClick={() => setMenu(false)}>Admin · Blog</MenuLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-3 text-left text-[15px] text-ink-soft hover:bg-bg-subtle"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary hidden sm:inline-flex">
              Sign in
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="rounded-full p-2.5 text-ink-soft hover:bg-bg-subtle md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-line bg-bg-elevated md:hidden">
          <div className="container-prose flex flex-col py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-[17px] ${
                    isActive ? "bg-primary-soft text-primary-ink" : "text-ink hover:bg-bg-subtle"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {!user && (
              <Link to="/login" onClick={() => setOpen(false)} className="btn-primary mt-2">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="block px-4 py-3 text-[15px] hover:bg-bg-subtle">
      {children}
    </Link>
  );
}
