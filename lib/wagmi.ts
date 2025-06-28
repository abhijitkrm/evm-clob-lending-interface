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
  VeniceFiCore: '0x79dF243347f2E34184bdCEB6cF6fc026A3138650',
  MockUSDC: '0x9E0233C14393E1BBcf8FDCF67E9D703925c1F5A4',
  MockWETH: '0xFD56fcfb59FED21A7E7117A8AD65ec195FF1637d',
} as const;
