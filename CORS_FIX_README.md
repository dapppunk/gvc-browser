# OpenSea API CORS Fix Documentation

## The Issue
The OpenSea API doesn't allow direct browser requests due to CORS (Cross-Origin Resource Sharing) policy. This is a security measure to protect API keys from being exposed in client-side code.

## Development Solution (Implemented)
I've configured a Vite proxy to handle API requests during development:

1. **Updated `vite.config.ts`**: Added proxy configuration that forwards requests from `/api/opensea` to `https://api.opensea.io/api/v2`
2. **Updated `src/config.ts`**: Modified to use proxy URLs in development mode

### How it works:
- In development: Requests go to `http://localhost:5173/api/opensea/*` → Vite proxy → OpenSea API
- The proxy adds proper headers and handles CORS

## Production Solutions

### Option 1: Backend API (Recommended)
Create a backend service to handle OpenSea API requests:

```javascript
// Example Node.js/Express endpoint
app.get('/api/opensea/listings/:collection', async (req, res) => {
  const response = await fetch(`https://api.opensea.io/api/v2/listings/collection/${req.params.collection}/best`, {
    headers: {
      'X-API-KEY': process.env.OPENSEA_API_KEY,
      'Accept': 'application/json',
    }
  });
  const data = await response.json();
  res.json(data);
});
```

### Option 2: Serverless Functions
Use Vercel, Netlify, or AWS Lambda functions:

```javascript
// Example Vercel API route (/api/opensea-listings.js)
export default async function handler(req, res) {
  const { collection } = req.query;
  
  const response = await fetch(`https://api.opensea.io/api/v2/listings/collection/${collection}/best`, {
    headers: {
      'X-API-KEY': process.env.OPENSEA_API_KEY,
      'Accept': 'application/json',
    }
  });
  
  const data = await response.json();
  res.status(200).json(data);
}
```

### Option 3: Use a CORS Proxy Service
Services like cors-anywhere or allorigins (not recommended for production due to reliability/security concerns)

## Environment Variables
Make sure to set your OpenSea API key:

```bash
# Create .env file
echo "VITE_OPENSEA_API_KEY=your_api_key_here" > .env
```

## Testing the Fix
1. Start the development server: `npm run dev`
2. Check the browser console - CORS errors should be gone
3. Check the terminal for proxy logs showing OpenSea requests

## Security Considerations
- Never expose API keys in client-side code
- Always validate and sanitize requests in your backend
- Implement rate limiting to prevent API abuse
- Consider caching responses to reduce API calls

## Next Steps for Production
1. Choose a backend solution (Node.js server, serverless functions, etc.)
2. Implement API endpoints that mirror the OpenSea API structure
3. Update `src/config.ts` to point to your backend endpoints in production
4. Deploy your backend with proper environment variables