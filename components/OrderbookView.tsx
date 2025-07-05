'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useEffect } from 'react';
import { VENICE_FI_ABI } from '@/lib/contracts';
import { CONTRACTS } from '@/lib/wagmi';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { useMarket } from '@/contexts/MarketContext';

interface LoanOffer {
  id: bigint;
  lender: string;
  asset: string;
  amount: bigint;
  interestRate: bigint;
  duration: bigint;
  collateralRatio: bigint;
  isActive: boolean;
  createdAt: bigint;
}

interface LoanDemand {
  id: bigint;
  borrower: string;
  asset: string;
  amount: bigint;
  maxInterestRate: bigint;
  duration: bigint;
  collateralAsset: string;
  collateralAmount: bigint;
  isActive: boolean;
  createdAt: bigint;
}

export default function OrderbookView() {
  const { address } = useAccount();
  const { currentMarket } = useMarket();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read next offer ID to know how many offers exist
  const { data: nextOfferId, error: offerIdError, isLoading: offerIdLoading, refetch: refetchOfferId } = useReadContract({
    address: CONTRACTS.VeniceFiCore as `0x${string}`,
    abi: VENICE_FI_ABI,
    functionName: 'nextOfferId',
  });

  // Read next demand ID to know how many demands exist
  const { data: nextDemandId, error: demandIdError, isLoading: demandIdLoading, refetch: refetchDemandId } = useReadContract({
    address: CONTRACTS.VeniceFiCore as `0x${string}`,
    abi: VENICE_FI_ABI,
    functionName: 'nextDemandId',
  });

  console.log('Debug - nextDemandId:', nextDemandId, 'error:', demandIdError, 'loading:', demandIdLoading);
  console.log('Debug - nextDemandId response:', nextDemandId, 'error:', demandIdError, 'loading:', demandIdLoading);

  const totalOffers = nextOfferId ? Number(nextOfferId) : 0;
  const totalDemands = nextDemandId ? Number(nextDemandId) : 0;

  console.log('Debug - totalOffers:', totalOffers, 'totalDemands:', totalDemands);
  console.log('Debug - Will query offer IDs:', Array.from({length: Math.min(totalOffers, 10)}, (_, i) => i));
  console.log('Debug - Will query demand IDs:', Array.from({length: Math.min(totalDemands, 10)}, (_, i) => i));

  console.log('Debug - nextOfferId:', nextOfferId, 'totalOffers:', totalOffers);
  console.log('Debug - nextDemandId:', nextDemandId, 'totalDemands:', totalDemands);
  console.log('Debug - offerIdError:', offerIdError);
  console.log('Debug - demandIdError:', demandIdError);

  // Read first few offers and demands directly with simpler approach
  const { data: offer0 } = useReadContract({
    address: CONTRACTS.VeniceFiCore as `0x${string}`,
    abi: VENICE_FI_ABI,
    functionName: 'loanOffers',
    args: [BigInt(0)],
    query: { enabled: totalOffers > 0 }
  });

  const { data: offer1 } = useReadContract({
    address: CONTRACTS.VeniceFiCore as `0x${string}`,
    abi: VENICE_FI_ABI,
    functionName: 'loanOffers',
    args: [BigInt(1)],
    query: { enabled: totalOffers > 1 }
  });

  const { data: demand0 } = useReadContract({
    address: CONTRACTS.VeniceFiCore as `0x${string}`,
    abi: VENICE_FI_ABI,
    functionName: 'loanDemands',
    args: [BigInt(0)],
    query: { enabled: totalDemands > 0 }
  });

  console.log('Debug - Direct calls:');
  console.log('offer0:', offer0);
  console.log('offer1:', offer1);
  console.log('demand0:', demand0);

  // Create fixed number of hooks (maximum 10 offers and 10 demands)
  // This avoids the hooks violation while allowing for reasonable orderbook size
  const MAX_ORDERS = 10;

  const offerHooks = Array.from({ length: MAX_ORDERS }, (_, i) => {
    return useReadContract({
      address: CONTRACTS.VeniceFiCore as `0x${string}`,
      abi: VENICE_FI_ABI,
      functionName: 'loanOffers',
      args: [BigInt(i)],
      query: { enabled: i < totalOffers }
    });
  });

  const demandHooks = Array.from({ length: MAX_ORDERS }, (_, i) => {
    return useReadContract({
      address: CONTRACTS.VeniceFiCore as `0x${string}`,
      abi: VENICE_FI_ABI,
      functionName: 'loanDemands',
      args: [BigInt(i)],
      query: { enabled: i < totalDemands }
    });
  });

  // Check if individual demand hooks are still loading
  const demandsLoading = demandHooks.some(hook => hook.isLoading);
  const demandsLoaded = !demandIdLoading && !demandsLoading;

  // Check if individual offer hooks are still loading
  const offersLoading = offerHooks.some(hook => hook.isLoading);
  const offersLoaded = !offerIdLoading && !offersLoading;

  // Process loan offers data - convert arrays to objects
  const loanOffers: LoanOffer[] = offerHooks
    .map((hook, index) => {
      console.log(`Debug - Offer ${index}:`, hook.data, 'error:', hook.error, 'loading:', hook.isLoading);
      
      if (!hook.data || !Array.isArray(hook.data)) return undefined;
      
      // Convert array to LoanOffer object
      const [id, lender, asset, amount, interestRate, duration, collateralRatio, isActive, createdAt] = hook.data;
      
      return {
        id: id as bigint,
        lender: lender as string,
        asset: asset as string,
        amount: amount as bigint,
        interestRate: interestRate as bigint,
        duration: duration as bigint,
        collateralRatio: collateralRatio as bigint,
        isActive: isActive as boolean,
        createdAt: createdAt as bigint,
      } as LoanOffer;
    })
    .filter((offer): offer is LoanOffer => 
      offer !== undefined && 
      offer.isActive &&
      offer.asset === currentMarket.quoteAsset.address // Only show offers for current market's quote asset (USDC)
    );

  // Process loan demands data - convert arrays to objects
  const loanDemands: LoanDemand[] = demandHooks
    .map((hook, index) => {
      console.log(`Debug - Demand ${index}:`, hook.data, 'error:', hook.error, 'loading:', hook.isLoading);
      
      if (!hook.data || !Array.isArray(hook.data)) {
        console.log(`Debug - Demand ${index} has no data or is not array:`, hook.data);
        return undefined;
      }
      
      // Check if the demand exists (id should be > 0 for existing demands)
      const [id, borrower, asset, amount, maxInterestRate, duration, collateralAsset, collateralAmount, isActive, createdAt] = hook.data;
      
      if (!id || id === BigInt(0)) {
        console.log(`Debug - Demand ${index} has invalid ID:`, id);
        return undefined;
      }
      
      const demand = {
        id: id as bigint,
        borrower: borrower as string,
        asset: asset as string,
        amount: amount as bigint,
        maxInterestRate: maxInterestRate as bigint,
        duration: duration as bigint,
        collateralAsset: collateralAsset as string,
        collateralAmount: collateralAmount as bigint,
        isActive: isActive as boolean,
        createdAt: createdAt as bigint,
      } as LoanDemand;
      
      console.log(`Debug - Processed demand ${index}:`, demand);
      return demand;
    })
    .filter((demand): demand is LoanDemand => {
      const isValid = demand !== undefined && 
        demand.isActive &&
        demand.asset === currentMarket.quoteAsset.address && // Borrowing current market's quote asset (USDC)
        demand.collateralAsset === currentMarket.baseAsset.address; // Using current market's base asset as collateral
      console.log(`Debug - Filtering demand:`, demand, 'isValid:', isValid);
      return isValid;
    });

  // Helper functions
  const getTokenSymbol = (address: string) => {
    if (address === currentMarket.baseAsset.address) return currentMarket.baseAsset.symbol;
    if (address === currentMarket.quoteAsset.address) return currentMarket.quoteAsset.symbol;
    return 'TOKEN'; // fallback
  };

  const getTokenDecimals = (address: string) => {
    if (address === currentMarket.baseAsset.address) return currentMarket.baseAsset.decimals;
    if (address === currentMarket.quoteAsset.address) return currentMarket.quoteAsset.decimals;
    return 18; // fallback
  };

  const formatDuration = (seconds: bigint) => {
    const days = Number(seconds) / (24 * 60 * 60);
    return `${days}d`;
  };

  const formatRate = (rate: bigint) => {
    return `${Number(rate) / 100}%`;
  };

  // Aggregate loan offers by APR (similar to exchange orderbook price levels)
  const getAggregatedOffers = () => {
    const aggregated: Record<string, {
      apr: bigint;
      totalAmount: bigint;
      orderCount: number;
      asset: string;
      duration: bigint;
      offers: LoanOffer[];
    }> = {};

    loanOffers.forEach(offer => {
      // Create a key that includes APR, asset, and duration
      const key = `${offer.interestRate}-${offer.asset}-${offer.duration}`;
      
      if (!aggregated[key]) {
        aggregated[key] = {
          apr: offer.interestRate,
          totalAmount: BigInt(0),
          orderCount: 0,
          asset: offer.asset,
          duration: offer.duration,
          offers: []
        };
      }
      
      aggregated[key].totalAmount += offer.amount;
      aggregated[key].orderCount += 1;
      aggregated[key].offers.push(offer);
    });

    // Convert to array and sort by APR (ascending - best rates first)
    return Object.values(aggregated).sort((a, b) => 
      Number(a.apr) - Number(b.apr)
    );
  };

  // Aggregate loan demands by max APR
  const getAggregatedDemands = () => {
    const aggregated: Record<string, {
      maxApr: bigint;
      totalAmount: bigint;
      orderCount: number;
      asset: string;
      duration: bigint;
      collateralAsset: string;
      totalCollateralAmount: bigint;
      demands: LoanDemand[];
    }> = {};

    loanDemands.forEach(demand => {
      // Create a key that includes max APR, asset, duration, and collateral asset
      const key = `${demand.maxInterestRate}-${demand.asset}-${demand.duration}-${demand.collateralAsset}`;
      
      if (!aggregated[key]) {
        aggregated[key] = {
          maxApr: demand.maxInterestRate,
          totalAmount: BigInt(0),
          orderCount: 0,
          asset: demand.asset,
          duration: demand.duration,
          collateralAsset: demand.collateralAsset,
          totalCollateralAmount: BigInt(0),
          demands: []
        };
      }
      
      aggregated[key].totalAmount += demand.amount;
      aggregated[key].totalCollateralAmount += demand.collateralAmount;
      aggregated[key].orderCount += 1;
      aggregated[key].demands.push(demand);
    });

    // Convert to array and sort by max APR (descending - highest rates first)
    return Object.values(aggregated).sort((a, b) => 
      Number(b.maxApr) - Number(a.maxApr)
    );
  };

  const aggregatedOffers = getAggregatedOffers();
  const aggregatedDemands = getAggregatedDemands();

  // Helper function to check if offer and demand are compatible
  const isCompatible = (offer: LoanOffer, demand: LoanDemand) => {
    return (
      offer.asset === demand.asset &&
      offer.duration === demand.duration &&
      offer.interestRate <= demand.maxInterestRate &&
      offer.amount >= demand.amount &&
      offer.isActive &&
      demand.isActive &&
      offer.lender.toLowerCase() !== demand.borrower.toLowerCase() // Prevent self-matching
    );
  };

  // Find compatible matches
  const getCompatibleMatches = () => {
    const matches: Array<{ offer: LoanOffer; demand: LoanDemand }> = [];
    
    loanOffers.forEach(offer => {
      loanDemands.forEach(demand => {
        if (isCompatible(offer, demand)) {
          matches.push({ offer, demand });
        }
      });
    });
    
    return matches;
  };

  const compatibleMatches = getCompatibleMatches();

  // Fetch active loans count for stats
  const { data: nextLoanId } = useReadContract({
    address: CONTRACTS.VeniceFiCore as `0x${string}`,
    abi: VENICE_FI_ABI,
    functionName: 'nextLoanId',
  });

  const totalLoans = nextLoanId ? Number(nextLoanId) : 0;

  // Use a fixed number of hooks to avoid Rules of Hooks violation
  const MAX_LOANS = 50;
  const activeLoanHooks = [];
  
  // Create fixed number of hooks - always call the same number
  for (let i = 0; i < MAX_LOANS; i++) {
    const loanId = i + 1;
    activeLoanHooks.push(
      useReadContract({
        address: CONTRACTS.VeniceFiCore as `0x${string}`,
        abi: VENICE_FI_ABI,
        functionName: 'activeLoans',
        args: [BigInt(loanId)],
        query: {
          enabled: loanId <= totalLoans, // Only fetch if loan ID exists
        },
      })
    );
  }

  // Count active loans (not repaid and not liquidated)
  const activeLoansCount = activeLoanHooks.reduce((count, hook, index) => {
    const loanId = index + 1;
    
    // Skip if this loan ID doesn't exist or hook has no data
    if (loanId > totalLoans || !hook.data || !Array.isArray(hook.data)) {
      return count;
    }
    
    const [id, , , , , , , , , , isRepaid, isLiquidated] = hook.data;
    
    // Count if loan exists and is active (not repaid and not liquidated)
    if (id && id !== BigInt(0) && !isRepaid && !isLiquidated) {
      return count + 1;
    }
    return count;
  }, 0);

  const handleMatch = async (offer: LoanOffer, demand: LoanDemand) => {
    if (!address) {
      console.log('Wallet not connected');
      return;
    }

    if (!isCompatible(offer, demand)) {
      console.log('Offer and demand are not compatible');
      return;
    }

    try {
      await writeContract({
        address: CONTRACTS.VeniceFiCore as `0x${string}`,
        abi: VENICE_FI_ABI,
        functionName: 'matchLoan',
        args: [offer.id, demand.id],
      });
      console.log('Matching transaction submitted');
    } catch (error) {
      console.log('Error matching loan:', error);
    }
  };

  // Check if we're still loading initial data
  const isLoadingInitial = offerIdLoading || demandIdLoading;

  // Automatic refresh mechanism
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Refresh orderbook data
      console.log('Refreshing orderbook data...');
      refetchOfferId();
      refetchDemandId();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Refresh orderbook data after successful matching transaction
  useEffect(() => {
    if (isSuccess && hash) {
      console.log('Transaction successful, refreshing orderbook data...');
      refetchOfferId();
      refetchDemandId();
    }
  }, [isSuccess, hash]);

  // Calculate max amount for depth bars
  const maxOfferAmount = aggregatedOffers.length > 0 
    ? Math.max(...aggregatedOffers.map(offer => Number(formatUnits(offer.totalAmount, getTokenDecimals(offer.asset)))))
    : 0;
  
  const maxDemandAmount = aggregatedDemands.length > 0 
    ? Math.max(...aggregatedDemands.map(demand => Number(formatUnits(demand.totalAmount, getTokenDecimals(demand.asset)))))
    : 0;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-8">
      <h2 className="text-2xl font-light text-gray-900 mb-8 tracking-tight">Order Book</h2>
      
      {/* Market Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8 p-6 bg-white/40 backdrop-blur-sm rounded-lg border border-gray-200/30">
        <div className="text-center">
          <div className="text-sm font-light text-gray-500 mb-1">Total Offers</div>
          <div className="text-xl font-medium text-gray-900">{loanOffers.length}</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-light text-gray-500 mb-1">Total Asks</div>
          <div className="text-xl font-medium text-gray-900">{loanDemands.length}</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-light text-gray-500 mb-1">Active Loans</div>
          <div className="text-xl font-medium text-gray-900">{activeLoansCount}</div>
        </div>
      </div>

      {/* Compatible Matches */}
      {getCompatibleMatches().length > 0 && (
        <div className="mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 tracking-tight">Compatible Matches</h3>
            <span className="text-xs text-gray-500 font-light">{getCompatibleMatches().length} available</span>
          </div>
          <div className="space-y-2">
            {getCompatibleMatches().slice(0, 3).map((match, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50/50 rounded border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4 text-xs">
                  <span className="font-medium text-gray-900 min-w-[3rem]">
                    {formatUnits(match.offer.amount, getTokenDecimals(match.offer.asset))}
                  </span>
                  <span className="text-emerald-600 font-medium min-w-[4rem]">
                    {formatRate(match.offer.interestRate)}
                  </span>
                  <span className="text-gray-500 font-light">
                    {formatDuration(match.offer.duration)}  
                  </span>
                </div>
                <button
                  onClick={() => handleMatch(match.offer, match.demand)}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  {isPending ? 'Matching...' : 'Match Loan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loan Offers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200/50">
            <h3 className="text-lg font-light text-gray-900 tracking-tight">Loan Offers</h3>
            <span className="text-sm font-light text-gray-500">
              {aggregatedOffers.length} levels
            </span>
          </div>
          
          {/* Orderbook Header */}
          <div className="grid grid-cols-3 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <div>APR</div>
            <div className="text-right">Available</div>
            <div className="text-right">Duration</div>
          </div>
          
          {offersLoaded ? (
            aggregatedOffers.length > 0 ? (
              <div className="space-y-1">
                {aggregatedOffers.map((offer) => {
                  const amount = Number(formatUnits(offer.totalAmount, getTokenDecimals(offer.asset)));
                  const widthPercentage = maxOfferAmount > 0 ? (amount / maxOfferAmount) * 100 : 0;
                  
                  return (
                    <div 
                      key={`${offer.apr}-${offer.asset}-${offer.duration}`} 
                      className="relative group cursor-pointer hover:bg-white/50 transition-all duration-200 rounded-lg"
                    >
                      {/* Depth Bar */}
                      <div 
                        className="absolute inset-y-0 right-0 bg-blue-100/60 rounded-l-sm transition-all duration-300 group-hover:bg-blue-200/80"
                        style={{ width: `${widthPercentage}%` }}
                      />
                      
                      {/* Content */}
                      <div className="relative grid grid-cols-3 gap-4 px-4 py-1">
                        <div className="text-sm font-medium text-gray-900">
                          {formatRate(offer.apr)}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatUnits(offer.totalAmount, getTokenDecimals(offer.asset))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDuration(offer.duration)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Detailed Hover Tooltip */}
                      <div className="absolute left-0 bottom-full mb-2 w-80 bg-white/95 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-xl z-[9999] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                        <div className="p-4">
                          <div className="text-sm font-medium text-gray-900 mb-3">
                            {offer.orderCount} Orders at {formatRate(offer.apr)} APR
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {offer.offers.slice(0, 10).map((individualOffer, index) => {
                              const offerAmount = Number(formatUnits(individualOffer.amount, getTokenDecimals(individualOffer.asset)));
                              // Calculate LTV from collateral ratio (basis points)
                              const collateralRatioPercent = Number(individualOffer.collateralRatio) / 100;
                              const ltv = collateralRatioPercent > 0 ? (10000 / Number(individualOffer.collateralRatio)) * 100 : 0;
                              
                              return (
                                <div key={individualOffer.id.toString()} className="flex justify-between items-center text-xs p-2 bg-gray-50/50 rounded-lg">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {formatUnits(individualOffer.amount, getTokenDecimals(individualOffer.asset))}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                      Order #{individualOffer.id.toString()}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-gray-600">
                                      {formatRate(individualOffer.interestRate)}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                      {formatDuration(individualOffer.duration)}
                                    </div>
                                    <div className={`text-xs font-medium ${ltv > 80 ? 'text-red-600' : ltv > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                                      Max LTV: {ltv.toFixed(1)}%
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {offer.offers.length > 10 && (
                              <div className="text-center text-xs text-gray-500 py-1">
                                +{offer.offers.length - 10} more orders
                              </div>
                            )}
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200/50 text-xs text-gray-600">
                            <div className="flex justify-between mb-1">
                              <span>Total Available:</span>
                              <span className="font-medium">{formatUnits(offer.totalAmount, getTokenDecimals(offer.asset))}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-sm text-gray-500">
                No active loan offers
              </div>
            )
          ) : (
            <div className="text-center py-12 text-sm text-gray-500">
              Loading offers...
            </div>
          )}
        </div>

        {/* Borrow Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200/50">
            <h3 className="text-lg font-light text-gray-900 tracking-tight">Loan Asks</h3>
            <span className="text-sm font-light text-gray-500">
              {aggregatedDemands.length} levels
            </span>
          </div>
          
          {/* Orderbook Header */}
          <div className="grid grid-cols-3 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <div>Max APR</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Duration</div>
          </div>
          
          {demandsLoaded ? (
            aggregatedDemands.length > 0 ? (
              <div className="space-y-1">
                {aggregatedDemands.map((demand) => {
                  const amount = Number(formatUnits(demand.totalAmount, getTokenDecimals(demand.asset)));
                  const widthPercentage = maxDemandAmount > 0 ? (amount / maxDemandAmount) * 100 : 0;
                  
                  return (
                    <div 
                      key={`${demand.maxApr}-${demand.asset}-${demand.duration}-${demand.collateralAsset}`} 
                      className="relative group cursor-pointer hover:bg-white/50 transition-all duration-200 rounded-lg"
                    >
                      {/* Depth Bar */}
                      <div 
                        className="absolute inset-y-0 right-0 bg-red-100/60 rounded-l-sm transition-all duration-300 group-hover:bg-red-200/80"
                        style={{ width: `${widthPercentage}%` }}
                      />
                      
                      {/* Content */}
                      <div className="relative grid grid-cols-3 gap-4 px-4 py-1">
                        <div className="text-sm font-medium text-gray-900">
                          {formatRate(demand.maxApr)}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatUnits(demand.totalAmount, getTokenDecimals(demand.asset))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDuration(demand.duration)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Detailed Hover Tooltip */}
                      <div className="absolute left-0 bottom-full mb-2 w-80 bg-white/95 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-xl z-[9999] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                        <div className="p-4">
                          <div className="text-sm font-medium text-gray-900 mb-3">
                            {demand.orderCount} Borrow Requests at {formatRate(demand.maxApr)} Max APR
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {demand.demands.slice(0, 10).map((individualDemand, index) => {
                              return (
                                <div key={individualDemand.id.toString()} className="text-xs p-2 bg-gray-50/50 rounded-lg">
                                  <div className="flex justify-between items-start mb-1">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">
                                        {formatUnits(individualDemand.amount, getTokenDecimals(individualDemand.asset))}
                                      </div>
                                      <div className="text-gray-500 text-xs">
                                        Order #{individualDemand.id.toString()}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-gray-600">
                                        Max {formatRate(individualDemand.maxInterestRate)}
                                      </div>
                                      <div className="text-gray-500 text-xs">
                                        {formatDuration(individualDemand.duration)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200/30">
                                    <div className="text-gray-600">
                                      <span className="text-xs">Collateral:</span>
                                      <div className="font-medium">
                                        {formatUnits(individualDemand.collateralAmount, getTokenDecimals(individualDemand.collateralAsset))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {demand.demands.length > 10 && (
                              <div className="text-center text-xs text-gray-500 py-1">
                                +{demand.demands.length - 10} more requests
                              </div>
                            )}
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200/50 text-xs text-gray-600">
                            <div className="flex justify-between mb-1">
                              <span>Total Requested:</span>
                              <span className="font-medium">{formatUnits(demand.totalAmount, getTokenDecimals(demand.asset))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Collateral Asset:</span>
                              <span className="font-medium">{getTokenSymbol(demand.collateralAsset)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-sm text-gray-500">
                No active loan asks
              </div>
            )
          ) : (
            <div className="text-center py-12 text-sm text-gray-500">
              Loading requests...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
