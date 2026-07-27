import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { nameFull, adaptGematriaForUi } from "@/lib/nataltruth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  Sun,
  Moon,
  Hash,
  Sparkles,
  Search,
  ChevronRight
} from "lucide-react";

const LetterGrid = ({ letters, label }) => {
  if (!letters || letters.length === 0) return null;

  return (
    <div data-testid={`letter-grid-${label}`}>
      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-1">
        {letters.map((item, i) =>
          item.letter === " " ? (
            <div key={i} className="w-3" />
          ) : (
            <div
              key={i}
              className="flex flex-col items-center bg-muted/30 rounded-lg px-2 py-1 min-w-[1.75rem]"
            >
              <span className="font-mono text-sm text-foreground">{item.letter}</span>
              <span className="font-mono text-xs text-primary">{item.value}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

const WordTable = ({ words, label }) => {
  if (!words || words.length === 0) return null;

  return (
    <div data-testid={`word-table-${label}`}>
      <p className="text-sm font-medium text-muted-foreground mb-2">Per-Word Values</p>
      <div className="flex flex-wrap gap-3">
        {words.map((w, i) => (
          <div key={i} className="bg-muted/30 rounded-xl px-4 py-2 text-center">
            <p className="text-sm text-foreground font-medium">{w.word}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {w.total} → <span className="text-primary">{w.reduced}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SystemResult = ({ data, color }) => {
  if (!data) return null;

  const systemLabel = data.system === "chaldean" ? "Chaldean (Babylonian)" : "English Ordinal";

  return (
    <div className="glass-card rounded-xl p-5 lg:p-6" data-testid={`result-${data.system}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg text-foreground">{systemLabel}</h3>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className={`font-serif text-2xl ${color}`}>{data.total}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Reduced</p>
            <p className={`font-serif text-2xl ${color}`}>{data.reduced}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <LetterGrid letters={data.letters} label="Letter Breakdown" />
        <WordTable words={data.words} label={systemLabel} />
        
        {data.significance && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mt-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Significance ({data.reduced}): </span>
              {data.significance}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function GematriaPage() {
  const { theme, toggleTheme } = useTheme();
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calcError, setCalcError] = useState(null);

  const handleCalculate = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    setCalcError(null);
    setLoading(true);
    try {
      const profile = await nameFull(text, null);
      setResult(adaptGematriaForUi(profile, text));
    } catch (error) {
      console.error("Error calculating gematria:", error);
      setCalcError(
        error?.message || "Calculation failed via api.nataltruth.com."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8 cosmic-page-bg">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="font-serif text-3xl text-foreground">Gematria Calculator</h1>
            <p className="text-muted-foreground">
              Discover the numerical value of any name, word, or phrase
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="glass-card rounded-xl p-5 lg:p-6 mb-8" data-testid="gematria-input-card">
          <form onSubmit={handleCalculate} className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a name, word, or phrase..."
              className="flex-1 bg-muted/30 border-border h-12 rounded-xl focus-glow"
              maxLength={500}
              data-testid="gematria-input"
            />
            <Button
              type="submit"
              className="bg-primary text-primary-foreground h-12 px-6 rounded-xl"
              disabled={loading || !input.trim()}
              data-testid="gematria-calculate-btn"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Calculate
                </>
              )}
            </Button>
          </form>

          {calcError && (
            <p className="text-sm text-destructive mt-3">{calcError}</p>
          )}

          {/* Quick examples */}
          <div className="flex flex-wrap gap-2 mt-4">
            {["NatalTruth", "Love", "Truth", "Peace"].map((example) => (
              <Button
                key={example}
                variant="outline"
                size="sm"
                className="rounded-xl border-border text-sm"
                onClick={() => {
                  setInput(example);
                }}
                data-testid={`example-${example.toLowerCase()}`}
              >
                {example}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 fade-in" data-testid="gematria-results">
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">Analyzing</p>
              <h2 className="font-serif text-2xl text-foreground">"{result.text}"</h2>
            </div>

            <SystemResult data={result.chaldean} color="text-primary" />
            <SystemResult data={result.english_ordinal} color="text-chart-2" />

            {/* Link to numerology */}
            <div className="text-center pt-2">
              <Link
                to="/numerology"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="gematria-numerology-link"
              >
                Want to see how your name's vibration connects to your numerology numbers?
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Info Card */}
        {!result && (
          <div className="glass-card rounded-xl p-6 mt-8" data-testid="gematria-info">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground mb-2">What is Gematria?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Gematria is an ancient practice of assigning numerical values to letters to reveal
                  hidden meanings and connections. Each system assigns values differently:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-muted/30 rounded-xl p-4">
                    <p className="font-medium text-foreground mb-1">Chaldean (Babylonian)</p>
                    <p className="text-muted-foreground">
                      The oldest system. Values range from 1–8 (9 is sacred). Based on sound vibration
                      rather than alphabetical order.
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4">
                    <p className="font-medium text-foreground mb-1">English Ordinal</p>
                    <p className="text-muted-foreground">
                      Simple A=1 through Z=26. The most straightforward system, widely used for modern
                      English gematria analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
