"use client";

import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { useState, useEffect, useMemo } from "react";
import { formatUnits, parseUnits } from "viem";
import { CONTRACTS } from "@/lib/wagmi";
import { ERC20_ABI, VENICE_FI_ABI } from "@/lib/contracts";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface ActiveLoan {
  id: number;
  borrower: string;
  lender: string;
  asset: string;
  amount: bigint;
  interestRate: bigint;
  startTime: bigint;
  duration: bigint; // Maps to endTime from contract
  collateralAsset: string;
  collateralAmount: bigint;
  isPaid: boolean; // Maps to isRepaid in contract (for compatibility with UI)
  isActive: boolean; // Computed field (not repaid AND not liquidated)
}

interface LoanOffer {
  id: number;
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
  id: number;
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

const MAX_ITEMS = 10;

export default function ActiveLoansView() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  // All component state declarations at top level
  const [loansLoaded, setLoansLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [isRepayDrawerOpen, setIsRepayDrawerOpen] = useState(false);
  const [currentLoanToRepay, setCurrentLoanToRepay] = useState<ActiveLoan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLoanId, setCurrentLoanId] = useState<number | null>(null);

  // Get total counts first
  const { data: totalLoans } = useReadContract({
    address: CONTRACTS.VeniceFiCore as `0x${string}`,
    abi: VENICE_FI_ABI,
    functionName: "nextLoanId",
  });

  const { data: totalOffers } = useReadContract({
    address: CONTRACTS.VeniceFiCore as `0x${string}`,
    abi: VENICE_FI_ABI,
    functionName: "nextOfferId",
  });

  const { data: totalDemands } = useReadContract({
    address: CONTRACTS.VeniceFiCore as `0x${string}`,
    abi: VENICE_FI_ABI,
    functionName: "nextDemandId",
  });

  // Check the nextLoanId to get the total loans count
  const { data: nextLoanId } = useReadContract({
    address: CONTRACTS.VeniceFiCore as `0x${string}`,
    abi: VENICE_FI_ABI,
    functionName: "nextLoanId",
  });

  console.log('Debug - Next loan ID:', nextLoanId);
  
  // Always use a fixed number of hooks (MAX_ITEMS) to avoid Rules of Hooks violations
  console.log('Debug - Will check up to', MAX_ITEMS, 'loans');
  
  // Create a fixed number of hooks for all possible loans
  const loanHooks = Array.from({ length: MAX_ITEMS }, (_, i) => {
    const loanId = BigInt(i + 1);  // Loan IDs are 1-indexed
    return useReadContract({
      address: CONTRACTS.VeniceFiCore as `0x${string}`,
      abi: VENICE_FI_ABI,
      functionName: "activeLoans",
      args: [loanId],
      query: { enabled: true }
    });
  });

  const offerHooks = Array.from({ length: MAX_ITEMS }, (_, i) => {
    const offerId = i + 1;
    return useReadContract({
      address: CONTRACTS.VeniceFiCore as `0x${string}`,
      abi: VENICE_FI_ABI,
      functionName: "loanOffers",
      args: [BigInt(offerId)],
    });
  });

  const demandHooks = Array.from({ length: MAX_ITEMS }, (_, i) => {
    const demandId = i + 1;
    return useReadContract({
      address: CONTRACTS.VeniceFiCore as `0x${string}`,
      abi: VENICE_FI_ABI,
      functionName: "loanDemands",
      args: [BigInt(demandId)],
    });
  });

  // Add debugging to each loanHook result - limiting to avoid console spam
  loanHooks.slice(0, 5).forEach((hook, i) => {
    if (hook.data) {
      console.log(`Debug - Loan hook ${i} data:`, hook.data);
    }
    if (hook.error) {
      console.log(`Debug - Loan hook ${i} error:`, hook.error);
    }
  });

  // Define a type for loan data to avoid repeated casting
  type LoanData = readonly [
    bigint,   // id
    string,   // borrower
    string,   // lender
    string,   // asset
    bigint,   // amount
    bigint,   // interestRate
    bigint,   // startTime
    bigint,   // duration
    string,   // collateralAsset
    bigint,   // collateralAmount
    boolean,  // isActive
    boolean   // isPaid
  ];



