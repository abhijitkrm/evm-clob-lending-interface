'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CONTRACTS } from '@/lib/wagmi';

// Market configuration
export type Market = {
  id: 'weth-usdc' | 'wbtc-usdc';
  name: string;
  baseAsset: {
    symbol: string;
    address: string;
    decimals: number;
  };
  quoteAsset: {
    symbol: string;
    address: string;
    decimals: number;
  };
};

export const MARKETS: Record<string, Market> = {
  'weth-usdc': {
    id: 'weth-usdc',
    name: 'WETH-USDC',
    baseAsset: {
      symbol: 'WETH',
      address: CONTRACTS.MockWETH,
      decimals: 18,
    },
    quoteAsset: {
      symbol: 'USDC',
      address: CONTRACTS.MockUSDC,
      decimals: 6,
    },
  },
  'wbtc-usdc': {
    id: 'wbtc-usdc',
    name: 'WBTC-USDC',
    baseAsset: {
      symbol: 'WBTC',
      address: CONTRACTS.MockWBTC,
      decimals: 8,
    },
    quoteAsset: {
      symbol: 'USDC',
      address: CONTRACTS.MockUSDC,
      decimals: 6,
    },
  },
};

type MarketContextType = {
  currentMarket: Market;
  setCurrentMarket: (market: Market) => void;
  availableMarkets: Market[];
};

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [currentMarket, setCurrentMarket] = useState<Market>(MARKETS['wbtc-usdc']);
  const availableMarkets = Object.values(MARKETS);

  return (
    <MarketContext.Provider
      value={{
        currentMarket,
        setCurrentMarket,
        availableMarkets,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
