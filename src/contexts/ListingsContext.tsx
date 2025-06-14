import React, { createContext, useContext, useState, useEffect } from 'react';

// OpenSea API configuration
const OPENSEA_API_BASE = 'https://api.opensea.io/api/v2';
const COLLECTION_CONTRACT = '0xb8ea78fcacef50d41375e44e6814ebba36bb33c4';
const OPENSEA_COLLECTION_SLUG = 'good-vibes-club';
const CHAIN = 'ethereum';

interface Listing {
  price: number;
  currency: string;
  url: string;
}

interface ListingsContextType {
  listings: Record<string, Listing>;
  isLoading: boolean;
  error: string | null;
  loadListings: () => Promise<void>;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export const ListingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const formattedListings: { [key: string]: Listing } = {};
      let pageCount = 0;
      let next: string | null = null;

      // First get cheapest listings
      const bestUrl = `${OPENSEA_API_BASE}/listings/collection/${OPENSEA_COLLECTION_SLUG}/best?limit=100`;
      const options = {
        headers: {
          'X-API-KEY': import.meta.env.VITE_OPENSEA_API_KEY,
          'Accept': 'application/json',
        },
      };
      const bestResponse = await fetch(bestUrl, options);
      
      if (!bestResponse.ok) {
        throw new Error(`Failed to fetch /best: ${bestResponse.status}`);
      }
      
      const bestData = await bestResponse.json();
      
      if (bestData.listings) {
        bestData.listings.forEach((listing: any) => {
          const tokenId = String(listing.protocol_data.parameters.offer[0].identifierOrCriteria);
          if (!formattedListings[tokenId]) {
            const priceData = listing.price.current;
            const priceInEth = parseFloat(priceData.value) / Math.pow(10, priceData.decimals);
            const currency = priceData.currency;
            const url = `https://opensea.io/assets/${CHAIN}/${COLLECTION_CONTRACT}/${tokenId}`;
            formattedListings[tokenId] = {
              price: priceInEth,
              currency,
              url,
            };
          }
        });
      }

      // Then get all listings
      do {
        const allUrl: string = `${OPENSEA_API_BASE}/listings/collection/${OPENSEA_COLLECTION_SLUG}/all?limit=100` + (next ? `&next=${next}` : '');
        const response: Response = await fetch(allUrl, options);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch /all: ${response.status}`);
        }
        
        const data: { listings: any[]; next: string | null } = await response.json();
        
        if (data.listings) {
          data.listings.forEach((listing: any) => {
            const tokenId = String(listing.protocol_data.parameters.offer[0].identifierOrCriteria);
            if (!formattedListings[tokenId]) {
              const priceData = listing.price.current;
              const priceInEth = parseFloat(priceData.value) / Math.pow(10, priceData.decimals);
              const currency = priceData.currency;
              const url = `https://opensea.io/assets/${CHAIN}/${COLLECTION_CONTRACT}/${tokenId}`;
              formattedListings[tokenId] = {
                price: priceInEth,
                currency,
                url,
              };
            }
          });
        }
        
        next = data.next;
        pageCount++;
        setListings({ ...formattedListings });
      } while (next && pageCount < 30);
      
      setListings(formattedListings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
    
    // Set up 60-second refresh interval
    const refreshInterval = setInterval(() => {
      loadListings();
    }, 60000); // 60 seconds

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
