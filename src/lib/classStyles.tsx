// Single source of truth for how each class type is presented across the app
// (landing schedule in Index.tsx + client booking cards in BookClasses.tsx).
//
// Surf = royal blue (the studio's color code), Sculpt = brand coral,
// Yoga = warm amber. These mirror class_types.color in the DB; keeping a code
// fallback guarantees the right accent even if the DB value drifts.

export const CLASS_COLORS: Record<string, string> = {
  sculpt: "#E36F4C",
  surf: "#3B5BA5",
  yoga: "#D99A3C",
};

/** Royal blue used for Surf-Pilates everywhere. */
export const SURF_BLUE = CLASS_COLORS.surf;

/** True if a class type name refers to Surf-Pilates. */
export function isSurfClass(name?: string | null): boolean {
  return !!name && name.toLowerCase().includes("surf");
}

/** True if a class type name refers to Yoga. */
export function isYogaClass(name?: string | null): boolean {
  return !!name && name.toLowerCase().includes("yoga");
}

// Surfboard glyph for Surf-Pilates classes (neither lucide nor Material
// Symbols ship a real surfboard icon — "surfing" is a generic standing
// person). A clean longboard silhouette with a center stringer line.
export function SurfboardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* board outline: pointed nose, rounded tail, tilted 45° */}
      <path d="M4.2 19.8C1.6 17.2 5 8 9.8 4.2 14.6.4 19.6 1.4 20.6 2.4c1 1 2 6-1.8 10.8C15 18 7 21.4 4.2 19.8Z" />
      {/* center stringer */}
      <path d="M7.2 16.8 16.8 7.2" />
    </svg>
  );
}
