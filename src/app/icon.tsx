import { ImageResponse } from "next/og";
import { ICON_BACKGROUND, PiggyMark } from "@/lib/icon-art";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
