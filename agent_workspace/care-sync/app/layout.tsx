import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Care-Sync — Family Care Coordination",
  description: "Secure, AI-powered family care coordination platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="noise-bg antialiased">
        {children}
      </body>
    </html>
  );
}
