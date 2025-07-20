import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { CONFIG } from '../config';
import { NFT } from '../types';
import { Badge, BadgeData, getNFTBadges } from '../utils/badges';

interface WalletContextType {
  ownedTokenIds: string[];
  ownedBadges: Set<string>;
  isLoadingOwnership: boolean;
  refreshOwnership: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  ownedTokenIds: [],
  ownedBadges: new Set(),
  isLoadingOwnership: false,
  refreshOwnership: async () => {},
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: React.ReactNode;
  nftData: NFT[];
  badgeData: BadgeData;
}


export const WalletProvider: React.FC<WalletProviderProps> = ({ children, nftData, badgeData }) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [ownedTokenIds, setOwnedTokenIds] = useState<string[]>([]);
  const [ownedBadges, setOwnedBadges] = useState<Set<string>>(new Set());
  const [isLoadingOwnership, setIsLoadingOwnership] = useState(false);

  const refreshOwnership = useCallback(async () => {
    if (!address || !isConnected) {
      setOwnedTokenIds([]);
      setOwnedBadges(new Set());
      return;
    }


    setIsLoadingOwnership(true);
    try {
      // Use Reservoir API (free tier) to get NFTs owned by the wallet
      const tokenIds: string[] = [];
      let continuation: string | undefined;
      
      console.log(`Fetching NFTs for wallet: ${address}`);
      
      // Reservoir API is free and doesn't require authentication for basic queries
      const baseUrl = import.meta.env.DEV ? '/api/reservoir' : 'https://api.reservoir.tools';
      
      do {
        const params = new URLSearchParams({
          contract: CONFIG.COLLECTION_CONTRACT,
          limit: '50',
          ...(continuation && { continuation })
        });
        
        const url = `${baseUrl}/users/${address}/tokens/v10?${params.toString()}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Reservoir API error:', response.status);
          // If Reservoir fails, try using the public client to scan recent transfers
          console.log('Falling back to scanning owned NFTs from loaded data...');
          break;
        }
        
        const data = await response.json();
        
        // Extract token IDs from the response
        if (data.tokens) {
          data.tokens.forEach((token: any) => {
            if (token.token && token.token.tokenId) {
              tokenIds.push(token.token.tokenId);
            }
          });
        }
        
        continuation = data.continuation;
      } while (continuation && tokenIds.length < 500); // Limit to 500 NFTs

      setOwnedTokenIds(tokenIds);

      // Extract badges from owned NFTs
      const badgeSet = new Set<string>();
      tokenIds.forEach(tokenId => {
        const nft = nftData.find(n => n.token_id === tokenId);
        if (nft) {
          const badges = getNFTBadges(nft, badgeData);
          badges.forEach(badge => badgeSet.add(badge.key));
        }
      });

      setOwnedBadges(badgeSet);
      console.log(`Found ${tokenIds.length} NFTs for wallet ${address}`);
    } catch (error) {
      console.error('Error loading NFT ownership:', error);
      setOwnedTokenIds([]);
      setOwnedBadges(new Set());
    } finally {
      setIsLoadingOwnership(false);
    }
  }, [address, isConnected, publicClient, nftData, badgeData]);

  // Refresh ownership when wallet connects/disconnects
  useEffect(() => {
    if (isConnected) {
      refreshOwnership();
    } else {
      setOwnedTokenIds([]);
      setOwnedBadges(new Set());
    }
  }, [isConnected, refreshOwnership]);

  return (
    <WalletContext.Provider value={{
      ownedTokenIds,
      ownedBadges,
      isLoadingOwnership,
      refreshOwnership,
    }}>
      {children}
    </WalletContext.Provider>
  );
};