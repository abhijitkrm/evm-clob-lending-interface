import { createConfig, http } from 'wagmi';
import { arbitrumSepolia } from 'viem/chains';

export const config = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(),
  },
});

// Contract addresses on Arbitrum Sepolia
export const CONTRACTS = {
  VeniceFiCore: '0xeCfb3d0e68B81e864c5B5BC882BFbC81912Fd9e8',
  MockUSDC: '0xCeb500cC743B17e9Dfa2b4D5833a5B61aAA51E33',
  MockWETH: '0x38b505943539Ab8f0193bC29461521806452D5A8',
  MockWBTC: '0x5655111f416ecD65aCD022D0db2874a9B71B0B98'
} as const;
