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

  // Fetch Magic Eden listings
  const fetchMagicEdenListings = async (): Promise<Record<string, Listing>> => {
    const magicEdenListings: Record<string, Listing> = {};
    
    const apiKey = CONFIG.MAGICEDEN_API_KEY;
    
    // Skip Magic Eden if no API key is configured
    if (!apiKey) {
      console.log('Magic Eden API key not configured, skipping Magic Eden listings');
      return magicEdenListings;
    }
    
    // Use API key when using proxy (dev or Cloudflare Worker)
    const isUsingProxy = MAGICEDEN_API_BASE.includes('/api/magiceden') || MAGICEDEN_API_BASE.includes('workers.dev');
    const useApiKey = isUsingProxy && apiKey;
    
    const headers: any = {
      'Accept': 'application/json',
    };
    
    // Add API key when using proxy or direct API
    if (useApiKey || (!isUsingProxy && apiKey)) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const options = { 
      headers,
      mode: 'cors' as RequestMode,
      credentials: 'omit' as RequestCredentials
    };
    
    // Log API calls to help debug
    console.log('Magic Eden API Configuration:', {
      base: MAGICEDEN_API_BASE,
      isUsingProxy,
      hasApiKey: !!apiKey,
      isDev: import.meta.env.DEV
    });

    try {
      // Magic Eden API for Ethereum collections
      // Try multiple endpoints as Magic Eden's API structure can vary
      const endpoints = [
        // V3 RTP endpoint for Ethereum
        `${MAGICEDEN_API_BASE.replace('/v2', '/v3/rtp')}/ethereum/tokens/listings?collectionSymbol=good-vibes-club&limit=200`,
        // Alternative v2 endpoint with chain parameter
        `${MAGICEDEN_API_BASE}/collections/good-vibes-club/listings?chain=ethereum&limit=200`,
        // Contract-based endpoint
        `${MAGICEDEN_API_BASE.replace('/v2', '/v3/rtp')}/ethereum/tokens/listings?contract=${COLLECTION_CONTRACT}&limit=200`,
        // Token listings endpoint with filters
        `${MAGICEDEN_API_BASE}/tokens?collection=good-vibes-club&showAll=false&onSaleOnly=true&limit=200`,
        // Collection items endpoint
        `${MAGICEDEN_API_BASE}/collections/ethereum/good-vibes-club/items?limit=200`
      ];
      
      let data: any = null;
      let successfulEndpoint = null;
      
      // Try each endpoint until one works
      for (const url of endpoints) {
        console.log('Trying Magic Eden endpoint:', url);
        try {
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            data = await response.json();
            successfulEndpoint = url;
            console.log('Magic Eden API success with endpoint:', url);
            break;
          } else {
            console.log(`Magic Eden endpoint failed (${response.status}):`, url);
            if (response.status === 401) {
              console.error('Magic Eden API key may be invalid');
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log('Magic Eden endpoint timeout:', url);
          } else {
            console.log('Magic Eden endpoint error:', url, err.message);
          }
        }
      }
      
      if (data) {
        console.log('Magic Eden API response:', data);
        
        // Process the response based on the actual structure
        // Handle different possible response formats from Magic Eden
        const listings = Array.isArray(data) ? data : (data.results || data.listings || []);
        
        listings.forEach((listing: any) => {
          try {
            // Extract token ID - could be in different fields
            const tokenId = String(
              listing.tokenId || 
              listing.token_id || 
              listing.id || 
              (listing.tokenMint && listing.tokenMint.split(':').pop()) ||
              (listing.token && listing.token.tokenId)
            );
            
            // Extract price - could be in different fields and formats
            let priceValue = 0;
            if (listing.price) {
              priceValue = typeof listing.price === 'object' ? 
                parseFloat(listing.price.amount || listing.price.value) : 
                parseFloat(listing.price);
            } else if (listing.listedPrice) {
              priceValue = parseFloat(listing.listedPrice);
            } else if (listing.amount) {
              priceValue = parseFloat(listing.amount);
            }
            
            // Check if it's in wei and convert to ETH
            if (priceValue > 1000) {
              priceValue = priceValue / Math.pow(10, 18);
            }
            
            if (tokenId && !isNaN(priceValue) && priceValue > 0) {
              const url = `https://magiceden.io/item-details/ethereum/${COLLECTION_CONTRACT}/${tokenId}`;
              
              magicEdenListings[tokenId] = {
                price: priceValue,
                currency: 'ETH',
                url,
                marketplace: 'magiceden'
              };
              
              console.log(`Added Magic Eden listing: Token ${tokenId}, Price: ${priceValue} ETH`);
            }
          } catch (err) {
            console.warn('Error parsing Magic Eden listing:', listing, err);
          }
        });
        
        if (Object.keys(magicEdenListings).length === 0) {
          console.log('No valid Magic Eden listings found for this collection');
        } else {
          console.log(`Found ${Object.keys(magicEdenListings).length} Magic Eden listings`);
        }
      } else {
        console.error('Failed to fetch Magic Eden listings from any endpoint');
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
