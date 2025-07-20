# Cloudflare Workers

This directory contains Cloudflare Worker scripts for API proxies.

## Alchemy API Proxy

The `alchemy-proxy.js` file contains a Cloudflare Worker that proxies requests to the Alchemy API, keeping the API key secure on the server side.

### Deployment Instructions

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Create a new Worker:
   ```bash
   wrangler init gvc-alchemy-proxy
   ```

4. Copy the contents of `alchemy-proxy.js` to the Worker

5. Deploy the Worker:
   ```bash
   wrangler deploy
   ```

6. The Worker will be available at:
   ```
   https://gvc-alchemy-proxy.workers.dev
   ```

### Local Development

For local development, the Vite dev server includes a proxy configuration that forwards `/api/alchemy` requests directly to the Alchemy API.

### Production

In production, the app uses the Cloudflare Worker URL configured in `src/config.ts`:
```
https://gvc-alchemy-proxy.workers.dev/api/alchemy
```

### API Endpoints

The proxy supports all Alchemy v2 JSON-RPC methods, including:
- `alchemy_getNFTs` - Get all NFTs owned by an address
- `eth_getBalance` - Get ETH balance
- And all other Alchemy v2 API methods

### Important Note

The Alchemy API key is embedded in the worker script. Make sure to:
1. Keep the worker private
2. Set up rate limiting if needed
3. Monitor usage through Alchemy dashboard