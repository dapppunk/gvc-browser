// Global variables
let allNFTs = [];
let filteredNFTs = [];
let filters = {};
let filterOptions = {};
let nftListings = {}; // Store listing data for each NFT

// IPFS gateway - using a public gateway
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

// OpenSea API configuration
const OPENSEA_API_BASE = 'https://api.opensea.io/api/v2';
const COLLECTION_CONTRACT = '0xb8ea78fcacef50d41375e44e6814ebba36bb33c4'; // Good Vibes Club contract
const OPENSEA_COLLECTION_SLUG = 'good-vibes-club';
const CHAIN = 'ethereum'; // Chain identifier for OpenSea API

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    await loadNFTData();
    setupEventListeners();
    // Load all active listings after a short delay
    setTimeout(loadAllListings, 1000);
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
    
    // Add special filters first
    const specialFilterGroup = document.createElement('div');
    specialFilterGroup.className = 'filter-group';
    
    const specialTitle = document.createElement('h3');
    specialTitle.textContent = 'Special Filters';
    specialFilterGroup.appendChild(specialTitle);
    
    const specialOptionsContainer = document.createElement('div');
    specialOptionsContainer.className = 'filter-options';
    
    // Add "Listed" filter
    const listedDiv = document.createElement('div');
    listedDiv.className = 'filter-option';
    
    const listedCheckbox = document.createElement('input');
    listedCheckbox.type = 'checkbox';
    listedCheckbox.id = 'special-listed';
    listedCheckbox.addEventListener('change', () => handleSpecialFilterChange('listed', listedCheckbox.checked));
    
    const listedLabel = document.createElement('label');
    listedLabel.htmlFor = listedCheckbox.id;
    listedLabel.innerHTML = `Listed/Has Activity <span class="filter-count">(0)</span>`;
    
    listedDiv.appendChild(listedCheckbox);
    listedDiv.appendChild(listedLabel);
    specialOptionsContainer.appendChild(listedDiv);
    
    specialFilterGroup.appendChild(specialOptionsContainer);
    container.appendChild(specialFilterGroup);
    
    // Add regular attribute filters
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

