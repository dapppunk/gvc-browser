import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'GVC Browser',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'ab0ba184122cc8c74ac00c9b82f5e863',
  chains: [mainnet], // Only Ethereum mainnet
  ssr: false,
});