import { useState, useEffect } from 'react';
import { CONFIG } from '../config';

// Define the structure of a single listing
export interface Listing {
  hasActivity: boolean;
  price: number;
  currency: string;
  url: string;
  listing: any; // The raw listing object from OpenSea
}

// The main state object for all listings
export interface Listings {
  [tokenId: string]: Listing;
}

// The return type for our hook
export interface UseListingsReturn {
  listings: Listings;
  loadingInitial: boolean;
  loadingMore: boolean;
  error: string | null;
}

export function useListings(): UseListingsReturn {
  const [listings, setListings] = useState<Listings>({});
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadListings = async () => {
    try {
      const apiKey = import.meta.env.VITE_OPENSEA_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_OPENSEA_API_KEY is missing. Please create a .env.local file in the react-app directory and add your key, e.g., VITE_OPENSEA_API_KEY=your_key_here");
      }

      const url = `${CONFIG.OPENSEA_API_BASE}/listings/collection/${CONFIG.COLLECTION_SLUG}/best?limit=100`;
      const response = await fetch(url, {
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    const fetchCheapest = async () => {
      setLoadingInitial(true);
      setError(null);
      try {
        const data = await loadListings();
        
        const newBestListings: Listings = {};

        if (data && data.listings) {
          data.listings.forEach((listing: any) => {
            const tokenId = String(listing.protocol_data.parameters.offer[0].identifierOrCriteria);
            const priceData = listing.price.current;
            const priceInEth = parseFloat(priceData.value) / Math.pow(10, priceData.decimals);
            const currency = priceData.currency;
            const url = `https://opensea.io/assets/ethereum/${CONFIG.COLLECTION_CONTRACT}/${tokenId}`;
            newBestListings[tokenId] = { price: priceInEth, currency, url, hasActivity: true, listing };
          });
        }
        
        setListings(newBestListings);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch cheapest listings');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchCheapest();
    // We will add the background fetcher call here later
  }, []);

  return { listings, loadingInitial, loadingMore, error };
} 