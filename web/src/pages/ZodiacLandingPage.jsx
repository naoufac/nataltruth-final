import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/App";
import {
  calculateChart,
  adaptChartForUi,
  loadLocalProfile,
  resolveEngine,
} from "@/lib/nataltruth";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Star } from "lucide-react";

const ZODIAC = {
  aries: { name: "Aries", glyph: "♈", element: "Fire", ruler: "Mars", dates: "March 21 – April 19", traits: ["Natural leader, fearless trailblazer", "Driven by passion and independence", "Thrives on challenge and new beginnings"] },
  taurus: { name: "Taurus", glyph: "♉", element: "Earth", ruler: "Venus", dates: "April 20 – May 20", traits: ["Grounded builder, sensory connoisseur", "Values stability, loyalty, and beauty", "Patient determination that moves mountains"] },
  gemini: { name: "Gemini", glyph: "♊", element: "Air", ruler: "Mercury", dates: "May 21 – June 20", traits: ["Quick-witted communicator, eternal student", "Thrives on variety and intellectual connection", "Adaptable mind that bridges worlds"] },
  cancer: { name: "Cancer", glyph: "♋", element: "Water", ruler: "Moon", dates: "June 21 – July 22", traits: ["Intuitive nurturer, emotional depth", "Fierce protector of loved ones", "Deep connection to home and heritage"] },
  leo: { name: "Leo", glyph: "♌", element: "Fire", ruler: "Sun", dates: "July 23 – August 22", traits: ["Radiant creator, natural performer", "Generous heart with magnetic presence", "Born to inspire and lead with warmth"] },
  virgo: { name: "Virgo", glyph: "♍", element: "Earth", ruler: "Mercury", dates: "August 23 – September 22", traits: ["Precise analyst, devoted healer", "Eye for detail that others miss", "Service-oriented with quiet strength"] },
  libra: { name: "Libra", glyph: "♎", element: "Air", ruler: "Venus", dates: "September 23 – October 22", traits: ["Diplomatic peacemaker, aesthetic visionary", "Seeks balance in all relationships", "Natural mediator who sees every perspective"] },
  scorpio: { name: "Scorpio", glyph: "♏", element: "Water", ruler: "Pluto", dates: "October 23 – November 21", traits: ["Intense transformer, truth-seeker", "Penetrating insight into the hidden", "Power through vulnerability and depth"] },
  sagittarius: { name: "Sagittarius", glyph: "♐", element: "Fire", ruler: "Jupiter", dates: "November 22 – December 21", traits: ["Optimistic philosopher, born explorer", "Seeks meaning in every experience", "Freedom-loving with an infectious enthusiasm"] },
  capricorn: { name: "Capricorn", glyph: "♑", element: "Earth", ruler: "Saturn", dates: "December 22 – January 19", traits: ["Ambitious architect, strategic thinker", "Builds empires through discipline", "Earns legacy through patience and persistence"] },
  aquarius: { name: "Aquarius", glyph: "♒", element: "Air", ruler: "Uranus", dates: "January 20 – February 18", traits: ["Visionary humanitarian, original thinker", "Champions the collective over the individual", "Ahead of their time in thought and action"] },
  pisces: { name: "Pisces", glyph: "♓", element: "Water", ruler: "Neptune", dates: "February 19 – March 20", traits: ["Empathic dreamer, spiritual sponge", "Sees the world through compassion", "Creative depth that transcends the ordinary"] },
};

/**
 * Sign marketing + optional LIVE natal overlay if profile matches.
 */
export default function ZodiacLandingPage() {
  const { sign } = useParams();
  const { user } = useAuth();
  const slug = (sign || "").toLowerCase();
  const data = ZODIAC[slug];
  const [live, setLive] = useState(null);

  useEffect(() => {
    (async () => {
      const profile = loadLocalProfile() || user;
      if (!profile?.birth_date || profile.latitude == null || profile.longitude == null) return;
      try {
        const raw = await calculateChart(profile, resolveEngine(profile));
        setLive(adaptChartForUi(raw, profile));
      } catch {
        /* optional overlay */
      }
    })();
  }, [user, slug]);

  const match = live?.sun_sign?.toLowerCase() === data?.name?.toLowerCase();

  if (!data) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background cosmic-page-bg">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Home</span>
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-serif text-lg">NatalTruth</span>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4" aria-hidden>{data.glyph}</div>
          <h1 className="font-serif text-4xl text-foreground mb-2">{data.name}</h1>
          <p className="text-muted-foreground">{data.dates}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Element: {data.element} · Ruler: {data.ruler}
          </p>
        </div>

        {live && (
          <div className={`glass-card rounded-2xl p-5 mb-6 border ${match ? "border-primary/50" : "border-border"}`}>
            <h2 className="font-serif text-lg mb-2">Your live natal chart</h2>
            <p className="text-sm text-muted-foreground">
              From api.nataltruth.com: Sun <strong>{live.sun_sign}</strong> · Moon {live.moon_sign} · Rising{" "}
              {live.rising_sign}
              {match ? " — this page’s sign matches your Sun." : " — your Sun is a different sign; open full chart for truth."}
            </p>
            <div className="flex gap-2 mt-4">
              <Link to="/chart"><Button size="sm">Full chart</Button></Link>
              <Link to="/chat"><Button size="sm" variant="outline">Ask AI</Button></Link>
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6 mb-8 border border-border">
          <h2 className="font-serif text-xl mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> General sun-sign notes
          </h2>
          <ul className="space-y-2 text-left text-muted-foreground">
            {data.traits.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-primary">·</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-6">
            Marketing notes only. Precision = your birth chart calculation on NatalTruth.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/auth?mode=register"><Button>Create profile & chart</Button></Link>
          <Link to="/horoscope/today"><Button variant="outline">My chart today (live)</Button></Link>
        </div>
      </main>
    </div>
  );
}
