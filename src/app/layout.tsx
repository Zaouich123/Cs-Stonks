import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { PreferencesProvider } from "@/components/preferences/PreferencesProvider";
import { NotificationToasts } from "@/components/layout/NotificationToasts";
import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Cs-Stonks Data Foundation",
  description: "Internal data ingestion and storage foundation for Cs-Stonks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${headingFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <PreferencesProvider>
          {children}
          <NotificationToasts />
        </PreferencesProvider>
      </body>
    </html>
  );
}
