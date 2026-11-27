import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import "./globals.css";

export const metadata: Metadata = {
  title: "Safinah One · Live Monitoring",
  description:
    "Live position, speed, mission progress and imaging results of the Safinah One ASV (Gamantaray UGM) at KKI 2027.",
};

// Sengaja memakai font sistem (tanpa web font) supaya ringan di koneksi lemah.
// suppressHydrationWarning diperlukan next-themes karena kelas tema dipasang sebelum React jalan.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
