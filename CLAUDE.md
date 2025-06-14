# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production 
- `npm run preview` - Preview production build
- `npm test` - Run tests with Vitest

## Architecture Overview

This is a React + TypeScript NFT browser application for the Good Vibes Club collection. Key architectural patterns:

### Data Flow Architecture
- **CSV Data Loading**: NFT data loaded from `public/data/gvc_data.csv` using Web Workers (`src/workers/csvWorker.ts`)
- **Context-Based State**: Multiple React contexts manage different aspects:
  - `FiltersContext` - Filter states and search functionality
  - `ListingsContext` - NFT listing data from OpenSea
  - `ThemeContext` - Theme switching (dark/light mode)

### Component Structure
- **NFTGrid**: Main display component with infinite scroll and virtualization
- **FilterSidebar**: Complex filtering UI with trait-based filters
- **AppHeader**: Search, sorting, and statistics display
- **Particles**: WebGL background animation using OGL library

### Performance Optimizations
- Web Workers for CSV parsing to avoid blocking main thread
- Infinite scroll with virtualized rendering for large datasets
- Debounced search with autocomplete suggestions
- Lazy loading for NFT images
- Component memoization for expensive renders

### Data Models
- Primary NFT interface with flattened CSV structure (see `src/types.ts`)
- Trait system with nested filtering capabilities
- Search suggestions with trait-based autocomplete

## Key Technical Details

### Search System
The search functionality supports both token ID search and trait-based filtering with autocomplete suggestions generated from the dataset.

### Filter Architecture
Filters are organized hierarchically with dependent relationships (e.g., body types affect available body options). The system maintains filter counts and handles complex multi-criteria filtering.

### CSV Processing
Large CSV files are processed in Web Workers to maintain UI responsiveness. The data structure is optimized for filtering and search operations.

### IPFS Integration
Multiple IPFS gateways configured for image loading resilience (`src/config.ts`).

## Environment Variables
- `OPENSEA_API_KEY` - OpenSea API key for listing data