  // Effect to process loan data when available
  // Convert hook data to processed loan data with useMemo
  // This should always be called in the same order
  const loansBeforeFilter = useMemo(() => {
    // Process loan data only when hooks have data
    if (!loanHooks || loanHooks.length === 0) return [];
    
    // Only consider hooks for loans that should exist based on nextLoanId
    const validLoanCount = nextLoanId ? Math.min(Number(nextLoanId), MAX_ITEMS) : 0;
    const validLoanHooks = loanHooks.slice(0, validLoanCount);
    
    if (!loansLoaded && validLoanHooks.some(hook => hook.data)) {
      setLoansLoaded(true);
    }
    
    // Process the hook results - filter out invalid/inactive items
    return loanHooks.map((hook, i) => {
      const data = hook.data as LoanData | undefined;
      if (!data || !data[0] || data[0] === BigInt(0)) {
        console.log(`Debug - Loan ${i} skipped:`, data);
        return null;
      }

      // Get the loan ID directly from the data returned from the hook
      const loanId = data[0];
      
      // Based on the contract, a loan should be considered active if:
      // 1. It is not repaid (data[10])
      // 2. It is not liquidated (data[11])
      // 3. Both borrower and lender addresses are valid
      const isNotRepaid = data[10] === false; // isRepaid
      const isNotLiquidated = data[11] === false; // isLiquidated
      const hasValidBorrower = data[1] && data[1] !== '0x0000000000000000000000000000000000000000';
      const hasValidLender = data[2] && data[2] !== '0x0000000000000000000000000000000000000000';
      
      const isReallyActive = isNotRepaid && isNotLiquidated && hasValidBorrower && hasValidLender;
      
      // Ensure isActive is always a boolean to match our interface
      const strictlyBooleanActive: boolean = isReallyActive === true;
      
      // Map contract data to our UI structure
      return {
        id: Number(loanId),
        borrower: data[1],
        lender: data[2],
        asset: data[3],
        amount: data[4],
        interestRate: data[5],
        startTime: data[6],
        duration: data[7], // Use endTime from contract as duration
        collateralAsset: data[8],
        collateralAmount: data[9],
        isPaid: data[10] === true, // Map isRepaid to isPaid
        isActive: strictlyBooleanActive // Computed field
      };
    });
  }, [loanHooks, loansLoaded]);
  
  console.log('Debug - Loans before filter:', loansBeforeFilter);
  
  // Create properly typed loans array by filtering out nulls/undefined first, then filtering by user
  // Process the loans data into a properly filtered list of active loans
  const activeLoans = useMemo(() => {
    const nonNullLoans = (loansBeforeFilter || []).filter((loan): loan is NonNullable<typeof loan> => loan !== null && loan !== undefined);
    
    // Filter for active loans where the current user is involved
    return nonNullLoans.filter(loan => {
      // First check if loan exists and is active
      if (!loan.isActive) {
        return false;
      }
      
      // Only show loans where the current user is involved (either as borrower or lender)
      const userAddress = address?.toLowerCase() || '';
      const borrowerAddress = (loan.borrower || '').toLowerCase();
      const lenderAddress = (loan.lender || '').toLowerCase();
      
      // Skip empty/zero addresses
      if (!userAddress || userAddress === '0x0000000000000000000000000000000000000000') {
        console.log(`Debug - Skipping due to invalid user address:`, userAddress);
        return false;
      }
      
      const isUserInvolved = 
        (borrowerAddress && borrowerAddress === userAddress) || 
        (lenderAddress && lenderAddress === userAddress);
        
      console.log(`Debug - Loan ${loan.id} involvement check:`, {
        isActive: loan.isActive,
        borrowerAddress,
        lenderAddress,
        userAddress,
        isUserInvolved
      });
      
      return isUserInvolved;
    });
  }, [loansBeforeFilter, address]);

