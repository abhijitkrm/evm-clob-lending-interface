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

export default function BorrowingForm() {
  const { address } = useAccount();
  const [formData, setFormData] = useState({
    asset: CONTRACTS.MockUSDC as string,
    amount: '',
    maxInterestRate: '',
    duration: '',
    collateralAsset: CONTRACTS.MockWETH as string,
    collateralAmount: ''
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Helper function to get token decimals
  const getTokenDecimals = (address: string) => {
    if (address === CONTRACTS.MockUSDC) return 6;
    if (address === CONTRACTS.MockWETH) return 18;
    return 18;
  };

  // Helper function to get token symbol
  const getTokenSymbol = (address: string) => {
    if (address === CONTRACTS.MockUSDC) return 'USDC';
    if (address === CONTRACTS.MockWETH) return 'WETH';
    return 'TOKEN';
  };

  // Read asset balance
  const { data: assetBalance } = useReadContract({
    address: formData.asset as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  });

  // Read collateral balance
  const { data: collateralBalance } = useReadContract({
    address: formData.collateralAsset as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  });

  // Read collateral allowance
  const { data: collateralAllowance, refetch: refetchCollateralAllowance } = useReadContract({
    address: formData.collateralAsset as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, CONTRACTS.VeniceFiCore as `0x${string}`],
    query: { enabled: !!address && !!formData.collateralAsset }
  });

  const collateralAmount = formData.collateralAmount ? parseUnits(formData.collateralAmount, getTokenDecimals(formData.collateralAsset)) : BigInt(0);
  const needsApproval = !collateralAllowance || collateralAllowance < collateralAmount;
  const hasCollateralBalance = collateralBalance && collateralBalance >= collateralAmount;
  const isFormValid = formData.amount && formData.maxInterestRate && formData.duration && formData.collateralAmount;

  // Refetch allowance after successful transaction
  useEffect(() => {
    if (isSuccess && needsApproval) {
      // Small delay to ensure blockchain state is updated
      setTimeout(() => {
        refetchCollateralAllowance();
      }, 1000);
    }
  }, [isSuccess, needsApproval, refetchCollateralAllowance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    const amount = parseUnits(formData.amount, getTokenDecimals(formData.asset));
    const collateralAmount = parseUnits(formData.collateralAmount, getTokenDecimals(formData.collateralAsset));
    const needsApproval = !collateralAllowance || collateralAllowance < collateralAmount;

    if (needsApproval) {
      // Approve collateral tokens
      writeContract({
        address: formData.collateralAsset as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.VeniceFiCore, collateralAmount],
      });
    } else {
      // Create borrow request
      writeContract({
        address: CONTRACTS.VeniceFiCore as `0x${string}`,
        abi: VENICE_FI_ABI,
        functionName: 'createLoanDemand',
        args: [
          formData.asset as `0x${string}`,
          amount,
          BigInt(parseInt(formData.maxInterestRate) * 100), // Convert to basis points
          BigInt(parseInt(formData.duration) * 24 * 60 * 60), // Convert days to seconds
          formData.collateralAsset as `0x${string}`,
          collateralAmount,
        ],
      });
    }
  };

  useEffect(() => {
    if (isSuccess && !needsApproval) {
      toast.success('Borrow request created successfully!');
    }

    if (isSuccess && needsApproval) {
      toast.success('Collateral approved!', {
        description: 'Click "Create Borrow Request" to proceed.'
      });
    }
  }, [isSuccess, needsApproval]);

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
        disabled: !isFormValid || !hasCollateralBalance,
        text: 'Approve Collateral'
      };
    }
    
    return {
      disabled: !isFormValid || !hasCollateralBalance,
      text: 'Create Borrow Request'
    };
  };

  const buttonState = getButtonState();

  // Asset options for combobox
  const assetOptions = [
    { value: CONTRACTS.MockUSDC, label: 'USDC' },
    { value: CONTRACTS.MockWETH, label: 'WETH' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      {/* <h2 className="text-base font-medium text-gray-900 mb-3">Create Borrow Request</h2> */}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Asset to Borrow
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
              Amount to Borrow
            </label>
            {assetBalance && (
              <p className="text-[10px] text-gray-500">
                Balance: {formatUnits(assetBalance, getTokenDecimals(formData.asset))} {getTokenSymbol(formData.asset)}
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
            Maximum Interest Rate (% APR)
          </label>
          <Input
            type="number"
            step="0.1"
            value={formData.maxInterestRate}
            onChange={(e) => setFormData({ ...formData, maxInterestRate: e.target.value })}
            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            placeholder="12"
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
            Collateral Asset
          </label>
          <AssetCombobox
            value={formData.collateralAsset}
            onChange={(value) => setFormData({ ...formData, collateralAsset: value })}
            assets={assetOptions}
            placeholder="Select collateral..."
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-gray-700">
              Collateral Amount
            </label>
            {collateralBalance && (
              <p className="text-[10px] text-gray-500">
                Balance: {formatUnits(collateralBalance, getTokenDecimals(formData.collateralAsset))} {getTokenSymbol(formData.collateralAsset)}
              </p>
            )}
          </div>
          <Input
            type="number"
            step="0.01"
            value={formData.collateralAmount}
            onChange={(e) => setFormData({ ...formData, collateralAmount: e.target.value })}
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
