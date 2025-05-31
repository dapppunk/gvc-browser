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

// Extract unique values for each filterable attribute with hierarchical structure
function extractFilterOptions() {
    // Define the hierarchical structure
    filterOptions = {
        gender: {},
        type_color: {},
        type_type: {},
        background: {
            main: {},
            byType: {}
        },
        body: {
            main: {},
            byType: {}
        },
        face: {
            main: {},
            byType: {}
        },
        hair: {
            main: {},
            byType: {}
        }
    };
    
    allNFTs.forEach(nft => {
        // Gender
        if (nft.gender) {
            filterOptions.gender[nft.gender] = (filterOptions.gender[nft.gender] || 0) + 1;
        }
        
        // Type Color
        if (nft.type_color) {
            filterOptions.type_color[nft.type_color] = (filterOptions.type_color[nft.type_color] || 0) + 1;
        }
        
        // Background - hierarchical
        if (nft.background_type) {
            filterOptions.background.main[nft.background_type] = (filterOptions.background.main[nft.background_type] || 0) + 1;
            
            if (!filterOptions.background.byType[nft.background_type]) {
                filterOptions.background.byType[nft.background_type] = {};
            }
            if (nft.background) {
                filterOptions.background.byType[nft.background_type][nft.background] = 
                    (filterOptions.background.byType[nft.background_type][nft.background] || 0) + 1;
            }
        }
        
        // Body - hierarchical
        if (nft.body_type) {
            filterOptions.body.main[nft.body_type] = (filterOptions.body.main[nft.body_type] || 0) + 1;
            
            if (!filterOptions.body.byType[nft.body_type]) {
                filterOptions.body.byType[nft.body_type] = {};
            }
            if (nft.body) {
                filterOptions.body.byType[nft.body_type][nft.body] = 
                    (filterOptions.body.byType[nft.body_type][nft.body] || 0) + 1;
            }
        }
        
        // Face - hierarchical
        if (nft.face_type) {
            filterOptions.face.main[nft.face_type] = (filterOptions.face.main[nft.face_type] || 0) + 1;
            
            if (!filterOptions.face.byType[nft.face_type]) {
                filterOptions.face.byType[nft.face_type] = {};
            }
            if (nft.face) {
                filterOptions.face.byType[nft.face_type][nft.face] = 
                    (filterOptions.face.byType[nft.face_type][nft.face] || 0) + 1;
            }
        }
        
        // Hair - hierarchical
        if (nft.hair_type) {
            filterOptions.hair.main[nft.hair_type] = (filterOptions.hair.main[nft.hair_type] || 0) + 1;
            
            if (!filterOptions.hair.byType[nft.hair_type]) {
                filterOptions.hair.byType[nft.hair_type] = {};
            }
            if (nft.hair) {
                filterOptions.hair.byType[nft.hair_type][nft.hair] = 
                    (filterOptions.hair.byType[nft.hair_type][nft.hair] || 0) + 1;
            }
        }
        
        // Type Type - simple
        if (nft.type_type) {
            filterOptions.type_type[nft.type_type] = (filterOptions.type_type[nft.type_type] || 0) + 1;
        }
    });
}

