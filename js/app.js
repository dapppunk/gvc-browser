// Global variables
let allNFTs = [];
let filteredNFTs = [];
let filters = {};
let filterOptions = {};

// IPFS gateway - using a public gateway
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

// OpenSea API configuration
const OPENSEA_API_URL = 'https://api.opensea.io/api/v2';
const COLLECTION_SLUG = 'good-vibes-club'; // You'll need to replace this with actual collection slug

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    await loadNFTData();
    setupEventListeners();
});

// Load and parse CSV data
async function loadNFTData() {
    try {
        const response = await fetch('data/gvc_data.csv');
        const csvText = await response.text();
        
        // Parse CSV
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, ''));
        
        // Convert CSV to JSON
        allNFTs = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = parseCSVLine(line);
                const nft = {};
                headers.forEach((header, index) => {
                    nft[header] = values[index] || '';
                });
                return nft;
            });
        
        // Calculate rarity scores
        calculateRarity();
        
        // Initialize filters
        extractFilterOptions();
        renderFilters();
        
        // Initial render
        filteredNFTs = [...allNFTs];
        updateDisplay();
        
        document.getElementById('loading').style.display = 'none';
        
    } catch (error) {
        console.error('Error loading NFT data:', error);
        document.getElementById('loading').textContent = 'Error loading collection data';
    }
}

// Parse CSV line handling commas in values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Calculate rarity based on trait occurrences
function calculateRarity() {
    const traitCounts = {};
    const traitCategories = ['gender', 'background', 'body', 'face', 'hair', 'type'];
    
    // Count trait occurrences
    traitCategories.forEach(category => {
        traitCounts[category] = {};
        allNFTs.forEach(nft => {
            const value = nft[category];
            if (value) {
                traitCounts[category][value] = (traitCounts[category][value] || 0) + 1;
            }
        });
    });
    
    // Calculate rarity score for each NFT
    allNFTs.forEach(nft => {
        let rarityScore = 0;
        traitCategories.forEach(category => {
            const value = nft[category];
            if (value && traitCounts[category][value]) {
                rarityScore += 1 / (traitCounts[category][value] / allNFTs.length);
            }
        });
        nft.rarityScore = rarityScore;
    });
}

// Extract unique values for each filterable attribute
function extractFilterOptions() {
    const filterableAttributes = ['gender', 'background', 'body_type', 'face_type', 'hair_type', 'type_type'];
    
    filterableAttributes.forEach(attr => {
        filterOptions[attr] = {};
        allNFTs.forEach(nft => {
            const value = nft[attr];
            if (value && value.trim()) {
                filterOptions[attr][value] = (filterOptions[attr][value] || 0) + 1;
            }
        });
    });
}

// Render filter UI
function renderFilters() {
    const container = document.getElementById('filters-container');
    container.innerHTML = '';
    
    const attributeLabels = {
        'gender': 'Gender',
        'background': 'Background',
        'body_type': 'Body',
        'face_type': 'Face',
        'hair_type': 'Hair',
        'type_type': 'Type'
    };
    
    Object.entries(filterOptions).forEach(([attribute, options]) => {
        const filterGroup = document.createElement('div');
        filterGroup.className = 'filter-group';
        
        const title = document.createElement('h3');
        title.textContent = attributeLabels[attribute] || attribute;
        filterGroup.appendChild(title);
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'filter-options';
        
        Object.entries(options)
            .sort((a, b) => b[1] - a[1]) // Sort by count
            .forEach(([value, count]) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'filter-option';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `${attribute}-${value}`;
                checkbox.value = value;
                checkbox.addEventListener('change', () => handleFilterChange(attribute, value, checkbox.checked));
                
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.innerHTML = `${value} <span class="filter-count">(${count})</span>`;
                
                optionDiv.appendChild(checkbox);
                optionDiv.appendChild(label);
                optionsContainer.appendChild(optionDiv);
            });
        
        filterGroup.appendChild(optionsContainer);
        container.appendChild(filterGroup);
    });
}

// Handle filter changes
function handleFilterChange(attribute, value, isChecked) {
    if (!filters[attribute]) {
        filters[attribute] = new Set();
    }
    
    if (isChecked) {
        filters[attribute].add(value);
    } else {
        filters[attribute].delete(value);
        if (filters[attribute].size === 0) {
            delete filters[attribute];
        }
    }
    
    applyFilters();
}

