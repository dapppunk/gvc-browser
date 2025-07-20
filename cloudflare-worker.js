// Cloudflare Worker for OpenSea API Proxy
// Deploy this to Cloudflare Workers for GitHub Pages sites

export default {
  async fetch(request, env) {
    // Allow requests from your domains
    const allowedOrigins = [
      'https://vibescollector.com',
      'https://www.vibescollector.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ];
    
    const origin = request.headers.get('Origin') || '';
    const isAllowedOrigin = allowedOrigins.some(allowed => origin.startsWith(allowed));
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-KEY',
      'Access-Control-Max-Age': '86400',
    };
    
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      // Extract path
      const url = new URL(request.url);
      const path = url.pathname;
      
      // Construct OpenSea URL
      const openSeaUrl = `https://api.opensea.io/v2${path}${url.search}`;
      
      // Get API key (set in Cloudflare dashboard)
      const apiKey = env.OPENSEA_API_KEY || '1277d5b42ffe45adbe69f9d84851057b';
      
      console.log('Proxying request:', {
        originalUrl: url.toString(),
        openSeaUrl,
        hasApiKey: !!apiKey
      });

      // Make request to OpenSea
      const headers = {
        'Accept': 'application/json',
      };
      
      // Only add API key if we have one
      if (apiKey && apiKey !== 'your_key_here') {
        headers['X-API-KEY'] = apiKey;
      }

      const response = await fetch(openSeaUrl, { headers });
      
      // Return response with CORS headers
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch from OpenSea',
        details: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};