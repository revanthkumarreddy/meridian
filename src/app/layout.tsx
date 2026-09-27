import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { ProgressProvider } from "@/components/progress-provider";
import { SiteHeader } from "@/components/site-header";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meridian — SDE-2 and applied AI desk",
  description:
    "A sixteen-week preparation desk for SDE-2 loops at Google and other top companies, with embeddings, RAG, LangChain, LangGraph, and vector search.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="antialiased">
        <ProgressProvider>
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-6">{children}</main>
        </ProgressProvider>
      </body>
    </html>
  );
}
