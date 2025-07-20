#!/bin/bash

echo "🚀 Deploying OpenSea proxy to Cloudflare Workers..."

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi

echo "✅ Logged in to Cloudflare"

# Deploy the worker
echo "📦 Deploying worker..."
wrangler deploy

# Get deployment info
echo "
✅ Worker deployed successfully!

Your worker should be available at:
https://gvc-opensea-proxy.<your-subdomain>.workers.dev

Next steps:
1. Copy your Worker URL from above
2. Create/update .env.production:
   VITE_OPENSEA_PROXY_URL=https://gvc-opensea-proxy.<your-subdomain>.workers.dev

3. Rebuild and deploy:
   npm run build
   git add -A
   git commit -m 'Add Cloudflare Worker URL'
   git push

4. (Optional) Set up custom domain in Cloudflare dashboard
"