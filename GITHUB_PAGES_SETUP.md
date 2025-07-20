# GitHub Pages + Cloudflare Worker Setup

Since you're using GitHub Pages (static hosting), you need a separate API proxy to handle OpenSea API calls.

## Current Setup

- **Hosting**: GitHub Pages (vibescollector.com)
- **Issue**: Can't run server-side code on GitHub Pages
- **Solution**: Cloudflare Worker as API proxy

## Quick Fix (Works Now!)

The site currently makes **anonymous API calls** to OpenSea. This works but has rate limits (30 requests/second).

## Full Solution: Deploy Cloudflare Worker

### Step 1: Create Cloudflare Account
1. Sign up at https://cloudflare.com
2. Go to Workers & Pages section

### Step 2: Deploy the Worker

#### Option A: Using Wrangler CLI
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy (from project root)
./deploy-worker.sh
```

#### Option B: Manual Deploy
1. Go to Cloudflare Dashboard > Workers & Pages
2. Create new Worker
3. Copy contents of `cloudflare-worker.js`
4. Add environment variable: `OPENSEA_API_KEY = 1277d5b42ffe45adbe69f9d84851057b`
5. Deploy

### Step 3: Update Your Build

After deploying, you'll get a URL like: `https://opensea-proxy.your-account.workers.dev`

Update `.env.production`:
```env
VITE_OPENSEA_PROXY_URL=https://opensea-proxy.your-account.workers.dev
```

### Step 4: Rebuild and Deploy

```bash
npm run build
# Commit and push - GitHub Pages will auto-deploy
```

## How It Works

```
Browser → Your Site → Cloudflare Worker → OpenSea API
         (GitHub Pages)   (Proxy with API key)
```

## Benefits

- ✅ No CORS issues
- ✅ API key stays secure on Cloudflare
- ✅ Better rate limits
- ✅ Works with GitHub Pages
- ✅ Free tier: 100,000 requests/day

## Testing

Visit `/api-debug.html` on your site to test the API connection.

## Alternative: Move to Vercel

If you prefer an all-in-one solution:
1. Connect GitHub repo to Vercel
2. Set environment variables
3. Done! (Edge Functions handle everything)

## Current Limitations

Without the Worker, your site:
- Makes anonymous API calls only
- May hit rate limits with heavy traffic
- But works fine for most use cases!