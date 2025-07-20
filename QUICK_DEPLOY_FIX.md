# Quick Fix for Production API Issues

Your production site can't fetch prices because browsers block direct API calls (CORS policy).

## Immediate Solutions:

### Option 1: Deploy to Vercel (Recommended - 5 minutes)
1. Go to https://vercel.com and sign up with GitHub
2. Click "Import Project" and select your `gvc-browser` repo
3. Add these environment variables in Vercel settings:
   ```
   OPENSEA_API_KEY=1277d5b42ffe45adbe69f9d84851057b
   ```
4. Deploy! The Edge Function at `/api/opensea-proxy.ts` will handle everything

### Option 2: Use Netlify (Alternative)
1. Create `netlify/functions/opensea-proxy.js`:
```javascript
exports.handler = async (event) => {
  const path = event.path.replace('/api/opensea', '');
  const response = await fetch(`https://api.opensea.io/v2${path}${event.rawQuery ? '?' + event.rawQuery : ''}`, {
    headers: {
      'X-API-KEY': process.env.OPENSEA_API_KEY,
      'Accept': 'application/json',
    }
  });
  
  const data = await response.text();
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: data
  };
};
```

2. Set environment variable in Netlify:
   ```
   OPENSEA_API_KEY=1277d5b42ffe45adbe69f9d84851057b
   ```

### Option 3: Keep Current Hosting + Add Worker
If you want to keep your current hosting:

1. Deploy the Cloudflare Worker:
   ```bash
   npm install -g wrangler
   wrangler login
   ./deploy-cloudflare-worker.sh
   ```

2. Update `.env.production`:
   ```
   VITE_OPENSEA_PROXY_URL=https://your-worker.workers.dev/api/opensea
   ```

## Current Status
- ✅ Local development works (proxy via Vite)
- ❌ Production fails (no proxy for API calls)
- 🔧 Need to deploy with serverless function support

## Why This Happens
- OpenSea API doesn't allow browser requests (no CORS headers)
- Must proxy through your own server/function
- Development works because Vite provides a proxy