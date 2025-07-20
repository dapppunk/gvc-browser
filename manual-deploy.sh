#!/bin/bash

echo "🚀 Manual GitHub Pages Deployment"
echo "================================"

# Build the project
echo "📦 Building project..."
npm run build

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "📁 Created temp directory: $TEMP_DIR"

# Copy dist contents
cp -r dist/* $TEMP_DIR/

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)

# Create or update gh-pages branch
echo "🌿 Creating gh-pages branch..."
git checkout --orphan gh-pages-temp

# Remove all files
git rm -rf .

# Copy built files
cp -r $TEMP_DIR/* .

# Add CNAME if needed
echo "vibescollector.com" > CNAME

# Commit
git add -A
git commit -m "Deploy to GitHub Pages - $(date)"

# Force push to gh-pages
git branch -D gh-pages 2>/dev/null || true
git branch -m gh-pages
git push origin gh-pages --force

# Return to original branch
git checkout $CURRENT_BRANCH

# Clean up
rm -rf $TEMP_DIR

echo "✅ Deployment complete!"
echo "Check: https://github.com/dapppunk/gvc-browser/settings/pages"
echo "Make sure Source is set to: Deploy from a branch > gh-pages > / (root)"