  const loanOffers: LoanOffer[] = offerHooks
    .map((hook, i) => {
      const data = hook.data as
        | readonly [
            bigint,
            string,
            string,
            bigint,
            bigint,
            bigint,
            bigint,
            boolean,
            bigint
          ]
        | undefined;
      if (!data || !data[0] || data[0] === BigInt(0)) return null;

      return {
        id: i + 1,
        lender: data[1],
        asset: data[2],
        amount: data[3],
        interestRate: data[4],
        duration: data[5],
        collateralRatio: data[6],
        isActive: data[7],
        createdAt: data[8],
      };
    })
    .filter(
      (offer): offer is LoanOffer =>
        offer !== null &&
        offer.isActive &&
        offer.lender.toLowerCase() === address?.toLowerCase()
    );

  const loanDemands: LoanDemand[] = demandHooks
    .map((hook, i) => {
      const data = hook.data as
        | readonly [
            bigint,
            string,
            string,
            bigint,
            bigint,
            bigint,
            string,
            bigint,
            boolean,
            bigint
          ]
        | undefined;
      if (!data || !data[0] || data[0] === BigInt(0)) return null;

      return {
        id: i + 1,
        borrower: data[1],
        asset: data[2],
        amount: data[3],
        maxInterestRate: data[4],
        duration: data[5],
        collateralAsset: data[6],
        collateralAmount: data[7],
        isActive: data[8],
        createdAt: data[9],
      };
    })
    .filter(
      (demand): demand is LoanDemand =>
        demand !== null &&
        demand.isActive &&
        demand.borrower.toLowerCase() === address?.toLowerCase()
    );

  // activeTab is already declared at the top level of the component
  const [confirmationLoan, setConfirmationLoan] = useState<ActiveLoan | null>(
    null
  );
  const [repayingLoanId, setRepayingLoanId] = useState<number | null>(null);
  const [approvingLoanId, setApprovingLoanId] = useState<number | null>(null);
  const [cancellingOfferId, setCancellingOfferId] = useState<number | null>(
    null
  );
  const [cancellingDemandId, setCancellingDemandId] = useState<number | null>(
    null
  );

