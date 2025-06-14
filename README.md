# 🤙 Good Vibes Club (GVC) NFT Browser

A modern, feature-rich NFT browser application for exploring the Good Vibes Club collection. Built with React, TypeScript, and Material-UI, featuring advanced filtering, sorting, badge display, and real-time market data integration.

## ✨ Features

### 🔍 **Advanced Search & Filtering**
- **Smart Search**: Autocomplete with trait suggestions and token ID search
- **Multi-Filter System**: Filter by traits, badges, colors, rarity, and listing status
- **Real-time Results**: Instant filtering with smooth animations

### 🏆 **Badge System**
- **Visual Badges**: Display NFT badges with beautiful icons
- **Badge Filtering**: Filter NFTs by specific badge types
- **Rich Tooltips**: Hover for detailed badge information

### 📊 **Market Integration**
- **OpenSea Integration**: Real-time listing data and prices
- **Price Sorting**: Sort by price (ascending/descending)
- **Market Status**: Listed vs unlisted NFT identification

### 🎨 **Modern UI/UX**
- **Responsive Design**: Optimized for desktop and mobile
- **Dark Theme**: Sleek dark interface with blue accents
- **Particle Effects**: Animated background particles
- **Smooth Transitions**: Polished animations throughout

### ⚡ **Performance Optimized**
- **Infinite Scroll**: Efficient loading of large NFT collections
- **Virtual Rendering**: Handle thousands of NFTs smoothly
- **Web Workers**: CSV processing without UI blocking
- **Image Lazy Loading**: Optimized image loading with IPFS fallbacks

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/gvc-browser.git
   cd gvc-browser
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenSea API key:
   ```
   OPENSEA_API_KEY=your_opensea_api_key_here
   ```
   
   > Get your API key from [OpenSea API Documentation](https://docs.opensea.io/reference/api-keys)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── NFTCard.tsx     # Individual NFT display
│   ├── NFTGrid.tsx     # NFT collection grid
│   ├── FilterSidebar/  # Filtering interface
│   ├── BadgeIcon.tsx   # Badge display components
│   └── Particles.tsx   # Background effects
├── contexts/           # React context providers
│   ├── FiltersContext.tsx  # Filter state management
│   └── ListingsContext.tsx # Market data management
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
│   ├── badges.ts       # Badge data processing
│   ├── csv.ts          # CSV parsing utilities
│   └── ipfs.ts         # IPFS gateway handling
├── workers/            # Web Workers
│   └── csvWorker.ts    # Background CSV processing
└── types.ts            # TypeScript definitions
```

## 🎯 Core Features Explained

### Badge System
The application features a comprehensive badge system where NFTs can have up to 5 different badges. Each badge has:
- Visual icon representation
- Human-readable display names
- Filtering capabilities
- Search integration

### Smart Filtering
- **Trait-based**: Filter by any NFT trait (background, body, face, hair, etc.)
- **Badge-based**: Filter by specific badges
- **Market-based**: Show only listed NFTs
- **Search-based**: Find specific token IDs or trait values

### Performance Features
- **Virtual Scrolling**: Efficiently render large lists
- **Web Workers**: Process CSV data without blocking UI
- **Debounced Search**: Optimized search input handling
- **IPFS Resilience**: Multiple gateway fallbacks for images

## 🎨 Technologies Used

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI (MUI)
- **Build Tool**: Vite
- **3D Graphics**: OGL (WebGL)
- **State Management**: React Context API
- **Data Processing**: Web Workers
- **Styling**: CSS-in-JS + CSS Modules

## 🔧 Configuration

### Environment Variables
- `OPENSEA_API_KEY` - OpenSea API key for market data

### Collection Configuration
Edit `src/config.ts` to customize:
- IPFS gateways
- Collection contract address
- OpenSea collection slug

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

**Powered with Vibes by [Dappunk](https://x.com/dapppunk) & [H4shkid](https://x.com/h4shkid)**

- Good Vibes Club community
- OpenSea API
- IPFS network providers
- Material-UI team

---

*Built with ❤️ for the Good Vibes Club community*