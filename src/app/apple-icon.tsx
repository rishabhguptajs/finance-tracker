import { ImageResponse } from "next/og";
import { ICON_BACKGROUND, PiggyMark } from "@/lib/icon-art";

// iOS ignores transparency and applies its own rounding, so this is a full-bleed tile.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ICON_BACKGROUND,
        }}
      >
        <PiggyMark />
      </div>
    ),
    size
  );
}
