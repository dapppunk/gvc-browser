export const CONFIG = {
  OPENSEA_API_BASE: 'https://api.opensea.io/api/v2',
  IPFS_GATEWAYS: [
    'https://ipfs.io/ipfs/',
    'https://ipfs.filebase.io/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://nftstorage.link/ipfs/',
    'https://w3s.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ],
  OPENSEA_API_KEY: import.meta.env.VITE_OPENSEA_API_KEY || '',
  COLLECTION_CONTRACT: '0xb8ea78fcacef50d41375e44e6814ebba36bb33c4',
  COLLECTION_SLUG: 'good-vibes-club'
}; 