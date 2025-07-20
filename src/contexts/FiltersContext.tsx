import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadBadgeData, getBadgeDisplayName, BadgeData } from '../utils/badges';

// URL utilities for filter persistence
const encodeFiltersToURL = (filters: Filters): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      params.set(key, value.join(','));
    } else if (typeof value === 'boolean' && value) {
      params.set(key, 'true');
    } else if (typeof value === 'string' && value) {
      params.set(key, value);
    }
  });
  
  return params.toString();
};

const decodeFiltersFromURL = (): Partial<Filters> => {
  const params = new URLSearchParams(window.location.search);
  const filters: Partial<Filters> = {};
  
  // Array filters
  const arrayFilters = ['gender', 'color_group', 'color_count', 'type_color', 'type_type', 
                       'body_color', 'hair_color', 'face_color', 'badges', 'badgeCount',
                       'body', 'background', 'face', 'hair'];
  
  arrayFilters.forEach(key => {
    const value = params.get(key);
    if (value) {
      filters[key as keyof Filters] = value.split(',').filter(Boolean) as string[];
    }
  });
  
  // Boolean filters
  if (params.get('listed') === 'true') {
    filters.listed = true;
  }
  
  // String filters
  const search = params.get('search');
  if (search) {
    filters.search = search;
  }
  
  const sort = params.get('sort');
  if (sort) {
    filters.sort = sort;
  }
  
  return filters;
};

const updateURL = (filters: Filters) => {
  const encoded = encodeFiltersToURL(filters);
  const newURL = encoded ? `${window.location.pathname}?${encoded}` : window.location.pathname;
  window.history.replaceState({}, '', newURL);
};

interface FilterOptions {
  gender: Record<string, number>;
  color_group: Record<string, number>;
  color_count: Record<string, number>;
  type_color: Record<string, number>;
  type_type: Record<string, number>;
  body_color: Record<string, number>;
  hair_color: Record<string, number>;
  face_color: Record<string, number>;
  badges: Record<string, number>;
  badgeCount: Record<string, number>;
  // Additional individual trait fields for comprehensive search
  background: Record<string, number>;
  background_type: Record<string, number>;
  body: Record<string, number>;
  body_type: Record<string, number>;
  body_style: Record<string, number>;
  face: Record<string, number>;
  face_type: Record<string, number>;
  face_style: Record<string, number>;
  hair: Record<string, number>;
  hair_type: Record<string, number>;
  hair_style: Record<string, number>;
  type: Record<string, number>;
  // Hierarchical versions for filter sidebar
  bodyHierarchical: {
    main: Record<string, number>;
    byType: Record<string, Record<string, number>>;
  };
  backgroundHierarchical: {
    main: Record<string, number>;
    byType: Record<string, Record<string, number>>;
  };
  faceHierarchical: {
    main: Record<string, number>;
    byType: Record<string, Record<string, number>>;
  };
  hairHierarchical: {
    main: Record<string, number>;
    byType: Record<string, Record<string, number>>;
  };
}

interface ConditionalFilterOptions {
  shouldShowFaceColor: (selectedFace: string) => boolean;
  shouldShowHairColor: (selectedHair: string) => boolean;
  getFilteredColorCount: () => Record<string, number>;
}

interface Filters {
  gender: string[];
  color_group: string[];
  color_count: string[];
  type_color: string[];
  type_type: string[];
  body_color: string[];
  hair_color: string[];
  face_color: string[];
  badges: string[];
  badgeCount: string[];
  body: string[];
  background: string[];
  face: string[];
  hair: string[];
  listed: boolean;
  search: string;
  sort: string;
}

export interface SearchSuggestion {
  type: 'trait' | 'token_id';
  category: string;
  value: string;
  count: number;
  label: string;
}

export interface ActiveFilter {
  category: keyof Filters;
  value: string;
  label: string;
  displayCategory: string;
}

