import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vigil — Predictive Intelligence",
  description: "Industrial AI monitoring for equipment and pipeline infrastructure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-vg-void text-vg-steel">{children}</body>
    </html>
  );
}