// Handle special filter changes
function handleSpecialFilterChange(filterType, isChecked) {
    if (!filters.special) {
        filters.special = new Set();
    }
    
    if (isChecked) {
        filters.special.add(filterType);
    } else {
        filters.special.delete(filterType);
        if (filters.special.size === 0) {
            delete filters.special;
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
        
        // Special filters
        if (filters.special && filters.special.has('listed')) {
            // Only show NFTs that have activity (sales history)
            if (!nftListings[nft.token_id] || !nftListings[nft.token_id].hasActivity) {
                return false;
            }
        }
        
        // Attribute filters
        for (const [attribute, values] of Object.entries(filters)) {
            if (attribute !== 'special' && values.size > 0 && !values.has(nft[attribute])) {
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
        case 'price_asc':
            // Sort by price ascending, with non-listed items at the end
            filteredNFTs.sort((a, b) => {
                const aListing = nftListings[a.token_id];
                const bListing = nftListings[b.token_id];
                
                // If neither is listed, maintain original order
                if (!aListing?.hasActivity && !bListing?.hasActivity) return 0;
                
                // Listed items come before non-listed
                if (!aListing?.hasActivity) return 1;
                if (!bListing?.hasActivity) return -1;
                
                // Both are listed, sort by price
                return aListing.price - bListing.price;
            });
            break;
        case 'price_desc':
            // Sort by price descending, with non-listed items at the end
            filteredNFTs.sort((a, b) => {
                const aListing = nftListings[a.token_id];
                const bListing = nftListings[b.token_id];
                
                // If neither is listed, maintain original order
                if (!aListing?.hasActivity && !bListing?.hasActivity) return 0;
                
                // Listed items come before non-listed
                if (!aListing?.hasActivity) return 1;
                if (!bListing?.hasActivity) return -1;
                
                // Both are listed, sort by price
                return bListing.price - aListing.price;
            });
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
    
    // Check if we already have listing data
    let priceHTML = 'Loading price...';
    if (nftListings[nft.token_id]) {
        if (nftListings[nft.token_id].hasActivity) {
            priceHTML = `${nftListings[nft.token_id].price.toFixed(3)} ETH`;
        } else {
            priceHTML = 'Not listed';
        }
    }
    
    card.innerHTML = `
        <img class="nft-image" src="${imageUrl}" alt="GVC #${nft.token_id}" loading="lazy">
        <div class="nft-info">
            <div class="nft-title">GVC #${nft.token_id}</div>
            <div class="nft-traits">
                <div class="nft-trait">${nft.gender} ${nft.type_type}</div>
                <div class="nft-trait">${nft.background} Background</div>
            </div>
            <div class="nft-price" id="price-${nft.token_id}">${priceHTML}</div>
        </div>
    `;
    
    // Don't make individual API calls - we load all listings in batch
    
    return card;
}

// This function is no longer needed as we load all listings in batch
// Keeping it empty to avoid breaking any existing calls
function loadNFTPrice(tokenId) {
    // Prices are loaded in batch by loadAllListings()
}

// Load all active listings for the collection with pagination
async function loadAllListings() {
    try {
        console.log('Loading all active listings...');
        let allListings = [];
        let nextCursor = null;
        let pageCount = 0;
        
        const options = {
            headers: {
                'X-API-KEY': CONFIG.OPENSEA_API_KEY,
                'Accept': 'application/json'
            }
        };
        
        // Keep fetching until no more pages
        do {
            const url = nextCursor 
                ? `${OPENSEA_API_BASE}/listings/collection/${OPENSEA_COLLECTION_SLUG}/all?limit=100&next=${nextCursor}`
                : `${OPENSEA_API_BASE}/listings/collection/${OPENSEA_COLLECTION_SLUG}/all?limit=100`;
            
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (data && data.listings) {
                allListings = allListings.concat(data.listings);
                nextCursor = data.next;
                pageCount++;
                console.log(`Loaded page ${pageCount}, total listings so far: ${allListings.length}`);
            } else {
                break;
            }
            
            // Add a small delay to avoid rate limits
            if (nextCursor) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
        } while (nextCursor && pageCount < 20); // Limit to 20 pages max to avoid infinite loops
        
        console.log(`Total listings loaded: ${allListings.length}`);
        
        // Process all listings
        allListings.forEach(listing => {
            try {
                const tokenId = listing.protocol_data.parameters.offer[0].identifierOrCriteria;
                const priceData = listing.price.current;
                const priceInEth = parseFloat(priceData.value) / Math.pow(10, priceData.decimals);
                
                nftListings[tokenId] = {
                    hasActivity: true,
                    price: priceInEth,
                    listing: listing
                };
                
                // Update the price display if the element exists
                const priceElement = document.getElementById(`price-${tokenId}`);
                if (priceElement) {
                    priceElement.textContent = `${priceInEth.toFixed(3)} ETH`;
                }
            } catch (err) {
                console.error('Error processing listing:', err, listing);
            }
        });
        
        // Mark all non-listed NFTs
        allNFTs.forEach(nft => {
            if (!nftListings[nft.token_id]) {
                nftListings[nft.token_id] = {
                    hasActivity: false
                };
            }
        });
        
        console.log(`Processed ${Object.keys(nftListings).filter(k => nftListings[k].hasActivity).length} listed NFTs`);
        updateListedFilter();
        
        // Re-render to show the prices
        renderNFTs();
        
    } catch (error) {
        console.error('Error loading all listings:', error);
    }
}

// Update the listed filter based on loaded data
function updateListedFilter() {
    const listedCheckbox = document.getElementById('special-listed');
    if (listedCheckbox) {
        const listedCount = Object.values(nftListings).filter(l => l.hasActivity).length;
        const label = listedCheckbox.nextElementSibling;
        label.innerHTML = `Listed/Has Activity <span class="filter-count">(${listedCount})</span>`;
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
                
                <a href="https://opensea.io/assets/ethereum/${OPENSEA_COLLECTION_SLUG}/${nft.token_id}" 
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