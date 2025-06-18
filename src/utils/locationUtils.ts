// Location detection and country-specific optimizations

export interface LocationInfo {
  country: string;
  countryCode: string;
  isUAE: boolean;
  needsIPFSBypass: boolean;
}

let cachedLocation: LocationInfo | null = null;
let locationPromise: Promise<LocationInfo> | null = null;

/**
 * Detect user's location with multiple fallback methods
 */
export async function detectUserLocation(): Promise<LocationInfo> {
  // Return cached result if available
  if (cachedLocation) {
    return cachedLocation;
  }

  // Return existing promise if detection is already in progress
  if (locationPromise) {
    return locationPromise;
  }

  locationPromise = detectLocationInternal();
  const result = await locationPromise;
  cachedLocation = result;
  
  return result;
}

async function detectLocationInternal(): Promise<LocationInfo> {
  const fallbackLocation: LocationInfo = {
    country: 'Unknown',
    countryCode: 'XX',
    isUAE: false,
    needsIPFSBypass: false
  };

  try {
    // Method 1: Try ipapi.co (most reliable)
    try {
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const isUAE = data.country_code === 'AE' || data.country === 'United Arab Emirates';
        
        return {
          country: data.country || 'Unknown',
          countryCode: data.country_code || 'XX',
          isUAE,
          needsIPFSBypass: isUAE
        };
      }
    } catch (error) {
      console.warn('ipapi.co failed:', error);
    }

    // Method 2: Try ip-api.com as fallback
    try {
      const response = await fetch('http://ip-api.com/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const isUAE = data.countryCode === 'AE' || data.country === 'United Arab Emirates';
        
        return {
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'XX',
          isUAE,
          needsIPFSBypass: isUAE
        };
      }
    } catch (error) {
      console.warn('ip-api.com failed:', error);
    }

    // Method 3: Try httpbin.org/ip for basic IP detection
    try {
      const response = await fetch('https://httpbin.org/ip');
      if (response.ok) {
        const data = await response.json();
        console.log('Detected IP:', data.origin);
        
        // Check if IP suggests UAE (basic detection)
        // UAE IP ranges often start with certain patterns
        const ip = data.origin;
        const isLikelyUAE = checkIfIPLooksLikeUAE(ip);
        
        return {
          country: isLikelyUAE ? 'United Arab Emirates (detected)' : 'Unknown',
          countryCode: isLikelyUAE ? 'AE' : 'XX',
          isUAE: isLikelyUAE,
          needsIPFSBypass: isLikelyUAE
        };
      }
    } catch (error) {
      console.warn('httpbin.org failed:', error);
    }

    // Method 4: Check timezone as a hint
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isUAETimezone = timezone === 'Asia/Dubai' || timezone === 'Asia/Muscat';
      
      if (isUAETimezone) {
        return {
          country: 'United Arab Emirates (timezone)',
          countryCode: 'AE',
          isUAE: true,
          needsIPFSBypass: true
        };
      }
    } catch (error) {
      console.warn('Timezone detection failed:', error);
    }

  } catch (error) {
    console.warn('All location detection methods failed:', error);
  }

  return fallbackLocation;
}

/**
 * Basic IP pattern check for UAE (simplified detection)
 */
function checkIfIPLooksLikeUAE(ip: string): boolean {
  // Common UAE IP ranges (simplified check)
  const uaePatterns = [
    /^5\.1[56789]\./,     // Etisalat
    /^5\.6[234567]\./,    // Etisalat
    /^82\.1[456789]\./,   // Emirates Internet
    /^91\.7[4567]\./,     // Emirates Internet
    /^94\.20[0-3]\./,     // Du
    /^178\.23[4567]\./,   // Du
    /^185\.11[0-5]\./,    // Various UAE ISPs
  ];

  return uaePatterns.some(pattern => pattern.test(ip));
}

/**
 * Check if current user is from UAE (cached)
 */
export async function isUAEUser(): Promise<boolean> {
  const location = await detectUserLocation();
  return location.isUAE;
}

/**
 * Check if current user needs IPFS bypass
 */
export async function needsIPFSBypass(): Promise<boolean> {
  const location = await detectUserLocation();
  return location.needsIPFSBypass;
}

/**
 * Get user's country information
 */
export async function getUserCountry(): Promise<string> {
  const location = await detectUserLocation();
  return location.country;
}