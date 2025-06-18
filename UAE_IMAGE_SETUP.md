# UAE Image Serving Setup

This system automatically detects users from the UAE and serves images from alternative sources to bypass IPFS restrictions.

## How It Works

1. **Location Detection**: Automatically detects UAE users using multiple methods:
   - IP geolocation via ipapi.co
   - Fallback to ip-api.com
   - Timezone detection (Asia/Dubai, Asia/Muscat)
   - IP pattern matching for UAE ISPs

2. **Image Serving Priority for UAE Users**:
   - First: WebP images from your server (`/nfts/{tokenId}.webp`)
   - Second: UAE-specific server images (`/nfts/uae/{tokenId}.png`)
   - Third: CDN images (`/nfts/cdn/{tokenId}.jpg`)
   - Fourth: Converted IPFS images (`/nfts/server/{tokenId}/{ipfsHash}.png`)
   - Fifth: Fallback URLs (`/nfts/fallback/{tokenId}.png`)
   - **NEVER**: IPFS gateways (completely bypassed for UAE)

## Server Setup Required

To support UAE users, you need to set up these endpoints on your server:

### 1. UAE-Specific Images
```
/nfts/uae/{tokenId}.png
```
Example: `/nfts/uae/1234.png`

### 2. CDN Images
```
/nfts/cdn/{tokenId}.jpg
```
Example: `/nfts/cdn/1234.jpg`

### 3. Server-Hosted IPFS Copies
```
/nfts/server/{tokenId}/{ipfsHash}.png
```
Example: `/nfts/server/1234/QmXyZ123.png`

### 4. Fallback Images
```
/nfts/fallback/{tokenId}.png
```
Example: `/nfts/fallback/1234.png`

## Implementation Steps

1. **Download IPFS Images**: Create a script to download all NFT images from IPFS and store them on your server
2. **Set up Directory Structure**: Create the required directories in your public folder
3. **Configure Web Server**: Ensure your web server serves these static files
4. **Test**: Use VPN to simulate UAE location and verify images load

## Testing

To test UAE functionality:
1. Use a VPN connected to UAE
2. Open browser dev tools and check console for "UAE user detected" messages
3. Verify images load without IPFS errors
4. Check that the UAE notification appears

## External CDN Setup (Optional)

For better performance, you can set up external CDNs:
- `https://cdn.goodvibesclub.io/nfts/{tokenId}.png`
- `https://assets.goodvibesclub.io/{tokenId}.jpg`

These are automatically tried as fallbacks for UAE users.

## Configuration

The system uses these environment variables:
- `BASE_URL`: Your base URL for serving local images
- All UAE-specific paths are relative to `BASE_URL`

## Logging

UAE-specific image loading includes console logging:
- "UAE user detected for NFT {tokenId}, using server-based images"
- Warnings when UAE-friendly sources fail

This helps debug image serving issues for UAE users.