import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, ArrowLeft, Star, Sun, Moon, Loader2, RefreshCw } from "lucide-react";
import BuyReadingButton from "@/components/BuyReadingButton";
import ReadingTrustStrip from "@/components/ReadingTrustStrip";


const PAID_TIERS = ["enthusiast", "advanced", "professional"];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null); // tier being checked out
  const [pricingError, setPricingError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reading") === "cancelled") {
      toast.message("Checkout cancelled. No charge was made.");
      params.delete("reading");
      const search = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (search ? `?${search}` : ""));
    }
  }, []);

  useEffect(() => {
    // Static product framing — no Stripe/pricing API yet (see ROADMAP).
    setPricingError(null);
    setPlans([
      { id: "free", name: "Free", price: 0, tier: "free", features: ["Limited calc surface (gating TBD)", "Moshier / name TBD"] },
      { id: "monthly", name: "Monthly", price: 19, tier: "monthly", features: ["Ongoing access (gating TBD)"] },
      { id: "premium", name: "Premium", price: 49, tier: "premium", features: ["Higher access (gating TBD)"] },
      { id: "ultra", name: "Ultra", price: 199, tier: "ultra", features: ["Swiss-only deep report path (when reports exist)", "For coaches / precision"] },
    ]);
    setLoading(false);
  }, [retryCount]);

  // JSON-LD Product schema. Lets Google surface our subscription tiers
  // (and the one-time $19 reading) as a rich snippet with prices in
  // search results, instead of just the page meta description.
  useEffect(() => {
    if (!plans || plans.length === 0) return;
    const offers = [
      {
        "@type": "Offer",
        name: "Personal Astrology Reading (one-time)",
        price: "19.00",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: "https://nataltruth.com/pricing",
        description: "A personalized written birth-chart reading delivered within 48 hours. No subscription.",
      },
      ...plans
        .filter((p) => Number(p.price) > 0)
        .map((p) => ({
          "@type": "Offer",
          name: `${p.name} subscription`,
          price: String(p.price),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://nataltruth.com/pricing",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: String(p.price),
            priceCurrency: "USD",
            referenceQuantity: { "@type": "QuantitativeValue", value: "1", unitCode: "MON" },
          },
        })),
    ];
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "NatalTruth Astrology AI Coaching",
      description:
        "AI-powered birth-chart readings, daily horoscope coaching, transit forecasts, and one-time personalized readings from real astrologers.",
      brand: { "@type": "Brand", name: "NatalTruth" },
      offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: "0", highPrice: "99", offerCount: offers.length, offers },
    };
    let script = document.head.querySelector('script[data-jsonld="pricing-product"]');
    if (!script) {
      script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-jsonld", "pricing-product");
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(schema);
    return () => {
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };
  }, [plans]);

  const handlePlanClick = async (plan) => {
    // Free plan — just go to register/dashboard
    if (plan.id === "seeker") {
      navigate(user ? "/dashboard" : "/auth?mode=register");
      return;
    }
    // Professional — contact sales
    if (plan.id === "professional") {
      window.location.href = "mailto:contact@nataltruth.com?subject=Professional Plan";
      return;
    }
    // Paid plan — must be logged in
    if (!user) {
      navigate("/auth?mode=register");
      return;
    }
    // Already on this tier
    if (user.subscription_tier === plan.id) {
      toast.info("You are already on this plan.");
      return;
    }

    // No payments API on api.nataltruth.com — never HTTP (zero 404).
    setCheckoutLoading(null);
    toast.message("Payments are not built yet", {
      description: "Plans are product framing only. Chart, name systems, and chat are live.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background cosmic-page-bg flex items-center justify-center">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
      </div>
    );
  }

  if (pricingError) {
    return (
      <div className="min-h-screen bg-background cosmic-page-bg flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <p className="text-muted-foreground mb-6">{pricingError}</p>
          <Button
            onClick={() => { setLoading(true); setPricingError(null); setRetryCount(c => c + 1); }}
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
    <div className="min-h-screen bg-background cosmic-page-bg p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="pricing-back-btn">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{user ? "← Dashboard" : "← Back to Home"}</span>
            </Link>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors border border-border/50"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="font-serif text-xl text-foreground">NatalTruth</span>
            </div>
            <h1 className="font-serif text-foreground mb-4">
              Choose how deep you want to go
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Start free with your birth chart. Upgrade only if the daily
              guidance earns its place — every paid plan can be paused or
              cancelled in two clicks.
            </p>
          </div>
        </div>

        {/* One-time Personal Reading Hero */}
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-10 border border-primary/30" data-testid="buy-reading-hero">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                  Don't want a subscription? Read this first.
                </span>
              </div>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
                One personal reading, delivered in 48 hours
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3 max-w-xl">
                A real astrologer-grade written reading drawn from your full
                natal chart — your strengths, your blind spots, the year
                ahead. Pay once. Read it whenever you need it. No subscription,
                no auto-renew, no cancel-flow gymnastics.
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-4xl text-foreground">$19</span>
                <span className="text-muted-foreground text-sm">one-time · 48h delivery</span>
              </div>
            </div>
            <div className="md:w-56">
              <BuyReadingButton
                className="w-full text-base py-6"
                label="Buy now — $19"
                testId="pricing-buy-reading"
              />
            </div>
          </div>
          <ReadingTrustStrip className="mt-5 pt-4 border-t border-border/40" />
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan, index) => {
            const isCurrent = user?.subscription_tier === plan.id;
            const isLoading = checkoutLoading === plan.id;
            return (
              <div 
                key={plan.id}
                className={`glass-card rounded-2xl p-6 relative card-lift ${plan.popular ? 'pricing-popular' : ''}`}
                data-testid={`pricing-plan-${index}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Current Plan
                  </div>
                )}
                
                <h3 className="font-serif text-xl text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.tagline}</p>
                
                <div className="mb-6">
                  <span className="font-serif text-4xl text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full rounded-xl ${plan.popular ? 'glow-button bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                  onClick={() => handlePlanClick(plan)}
                  disabled={isLoading || isCurrent}
                  data-testid={`pricing-cta-${index}`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting…
                    </span>
                  ) : isCurrent ? "Current Plan" : plan.cta}
                </Button>
              </div>
            );
          })}
        </div>

        {/* FAQ Link */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Have questions? Check our{" "}
            <Link to="/#faq" className="text-primary hover:underline">
              FAQ section
            </Link>{" "}
            or{" "}
            <a href="mailto:contact@nataltruth.com" className="text-primary hover:underline">
              contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
