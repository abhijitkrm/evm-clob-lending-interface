'use client';

import OrderbookView from '@/components/OrderbookView';
import LendingForm from '@/components/LendingForm';
import BorrowingForm from '@/components/BorrowingForm';
import ActiveLoansView from '@/components/ActiveLoansView';
import NetworkChecker from '@/components/NetworkChecker';
import NetworkIndicator from '@/components/NetworkIndicator';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useMarket, MARKETS } from '@/contexts/MarketContext';
import MarketDropdown from './MarketDropdown';
import { Navigation } from '@/components/Navigation';

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<'borrow' | 'lend'>('borrow');
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const { currentMarket, setCurrentMarket, availableMarkets } = useMarket();

  const injectedConnector = useMemo(() => injected(), []);

  // Fix hydration issue by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header - Loading state */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto pr-4 lg:pr-6">
            <div className="flex justify-between items-center h-12">
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <h1 className="text-xl font-medium text-gray-900 tracking-tight">VeniceFi</h1>
                  <span className="ml-2 text-xs font-light text-gray-500">Markets</span>
                </div>
                <Navigation />
              </div>
              <div className="flex items-center space-x-3">
                <div className="animate-pulse bg-gray-200/60 rounded-md px-3 py-1 w-24 h-7"></div>
              </div>
            </div>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto pr-4 lg:pr-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <h1 className="text-xl font-medium text-gray-900 tracking-tight">VeniceFi</h1>
                <span className="ml-2 text-xs font-light text-gray-500">Markets</span>
              </div>
              <Navigation />
            </div>
            <div className="flex items-center space-x-3">
              {/* Network Indicator */}
              <NetworkIndicator />
              
              {isConnected ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-700">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <Button 
                    onClick={() => disconnect()} 
                    variant="outline" 
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 font-light text-xs px-3 py-1 h-7"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => connect({ connector: injectedConnector })}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-light text-xs px-4 py-1 h-7"
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-3 pr-3 pb-3">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">{currentMarket.name} Market</h1>
                <p className="text-gray-600 text-sm mt-1">Trade lending and borrowing positions with real-time orderbook matching</p>
              </div>
              
              {/* Market Dropdown Switcher */}
              <div className="min-w-[180px]">
                <MarketDropdown 
                  currentMarket={currentMarket}
                  setCurrentMarket={setCurrentMarket}
                  availableMarkets={availableMarkets.filter(m => m.id === 'wbtc-usdc')}
                />
              </div>
            </div>
          </div>

          {/* Main Grid Layout - Orderbook Left, Forms Right */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Left Column - Orderbook (spans 8 columns) */}
            <div className="col-span-8">
              <OrderbookView />
            </div>

            {/* Right Column - Trading Forms (spans 4 columns) */}
            <div className="col-span-4 space-y-4">
              {/* Tab Switcher */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 p-1">
                <div className="flex rounded-md bg-gray-100/50">
                  <button
                    onClick={() => setActiveTab('borrow')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
                      activeTab === 'borrow'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Borrow
                  </button>
                  <button
                    onClick={() => setActiveTab('lend')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
                      activeTab === 'lend'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Lend
                  </button>
                </div>
              </div>

              {/* Active Form */}
              <div className="min-h-[400px]">
                {activeTab === 'borrow' ? <BorrowingForm /> : <LendingForm />}
              </div>
            </div>
          </div>

          {/* Bottom Section - Active Loans (full width) */}
          <div>
            <ActiveLoansView />
          </div>
        </div>
      </div>
      
      {/* Network Checker Modal */}
      <NetworkChecker />
    </div>
  );
}
