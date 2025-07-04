'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { arbitrumSepolia } from 'viem/chains';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi } from 'lucide-react';

const REQUIRED_CHAIN_ID = arbitrumSepolia.id; // 421614
const REQUIRED_CHAIN_NAME = 'Arbitrum Sepolia';

export default function NetworkChecker() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending, error } = useSwitchChain();
  const [showNetworkPrompt, setShowNetworkPrompt] = useState(false);

  const isOnCorrectNetwork = chainId === REQUIRED_CHAIN_ID;

  useEffect(() => {
    // Show network prompt if connected but on wrong network
    if (isConnected && !isOnCorrectNetwork) {
      setShowNetworkPrompt(true);
    } else {
      setShowNetworkPrompt(false);
    }
  }, [isConnected, isOnCorrectNetwork]);

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: REQUIRED_CHAIN_ID });
    } catch (err) {
      console.error('Failed to switch network:', err);
    }
  };

  // Don't show anything if wallet is not connected
  if (!isConnected) {
    return null;
  }

  // Show success state briefly when on correct network
  if (isOnCorrectNetwork && !showNetworkPrompt) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 rounded-lg p-3 shadow-lg animate-in fade-in duration-300">
        <div className="flex items-center space-x-2 text-emerald-700">
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Connected to {REQUIRED_CHAIN_NAME}</span>
        </div>
      </div>
    );
  }

  // Show network switch prompt if on wrong network
  if (!isOnCorrectNetwork && showNetworkPrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Wrong Network</h3>
              <p className="text-sm text-gray-500">Switch to continue using VeniceFi</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-3">
              VeniceFi requires you to be connected to <strong>{REQUIRED_CHAIN_NAME}</strong> to function properly.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Current Network:</span>
                <span className="font-medium text-gray-900">
                  {chainId ? `Chain ID: ${chainId}` : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-500">Required Network:</span>
                <span className="font-medium text-emerald-600">{REQUIRED_CHAIN_NAME}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                Failed to switch network: {error.message}
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={handleSwitchNetwork}
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Switching...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Switch Network
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowNetworkPrompt(false)}
              variant="outline"
              className="flex-1"
              disabled={isPending}
            >
              Dismiss
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Make sure you have {REQUIRED_CHAIN_NAME} added to your wallet. 
              If you don&apos;t see it in your wallet, you may need to add it manually.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
