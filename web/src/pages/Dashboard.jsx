import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  MessageCircle,
  BarChart3,
  Calendar,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Star,
  Zap,
  TrendingUp,
  Target,
  Settings,
  Menu,
  X,
  Shield,
  Heart,
  Hash,
  Coffee,
  Play,
  Pause,
  Loader2,
  Lock,
  Volume2,
} from "lucide-react";

const VOICE_TIERS = new Set(["enthusiast", "advanced", "professional"]);

// ─── Voice Horoscope Player ──────────────────────────────────────────────
const VoiceHoroscopePlayer = ({ token, tier }) => {
  const navigate = useNavigate();
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const isPremium = VOICE_TIERS.has((tier || "").toLowerCase());

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handlePlay = async () => {
    if (!isPremium) {
      navigate("/pricing");
      return;
    }
    if (audioRef.current && audioUrl) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      return;
    }
    // No /guidance/voice on api.nataltruth.com — zero 404.
    setLoading(false);
    toast.message("Voice guidance is not available yet", {
      description: "Use Chart, Numerology, or Chat — those call live NatalTruth APIs.",
    });
  };

  return (
    <div
      className="mt-5 flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 p-3"
      data-testid="voice-horoscope-player"
    >
      <button
        onClick={handlePlay}
        disabled={loading}
        aria-label={isPremium ? (playing ? "Pause voice horoscope" : "Play voice horoscope") : "Unlock voice horoscope"}
        className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex-shrink-0"
        data-testid="voice-horoscope-play-btn"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : !isPremium ? (
          <Lock className="w-5 h-5" />
        ) : playing ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-foreground text-sm font-medium">
          <Volume2 className="w-3.5 h-3.5 text-primary" />
          Voice Horoscope
        </div>
        <p className="text-xs text-muted-foreground">
          {!isPremium
            ? "Upgrade to listen to today's reading"
            : loading
            ? "Channeling your reading…"
            : playing
            ? "Now playing your daily reading"
            : "Tap to hear today's reading"}
        </p>
      </div>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          preload="auto"
          data-testid="voice-horoscope-audio"
        />
      )}
    </div>
  );
};

// ─── Sidebar groups definition ─────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Daily",
    items: [
      { id: "overview", icon: BarChart3, label: "Overview" },
      { id: "chat",     icon: MessageCircle, label: "AI Coach",  href: "/chat" },
      { id: "friend",   icon: Coffee,        label: "AI Friend", href: "/friend" },
    ],
  },
  {
    label: "Your Chart",
    items: [
      { id: "chart",         icon: Sun,      label: "Birth Chart",   href: "/chart" },
      { id: "transits",      icon: Calendar, label: "Transits",      href: "/transits" },
      { id: "compatibility", icon: Heart,    label: "Compatibility", href: "/compatibility" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "settings", icon: Settings, label: "Settings", href: "/settings" },
    ],
  },
];

const ADMIN_ITEM = { id: "admin", icon: Shield, label: "Admin", href: "/admin" };

