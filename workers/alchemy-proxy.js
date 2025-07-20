// Cloudflare Worker for Alchemy API Proxy

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only allow GET and POST requests
  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    // Get the path and query string from the request
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/alchemy', '')
    
    // Construct the Alchemy API URL
    const alchemyUrl = `https://eth-mainnet.g.alchemy.com${path}${url.search}`
    
    // Forward the request to Alchemy
    const alchemyResponse = await fetch(alchemyUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: request.method === 'POST' ? await request.text() : undefined,
    })

    // Get the response from Alchemy
    const responseData = await alchemyResponse.text()

    // Return the response with CORS headers
    return new Response(responseData, {
      status: alchemyResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300', // Cache for 5 minutes
      }
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}