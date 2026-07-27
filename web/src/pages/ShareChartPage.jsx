import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sparkles,
  Share2,
  Download,
  Copy,
  Check,
  Twitter,
  Facebook,
  Link2,
  Sun,
  Moon,
  Star,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Image as ImageIcon
} from "lucide-react";

const SIGN_SYMBOLS = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓"
};

const SIGN_COLORS = {
  Aries: "#FF6B6B", Taurus: "#4ECDC4", Gemini: "#FFE66D", Cancer: "#C9CCD5",
  Leo: "#FF9F43", Virgo: "#A3CB38", Libra: "#FDA7DF", Scorpio: "#9B59B6",
  Sagittarius: "#E74C3C", Capricorn: "#5D6D7E", Aquarius: "#3498DB", Pisces: "#1ABC9C"
};

const getElement = (sign) => {
  const elements = {
    Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
    Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
    Gemini: "Air", Libra: "Air", Aquarius: "Air",
    Cancer: "Water", Scorpio: "Water", Pisces: "Water"
  };
  return elements[sign] || "Unknown";
};

// Shareable Chart Card Component
const ChartShareCard = ({ chart, user, forExport = false }) => {
  return (
    <div 
      className={`relative overflow-hidden ${forExport ? 'w-[600px] h-[800px]' : 'w-full max-w-md'}`}
      style={{
        background: 'linear-gradient(135deg, #0F0F14 0%, #1a1a2e 50%, #16213e 100%)'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">✦</div>
        <div className="absolute top-20 right-20 text-4xl">✧</div>
        <div className="absolute bottom-20 left-20 text-5xl">✦</div>
        <div className="absolute bottom-10 right-10 text-3xl">✧</div>
      </div>

      <div className="relative p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span className="font-serif text-xl text-white">Gab44</span>
          </div>
          <h2 className="font-serif text-2xl text-white mb-1">{user?.name}'s</h2>
          <p className="text-amber-400/80 text-sm uppercase tracking-widest">Cosmic Blueprint</p>
        </div>

        {/* Big Three Circle */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/30" />
          <div className="absolute inset-2 rounded-full border border-white/10" />
          
          {/* Sun Sign - Top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-1"
              style={{ background: `linear-gradient(135deg, ${SIGN_COLORS[chart?.sun_sign]}40, ${SIGN_COLORS[chart?.sun_sign]}20)`, border: `2px solid ${SIGN_COLORS[chart?.sun_sign]}60` }}
            >
              {SIGN_SYMBOLS[chart?.sun_sign]}
            </div>
            <p className="text-white text-sm font-medium">{chart?.sun_sign}</p>
            <p className="text-amber-400/60 text-xs">Sun</p>
          </div>

          {/* Moon Sign - Bottom Left */}
          <div className="absolute bottom-4 left-0 -translate-x-1/4 text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-1"
              style={{ background: `linear-gradient(135deg, ${SIGN_COLORS[chart?.moon_sign]}40, ${SIGN_COLORS[chart?.moon_sign]}20)`, border: `2px solid ${SIGN_COLORS[chart?.moon_sign]}60` }}
            >
              {SIGN_SYMBOLS[chart?.moon_sign]}
            </div>
            <p className="text-white text-xs font-medium">{chart?.moon_sign}</p>
            <p className="text-gray-400 text-xs">Moon</p>
          </div>

          {/* Rising Sign - Bottom Right */}
          <div className="absolute bottom-4 right-0 translate-x-1/4 text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-1"
              style={{ background: `linear-gradient(135deg, ${SIGN_COLORS[chart?.rising_sign]}40, ${SIGN_COLORS[chart?.rising_sign]}20)`, border: `2px solid ${SIGN_COLORS[chart?.rising_sign]}60` }}
            >
              {SIGN_SYMBOLS[chart?.rising_sign]}
            </div>
            <p className="text-white text-xs font-medium">{chart?.rising_sign}</p>
            <p className="text-gray-400 text-xs">Rising</p>
          </div>

          {/* Center Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/60 text-xs mb-1">Element Balance</p>
              <p className="text-amber-400 font-serif text-lg">{getElement(chart?.sun_sign)}</p>
            </div>
          </div>
        </div>

        {/* Chart Patterns */}
        {chart?.patterns?.length > 0 && (
          <div className="text-center mb-6">
            <p className="text-white/60 text-xs mb-2">Chart Patterns</p>
            <div className="flex flex-wrap justify-center gap-2">
              {chart.patterns.map((pattern, i) => (
                <span key={i} className="bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1 text-xs text-amber-400">
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 border-t border-white/10">
          <p className="text-white/40 text-xs">Discover your cosmic blueprint at</p>
          <p className="text-amber-400 font-medium">gab44.com</p>
        </div>
      </div>
    </div>
  );
};

export default function ShareChartPage() {
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareToken, setShareToken] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [previewMode, setPreviewMode] = useState("card"); // "card" | "wheel"
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [downloadingStyle, setDownloadingStyle] = useState(null); // "card" | "wheel" | null
  const cardRef = useRef(null);

  useEffect(() => {
    const fetchChart = async () => {
      setChartError(null);
      try {
        const response = await axios.get(`${API}/chart/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChart(response.data);
        // If chart already has a share token stored, use it
        if (response.data.share_token) {
          setShareToken(response.data.share_token);
        }
      } catch (error) {
        console.error("Error fetching chart:", error);
        setChartError("Could not load your chart. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchChart();
  }, [token, retryCount]);

  // Fetch the rendered chart image as a Blob URL whenever the user toggles
  // between card / wheel preview. Object URL is revoked on cleanup so we
  // don't leak — Blob URLs persist for the document lifetime otherwise.
  useEffect(() => {
    if (!token || !chart) return;
    let active = true;
    let createdUrl = null;
    setPreviewLoading(true);
    setPreviewError(false);
    axios.get(`${API}/chart/image.png`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { style: previewMode, size: previewMode === "wheel" ? 1200 : 1080 },
      responseType: "blob",
    })
      .then(res => {
        if (!active) return;
        createdUrl = URL.createObjectURL(res.data);
        setPreviewUrl(createdUrl);
      })
      .catch(err => {
        if (!active) return;
        console.error("Chart image preview failed:", err);
        setPreviewError(true);
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [token, chart, previewMode]);

  const downloadImage = async (style) => {
    setDownloadingStyle(style);
    try {
      const res = await axios.get(`${API}/chart/image.png`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { style, size: style === "wheel" ? 1600 : 1080 },
        responseType: "blob",
      });
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeName = (user?.name || "chart").replace(/[^A-Za-z0-9]+/g, "-").toLowerCase() || "chart";
      a.download = `gab44-${safeName}-${style}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Defer revoke until the browser has had a tick to start the download
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success("Chart image downloaded.");
    } catch (err) {
      console.error("Chart image download failed:", err);
      toast.error("Couldn't download your chart image. Please try again.");
    } finally {
      setDownloadingStyle(null);
    }
  };

  const generateShareLink = async () => {
    if (shareToken) return; // already generated
    setGeneratingLink(true);
    try {
      const res = await axios.post(`${API}/chart/share`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShareToken(res.data.share_token);
    } catch {
      toast.error("Couldn't create your share link. Your chart is safe — try again in a moment.");
    } finally {
      setGeneratingLink(false);
    }
  };

  const shareUrl = (token) =>
    token
      ? `${window.location.origin}/chart/public/${token}`
      : `${window.location.origin}/auth?mode=register`;

  const copyLink = async () => {
    let tok = shareToken;
    if (!tok) {
      // Generate first, then copy using the freshly returned token
      setGeneratingLink(true);
      try {
        const res = await axios.post(`${API}/chart/share`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        tok = res.data.share_token;
        setShareToken(tok);
      } catch {
        toast.error("Couldn't create your share link. Your chart is safe — try again in a moment.");
        setGeneratingLink(false);
        return;
      }
      setGeneratingLink(false);
    }
    try {
      await navigator.clipboard.writeText(shareUrl(tok));
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareToTwitter = async () => {
    if (!shareToken) {
      await generateShareLink();
      return; // shareToken state not yet updated; user can click again
    }
    const text = `✨ I'm a ${chart?.sun_sign} Sun, ${chart?.moon_sign} Moon, ${chart?.rising_sign} Rising! Discover your cosmic blueprint at Gab44`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl(shareToken))}`, '_blank');
  };

  const shareToFacebook = async () => {
    if (!shareToken) {
      await generateShareLink();
      return;
    }
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl(shareToken))}`, '_blank');
  };

  const shareNative = async () => {
    if (!shareToken) {
      await generateShareLink();
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.name}'s Cosmic Blueprint - Gab44`,
          text: `I'm a ${chart?.sun_sign} Sun, ${chart?.moon_sign} Moon, ${chart?.rising_sign} Rising!`,
          url: shareUrl(shareToken)
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error("Failed to share");
        }
      }
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background cosmic-page-bg flex items-center justify-center">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
      </div>
    );
  }

  if (chartError) {
    return (
      <div className="min-h-screen bg-background cosmic-page-bg flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <p className="text-muted-foreground mb-6">{chartError}</p>
          <Button
            onClick={() => { setLoading(true); setChartError(null); setRetryCount(c => c + 1); }}
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/chart" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Chart</span>
            </Link>
            <h1 className="font-serif text-3xl text-foreground">Share Your Chart</h1>
            <p className="text-muted-foreground">Let your friends discover their cosmic blueprint</p>
          </div>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Preview Card */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-foreground">Preview</h2>
              <div className="inline-flex rounded-xl bg-muted/40 p-1 text-xs" role="tablist">
                <button
                  type="button"
                  onClick={() => setPreviewMode("card")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${previewMode === "card" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid="preview-mode-card"
                  aria-pressed={previewMode === "card"}
                >
                  Share card
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("wheel")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${previewMode === "wheel" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid="preview-mode-wheel"
                  aria-pressed={previewMode === "wheel"}
                >
                  Natal wheel
                </button>
              </div>
            </div>
            <div
              ref={cardRef}
              className="rounded-2xl overflow-hidden shadow-2xl bg-[#0F0F14] aspect-square flex items-center justify-center"
              data-testid="chart-image-preview"
            >
              {previewLoading && !previewUrl && (
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
              )}
              {previewError && !previewLoading && (
                <div className="text-center px-4">
                  <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Couldn't render preview.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-lg"
                    onClick={() => setPreviewMode(m => m)}
                  >
                    Retry
                  </Button>
                </div>
              )}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={`${user?.name || "Your"} ${previewMode === "wheel" ? "natal wheel" : "cosmic blueprint"}`}
                  className="block w-full h-full object-contain"
                  data-testid={`chart-image-${previewMode}`}
                />
              )}
            </div>
            {/* Fallback static card kept for users without a generated chart on backend */}
            <div className="hidden">
              <ChartShareCard chart={chart} user={user} />
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-6">
              <h2 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                Share Options
              </h2>
              
              <div className="space-y-3">
                <Button
                  onClick={() => downloadImage(previewMode)}
                  disabled={downloadingStyle !== null}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black rounded-xl justify-start gap-3 font-medium"
                  data-testid="download-chart-image"
                >
                  {downloadingStyle ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {downloadingStyle
                    ? "Preparing image…"
                    : `Download ${previewMode === "wheel" ? "natal wheel" : "share card"} (PNG)`}
                </Button>

                <Button
                  onClick={shareNative}
                  className="w-full bg-primary text-primary-foreground rounded-xl justify-start gap-3"
                  data-testid="share-native"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </Button>

                <Button 
                  onClick={shareToTwitter}
                  variant="outline"
                  className="w-full rounded-xl justify-start gap-3 border-border"
                  data-testid="share-twitter"
                >
                  <Twitter className="w-5 h-5" />
                  Share on Twitter
                </Button>

                <Button 
                  onClick={shareToFacebook}
                  variant="outline"
                  className="w-full rounded-xl justify-start gap-3 border-border"
                  data-testid="share-facebook"
                >
                  <Facebook className="w-5 h-5" />
                  Share on Facebook
                </Button>

                <Button 
                  onClick={copyLink}
                  variant="outline"
                  className="w-full rounded-xl justify-start gap-3 border-border"
                  data-testid="copy-link"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Link2 className="w-5 h-5" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>

            {/* Your Big Three */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="font-medium text-foreground mb-4">Your Big Three</h2>
              <div className="space-y-3">
                {[
                  { icon: Sun, label: "Sun", sign: chart?.sun_sign, color: "text-amber-500" },
                  { icon: Moon, label: "Moon", sign: chart?.moon_sign, color: "text-slate-400" },
                  { icon: Star, label: "Rising", sign: chart?.rising_sign, color: "text-indigo-400" }
                ].map(({ icon: Icon, label, sign, color }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{SIGN_SYMBOLS[sign]}</span>
                      <span className="text-foreground font-medium">{sign}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share Link */}
            <div className="glass-card rounded-xl p-6 bg-primary/5 border-primary/20">
              <h2 className="font-medium text-foreground mb-2">Public Chart Link</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Anyone with this link can view your chart — no account required.
              </p>
              {!shareToken ? (
                <Button
                  onClick={generateShareLink}
                  disabled={generatingLink}
                  className="w-full rounded-xl bg-primary text-primary-foreground"
                >
                  {generatingLink ? "Generating…" : "Generate Shareable Link"}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl(shareToken)}
                    readOnly
                    className="flex-1 bg-background/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                  />
                  <Button onClick={copyLink} className="bg-primary text-primary-foreground rounded-xl">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
