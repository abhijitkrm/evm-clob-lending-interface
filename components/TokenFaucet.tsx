'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { CONTRACTS } from '@/lib/wagmi';
import { ERC20_ABI } from '@/lib/contracts';

interface TokenFaucetProps {
  isDialog?: boolean;
}

export default function TokenFaucet({ isDialog = false }: TokenFaucetProps) {
  const { address } = useAccount();
  const [loading, setLoading] = useState<string | null>(null);
  
  const { writeContract, data: hash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mintTokens = async (tokenAddress: string, tokenName: string) => {
    if (!address) return;
    
    setLoading(tokenName);
    try {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'faucet',
      });
    } catch (err) {
      console.error('Error minting tokens:', err);
      setLoading(null);
    }
  };

  if (isConfirming) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-8 mb-6">
        <div className="text-center py-4 text-gray-700 font-light tracking-wide">
          Transaction confirming...
        </div>
      </div>
    );
  }

  if (isSuccess) {
    setLoading(null);
  }

  return (
    <div className={isDialog ? "" : "bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-8 mb-6"}>
      {!isDialog && (
        <>
          <h3 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Test Token Faucet</h3>
          <p className="text-gray-600 font-light mb-6 tracking-wide">Get test tokens for interacting with the protocol</p>
        </>
      )}
      
      <div className="flex gap-4 flex-wrap">
        <Button
          onClick={() => mintTokens(CONTRACTS.MockUSDC, 'USDC')}
          disabled={loading === 'USDC'}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-light rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
        >
          {loading === 'USDC' ? 'Minting...' : 'Get USDC'}
        </Button>
        
        <Button
          onClick={() => mintTokens(CONTRACTS.MockWETH, 'WETH')}
          disabled={loading === 'WETH'}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-light rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
        >
          {loading === 'WETH' ? 'Minting...' : 'Get WETH'}
        </Button>
        
        <Button
          onClick={() => mintTokens(CONTRACTS.MockWBTC, 'WBTC')}
          disabled={loading === 'WBTC'}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-light rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
        >
          {loading === 'WBTC' ? 'Minting...' : 'Get WBTC'}
        </Button>
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-lg">
          <p className="text-red-700 font-light">
            Error: {error.message}
          </p>
        </div>
      )}
    </div>
  );
}
