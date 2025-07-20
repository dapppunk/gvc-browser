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
    
    // Use API key when using proxy (dev or Vercel), skip for direct API calls
    const isUsingProxy = OPENSEA_API_BASE.includes('/api/opensea');
    const useApiKey = isUsingProxy && apiKey;
    
    const headers: any = {
      'Accept': 'application/json',
    };
    
    // Add API key when using proxy
    if (useApiKey) {
      headers['X-API-KEY'] = apiKey;
    }
    
    const options = { headers };
    
    // Log API calls to help debug
    console.log('OpenSea API Configuration:', {
      base: OPENSEA_API_BASE,
      isUsingProxy,
      hasApiKey: !!apiKey,
      isDev: import.meta.env.DEV,
      isVercel: !!import.meta.env.VITE_VERCEL
    });

    try {
      // Get best listings first
      const bestUrl = `${OPENSEA_API_BASE}/listings/collection/${OPENSEA_COLLECTION_SLUG}/best?limit=100`;
      console.log('Fetching best listings from:', bestUrl);
      const bestResponse = await fetch(bestUrl, options);
      
      console.log('Best listings response:', bestResponse.status, bestResponse.statusText);
      
      if (!bestResponse.ok) {
        const errorText = await bestResponse.text();
        console.error('Failed to fetch best listings:', errorText);
      }
      
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
          console.error('Failed to fetch all listings:', response.status, response.statusText);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error details:', errorText);
          }
          break;
        }
      } while (next && pageCount < 30);

    } catch (error) {
      console.error('Error fetching OpenSea listings:', error);
    }

    return openSeaListings;
  };

  // Fetch Magic Eden listings (including Blur and other non-OpenSea marketplaces)
  const fetchMagicEdenListings = async (): Promise<Record<string, Listing>> => {
    const magicEdenListings: Record<string, Listing> = {};
    
    const apiKey = CONFIG.MAGICEDEN_API_KEY;
    
    // Use API key when using proxy (dev or Cloudflare Worker)
    const isUsingProxy = MAGICEDEN_API_BASE.includes('/api/magiceden') || MAGICEDEN_API_BASE.includes('workers.dev');
    
    const headers: any = {
      'Accept': 'application/json',
    };
    
    // Add API key if available (optional for public endpoints)
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const options = { 
      headers,
      mode: 'cors' as RequestMode,
      credentials: 'omit' as RequestCredentials
    };
    
    console.log('Magic Eden API Configuration:', {
      base: MAGICEDEN_API_BASE,
      isUsingProxy,
      hasApiKey: !!apiKey,
      isDev: import.meta.env.DEV
    });

    try {
      // Magic Eden v3 RTP API - fetch all marketplace listings
      // We'll filter out OpenSea since we already get those directly
      let url: string;
      
      if (isUsingProxy && import.meta.env.DEV) {
        // In development, use the local proxy
        url = `/api/magiceden/v3/rtp/ethereum/orders/asks/v5?collection=${COLLECTION_CONTRACT}&limit=200`;
      } else if (isUsingProxy) {
        // In production with Cloudflare proxy
        url = `${MAGICEDEN_API_BASE}/v3/rtp/ethereum/orders/asks/v5?collection=${COLLECTION_CONTRACT}&limit=200`;
      } else {
        // Direct API call
        url = `https://api-mainnet.magiceden.dev/v3/rtp/ethereum/orders/asks/v5?collection=${COLLECTION_CONTRACT}&limit=200`;
      }
      
      console.log('Fetching Magic Eden listings from:', url);
      
      const response = await fetch(url, options);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Magic Eden API response:', data);
        
        // Process the v3 API response structure
        const orders = data.orders || [];
        
        orders.forEach((order: any) => {
          try {
            // Skip OpenSea listings since we get those directly
            // Include Magic Eden, Blur, and other marketplaces
            if (order.source?.domain === 'opensea.io') {
              return;
            }
            
            // Extract token info from the order
            const tokenInfo = order.criteria?.data?.token || {};
            const tokenId = tokenInfo.tokenId || order.tokenSetId?.split(':').pop();
            
            if (!tokenId) {
              console.warn('No token ID found in order:', order);
              return;
            }
            
            // Extract price from order
            const price = order.price || {};
            const priceAmount = price.amount?.raw || price.amount || order.rawPrice;
            const currency = price.currency?.symbol || 'ETH';
            
            if (!priceAmount) {
              console.warn('No price found in order:', order);
              return;
            }
            
            // Convert price to ETH (from wei if necessary)
            let priceInEth = parseFloat(priceAmount);
            
            // Check if price is in wei (very large number)
            if (priceInEth > 1e15) {
              priceInEth = priceInEth / 1e18;
            } else if (priceInEth > 1000) {
              // Might be in gwei or other unit
              priceInEth = priceInEth / 1e9;
            }
            
            // Create listing entry with proper marketplace URL
            let listingUrl = order.source?.url || '';
            let marketplace: MarketplaceType = 'magiceden';
            
            // Set proper marketplace type based on source
            if (order.source?.domain === 'blur.io') {
              marketplace = 'magiceden'; // We'll still mark as magiceden since it comes through their API
              if (!listingUrl) {
                listingUrl = `https://blur.io/asset/${COLLECTION_CONTRACT}/${tokenId}`;
              }
            } else if (order.source?.domain === 'magiceden.us' || order.source?.domain === 'magiceden.io') {
              if (!listingUrl) {
                listingUrl = `https://magiceden.io/item-details/ethereum/${COLLECTION_CONTRACT}/${tokenId}`;
              }
            } else {
              // Other marketplaces - use Magic Eden URL as fallback
              if (!listingUrl) {
                listingUrl = `https://magiceden.io/item-details/ethereum/${COLLECTION_CONTRACT}/${tokenId}`;
              }
            }
            
            magicEdenListings[tokenId] = {
              price: priceInEth,
              currency: currency,
              url: listingUrl,
              marketplace: marketplace
            };
            
            console.log(`Added listing from ${order.source?.name || 'Unknown'}: Token ${tokenId}, Price: ${priceInEth} ${currency}`);
          } catch (err) {
            console.warn('Error parsing Magic Eden order:', order, err);
          }
        });
        
        // Check if we need to paginate
        if (data.continuation) {
          console.log('More listings available, pagination token:', data.continuation);
          // TODO: Implement pagination if needed
        }
        
        console.log(`Found ${Object.keys(magicEdenListings).length} Magic Eden listings`);
        
      } else {
        console.error('Magic Eden API error:', response.status, response.statusText);
        if (response.status === 429) {
          console.error('Rate limited by Magic Eden API');
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
