# Deployment Guide

This guide covers deploying the GVC Browser with proper API proxy setup to avoid CORS issues.

## Environment Variables

Set these in your deployment platform:

```env
VITE_OPENSEA_API_KEY=your_opensea_api_key_here
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
OPENSEA_API_KEY=your_opensea_api_key_here  # For serverless functions
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect your GitHub repository to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables in Vercel dashboard**:
   - `OPENSEA_API_KEY` (for the Edge Function)
   - `VITE_OPENSEA_API_KEY` (for the build process)
   - `VITE_WALLETCONNECT_PROJECT_ID`

3. **Deploy**:
   - Vercel will automatically detect the `vercel.json` config
   - The Edge Function at `/api/opensea-proxy.ts` will handle API requests
   - No additional configuration needed

### Option 2: Cloudflare Workers + Pages

1. **Deploy the static site to Cloudflare Pages**:
   ```bash
   npm run build
   npx wrangler pages deploy dist
   ```

2. **Deploy the Worker**:
   - Create a new Worker in Cloudflare dashboard
   - Copy contents of `cloudflare-worker.js`
   - Set `OPENSEA_API_KEY` environment variable in Worker settings
   - Configure Worker route to handle `/api/opensea/*` on your domain

3. **Update DNS**:
   - Point your domain to Cloudflare Pages
   - Worker will automatically intercept API requests

### Option 3: Netlify + Edge Functions

1. **Create `netlify/edge-functions/opensea-proxy.ts`**:
   ```typescript
   import type { Context } from "@netlify/edge-functions";

   export default async (request: Request, context: Context) => {
     // Similar implementation to vercel edge function
   };
   ```

2. **Deploy to Netlify**:
   ```bash
   npm run build
   netlify deploy --prod
   ```

### Option 4: Self-Hosted with Node.js

1. **Create a simple Express server**:
   ```javascript
   const express = require('express');
   const cors = require('cors');
   const app = express();

   app.use(cors());
   app.use(express.static('dist'));

   app.get('/api/opensea/*', async (req, res) => {
     // Proxy implementation
   });

   app.listen(3000);
   ```

2. **Deploy to your VPS/Cloud provider**

## Post-Deployment Checklist

- [ ] Verify OpenSea API proxy is working at `/api/opensea/listings/collection/good-vibes-club/best?limit=1`
- [ ] Check console for CORS errors
- [ ] Ensure WalletConnect works (add domain to allowlist)
- [ ] Test NFT listing loading
- [ ] Verify image loading from IPFS gateways

## Troubleshooting

### CORS Errors
- Ensure the proxy endpoint is correctly configured
- Check that environment variables are set
- Verify the API key is valid

### 404 Errors
- Check the API endpoint URL format
- Ensure the collection slug is correct
- Verify the proxy is rewriting paths correctly

### No Listings Showing
- Check browser console for errors
- Verify API key has correct permissions
- Test the API endpoint directly