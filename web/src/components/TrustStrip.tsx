// The recurring trust signal (BRAND.md §6). Quietly, repeatedly, makes the
// precision claim visible — the opposite of "mystic luxury."
export default function TrustStrip({
  engine = "Swiss Ephemeris",
  showLink = true,
}: {
  engine?: string;
  showLink?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-trust-soft px-4 py-2.5 text-sm text-trust">
      <span aria-hidden>✦</span>
      <span>
        Calculated with <strong className="font-semibold">{engine}</strong> · positions shown to the
        arc-minute
      </span>
      {showLink && (
        <a href="/how-we-calculate" className="underline underline-offset-2 hover:no-underline">
          how we calculate ↗
        </a>
      )}
    </div>
  );
}
