/**
 * Honest empty state when a UI route has no NatalTruth API yet.
 * Never fires HTTP — zero 404s by design.
 */
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";

export default function FeatureUnavailable({
  title = "Not available yet",
  description = "This screen is part of the product shell, but there is no matching endpoint on api.nataltruth.com. No request was sent.",
  backTo = "/dashboard",
  backLabel = "Back to dashboard",
  liveAlternatives = [
    { to: "/chart", label: "Birth chart" },
    { to: "/numerology", label: "Numerology" },
    { to: "/gematria", label: "Name systems" },
    { to: "/chat", label: "AI coach" },
  ],
}) {
  return (
    <div className="min-h-screen bg-background cosmic-page-bg flex items-center justify-center p-6">
      <div className="glass-card rounded-2xl p-8 max-w-lg w-full text-center border border-border">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
          <Construction className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="font-serif text-2xl text-foreground mb-3">{title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{description}</p>
        {liveAlternatives?.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {liveAlternatives.map((a) => (
              <Link key={a.to} to={a.to}>
                <Button variant="outline" size="sm" className="rounded-xl">
                  {a.label}
                </Button>
              </Link>
            ))}
          </div>
        )}
        <Link to={backTo}>
          <Button className="rounded-xl bg-primary text-primary-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
