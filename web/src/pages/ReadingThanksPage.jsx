import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

/** No orders API — useful redirect hub to live product paths. */
export default function ReadingThanksPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md text-center glass-card rounded-2xl p-8 border border-border">
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
        <h1 className="font-serif text-2xl mb-3">Continue with live tools</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Paid reading checkout is not on the API yet. Your NatalTruth calc stack is live:
        </p>
        <div className="flex flex-col gap-2">
          <Link to="/chart"><Button className="w-full">Birth chart</Button></Link>
          <Link to="/numerology"><Button variant="outline" className="w-full">Numerology</Button></Link>
          <Link to="/chat"><Button variant="outline" className="w-full">AI coach</Button></Link>
        </div>
      </div>
    </div>
  );
}
