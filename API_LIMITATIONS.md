# API Limitations & Solutions

## Current Setup

### Development
- ✅ Uses API key via Vite proxy
- ✅ Full access to OpenSea API
- ✅ No CORS issues

### Production
- ⚠️ Makes anonymous API calls (no API key)
- ⚠️ May hit rate limits
- ✅ Works without proxy setup
- ✅ No CORS errors

## Why This Happens

OpenSea's CORS policy:
- **Allows**: Anonymous browser requests (no API key)
- **Blocks**: Authenticated browser requests (with API key)

This is a security measure to prevent API keys from being exposed in client-side code.

## Rate Limits

Without API key, you may encounter:
- Lower rate limits
- Possible throttling during high traffic
- Limited to 30 requests per second

## Solutions for Full API Access

### 1. Deploy to Vercel (Recommended)
- Automatic proxy via Edge Functions
- Full API key access
- No rate limits

### 2. Cloudflare Workers
- Deploy separate proxy worker
- Full API key access
- Better performance

### 3. Keep Current Setup
- Works fine for most use cases
- Simple, no extra infrastructure
- May hit limits with heavy traffic

## Monitoring

Check browser console for:
```
Production API call to: https://api.opensea.io/v2 (without API key to avoid CORS)
```

If you see 429 errors (rate limit), consider implementing a proxy.