import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md glass-card rounded-xl p-6 border border-border text-center">
        <h1 className="font-serif text-xl mb-3">No password server</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Auth is local-only today. Sign in with your email to load this device&apos;s profile and plan entitlements from the API.
        </p>
        <Link to="/auth"><Button>Sign in</Button></Link>
      </div>
    </div>
  );
}
