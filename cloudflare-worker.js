// Cloudflare Worker for OpenSea API Proxy
// Deploy this to Cloudflare Workers and update your domain's DNS

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Only allow requests from your domain
  const allowedOrigins = [
    'https://vibescollector.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = request.headers.get('Origin');
  const isAllowedOrigin = allowedOrigins.includes(origin);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Extract the path from the request
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/opensea', '');
  
  // Construct OpenSea API URL
  const openSeaUrl = `https://api.opensea.io/v2${path}${url.search}`;
  
  // Get API key from environment variable (set in Cloudflare dashboard)
  const apiKey = OPENSEA_API_KEY; // This is set as an environment variable in Cloudflare
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
      }
    });
  }

  try {
    // Fetch from OpenSea
    const response = await fetch(openSeaUrl, {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      }
    });

    // Create new response with CORS headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });

    // Add CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : '');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    newResponse.headers.set('Cache-Control', 'public, max-age=60');

    return newResponse;
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch from OpenSea' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
      }
    });
  }
}