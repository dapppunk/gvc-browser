export default {
  async fetch(request, env) {
    // Allow requests from your domains
    const allowedOrigins = [
      'https://vibescollector.com',
      'https://www.vibescollector.com',
      'http://localhost:5173',
      'http://localhost:5174' // Vite sometimes uses different ports
    ];
    
    const origin = request.headers.get('Origin');
    const isAllowed = allowedOrigins.includes(origin) || !origin;
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
          'Access-Control-Max-Age': '86400',
        }
      });
    }
    
    if (!isAllowed) {
      return new Response('Forbidden', { status: 403 });
    }

    // Parse the URL
    const url = new URL(request.url);
    
    // Construct Magic Eden API URL
    let pathname = url.pathname;
    const meUrl = 'https://api-mainnet.magiceden.dev' + pathname + url.search;
    
    // Prepare headers for Magic Eden
    const meHeaders = new Headers();
    meHeaders.set('Authorization', `Bearer ${env.MAGICEDEN_API_KEY}`);
    meHeaders.set('Accept', 'application/json');
    meHeaders.set('Content-Type', 'application/json');
    
    try {
      console.log('Proxying request to:', meUrl);
      
      // Make request to Magic Eden
      const response = await fetch(meUrl, {
        method: request.method,
        headers: meHeaders,
        body: request.method !== 'GET' ? await request.text() : undefined,
      });
      
      // Get response body
      const responseBody = await response.text();
      
      // Log response status for debugging
      console.log('Magic Eden response status:', response.status);
      
      // Create new response with CORS headers
      const newResponse = new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
          'Access-Control-Allow-Credentials': 'true',
          'Cache-Control': response.status === 200 ? 'public, max-age=60' : 'no-cache',
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
        }
      });
      
      return newResponse;
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        url: meUrl 
      }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
          'Content-Type': 'application/json',
        }
      });
    }
  }
}