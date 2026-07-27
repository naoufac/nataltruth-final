import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  MessageCircle,
  BarChart3,
  Crown,
  RefreshCw,
  Sun,
  Moon,
  ArrowLeft,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const PLAN_LABELS: Record<string, string> = {
  free: "Seeker",
  monthly: "Enthusiast",
  premium: "Advanced",
  ultra: "Professional",
};

const PLAN_COLORS: Record<string, string> = {
  Seeker: "bg-muted text-muted-foreground",
  Enthusiast: "bg-blue-500/15 text-blue-400",
  Advanced: "bg-primary/15 text-primary",
  Professional: "bg-yellow-500/15 text-yellow-500",
};

const ZODIAC_GLYPHS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const ZODIAC_ORDER = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

export default function AdminPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/v1/admin/stats?email=${encodeURIComponent(user.email)}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
      } else {
        setError(json.error || "Failed to load admin data.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background cosmic-page-bg flex items-center justify-center">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background cosmic-page-bg flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md text-center">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="font-serif text-xl mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const planBreakdown = data?.planBreakdown || {};
  const sunSigns = data?.sunSigns || {};
  const allUsers = data?.users || [];
  const maxSignCount = Math.max(...Object.values(sunSigns), 1);

  const filteredUsers = allUsers.filter((u: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q);
  });

  const metricCards = [
    { icon: Users, label: "Total Users", value: stats.totalUsers || 0, color: "text-primary" },
    { icon: MessageCircle, label: "Chat Messages", value: stats.chatMessages || 0, color: "text-blue-400" },
    { icon: BarChart3, label: "Chat Sessions", value: stats.chatSessions || 0, color: "text-green-400" },
    { icon: Crown, label: "Ultra Users", value: stats.advancedUsers || 0, color: "text-yellow-500" },
  ];

  const planEntries = Object.entries(planBreakdown).sort((a, b) => b[1] - a[1]);
  const maxPlanCount = Math.max(...planEntries.map(([, v]) => v), 1);

  const sortedSigns = ZODIAC_ORDER
    .filter(s => sunSigns[s])
    .map(s => ({ sign: s, count: sunSigns[s] }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-background cosmic-page-bg p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl text-foreground tracking-wide">ADMIN DASHBOARD</h1>
                <p className="text-sm text-muted-foreground">Manage users and view platform stats</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchData} disabled={loading} title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricCards.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card rounded-xl p-5 card-lift">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
              <p className="font-serif text-2xl lg:text-3xl text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Subscription + Sun Sign Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subscription Breakdown */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="font-medium text-foreground">SUBSCRIPTION BREAKDOWN</h2>
            </div>
            <div className="space-y-4">
              {planEntries.map(([plan, count]) => {
                const label = PLAN_LABELS[plan] || plan;
                const pct = maxPlanCount > 0 ? Math.round((count / maxPlanCount) * 100) : 0;
                const totalPct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-foreground">{label}</span>
                      <span className="text-sm text-muted-foreground">{count} ({totalPct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sun Sign Distribution */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-5 h-5 text-primary" />
              <h2 className="font-medium text-foreground">SUN SIGN DISTRIBUTION</h2>
            </div>
            {sortedSigns.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No chart data yet.</p>
            ) : (
              <div className="space-y-2.5">
                {sortedSigns.map(({ sign, count }) => (
                  <div key={sign} className="flex items-center gap-3">
                    <span className="text-lg w-6 text-center">{ZODIAC_GLYPHS[sign]}</span>
                    <span className="text-sm text-foreground w-20">{sign}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full transition-all duration-500" style={{ width: `${(count / maxSignCount) * 100}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All Users Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-medium text-foreground">ALL USERS ({allUsers.length})</h2>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="pl-9 pr-4 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors w-64"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u: any) => {
                  const planLabel = PLAN_LABELS[u.plan] || "Seeker";
                  const planColor = PLAN_COLORS[planLabel] || PLAN_COLORS.Seeker;
                  return (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 text-sm text-foreground font-medium">{u.name || "—"}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${planColor}`}>
                          {planLabel}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-muted-foreground">
            Data fetched from live SQLite + in-memory sessions. Last refresh: {new Date().toLocaleTimeString()}
          </p>
          <Link to="/dashboard" className="text-xs text-primary hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
