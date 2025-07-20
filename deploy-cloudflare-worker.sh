#!/bin/bash

# Deploy OpenSea proxy to Cloudflare Workers
# Prerequisites: 
# 1. Install Wrangler: npm install -g wrangler
# 2. Login to Cloudflare: wrangler login

echo "Deploying OpenSea proxy to Cloudflare Workers..."

# Create wrangler.toml
cat > wrangler.toml << EOF
name = "gvc-opensea-proxy"
main = "cloudflare-worker.js"
compatibility_date = "2024-01-01"

[vars]
OPENSEA_API_KEY = "1277d5b42ffe45adbe69f9d84851057b"

[[routes]]
pattern = "vibescollector.com/api/opensea/*"
zone_name = "vibescollector.com"
EOF

# Deploy the worker
wrangler deploy

# Update the config to use your worker URL
echo "
After deployment, update src/config.ts:
OPENSEA_API_BASE: 'https://gvc-opensea-proxy.YOUR-SUBDOMAIN.workers.dev/api/opensea'
"

rm wrangler.toml