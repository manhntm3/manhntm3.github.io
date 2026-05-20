import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://martinnguyen.me"),
  title: {
    default: "Martin Nguyen",
    template: "%s — Martin Nguyen",
  },
  description:
    "Martin Nguyen — software engineer focused on low-level systems, GPU programming, and machine learning.",
  openGraph: {
    title: "Martin Nguyen",
    description:
      "Software engineer focused on low-level systems, GPU programming, and machine learning.",
    url: "https://martinnguyen.me",
    siteName: "martinnguyen.me",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} ${newsreader.variable}`}
    >
      <body suppressHydrationWarning>
        <div className="min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
