import { Clock, Shield, Lock } from "lucide-react";

/**
 * Reusable trust signals displayed next to the $19 buy-reading CTA.
 * Three small badges: 48-hour delivery, satisfaction guarantee, secure
 * Stripe checkout. Designed to slot under any BuyReadingButton.
 */
export default function ReadingTrustStrip({ className = "", align = "center" }) {
  const justify = align === "center" ? "justify-center" : "justify-start";
  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground ${justify} ${className}`}
      data-testid="reading-trust-strip"
    >
      <span className="inline-flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-primary" />
        Delivered within 48 hours
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-primary" />
        100% satisfaction guarantee
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5 text-primary" />
        Secure Stripe checkout
      </span>
    </div>
  );
}
