import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import VoiceHoroscopePlayer from './VoiceHoroscopePlayer';

/**
 * One-click checkout for the $19 Personal Astrology Reading.
 * Works for both authed and guest users — for guests Stripe collects the
 * email on the hosted Checkout page.
 *
 * By default, clicking the button opens a small context modal that captures
 * birth data up-front so fulfilment is faster and we get funnel data on
 * abandoned carts. Pass `skipContextModal` to revert to direct redirect.
 */
export default function BuyReadingButton({
  className = "",
  label = "Buy Reading — $19",
  variant = "primary",
  size = "default",
  payload = {},
  testId = "buy-reading-btn",
  skipContextModal = false,
}) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    birth_date: user?.birth_date || "",
    birth_time: user?.birth_time || "",
    birth_place: user?.birth_place || "",
    notes: "",
  });

  const startCheckout = async (body) => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(
        `${API}/payments/buy-reading`,
        body || {},
        { headers }
      );
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }
      toast.error("Could not start checkout. Please try again.");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "Something went wrong starting checkout. No charge was made — try again in a moment.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (skipContextModal) {
      startCheckout(payload);
      return;
    }
    setOpen(true);
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const body = {
      ...payload,
      name: form.name?.trim() || undefined,
      birth_date: form.birth_date || undefined,
      birth_time: form.birth_time || undefined,
      birth_place: form.birth_place?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    };
    startCheckout(body);
  };

  const handleSkip = () => {
    startCheckout(payload);
  };

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const baseClasses =
    variant === "primary"
      ? "glow-button bg-primary text-primary-foreground"
      : "bg-secondary text-secondary-foreground";

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={loading}
        className={`rounded-xl ${baseClasses} ${className}`}
        size={size}
        data-testid={testId}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {label}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={(o) => !loading && setOpen(o)}>
        <DialogContent
          className="max-w-md"
          data-testid="buy-reading-context-modal"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Your reading details
            </DialogTitle>
            <DialogDescription>
              Share your birth info so our astrologers can start the reading
              the moment payment lands. Every field is optional — you can also
              skip and we'll email you a short form after checkout.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="buy-reading-name">Your name</Label>
              <Input
                id="buy-reading-name"
                value={form.name}
                onChange={setField("name")}
                placeholder="e.g. Alex Rivera"
                autoComplete="name"
                data-testid="buy-reading-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="buy-reading-birth-date">Birth date</Label>
                <Input
                  id="buy-reading-birth-date"
                  type="date"
                  value={form.birth_date}
                  onChange={setField("birth_date")}
                  data-testid="buy-reading-birth-date"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="buy-reading-birth-time">Birth time</Label>
                <Input
                  id="buy-reading-birth-time"
                  type="time"
                  value={form.birth_time}
                  onChange={setField("birth_time")}
                  data-testid="buy-reading-birth-time"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="buy-reading-birth-place">Birth place</Label>
              <Input
                id="buy-reading-birth-place"
                value={form.birth_place}
                onChange={setField("birth_place")}
                placeholder="City, country"
                autoComplete="address-level2"
                data-testid="buy-reading-birth-place"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="buy-reading-notes">
                Anything specific you'd like the reading to focus on?
              </Label>
              <Textarea
                id="buy-reading-notes"
                value={form.notes}
                onChange={setField("notes")}
                placeholder="Career, a relationship, a decision you're weighing…"
                rows={3}
                maxLength={2000}
                data-testid="buy-reading-notes"
              />
            </div>

            <div className="pt-4 border-t border-purple-100">
              <p className="text-sm text-purple-700 mb-2">Premium Feature Included:</p>
              <VoiceHoroscopePlayer readingId="premium-reading-123" />
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={loading}
                className="rounded-xl"
                data-testid="buy-reading-skip-btn"
              >
                Skip — I'll send details after
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl glow-button bg-primary text-primary-foreground"
                data-testid="buy-reading-continue-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Continue to checkout
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
