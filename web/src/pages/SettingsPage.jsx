import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import { loadOneSignal } from "@/lib/onesignal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import axios from "axios";
import { 
  ArrowLeft, 
  User, 
  Sun, 
  Moon, 
  Sparkles,
  Settings2,
  Bell,
  Shield,
  CreditCard,
  Type,
  Eye,
  Save,
  LogOut,
  Loader2,
  Mail
} from "lucide-react";

// OneSignal SDK is lazy-loaded — see frontend/src/lib/onesignal.js. AuthProvider
// kicks off the load when the user becomes authed; we await loadOneSignal() here
// in case the user toggles push before the SDK has finished injecting.

async function requestPushPermission() {
  const sdk = await loadOneSignal();
  if (!sdk) return null;
  try {
    const permission = await sdk.Notifications.requestPermission();
    if (!permission) return null;
    const playerId = await sdk.User.PushSubscription.id;
    return playerId || null;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const { user, token, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [fontSize, setFontSize] = useState(() => {
    const stored = localStorage.getItem("nataltruth_font_size");
    return stored ? parseInt(stored) : 16;
  });
  
  const [readingMode, setReadingMode] = useState(() => {
    return localStorage.getItem("nataltruth_reading_mode") === "true";
  });

  const [notifications, setNotifications] = useState({
    dailyGuidance: true,
    transitAlerts: true,
    weeklyReport: false,
    marketing: false
  });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const [profileEdit, setProfileEdit] = useState({
    name: user?.name || "",
    birth_name: user?.birth_name || "",
    birth_date: user?.birth_date || "",
    birth_time: user?.birth_time || "",
    birth_place: user?.birth_place || ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleFontSizeChange = (value) => {
    setFontSize(value[0]);
    localStorage.setItem("nataltruth_font_size", value[0].toString());
    document.documentElement.style.setProperty("--base-font-size", `${value[0]}px`);
  };

  const handleReadingModeToggle = (checked) => {
    setReadingMode(checked);
    localStorage.setItem("nataltruth_reading_mode", checked.toString());
    const root = document.documentElement;
    if (checked) {
      root.style.setProperty("--reading-line-height", "1.9");
      root.style.setProperty("--reading-letter-spacing", "0.02em");
    } else {
      root.style.setProperty("--reading-line-height", "1.7");
      root.style.setProperty("--reading-letter-spacing", "0.01em");
    }
    toast.success(checked ? "Reading mode enabled" : "Reading mode disabled");
  };

  const handlePushToggle = async (checked) => {
    setPushLoading(true);
    // No /notifications/* on api.nataltruth.com — zero 404.
    setPushEnabled(false);
    toast.message("Push notifications are not connected to NatalTruth API yet.");
    setPushLoading(false);
  };

  const handleProfileChange = (e) => {
    setProfileEdit({ ...profileEdit, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updates = {};
      if (profileEdit.name && profileEdit.name !== user?.name) updates.name = profileEdit.name;
      if (profileEdit.birth_name !== (user?.birth_name || "")) updates.birth_name = profileEdit.birth_name || null;
      if (profileEdit.birth_date && profileEdit.birth_date !== user?.birth_date) updates.birth_date = profileEdit.birth_date;
      if (profileEdit.birth_time !== (user?.birth_time || "")) updates.birth_time = profileEdit.birth_time || null;
      if (profileEdit.birth_place && profileEdit.birth_place !== user?.birth_place) updates.birth_place = profileEdit.birth_place;

      if (Object.keys(updates).length === 0) {
        toast.info("No changes to save");
        return;
      }

      // No auth API on api.nataltruth.com — persist birth profile locally for calc.
      updateUser({
        ...profileEdit,
        name: profileEdit.name || user?.name,
        birth_name: profileEdit.birth_name || profileEdit.name,
        birth_date: profileEdit.birth_date,
        birth_time: profileEdit.birth_time || null,
        birth_place: profileEdit.birth_place,
      });
      toast.success("Profile saved locally (used for api.nataltruth.com calc)");
    } catch (error) {
      toast.error(error?.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(false);
    toast.message("Billing portal is not available yet", {
      description: "Payments are not on api.nataltruth.com. See Pricing for plan framing only.",
    });
    navigate("/pricing");
  };

  const settingsSections = [
    {
      id: "appearance",
      title: "Appearance",
      icon: Eye,
      content: (
        <div className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-foreground">Theme</Label>
              <p className="text-sm text-muted-foreground">Choose light or dark mode</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="gap-2 rounded-xl"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
          </div>

          {/* Reading Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-foreground">Reading Mode</Label>
              <p className="text-sm text-muted-foreground">Increase spacing for easier reading</p>
            </div>
            <Switch
              checked={readingMode}
              onCheckedChange={handleReadingModeToggle}
              data-testid="reading-mode-toggle"
            />
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground">Font Size</Label>
                <p className="text-sm text-muted-foreground">Adjust text size ({fontSize}px)</p>
              </div>
              <Type className="w-5 h-5 text-muted-foreground" />
            </div>
            <Slider
              value={[fontSize]}
              onValueChange={handleFontSizeChange}
              min={12}
              max={24}
              step={1}
              className="w-full"
              data-testid="font-size-slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small</span>
              <span>Default</span>
              <span>Large</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: Bell,
      content: (
        <div className="space-y-4">
          {/* Push Notifications master toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-foreground">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive alerts directly in your browser</p>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={handlePushToggle}
              disabled={pushLoading}
              data-testid="push-notifications-toggle"
            />
          </div>
          <div className="border-t border-border/50 pt-4 space-y-4">
            {[
              { key: "dailyGuidance", label: "Daily Guidance", desc: "Receive your daily cosmic insights" },
              { key: "transitAlerts", label: "Transit Alerts", desc: "Get notified about important transits" },
              { key: "weeklyReport", label: "Weekly Report", desc: "Summary of the week ahead" },
              { key: "marketing", label: "Updates & Offers", desc: "News about new features and promotions" }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-foreground">{label}</Label>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={notifications[key]}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [key]: checked }))}
                  disabled={!pushEnabled}
                />
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "account",
      title: "Account",
      icon: User,
      content: (
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center font-serif text-2xl text-primary">
                {user?.name?.[0] || "U"}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="zodiac-badge rounded-full px-2 py-0.5 text-xs">{user?.sun_sign}</span>
                  <span className="text-xs text-muted-foreground">Born {user?.birth_date}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Name</Label>
            <Input
              id="name"
              name="name"
              value={profileEdit.name}
              onChange={handleProfileChange}
              className="bg-muted/30 rounded-xl"
              data-testid="profile-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Birth Place</Label>
            <Input
              name="birth_place"
              value={profileEdit.birth_place}
              onChange={handleProfileChange}
              className="bg-muted/30 rounded-xl"
              data-testid="profile-birth-place-input"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              Legal Birth Name <span className="text-xs text-muted-foreground font-normal">(for numerology — leave blank to use display name)</span>
            </Label>
            <Input
              name="birth_name"
              value={profileEdit.birth_name}
              onChange={handleProfileChange}
              placeholder={profileEdit.name}
              className="bg-muted/30 rounded-xl"
              data-testid="profile-birth-name-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Birth Date</Label>
              <Input
                name="birth_date"
                type="date"
                value={profileEdit.birth_date}
                onChange={handleProfileChange}
                className="bg-muted/30 rounded-xl"
                data-testid="profile-birth-date-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Birth Time</Label>
              <Input
                name="birth_time"
                type="time"
                value={profileEdit.birth_time}
                onChange={handleProfileChange}
                className="bg-muted/30 rounded-xl"
                data-testid="profile-birth-time-input"
              />
            </div>
          </div>

          {!user?.email_verified && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <Mail className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-amber-300 font-medium">Email not verified</p>
                <p className="text-amber-400/70 text-xs mt-0.5">Check your inbox or resend the link.</p>
              </div>
              <button
                type="button"
                className="text-xs text-amber-400 underline underline-offset-2 hover:text-amber-300 flex-shrink-0"
                onClick={async () => {
                  try {
                    toast.message("Email verification is not available — profile is local only.");
                    toast.success("Verification email sent!");
                  } catch {
                    toast.error("Could not send email. Please try again.");
                  }
                }}
              >
                Resend
              </button>
            </div>
          )}

          <Button
            type="submit"
            disabled={savingProfile}
            className="w-full rounded-xl"
            data-testid="save-profile-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingProfile ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      )
    },
    {
      id: "subscription",
      title: "Subscription",
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-foreground capitalize">{user?.subscription_tier || "Seeker"} Plan</h3>
                <p className="text-sm text-muted-foreground">
                  {user?.subscription_tier === "seeker" ? "Free forever" : "Billed monthly via Stripe"}
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <Button 
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="w-full bg-primary/10 text-primary hover:bg-primary/20 rounded-xl"
            >
              {portalLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opening…
                </span>
              ) : user?.subscription_tier === "seeker" ? "Upgrade Plan" : "Manage Subscription"}
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background cosmic-page-bg p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <h1 className="font-serif text-3xl text-foreground">Settings</h1>
            <p className="text-muted-foreground">Customize your NatalTruth experience</p>
          </div>
          <Settings2 className="w-8 h-8 text-muted-foreground" />
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => (
            <div key={section.id} className="glass-card rounded-xl p-6" data-testid={`settings-${section.id}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-medium text-foreground text-lg">{section.title}</h2>
              </div>
              {section.content}
            </div>
          ))}

          {/* Danger Zone */}
          <div className="glass-card rounded-xl p-6 border-destructive/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="font-medium text-foreground text-lg">Account Actions</h2>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl"
              onClick={() => {
                logout();
                navigate("/auth");
              }}
              data-testid="logout-settings"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
