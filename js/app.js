// Global variables
let allNFTs = [];
let filteredNFTs = [];
let filters = {};
let filterOptions = {};
let nftListings = {}; // Store listing data for each NFT

// IPFS gateway - ordered by speed based on benchmark results
const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',           // Fastest: 1149ms
    'https://ipfs.filebase.io/ipfs/',  // 1667ms
    'https://gateway.ipfs.io/ipfs/',   // 1914ms
    'https://dweb.link/ipfs/',         // 2076ms
    'https://nftstorage.link/ipfs/',   // 2186ms
    'https://w3s.link/ipfs/',          // 2527ms
    'https://gateway.pinata.cloud/ipfs/' // 2875ms
];
const IPFS_GATEWAY = IPFS_GATEWAYS[0]; // Primary gateway

// OpenSea API configuration
const OPENSEA_API_BASE = 'https://api.opensea.io/api/v2';
const COLLECTION_CONTRACT = '0xb8ea78fcacef50d41375e44e6814ebba36bb33c4'; // Good Vibes Club contract
const OPENSEA_COLLECTION_SLUG = 'good-vibes-club';
const CHAIN = 'ethereum'; // Chain identifier for OpenSea API

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Load NFT data first but don't display yet
    await loadNFTData();
    setupEventListeners();
    
    // Show loading message
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').textContent = 'Impending Vibes...';
    
    // Load cheapest listings first and display only those
    await loadAndDisplayCheapestListings();
    
    // Then load remaining listings in background
    loadRemainingListings();
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
        
        // Don't render anything yet - wait for listings to load
        filteredNFTs = [];
        
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
        color_group: {},
        type_color: {},
        type_type: {},
        body_color: {},
        hair_color: {},
        face_color: {},
        body: {
            main: {},
            byType: {}
        },
        background: {
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
        
        // Color Group
        if (nft.color_group) {
            filterOptions.color_group[nft.color_group] = (filterOptions.color_group[nft.color_group] || 0) + 1;
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
        
        // Body - hierarchical with body_style
        if (nft.body_type) {
            filterOptions.body.main[nft.body_type] = (filterOptions.body.main[nft.body_type] || 0) + 1;
            
            if (!filterOptions.body.byType[nft.body_type]) {
                filterOptions.body.byType[nft.body_type] = {};
            }
            if (nft.body_style) {
                filterOptions.body.byType[nft.body_type][nft.body_style] = 
                    (filterOptions.body.byType[nft.body_type][nft.body_style] || 0) + 1;
            }
        }
        
        // Body Color - simple
        if (nft.body_color) {
            filterOptions.body_color[nft.body_color] = (filterOptions.body_color[nft.body_color] || 0) + 1;
        }
        
        // Face - hierarchical with face_style
        if (nft.face_type) {
            filterOptions.face.main[nft.face_type] = (filterOptions.face.main[nft.face_type] || 0) + 1;
            
            if (!filterOptions.face.byType[nft.face_type]) {
                filterOptions.face.byType[nft.face_type] = {};
            }
            if (nft.face_style) {
                filterOptions.face.byType[nft.face_type][nft.face_style] = 
                    (filterOptions.face.byType[nft.face_type][nft.face_style] || 0) + 1;
            }
        }
        
        // Face Color - simple (only for face_type = "Glasses")
        if (nft.face_color && nft.face_type === 'Glasses') {
            filterOptions.face_color[nft.face_color] = (filterOptions.face_color[nft.face_color] || 0) + 1;
        }
        
        // Hair - hierarchical with hair_style
        if (nft.hair_type) {
            filterOptions.hair.main[nft.hair_type] = (filterOptions.hair.main[nft.hair_type] || 0) + 1;
            
            if (!filterOptions.hair.byType[nft.hair_type]) {
                filterOptions.hair.byType[nft.hair_type] = {};
            }
            if (nft.hair_style) {
                filterOptions.hair.byType[nft.hair_type][nft.hair_style] = 
                    (filterOptions.hair.byType[nft.hair_type][nft.hair_style] || 0) + 1;
            }
        }
        
        // Hair Color - simple (only for hair_type = "Hair")
        if (nft.hair_color && nft.hair_type === 'Hair') {
            filterOptions.hair_color[nft.hair_color] = (filterOptions.hair_color[nft.hair_color] || 0) + 1;
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
    listedLabel.innerHTML = `Listed <span class="filter-count">(0)</span>`;
    
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
    
    // Color Group filter
    const colorGroupFilter = createSimpleFilterGroup(
        'color_group', 
        'Color Group',
        filterOptions.color_group,
        true // Add spacer for alignment
    );
    container.appendChild(colorGroupFilter);
    
    // Type filter
    const typeGroup = createSimpleFilterGroup(
        'type_type', 
        'Type',
        filterOptions.type_type,
        true // Add spacer for alignment
    );
    container.appendChild(typeGroup);
    
    // Type Color filter
    const typeColorGroup = createSimpleFilterGroup(
        'type_color', 
        'Type Color',
        filterOptions.type_color,
        true // Add spacer for alignment
    );
    container.appendChild(typeColorGroup);
    
    // Body filter (hierarchical)
    const bodyGroup = createHierarchicalFilterGroup('body', 'Body', filterOptions.body);
    container.appendChild(bodyGroup);
    
    // Body Color filter
    const bodyColorGroup = createSimpleFilterGroup(
        'body_color', 
        'Body Color',
        filterOptions.body_color,
        true // Add spacer for alignment
    );
    container.appendChild(bodyColorGroup);
    
    // Face filter (hierarchical)
    const faceGroup = createHierarchicalFilterGroup('face', 'Face', filterOptions.face);
    container.appendChild(faceGroup);
    
    // Face Color filter
    const faceColorGroup = createSimpleFilterGroup(
        'face_color', 
        'Face Color',
        filterOptions.face_color,
        true // Add spacer for alignment
    );
    container.appendChild(faceColorGroup);
    
    // Hair filter (hierarchical)
    const hairGroup = createHierarchicalFilterGroup('hair', 'Hair', filterOptions.hair);
    container.appendChild(hairGroup);
    
    // Hair Color filter
    const hairColorGroup = createSimpleFilterGroup(
        'hair_color', 
        'Hair Color',
        filterOptions.hair_color,
        true // Add spacer for alignment
    );
    container.appendChild(hairColorGroup);
    
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
                        // Use specific attribute for subcategories
                        let subAttribute = attribute;
                        if (attribute === 'body') subAttribute = 'body_style';
                        else if (attribute === 'hair') subAttribute = 'hair_style';
                        else if (attribute === 'face') subAttribute = 'face_style';
                        
                        const subOption = createFilterOption(subAttribute, subValue, subCount, true);
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
    
    // Check if we should show all NFTs or only listed ones
    const showOnlyListed = Object.keys(nftListings).length === 0 || 
                          (filters.special && filters.special.has('listed'));
    
    // Start with either all NFTs or only those with listings
    let nftsToFilter;
    if (showOnlyListed && Object.keys(nftListings).length > 0) {
        const listedTokenIds = Object.keys(nftListings).filter(tokenId => 
            nftListings[tokenId].hasActivity
        );
        nftsToFilter = allNFTs.filter(nft => listedTokenIds.includes(String(nft.token_id)));
    } else if (Object.keys(nftListings).length === 0) {
        // No listings loaded yet, show nothing
        nftsToFilter = [];
    } else {
        // Show all NFTs
        nftsToFilter = allNFTs;
    }
    
    filteredNFTs = nftsToFilter.filter(nft => {
        // Search filter
        if (searchTerm) {
            const searchableText = `${nft.token_id} ${nft.gender} ${nft.background} ${nft.body} ${nft.face} ${nft.hair} ${nft.type} ${nft.color_group || ''}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) {
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
                const aListing = nftListings[String(a.token_id)];
                const bListing = nftListings[String(b.token_id)];
                
                // If neither has listing data yet, sort by token ID
                if (!aListing && !bListing) return parseInt(a.token_id) - parseInt(b.token_id);
                
                // Items with listing data come first
                if (!aListing) return 1;
                if (!bListing) return -1;
                
                // If neither is listed, sort by token ID
                if (!aListing.hasActivity && !bListing.hasActivity) return parseInt(a.token_id) - parseInt(b.token_id);
                
                // Listed items come before non-listed
                if (!aListing.hasActivity) return 1;
                if (!bListing.hasActivity) return -1;
                
                // Both are listed, sort by price
                return aListing.price - bListing.price;
            });
            break;
        case 'price_desc':
            // Sort by price descending, with non-listed items at the end
            filteredNFTs.sort((a, b) => {
                const aListing = nftListings[String(a.token_id)];
                const bListing = nftListings[String(b.token_id)];
                
                // If neither has listing data yet, sort by token ID
                if (!aListing && !bListing) return parseInt(a.token_id) - parseInt(b.token_id);
                
                // Items with listing data come first
                if (!aListing) return 1;
                if (!bListing) return -1;
                
                // If neither is listed, sort by token ID
                if (!aListing.hasActivity && !bListing.hasActivity) return parseInt(a.token_id) - parseInt(b.token_id);
                
                // Listed items come before non-listed
                if (!aListing.hasActivity) return 1;
                if (!bListing.hasActivity) return -1;
                
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

// Render NFT cards with pagination for better performance
function renderNFTs() {
    const grid = document.getElementById('nfts-grid');
    grid.innerHTML = '';
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Render first 100 NFTs immediately
    const firstBatch = filteredNFTs.slice(0, 100);
    firstBatch.forEach(nft => {
        const card = createNFTCard(nft);
        fragment.appendChild(card);
    });
    grid.appendChild(fragment);
    
    // Render remaining NFTs in chunks
    if (filteredNFTs.length > 100) {
        let currentIndex = 100;
        const renderChunk = () => {
            const chunk = document.createDocumentFragment();
            const endIndex = Math.min(currentIndex + 100, filteredNFTs.length);
            
            for (let i = currentIndex; i < endIndex; i++) {
                const card = createNFTCard(filteredNFTs[i]);
                chunk.appendChild(card);
            }
            
            grid.appendChild(chunk);
            currentIndex = endIndex;
            
            if (currentIndex < filteredNFTs.length) {
                requestAnimationFrame(renderChunk);
            }
        };
        requestAnimationFrame(renderChunk);
    }
}

// Create NFT card element
function createNFTCard(nft) {
    const card = document.createElement('div');
    card.className = 'nft-card';
    card.onclick = () => showNFTModal(nft);
    
    // Convert IPFS URL to gateway URL
    const imageUrl = nft.image_original_url.replace('ipfs://', IPFS_GATEWAY);
    
    // Check if we already have listing data
    let priceHTML = 'Not listed';
    const listing = nftListings[String(nft.token_id)];
    if (listing && listing.hasActivity) {
        priceHTML = `${listing.price.toFixed(3)} ETH`;
    }
    
    // Use placeholder and lazy load with loading indicator
    card.innerHTML = `
        <div class="nft-image-container">
            <img class="nft-image" 
                 data-src="${imageUrl}" 
                 src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='sans-serif'%3E%23${nft.token_id}%3C/text%3E%3C/svg%3E"
                 alt="GVC #${nft.token_id}" 
                 loading="lazy">
            <div class="image-loader"></div>
        </div>
        <div class="nft-info">
            <div class="nft-price-container">
                <a href="https://opensea.io/assets/ethereum/${COLLECTION_CONTRACT}/${nft.token_id}" 
                   target="_blank" 
                   class="nft-price-link"
                   onclick="event.stopPropagation()">
                    <span class="nft-price" id="price-${nft.token_id}">${priceHTML}</span>
                    <img src="images/opensea-logo.svg" alt="View on OpenSea" class="opensea-icon">
                </a>
            </div>
            <div class="nft-title">${nft.token_id}</div>
        </div>
    `;
    
    // Lazy load images with fallback gateways
    const img = card.querySelector('.nft-image');
    let gatewayIndex = 0;
    let loadAttempted = false;
    
    const loadImageWithFallback = () => {
        if (loadAttempted) return; // Prevent multiple attempts
        loadAttempted = true;
        
        const tryNextGateway = () => {
            if (gatewayIndex >= IPFS_GATEWAYS.length) {
                // All gateways failed, show placeholder
                img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='sans-serif' font-size='14'%3EGVC %23" + nft.token_id + "%3C/text%3E%3C/svg%3E";
                img.classList.add('loaded');
                return;
            }
            
            const currentGateway = IPFS_GATEWAYS[gatewayIndex];
            const imageUrl = nft.image_original_url.replace('ipfs://', currentGateway);
            
            // Set image source directly
            img.src = imageUrl;
            
            // Set up timeout
            const timeoutId = setTimeout(() => {
                gatewayIndex++;
                tryNextGateway();
            }, 5000); // 5 second timeout per gateway
            
            img.onload = () => {
                clearTimeout(timeoutId);
                img.classList.add('loaded');
                img.onload = null;
                img.onerror = null;
            };
            
            img.onerror = () => {
                clearTimeout(timeoutId);
                gatewayIndex++;
                tryNextGateway();
            };
        };
        
        tryNextGateway();
    };
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImageWithFallback();
                    imageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        imageObserver.observe(img);
    } else {
        // Fallback - load immediately
        loadImageWithFallback();
    }
    
    return card;
}

// This function is no longer needed as we load all listings in batch
// Keeping it empty to avoid breaking any existing calls
function loadNFTPrice(tokenId) {
    // Prices are loaded in batch by loadAllListings()
}

// Load and display cheapest listings first
async function loadAndDisplayCheapestListings() {
    try {
        const options = {
            headers: {
                'X-API-KEY': CONFIG.OPENSEA_API_KEY,
                'Accept': 'application/json'
            }
        };
        
        console.log('Loading cheapest listings first...');
        // Use the collection best listings endpoint to get the absolute cheapest
        const url = `${OPENSEA_API_BASE}/listings/collection/${OPENSEA_COLLECTION_SLUG}/best?limit=100`;
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (data && data.listings && data.listings.length > 0) {
            console.log(`Loaded ${data.listings.length} best (cheapest) listings`);
            
            // Process listings and collect token IDs
            const listedTokenIds = [];
            data.listings.forEach(listing => {
                try {
                    const tokenId = String(listing.protocol_data.parameters.offer[0].identifierOrCriteria);
                    const priceData = listing.price.current;
                    const priceInEth = parseFloat(priceData.value) / Math.pow(10, priceData.decimals);
                    
                    nftListings[tokenId] = {
                        hasActivity: true,
                        price: priceInEth,
                        listing: listing
                    };
                    
                    listedTokenIds.push(tokenId);
                } catch (err) {
                    console.error('Error processing listing:', err);
                }
            });
            
            // Hide loading and apply current filters
            document.getElementById('loading').style.display = 'none';
            
            // Apply filters instead of directly setting filteredNFTs
            applyFilters();
            
            console.log(`Displaying ${filteredNFTs.length} listed NFTs`);
        }
    } catch (error) {
        console.error('Error loading cheapest listings:', error);
        document.getElementById('loading').style.display = 'none';
    }
}

// Load remaining listings in background
async function loadRemainingListings() {
    try {
        const options = {
            headers: {
                'X-API-KEY': CONFIG.OPENSEA_API_KEY,
                'Accept': 'application/json'
            }
        };
        
        console.log('Loading remaining listings in background...');
        const loadedTokens = new Set(Object.keys(nftListings));
        let nextCursor = null;
        let pageCount = 0;
        
        do {
            const url = nextCursor 
                ? `${OPENSEA_API_BASE}/listings/collection/${OPENSEA_COLLECTION_SLUG}/all?limit=100&next=${nextCursor}`
                : `${OPENSEA_API_BASE}/listings/collection/${OPENSEA_COLLECTION_SLUG}/all?limit=100`;
            
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (data && data.listings) {
                data.listings.forEach(listing => {
                    try {
                        const tokenId = String(listing.protocol_data.parameters.offer[0].identifierOrCriteria);
                        
                        if (!loadedTokens.has(tokenId)) {
                            const priceData = listing.price.current;
                            const priceInEth = parseFloat(priceData.value) / Math.pow(10, priceData.decimals);
                            
                            nftListings[tokenId] = {
                                hasActivity: true,
                                price: priceInEth,
                                listing: listing
                            };
                            loadedTokens.add(tokenId);
                            
                            // Update price display if element is visible
                            const priceElement = document.getElementById(`price-${tokenId}`);
                            if (priceElement) {
                                priceElement.textContent = `${priceInEth.toFixed(3)} ETH`;
                            }
                        }
                    } catch (err) {
                        console.error('Error processing listing:', err);
                    }
                });
                
                nextCursor = data.next;
                pageCount++;
                
                // Periodically update the display with current filters
                if (pageCount % 5 === 0) {
                    applyFilters();
                    updateListedFilter();
                }
            } else {
                break;
            }
        } while (nextCursor && pageCount < 30);
        
        // Final update - apply current filters
        console.log(`Total listings loaded: ${Object.keys(nftListings).length}`);
        
        // Apply filters to respect current filter state
        applyFilters();
        updateListedFilter();
    } catch (error) {
        console.error('Error loading remaining listings:', error);
    }
}


// Update the listed filter based on loaded data
function updateListedFilter() {
    const listedCheckbox = document.getElementById('special-listed');
    if (listedCheckbox) {
        const listedCount = Object.values(nftListings).filter(l => l.hasActivity).length;
        const label = listedCheckbox.nextElementSibling;
        label.innerHTML = `Listed <span class="filter-count">(${listedCount})</span>`;
    }
}

// Show NFT modal
function showNFTModal(nft) {
    const modal = document.getElementById('nft-modal');
    const modalBody = document.getElementById('modal-body');
    
    // Convert IPFS URL to gateway URL
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