import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TickerBar from "@/components/TickerBar";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rotehuegels.com"),

  title: {
    default: "Rotehügels | Where Research Meets Business Excellence",
    template: "%s | Rotehügels",
  },

  description:
    "Rotehügel Research Business Consultancy Pvt. Ltd. delivers advanced hydrometallurgy, EPC solutions, and AutoREX™ intelligent process automation systems for global industries.",

  keywords: [
    "AutoREX",
    "Hydrometallurgy",
    "Battery Recycling",
    "Copper Processing",
    "Zinc Dross",
    "Process Automation",
    "EPC",
    "Critical Minerals",
  ],

  authors: [{ name: "Rotehügels" }],

  openGraph: {
    title: "Rotehügels",
    description: "Where Research Meets Business Excellence.",
    url: "https://www.rotehuegels.com",
    siteName: "Rotehügels",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Rotehügels",
    description: "Where Research Meets Business Excellence.",
    images: ["/logo.png"],
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <Header />
        <TickerBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}