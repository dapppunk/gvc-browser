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

### Step 1: Add your OpenSea API Key as a GitHub Secret
1. Go to your repository on GitHub
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `OPENSEA_API_KEY`
5. Value: Your OpenSea API key
6. Click **Add secret**

### Step 2: Enable GitHub Pages
1. Go to **Settings** → **Pages**
2. Under "Source", select **GitHub Actions**
3. Save the settings

### Step 3: Deploy
The site will automatically deploy when you push to the `main` branch. You can also manually trigger a deployment:
1. Go to **Actions** tab
2. Select "Deploy to GitHub Pages" workflow
3. Click **Run workflow**

Your NFT browser will be available at: `https://[your-username].github.io/[repository-name]/`

## Configuration

### For Local Development
1. Copy `js/config.template.js` to `js/config.js`
2. Get an API key from [OpenSea](https://docs.opensea.io/reference/api-keys)
3. Add your API key to `js/config.js`
4. Make sure `js/config.js` is in `.gitignore` (already configured)

### For GitHub Pages / Production Use
The API key is securely injected during the build process using GitHub Secrets. See the deployment section above for setup instructions.

The app will show:
- Current listing prices for NFTs that are for sale
- "Not listed" for NFTs that aren't currently for sale
- A filter to show only listed NFTs

⚠️ **Security Notes**: 
- API keys are stored as GitHub Secrets and injected during build
- Never commit API keys directly to the repository
- Set domain restrictions on your OpenSea API key for additional security
- The API key will be visible in the browser's JavaScript, so use domain restrictions

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