'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { arbitrumSepolia } from 'viem/chains';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Wifi } from 'lucide-react';

const REQUIRED_CHAIN_ID = arbitrumSepolia.id; // 421614
const REQUIRED_CHAIN_NAME = 'Arbitrum Sepolia';

export default function NetworkIndicator() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const isOnCorrectNetwork = chainId === REQUIRED_CHAIN_ID;

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

  // Don't show anything when on correct network
  if (isOnCorrectNetwork) {
    return null;
  }

  // Show wrong network indicator with switch button
  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <span className="text-sm font-medium text-amber-700">Wrong Network</span>
      <Button
        size="sm"
        onClick={handleSwitchNetwork}
        disabled={isPending}
        className="h-7 px-2 bg-amber-600 hover:bg-amber-700 text-white text-xs"
      >
        {isPending ? (
          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Wifi className="h-3 w-3 mr-1" />
            Switch
          </>
        )}
      </Button>
    </div>
  );
}
