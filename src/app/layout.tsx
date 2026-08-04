import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import AuthGate from "@/components/AuthGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PaisaTrack",
  description: "Log expenses in plain English, see where your money goes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthGate>
          <NavBar />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        </AuthGate>
      </body>
    </html>
  );
}
