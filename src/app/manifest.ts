import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PaisaTrack",
    short_name: "PaisaTrack",
    description: "Log expenses in plain English, see where your money goes.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf9f7",
    theme_color: "#faf9f7",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      // The mark sits inside the middle 80%, so the same art survives the crop.
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "Log an expense", url: "/" },
      { name: "Ask your money", url: "/ask" },
      { name: "Dashboard", url: "/dashboard" },
    ],
  };
}