  // Check allowance for loan repayment
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: confirmationLoan?.asset as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address as `0x${string}`, CONTRACTS.VeniceFiCore as `0x${string}`],
    query: { enabled: !!address && !!confirmationLoan },
  });

  // Auto-refresh after successful transactions
  useEffect(() => {
    if (hash && (repayingLoanId || cancellingOfferId || cancellingDemandId)) {
      const timer = setTimeout(() => {
        if (repayingLoanId) {
          setRepayingLoanId(null);
          toast.success("Loan repaid successfully!");
        } else if (cancellingOfferId) {
          setCancellingOfferId(null);
          toast.success("Offer cancelled successfully!");
        } else if (cancellingDemandId) {
          setCancellingDemandId(null);
          toast.success("Request cancelled successfully!");
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [hash, repayingLoanId, cancellingOfferId, cancellingDemandId]);

  // Handle approval confirmation and proceed to repayment
  useEffect(() => {
    if (hash && approvingLoanId && confirmationLoan) {
      const timer = setTimeout(async () => {
        try {
          toast.success("Tokens approved! Proceeding to repay loan...");
          setApprovingLoanId(null);
          await refetchAllowance(); // Refresh allowance after approval

          // Now repay the loan
          setRepayingLoanId(approvingLoanId);
          writeContract({
            address: CONTRACTS.VeniceFiCore as `0x${string}`,
            abi: VENICE_FI_ABI,
            functionName: "repayLoan",
            args: [BigInt(approvingLoanId)],
          });
          setConfirmationLoan(null);
        } catch (error) {
          console.error("Error proceeding to repayment:", error);
          setApprovingLoanId(null);
          toast.error("Failed to proceed to repayment");
        }
      }, 2000); // Wait 2 seconds for approval to be confirmed

      return () => clearTimeout(timer);
    }
  }, [
    hash,
    approvingLoanId,
    confirmationLoan,
    refetchAllowance,
    writeContract,
  ]);

  // Helper functions
  const getTokenSymbol = (address: string) => {
    return address === CONTRACTS.MockUSDC ? "USDC" : "WETH";
  };

  const getTokenDecimals = (address: string) => {
    return address === CONTRACTS.MockUSDC ? 6 : 18;
  };

  const formatRate = (rate: bigint) => {
    return `${(Number(rate) / 100).toFixed(1)}%`;
  };

  const formatDurationInDays = (durationSeconds: bigint) => {
    // Convert duration from seconds to days and round
    const days = Number(durationSeconds) / (24 * 60 * 60);
    return `${days.toFixed(1)} days`;
  };

  const calculateLoanDetails = (loan: ActiveLoan) => {
    const now = Math.floor(Date.now() / 1000);
    const startTime = Number(loan.startTime);
    // In our data, loan.duration contains the endTime from contract, not actual duration
    const endTime = Number(loan.duration); 
    const principal = loan.amount;
    const interestRate = Number(loan.interestRate);

    // Calculate time elapsed (in seconds)
    const timeElapsed = Math.min(now - startTime, endTime - startTime);
    const totalDuration = endTime - startTime;

    // Calculate interest (simple interest for demo)
    const annualRate = interestRate / 100; // Convert from basis points
    const timeRatio = timeElapsed / (365 * 24 * 3600); // Convert to years
    const interest = Number(principal) * annualRate * timeRatio;
    const interestBigInt = BigInt(Math.floor(interest));

    const totalRepayment = principal + interestBigInt;
    const protocolFeeRate = 250; // 2.5% (250 basis points)
    const protocolFee =
      (interestBigInt * BigInt(protocolFeeRate)) / BigInt(10000);

    return {
      principal,
      interest: interestBigInt,
      totalRepayment,
      protocolFee,
      timeElapsed: Math.floor(timeElapsed / (24 * 3600)), // Days
      totalDuration: Math.floor(totalDuration / (24 * 3600)), // Days
      isOverdue: now > endTime,
    };
  };

  const calculateRepaymentAmount = (loan: ActiveLoan) => {
    const principal = loan.amount;
    const interestRate = loan.interestRate; // basis points
    const duration = loan.duration;
    const interest = (principal * interestRate) / BigInt(10000);
    return principal + interest;
  };

  const handleRepayLoan = async (loanId: number) => {
    if (!address || !confirmationLoan) return;

    try {
      // Calculate total repayment amount (principal + interest)
      const repaymentAmount = calculateRepaymentAmount(confirmationLoan);

      // Check if we need approval
      const needsApproval = !allowance || allowance < repaymentAmount;

      if (needsApproval) {
        // Approve tokens first
        setApprovingLoanId(loanId);
        toast.info("Approving tokens for repayment...");
        await writeContract({
          address: confirmationLoan.asset as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACTS.VeniceFiCore, repaymentAmount],
        });
        // Don't proceed to repay yet - wait for approval confirmation
        return;
      }

      // Repay the loan
      setRepayingLoanId(loanId);
      toast.info("Repaying loan...");
      await writeContract({
        address: CONTRACTS.VeniceFiCore as `0x${string}`,
        abi: VENICE_FI_ABI,
        functionName: "repayLoan",
        args: [BigInt(loanId)],
      });
      setConfirmationLoan(null);
    } catch (error) {
      console.error("Error repaying loan:", error);
      setRepayingLoanId(null);
      setApprovingLoanId(null);
      setConfirmationLoan(null);
      toast.error("Transaction cancelled");
    }
  };

  const handleCancelOffer = async (offerId: number) => {
    if (!address) return;

    try {
      setCancellingOfferId(offerId);
      toast.info("Cancelling offer...");

      writeContract({
        address: CONTRACTS.VeniceFiCore as `0x${string}`,
        abi: VENICE_FI_ABI,
        functionName: "cancelLoanOffer",
        args: [BigInt(offerId)],
      });
    } catch (error) {
      console.error("Error cancelling offer:", error);
      toast.error("Failed to cancel offer");
      setCancellingOfferId(null);
    }
  };

  const handleCancelDemand = async (demandId: number) => {
    if (!address) return;

    try {
      setCancellingDemandId(demandId);
      toast.info("Cancelling demand...");

      writeContract({
        address: CONTRACTS.VeniceFiCore as `0x${string}`,
        abi: VENICE_FI_ABI,
        functionName: "cancelLoanDemand",
        args: [BigInt(demandId)],
      });
    } catch (error) {
      console.error("Error cancelling demand:", error);
      toast.error("Failed to cancel demand");
      setCancellingDemandId(null);
    }
  };

  const showConfirmation = (loan: ActiveLoan) => {
    setConfirmationLoan(loan);
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 p-4">
      <Tabs
        defaultValue="active"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex space-x-6 py-1">
          <button
            onClick={() => setActiveTab("active")}
            className={`text-sm font-medium ${
              activeTab === "active"
                ? "text-black border-b-2 border-black pb-1"
                : "text-gray-500 pb-1"
            } hover:text-black transition-colors`}
          >
            Active Loans {activeLoans.length > 0 && `(${activeLoans.length})`}
          </button>
          <button
            onClick={() => setActiveTab("offers")}
            className={`text-sm font-medium ${
              activeTab === "offers"
                ? "text-black border-b-2 border-black pb-1"
                : "text-gray-500 pb-1"
            } hover:text-black transition-colors`}
          >
            My Offers {loanOffers.length > 0 && `(${loanOffers.length})`}
          </button>
          <button
            onClick={() => setActiveTab("demands")}
            className={`text-sm font-medium ${
              activeTab === "demands"
                ? "text-black border-b-2 border-black pb-1"
                : "text-gray-500 pb-1"
            } hover:text-black transition-colors`}
          >
            My Requests {loanDemands.length > 0 && `(${loanDemands.length})`}
          </button>
        </div>
        <Separator className="mb-4" />

        <TabsContent value="active" className="mt-4">
          {loansLoaded && activeLoans.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 text-[10px] font-medium text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-200/50">
                <div>Lender</div>
                <div>Borrower</div>
                <div>Amount</div>
                <div>Interest Rate</div>
                <div>Action</div>
              </div>
              {activeLoans.map((loan) => {
                const tokenSymbol = getTokenSymbol(loan.asset);
                const tokenDecimals = getTokenDecimals(loan.asset);
                const isUserBorrower =
                  address?.toLowerCase() === loan.borrower.toLowerCase();
                const isUserLender =
                  address?.toLowerCase() === loan.lender.toLowerCase();
                const isRepaying = repayingLoanId === loan.id;

                return (
                  <div
                    key={loan.id.toString()}
                    className="grid grid-cols-5 gap-4 py-3 text-xs border-b border-gray-100/50 last:border-b-0 transition-colors"
                  >
                    <div className="text-gray-600 font-mono">
                      {loan.lender.slice(0, 6)}...{loan.lender.slice(-4)}
                    </div>
                    <div className="text-gray-600 font-mono">
                      {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
                    </div>
                    <div className="font-medium">
                      {formatUnits(loan.amount, tokenDecimals)} {tokenSymbol}
                    </div>
                    <div>{formatRate(loan.interestRate)}</div>
                    <div>
                      {isUserBorrower ? (
                        <button
                          onClick={() => showConfirmation(loan)}
                          disabled={isRepaying || approvingLoanId === loan.id}
                          className="text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {approvingLoanId === loan.id
                            ? "Approving..."
                            : isRepaying
                            ? "Repaying..."
                            : "Repay"}
                        </button>
                      ) : isUserLender ? (
                        <span className="text-blue-600 font-medium">
                          Lender
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm font-light mb-2 tracking-tight">
                No active loans
              </div>
              <div className="text-xs font-light tracking-wide">
                Create loan offers and borrow requests to get started!
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="offers" className="mt-4">
          {loanOffers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm font-light mb-2 tracking-tight">
                No offers
              </div>
              <div className="text-xs font-light tracking-wide">
                Create loan offers to get started!
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 text-[10px] font-medium text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-200/50">
                <div>Asset</div>
                <div>Amount</div>
                <div>Interest Rate</div>
                <div>Duration</div>
                <div>Action</div>
              </div>
              {loanOffers.map((offer) => {
                const tokenSymbol = getTokenSymbol(offer.asset);
                const tokenDecimals = getTokenDecimals(offer.asset);

                return (
                  <div
                    key={offer.id.toString()}
                    className="grid grid-cols-5 gap-4 py-3 text-xs border-b border-gray-100/50 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium">{tokenSymbol}</div>
                    <div className="font-medium">
                      {formatUnits(offer.amount, tokenDecimals)} {tokenSymbol}
                    </div>
                    <div>{formatRate(offer.interestRate)}</div>
                    <div>
                      {Math.floor(Number(offer.duration) / (24 * 3600))}d
                    </div>
                    <div>
                      <button
                        onClick={() => handleCancelOffer(offer.id)}
                        disabled={cancellingOfferId === offer.id}
                        className="text-red-600 hover:text-red-700 disabled:text-gray-400 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {cancellingOfferId === offer.id
                          ? "Cancelling..."
                          : "Cancel"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="demands" className="mt-4">
          {loanDemands.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm font-light mb-2 tracking-tight">
                No requests
              </div>
              <div className="text-xs font-light tracking-wide">
                Create loan requests to get started!
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 text-[10px] font-medium text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-200/50">
                <div>Asset</div>
                <div>Amount</div>
                <div>Max Interest</div>
                <div>Duration</div>
                <div>Action</div>
              </div>
              {loanDemands.map((demand) => {
                const tokenSymbol = getTokenSymbol(demand.asset);
                const tokenDecimals = getTokenDecimals(demand.asset);

                return (
                  <div
                    key={demand.id.toString()}
                    className="grid grid-cols-5 gap-4 py-3 text-xs border-b border-gray-100/50 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium">{tokenSymbol}</div>
                    <div className="font-medium">
                      {formatUnits(demand.amount, tokenDecimals)} {tokenSymbol}
                    </div>
                    <div>{formatRate(demand.maxInterestRate)}</div>
                    <div>
                      {Math.floor(Number(demand.duration) / (24 * 3600))}d
                    </div>
                    <div>
                      <button
                        onClick={() => handleCancelDemand(demand.id)}
                        disabled={cancellingDemandId === demand.id}
                        className="text-red-600 hover:text-red-700 disabled:text-gray-400 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {cancellingDemandId === demand.id
                          ? "Cancelling..."
                          : "Cancel"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Loan Repayment Drawer */}
      <Drawer
        open={!!confirmationLoan}
        onOpenChange={(open) => !open && setConfirmationLoan(null)}
      >
        <DrawerContent className="max-w-md mx-auto">
          <DrawerHeader className="text-center">
            <DrawerTitle>Confirm Loan Repayment</DrawerTitle>
            <DrawerDescription>
              Review the loan details and confirm repayment
            </DrawerDescription>
          </DrawerHeader>

          {confirmationLoan &&
            (() => {
              const loan = confirmationLoan;
              const details = calculateLoanDetails(loan);
              const tokenSymbol = getTokenSymbol(loan.asset);
              const tokenDecimals = getTokenDecimals(loan.asset);

              return (
                <div className="px-4 pb-4 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Loan ID:
                      </span>
                      <span className="font-medium text-gray-900">
                        #{loan.id.toString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        Principal Amount:
                      </span>
                      <span className="font-medium text-gray-900 text-sm">
                        {formatUnits(details.principal, tokenDecimals)}{" "}
                        {tokenSymbol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        Interest Accrued:
                      </span>
                      <span className="font-medium text-amber-600 text-sm">
                        {formatUnits(details.interest, tokenDecimals)}{" "}
                        {tokenSymbol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        Protocol Fee:
                      </span>
                      <span className="font-medium text-gray-500 text-sm">
                        {formatUnits(details.protocolFee, tokenDecimals)}{" "}
                        {tokenSymbol}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                      <span className="text-gray-900 font-medium">
                        Total Repayment:
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatUnits(details.totalRepayment, tokenDecimals)}{" "}
                        {tokenSymbol}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

          <DrawerFooter className="pt-4">
            <Button
              disabled={Boolean(confirmationLoan &&
                (repayingLoanId === confirmationLoan.id ||
                  approvingLoanId === confirmationLoan.id))}
              onClick={() => confirmationLoan && handleRepayLoan(confirmationLoan.id)}
              className="w-full relative"
            >
              {confirmationLoan && approvingLoanId === confirmationLoan.id
                ? "Approving..."
                : confirmationLoan && repayingLoanId === confirmationLoan.id
                ? "Repaying..."
                : "Confirm Repayment"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
