'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/Toast';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