// ─── Sidebar ────────────────────────────────────────────────────────────
const Sidebar = ({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const groups = NAV_GROUPS.map((g) => {
    // Inject Admin under Account group for admins
    if (g.label === "Account" && user?.is_admin) {
      return { ...g, items: [...g.items, ADMIN_ITEM] };
    }
    return g;
  });

  const handleNavClick = (item) => {
    if (item.href) {
      navigate(item.href);
    } else {
      setActiveTab(item.id);
    }
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-serif text-xl text-foreground">NatalTruth</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-4 mb-1">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item)}
                      className={`sidebar-link w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                        activeTab === item.id ? "active" : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`nav-${item.id}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          data-testid="sidebar-theme-toggle"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-serif text-primary">
              {user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.sun_sign || "Seeker"}</p>
            </div>
          </div>
          <div className="zodiac-badge rounded-full px-3 py-1 text-xs inline-flex items-center gap-1">
            <Star className="w-3 h-3" />
            {user?.subscription_tier || "Seeker"} Plan
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={logout}
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card/50 backdrop-blur-sm border-r border-border flex-col h-screen fixed left-0 top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 h-screen w-72 bg-card border-r border-border flex flex-col z-50 transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
};

// ─── Mobile Header ───────────────────────────────────────────────────────
const MobileHeader = ({ setMobileOpen }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 glass-header p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
          data-testid="mobile-menu-btn"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-serif text-lg text-foreground">NatalTruth</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

// ─── Dashboard Overview ──────────────────────────────────────────────────
const DashboardOverview = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [dailyGuidance, setDailyGuidance] = useState(null);
  const [transits, setTransits] = useState([]);
  const [numerology, setNumerology] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullDashboard, setShowFullDashboard] = useState(
    () => localStorage.getItem("nataltruth_onboarding_skipped") === "true"
  );

  useEffect(() => {
    // Live API surface: name/full only. Guidance + transits not built yet.
    const fetchData = async () => {
      setDailyGuidance(null);
      setTransits([]);
      try {
        const fullName = user?.birth_name || user?.name;
        const birthDate = user?.birth_date;
        if (fullName) {
          const { nameFull, adaptNumerologyForUi } = await import("@/lib/nataltruth");
          const profile = await nameFull(fullName, birthDate);
          setNumerology(adaptNumerologyForUi(profile));
        } else {
          setNumerology(null);
        }
      } catch (err) {
        console.warn("Numerology via api.nataltruth.com failed:", err);
        setNumerology(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [token, user?.birth_name, user?.name, user?.birth_date]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card rounded-xl p-6 h-48 skeleton" />
        ))}
      </div>
    );
  }

  // Welcome card: show when numerology is null (new user, no chart) and not skipped
  const isNewUser = !numerology && !showFullDashboard;

  const handleSkipOnboarding = () => {
    localStorage.setItem("nataltruth_onboarding_skipped", "true");
    setShowFullDashboard(true);
  };

  if (isNewUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center" data-testid="welcome-card">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-2xl text-foreground mb-3">
            Welcome home, {user?.name?.split(" ")[0]}.
          </h1>
          <p className="text-muted-foreground mb-2 leading-relaxed">
            Your cosmic blueprint awaits.
          </p>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Your birth chart is ready to be calculated. It will reveal your planets, houses, aspects, numerology, and gematria — all in one place.
          </p>
          <Button
            className="w-full glow-button bg-primary text-primary-foreground h-12 rounded-xl mb-4"
            onClick={() => navigate("/chart")}
            data-testid="view-birth-chart-btn"
          >
            View Your Birth Chart →
          </Button>
          <button
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleSkipOnboarding}
            data-testid="explore-dashboard-btn"
          >
            Explore the dashboard first →
          </button>
        </div>
      </div>
    );
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="font-serif text-2xl lg:text-3xl text-foreground mb-1">
          {greeting}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm lg:text-base mb-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          {user?.sun_sign && ` · ${user.sun_sign} Sun`}
        </p>
        {transits.length > 0 && (
          <p className="text-muted-foreground/70 text-xs lg:text-sm italic">
            {transits[0].transit_type} is active in your chart —{" "}
            {transits[0].interpretation?.split(".")[0]?.toLowerCase() || "a time for reflection"}.
          </p>
        )}
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Energy - Large */}
        <div className="glass-card rounded-xl p-5 lg:p-6 md:col-span-2 lg:row-span-2" data-testid="daily-energy-card">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-primary" />
            <h2 className="font-medium text-foreground">Daily Energy</h2>
          </div>
          <p className="text-muted-foreground mb-6 leading-relaxed text-sm lg:text-base">
            {dailyGuidance?.overall_energy || "Loading your cosmic guidance..."}
          </p>
          <div className="space-y-3 lg:space-y-4">
            <h3 className="text-sm font-medium text-foreground">Focus Areas Today</h3>
            {dailyGuidance?.focus_areas?.map((area, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <Target className="w-4 h-4 text-primary flex-shrink-0" />
                {area}
              </div>
            ))}
          </div>
          <VoiceHoroscopePlayer token={token} tier={user?.subscription_tier} />
          <Button
            className="mt-4 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl w-full sm:w-auto"
            onClick={() => navigate("/chat")}
            data-testid="ask-coach-btn"
          >
            Ask Your AI Coach
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Sun Sign Card */}
        <div className="glass-card rounded-xl p-5 lg:p-6 card-lift" data-testid="sun-sign-card">
          <div className="flex items-center justify-between mb-4">
            <Sun className="w-7 lg:w-8 h-7 lg:h-8 text-primary" />
            <span className="zodiac-badge rounded-full px-3 py-1 text-xs">Sun</span>
          </div>
          <p className="font-serif text-xl lg:text-2xl text-foreground mb-1">{user?.sun_sign || "Unknown"}</p>
          <p className="text-xs text-muted-foreground">Your core identity</p>
        </div>

        {/* Quick Stats */}
        <div className="glass-card rounded-xl p-5 lg:p-6 card-lift" data-testid="quick-stats-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-500 font-medium">Active Transits</span>
          </div>
          <p className="font-serif text-2xl lg:text-3xl text-foreground mb-1">{transits.length}</p>
          <p className="text-xs text-muted-foreground">Influencing your chart</p>
        </div>

        {/* Action Items */}
        <div className="glass-card rounded-xl p-5 lg:p-6 md:col-span-2" data-testid="action-items-card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="font-medium text-foreground">Today's Actions</h2>
          </div>
          <div className="space-y-3">
            {dailyGuidance?.action_items?.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary/50" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Numerology Quick View */}
        {numerology && (numerology.life_path?.number || numerology.personal_year?.number) && (
          <div className="glass-card rounded-xl p-5 lg:p-6 md:col-span-2 lg:col-span-4" data-testid="numerology-dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary" />
                <h2 className="font-medium text-foreground">Your Numerology</h2>
              </div>
              <Link to="/chart" className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                Full Profile <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: "life_path",     label: "Life Path",     icon: Star },
                { key: "personal_year", label: "Personal Year", icon: Calendar },
                { key: "soul_urge",     label: "Soul Urge",     icon: Heart },
                { key: "expression",    label: "Expression",    icon: Zap },
              ].map(({ key, label, icon: Icon }) => {
                const entry = numerology[key];
                if (!entry?.number) return null;
                const isMaster = [11, 22, 33].includes(entry.number);
                return (
                  <div key={key} className="p-4 rounded-xl bg-muted/30 text-center">
                    <div className="flex justify-center mb-1">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className={`text-2xl font-bold mb-0.5 font-serif ${isMaster ? "text-yellow-400" : "text-primary"}`}>
                      {entry.number}{isMaster && <span className="text-xs ml-0.5">✦</span>}
                    </div>
                    <div className="text-xs font-medium text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{entry.keyword}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Transits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg lg:text-xl text-foreground">Upcoming Transits</h2>
          <Button
            variant="ghost"
            className="text-primary"
            onClick={() => navigate("/transits")}
            data-testid="view-all-transits-btn"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {transits.map((transit, i) => (
            <div key={transit.id} className="transit-card glass-card rounded-xl p-4 lg:p-5 card-lift" data-testid={`transit-card-${i}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-primary font-medium">{transit.transit_type}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(transit.peak_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{transit.interpretation}</p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full progress-animate" style={{ width: `${transit.strength * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground font-mono">{Math.round(transit.strength * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Default Export ──────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { token, updateUser } = useAuth();

  // Payment redirects: no /auth/me on calc API — local toast only (zero 404).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success" || params.get("reading") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      import("sonner").then(({ toast }) => {
        toast.message("Payments are not connected to NatalTruth API yet.");
      });
    }
  }, [token, updateUser]);

  return (
    <div className="min-h-screen bg-background cosmic-page-bg">
      <MobileHeader setMobileOpen={setMobileOpen} />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
        <DashboardOverview />
      </main>
    </div>
  );
}
