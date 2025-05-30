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

### OpenSea API Integration
The project uses OpenSea's API v2 for real-time listing data. To set it up:

1. Copy `js/config.template.js` to `js/config.js`
2. Get an API key from [OpenSea](https://docs.opensea.io/reference/api-keys)
3. Add your API key to `js/config.js`
4. Make sure `js/config.js` is in `.gitignore` (already configured)

The app will show:
- Current listing prices for NFTs that are for sale
- "Not listed" for NFTs that aren't currently for sale
- A filter to show only listed NFTs

⚠️ **Important**: Never commit your API keys to GitHub!

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