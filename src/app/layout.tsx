import type { Metadata } from "next";
import { Mukta, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

const mukta = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-mukta",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "चौतारी डट डिके | डेनमार्कका नेपालीहरूको समाचार पोर्टल",
    template: "%s | चौतारी डट डिके",
  },
  description:
    "चौतारी डट डिके — डेनमार्कमा रहेका नेपाली समुदायका लागि समाचार, विचार, कानुन, रोजगारी र सामुदायिक गतिविधिको स्वतन्त्र डिजिटल मञ्च।",
  openGraph: {
    title: "चौतारी डट डिके | डेनमार्कका नेपालीहरूको समाचार पोर्टल",
    description:
      "डेनमार्कमा रहेका नेपाली समुदायका लागि समाचार, विचार र बहसको स्वतन्त्र डिजिटल मञ्च।",
    type: "website",
    locale: "ne_NP",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ne"
      className={`${mukta.variable} ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
