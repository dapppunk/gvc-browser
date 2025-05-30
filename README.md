# Good Vibes Club NFT Browser

A web-based browser for the Good Vibes Club NFT collection, featuring advanced filtering, search, and metadata exploration.

## Features

- 🎨 Browse the entire Good Vibes Club collection
- 🔍 Search by token ID or attributes
- 🏷️ Filter by multiple metadata attributes (Gender, Background, Body, Face, Hair, Type)
- 📊 Sort by Token ID or Rarity
- 🖼️ IPFS image loading with fallback support
- 💰 OpenSea price integration (placeholder for API implementation)
- 📱 Responsive design for mobile and desktop
- 🚀 Static site - perfect for GitHub Pages hosting

## Deployment to GitHub Pages

1. Create a new GitHub repository
2. Upload all files from the `gvc-browser` directory
3. Go to Settings → Pages
4. Select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Save and wait for deployment

Your NFT browser will be available at: `https://[your-username].github.io/[repository-name]/`

## Configuration

### OpenSea Integration
To enable real OpenSea price data:
1. Get an API key from OpenSea
2. Update the `OPENSEA_API_URL` and implement proper API calls in `js/app.js`
3. Replace `COLLECTION_SLUG` with the actual OpenSea collection slug

### IPFS Gateway
The default IPFS gateway is `https://ipfs.io/ipfs/`. You can change this in `js/app.js` if you prefer a different gateway.

## Local Development

1. Clone the repository
2. Open `index.html` in a web browser
3. For development with a local server:
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```

## File Structure

```
gvc-browser/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styling
├── js/
│   └── app.js          # Main application logic
├── data/
│   └── gvc_data.csv    # NFT metadata
└── README.md           # This file
```

## Technical Details

- Pure JavaScript (no frameworks required)
- CSV parsing for metadata
- Dynamic filter generation based on available traits
- Rarity calculation based on trait occurrence
- Lazy loading for images
- Modal view for detailed NFT information

## License

This project is open source and available under the MIT License.