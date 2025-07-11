"use client";

import { useWalletWhitelist } from "@/hooks/useWalletWhitelist";
import React from "react";

export default function ClientWhitelistGate({ children }: { children: React.ReactNode }) {
  const { isWhitelisted, address } = useWalletWhitelist();

  if (isWhitelisted === false) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
        <div className="text-2xl font-semibold text-gray-900 mb-2">Your wallet is not whitelisted</div>
        <div className="text-gray-600 mb-6">Access to VeniceFi is restricted to approved addresses.<br />Please connect a whitelisted wallet to use this app.</div>
        <div className="px-4 py-2 bg-gray-100 rounded text-gray-800 font-mono text-sm border border-gray-200">
          {address}
        </div>
      </div>
    );
  }
  // If wallet is whitelisted or not connected, render children
  return <>{children}</>;
}
