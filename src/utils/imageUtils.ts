// Image utility functions for handling WebP and IPFS images
import { needsIPFSBypass, isUAEUser } from './locationUtils';

export interface ImageLoadResult {
  url: string;
  isWebP: boolean;
  success: boolean;
  source: 'webp' | 'ipfs' | 'server' | 'cdn';
}

/**
 * Generate WebP image URL from token ID
 */
export function getWebPImageUrl(tokenId: string): string {
  return `${import.meta.env.BASE_URL}nfts/${tokenId}.webp`;
}

/**
 * Generate UAE-friendly server-based image URL
 * These images are served directly from your server instead of IPFS
 */
export function getUAEServerImageUrl(tokenId: string): string {
  // Assuming you have a server endpoint that serves images for UAE users
  return `${import.meta.env.BASE_URL}nfts/uae/${tokenId}.png`;
}

/**
 * Generate CDN-based image URL as fallback for UAE users
 */
export function getCDNImageUrl(tokenId: string): string {
  // Alternative CDN or direct server serving for UAE
  return `${import.meta.env.BASE_URL}nfts/cdn/${tokenId}.jpg`;
}

/**
 * Get IPFS hash from various URL formats and convert to direct server URL
 */
export function convertIPFSToServerUrl(ipfsUrl: string, tokenId: string): string {
  if (!ipfsUrl || !tokenId) return '';
  
  // Extract IPFS hash
  let ipfsHash = '';
  if (ipfsUrl.startsWith('ipfs://')) {
    ipfsHash = ipfsUrl.slice(7);
  } else {
    const match = ipfsUrl.match(/\/ipfs\/([^/?]+)/);
    ipfsHash = match ? match[1] : '';
  }
  
  if (!ipfsHash) return '';
  
  // Return server-hosted version for UAE users
  return `${import.meta.env.BASE_URL}nfts/server/${tokenId}/${ipfsHash}.png`;
}

/**
 * Generate IPFS image URL with gateway fallback system
 */
export function getIpfsImageUrl(ipfsUrl: string, gatewayIndex: number = 0): string {
  const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://ipfs.filebase.io/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://nftstorage.link/ipfs/',
    'https://w3s.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ];

  if (!ipfsUrl) return '';
  
  let ipfsPath = ipfsUrl;
  if (ipfsUrl.startsWith('ipfs://')) {
    ipfsPath = ipfsUrl.slice(7);
  } else {
    const match = ipfsUrl.match(/\/ipfs\/(.+)/);
    ipfsPath = match ? match[1] : ipfsUrl;
  }

  const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  return gateway + ipfsPath;
}

/**
 * Test if an image URL can be loaded successfully
 */
