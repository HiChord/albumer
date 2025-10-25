import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Albumer - Album Organization for Bands",
  description: "Beautiful tool for organizing your album production",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
