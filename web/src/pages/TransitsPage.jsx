import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Calendar,
  ChevronRight,
  Zap,
  Target,
  CheckCircle,
  Sun,
  Moon,
  RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ASPECT_COLORS = {
  trine: "text-green-500 bg-green-500/10 border-green-500/20",
  sextile: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  conjunction: "text-primary bg-primary/10 border-primary/20",
  square: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  opposition: "text-red-500 bg-red-500/10 border-red-500/20"
};

export default function TransitsPage() {
  const { token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [transits, setTransits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [transitsError, setTransitsError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchTransits = async () => {
      setTransitsError(null);
      try {
        const response = await axios.get(`${API}/transits/upcoming`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransits(response.data);
      } catch (error) {
        console.error("Error fetching transits:", error);
        setTransitsError("Could not load your transits. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTransits();
  }, [token, retryCount]);

  const filteredTransits = filter === "all" 
    ? transits 
    : transits.filter(t => t.aspect === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-background cosmic-page-bg flex items-center justify-center">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
      </div>
    );
  }

  if (transitsError) {
    return (
      <div className="min-h-screen bg-background cosmic-page-bg flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <p className="text-muted-foreground mb-6">{transitsError}</p>
          <Button
            onClick={() => { setLoading(true); setTransitsError(null); setRetryCount(c => c + 1); }}
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
    <div className="min-h-screen bg-background cosmic-page-bg p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Dashboard</span>
              </Link>
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            <h1 className="font-serif text-3xl text-foreground">Transit Forecast</h1>
            <p className="text-muted-foreground">
              Upcoming planetary activations for the next 90 days
            </p>
          </div>
          
          <Button 
            onClick={() => navigate("/chat")}
            className="bg-primary/10 text-primary hover:bg-primary/20 rounded-xl"
            data-testid="discuss-transits-btn"
          >
            Discuss with AI Coach
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Contextual chart link */}
        <div className="mb-6">
          <Link
            to="/chart"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
            data-testid="transits-chart-link"
          >
            See how these transits interact with your natal planets
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["all", "conjunction", "trine", "sextile", "square", "opposition"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={`rounded-xl ${filter === f ? "bg-primary text-primary-foreground" : "border-border"}`}
              data-testid={`filter-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Transit Timeline */}
        <div className="space-y-6">
          {filteredTransits.map((transit, index) => (
            <div 
              key={transit.id}
              className="transit-card glass-card rounded-xl p-6 card-lift"
              data-testid={`transit-${index}`}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Left: Date & Type */}
                <div className="md:w-48 flex-shrink-0">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${ASPECT_COLORS[transit.aspect] || 'bg-muted'}`}>
                    {transit.aspect}
                  </div>
                  <h3 className="font-serif text-xl text-foreground mt-3 mb-2">
                    {transit.transit_type}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Peak: {new Date(transit.peak_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Middle: Content */}
                <div className="flex-1">
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {transit.interpretation}
                  </p>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Action Items
                    </p>
                    <ul className="space-y-2">
                      {transit.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right: Strength & Timeline */}
                <div className="md:w-48 flex-shrink-0">
                  <div className="text-right mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Strength</p>
                    <p className="font-serif text-2xl text-primary">
                      {Math.round(transit.strength * 100)}%
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Start</span>
                      <span>Peak</span>
                      <span>End</span>
                    </div>
                    <Progress
                      value={(() => {
                        const start = new Date(transit.start_date).getTime();
                        const end = new Date(transit.end_date).getTime();
                        if (end <= start) return 50; // Guard: equal dates → show midpoint
                        return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
                      })()}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{new Date(transit.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span>{new Date(transit.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredTransits.length === 0 && (
            <div className="text-center py-12 glass-card rounded-xl">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transits found for this filter</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="glass-card rounded-xl p-6 mt-8">
          <div className="flex items-start gap-4">
            <Zap className="w-6 h-6 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-medium text-foreground mb-2">Understanding Transits</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Transits are the current movements of planets as they interact with your natal chart. 
                They represent timing for different types of experiences and opportunities. 
                <strong className="text-foreground"> Harmonious aspects</strong> (trines, sextiles) indicate flow and ease, 
                while <strong className="text-foreground">challenging aspects</strong> (squares, oppositions) push for growth and change.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
