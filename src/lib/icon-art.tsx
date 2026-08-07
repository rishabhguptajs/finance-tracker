/**
 * The app mark: a piggy bank reduced to a handful of shapes, where the coin slot
 * is also its smile. Pure SVG geometry — no text, so no font has to be loaded
 * for it to render, and it stays crisp at any size.
 *
 * Everything sits well inside the middle 80% of the 512 box, which is the region
 * Android's maskable crop is guaranteed to keep.
 */
export function PiggyMark() {
  const cream = "#fff7ed";
  const snout = "#fbd9b8";
  const ink = "#ea580c";

  return (
    <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none">
      {/* Ears are drawn first so the head covers their base and they read as
          soft flops rather than horns. */}
      <path d="M206 152 C176 100 142 88 128 112 C114 136 124 172 142 186 Z" fill={cream} />
      <path d="M306 152 C336 100 370 88 384 112 C398 136 388 172 370 186 Z" fill={cream} />

      <rect x="101" y="126" width="310" height="248" rx="118" fill={cream} />

      {/* eyes */}
      <circle cx="198" cy="214" r="15" fill={ink} />
      <circle cx="314" cy="214" r="15" fill={ink} />

      {/* snout */}
      <ellipse cx="256" cy="274" rx="50" ry="33" fill={snout} />
      <rect x="240" y="264" width="11" height="21" rx="5.5" fill={ink} />
      <rect x="261" y="264" width="11" height="21" rx="5.5" fill={ink} />

      {/* the coin slot, curved just enough to double as a smile */}
      <path
        d="M196 324 Q256 358 316 324"
        stroke={ink}
        strokeWidth="21"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const ICON_BACKGROUND =
  "linear-gradient(145deg, #fb923c 0%, #ea580c 52%, #b8860b 100%)";
