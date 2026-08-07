import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import BottomNav from "@/components/BottomNav";
import AuthGate from "@/components/AuthGate";
import SWRProvider from "@/components/SWRProvider";
import ThemeProvider, { THEME_INIT_SCRIPT } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PaisaTrack",
  description: "Log expenses in plain English, see where your money goes.",
  applicationName: "PaisaTrack",
  appleWebApp: {
    capable: true,
    title: "PaisaTrack",
    // "default" keeps the status bar opaque so it stays legible in both themes;
    // "black-translucent" would force white text over the light canvas.
    statusBarStyle: "default",
  },
  other: {
    // Next emits the modern `mobile-web-app-capable`; older iOS still looks for
    // the apple-prefixed name to launch fullscreen instead of in Safari chrome.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the page paint into the notch and home-indicator areas; the safe-area
  // padding on the bars keeps content clear of them.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#14120f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SWRProvider>
            <AuthGate>
              <NavBar />
              {/* Bottom padding clears the phone tab bar and the home indicator. */}
              <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-6">
                {children}
              </main>
              <BottomNav />
            </AuthGate>
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
