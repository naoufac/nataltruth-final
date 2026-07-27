import { Link } from "react-router-dom";
import CompatibilityPage from "./CompatibilityPage";

/**
 * Friend workflow = same live dual-chart compare + chat.
 * Reuses CompatibilityPage (API-backed) — not a dead /friend/* backend.
 */
export default function FriendPage() {
  return (
    <div>
      <div className="max-w-3xl mx-auto px-6 pt-4 text-sm text-muted-foreground">
        Friend mode uses live chart + name APIs for two people.{" "}
        <Link to="/chat" className="text-primary underline">
          Chat
        </Link>{" "}
        for coaching after you compare.
      </div>
      <CompatibilityPage />
    </div>
  );
}