export function testImageLoad(url: string, timeout: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();
    const timeoutId = setTimeout(() => {
      resolve(false);
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Smart image loading strategy: UAE-aware with server fallbacks
 */
export async function loadOptimalImage(
  tokenId: string, 
  ipfsUrl: string,
  preferWebP: boolean = true
): Promise<ImageLoadResult> {
  
  // Check if user is from UAE and needs IPFS bypass (with timeout to prevent blocking)
  let isFromUAE = false;
  try {
    // Add timeout to prevent location detection from blocking
    const locationPromise = needsIPFSBypass();
    const timeoutPromise = new Promise<boolean>((resolve) => 
      setTimeout(() => resolve(false), 2000) // 2 second timeout
    );
    
    isFromUAE = await Promise.race([locationPromise, timeoutPromise]);
  } catch (error) {
    console.warn('Location detection failed, defaulting to non-UAE mode:', error);
    isFromUAE = false;
  }
  
  if (isFromUAE) {
    console.log(`UAE user detected for NFT ${tokenId}, using server-based images`);
    
    // For UAE users, prioritize server-based images over IPFS
    if (preferWebP) {
      // Try WebP first (still works for UAE)
      const webpUrl = getWebPImageUrl(tokenId);
      const webpSuccess = await testImageLoad(webpUrl, 2000);
      
      if (webpSuccess) {
        return {
          url: webpUrl,
          isWebP: true,
          success: true,
          source: 'webp'
        };
      }
    }

    // Try UAE-specific server URLs
    const uaeUrls = [
      getUAEServerImageUrl(tokenId),
      getCDNImageUrl(tokenId),
      convertIPFSToServerUrl(ipfsUrl, tokenId)
    ];

    for (const serverUrl of uaeUrls) {
      if (serverUrl) {
        const success = await testImageLoad(serverUrl, 3000);
        if (success) {
          return {
            url: serverUrl,
            isWebP: false,
            success: true,
            source: 'server'
          };
        }
      }
    }

    // Last resort: try a few non-IPFS image sources
    const fallbackUrls = [
      `${import.meta.env.BASE_URL}nfts/fallback/${tokenId}.png`,
      `https://cdn.goodvibesclub.io/nfts/${tokenId}.png`, // External CDN fallback
      `https://assets.goodvibesclub.io/${tokenId}.jpg`     // Alternative asset server
    ];

    for (const fallbackUrl of fallbackUrls) {
      const success = await testImageLoad(fallbackUrl, 2000);
      if (success) {
        return {
          url: fallbackUrl,
          isWebP: false,
          success: true,
          source: 'cdn'
        };
      }
    }

    console.warn(`All UAE-friendly sources failed for NFT ${tokenId}`);
    
    // Return failed result for UAE users - don't try IPFS
    return {
      url: '',
      isWebP: false,
      success: false,
      source: 'server'
    };
  }

  // Standard flow for non-UAE users
  if (preferWebP) {
    // Try WebP first
    const webpUrl = getWebPImageUrl(tokenId);
    const webpSuccess = await testImageLoad(webpUrl, 2000);
    
    if (webpSuccess) {
      return {
        url: webpUrl,
        isWebP: true,
        success: true,
        source: 'webp'
      };
    }
  }

  // Fallback to IPFS with gateway rotation (only for non-UAE users)
  const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://ipfs.filebase.io/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://nftstorage.link/ipfs/',
    'https://w3s.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ];

  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    const ipfsImageUrl = getIpfsImageUrl(ipfsUrl, i);
    const ipfsSuccess = await testImageLoad(ipfsImageUrl, 3000);
    
    if (ipfsSuccess) {
      return {
        url: ipfsImageUrl,
        isWebP: false,
        success: true,
        source: 'ipfs'
      };
    }
  }

  // All attempts failed
  return {
    url: '',
    isWebP: false,
    success: false,
    source: 'ipfs'
  };
}

/**
 * Gateway performance cache for IPFS optimization
 */
const gatewayCache = new Map<string, number>();

/**
 * Get cached best gateway index for an IPFS path
 */
export function getCachedGatewayIndex(ipfsPath: string): number {
  const cacheKey = ipfsPath.split('/')[0];
  return gatewayCache.get(cacheKey) || 0;
}

/**
 * Cache successful gateway index for future use
 */
export function cacheGatewayIndex(ipfsPath: string, gatewayIndex: number): void {
  const cacheKey = ipfsPath.split('/')[0];
  gatewayCache.set(cacheKey, gatewayIndex);
}

/**
 * For modal/popup: UAE-aware high quality loading
 */
export async function loadHighQualityImage(ipfsUrl: string): Promise<ImageLoadResult> {
  let isFromUAE = false;
  try {
    // Add timeout to prevent location detection from blocking modal loading
    const locationPromise = needsIPFSBypass();
    const timeoutPromise = new Promise<boolean>((resolve) => 
      setTimeout(() => resolve(false), 1000) // 1 second timeout for modal
    );
    
    isFromUAE = await Promise.race([locationPromise, timeoutPromise]);
  } catch (error) {
    console.warn('Location detection failed for modal, defaulting to non-UAE mode:', error);
    isFromUAE = false;
  }
  
  if (isFromUAE) {
    // For UAE users, try server sources for high quality images
    const tokenId = extractTokenIdFromIPFS(ipfsUrl);
    if (tokenId) {
      return loadOptimalImage(tokenId, ipfsUrl, false);
    }
  }
  
  return loadOptimalImage('', ipfsUrl, false); // preferWebP = false for high quality
}

/**
 * Extract token ID from IPFS URL patterns (helper function)
 */
function extractTokenIdFromIPFS(ipfsUrl: string): string {
  // Try to extract token ID from common IPFS URL patterns
  const patterns = [
    /\/(\d+)\.png$/,
    /\/(\d+)\.jpg$/,
    /\/(\d+)\.jpeg$/,
    /\/(\d+)$/,
    /token[_-]?(\d+)/i,
    /nft[_-]?(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = ipfsUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return '';
}

/**
 * For grid display: Prefer WebP for fast loading
 */
export async function loadGridImage(tokenId: string, ipfsUrl: string): Promise<ImageLoadResult> {
  const result = await loadOptimalImage(tokenId, ipfsUrl, true); // preferWebP = true for speed
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`NFT ${tokenId}: ${result.isWebP ? 'WebP' : 'IPFS'} - ${result.success ? 'Success' : 'Failed'}`);
  }
  
  return result;
}