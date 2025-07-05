'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { ToastProvider } from '@/contexts/ToastContext';
import { MarketProvider } from '@/contexts/MarketContext';
import ToastContainer from '@/components/Toast';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MarketProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </MarketProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
