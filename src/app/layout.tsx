import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Archivo, Space_Mono } from "next/font/google";
import { config } from "@/config";
import "./globals.css";

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: "RAVE.LK — Sri Lanka's Electronic Music Movement",
    template: "%s · RAVE.LK",
  },
  description:
    "Warehouse raves, beach parties and main-stage madness across Sri Lanka. Book tickets for the island's biggest EDM events.",
  openGraph: {
    title: "RAVE.LK — Sri Lanka's Electronic Music Movement",
    description:
      "Warehouse raves, beach parties and main-stage madness across Sri Lanka.",
    type: "website",
    images: ["/brand/ravelk-logo-bg.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${chakra.variable} ${archivo.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
