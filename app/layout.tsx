import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from './providers';
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VeniceFi - Decentralized Orderbook Lending",
  description: "Fixed-rate lending protocol with transparent orderbook",
};

import React from "react";
import ClientWhitelistGate from "@/components/ClientWhitelistGate";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ClientWhitelistGate>
            {children}
          </ClientWhitelistGate>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
