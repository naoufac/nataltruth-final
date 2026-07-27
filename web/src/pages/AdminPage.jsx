import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/App";
import { API } from "@/App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles,
  Users,
  MessageCircle,
  TrendingUp,
  Sun,
  Moon,
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldOff,
  Crown,
  Search,
  RefreshCw,
  BarChart3,
  Calendar,
  Star,
  Heart,
  Receipt,
  CheckCircle2,
  Clock,
} from "lucide-react";

const TIER_COLORS = {
  seeker: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  enthusiast: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  advanced: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  professional: "bg-blue-500/10 text-blue-500 border-blue-500/20"
};

const TIER_ICONS = {
  seeker: Star,
  enthusiast: Star,
  advanced: Crown,
  professional: Shield
};

export default function AdminPage() {
  const { theme, toggleTheme } = useTheme();
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState(null);
  const [blast, setBlast] = useState({ subject: "", body_html: "", tier_filter: "all" });
  const [blastSending, setBlastSending] = useState(false);
  const [readingOrders, setReadingOrders] = useState([]);
  const [readingOrderMeta, setReadingOrderMeta] = useState({ counts: {}, paid_total_cents: 0 });
  const [readingFilter, setReadingFilter] = useState("all");
  const [readingUpdating, setReadingUpdating] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchReadingOrders = async (filter = readingFilter) => {
    try {
      const qs = filter && filter !== "all" ? `?status=${filter}&limit=100` : "?limit=100";
      const res = await axios.get(`${API}/admin/reading-orders${qs}`, authHeaders);
      setReadingOrders(res.data.orders || []);
      setReadingOrderMeta({
        counts: res.data.counts || {},
        paid_total_cents: res.data.paid_total_cents || 0,
      });
    } catch (error) {
      console.error("Error fetching reading orders:", error);
      toast.error("Failed to load reading orders");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, authHeaders),
        axios.get(`${API}/admin/users?limit=100`, authHeaders),
        fetchReadingOrders(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUserTier = async (userId, newTier) => {
    setUpdating(userId);
    try {
      await axios.put(`${API}/admin/users/${userId}/tier?tier=${newTier}`, {}, authHeaders);
      setUsers(users.map(u => u.id === userId ? { ...u, subscription_tier: newTier } : u));
      toast.success(`User updated to ${newTier} tier`);
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setUpdating(null);
    }
  };

  const toggleAdminRole = async (userId, currentIsAdmin) => {
    setUpdating(userId);
    try {
      const newRole = currentIsAdmin ? "user" : "admin";
      await axios.put(`${API}/admin/users/${userId}/role?role=${newRole}`, {}, authHeaders);
      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentIsAdmin, role: newRole } : u));
      toast.success(currentIsAdmin ? "Admin role revoked" : "Admin role granted");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const updateReadingStatus = async (orderId, newStatus) => {
    setReadingUpdating(orderId);
    try {
      await axios.put(
        `${API}/admin/reading-orders/${orderId}/status?status=${newStatus}`,
        {},
        authHeaders
      );
      toast.success(`Order marked ${newStatus}`);
      await fetchReadingOrders(readingFilter);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update order");
    } finally {
      setReadingUpdating(null);
    }
  };

  const handleReadingFilter = (next) => {
    setReadingFilter(next);
    fetchReadingOrders(next);
  };

  const upgradeAllUsers = async () => {
    try {
      const res = await axios.post(`${API}/admin/upgrade-all-users`, {}, authHeaders);
      toast.success(`Upgraded ${res.data.modified_count} users to Advanced tier`);
      fetchData();
    } catch (error) {
      toast.error("Failed to upgrade users");
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.sun_sign?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background cosmic-page-bg flex items-center justify-center">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cosmic-page-bg p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-3xl text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage users and view platform stats</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchData}
              className="gap-2 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="glass-card rounded-xl p-6" data-testid="stat-users">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                +{stats?.recent_signups || 0} this week
              </span>
            </div>
            <p className="font-serif text-3xl text-foreground mb-1">{stats?.total_users || 0}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </div>

          <div className="glass-card rounded-xl p-6" data-testid="stat-chats">
            <div className="flex items-center justify-between mb-4">
              <MessageCircle className="w-8 h-8 text-purple-500" />
            </div>
            <p className="font-serif text-3xl text-foreground mb-1">{stats?.total_chat_messages || 0}</p>
            <p className="text-sm text-muted-foreground">Chat Messages</p>
          </div>

          <div className="glass-card rounded-xl p-6" data-testid="stat-sessions">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-amber-500" />
            </div>
            <p className="font-serif text-3xl text-foreground mb-1">{stats?.total_chat_sessions || 0}</p>
            <p className="text-sm text-muted-foreground">Chat Sessions</p>
          </div>

          <div className="glass-card rounded-xl p-6" data-testid="stat-advanced">
            <div className="flex items-center justify-between mb-4">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <p className="font-serif text-3xl text-foreground mb-1">
              {stats?.subscription_breakdown?.advanced || 0}
            </p>
            <p className="text-sm text-muted-foreground">Advanced Users</p>
          </div>

          <div className="glass-card rounded-xl p-6" data-testid="stat-compatibility">
            <div className="flex items-center justify-between mb-4">
              <Heart className="w-8 h-8 text-pink-500" />
            </div>
            <p className="font-serif text-3xl text-foreground mb-1">
              {stats?.total_compatibility_reports || 0}
            </p>
            <p className="text-sm text-muted-foreground">Compatibility Reports</p>
          </div>
        </div>

        {/* Subscription Breakdown & Sun Signs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subscription Tiers */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Subscription Breakdown
            </h2>
            <div className="space-y-3">
              {["seeker", "enthusiast", "advanced", "professional"].map((tier) => {
                const count = stats?.subscription_breakdown?.[tier] || 0;
                const percentage = stats?.total_users ? Math.round((count / stats.total_users) * 100) : 0;
                const TierIcon = TIER_ICONS[tier];
                
                return (
                  <div key={tier} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TIER_COLORS[tier]}`}>
                      <TierIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground capitalize">{tier}</span>
                        <span className="text-sm text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Button 
              onClick={upgradeAllUsers}
              className="w-full mt-4 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade All to Advanced
            </Button>
          </div>

          {/* Sun Sign Distribution */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Sun Sign Distribution
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(stats?.sun_sign_distribution || {}).map(([sign, count]) => (
                <div key={sign} className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-sm font-medium text-foreground">{sign}</p>
                  <p className="text-xs text-muted-foreground">{count} users</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-medium text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              All Users ({filteredUsers.length})
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/30 border-border rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Sun Sign</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Birth Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tier</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Admin</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const TierIcon = TIER_ICONS[user.subscription_tier] || Star;
                  
                  return (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-serif text-primary relative">
                            {user.name?.[0] || "?"}
                            {user.is_admin && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                                <ShieldCheck className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="zodiac-badge rounded-full px-3 py-1 text-xs">
                          {user.sun_sign || "Unknown"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {user.birth_date || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={user.subscription_tier}
                          onValueChange={(value) => updateUserTier(user.id, value)}
                          disabled={updating === user.id}
                        >
                          <SelectTrigger className={`w-32 h-8 text-xs rounded-lg border ${TIER_COLORS[user.subscription_tier]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="seeker">Seeker</SelectItem>
                            <SelectItem value="enthusiast">Enthusiast</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAdminRole(user.id, user.is_admin)}
                          disabled={updating === user.id}
                          className={`h-8 px-3 rounded-lg ${
                            user.is_admin 
                              ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" 
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                          data-testid={`admin-toggle-${user.id}`}
                        >
                          {user.is_admin ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                              Admin
                            </>
                          ) : (
                            <>
                              <ShieldOff className="w-3.5 h-3.5 mr-1.5" />
                              User
                            </>
                          )}
                        </Button>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </div>

        {/* Reading Orders Table */}
        <div className="glass-card rounded-xl p-6 mb-8" data-testid="admin-reading-orders">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <h2 className="font-medium text-foreground">
                Personal Readings ({readingOrders.length})
              </h2>
              <span className="text-xs text-muted-foreground ml-2">
                Lifetime revenue: ${(readingOrderMeta.paid_total_cents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: `Pending (${readingOrderMeta.counts.pending || 0})` },
                { key: "paid", label: `Paid (${readingOrderMeta.counts.paid || 0})` },
                { key: "fulfilled", label: `Fulfilled (${readingOrderMeta.counts.fulfilled || 0})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleReadingFilter(key)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    readingFilter === key
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
                  }`}
                  data-testid={`reading-filter-${key}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {readingOrders.length === 0 ? (
            <div className="text-center py-10">
              <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No reading orders yet for this filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Buyer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Birth</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Notes</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {readingOrders.map((order) => {
                    const statusColor =
                      order.status === "paid"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : order.status === "fulfilled"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        : order.status === "refunded"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20";
                    const StatusIcon =
                      order.status === "fulfilled"
                        ? CheckCircle2
                        : order.status === "paid"
                        ? Sparkles
                        : Clock;

                    const birthLine = [order.birth_date, order.birth_time]
                      .filter(Boolean)
                      .join(" • ");

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        data-testid={`reading-order-${order.id}`}
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground text-sm">
                            {order.name || "Guest"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.email || "—"}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          <div>{birthLine || "—"}</div>
                          {order.birth_place && (
                            <div className="text-xs">{order.birth_place}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-xs text-muted-foreground truncate" title={order.notes || ""}>
                            {order.notes || "—"}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${statusColor}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleString()
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {order.status === "paid" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={readingUpdating === order.id}
                              onClick={() => updateReadingStatus(order.id, "fulfilled")}
                              className="h-8 px-3 text-xs rounded-lg"
                              data-testid={`reading-fulfill-${order.id}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                              Mark fulfilled
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Email Blast Panel */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-serif text-xl text-foreground mb-1">Send Email Blast</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Send a marketing email to a subset of verified users.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium text-foreground">Subject</label>
              <Input
                placeholder="Weekly Cosmic Insights ✨"
                value={blast.subject}
                onChange={(e) => setBlast({ ...blast, subject: e.target.value })}
                className="bg-muted/30 border-border rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Recipients</label>
              <Select
                value={blast.tier_filter}
                onValueChange={(v) => setBlast({ ...blast, tier_filter: v })}
              >
                <SelectTrigger className="bg-muted/30 border-border rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All verified users</SelectItem>
                  <SelectItem value="seeker">Seeker only</SelectItem>
                  <SelectItem value="enthusiast">Enthusiast only</SelectItem>
                  <SelectItem value="advanced">Advanced only</SelectItem>
                  <SelectItem value="professional">Professional only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1 mb-4">
            <label className="text-sm font-medium text-foreground">Body HTML</label>
            <Textarea
              placeholder="<p>Hello Seeker...</p>"
              value={blast.body_html}
              onChange={(e) => setBlast({ ...blast, body_html: e.target.value })}
              className="bg-muted/30 border-border rounded-xl min-h-[120px] font-mono text-sm"
            />
          </div>
          <Button
            disabled={blastSending || !blast.subject || !blast.body_html}
            className="bg-primary text-primary-foreground rounded-xl"
            onClick={async () => {
              setBlastSending(true);
              try {
                const res = await axios.post(`${API}/admin/send-email-blast`, blast, authHeaders);
                toast.success(res.data.message || `Email blast queued for ${res.data.queued} recipients`);
                setBlast({ subject: "", body_html: "", tier_filter: "all" });
              } catch {
                toast.error("Failed to send email blast");
              } finally {
                setBlastSending(false);
              }
            }}
          >
            {blastSending
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Sending...</span>
              : "Send Email Blast"}
          </Button>
        </div>
      </div>
    </div>
  );
}
