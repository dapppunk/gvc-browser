export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // Get the path from the request URL
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/opensea-proxy', '');
  const queryString = url.search;

  // Construct the OpenSea API URL
  const openSeaUrl = `https://api.opensea.io/v2${path}${queryString}`;

  // Get the API key from environment variables
  const apiKey = process.env.OPENSEA_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OpenSea API key not configured' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    // Forward the request to OpenSea
    const response = await fetch(openSeaUrl, {
      method: request.method,
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    // Get the response data
    const data = await response.text();

    // Return the response with CORS headers
    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Error proxying OpenSea request:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch from OpenSea' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}