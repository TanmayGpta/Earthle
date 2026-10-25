import type { Metadata } from "next";
import { Instrument_Serif, Hanken_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Display serif + light grotesk, standing in for Rainmaker's Flecha + Founders Grotesk
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});

const grotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-grotesk",
});

export const metadata: Metadata = {
  title: "Earthle — 3D Spatial Geography Quiz",
  description: "Test and master your geographical knowledge on a high-precision 3D globe. Name countries, memorize capitals, and build your world atlas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${display.variable} ${grotesk.variable}`}>
      <body className="min-h-screen bg-[#1c2c26] text-[#f5f5f1] antialiased selection:bg-[#e5ff42] selection:text-[#1c2c26]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