interface FiltersContextType {
  filters: Filters;
  filterOptions: FilterOptions;
  conditionalFilters: ConditionalFilterOptions;
  totalNfts: number;
  filteredCount: number;
  setFilter: (category: keyof Filters, value: string | string[] | boolean) => void;
  clearFilters: () => void;
  applyFilters: (nfts: any[]) => any[];
  applySorting: (nfts: any[], listings: any) => any[];
  getSearchSuggestions: (query: string) => SearchSuggestion[];
  setFilteredCount: (count: number) => void;
  getActiveFilters: () => ActiveFilter[];
  removeFilter: (category: keyof Filters, value: string) => void;
}

const defaultFilters: Filters = {
  gender: [],
  color_group: [],
  color_count: [],
  type_color: [],
  type_type: [],
  body_color: [],
  hair_color: [],
  face_color: [],
  badges: [],
  badgeCount: [],
  body: [],
  background: [],
  face: [],
  hair: [],
  listed: false,
  search: '',
  sort: 'price_asc',
};

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export const FiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<Filters>(() => {
    // Initialize filters from URL or use defaults
    const urlFilters = decodeFiltersFromURL();
    return { ...defaultFilters, ...urlFilters };
  });
  const [totalNfts, setTotalNfts] = useState<number>(0);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [badgeData, setBadgeData] = useState<BadgeData>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    gender: {},
    color_group: {},
    color_count: {},
    type_color: {},
    type_type: {},
    body_color: {},
    hair_color: {},
    face_color: {},
    badges: {},
    badgeCount: {},
    // Individual trait fields for comprehensive search
    background: {},
    background_type: {},
    body: {},
    body_type: {},
    body_style: {},
    face: {},
    face_type: {},
    face_style: {},
    hair: {},
    hair_type: {},
    hair_style: {},
    type: {},
    // Hierarchical versions for filter sidebar
    bodyHierarchical: { main: {}, byType: {} },
    backgroundHierarchical: { main: {}, byType: {} },
    faceHierarchical: { main: {}, byType: {} },
    hairHierarchical: { main: {}, byType: {} },
  });

  // Load badge data
  useEffect(() => {
    loadBadgeData().then(setBadgeData);
  }, []);

  // Conditional filter logic (implementing old system's smart filtering)
  const conditionalFilters: ConditionalFilterOptions = {
    shouldShowFaceColor: (selectedFace: string) => {
      // Face color only shows when "Glasses" is selected in face filter
      return filters.face.some(faceStyle => {
        // Check if any selected face style belongs to "Glasses" type
        return filterOptions.faceHierarchical.byType['Glasses'] && 
               Object.keys(filterOptions.faceHierarchical.byType['Glasses']).includes(faceStyle);
      });
    },
    shouldShowHairColor: (selectedHair: string) => {
      // Hair color only shows when "Hair" type is selected in hair filter
      return filters.hair.some(hairStyle => {
        // Check if any selected hair style belongs to "Hair" type
        return filterOptions.hairHierarchical.byType['Hair'] && 
               Object.keys(filterOptions.hairHierarchical.byType['Hair']).includes(hairStyle);
      });
    },
    getFilteredColorCount: () => {
      // Only show color counts 3, 4, and 5 (old system logic)
      const filtered: Record<string, number> = {};
      Object.entries(filterOptions.color_count).forEach(([key, value]) => {
        const count = parseInt(key);
        if (count >= 3 && count <= 5) {
          filtered[key] = value;
        }
      });
      return filtered;
    }
  };

  const setFilter = (category: keyof Filters, value: string | string[] | boolean) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [category]: value,
      };
      // Update URL when filters change
      updateURL(newFilters);
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    // Clear URL when filters are cleared
    window.history.replaceState({}, '', window.location.pathname);
  };

  const applyFilters = useCallback((nfts: any[]) => {
    return nfts.filter(nft => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = ['tokenId', 'gender', 'background', 'body', 'face', 'hair', 'type'];
        const matchesSearch = searchableFields.some(field => 
          String(nft[field]).toLowerCase().includes(searchTerm)
        );
        if (!matchesSearch) return false;
      }

      // Listed filter
      if (filters.listed && !nft.listing) return false;

      // Simple trait filters
      const simpleTraitFilters = [
        'gender', 'color_group', 'color_count', 'type_color', 'type_type', 'body_color', 'hair_color', 'face_color'
      ];

      const simpleTraitMatch = simpleTraitFilters.every(trait => {
        const filterValue = filters[trait as keyof Filters];
        if (Array.isArray(filterValue) && filterValue.length > 0) {
          return filterValue.includes(nft[trait]);
        }
        return true;
      });

      if (!simpleTraitMatch) return false;

      // Hierarchical trait filters (matching old system logic)
      const hierarchicalTraitFilters = ['body', 'background', 'face', 'hair'];
      
      const hierarchicalTraitMatch = hierarchicalTraitFilters.every(traitCategory => {
        const filterValue = filters[traitCategory as keyof Filters];
        if (Array.isArray(filterValue) && filterValue.length > 0) {
          // Check if any selected filter matches either the main type or the specific style
          return filterValue.some(selectedValue => {
            // Check if it matches the main type (e.g., "Clothed", "Glasses")
            const typeField = `${traitCategory}_type`;
            if (nft[typeField] === selectedValue) {
              return true;
            }
            
            // Check if it matches the specific style (e.g., "Short Sleeve Button Up")
            const styleField = traitCategory === 'body' ? 'body_style' : 
                              traitCategory === 'face' ? 'face_style' : 
                              traitCategory === 'hair' ? 'hair_style' : 
                              traitCategory; // for background, use 'background' field
            
            if (nft[styleField] === selectedValue) {
              return true;
            }
            
            // ALSO check if it matches the full combined field (e.g., "Plastic Armor Black")
            // This handles cases where search suggests full trait values
            const fullField = traitCategory; // body, face, hair, background
            return nft[fullField] === selectedValue;
          });
        }
        return true;
      });

      if (!hierarchicalTraitMatch) return false;

      // Badge filters
      if (filters.badges.length > 0) {
        const nftBadges = [];
        for (let i = 1; i <= 5; i++) {
          const badge = nft[`badge${i}`];
          if (badge && badge.trim()) {
            nftBadges.push(badge.trim());
          }
        }
        
        // Check if NFT has any of the selected badges
        const hasBadge = filters.badges.some(selectedBadge => 
          nftBadges.includes(selectedBadge)
        );
        if (!hasBadge) return false;
      }

      // Badge count filters
      if (filters.badgeCount.length > 0) {
        const nftBadges = [];
        for (let i = 1; i <= 5; i++) {
          const badge = nft[`badge${i}`];
          if (badge && badge.trim()) {
            nftBadges.push(badge.trim());
          }
        }
        
        const badgeCount = nftBadges.length.toString();
        if (!filters.badgeCount.includes(badgeCount)) return false;
      }

      return true;
    });
  }, [filters]);

  const applySorting = useCallback((nfts: any[], listings: any) => {
    const sortedNfts = [...nfts];
    
    switch (filters.sort) {
      case 'price_asc':
        return sortedNfts.sort((a, b) => {
          const aListing = listings[a.id]?.bestListing;
          const bListing = listings[b.id]?.bestListing;
          if (aListing && bListing) {
            return aListing.price - bListing.price;
          } else if (aListing) {
            return -1; // Listed items first
          } else if (bListing) {
            return 1;
          } else {
            return parseInt(a.token_id || a.id) - parseInt(b.token_id || b.id); // Sort by token ID if no listings
          }
        });
        
      case 'price_desc':
        return sortedNfts.sort((a, b) => {
          const aListing = listings[a.id]?.bestListing;
          const bListing = listings[b.id]?.bestListing;
          if (aListing && bListing) {
            return bListing.price - aListing.price;
          } else if (aListing) {
            return -1; // Listed items first
          } else if (bListing) {
            return 1;
          } else {
            return parseInt(a.token_id || a.id) - parseInt(b.token_id || b.id);
          }
        });
        
      case 'token_id_asc':
        return sortedNfts.sort((a, b) => {
          return parseInt(a.token_id || a.id) - parseInt(b.token_id || b.id);
        });
        
      case 'token_id_desc':
        return sortedNfts.sort((a, b) => {
          return parseInt(b.token_id || b.id) - parseInt(a.token_id || a.id);
        });
        
      case 'rarity_asc':
        return sortedNfts.sort((a, b) => {
          const aRarity = a.rarityScore || 0;
          const bRarity = b.rarityScore || 0;
          return aRarity - bRarity;
        });
        
      case 'rarity_desc':
        return sortedNfts.sort((a, b) => {
          const aRarity = a.rarityScore || 0;
          const bRarity = b.rarityScore || 0;
          return bRarity - aRarity;
        });
        
      default:
        return sortedNfts;
    }
  }, [filters.sort]);

  // Enhanced fuzzy search function that supports partial matches and word order flexibility
  const fuzzyMatch = (searchText: string, queryWords: string[]): boolean => {
    const lowerSearchText = searchText.toLowerCase();
    
    // Check if all query words exist in the search text (order independent)
    return queryWords.every(word => lowerSearchText.includes(word));
  };

  const getSearchSuggestions = (query: string): SearchSuggestion[] => {
    if (!query || query.length < 1) return [];
    
    const lowerQuery = query.toLowerCase().trim();
    const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 0);
    const suggestions: SearchSuggestion[] = [];
    
    // Easter egg for serc1n 🎉
    if (lowerQuery.includes('kinky')) {
      suggestions.push({
        type: 'trait',
        category: 'Body',
        value: 'Tank Top Black',
        count: 1,
        label: 'Body: Tank Top Black (Special for serc1n 🎉)'
      });
    }
    
    // Token ID suggestions
    const matchingTokenIds = tokenIds.filter(id => 
      id.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
    
    matchingTokenIds.forEach(tokenId => {
      suggestions.push({
        type: 'token_id',
        category: 'Token ID',
        value: tokenId,
        count: 1,
        label: `Token #${tokenId}`
      });
    });

    // ALL trait suggestions - every field from CSV data
    const allTraitFields = [
      { key: 'gender', label: 'Gender' },
      { key: 'background', label: 'Background' },
      { key: 'background_type', label: 'Background Type' },
      { key: 'body', label: 'Body Full' },
      { key: 'body_type', label: 'Body Type' },
      { key: 'body_style', label: 'Body Style' },
      { key: 'body_color', label: 'Body Color' },
      { key: 'face', label: 'Face Full' },
      { key: 'face_type', label: 'Face Type' },
      { key: 'face_style', label: 'Face Style' },
      { key: 'face_color', label: 'Face Color' },
      { key: 'hair', label: 'Hair Full' },
      { key: 'hair_type', label: 'Hair Type' },
      { key: 'hair_style', label: 'Hair Style' },
      { key: 'hair_color', label: 'Hair Color' },
      { key: 'type', label: 'Type Full' },
      { key: 'type_type', label: 'Type' },
      { key: 'type_color', label: 'Type Color' },
      { key: 'color_group', label: 'Color Group' },
      { key: 'color_count', label: 'Color Count' },
      { key: 'badges', label: 'Badge' }
    ];

    allTraitFields.forEach(({ key, label }) => {
      const options = filterOptions[key as keyof FilterOptions] as Record<string, number>;
      if (options) {
        Object.entries(options).forEach(([value, count]) => {
          // Special handling for badges to show display names
          if (key === 'badges') {
            const displayName = getBadgeDisplayName(value, badgeData);
            if (fuzzyMatch(displayName, queryWords) || fuzzyMatch(value, queryWords)) {
              suggestions.push({
                type: 'trait',
                category: label,
                value, // Keep the original badge key for filtering
                count,
                label: `${label}: ${displayName} (${count})`
              });
            }
          } else {
            // Enhanced trait matching: supports fuzzy search
            if (fuzzyMatch(value, queryWords)) {
              suggestions.push({
                type: 'trait',
                category: label,
                value,
                count,
                label: `${label}: ${value} (${count})`
              });
            }
          }
        });
      }
    });

    // Hierarchical trait suggestions for filter sidebar compatibility
    const hierarchicalTraits = [
      { key: 'bodyHierarchical', label: 'Body' },
      { key: 'backgroundHierarchical', label: 'Background' },
      { key: 'faceHierarchical', label: 'Face' },
      { key: 'hairHierarchical', label: 'Hair' }
    ];

    hierarchicalTraits.forEach(({ key, label }) => {
      const options = filterOptions[key as keyof FilterOptions] as { main: Record<string, number>; byType: Record<string, Record<string, number>> };
      if (options) {
        // Add main category types (e.g., "Clothed", "Naked", "Glasses", "Expression", etc.)
        if (options.main) {
          Object.entries(options.main).forEach(([type, count]) => {
            if (fuzzyMatch(type, queryWords)) {
              suggestions.push({
                type: 'trait',
                category: `${label} Type`,
                value: type,
                count,
                label: `${label} Type: ${type} (${count})`
              });
            }
          });
        }
        
        // Add specific styles within each type
        if (options.byType) {
          Object.entries(options.byType).forEach(([type, styles]) => {
            Object.entries(styles).forEach(([style, count]) => {
              if (fuzzyMatch(style, queryWords)) {
                suggestions.push({
                  type: 'trait',
                  category: label,
                  value: style,
                  count,
                  label: `${label}: ${style} (${count})`
                });
              }
            });
          });
        }
      }
    });

    // Enhanced sorting by relevance 
    return suggestions
      .sort((a, b) => {
        const aValue = a.value.toLowerCase();
        const bValue = b.value.toLowerCase();
        
        // 1. Exact query match gets highest priority
        const aExact = aValue === lowerQuery;
        const bExact = bValue === lowerQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // 2. Starts with query gets second priority
        const aStartsWith = aValue.startsWith(lowerQuery);
        const bStartsWith = bValue.startsWith(lowerQuery);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // 3. Contains all query words in order gets third priority
        const aInOrder = queryWords.length > 1 && aValue.includes(queryWords.join(' '));
        const bInOrder = queryWords.length > 1 && bValue.includes(queryWords.join(' '));
        if (aInOrder && !bInOrder) return -1;
        if (!aInOrder && bInOrder) return 1;
        
        // 4. Sort by count (higher count first)
        return b.count - a.count;
      })
      .slice(0, 25); // Increased limit for better fuzzy search results
  };

  // Load filter options from CSV data
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/gvc_data.csv`);
        const csvText = await response.text();
        let rows = csvText.split('\n').slice(1);
        rows = rows.filter(row => row.trim() !== '');
        
        const options = {
          gender: new Set<string>(),
          background: new Set<string>(),
          background_type: new Set<string>(),
          body: new Set<string>(),
          body_type: new Set<string>(),
          body_style: new Set<string>(),
          body_color: new Set<string>(),
          face: new Set<string>(),
          face_type: new Set<string>(),
          face_style: new Set<string>(),
          face_color: new Set<string>(),
          hair: new Set<string>(),
          hair_type: new Set<string>(),
          hair_style: new Set<string>(),
          hair_color: new Set<string>(),
          type: new Set<string>(),
          type_type: new Set<string>(),
          type_color: new Set<string>(),
          color_group: new Set<string>(),
          color_count: new Set<string>(),
        };

        rows.forEach(row => {
          const columns = row.split(',');
          if (columns.length > 1) {
            options.gender.add(columns[1] || '');
            options.background.add(columns[2] || '');
            options.background_type.add(columns[3] || '');
            options.body.add(columns[4] || '');
            options.body_type.add(columns[5] || '');
            options.body_style.add(columns[6] || '');
            options.body_color.add(columns[7] || '');
            options.face.add(columns[8] || '');
            options.face_type.add(columns[9] || '');
            options.face_style.add(columns[10] || '');
            options.face_color.add(columns[11] || '');
            options.hair.add(columns[12] || '');
            options.hair_type.add(columns[13] || '');
            options.hair_style.add(columns[14] || '');
            options.hair_color.add(columns[15] || '');
            options.type.add(columns[16] || '');
            options.type_type.add(columns[17] || '');
            options.type_color.add(columns[18] || '');
            options.color_group.add(columns[22] || '');
            options.color_count.add(columns[23] || '');
          }
        });

        // Convert Sets to objects with counts
        const convertToCountObject = (set: Set<string>): Record<string, number> => {
          const obj: Record<string, number> = {};
          Array.from(set).filter(Boolean).forEach(item => {
            obj[item] = 1; // We'll update with actual counts later
          });
          return obj;
        };

        // Count occurrences
        const counts: Record<string, Record<string, number>> = {};
        const hierarchicalCounts: Record<string, { main: Record<string, number>; byType: Record<string, Record<string, number>> }> = {
          body: { main: {}, byType: {} },
          background: { main: {}, byType: {} },
          face: { main: {}, byType: {} },
          hair: { main: {}, byType: {} },
        };

        // Initialize counts
        Object.keys(options).forEach(key => {
          counts[key] = {};
        });
        counts.badges = {};
        counts.badgeCount = {};

        // Count occurrences from rows
        rows.forEach(row => {
          const columns = row.split(',');
          if (columns.length > 1) {
            // All individual trait counts for comprehensive search
            if (columns[1]) counts.gender[columns[1]] = (counts.gender[columns[1]] || 0) + 1;
            if (columns[2]) counts.background[columns[2]] = (counts.background[columns[2]] || 0) + 1;
            if (columns[3]) counts.background_type[columns[3]] = (counts.background_type[columns[3]] || 0) + 1;
            if (columns[4]) counts.body[columns[4]] = (counts.body[columns[4]] || 0) + 1;
            if (columns[5]) counts.body_type[columns[5]] = (counts.body_type[columns[5]] || 0) + 1;
            if (columns[6]) counts.body_style[columns[6]] = (counts.body_style[columns[6]] || 0) + 1;
            if (columns[7]) counts.body_color[columns[7]] = (counts.body_color[columns[7]] || 0) + 1;
            if (columns[8]) counts.face[columns[8]] = (counts.face[columns[8]] || 0) + 1;
            if (columns[9]) counts.face_type[columns[9]] = (counts.face_type[columns[9]] || 0) + 1;
            if (columns[10]) counts.face_style[columns[10]] = (counts.face_style[columns[10]] || 0) + 1;
            if (columns[11]) counts.face_color[columns[11]] = (counts.face_color[columns[11]] || 0) + 1;
            if (columns[12]) counts.hair[columns[12]] = (counts.hair[columns[12]] || 0) + 1;
            if (columns[13]) counts.hair_type[columns[13]] = (counts.hair_type[columns[13]] || 0) + 1;
            if (columns[14]) counts.hair_style[columns[14]] = (counts.hair_style[columns[14]] || 0) + 1;
            if (columns[15]) counts.hair_color[columns[15]] = (counts.hair_color[columns[15]] || 0) + 1;
            if (columns[16]) counts.type[columns[16]] = (counts.type[columns[16]] || 0) + 1;
            if (columns[17]) counts.type_type[columns[17]] = (counts.type_type[columns[17]] || 0) + 1;
            if (columns[18]) counts.type_color[columns[18]] = (counts.type_color[columns[18]] || 0) + 1;
            if (columns[22]) counts.color_group[columns[22]] = (counts.color_group[columns[22]] || 0) + 1;
            if (columns[23]) counts.color_count[columns[23]] = (counts.color_count[columns[23]] || 0) + 1;

            // Badge counts (badge1 through badge5 are at columns 24-28)
            let nftBadgeCount = 0;
            for (let i = 1; i <= 5; i++) {
              const badge = columns[23 + i]; // badge1 is at column 24 (index 23+1)
              if (badge && badge.trim()) {
                counts.badges[badge.trim()] = (counts.badges[badge.trim()] || 0) + 1;
                nftBadgeCount++;
              }
            }
            
            // Count NFTs by badge count (0-5)
            const badgeCountKey = nftBadgeCount.toString();
            counts.badgeCount[badgeCountKey] = (counts.badgeCount[badgeCountKey] || 0) + 1;

            // Hierarchical counts with old system's exact structure
            
            // Background: Main categories are background colors, subcategories only for "1 of 1"
            if (columns[2]) {
              const backgroundType = columns[3] || ''; // background_type
              hierarchicalCounts.background.main[backgroundType] = (hierarchicalCounts.background.main[backgroundType] || 0) + 1;
              
              // Only show subcategories for "1 of 1" backgrounds (old system logic)
              if (backgroundType === '1 of 1') {
                if (!hierarchicalCounts.background.byType[backgroundType]) {
                  hierarchicalCounts.background.byType[backgroundType] = {};
                }
                hierarchicalCounts.background.byType[backgroundType][columns[2]] = (hierarchicalCounts.background.byType[backgroundType][columns[2]] || 0) + 1;
              }
            }
            
            // Body: body_type as main categories, body_style as subcategories
            if (columns[5] && columns[6]) {
              const bodyType = columns[5]; // body_type (Clothed, Naked, 1 of 1)
              const bodyStyle = columns[6]; // body_style (specific styles)
              
              hierarchicalCounts.body.main[bodyType] = (hierarchicalCounts.body.main[bodyType] || 0) + 1;
              
              if (!hierarchicalCounts.body.byType[bodyType]) {
                hierarchicalCounts.body.byType[bodyType] = {};
              }
              hierarchicalCounts.body.byType[bodyType][bodyStyle] = (hierarchicalCounts.body.byType[bodyType][bodyStyle] || 0) + 1;
            }
            
            // Face: face_type as main categories (Glasses, Expression, Special, Facial Hair, 1 of 1)
            if (columns[9] && columns[10]) {
              const faceType = columns[9]; // face_type (Glasses, Expression, Special, etc.)
              const faceStyle = columns[10]; // face_style (specific styles)
              
              hierarchicalCounts.face.main[faceType] = (hierarchicalCounts.face.main[faceType] || 0) + 1;
              
              if (!hierarchicalCounts.face.byType[faceType]) {
                hierarchicalCounts.face.byType[faceType] = {};
              }
              hierarchicalCounts.face.byType[faceType][faceStyle] = (hierarchicalCounts.face.byType[faceType][faceStyle] || 0) + 1;
            }
            
            // Hair: hair_type as main categories (Hair, Headgear, Special, 1 of 1)
            if (columns[13] && columns[14]) {
              const hairType = columns[13]; // hair_type (Hair, Headgear, Special, etc.)
              const hairStyle = columns[14]; // hair_style (specific styles)
              
              hierarchicalCounts.hair.main[hairType] = (hierarchicalCounts.hair.main[hairType] || 0) + 1;
              
              if (!hierarchicalCounts.hair.byType[hairType]) {
                hierarchicalCounts.hair.byType[hairType] = {};
              }
              hierarchicalCounts.hair.byType[hairType][hairStyle] = (hierarchicalCounts.hair.byType[hairType][hairStyle] || 0) + 1;
            }
          }
        });

        setFilterOptions({
          gender: counts.gender,
          color_group: counts.color_group,
          color_count: counts.color_count,
          type_color: counts.type_color,
          type_type: counts.type_type,
          body_color: counts.body_color,
          hair_color: counts.hair_color,
          face_color: counts.face_color,
          badges: counts.badges,
          badgeCount: counts.badgeCount,
          // Individual trait fields for comprehensive search
          background: counts.background,
          background_type: counts.background_type,
          body: counts.body,
          body_type: counts.body_type,
          body_style: counts.body_style,
          face: counts.face,
          face_type: counts.face_type,
          face_style: counts.face_style,
          hair: counts.hair,
          hair_type: counts.hair_type,
          hair_style: counts.hair_style,
          type: counts.type,
          // Hierarchical versions for filter sidebar
          bodyHierarchical: hierarchicalCounts.body,
          backgroundHierarchical: hierarchicalCounts.background,
          faceHierarchical: hierarchicalCounts.face,
          hairHierarchical: hierarchicalCounts.hair,
        });
        setTotalNfts(rows.length);
        setTokenIds(rows.map(row => row.split(',')[0]).filter(Boolean));
      } catch (error) {
        // Handle error silently
      }
    };

    loadFilterOptions();
  }, []);

  // Get active filters for display as tags
  const getActiveFilters = useCallback((): ActiveFilter[] => {
    const activeFilters: ActiveFilter[] = [];
    
    // Category display names mapping
    const categoryLabels: Record<string, string> = {
      gender: 'Gender',
      color_group: 'Color Group',
      color_count: 'Color Count',
      type_color: 'Type Color',
      type_type: 'Type',
      body_color: 'Body Color',
      hair_color: 'Hair Color',
      face_color: 'Face Color',
      badges: 'Badge',
      badgeCount: 'Badge Count',
      body: 'Body',
      background: 'Background',
      face: 'Face',
      hair: 'Hair',
      listed: 'Listed Only',
      search: 'Search'
    };

    // Handle array filters
    Object.entries(filters).forEach(([category, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        value.forEach(item => {
          let displayValue = item;
          
          // Special formatting for badges
          if (category === 'badges') {
            displayValue = getBadgeDisplayName(item, badgeData);
          }
          // Special formatting for badge count
          else if (category === 'badgeCount') {
            displayValue = item === '0' ? 'No badges' : `${item} badge${item === '1' ? '' : 's'}`;
          }
          
          activeFilters.push({
            category: category as keyof Filters,
            value: item,
            label: displayValue,
            displayCategory: categoryLabels[category] || category
          });
        });
      }
    });

    // Handle boolean filters
    if (filters.listed) {
      activeFilters.push({
        category: 'listed',
        value: 'true',
        label: 'Listed Only',
        displayCategory: 'Market'
      });
    }

    // Handle search filter
    if (filters.search) {
      activeFilters.push({
        category: 'search',
        value: filters.search,
        label: filters.search,
        displayCategory: 'Search'
      });
    }

    return activeFilters;
  }, [filters, badgeData]);

  // Remove a specific filter value
  const removeFilter = useCallback((category: keyof Filters, value: string) => {
    if (category === 'listed') {
      setFilter('listed', false);
    } else if (category === 'search') {
      setFilter('search', '');
    } else if (Array.isArray(filters[category])) {
      const currentValues = filters[category] as string[];
      const newValues = currentValues.filter(v => v !== value);
      setFilter(category, newValues);
    }
  }, [filters, setFilter]);

  return (
    <FiltersContext.Provider value={{ 
      filters, 
      filterOptions, 
      conditionalFilters, 
      totalNfts, 
      filteredCount, 
      setFilter, 
      clearFilters, 
      applyFilters, 
      applySorting, 
      getSearchSuggestions, 
      setFilteredCount,
      getActiveFilters,
      removeFilter
    }}>
      {children}
    </FiltersContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
}; 