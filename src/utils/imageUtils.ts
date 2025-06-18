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
    console.log(`UAE user detected for NFT ${tokenId}, using only server-based images (NO IPFS)`);
    
    // For UAE users, ALWAYS try WebP first regardless of preferWebP setting
    const webpUrl = getWebPImageUrl(tokenId);
    const webpSuccess = await testImageLoad(webpUrl, 4000); // Longer timeout for WebP
    
    if (webpSuccess) {
      console.log(`UAE user: WebP loaded successfully for NFT ${tokenId}`);
      return {
        url: webpUrl,
        isWebP: true,
        success: true,
        source: 'webp'
      };
    }

    console.warn(`UAE user: WebP failed for NFT ${tokenId}, trying alternative sources`);

    // Try UAE-specific server URLs (only if WebP fails)
    const uaeUrls = [
      getUAEServerImageUrl(tokenId),
      getCDNImageUrl(tokenId),
      convertIPFSToServerUrl(ipfsUrl, tokenId)
    ];

    for (const serverUrl of uaeUrls) {
      if (serverUrl) {
        console.log(`UAE user: Trying server URL: ${serverUrl}`);
        const success = await testImageLoad(serverUrl, 3000);
        if (success) {
          console.log(`UAE user: Server URL loaded successfully: ${serverUrl}`);
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
      `${import.meta.env.BASE_URL}nfts/${tokenId}.png`, // Try PNG version
      `${import.meta.env.BASE_URL}nfts/${tokenId}.jpg`, // Try JPG version
    ];

    for (const fallbackUrl of fallbackUrls) {
      console.log(`UAE user: Trying fallback URL: ${fallbackUrl}`);
      const success = await testImageLoad(fallbackUrl, 2000);
      if (success) {
        console.log(`UAE user: Fallback URL loaded successfully: ${fallbackUrl}`);
        return {
          url: fallbackUrl,
          isWebP: false,
          success: true,
          source: 'cdn'
        };
      }
    }

    console.error(`UAE user: ALL server sources failed for NFT ${tokenId} - NEVER trying IPFS`);
    
    // Return failed result for UAE users - NEVER try IPFS
    return {
      url: '',
      isWebP: false,
      success: false,
      source: 'server'
    };
  }

  // Standard flow for non-UAE users
  if (preferWebP && tokenId) {
    // Try WebP first (only if we have a token ID)
    const webpUrl = getWebPImageUrl(tokenId);
    const webpSuccess = await testImageLoad(webpUrl, 3000); // Increased timeout
    
    if (webpSuccess) {
      console.log(`Non-UAE user: WebP loaded successfully for NFT ${tokenId}`);
      return {
        url: webpUrl,
        isWebP: true,
        success: true,
        source: 'webp'
      };
    } else {
      console.warn(`Non-UAE user: WebP failed for NFT ${tokenId}, falling back to IPFS`);
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
    console.log('UAE user detected for modal, using WebP instead of IPFS');
    
    // For UAE users, try to extract token ID and use WebP
    const tokenId = extractTokenIdFromIPFS(ipfsUrl);
    if (tokenId) {
      // Try WebP first for UAE users in modal
      const webpUrl = getWebPImageUrl(tokenId);
      const webpSuccess = await testImageLoad(webpUrl, 3000);
      
      if (webpSuccess) {
        return {
          url: webpUrl,
          isWebP: true,
          success: true,
          source: 'webp'
        };
      }
      
      // If WebP fails, try other server sources
      return loadOptimalImage(tokenId, ipfsUrl, true); // preferWebP = true for UAE
    }
    
    // If no token ID found, return failed result - don't try IPFS for UAE
    console.warn('Could not extract token ID for UAE user modal image');
    return {
      url: '',
      isWebP: false,
      success: false,
      source: 'server'
    };
  }
  
  // For non-UAE users, use original IPFS logic
  return loadOptimalImage('', ipfsUrl, false); // preferWebP = false for high quality
}

/**
 * Extract token ID from IPFS URL patterns (helper function)
 */
export function extractTokenIdFromIPFS(ipfsUrl: string): string {
  if (!ipfsUrl) return '';
  
  // Try to extract token ID from common IPFS URL patterns
  const patterns = [
    /\/(\d+)\.png$/i,
    /\/(\d+)\.jpg$/i,
    /\/(\d+)\.jpeg$/i,
    /\/(\d+)\.webp$/i,
    /\/(\d+)$/,
    /token[_-]?(\d+)/i,
    /nft[_-]?(\d+)/i,
    /#(\d+)/,  // Sometimes token ID is in hash
    /id[_-]?(\d+)/i,
    /(\d+)[_-]?\.png/i,
    /(\d+)[_-]?\.jpg/i,
    /\/(\d{1,5})\//,  // Token ID in path segment
    /(\d{1,5})/g  // Any 1-5 digit number (last resort)
  ];
  
  for (const pattern of patterns) {
    const matches = ipfsUrl.match(pattern);
    if (matches) {
      // For global pattern, check all matches
      if (pattern.global) {
        const allMatches = [...ipfsUrl.matchAll(pattern)];
        for (const match of allMatches) {
          if (match[1]) {
            const tokenId = match[1];
            const num = parseInt(tokenId);
            if (num >= 1 && num <= 10000) {
              console.log(`Extracted token ID ${tokenId} from IPFS URL: ${ipfsUrl}`);
              return tokenId;
            }
          }
        }
      } else {
        // For non-global patterns
        if (matches[1]) {
          const tokenId = matches[1];
          const num = parseInt(tokenId);
          if (num >= 1 && num <= 10000) {
            console.log(`Extracted token ID ${tokenId} from IPFS URL: ${ipfsUrl}`);
            return tokenId;
          }
        }
      }
    }
  }
  
  console.warn('Could not extract valid token ID from IPFS URL:', ipfsUrl);
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