// Render filter UI
function renderFilters() {
    const container = document.getElementById('filters-container');
    container.innerHTML = '';
    
    // Add "Listed" filter at the top (starts expanded)
    const listedFilterGroup = document.createElement('div');
    listedFilterGroup.className = 'filter-group'; // No 'collapsed' class - starts expanded
    
    const listedTitle = document.createElement('h3');
    listedTitle.textContent = 'Market Status';
    listedTitle.onclick = () => toggleFilterGroup(listedFilterGroup);
    listedFilterGroup.appendChild(listedTitle);
    
    const listedOptionsContainer = document.createElement('div');
    listedOptionsContainer.className = 'filter-options';
    
    const listedDiv = document.createElement('div');
    listedDiv.className = 'filter-option';
    
    const listedCheckbox = document.createElement('input');
    listedCheckbox.type = 'checkbox';
    listedCheckbox.id = 'special-listed';
    listedCheckbox.addEventListener('change', () => handleSpecialFilterChange('listed', listedCheckbox.checked));
    
    const listedLabel = document.createElement('label');
    listedLabel.htmlFor = listedCheckbox.id;
    listedLabel.innerHTML = `Listed for Sale <span class="filter-count">(0)</span>`;
    
    listedDiv.appendChild(listedCheckbox);
    listedDiv.appendChild(listedLabel);
    listedOptionsContainer.appendChild(listedDiv);
    
    listedFilterGroup.appendChild(listedOptionsContainer);
    container.appendChild(listedFilterGroup);
    
    // Gender filter
    const genderGroup = createSimpleFilterGroup(
        'gender', 
        'Gender',
        filterOptions.gender,
        true // Add spacer for alignment
    );
    container.appendChild(genderGroup);
    
    // Type filter
    const typeGroup = createSimpleFilterGroup(
        'type_type', 
        'Type',
        filterOptions.type_type,
        true // Add spacer for alignment
    );
    container.appendChild(typeGroup);
    
    // Type Color filter (after Type)
    const typeColorGroup = createSimpleFilterGroup(
        'type_color', 
        'Type Color',
        filterOptions.type_color,
        true // Add spacer for alignment
    );
    container.appendChild(typeColorGroup);
    
    // Hierarchical filters (Body, Face, Hair)
    const hierarchicalFilters = [
        { key: 'body', label: 'Body' },
        { key: 'face', label: 'Face' },
        { key: 'hair', label: 'Hair' }
    ];
    
    hierarchicalFilters.forEach(({ key, label }) => {
        const filterGroup = createHierarchicalFilterGroup(key, label, filterOptions[key]);
        container.appendChild(filterGroup);
    });
    
    // Background filter (last)
    const backgroundGroup = createHierarchicalFilterGroup('background', 'Background', filterOptions.background);
    container.appendChild(backgroundGroup);
}

// Create simple filter group
function createSimpleFilterGroup(attribute, label, options, addSpacer = false) {
    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group collapsed'; // Start collapsed
    
    const title = document.createElement('h3');
    title.textContent = label;
    title.onclick = () => toggleFilterGroup(filterGroup);
    filterGroup.appendChild(title);
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'filter-options';
    
    Object.entries(options)
        .sort((a, b) => b[1] - a[1])
        .forEach(([value, count]) => {
            const optionDiv = createFilterOption(attribute, value, count, false, addSpacer);
            optionsContainer.appendChild(optionDiv);
        });
    
    filterGroup.appendChild(optionsContainer);
    return filterGroup;
}

