import React, { useState, useEffect } from 'react';
import { ListingsProvider, useListings } from './contexts/ListingsContext';
import { FiltersProvider, useFilters, SearchSuggestion } from './contexts/FiltersContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AnalyticsProvider, useAnalytics } from './contexts/AnalyticsContext';
import NFTGrid from './components/NFTGrid';
import FilterSidebar from './components/FilterSidebar';
import ThemeToggle from './components/Navbar/ThemeToggle';
import BugReportButton from './components/BugReportButton';
import StatsPanel from './components/StatsPanel';
import UAENotification from './components/UAENotification';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import MenuIcon from '@mui/icons-material/Menu';
import FilterListIcon from '@mui/icons-material/FilterList';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import './App.css';

interface HeaderProps {
  isFiltersOpen: boolean;
  setIsFiltersOpen: (open: boolean) => void;
}

const AppHeader: React.FC<HeaderProps> = ({ isFiltersOpen, setIsFiltersOpen }) => {
  const { filters, setFilter, totalNfts, filteredCount, getSearchSuggestions } = useFilters();
  const { listings, isLoading: listingsLoading } = useListings();
  const { trackSearch, trackFilter, setShowStatsPanel } = useAnalytics();
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSearchFilter, setActiveSearchFilter] = useState<SearchSuggestion | null>(null);
  const [logoClickCount, setLogoClickCount] = useState(0);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // 768px and below
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 768px - 1024px
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm')); // 600px and below

  // Update search filter when search value changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilter('search', searchValue);
      // Track search analytics
      if (searchValue.trim()) {
        trackSearch(searchValue);
      }
    }, 300); // Debounce search
    
    return () => clearTimeout(timeoutId);
  }, [searchValue, setFilter, trackSearch]);

  // Update search suggestions when search value changes (but not when dropdown is open and scrolling)
  useEffect(() => {
    if (!isDropdownOpen) {
      if (searchValue) {
        const suggestions = getSearchSuggestions(searchValue);
        setSearchSuggestions(suggestions);
      } else {
        setSearchSuggestions([]);
      }
    }
  }, [searchValue, getSearchSuggestions, isDropdownOpen]);

  const clearSearchFilter = () => {
    if (activeSearchFilter) {
      // If it's a trait filter, remove that specific filter value
      if (activeSearchFilter.type === 'trait') {
        let filterKey: keyof typeof filters;
        
        switch (activeSearchFilter.category) {
          case 'Gender': filterKey = 'gender'; break;
          case 'Color Group': filterKey = 'color_group'; break;
          case 'Color Count': filterKey = 'color_count'; break;
          case 'Type': filterKey = 'type_type'; break;
          case 'Type Color': filterKey = 'type_color'; break;
          case 'Body Color': filterKey = 'body_color'; break;
          case 'Face Color': filterKey = 'face_color'; break;
          case 'Hair Color': filterKey = 'hair_color'; break;
          case 'Badge': filterKey = 'badges'; break;
          // All individual trait fields - map to hierarchical filters for consistency
          case 'Background':
          case 'Background Type':
          case 'Background Full':
            filterKey = 'background';
            break;
          case 'Body':
          case 'Body Type':
          case 'Body Style':
          case 'Body Full':
            filterKey = 'body';
            break;
          case 'Face':
          case 'Face Type':
          case 'Face Style':
          case 'Face Full':
            filterKey = 'face';
            break;
          case 'Hair':
          case 'Hair Type':
          case 'Hair Style':
          case 'Hair Full':
            filterKey = 'hair';
            break;
          case 'Type Full':
          default:
            setFilter('search', '');
            setActiveSearchFilter(null);
            setSearchValue('');
            return;
        }
        
        // Remove the specific value from the filter
        const currentValues = filters[filterKey] as string[];
        const newValues = currentValues.filter(v => v !== activeSearchFilter.value);
        setFilter(filterKey, newValues);
      } else {
        // For token ID search, clear the search filter
        setFilter('search', '');
      }
    }
    
    setActiveSearchFilter(null);
    setSearchValue('');
  };

  const handleSearchSuggestionClick = (option: SearchSuggestion) => {
    if (option.type === 'trait') {
      // Apply the specific filter for this category
      let filterKey: keyof typeof filters;
      
      // Map category names to filter keys - comprehensive mapping for all traits
      switch (option.category) {
        case 'Gender': filterKey = 'gender'; break;
        case 'Color Group': filterKey = 'color_group'; break;
        case 'Color Count': filterKey = 'color_count'; break;
        case 'Type': filterKey = 'type_type'; break;
        case 'Type Color': filterKey = 'type_color'; break;
        case 'Body Color': filterKey = 'body_color'; break;
        case 'Face Color': filterKey = 'face_color'; break;
        case 'Hair Color': filterKey = 'hair_color'; break;
        case 'Badge': filterKey = 'badges'; break;
        // All individual trait fields - map to hierarchical filters for consistency
        case 'Background':
        case 'Background Type':
        case 'Background Full':
          filterKey = 'background';
          break;
        case 'Body':
        case 'Body Type':
        case 'Body Style':
        case 'Body Full':
          filterKey = 'body';
          break;
        case 'Face':
        case 'Face Type':
        case 'Face Style':
        case 'Face Full':
          filterKey = 'face';
          break;
        case 'Hair':
        case 'Hair Type':
        case 'Hair Style':
        case 'Hair Full':
          filterKey = 'hair';
          break;
        case 'Type Full':
          // For full type descriptions, fall back to search
          setSearchValue(option.value);
          setFilter('search', option.value);
          setActiveSearchFilter(option);
          setIsDropdownOpen(false);
          return;
        default:
          // Fallback to search if category not recognized
          setSearchValue(option.value);
          setFilter('search', option.value);
          setActiveSearchFilter(option);
          setIsDropdownOpen(false);
          return;
      }
      
      // Apply the filter to the specific category
      const currentValues = filters[filterKey] as string[];
      if (!currentValues.includes(option.value)) {
        setFilter(filterKey, [...currentValues, option.value]);
      }
      
      // Set active search filter to show in search box
      setActiveSearchFilter(option);
      setSearchValue(''); // Clear the actual search input
      setFilter('search', ''); // Clear search filter
      setIsDropdownOpen(false);
    } else if (option.type === 'token_id') {
      // For token IDs, use search
      setSearchValue(option.value);
      setFilter('search', option.value);
      setActiveSearchFilter(option);
      setIsDropdownOpen(false);
    }
  };

  // Handle logo clicks for stats panel access
  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    if (newCount === 10) {
      setShowStatsPanel(true);
      setLogoClickCount(0); // Reset counter
    }
    
    // Reset counter after 5 seconds if not reached 10
    setTimeout(() => {
      setLogoClickCount(0);
    }, 5000);
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: '#2a2a2a', // Always dark nav bar
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        borderBottom: '1px solid #404040', // Always dark border
        zIndex: 1000
      }}
    >
      <Toolbar sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        px: isMobile ? 1 : 3,
        py: isMobile ? 0.5 : 1,
        minHeight: isMobile ? 56 : 64
      }}>
        {/* Left section - Brand and Show Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              cursor: 'pointer',
              userSelect: 'none'
            }}
            onClick={handleLogoClick}
          >
            <Box
              component="img"
              src={`${import.meta.env.BASE_URL}badges/any_gvc.png`}
              alt="GVC Logo"
              sx={{
                width: isMobile ? 32 : 40,
                height: isMobile ? 32 : 40,
                borderRadius: '50%',
                border: '2px solid rgba(247, 77, 113, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '2px'
              }}
            />
            <Typography 
              variant={isMobile ? "h6" : "h5"}
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                color: '#fff', // Always white text in nav
                background: 'linear-gradient(45deg, #ffa300, #f74d71)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: isMobile ? '1.1rem' : '1.5rem'
              }}
            >
              {isSmallMobile ? 'GVC' : 'Vibes Browser'}
            </Typography>
            {!isSmallMobile && (
              <Chip
                label="BETA"
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 193, 7, 0.2)',
                  color: '#ffc107',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  height: 20
                }}
              />
            )}
          </Box>
          
          {isMobile && (
            <IconButton
              onClick={() => setIsFiltersOpen(true)}
              sx={{
                color: '#fff', // Always white in nav
                '&:hover': {
                  backgroundColor: 'rgba(247, 77, 113, 0.1)'
                }
              }}
            >
              <FilterListIcon />
            </IconButton>
          )}
        </Box>


        {/* Right section - Search, Sort, Stats */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? 0.5 : 2,
          flex: 1,
          justifyContent: 'flex-end'
        }}>
          <ClickAwayListener onClickAway={() => setIsDropdownOpen(false)}>
            <Box sx={{ 
              position: 'relative', 
              minWidth: isMobile ? 'auto' : 250,
              width: isMobile ? '100%' : 'auto',
              maxWidth: isMobile ? 180 : 'none'
            }}>
              {activeSearchFilter ? (
                // Show active filter as a chip
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  minHeight: 40,
                  px: 2,
                  border: '1px solid var(--border-color, #404040)',
                  borderRadius: 1,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  minWidth: isMobile ? 'auto' : 250,
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <Chip
                    label={activeSearchFilter.label}
                    size="small"
                    onDelete={clearSearchFilter}
                    sx={{
                      backgroundColor: 'rgba(247, 77, 113, 0.2)',
                      color: '#fff', // Always white text in nav
                      '& .MuiChip-deleteIcon': {
                        color: '#fff' // Always white delete icon in nav
                      },
                      maxWidth: 'calc(100% - 20px)'
                    }}
                  />
                </Box>
              ) : (
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder={isMobile ? "Search..." : "Search by token ID or attributes..."}
                  value={searchValue}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSearchValue(newValue);
                    if (newValue) {
                      const suggestions = getSearchSuggestions(newValue);
                      setSearchSuggestions(suggestions);
                      setIsDropdownOpen(suggestions.length > 0);
                    } else {
                      setSearchSuggestions([]);
                      setIsDropdownOpen(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchValue && searchSuggestions.length > 0) {
                      setIsDropdownOpen(true);
                    }
                  }}
                  InputProps={{
                    endAdornment: searchValue && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchValue('');
                          setFilter('search', '');
                        }}
                        sx={{ color: '#aaa' }} // Always light gray in nav
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )
                  }}
                  sx={{
                  minWidth: isMobile ? 'auto' : 250,
                  width: isMobile ? '100%' : 'auto',
                  '& .MuiOutlinedInput-root': {
                    color: '#fff', // Always white text in nav
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '& fieldset': {
                      borderColor: '#404040', // Always dark border in nav
                    },
                    '&:hover fieldset': {
                      borderColor: '#f74d71',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f74d71',
                    },
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: '#aaa', // Always light gray placeholder in nav
                  }
                }}
                />
              )}
              {isDropdownOpen && searchSuggestions.length > 0 && (
                <Paper
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1300,
                    bgcolor: '#2a2a2a', // Always dark dropdown in nav
                    color: '#fff', // Always white text in nav
                    border: '1px solid #404040', // Always dark border in nav
                    borderRadius: 1,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    maxHeight: 400,
                    overflow: 'auto',
                    mt: 0.5
                  }}
                >
                  {searchSuggestions.map((option, index) => (
                    <Box
                      key={`${option.category}-${option.value}-${index}`}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderBottom: index < searchSuggestions.length - 1 ? '1px solid var(--border-color, #404040)' : 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(247, 77, 113, 0.1)'
                        }
                      }}
                      onClick={() => handleSearchSuggestionClick(option)}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.label}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              )}
            </Box>
          </ClickAwayListener>

          {!isSmallMobile && (
            <FormControl size="small" sx={{ minWidth: isMobile ? 80 : 120 }}>
            <InputLabel 
              sx={{ 
                color: '#aaa', // Always light gray in nav
                '&.Mui-focused': { color: '#f74d71' }
              }}
            >
              Sort
            </InputLabel>
            <Select
              value={filters.sort}
              label="Sort"
              onChange={(e) => {
                setFilter('sort', e.target.value);
                trackFilter(`Sort: ${e.target.value}`);
              }}
              sx={{
                color: '#fff', // Always white in nav
                backgroundColor: 'rgba(255,255,255,0.05)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#404040', // Always dark border in nav
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#f74d71',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#f74d71',
                },
                '& .MuiSvgIcon-root': {
                  color: '#fff', // Always white icons in nav
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#2a2a2a', // Always dark dropdown in nav
                    color: '#fff', // Always white text in nav
                    border: '1px solid #404040', // Always dark border in nav
                  }
                }
              }}
            >
              <MenuItem value="price_asc">Price ↑</MenuItem>
              <MenuItem value="price_desc">Price ↓</MenuItem>
              <MenuItem value="token_id_asc">ID ↑</MenuItem>
              <MenuItem value="token_id_desc">ID ↓</MenuItem>
              <MenuItem value="rarity_asc">Rarity ↑</MenuItem>
              <MenuItem value="rarity_desc">Rarity ↓</MenuItem>
            </Select>
            </FormControl>
          )}

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? 0.5 : 1,
            flexDirection: isSmallMobile ? 'column' : 'row'
          }}>
            {!isSmallMobile && (
              <Chip 
                label={totalNfts === 0 ? "Loading..." : `${totalNfts} Total`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(247, 77, 113, 0.2)',
                  color: '#fff', // Always white in nav
                  border: '1px solid rgba(247, 77, 113, 0.3)',
                  fontSize: isMobile ? '0.65rem' : '0.75rem'
                }}
              />
            )}
            <Chip 
              label={isMobile ? `${filteredCount}` : `${filteredCount} Showing`}
              size="small"
              sx={{
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                color: '#fff', // Always white in nav
                border: '1px solid rgba(76, 175, 80, 0.3)',
                fontSize: isMobile ? '0.65rem' : '0.75rem'
              }}
            />
            <ThemeToggle />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const AppContent: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isFiltersOpen, setIsFiltersOpen] = useState(true); // Always start open, mobile will override

  // Handle mobile vs desktop filter state
  useEffect(() => {
    if (isMobile) {
      setIsFiltersOpen(false); // Close on mobile
    } else {
      setIsFiltersOpen(true); // Always open on desktop
    }
  }, [isMobile]);

  return (
    <ListingsProvider>
      <FiltersProvider>
        <AnalyticsProvider>
          <div className="app">
          <AppHeader isFiltersOpen={isFiltersOpen} setIsFiltersOpen={setIsFiltersOpen} />

          <div className="main-container">
            {isMobile ? (
              <>
                <Drawer
                  anchor="left"
                  open={isFiltersOpen}
                  onClose={() => setIsFiltersOpen(false)}
                  variant="temporary"
                  ModalProps={{
                    keepMounted: true,
                    disablePortal: false,
                    disableScrollLock: true // This should help with mobile scrolling
                  }}
                  PaperProps={{
                    sx: {
                      width: '85vw',
                      maxWidth: 320,
                      backgroundColor: 'var(--card-bg)',
                      borderRight: '1px solid var(--border-color)',
                      top: 56,
                      height: 'calc(100vh - 56px)',
                      borderRadius: '0 8px 8px 0'
                    }
                  }}
                >
                  <FilterSidebar onClose={() => setIsFiltersOpen(false)} />
                </Drawer>
                <main className="content-area" style={{ 
                  height: 'calc(100vh - 56px)',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch'
                }}>
                  <NFTGrid />
                </main>
              </>
            ) : (
              <>
                <div style={{ width: '320px', flexShrink: 0, backgroundColor: 'var(--card-bg)', borderRight: '1px solid var(--border-color)' }}>
                  <FilterSidebar />
                </div>
                <main className="content-area" style={{ flex: 1, minWidth: 0 }}>
                  <NFTGrid />
                </main>
              </>
            )}
          </div>
          
          <BugReportButton />
          <StatsPanel />
          <UAENotification />
        </div>
        </AnalyticsProvider>
      </FiltersProvider>
    </ListingsProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;