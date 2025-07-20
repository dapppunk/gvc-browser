import React, { createContext, useContext, useState, useEffect } from 'react';
import { CONFIG } from '../config';

// API configuration
const OPENSEA_API_BASE = CONFIG.OPENSEA_API_BASE;
const MAGICEDEN_API_BASE = CONFIG.MAGICEDEN_API_BASE;
const COLLECTION_CONTRACT = CONFIG.COLLECTION_CONTRACT;
const OPENSEA_COLLECTION_SLUG = CONFIG.COLLECTION_SLUG;
const CHAIN = 'ethereum';

export type MarketplaceType = 'opensea' | 'magiceden';

export interface Listing {
  price: number;
  currency: string;
  url: string;
  marketplace: MarketplaceType;
  hasActivity?: boolean;
}

export interface MultiMarketplaceListing {
  opensea?: Listing;
  magiceden?: Listing;
  bestListing?: Listing; // The cheapest available listing across all marketplaces
}

interface ListingsContextType {
  listings: Record<string, MultiMarketplaceListing>;
  isLoading: boolean;
  error: string | null;
  loadListings: () => Promise<void>;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export const ListingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Record<string, MultiMarketplaceListing>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch OpenSea listings
  const fetchOpenSeaListings = async (): Promise<Record<string, Listing>> => {
    const openSeaListings: Record<string, Listing> = {};
    
    const apiKey = CONFIG.OPENSEA_API_KEY;
    if (!apiKey) {
      console.warn('OpenSea API key not configured. OpenSea listings will not be available.');
      return openSeaListings;
    }

    const options = {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    };

    try {
      // Get best listings first
      const bestUrl = `${OPENSEA_API_BASE}/listings/collection/${OPENSEA_COLLECTION_SLUG}/best?limit=100`;
      const bestResponse = await fetch(bestUrl, options);
      
      if (bestResponse.ok) {
        const bestData = await bestResponse.json();
        if (bestData.listings) {
          bestData.listings.forEach((listing: any) => {
            const tokenId = String(listing.protocol_data.parameters.offer[0].identifierOrCriteria);
            if (!openSeaListings[tokenId]) {
              // Add safety checks for price data
              if (!listing.price || !listing.price.current) {
                console.warn(`Missing price data for token ${tokenId}:`, listing);
                return; // Skip this iteration
              }
              
              const priceData = listing.price.current;
              // Check if priceData has the expected structure
              if (!priceData.value) {
                console.warn(`Invalid price data structure for token ${tokenId}:`, priceData);
                return; // Skip this iteration
              }
              
              const priceValue = parseFloat(priceData.value);
              const decimals = parseInt(priceData.decimals) || 18;
              
              // Validate price is a valid number
              if (!isNaN(priceValue) && priceValue >= 0) {
                const priceInEth = priceValue / Math.pow(10, decimals);
                const url = `https://opensea.io/assets/${CHAIN}/${COLLECTION_CONTRACT}/${tokenId}`;
                openSeaListings[tokenId] = {
                  price: priceInEth,
                  currency: priceData.currency || 'ETH',
                  url,
                  marketplace: 'opensea',
                  hasActivity: true
                };
              } else {
                console.warn(`Invalid price data for token ${tokenId}:`, priceData, 'parsed value:', priceValue, 'type:', typeof priceValue);
              }
            }
          });
        }
      }

      // Get all listings with pagination
      let next: string | null = null;
      let pageCount = 0;
      
      do {
        const allUrl = `${OPENSEA_API_BASE}/listings/collection/${OPENSEA_COLLECTION_SLUG}/all?limit=100` + (next ? `&next=${next}` : '');
        const response = await fetch(allUrl, options);
        
        if (response.ok) {
          const data = await response.json();
          if (data.listings) {
            data.listings.forEach((listing: any) => {
              const tokenId = String(listing.protocol_data.parameters.offer[0].identifierOrCriteria);
              if (!openSeaListings[tokenId]) {
                // Add safety checks for price data
                if (!listing.price || !listing.price.current) {
                  console.warn(`Missing price data for token ${tokenId} in all listings:`, listing);
                  return; // Skip this iteration
                }
                
                const priceData = listing.price.current;
                // Check if priceData has the expected structure
                if (!priceData.value) {
                  console.warn(`Invalid price data structure for token ${tokenId} in all listings:`, priceData);
                  return; // Skip this iteration
                }
                
                const priceValue = parseFloat(priceData.value);
                const decimals = parseInt(priceData.decimals) || 18;
                
                // Validate price is a valid number
                if (!isNaN(priceValue) && priceValue >= 0) {
                  const priceInEth = priceValue / Math.pow(10, decimals);
                  const url = `https://opensea.io/assets/${CHAIN}/${COLLECTION_CONTRACT}/${tokenId}`;
                  openSeaListings[tokenId] = {
                    price: priceInEth,
                    currency: priceData.currency || 'ETH',
                    url,
                    marketplace: 'opensea'
                  };
                } else {
                  console.warn(`Invalid price data for token ${tokenId} in all listings:`, priceData, 'parsed value:', priceValue, 'type:', typeof priceValue);
                }
              }
            });
          }
          next = data.next;
          pageCount++;
        } else {
          break;
        }
      } while (next && pageCount < 30);

    } catch (error) {
      console.error('Error fetching OpenSea listings:', error);
    }

    return openSeaListings;
  };

