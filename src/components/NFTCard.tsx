import React, { useState, useRef, useEffect, useCallback } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Mosaic } from 'react-loading-indicators';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image-more';
import { useEthPrice } from '../hooks/useEthPrice';
import { useTheme } from '../contexts/ThemeContext';
import BadgesList from './BadgesList';
import { loadBadgeData, getNFTBadges, BadgeData } from '../utils/badges';
import { calculateBPR, formatBPR, getBPRColor, getBPRRating } from '../utils/bpr';
import { loadGridImage, type ImageLoadResult } from '../utils/imageUtils';
import type { Listing, MarketplaceType } from '../contexts/ListingsContext';

// Using Listing interface from ListingsContext

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
  listing?: Listing;
}

interface Props {
  nft: NFT;
  listing?: Listing;
  onClick?: () => void;
  onImageLoad?: (nftId: string) => void;
}

const NFTCard: React.FC<Props> = ({ nft, listing, onClick, onImageLoad }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [badgeData, setBadgeData] = useState<BadgeData>({});
  const [isVisible, setIsVisible] = useState(false);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string>('');
  const [imageResult, setImageResult] = useState<ImageLoadResult | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const ethPrice = useEthPrice();
  const { mode } = useTheme();

  // Helper function to get marketplace logo and name
  const getMarketplaceInfo = (marketplace: MarketplaceType) => {
    switch (marketplace) {
      case 'opensea':
        return {
          logo: `${import.meta.env.BASE_URL}images/opensea-logo.svg`,
          name: 'OpenSea',
          color: '#2081e2'
        };
      case 'magiceden':
        return {
          logo: `${import.meta.env.BASE_URL}images/magiceden-logo.svg`,
          name: 'Magic Eden',
          color: '#ff0075' // Updated to match the gradient start color
        };
      default:
        return {
          logo: `${import.meta.env.BASE_URL}images/opensea-logo.svg`,
          name: 'OpenSea',
          color: '#2081e2'
        };
    }
  };

  useEffect(() => {
    loadBadgeData().then(setBadgeData);
  }, []);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // NFT data extraction
  const nftBadges = getNFTBadges(nft, badgeData);
  const bprData = calculateBPR(nftBadges, listing?.price || 0);
  const bprColor = getBPRColor(bprData.score, !!listing);
  const bprRating = getBPRRating(bprData.score, !!listing);

  // Optimized image loading: WebP first, IPFS fallback
  const loadOptimizedImage = useCallback(async () => {
    if (!nft.id) return;

    try {
      const result = await loadGridImage(nft.id, nft.image);
      
      if (result.success) {
        setLoadedImageUrl(result.url);
        setImageResult(result);
        setImageLoading(false);
        setImgError(false);
        onImageLoad?.(nft.id);
      } else {
        // All loading attempts failed
        setImgError(true);
        setImageLoading(false);
        onImageLoad?.(nft.id);
      }
    } catch (error) {
      console.error('Image loading error:', error);
      setImgError(true);
      setImageLoading(false);
      onImageLoad?.(nft.id);
    }
  }, [nft.id, nft.image, onImageLoad]);

  // Start loading when visible
  useEffect(() => {
    if (isVisible && !loadedImageUrl && !imgError && imageLoading) {
      loadOptimizedImage();
    }
  }, [isVisible, loadedImageUrl, imgError, imageLoading, loadOptimizedImage]);

  // Copy card as image to clipboard with multiple fallback methods
  const copyCardToClipboard = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!cardRef.current || isCopying) return;
    
    setIsCopying(true);
    
    try {
      // Hide the copy button during capture to avoid including it
      setIsHovered(false);
      
      // Wait for any transitions and image loading to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get theme-appropriate background color
      const backgroundColor = mode === 'light' ? '#ffffff' : '#2a2a2a';
      
      let blob: Blob | null = null;
      
      // Method 1: Try dom-to-image-more first (often better for complex layouts)
      try {
        console.log('Trying dom-to-image-more...');
        const dataUrl = await domtoimage.toPng(cardRef.current, {
          quality: 0.95,
          bgcolor: backgroundColor,
          height: cardRef.current.offsetHeight,
          width: cardRef.current.offsetWidth,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });
        
        // Convert data URL to blob
        const response = await fetch(dataUrl);
        blob = await response.blob();
        console.log('dom-to-image-more succeeded');
      } catch (domToImageError) {
        console.warn('dom-to-image-more failed:', domToImageError);
        
        // Method 2: Fallback to html2canvas with improved settings
        try {
          console.log('Trying html2canvas...');
          
          const canvas = await html2canvas(cardRef.current, {
            backgroundColor: backgroundColor,
            scale: 2,
            useCORS: false, // Disable CORS for local rendering
            allowTaint: true, // Allow tainted canvas
            foreignObjectRendering: true,
            logging: false,
            width: cardRef.current.offsetWidth,
            height: cardRef.current.offsetHeight,
            onclone: (clonedDoc, element) => {
              // Fix image sources and ensure styles are applied
              const clonedImages = element.querySelectorAll('img');
              const originalImages = cardRef.current!.querySelectorAll('img');
              
              clonedImages.forEach((clonedImg, index) => {
                const originalImg = originalImages[index];
                if (originalImg && originalImg.src) {
                  clonedImg.src = originalImg.src;
                  // Force image dimensions
                  clonedImg.style.width = originalImg.offsetWidth + 'px';
                  clonedImg.style.height = originalImg.offsetHeight + 'px';
                  clonedImg.style.objectFit = 'cover';
                }
              });
              
              // Apply essential styles to text elements
              const textElements = element.querySelectorAll('*');
              textElements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                const originalEl = cardRef.current!.querySelector(`${el.tagName}:nth-of-type(${Array.from(el.parentElement?.children || []).indexOf(el) + 1})`);
                if (originalEl) {
                  const computedStyle = window.getComputedStyle(originalEl);
                  htmlEl.style.color = computedStyle.color;
                  htmlEl.style.backgroundColor = computedStyle.backgroundColor;
                  htmlEl.style.fontSize = computedStyle.fontSize;
                  htmlEl.style.fontWeight = computedStyle.fontWeight;
                  htmlEl.style.fontFamily = computedStyle.fontFamily;
                }
              });
            }
          });
          
          // Convert canvas to blob
          await new Promise<void>((resolve, reject) => {
            canvas.toBlob((canvasBlob) => {
              if (canvasBlob) {
                blob = canvasBlob;
                console.log('html2canvas succeeded');
                resolve();
              } else {
                reject(new Error('Failed to create canvas blob'));
              }
            }, 'image/png', 0.95);
          });
          
        } catch (html2canvasError) {
          console.error('html2canvas also failed:', html2canvasError);
          throw new Error('All capture methods failed');
        }
      }
      
      // Restore hover state
      setIsHovered(true);
      
      if (!blob) {
        throw new Error('No image data generated');
      }
      
      try {
        // Copy to clipboard using modern Clipboard API
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nft-${nft.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Failed to capture card:', error);
      // Restore hover state on error
      setIsHovered(true);
    } finally {
      setIsCopying(false);
    }
  }, [nft.id, isCopying, mode]);

  // Handle mobile tap detection
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // On mobile, first tap shows copy button, second tap triggers onClick
    if (window.innerWidth <= 768) {
      if (!isHovered) {
        e.stopPropagation();
        setIsHovered(true);
        // Hide copy button after 3 seconds
        setTimeout(() => setIsHovered(false), 3000);
        return;
      }
    }
    onClick?.();
  }, [isHovered, onClick]);

  return (
    <>
      <Card
        ref={cardRef}
        sx={{
          background: 'var(--card-bg, #2a2a2a)',
          color: 'var(--text-primary, #fff)',
          borderRadius: 0,
          boxShadow: 3,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s',
          '&:hover': { boxShadow: 8 },
        }}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#181a20', flex: '0 0 auto' }}>
        {/* Show loading animation when image is loading or not yet visible */}
        {(imageLoading || (!loadedImageUrl && !imgError)) && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#181a20' }}>
            <Mosaic color="#f74d71" size="medium" text="" textColor="" />
          </Box>
        )}
        
        {/* Show image when loaded successfully */}
        {!imgError && loadedImageUrl && (
          <>
            <CardMedia
              component="img"
              ref={imgRef}
              src={loadedImageUrl}
              alt={nft.name}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
                willChange: 'opacity'
              }}
            />
            
          </>
        )}
        
        {/* Show error message only when all gateways failed */}
        {imgError && !loadedImageUrl && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#181a20', color: '#fff' }}>
            Image not available
          </Box>
        )}
        
        {/* Copy button - appears on hover/tap */}
        {isHovered && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out',
            }}
          >
            <Tooltip title="Copy card as image" placement="left">
              <IconButton
                onClick={copyCardToClipboard}
                disabled={isCopying}
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  width: 36,
                  height: 36,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: '#f74d71',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                size="small"
              >
                {isCopying ? (
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      
      {/* Badge Section */}
      {nftBadges.length > 0 && (
        <Box sx={{
          px: 2,
          py: 1,
          borderTop: nftBadges.length > 0 ? '1px solid var(--border-color, #404040)' : 'none',
          backgroundColor: 'var(--card-bg, #2a2a2a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <BadgesList 
            badges={nftBadges} 
            size="large" 
            maxVisible={5}
          />
        </Box>
      )}
      
      <CardContent sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderTop: '1px solid var(--border-color, #404040)',
        width: '100%',
        '&:last-child': { pb: 2 } // Remove extra padding from last child
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
          {listing ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                  {!isNaN(listing.price) && isFinite(listing.price) ? listing.price.toFixed(3) : 'N/A'}
                </Typography>
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1em', marginLeft: 2 }}>Ξ</span>
                </Box>
              </Box>
              {ethPrice && !isNaN(listing.price) && isFinite(listing.price) && (
                <Typography variant="caption" sx={{ color: 'var(--text-secondary, #aaa)', fontWeight: 500, fontSize: '0.85em', mt: 0.5 }}>
                  ${(listing.price * ethPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('$','')}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" sx={{ color: 'var(--text-secondary, #aaa)' }}>
              Not listed
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary, #aaa)', fontWeight: 600 }}>
              {nft.id}
            </Typography>
            {listing && (
              <IconButton
                href={listing.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#f74d71', p: 0.5 }}
                onClick={e => e.stopPropagation()}
                size="small"
              >
                {(() => {
                  const marketplaceInfo = getMarketplaceInfo(listing.marketplace);
                  return (
                    <img 
                      src={marketplaceInfo.logo} 
                      alt={marketplaceInfo.name} 
                      style={{ width: 20, height: 20, display: 'block' }} 
                    />
                  );
                })()}
              </IconButton>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: bprColor, 
                fontWeight: 600, 
                fontSize: '0.8em' 
              }}
            >
              BPR: {formatBPR(bprData.score, !!listing)}
            </Typography>
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Badge Price Ratio (BPR)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    BPR measures the value of an NFT based on its badge strength relative to its price.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Formula:</strong> (Badge Count × Average Rarity Score) ÷ Price in ETH
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>This NFT:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 1, mb: 0.5 }}>
                    • {bprData.badgeCount} badge{bprData.badgeCount !== 1 ? 's' : ''}
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 1, mb: 0.5 }}>
                    • Total rarity: {bprData.totalRarityScore}
                  </Typography>
                  {listing && (
                    <Typography variant="body2" sx={{ ml: 1, mb: 0.5 }}>
                      • Price: {!isNaN(listing.price) && isFinite(listing.price) ? `${listing.price.toFixed(3)} ETH` : 'N/A'}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: bprColor }}>
                    Rating: {bprRating}
                  </Typography>
                </Box>
              }
              arrow
              placement="left"
              sx={{
                '& .MuiTooltip-tooltip': {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  maxWidth: 300,
                  fontSize: '0.75rem'
                }
              }}
            >
              <InfoIcon 
                sx={{ 
                  fontSize: 14, 
                  color: 'var(--text-secondary, #aaa)', 
                  cursor: 'pointer',
                  '&:hover': { color: 'var(--text-primary, #fff)' }
                }} 
                onClick={e => e.stopPropagation()}
              />
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
    
    {/* Success notification */}
    <Snackbar
      open={showCopySuccess}
      autoHideDuration={2000}
      onClose={() => setShowCopySuccess(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={() => setShowCopySuccess(false)} 
        severity="success" 
        variant="filled"
        sx={{ backgroundColor: '#4CAF50' }}
      >
        Copied to clipboard!
      </Alert>
    </Snackbar>
  </>
  );
};

// Memoize the component for better performance
export default React.memo(NFTCard, (prevProps, nextProps) => {
  return (
    prevProps.nft.id === nextProps.nft.id &&
    prevProps.listing?.price === nextProps.listing?.price &&
    prevProps.listing?.url === nextProps.listing?.url &&
    prevProps.nft.badge1 === nextProps.nft.badge1 &&
    prevProps.nft.badge2 === nextProps.nft.badge2 &&
    prevProps.nft.badge3 === nextProps.nft.badge3 &&
    prevProps.nft.badge4 === nextProps.nft.badge4 &&
    prevProps.nft.badge5 === nextProps.nft.badge5
  );
}); 