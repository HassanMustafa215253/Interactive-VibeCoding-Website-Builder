import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Northstar Builder",
  description: "Generate websites, select exact UI regions, and apply scoped AI edits inside a product-grade builder.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