  // Fetch Magic Eden listings
  const fetchMagicEdenListings = async (): Promise<Record<string, Listing>> => {
    const magicEdenListings: Record<string, Listing> = {};
    
    const apiKey = CONFIG.MAGICEDEN_API_KEY;
    if (!apiKey) {
      console.warn('Magic Eden API key not configured. Magic Eden listings will not be available.');
      return magicEdenListings;
    }

    try {
      // Magic Eden API for Ethereum collections
      const url = `${MAGICEDEN_API_BASE}/eth/collections/${COLLECTION_CONTRACT}/listings?limit=100`;
      const options = {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      };

      const response = await fetch(url, options);
      
      if (response.ok) {
        const data = await response.json();
        if (data.listings) {
          data.listings.forEach((listing: any) => {
            const tokenId = String(listing.tokenId);
            if (!magicEdenListings[tokenId]) {
              // Add safety check for price data
              if (!listing.price && listing.price !== 0) {
                console.warn(`Missing price data for token ${tokenId} in Magic Eden:`, listing);
                return; // Skip this iteration
              }
              
              // Convert price from wei to ETH
              const priceInWei = listing.price;
              const priceValue = parseFloat(priceInWei);
              
              // Validate price is a valid number
              if (!isNaN(priceValue) && priceValue >= 0) {
                const priceInEth = priceValue / Math.pow(10, 18);
                const url = `https://magiceden.io/collections/ethereum/${COLLECTION_CONTRACT}/${tokenId}`;
                
                magicEdenListings[tokenId] = {
                  price: priceInEth,
                  currency: 'ETH',
                  url,
                  marketplace: 'magiceden'
                };
              } else {
                console.warn(`Invalid Magic Eden price for token ${tokenId}:`, priceInWei, 'parsed value:', priceValue, 'type:', typeof priceValue);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching Magic Eden listings:', error);
    }

    return magicEdenListings;
  };

  // Main function to load all listings
  const loadListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting to load listings...');
      
      // Fetch from both marketplaces concurrently
      const [openSeaListings, magicEdenListings] = await Promise.allSettled([
        fetchOpenSeaListings(),
        fetchMagicEdenListings()
      ]);

      const openSeaData = openSeaListings.status === 'fulfilled' ? openSeaListings.value : {};
      const magicEdenData = magicEdenListings.status === 'fulfilled' ? magicEdenListings.value : {};

      // Combine listings and find best prices
      const combinedListings: Record<string, MultiMarketplaceListing> = {};
      
      // Get all unique token IDs
      const allTokenIds = new Set([
        ...Object.keys(openSeaData),
        ...Object.keys(magicEdenData)
      ]);

      allTokenIds.forEach(tokenId => {
        const openSeaListing = openSeaData[tokenId];
        const magicEdenListing = magicEdenData[tokenId];
        
        // Determine the best (cheapest) listing
        let bestListing: Listing | undefined;
        if (openSeaListing && magicEdenListing) {
          bestListing = openSeaListing.price <= magicEdenListing.price ? openSeaListing : magicEdenListing;
        } else if (openSeaListing) {
          bestListing = openSeaListing;
        } else if (magicEdenListing) {
          bestListing = magicEdenListing;
        }

        combinedListings[tokenId] = {
          opensea: openSeaListing,
          magiceden: magicEdenListing,
          bestListing
        };
      });

      console.log(`Loaded listings: ${Object.keys(openSeaData).length} OpenSea, ${Object.keys(magicEdenData).length} Magic Eden`);
      setListings(combinedListings);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
      console.error('Error loading listings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
    
    // Set up 3-minute refresh interval
    const refreshInterval = setInterval(() => {
      loadListings();
    }, 180000); // 3 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <ListingsContext.Provider value={{ listings, isLoading, error, loadListings }}>
      {children}
    </ListingsContext.Provider>
  );
};

export const useListings = () => {
  const context = useContext(ListingsContext);
  if (context === undefined) {
    throw new Error('useListings must be used within a ListingsProvider');
  }
  return context;
};
