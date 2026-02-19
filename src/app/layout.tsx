import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

import { StarfieldBackground } from "@/components/ui/StarfieldBackground";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ansa Tracker",
  description: "Advanced personnel management system.",
};

import { GlobalClickSound } from "@/components/ui/GlobalClickSound";

// ... (other imports)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans antialiased bg-[#050505] text-[#EDEDED] relative min-h-screen`}
      >
        <GlobalClickSound />
        <StarfieldBackground />
        <div className="relative z-10">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
