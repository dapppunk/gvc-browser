#!/bin/bash

echo "🚀 Deploying OpenSea proxy to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Create wrangler.toml
cat > wrangler.toml << EOF
name = "opensea-proxy"
main = "cloudflare-worker.js"
compatibility_date = "2024-01-01"

[env.production]
vars = { OPENSEA_API_KEY = "1277d5b42ffe45adbe69f9d84851057b" }
EOF

# Deploy
echo "📦 Deploying worker..."
wrangler deploy

# Get the worker URL
echo "
✅ Worker deployed!

Your worker URL is: https://opensea-proxy.<your-subdomain>.workers.dev

Now update your .env.production file:
VITE_OPENSEA_PROXY_URL=https://opensea-proxy.<your-subdomain>.workers.dev
"

# Clean up
rm wrangler.toml