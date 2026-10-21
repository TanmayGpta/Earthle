import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#1c2c26] text-[#f5f5f1] antialiased selection:bg-[#e5ff42] selection:text-[#1c2c26]">
        {children}
      </body>
    </html>
  );
}
