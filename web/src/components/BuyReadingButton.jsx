import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UNAVAILABLE_FEATURES } from "@/lib/liveApis";

/**
 * Payments not on api.nataltruth.com — no checkout HTTP (zero 404).
 */
export default function BuyReadingButton({
  className = "",
  label = "Buy Reading — $19",
  variant = "primary",
  size = "default",
  testId = "buy-reading-btn",
}) {
  return (
    <Button
      className={className}
      size={size}
      variant={variant === "primary" ? "default" : "outline"}
      data-testid={testId}
      onClick={() =>
        toast.message(UNAVAILABLE_FEATURES.payments, {
          description: "Use Chart, Numerology, and Chat — live calc APIs.",
        })
      }
    >
      <Sparkles className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