// Create hierarchical filter group
function createHierarchicalFilterGroup(attribute, label, data) {
    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group collapsed'; // Start collapsed
    
    const title = document.createElement('h3');
    title.textContent = label;
    title.onclick = () => toggleFilterGroup(filterGroup);
    filterGroup.appendChild(title);
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'filter-options';
    
    // Sort main categories by count
    Object.entries(data.main)
        .sort((a, b) => b[1] - a[1])
        .forEach(([mainValue, mainCount]) => {
            // Create a container for this category and its subcategories
            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'category-container';
            
            // Add main category with expand/collapse capability
            const mainOptionDiv = document.createElement('div');
            mainOptionDiv.className = 'filter-option main-category';
            
            // Special handling for Background - only show subcategories for "1 of 1"
            const showSubcategories = attribute === 'background' ? mainValue === '1 of 1' : true;
            
            // Add expand/collapse arrow for categories with subcategories
            const hasSubcategories = showSubcategories && data.byType[mainValue] && Object.keys(data.byType[mainValue]).length > 0;
            if (hasSubcategories) {
                const arrow = document.createElement('span');
                arrow.className = 'category-arrow';
                arrow.innerHTML = '▶';
                arrow.onclick = (e) => {
                    e.stopPropagation();
                    toggleCategory(categoryContainer);
                };
                mainOptionDiv.appendChild(arrow);
            } else {
                // Add spacer for alignment when there's no arrow
                const spacer = document.createElement('span');
                spacer.className = 'category-arrow-spacer';
                mainOptionDiv.appendChild(spacer);
            }
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${attribute}_type-${mainValue.replace(/\s+/g, '-')}`;
            checkbox.value = mainValue;
            checkbox.addEventListener('change', () => handleFilterChange(`${attribute}_type`, mainValue, checkbox.checked));
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.innerHTML = `${mainValue} <span class="filter-count">(${mainCount})</span>`;
            
            mainOptionDiv.appendChild(checkbox);
            mainOptionDiv.appendChild(label);
            categoryContainer.appendChild(mainOptionDiv);
            
            // Add subcategories container if they exist and should be shown
            if (hasSubcategories && showSubcategories) {
                const subContainer = document.createElement('div');
                subContainer.className = 'subcategories-container collapsed';
                
                Object.entries(data.byType[mainValue])
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([subValue, subCount]) => {
                        const subOption = createFilterOption(attribute, subValue, subCount, true);
                        subContainer.appendChild(subOption);
                    });
                
                categoryContainer.appendChild(subContainer);
            }
            
            optionsContainer.appendChild(categoryContainer);
        });
    
    filterGroup.appendChild(optionsContainer);
    return filterGroup;
}

// Toggle category expansion
function toggleCategory(categoryContainer) {
    const arrow = categoryContainer.querySelector('.category-arrow');
    const subContainer = categoryContainer.querySelector('.subcategories-container');
    
    if (subContainer) {
        subContainer.classList.toggle('collapsed');
        arrow.innerHTML = subContainer.classList.contains('collapsed') ? '▶' : '▼';
    }
}

// Create individual filter option
function createFilterOption(attribute, value, count, isSubFilter, addSpacer = false) {
    const optionDiv = document.createElement('div');
    optionDiv.className = isSubFilter ? 'filter-option sub-filter' : 'filter-option';
    
    // Add spacer for alignment if requested
    if (addSpacer && !isSubFilter) {
        const spacer = document.createElement('span');
        spacer.className = 'category-arrow-spacer';
        optionDiv.appendChild(spacer);
    }
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${attribute}-${value.replace(/\s+/g, '-')}`;
    checkbox.value = value;
    checkbox.addEventListener('change', () => handleFilterChange(attribute, value, checkbox.checked));
    
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.innerHTML = `${value} <span class="filter-count">(${count})</span>`;
    
    optionDiv.appendChild(checkbox);
    optionDiv.appendChild(label);
    
    return optionDiv;
}

// Toggle filter group collapse
function toggleFilterGroup(filterGroup) {
    filterGroup.classList.toggle('collapsed');
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
    let priceHTML = 'Checking...';
    if (nftListings[nft.token_id] !== undefined) {
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
        let nextCursor = null;
        let pageCount = 0;
        let totalProcessed = 0;
        
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
                // Process listings from this page immediately
                data.listings.forEach(listing => {
                    try {
                        const tokenId = listing.protocol_data.parameters.offer[0].identifierOrCriteria;
                        const priceData = listing.price.current;
                        const priceInEth = parseFloat(priceData.value) / Math.pow(10, priceData.decimals);
                        
                        nftListings[tokenId] = {
                            hasActivity: true,
                            price: priceInEth,
                            listing: listing
                        };
                        
                        totalProcessed++;
                    } catch (err) {
                        console.error('Error processing listing:', err, listing);
                    }
                });
                
                nextCursor = data.next;
                pageCount++;
                console.log(`Loaded page ${pageCount}, total listings so far: ${totalProcessed}`);
                
                // Update display after each page
                updateListedFilter();
                updateDisplay();
                
                // Add a small delay to avoid rate limits
                if (nextCursor) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } else {
                break;
            }
            
        } while (nextCursor && pageCount < 20); // Limit to 20 pages max to avoid infinite loops
        
        console.log(`Total listings loaded: ${totalProcessed}`);
        
        // Mark all non-listed NFTs after all pages are loaded
        allNFTs.forEach(nft => {
            if (!nftListings[nft.token_id]) {
                nftListings[nft.token_id] = {
                    hasActivity: false
                };
            }
        });
        
        // Final update
        updateListedFilter();
        updateDisplay();
        
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