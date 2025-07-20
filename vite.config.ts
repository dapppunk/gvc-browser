import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Root path for custom domain
  server: {
    port: 5173,
    proxy: {
      '/api/opensea': {
        target: 'https://api.opensea.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/opensea/, '/v2'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to OpenSea:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from OpenSea:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api/magiceden': {
        target: 'https://api-mainnet.magiceden.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/magiceden/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Magic Eden proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to Magic Eden:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Magic Eden:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api/alchemy': {
        target: 'https://eth-mainnet.g.alchemy.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/alchemy/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Alchemy proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to Alchemy:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Alchemy:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api/reservoir': {
        target: 'https://api.reservoir.tools',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/reservoir/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Reservoir proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to Reservoir:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Reservoir:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
}); 