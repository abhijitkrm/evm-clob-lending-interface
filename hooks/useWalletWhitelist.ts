import { useAccount } from 'wagmi';
import { WALLET_WHITELIST } from '@/config/walletWhitelist';

/**
 * Returns true if the connected wallet is whitelisted, false otherwise.
 * Returns undefined if wallet is not connected.
 */
export function useWalletWhitelist(): { isWhitelisted: boolean | undefined; address: string | undefined } {
  const { address } = useAccount();

  if (!address) return { isWhitelisted: undefined, address: undefined };
  const isWhitelisted = WALLET_WHITELIST.some(
    (addr) => addr.toLowerCase() === address.toLowerCase()
  );
  return { isWhitelisted, address };
}
