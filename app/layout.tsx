import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
// @ts-expect-error CSS import is handled by Next.js
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Intro Voice",
  description: "Ask me anything — a voice agent that knows my story.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>
        <div className="aurora" aria-hidden />
        {children}
      </body>
    </html>
  );
}
