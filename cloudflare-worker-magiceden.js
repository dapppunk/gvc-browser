export default {
  async fetch(request, env) {
    // Allow requests from your domains
    const allowedOrigins = [
      'https://vibescollector.com',
      'https://www.vibescollector.com',
      'http://localhost:5173'
    ];
    
    const origin = request.headers.get('Origin');
    const isAllowed = allowedOrigins.includes(origin) || !origin;
    
    if (!isAllowed) {
      return new Response('Forbidden', { status: 403 });
    }

    // Parse the URL
    const url = new URL(request.url);
    
    // Construct Magic Eden API URL - handle v2 and v3 endpoints
    let pathname = url.pathname;
    
    // If the path doesn't start with /v2 or /v3, prepend /v2
    if (!pathname.startsWith('/v2') && !pathname.startsWith('/v3')) {
      pathname = '/v2' + pathname;
    }
    
    const meUrl = 'https://api-mainnet.magiceden.dev' + pathname + url.search;
    
    // Prepare headers for Magic Eden
    const meHeaders = new Headers();
    meHeaders.set('Authorization', `Bearer ${env.MAGICEDEN_API_KEY}`);
    meHeaders.set('Accept', 'application/json');
    meHeaders.set('Content-Type', 'application/json');
    
    try {
      // Make request to Magic Eden
      const response = await fetch(meUrl, {
        method: request.method,
        headers: meHeaders,
        body: request.method !== 'GET' ? await request.text() : undefined,
      });
      
      // Get response body
      const responseBody = await response.text();
      
      // Create new response with CORS headers
      const newResponse = new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'public, max-age=60',
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
        }
      });
      
      return newResponse;
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Content-Type': 'application/json',
        }
      });
    }
  }
}