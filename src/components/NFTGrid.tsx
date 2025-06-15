import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFilters } from '../contexts/FiltersContext';
import { useListings } from '../contexts/ListingsContext';
import NFTCard from './NFTCard';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Skeleton from '@mui/material/Skeleton';
import { Mosaic } from 'react-loading-indicators';
import './NFTGrid.css';

interface Listing {
  price: number;
  currency: string;
  url: string;
}

interface NFT {
  id: string;
  name: string;
  image: string;
  badge1?: string;
  badge2?: string;
  badge3?: string;
  badge4?: string;
  badge5?: string;
  traits: {
    [key: string]: string;
  };
}

function ipfsToHttp(url: string): string {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return url;
}

const INITIAL_LOAD_SIZE = 50; // Load first 50 items immediately for fast initial render
const CHUNK_SIZE = 25; // Load additional items in chunks of 25
const PRELOAD_BUFFER = 20; // Keep 20 NFTs ahead of current scroll position
const LOAD_TRIGGER_DISTANCE = 600; // Start loading when 600px from the end of loaded content
const SKELETON_COUNT = 8;

const NFTGrid: React.FC = () => {
  const { filters, applyFilters, applySorting, setFilteredCount } = useFilters();
  const { listings, error: listingsError, loadListings, isLoading: listingsLoading } = useListings();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_SIZE);
  const [preloadedCount, setPreloadedCount] = useState(INITIAL_LOAD_SIZE); // Start with initial load size
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const prevFilterString = useRef<string>('');

  useEffect(() => {
    const loadNFTs = async () => {
      try {
        const response = await fetch('/data/gvc_data.csv');
        const csvText = await response.text();
        const rows = csvText.split('\n').slice(1); // Skip header row
        
        const nftData = rows.map(row => {
          const columns = row.split(',');
          
          // Use image_original_url (index 20)
          let image = columns[20] ? ipfsToHttp(columns[20]) : '';

          // Return data in format expected by FiltersContext
          return {
            // Basic NFT properties
            id: columns[0],
            name: `GVC #${columns[0]}`,
            image,
            token_id: columns[0],
            tokenId: columns[0], // alias for search
            
            // Trait properties (matching FiltersContext format)
            gender: columns[1] || '',
            background: columns[2] || '',
            background_type: columns[3] || '',
            body: columns[4] || '',
            body_type: columns[5] || '',
            body_style: columns[6] || '',
            body_color: columns[7] || '',
            face: columns[8] || '',
            face_type: columns[9] || '',
            face_style: columns[10] || '',
            face_color: columns[11] || '',
            hair: columns[12] || '',
            hair_type: columns[13] || '',
            hair_style: columns[14] || '',
            hair_color: columns[15] || '',
            type: columns[16] || '',
            type_type: columns[17] || '',
            type_color: columns[18] || '',
            color_group: columns[22] || '',
            color_count: columns[23] || '',
            
            // Badge properties (columns 24-28)
            badge1: columns[24] || '',
            badge2: columns[25] || '',
            badge3: columns[26] || '',
            badge4: columns[27] || '',
            badge5: columns[28] || '',
            
            // Legacy traits object for compatibility
            traits: {
              gender: columns[1] || '',
              background: columns[2] || '',
              background_type: columns[3] || '',
              body: columns[4] || '',
              body_type: columns[5] || '',
              body_style: columns[6] || '',
              body_color: columns[7] || '',
              face: columns[8] || '',
              face_type: columns[9] || '',
              face_style: columns[10] || '',
              face_color: columns[11] || '',
              hair: columns[12] || '',
              hair_type: columns[13] || '',
              hair_style: columns[14] || '',
              hair_color: columns[15] || '',
              type: columns[16] || '',
              type_type: columns[17] || '',
              type_color: columns[18] || '',
              color_group: columns[22] || '',
              color_count: columns[23] || ''
            }
          };
        }).filter(nft => nft.token_id && nft.gender); // Only valid NFTs

        setNfts(nftData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    loadNFTs();
  }, []);

  // Separate effect to reset scroll position only when filters change (not listings)
  useEffect(() => {
    // Only reset if we have NFTs loaded and filters have actually changed
    if (!loading && nfts.length > 0) {
      const filterString = JSON.stringify(filters);
      
      if (prevFilterString.current !== filterString) {
        setVisibleCount(PAGE_SIZE);
        setPreloadedCount(PAGE_SIZE);
        prevFilterString.current = filterString;
      }
    }
  }, [filters, loading, nfts.length]);

  // Effect for filtering and sorting (runs when filters or nfts change)
  useEffect(() => {
    if (loading) return; // Don't filter until NFTs are loaded
    
    // Add listing information to NFTs BEFORE filtering
    const nftsWithListings = nfts.map(nft => ({
      ...nft,
      listing: listings[nft.id]
    }));
    
    // Use FiltersContext's applyFilters method
    let filtered = applyFilters(nftsWithListings);
    
    // Apply sorting using the FiltersContext's applySorting method
    filtered = applySorting(filtered, listings);
    
    setFilteredNfts(filtered);
    setFilteredCount(filtered.length); // Update filtered count in context
  }, [filters, nfts, listings, loading, applyFilters, applySorting]);

  // Create a computed version of NFTs with current listings for rendering
  const nftsWithCurrentListings = filteredNfts.map(nft => ({
    ...nft,
    listing: listings[nft.id]
  }));

  // Simplified scroll handler that works with sorted NFTs
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || visibleCount >= nftsWithCurrentListings.length) {
        return;
      }

      const container = document.querySelector('.content-area');
      if (!container) {
        return;
      }

      const scrollPosition = container.scrollTop + container.clientHeight;
      const scrollHeight = container.scrollHeight;
      const triggerDistance = 400;
      const shouldLoadMore = scrollPosition >= scrollHeight - triggerDistance;
      
      if (shouldLoadMore) {
        setIsLoadingMore(true);
        
        // Use requestAnimationFrame to batch state updates
        requestAnimationFrame(() => {
          const nextVisible = Math.min(visibleCount + CHUNK_SIZE, nftsWithCurrentListings.length);
          setVisibleCount(nextVisible);
          setPreloadedCount(nextVisible);
          
          // Use setTimeout to ensure state updates are processed before resetting loading state
          setTimeout(() => {
            setIsLoadingMore(false);
          }, 100);
        });
      }
    };

    const container = document.querySelector('.content-area');
    if (container) {
      // Use passive scroll listener for better performance
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [visibleCount, nftsWithCurrentListings.length, isLoadingMore]);

  // Separate effect to handle loading state cleanup
  useEffect(() => {
    if (visibleCount >= nftsWithCurrentListings.length) {
      setIsLoadingMore(false);
    }
  }, [visibleCount, nftsWithCurrentListings.length]);

  // Handle image load callback (no longer needed for batch loading, but keeping for compatibility)
  const handleImageLoad = useCallback((nftId: string) => {
    // NFTCard handles its own loading state now
  }, []);

  // Show initial loading skeletons only when first loading
  if (loading) {
    return (
      <div className="nft-grid">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <Box key={i} sx={{ width: '100%' }}>
            <Skeleton variant="rectangular" sx={{ width: '100%', pt: '100%', borderRadius: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Skeleton variant="text" sx={{ width: '80%', height: 32, bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Skeleton variant="text" sx={{ width: '60%', height: 24, bgcolor: 'rgba(255,255,255,0.08)' }} />
          </Box>
        ))}
      </div>
    );
  }

  const handleCardClick = (nft: NFT) => {
    setSelectedNFT(nft);
  };

  const handleClose = () => {
    setSelectedNFT(null);
  };

  const selectedListing = selectedNFT ? listings[selectedNFT.id] as Listing | undefined : undefined;

  return (
    <>
      {listingsError && (
        <div style={{ 
          background: 'rgba(255, 0, 0, 0.1)', 
          border: '1px solid rgba(255, 0, 0, 0.3)', 
          borderRadius: '8px', 
          padding: '16px', 
          margin: '16px 0', 
          color: '#ff6b6b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span><strong>OpenSea API Error:</strong> {listingsError}</span>
          <Button 
            onClick={loadListings} 
            disabled={listingsLoading}
            variant="outlined" 
            size="small"
            sx={{ color: '#ff6b6b', borderColor: '#ff6b6b' }}
          >
            {listingsLoading ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      )}
      {loading && (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center'
        }}>
          <Typography 
            variant="h3" 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(45deg, #66b3ff, #4dabf7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Impending Vibes
          </Typography>
          <Mosaic color="#66b3ff" size="large" text="" textColor="" />
        </Box>
      )}
      {nftsWithCurrentListings.length === 0 && !loading && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8, 
          color: 'var(--text-secondary, #aaa)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            No NFTs found
          </Typography>
          <Typography variant="body2">
            Try adjusting your filters or search term
          </Typography>
        </Box>
      )}
      <div className="nft-grid">
        {nftsWithCurrentListings.slice(0, visibleCount).map(nft => (
          <NFTCard
            key={nft.id}
            nft={nft}
            listing={listings[nft.id] as Listing | undefined}
            onClick={() => handleCardClick(nft)}
            onImageLoad={handleImageLoad}
          />
        ))}
        
        
        {/* Only show loading indicator if actually loading AND there's more content */}
        {isLoadingMore && visibleCount < filteredNfts.length && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            py: 1,
            height: '40px' // Fixed height to prevent layout shift
          }}>
            <Mosaic color="#66b3ff" size="small" text="" textColor="" />
          </Box>
        )}
      </div>
      <Dialog open={!!selectedNFT} onClose={handleClose} maxWidth="md" fullWidth>
        {selectedNFT && (
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            background: 'var(--card-bg, #2a2a2a)',
            color: 'var(--text-primary, #fff)',
            p: { xs: 2, md: 4 },
            alignItems: 'flex-start',
            gap: 4,
          }}>
            {/* Image section */}
            <Box sx={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: { xs: '100%', md: 340 } }}>
              <img
                src={selectedNFT.image}
                alt={selectedNFT.name}
                style={{ width: '100%', maxWidth: 320, borderRadius: 16, background: '#181a20', marginBottom: 24 }}
              />
            </Box>
            {/* Details section */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{selectedNFT.name}</Typography>
              {selectedListing && (
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  {selectedListing.currency} {selectedListing.price}
                </Typography>
              )}
              {selectedListing && (
                <Button
                  href={selectedListing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<OpenInNewIcon />}
                  sx={{ color: '#66b3ff', textTransform: 'none', fontWeight: 600, mb: 3 }}
                >
                  View on OpenSea
                </Button>
              )}
              {/* Key traits vertical stack */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                {[
                  { key: 'gender', label: 'Gender' },
                  { key: 'background', label: 'Background' },
                  { key: 'body', label: 'Body' },
                  { key: 'face', label: 'Face' },
                  { key: 'hair', label: 'Hair' },
                  { key: 'type', label: 'Type' },
                  { key: 'rarity_score', label: 'Rarity Score' },
                ].map(({ key, label }) => {
                  let value = selectedNFT.traits[key];
                  if (key === 'rarity_score' && !value && selectedNFT.traits['Rarity Score']) {
                    value = selectedNFT.traits['Rarity Score'];
                  }
                  if (!value) return null;
                  return (
                    <Box key={key} sx={{ background: 'rgba(255,255,255,0.04)', borderRadius: 2, p: 2, mb: 0, boxShadow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--text-secondary, #aaa)' }}>{label}</Typography>
                      <Typography variant="body1" sx={{ color: 'var(--text-primary, #fff)', fontWeight: 500 }}>{value}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>
    </>
  );
};

export default NFTGrid; 