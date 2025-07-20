export const CONFIG = {
  // OpenSea API Configuration
  OPENSEA_API_BASE: import.meta.env.DEV ? '/api/opensea' : 'https://api.opensea.io/api/v2',
  OPENSEA_API_KEY: import.meta.env.VITE_OPENSEA_API_KEY || '',
  
  // Magic Eden API Configuration
  MAGICEDEN_API_BASE: import.meta.env.DEV ? '/api/magiceden' : 'https://api-mainnet.magiceden.dev/v2',
  MAGICEDEN_API_KEY: import.meta.env.VITE_MAGICEDEN_API_KEY || '',
  
  // Collection Information
  COLLECTION_CONTRACT: '0xb8ea78fcacef50d41375e44e6814ebba36bb33c4',
  COLLECTION_SLUG: 'good-vibes-club',
  
  // IPFS Gateway Configuration
  IPFS_GATEWAYS: [
    'https://ipfs.io/ipfs/',
    'https://ipfs.filebase.io/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://nftstorage.link/ipfs/',
    'https://w3s.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ]
}; 