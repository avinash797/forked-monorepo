import type { Metadata } from "next";
import { Inter, Bodoni_Moda } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  buildMetadata,
  buildWebsiteJsonLd,
  buildOrganizationJsonLd,
} from "@/lib/seo";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const bodoni_moda = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = buildMetadata({ canonicalPath: "/" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#050505" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildWebsiteJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildOrganizationJsonLd()),
          }}
        />
      </head>
      <body className={`${inter.variable} ${bodoni_moda.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
