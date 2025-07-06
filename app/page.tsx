'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import LendingForm from '@/components/LendingForm';
import BorrowingForm from '@/components/BorrowingForm';
import OrderbookView from '@/components/OrderbookView';
import TokenFaucet from '@/components/TokenFaucet';
import FaucetDialog from '@/components/FaucetDialog';
import ActiveLoansView from '@/components/ActiveLoansView';
import { Navigation } from '@/components/Navigation';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [faucetDialogOpen, setFaucetDialogOpen] = useState(false);

  const injectedConnector = useMemo(() => injected(), []);

  // Fix hydration issue by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header - Static content */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <h1 className="text-2xl font-light text-gray-900 tracking-tight">VeniceFi</h1>
                  <span className="ml-3 text-sm font-light text-gray-500">Decentralized Orderbook Lending</span>
                </div>
                <Navigation />
              </div>
              <div className="flex items-center space-x-4">
                <div className="animate-pulse bg-gray-200/60 rounded-md px-4 py-2 w-32 h-10"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Loading state */}
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="animate-pulse">
              <div className="bg-gray-200/60 rounded-lg h-8 w-64 mx-auto mb-4"></div>
              <div className="bg-gray-200/60 rounded-lg h-6 w-96 mx-auto mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white/60 rounded-xl p-6 shadow-sm">
                    <div className="bg-gray-200/60 rounded h-4 w-24 mb-3"></div>
                    <div className="bg-gray-200/60 rounded h-3 w-full mb-2"></div>
                    <div className="bg-gray-200/60 rounded h-3 w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <h1 className="text-2xl font-light text-gray-900 tracking-tight">VeniceFi</h1>
                <span className="ml-3 text-sm font-light text-gray-500">Decentralized Orderbook Lending</span>
              </div>
              <Navigation />
            </div>
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => setFaucetDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                  >
                    Get Tokens
                  </Button>
                  <span className="text-sm font-medium text-gray-700">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <Button 
                    onClick={() => disconnect()} 
                    variant="outline" 
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 font-light"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => setFaucetDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                  >
                    Get Tokens
                  </Button>
                  <Button 
                    onClick={() => connect({ connector: injectedConnector })}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-light px-6"
                  >
                    Connect Wallet
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Welcome to VeniceFi</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-8">
                Connect your wallet to access the decentralized orderbook lending protocol.
                Experience transparent, fixed-rate lending with peer-to-peer matching.
              </p>
              <Button 
                onClick={() => connect({ connector: injectedConnector })}
                className="bg-gray-900 hover:bg-gray-800 text-white font-light px-8 py-3 text-base"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h2 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">Fixed-Rate Lending Protocol</h2>
              <p className="text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
                Create loan offers, submit borrow requests, and participate in transparent peer-to-peer lending with fixed interest rates.
              </p>
            </div>

            {/* Main Interface */}
            <Tabs defaultValue="orderbook" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-1">
                <TabsTrigger 
                  value="orderbook" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-light text-gray-700"
                >
                  Orderbook
                </TabsTrigger>
                <TabsTrigger 
                  value="lend" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-light text-gray-700"
                >
                  Lend
                </TabsTrigger>
                <TabsTrigger 
                  value="borrow" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-light text-gray-700"
                >
                  Borrow
                </TabsTrigger>
                <TabsTrigger 
                  value="loans" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-light text-gray-700"
                >
                  Active Loans
                </TabsTrigger>
                <TabsTrigger 
                  value="faucet" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-light text-gray-700"
                >
                  Faucet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orderbook" className="mt-8">
                <OrderbookView />
              </TabsContent>

              <TabsContent value="lend" className="mt-8">
                <div className="max-w-md mx-auto">
                  <LendingForm />
                </div>
              </TabsContent>

              <TabsContent value="borrow" className="mt-8">
                <div className="max-w-md mx-auto">
                  <BorrowingForm />
                </div>
              </TabsContent>

              <TabsContent value="loans" className="mt-8">
                <ActiveLoansView />
              </TabsContent>

              <TabsContent value="faucet" className="mt-8">
                <TokenFaucet />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      {/* Faucet Dialog */}
      <FaucetDialog
        isOpen={faucetDialogOpen}
        onClose={() => setFaucetDialogOpen(false)}
      />
    </div>
  );
}
