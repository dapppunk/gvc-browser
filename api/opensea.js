export default async function handler(request, response) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    // Get the path from query parameter (due to rewrite rule)
    const path = request.query.path || '';
    
    // Construct query string from remaining query params
    const queryParams = { ...request.query };
    delete queryParams.path;
    const queryString = new URLSearchParams(queryParams).toString();
    
    // Construct the OpenSea API URL
    const openSeaUrl = `https://api.opensea.io/v2${path}${queryString ? '?' + queryString : ''}`;
    
    console.log('OpenSea Proxy Request:', {
      originalUrl: request.url,
      path,
      openSeaUrl,
      query: request.query
    });

    // Get the API key
    const apiKey = process.env.OPENSEA_API_KEY || 
                   process.env.VITE_OPENSEA_API_KEY || 
                   request.headers['x-api-key'];

    // Prepare headers
    const headers = {
      'Accept': 'application/json',
    };
    
    if (apiKey) {
      headers['X-API-KEY'] = apiKey;
    }

    // Make the request to OpenSea
    const openSeaResponse = await fetch(openSeaUrl, {
      method: 'GET',
      headers
    });

    const data = await openSeaResponse.json();

    // Return the response
    response.status(openSeaResponse.status).json(data);
    
  } catch (error) {
    console.error('OpenSea proxy error:', error);
    response.status(500).json({ 
      error: 'Failed to fetch from OpenSea',
      details: error.message 
    });
  }
}