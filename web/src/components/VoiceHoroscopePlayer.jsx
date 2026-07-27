import { toast } from "sonner";
import { UNAVAILABLE_FEATURES } from "@/lib/liveApis";

/** No voice API — never fetch. */
export default function VoiceHoroscopePlayer() {
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => toast.message(UNAVAILABLE_FEATURES.voice)}
        className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-sm border border-border"
      >
        Voice horoscope (not available on NatalTruth API)
      </button>
    </div>
  );
}
