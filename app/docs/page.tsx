'use client';

import { Navigation } from '@/components/Navigation';
import NetworkIndicator from '@/components/NetworkIndicator';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto pr-4 lg:pr-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-medium text-gray-900 tracking-tight">VeniceFi</h1>
              <Navigation />
            </div>
            <div className="flex items-center space-x-3">
              <NetworkIndicator />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-3 pr-3 pb-3">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Documentation</h1>
            <p className="text-gray-600 text-sm mt-1">Learn how to use VeniceFi&apos;s decentralized lending protocol</p>
          </div>

          {/* Documentation Content */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Getting Started */}
              <section className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Getting Started</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">1. Connect Your Wallet</h3>
                    <p className="text-gray-600">Connect your Web3 wallet to start lending and borrowing. VeniceFi supports all major wallets including MetaMask, WalletConnect, and more.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">2. Get Test Tokens</h3>
                    <p className="text-gray-600">For testnet usage, use our faucet to get WETH, WBTC, and USDC tokens. These tokens can be used for testing lending and borrowing functionality.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">3. Choose Your Market</h3>
                    <p className="text-gray-600">Select from available markets like WETH-USDC or WBTC-USDC. Each market has its own orderbook for lending and borrowing.</p>
                  </div>
                </div>
              </section>

              {/* How It Works */}
              <section className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6">
                <h2 className="text-xl font-medium text-gray-900 mb-4">How It Works</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Orderbook-Based Lending</h3>
                    <p className="text-gray-600">VeniceFi uses an orderbook model where lenders create offers and borrowers create demands. The system automatically matches compatible orders based on rate, duration, and amount.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Real-Time Matching</h3>
                    <p className="text-gray-600">Our smart contracts handle automatic matching when a borrow demand meets a lending offer&apos;s criteria, ensuring efficient price discovery.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Collateralized Loans</h3>
                    <p className="text-gray-600">All loans are over-collateralized to ensure security. Borrowers must provide collateral worth more than the borrowed amount.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Links */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/markets" className="block text-blue-600 hover:text-blue-800 text-sm">
                    → Go to Markets
                  </Link>
                  <Link href="/" className="block text-blue-600 hover:text-blue-800 text-sm">
                    → Back to Home
                  </Link>
                </div>
              </div>

              {/* Support */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Join our community for support and updates.
                </p>
                <div className="space-y-2">
                  <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm">
                    → Discord Community
                  </a>
                  <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm">
                    → GitHub Repository
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
