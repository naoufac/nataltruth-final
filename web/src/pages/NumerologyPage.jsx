import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import {
  nameFull,
  adaptNumerologyForUi,
  loadLocalProfile,
} from "@/lib/nataltruth";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Sun,
  Moon,
  Hash,
  Heart,
  Eye,
  Cake,
  CalendarDays,
  Sparkles,
  ChevronRight,
  RefreshCw
} from "lucide-react";

const NUMBER_ICONS = {
  life_path: Sparkles,
  expression: Hash,
  soul_urge: Heart,
  personality: Eye,
  birthday: Cake,
  personal_year: CalendarDays,
};

const NUMBER_LABELS = {
  life_path: "Life Path",
  expression: "Expression",
  soul_urge: "Soul Urge",
  personality: "Personality",
  birthday: "Birthday",
  personal_year: "Personal Year",
};

const NUMBER_COLORS = {
  life_path: "text-primary",
  expression: "text-chart-2",
  soul_urge: "text-pink-500",
  personality: "text-emerald-500",
  birthday: "text-amber-500",
  personal_year: "text-cyan-500",
};

const NumberCard = ({ type, data }) => {
  const Icon = NUMBER_ICONS[type] || Hash;
  const label = NUMBER_LABELS[type] || type;
  const color = NUMBER_COLORS[type] || "text-primary";

  return (
    <div 
      className="glass-card rounded-xl p-5 lg:p-6 card-lift" 
      data-testid={`numerology-${type}`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-6 h-6 ${color}`} />
        <span className="zodiac-badge rounded-full px-3 py-1 text-xs">{label}</span>
      </div>
      <p className={`font-serif text-4xl lg:text-5xl ${color} mb-2`}>
        {data.number}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {data.meaning}
      </p>
    </div>
  );
};

const LetterBreakdown = ({ letterValues }) => {
  if (!letterValues || letterValues.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5" data-testid="letter-breakdown">
      {letterValues.map((item, i) =>
        item.letter === " " ? (
          <div key={i} className="w-4" />
        ) : (
          <div
            key={i}
            className="flex flex-col items-center bg-muted/30 rounded-lg px-2.5 py-1.5 min-w-[2rem]"
          >
            <span className="font-mono text-sm text-foreground">{item.letter}</span>
            <span className="font-mono text-xs text-primary">{item.value}</span>
          </div>
        )
      )}
    </div>
  );
};

export default function NumerologyPage() {
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [profileError, setProfileError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      setProfileError(null);
      try {
        const local = loadLocalProfile() || {};
        const fullName =
          local.birth_name ||
          local.name ||
          user?.birth_name ||
          user?.name ||
          "";
        const birthDate =
          local.birth_date || user?.birth_date || null;
        if (!fullName) {
          setProfileError(
            "Add your full name in registration/settings to calculate numerology via api.nataltruth.com."
          );
          return;
        }
        const apiProfile = await nameFull(fullName, birthDate);
        setProfile(adaptNumerologyForUi(apiProfile));
      } catch (error) {
        console.error("Error fetching numerology profile:", error);
        setProfileError(
          error?.message ||
            "Could not load numerology via api.nataltruth.com."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, retryCount, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/40" />
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <p className="text-muted-foreground mb-6">{profileError}</p>
          <Button
            onClick={() => { setLoading(true); setProfileError(null); setRetryCount(c => c + 1); }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8 cosmic-page-bg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Dashboard</span>
              </Link>
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-primary" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>
            <h1 className="font-serif text-3xl text-foreground">Your Numerology Profile</h1>
            <p className="text-muted-foreground">
              {user?.name ? `Cosmic numbers for ${user.name}` : "Discover your cosmic numbers"}
            </p>
          </div>
        </div>

        {/* Contextual chart link */}
        <div className="mb-6">
          <Link
            to="/chart"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
            data-testid="numerology-chart-link"
          >
            Your numerology is part of your birth chart. View your full cosmic blueprint
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {["overview", "details"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              className="rounded-xl capitalize"
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-${tab}`}
            >
              {tab}
            </Button>
          ))}
        </div>

        {profile ? (
          <>
            {activeTab === "overview" && (
              <>
                {/* Core Numbers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
                  <NumberCard type="life_path" data={profile.life_path} />
                  <NumberCard type="expression" data={profile.expression} />
                  <NumberCard type="soul_urge" data={profile.soul_urge} />
                  <NumberCard type="personality" data={profile.personality} />
                  <NumberCard type="birthday" data={profile.birthday} />
                  <NumberCard type="personal_year" data={profile.personal_year} />
                </div>

                {/* Name Letter Breakdown */}
                <div className="glass-card rounded-xl p-5 lg:p-6 mb-8" data-testid="name-breakdown">
                  <h2 className="font-serif text-xl text-foreground mb-4">
                    Name Letter Values (Pythagorean)
                  </h2>
                  <LetterBreakdown letterValues={profile.expression?.letter_values} />
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      Expression Total:{" "}
                      <strong className="text-foreground">{profile.expression?.total}</strong> →{" "}
                      <strong className="text-primary">{profile.expression?.number}</strong>
                    </span>
                    <span>
                      Soul Urge (vowels):{" "}
                      <strong className="text-foreground">{profile.soul_urge?.total}</strong> →{" "}
                      <strong className="text-pink-500">{profile.soul_urge?.number}</strong>
                    </span>
                    <span>
                      Personality (consonants):{" "}
                      <strong className="text-foreground">{profile.personality?.total}</strong> →{" "}
                      <strong className="text-emerald-500">{profile.personality?.number}</strong>
                    </span>
                  </div>
                </div>
              </>
            )}

            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Life Path Breakdown */}
                <div className="glass-card rounded-xl p-5 lg:p-6" data-testid="life-path-detail">
                  <h2 className="font-serif text-xl text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Life Path Calculation
                  </h2>
                  <div className="bg-muted/30 rounded-xl p-4 font-mono text-sm space-y-2">
                    <p className="text-muted-foreground">
                      Birth Date: {profile.birth_date}
                    </p>
                    <p className="text-muted-foreground">
                      Month: {profile.life_path.breakdown.month} →{" "}
                      <span className="text-foreground">{profile.life_path.breakdown.month_reduced}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Day: {profile.life_path.breakdown.day} →{" "}
                      <span className="text-foreground">{profile.life_path.breakdown.day_reduced}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Year: {profile.life_path.breakdown.year} →{" "}
                      <span className="text-foreground">{profile.life_path.breakdown.year_reduced}</span>
                    </p>
                    <div className="border-t border-border pt-2 mt-2">
                      <p className="text-foreground">
                        {profile.life_path.breakdown.month_reduced} +{" "}
                        {profile.life_path.breakdown.day_reduced} +{" "}
                        {profile.life_path.breakdown.year_reduced} ={" "}
                        {profile.life_path.breakdown.total} →{" "}
                        <span className="text-primary font-bold text-lg">
                          {profile.life_path.number}
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {profile.life_path.meaning}
                  </p>
                </div>

                {/* All Numbers Detail */}
                {["expression", "soul_urge", "personality", "birthday", "personal_year"].map(
                  (key) => {
                    const data = profile[key];
                    const Icon = NUMBER_ICONS[key] || Hash;
                    const color = NUMBER_COLORS[key] || "text-primary";
                    return (
                      <div
                        key={key}
                        className="glass-card rounded-xl p-5 lg:p-6"
                        data-testid={`${key}-detail`}
                      >
                        <h2 className="font-serif text-xl text-foreground mb-2 flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${color}`} />
                          {NUMBER_LABELS[key]} Number:{" "}
                          <span className={color}>{data.number}</span>
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                          {data.meaning}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 glass-card rounded-xl">
            <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Unable to generate your numerology profile. Please make sure your name and birth date are set.
            </p>
            <Link to="/settings">
              <Button className="bg-primary text-primary-foreground rounded-xl">
                Update Profile
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
