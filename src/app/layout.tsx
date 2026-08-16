import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paymiles – Pay Per Mile Car Rental",
  description: "Rent Tesla vehicles and pay only for the miles you drive",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
