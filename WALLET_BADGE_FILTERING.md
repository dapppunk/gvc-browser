# Wallet-Based Badge Filtering

This feature filters NFT badges to show only those that a connected wallet can gain (excluding duplicates they already own).

## Current Status

The feature is now **fully implemented** using the Reservoir API (free tier) as a fallback solution due to Alchemy API authentication issues.

## How It Works

1. When a wallet connects, the system uses Reservoir API to fetch all GVC NFTs owned by that address
2. Extracts badges from owned NFTs (badge1-badge5 fields)
3. Creates a Set of unique badges the user already owns
4. Filters displayed badges on NFT cards to exclude owned badges

## API Used

The implementation uses [Reservoir API](https://api.reservoir.tools) which:
- Provides free tier access for NFT data
- Doesn't require authentication for basic queries
- Supports pagination for large collections
- Has good uptime and reliability

## How It Works

1. When a wallet connects, the system fetches all GVC NFTs owned by that address
2. Extracts badges from owned NFTs (badge1-badge5 fields)
3. Creates a Set of unique badges the user already owns
4. Filters displayed badges on NFT cards to exclude owned badges

## Implementation Details

- Uses Alchemy's JSON-RPC API with the `alchemy_getNFTs` method
- Supports pagination for wallets with many NFTs
- Falls back gracefully if API is not configured
- Caches results to avoid repeated API calls

## Files Modified

- `src/contexts/WalletContext.tsx` - Main wallet context with NFT scanning
- `src/components/NFTCard.tsx` - Badge filtering logic
- `src/App.tsx` - WalletProvider integration
- `vite.config.ts` - Local development proxy
- `workers/alchemy-proxy.js` - Production API proxy

## Testing

Once enabled with a valid API key:
1. Connect a wallet that owns GVC NFTs
2. Browse the collection
3. Verify that badges already owned don't appear on NFT cards
4. Only gainable badges should be visible