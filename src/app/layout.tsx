import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Safinah One · Live Monitoring",
  description:
    "Live position, speed, mission progress and imaging results of the Safinah One ASV (Gamantaray UGM) at KKI 2027.",
};

// Sengaja memakai font sistem (tanpa web font) supaya ringan di koneksi lemah.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
