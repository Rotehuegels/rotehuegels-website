import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services — Rotehügels",
  description:
    "Research, Business, and Consultancy services across extractive metallurgy, critical minerals, zinc recycling, and circular economy.",
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
