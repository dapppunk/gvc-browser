// ALTERNATIVE IMPLEMENTATION: Fetch all marketplace listings through Magic Eden
// This would replace the current fetchMagicEdenListings function if you want
// to show listings from Blur, X2Y2, and other marketplaces

const fetchAllMarketplaceListings = async (): Promise<Record<string, { opensea?: Listing, blur?: Listing, x2y2?: Listing }>> => {
  const allListings: Record<string, { opensea?: Listing, blur?: Listing, x2y2?: Listing }> = {};
  
  const apiKey = CONFIG.MAGICEDEN_API_KEY;
  const headers: any = {
    'Accept': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  
  const options = { 
    headers,
    mode: 'cors' as RequestMode,
    credentials: 'omit' as RequestCredentials
  };

  try {
    // Fetch from Magic Eden aggregator API
    const baseUrl = isUsingProxy ? MAGICEDEN_API_BASE : 'https://api-mainnet.magiceden.dev';
    const url = `${baseUrl}/v3/rtp/ethereum/orders/asks/v5?collection=${COLLECTION_CONTRACT}&limit=200`;
    
    const response = await fetch(url, options);
    
    if (response.ok) {
      const data = await response.json();
      const orders = data.orders || [];
      
      orders.forEach((order: any) => {
        try {
          const tokenInfo = order.criteria?.data?.token || {};
          const tokenId = tokenInfo.tokenId || order.tokenSetId?.split(':').pop();
          
          if (!tokenId) return;
          
          const price = order.price || {};
          const priceAmount = price.amount?.decimal || 0;
          const currency = price.currency?.symbol || 'ETH';
          const source = order.source?.domain || 'unknown';
          
          // Create listing object
          const listing: Listing = {
            price: priceAmount,
            currency: currency,
            url: order.source?.url || '#',
            marketplace: source as MarketplaceType
          };
          
          // Group by marketplace
          if (!allListings[tokenId]) {
            allListings[tokenId] = {};
          }
          
          switch (source) {
            case 'opensea.io':
              allListings[tokenId].opensea = listing;
              break;
            case 'blur.io':
              allListings[tokenId].blur = listing;
              break;
            case 'x2y2.io':
              allListings[tokenId].x2y2 = listing;
              break;
          }
        } catch (err) {
          console.warn('Error parsing order:', order, err);
        }
      });
      
      console.log(`Found listings from: OpenSea (${Object.values(allListings).filter(l => l.opensea).length}), Blur (${Object.values(allListings).filter(l => l.blur).length}), X2Y2 (${Object.values(allListings).filter(l => l.x2y2).length})`);
    }
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
  }

  return allListings;
};

// You would also need to update the MarketplaceType to include blur and x2y2:
// export type MarketplaceType = 'opensea' | 'magiceden' | 'blur' | 'x2y2';

// And update the UI to handle multiple marketplace options