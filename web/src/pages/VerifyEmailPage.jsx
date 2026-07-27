import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md glass-card rounded-xl p-6 border border-border text-center">
        <h1 className="font-serif text-xl mb-3">Local profiles</h1>
        <p className="text-sm text-muted-foreground mb-4">
          There is no email-verification API on api.nataltruth.com. Your birth profile is stored on this device and drives live chart/name/chat.
        </p>
        <Link to="/dashboard"><Button>Go to dashboard</Button></Link>
      </div>
    </div>
  );
}
