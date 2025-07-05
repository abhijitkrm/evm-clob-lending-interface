'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { AssetCombobox } from '@/components/ui/asset-combobox';
import { CONTRACTS } from '@/lib/wagmi';
import { ERC20_ABI, VENICE_FI_ABI } from '@/lib/contracts';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { useMarket } from '@/contexts/MarketContext';

export default function LendingForm() {
  const { address } = useAccount();
  const { currentMarket } = useMarket();
  const [formData, setFormData] = useState({
    asset: currentMarket.quoteAsset.address as string, // Always USDC for lending
    amount: '',
    interestRate: '',
    duration: '',
    collateralRatio: ''
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Helper function to get token decimals
  const getTokenDecimals = (address: string) => {
    if (address === currentMarket.baseAsset.address) return currentMarket.baseAsset.decimals;
    if (address === currentMarket.quoteAsset.address) return currentMarket.quoteAsset.decimals;
    return 18; // fallback
  };

  // Helper function to get token symbol
  const getTokenSymbol = (address: string) => {
    if (address === currentMarket.baseAsset.address) return currentMarket.baseAsset.symbol;
    if (address === currentMarket.quoteAsset.address) return currentMarket.quoteAsset.symbol;
    return 'TOKEN'; // fallback
  };

  // Asset options for combobox - lending is always in quote asset (USDC)
  const assetOptions = [
    { value: currentMarket.quoteAsset.address, label: currentMarket.quoteAsset.symbol }
  ];

  // Update form asset when market changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      asset: currentMarket.quoteAsset.address
    }));
  }, [currentMarket]);

  // Read user's token balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: formData.asset as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: formData.asset as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.VeniceFiCore] : undefined,
    query: { enabled: !!address }
  });

  const amount = formData.amount ? parseUnits(formData.amount, getTokenDecimals(formData.asset)) : BigInt(0);
  const needsApproval = !allowance || allowance < amount;
  const hasBalance = balance && balance >= amount;
  const isFormValid = formData.amount && formData.interestRate && formData.duration && formData.collateralRatio;

  // Handle successful transactions
  useEffect(() => {
    if (isSuccess) {
      refetchAllowance();
      if (!needsApproval) {
        toast.success('Loan offer created successfully!');
      } else {
        toast.success('Tokens approved!', {
          description: 'Click "Create Loan Offer" to proceed.'
        });
      }
    }
  }, [isSuccess, needsApproval, refetchAllowance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    const amount = parseUnits(formData.amount, getTokenDecimals(formData.asset));
    const needsApproval = !allowance || allowance < amount;

    if (needsApproval) {
      // Approve tokens
      writeContract({
        address: formData.asset as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.VeniceFiCore, amount],
      });
    } else {
      // Create loan offer
      writeContract({
        address: CONTRACTS.VeniceFiCore as `0x${string}`,
        abi: VENICE_FI_ABI,
        functionName: 'createLoanOffer',
        args: [
          formData.asset as `0x${string}`,
          amount,
          BigInt(parseInt(formData.interestRate) * 100), // Convert to basis points
          BigInt(parseInt(formData.duration) * 24 * 60 * 60), // Convert days to seconds
          BigInt(parseInt(formData.collateralRatio) * 100), // Convert to basis points
        ],
      });
    }
  };

  // Determine button state and text
  const getButtonState = () => {
    if (isPending || isConfirming) {
      return {
        disabled: true,
        text: isConfirming ? 'Confirming...' : 'Processing...'
      };
    }
    
    if (needsApproval) {
      return {
        disabled: !isFormValid || !hasBalance,
        text: 'Approve Tokens'
      };
    }
    
    return {
      disabled: !isFormValid || !hasBalance,
      text: 'Create Loan Offer'
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      {/* <h2 className="text-base font-medium text-gray-900 mb-3">Create Loan Offer</h2> */}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Asset
          </label>
          <AssetCombobox
            value={formData.asset}
            onChange={(value) => setFormData({ ...formData, asset: value })}
            assets={assetOptions}
            placeholder="Select asset..."
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-gray-700">
              Amount to Lend
            </label>
            {balance && (
              <p className="text-[10px] text-gray-500">
                Balance: {formatUnits(balance, getTokenDecimals(formData.asset))} {getTokenSymbol(formData.asset)}
              </p>
            )}
          </div>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            placeholder="100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Interest Rate (% APR)
          </label>
          <Input
            type="number"
            step="0.1"
            value={formData.interestRate}
            onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            placeholder="10"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Duration (Days)
          </label>
          <Input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            placeholder="30"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Required Collateral Ratio (%)
          </label>
          <Input
            type="number"
            value={formData.collateralRatio}
            onChange={(e) => setFormData({ ...formData, collateralRatio: e.target.value })}
            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            placeholder="150"
          />
        </div>

        <Button
          type="submit"
          disabled={buttonState.disabled}
          className="w-full mt-3 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonState.text}
        </Button>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700 text-xs">
              Error: {error.message}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