// Apply all active filters
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    filteredNFTs = allNFTs.filter(nft => {
        // Search filter
        if (searchTerm) {
            const searchableText = `${nft.token_id} ${nft.gender} ${nft.background} ${nft.body} ${nft.face} ${nft.hair} ${nft.type}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }
        
        // Attribute filters
        for (const [attribute, values] of Object.entries(filters)) {
            if (values.size > 0 && !values.has(nft[attribute])) {
                return false;
            }
        }
        
        return true;
    });
    
    updateDisplay();
}

// Update the display
function updateDisplay() {
    const sortValue = document.getElementById('sort-select').value;
    sortNFTs(sortValue);
    
    renderNFTs();
    updateStats();
}

// Sort NFTs
function sortNFTs(sortBy) {
    switch(sortBy) {
        case 'token_id_asc':
            filteredNFTs.sort((a, b) => parseInt(a.token_id) - parseInt(b.token_id));
            break;
        case 'token_id_desc':
            filteredNFTs.sort((a, b) => parseInt(b.token_id) - parseInt(a.token_id));
            break;
        case 'rarity_asc':
            filteredNFTs.sort((a, b) => a.rarityScore - b.rarityScore);
            break;
        case 'rarity_desc':
            filteredNFTs.sort((a, b) => b.rarityScore - a.rarityScore);
            break;
    }
}

// Render NFT cards
function renderNFTs() {
    const grid = document.getElementById('nfts-grid');
    grid.innerHTML = '';
    
    filteredNFTs.forEach(nft => {
        const card = createNFTCard(nft);
        grid.appendChild(card);
    });
}

// Create NFT card element
function createNFTCard(nft) {
    const card = document.createElement('div');
    card.className = 'nft-card';
    card.onclick = () => showNFTModal(nft);
    
    // Convert IPFS URL to gateway URL
    const imageUrl = nft.image_original_url.replace('ipfs://', IPFS_GATEWAY);
    
    card.innerHTML = `
        <img class="nft-image" src="${imageUrl}" alt="GVC #${nft.token_id}" loading="lazy">
        <div class="nft-info">
            <div class="nft-title">GVC #${nft.token_id}</div>
            <div class="nft-traits">
                <div class="nft-trait">${nft.gender} ${nft.type_type}</div>
                <div class="nft-trait">${nft.background} Background</div>
            </div>
            <div class="nft-price" id="price-${nft.token_id}">Loading price...</div>
        </div>
    `;
    
    // Load price asynchronously
    loadNFTPrice(nft.token_id);
    
    return card;
}

// Load NFT price from OpenSea
async function loadNFTPrice(tokenId) {
    try {
        // Note: OpenSea API v2 requires API key for most endpoints
        // This is a placeholder - you'll need to implement actual OpenSea integration
        // For now, we'll show a random price for demonstration
        
        setTimeout(() => {
            const priceElement = document.getElementById(`price-${tokenId}`);
            if (priceElement) {
                // Simulate price data
                const price = (Math.random() * 2 + 0.1).toFixed(3);
                priceElement.textContent = `${price} ETH`;
            }
        }, 1000);
        
    } catch (error) {
        console.error(`Error loading price for token ${tokenId}:`, error);
    }
}

// Show NFT modal
function showNFTModal(nft) {
    const modal = document.getElementById('nft-modal');
    const modalBody = document.getElementById('modal-body');
    
    const imageUrl = nft.image_original_url.replace('ipfs://', IPFS_GATEWAY);
    
    modalBody.innerHTML = `
        <div class="modal-nft-detail">
            <div>
                <img class="modal-image" src="${imageUrl}" alt="GVC #${nft.token_id}">
            </div>
            <div class="modal-info">
                <h2>Good Vibes Club #${nft.token_id}</h2>
                
                <div class="trait-group">
                    <div class="trait-label">Gender</div>
                    <div class="trait-value">${nft.gender}</div>
                </div>
                
                <div class="trait-group">
                    <div class="trait-label">Background</div>
                    <div class="trait-value">${nft.background}</div>
                </div>
                
                <div class="trait-group">
                    <div class="trait-label">Body</div>
                    <div class="trait-value">${nft.body}</div>
                </div>
                
                <div class="trait-group">
                    <div class="trait-label">Face</div>
                    <div class="trait-value">${nft.face}</div>
                </div>
                
                <div class="trait-group">
                    <div class="trait-label">Hair</div>
                    <div class="trait-value">${nft.hair}</div>
                </div>
                
                <div class="trait-group">
                    <div class="trait-label">Type</div>
                    <div class="trait-value">${nft.type}</div>
                </div>
                
                <div class="trait-group">
                    <div class="trait-label">Rarity Score</div>
                    <div class="trait-value">${nft.rarityScore.toFixed(2)}</div>
                </div>
                
                <a href="https://opensea.io/assets/ethereum/${COLLECTION_SLUG}/${nft.token_id}" 
                   target="_blank" 
                   class="opensea-link">
                    View on OpenSea
                </a>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Update statistics
function updateStats() {
    document.getElementById('total-count').textContent = `Total: ${allNFTs.length} NFTs`;
    document.getElementById('filtered-count').textContent = 
        filteredNFTs.length < allNFTs.length ? `Showing: ${filteredNFTs.length}` : '';
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
    
    // Sort select
    document.getElementById('sort-select').addEventListener('change', updateDisplay);
    
    // Clear filters button
    document.getElementById('clear-filters').addEventListener('click', clearAllFilters);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('nft-modal').style.display = 'none';
    });
    
    // Click outside modal to close
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('nft-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Clear all filters
function clearAllFilters() {
    filters = {};
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    document.getElementById('search-input').value = '';
    applyFilters();
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}