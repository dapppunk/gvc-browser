import React, { useContext, useEffect, useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  CircularProgress,
  Button,
  useTheme,
  Alert,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Badge,
} from '@mui/material';
import {
  AccountBalanceWallet,
  ContentCopy,
  OpenInNew,
  Collections,
  EmojiEvents,
  Search,
  ArrowBack,
  FilterList,
  ViewModule,
  ViewList,
  Close,
  TrendingUp,
  Visibility,
  VisibilityOff,
  CheckBox,
  CheckBoxOutlineBlank,
  Clear,
  Storefront,
  Wallpaper,
} from '@mui/icons-material';
import { WalletContext } from '../contexts/WalletContext';
import { useListings } from '../contexts/ListingsContext';
import { NFT } from '../types';
import { useNavigate } from 'react-router-dom';
import { BadgeData, loadBadgeData } from '../utils/badges';
import { calculateRarityScore } from '../utils/rarityCalculator';
import WallpaperGenerator from './WallpaperGenerator';
import { getWebPImageUrl } from '../utils/imageUtils';

interface FilterState {
  search: string;
  selectedBadges: string[];
  selectedTraits: {
    background: string[];
    body: string[];
    face: string[];
    hair: string[];
    type: string[];
    gender: string[];
  };
  rarityRange: [number, number];
  showListed: 'all' | 'listed' | 'unlisted';
}

const Profile: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { account, ownedNfts, ownedBadges, isLoadingNfts, ensName, ensAvatar } = useContext(WalletContext);
  const { listings } = useListings();
  const [userNfts, setUserNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState('token_id_asc');
  const [badgeData, setBadgeData] = useState<BadgeData>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [wallpaperDialogOpen, setWallpaperDialogOpen] = useState(false);
  const [wallpaperNft, setWallpaperNft] = useState<NFT | null>(null);
  
  // Enhanced filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    selectedBadges: [],
    selectedTraits: {
      background: [],
      body: [],
      face: [],
      hair: [],
      type: [],
      gender: [],
    },
    rarityRange: [0, 10000],
    showListed: 'all',
  });

  // Get unique trait values from user's NFTs
  const traitOptions = useMemo(() => {
    const options = {
      background: new Set<string>(),
      body: new Set<string>(),
      face: new Set<string>(),
      hair: new Set<string>(),
      type: new Set<string>(),
      gender: new Set<string>(),
    };

    userNfts.forEach(nft => {
      if (nft.background) options.background.add(nft.background);
      if (nft.body) options.body.add(nft.body);
      if (nft.face) options.face.add(nft.face);
      if (nft.hair) options.hair.add(nft.hair);
      if (nft.type) options.type.add(nft.type);
      if (nft.gender) options.gender.add(nft.gender);
    });

    return {
      background: Array.from(options.background).sort(),
      body: Array.from(options.body).sort(),
      face: Array.from(options.face).sort(),
      hair: Array.from(options.hair).sort(),
      type: Array.from(options.type).sort(),
      gender: Array.from(options.gender).sort(),
    };
  }, [userNfts]);

  // Load badge data
  useEffect(() => {
    loadBadgeData().then(data => {
      console.log('Loaded badge data:', data);
      console.log('Ladies Night badge:', data['ladies_night']);
      setBadgeData(data);
    });
  }, []);

  // Calculate rarity scores for NFTs
  useEffect(() => {
    if (userNfts.length > 0) {
      const nftsWithRarity = userNfts.map(nft => ({
        ...nft,
        rarityScore: calculateRarityScore(nft)
      }));
      setUserNfts(nftsWithRarity);
    }
  }, [ownedNfts]);

  useEffect(() => {
    if (!account) {
      navigate('/');
      return;
    }

    if (ownedNfts && ownedNfts.length > 0) {
      const nftsWithRarity = ownedNfts.map(nft => ({
        ...nft,
        rarityScore: calculateRarityScore(nft)
      }));
      
      // Debug logging for token 6221
      const token6221 = nftsWithRarity.find(nft => nft.token_id === '6221');
      if (token6221) {
        console.log('Token 6221 data:', token6221);
        console.log('Token 6221 badges:', {
          badge1: token6221.badge1,
          badge2: token6221.badge2,
          badge3: token6221.badge3,
          badge4: token6221.badge4,
          badge5: token6221.badge5
        });
      }
      
      setUserNfts(nftsWithRarity);
      setFilteredNfts(nftsWithRarity);
      setLoading(false);
    } else if (!isLoadingNfts) {
      setLoading(false);
    }
  }, [account, ownedNfts, isLoadingNfts, navigate]);

  // Enhanced filtering and sorting
  useEffect(() => {
    let filtered = [...userNfts];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(nft => 
        nft.token_id.includes(filters.search) ||
        nft.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        nft.type?.toLowerCase().includes(filters.search.toLowerCase()) ||
        nft.gender?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Badge filter (multi-select)
    if (filters.selectedBadges.length > 0) {
      filtered = filtered.filter(nft => {
        const nftBadges = [nft.badge1, nft.badge2, nft.badge3, nft.badge4, nft.badge5].filter(Boolean);
        return filters.selectedBadges.some(badge => nftBadges.includes(badge));
      });
    }

    // Trait filters
    Object.entries(filters.selectedTraits).forEach(([trait, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(nft => {
          const nftValue = nft[trait as keyof NFT] as string;
          return values.includes(nftValue);
        });
      }
    });

    // Rarity filter
    filtered = filtered.filter(nft => {
      const rarity = nft.rarityScore || 0;
      return rarity >= filters.rarityRange[0] && rarity <= filters.rarityRange[1];
    });

    // Listing filter
    if (filters.showListed !== 'all') {
      filtered = filtered.filter(nft => {
        const isListed = listings && listings[nft.token_id] && listings[nft.token_id].bestListing;
        return filters.showListed === 'listed' ? isListed : !isListed;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'token_id_asc':
          return parseInt(a.token_id) - parseInt(b.token_id);
        case 'token_id_desc':
          return parseInt(b.token_id) - parseInt(a.token_id);
        case 'rarity_asc':
          return (a.rarityScore || 0) - (b.rarityScore || 0);
        case 'rarity_desc':
          return (b.rarityScore || 0) - (a.rarityScore || 0);
        case 'price_asc':
        case 'price_desc':
          const aListing = listings && listings[a.token_id]?.bestListing;
          const bListing = listings && listings[b.token_id]?.bestListing;
          const aPrice = aListing?.price || (sortBy === 'price_asc' ? Infinity : 0);
          const bPrice = bListing?.price || (sortBy === 'price_asc' ? Infinity : 0);
          return sortBy === 'price_asc' ? aPrice - bPrice : bPrice - aPrice;
        case 'type':
          return (a.type || '').localeCompare(b.type || '');
        case 'gender':
          return (a.gender || '').localeCompare(b.gender || '');
        default:
          return 0;
      }
    });

    setFilteredNfts(filtered);
  }, [userNfts, filters, sortBy, listings]);

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openEtherscan = () => {
    if (account) {
      window.open(`https://etherscan.io/address/${account}`, '_blank');
    }
  };

  const openOpenSea = (tokenId: string) => {
    window.open(`https://opensea.io/item/ethereum/0xb8ea78fcacef50d41375e44e6814ebba36bb33c4/${tokenId}`, '_blank');
  };

  const openMagicEden = (tokenId: string) => {
    window.open(`https://magiceden.io/item-details/ethereum/0xb8ea78fcacef50d41375e44e6814ebba36bb33c4/${tokenId}`, '_blank');
  };


  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.selectedBadges.length > 0) count++;
    if (filters.showListed !== 'all') count++;
    if (filters.rarityRange[0] > 0 || filters.rarityRange[1] < 10000) count++;
    Object.values(filters.selectedTraits).forEach(traits => {
      if (traits.length > 0) count++;
    });
    return count;
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      selectedBadges: [],
      selectedTraits: {
        background: [],
        body: [],
        face: [],
        hair: [],
        type: [],
        gender: [],
      },
      rarityRange: [0, 10000],
      showListed: 'all',
    });
  };

  // Calculate collection floor price from ALL listings
  const collectionFloorPrice = useMemo(() => {
    if (!listings || typeof listings !== 'object') return 0;
    
    let minPrice = Infinity;
    
    // Iterate through all NFT listings
    Object.values(listings).forEach((multiListing) => {
      if (multiListing && multiListing.bestListing) {
        const price = multiListing.bestListing.price;
        if (price > 0 && price < minPrice) {
          minPrice = price;
        }
      }
    });
    
    return minPrice !== Infinity ? minPrice : 0;
  }, [listings]);

  // Calculate portfolio stats
  const portfolioStats = useMemo(() => {
    const listedCount = filteredNfts.filter(nft => 
      listings && listings[nft.token_id] && listings[nft.token_id].bestListing
    ).length;

    const estimatedValue = collectionFloorPrice * filteredNfts.length;

    const avgRarity = filteredNfts.length > 0 
      ? filteredNfts.reduce((sum, nft) => sum + (nft.rarityScore || 0), 0) / filteredNfts.length 
      : 0;

    return {
      listedCount,
      floorPrice: collectionFloorPrice,
      estimatedValue,
      avgRarity,
    };
  }, [filteredNfts, listings, collectionFloorPrice]);

  if (!account) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          Please connect your wallet to view your profile.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
      {/* Compact Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(247, 77, 113, 0.15), rgba(255, 163, 0, 0.15))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            size="small"
            sx={{
              mb: 1,
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(247, 77, 113, 0.1)',
              },
            }}
          >
            Back
          </Button>

          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            {/* Smaller Avatar */}
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f74d71, #ffa300)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {ensAvatar ? (
                <img src={ensAvatar} alt="ENS Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <AccountBalanceWallet sx={{ fontSize: 28, color: 'white' }} />
              )}
            </Box>

            {/* Address & Stats */}
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#fff' }}>
                  {ensName || formatAddress(account)}
                </Typography>
                {ensName && (
                  <>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      ({formatAddress(account)})
                    </Typography>
                  </>
                )}
                <Tooltip title={copied ? 'Copied!' : 'Copy address'}>
                  <IconButton size="small" onClick={copyAddress} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <ContentCopy sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="View on Etherscan">
                  <IconButton size="small" onClick={openEtherscan} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <OpenInNew sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Stack direction="row" spacing={3}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <strong style={{ color: '#f74d71' }}>{userNfts.length}</strong> NFTs
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <strong style={{ color: '#ffa300' }}>{ownedBadges.size}</strong> Badges
                </Typography>
                {portfolioStats.floorPrice > 0 && (
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <TrendingUp sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    Est. Value: <strong style={{ color: '#4caf50' }}>{portfolioStats.estimatedValue.toFixed(2)} ETH</strong>
                  </Typography>
                )}
              </Stack>
            </Box>

          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Portfolio Stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{
              p: 2,
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}>
              <Typography variant="h4" sx={{ color: '#f74d71', fontWeight: 600 }}>
                {filteredNfts.length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Total NFTs
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{
              p: 2,
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}>
              <Typography variant="h4" sx={{ color: '#ffa300', fontWeight: 600 }}>
                {portfolioStats.listedCount}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Listed
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{
              p: 2,
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 600 }}>
                {portfolioStats.avgRarity.toFixed(0)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Avg Rarity
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{
              p: 2,
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}>
              <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 600 }}>
                {portfolioStats.floorPrice.toFixed(3)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Floor (ETH)
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Enhanced Filters */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="Search by ID, name, traits..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f74d71',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.5)' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)', '&.Mui-focused': { color: '#f74d71' } }}>Sort</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort"
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#f74d71',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a1a1a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '& .MuiMenuItem-root': {
                          color: '#fff',
                          '&:hover': {
                            backgroundColor: 'rgba(247, 77, 113, 0.1)',
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="token_id_asc">ID ↑</MenuItem>
                  <MenuItem value="token_id_desc">ID ↓</MenuItem>
                  <MenuItem value="rarity_asc">Rarity ↑</MenuItem>
                  <MenuItem value="rarity_desc">Rarity ↓</MenuItem>
                  <MenuItem value="price_asc">Price ↑</MenuItem>
                  <MenuItem value="price_desc">Price ↓</MenuItem>
                  <MenuItem value="type">Type</MenuItem>
                  <MenuItem value="gender">Gender</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<FilterList />}
                onClick={() => setFilterDialogOpen(true)}
                sx={{
                  color: '#fff',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(247, 77, 113, 0.1)',
                  },
                }}
              >
                Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
              </Button>
            </Grid>
            <Grid item xs={6} md={1.5}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    '&.Mui-selected': {
                      color: '#fff',
                      backgroundColor: 'rgba(247, 77, 113, 0.2)',
                    },
                  },
                }}
              >
                <ToggleButton value="grid">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={6} md={1.5}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<Wallpaper />}
                onClick={() => {
                  setWallpaperNft(null); // Clear single NFT selection
                  setWallpaperDialogOpen(true);
                }}
                disabled={filteredNfts.length === 0}
                sx={{
                  color: '#ffa300',
                  borderColor: 'rgba(255, 163, 0, 0.3)',
                  '&:hover': {
                    borderColor: '#ffa300',
                    backgroundColor: 'rgba(255, 163, 0, 0.1)',
                  },
                  '&:disabled': {
                    color: 'rgba(255, 255, 255, 0.3)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Wallpaper
              </Button>
            </Grid>
            <Grid item xs={12} md={1}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                {filteredNfts.length}/{userNfts.length}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* NFTs Display */}
        {loading || isLoadingNfts ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredNfts.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 1,
            }}
          >
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {filters.search || getActiveFilterCount() > 0 ? 'No NFTs match your filters' : 'No Good Vibes Club NFTs found'}
            </Typography>
            {getActiveFilterCount() > 0 && (
              <Button
                onClick={clearAllFilters}
                sx={{ mt: 2, color: '#f74d71' }}
              >
                Clear Filters
              </Button>
            )}
          </Paper>
        ) : viewMode === 'grid' ? (
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(6, 1fr)',
                xl: 'repeat(8, 1fr)',
              },
              gap: 1.5,
            }}
          >
            {filteredNfts.map((nft) => {
              const nftBadges = [nft.badge1, nft.badge2, nft.badge3, nft.badge4, nft.badge5]
                .filter(badge => badge && badge.trim() !== '');
              const nftListing = listings && listings[nft.token_id];
              const listing = nftListing?.bestListing;
              
              return (
                <Box
                  key={nft.token_id}
                  sx={{
                    position: 'relative',
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 20px rgba(247, 77, 113, 0.3)',
                      zIndex: 1,
                      '& .nft-info': {
                        opacity: 1,
                      }
                    },
                  }}
                  onClick={() => setSelectedNft(nft)}
                >
                  {/* NFT Image - Always use WebP */}
                  <Box
                    component="img"
                    src={getWebPImageUrl(nft.token_id)}
                    alt={nft.name}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '1/1',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // If WebP fails, show placeholder
                      target.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #1a1a1a; color: #666; font-size: 12px; padding: 8px; text-align: center;';
                      errorDiv.textContent = 'Image unavailable';
                      target.parentElement?.appendChild(errorDiv);
                    }}
                  />
                  
                  {/* Always visible info */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                      p: 0.75,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem', display: 'block' }}>
                      #{nft.token_id}
                    </Typography>
                    {nft.rarityScore && (
                      <Typography variant="caption" sx={{ color: '#4caf50', fontSize: '0.6rem', display: 'block' }}>
                        Rarity: {nft.rarityScore}
                      </Typography>
                    )}
                  </Box>

                  {/* Listing Price */}
                  {listing && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        backgroundColor: 'rgba(76, 175, 80, 0.9)',
                        borderRadius: 0.5,
                        px: 0.5,
                        py: 0.25,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'white', fontSize: '0.65rem', fontWeight: 600 }}>
                        {listing.price.toFixed(3)} ETH
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Badge Icons - Always Visible */}
                  {nftBadges.length > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        display: 'flex',
                        gap: 0.25,
                        flexWrap: 'wrap',
                        maxWidth: '60%',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {nftBadges.map((badgeKey, index) => {
                        const trimmedKey = badgeKey.trim();
                        const badge = badgeData[trimmedKey];
                        if (!badge) {
                          console.warn(`Badge not found for key: "${trimmedKey}" (token ${nft.token_id})`);
                          return null;
                        }
                        
                        return (
                          <Tooltip key={index} title={badge.displayName}>
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <img
                                src={`${import.meta.env.BASE_URL}badges/${trimmedKey}.png`}
                                alt={badge.displayName}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                }}
                              />
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ) : (
          // List View - Table Style
          <Box sx={{ 
            maxWidth: '1200px', 
            mx: 'auto',
            width: '100%',
          }}>
            {/* Table Header */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '60px 2.5fr 1.5fr 1fr 1.5fr 2fr',
                gap: 2,
                p: 2,
                mb: 1,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                Item
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                Token ID
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                Rarity
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                Listed Price
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                Badges
              </Typography>
            </Box>

            {/* Table Rows */}
            {filteredNfts.map((nft) => {
              const nftBadges = [nft.badge1, nft.badge2, nft.badge3, nft.badge4, nft.badge5]
                .filter(badge => badge && badge.trim() !== '');
              const nftListing = listings && listings[nft.token_id];
              const listing = nftListing?.bestListing;
              
              return (
                <Box
                  key={nft.token_id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '60px 2.5fr 1.5fr 1fr 1.5fr 2fr',
                    gap: 2,
                    p: 2,
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    },
                  }}
                  onClick={() => setSelectedNft(nft)}
                >
                  {/* Image - Always use WebP */}
                  <Box
                    component="img"
                    src={getWebPImageUrl(nft.token_id)}
                    alt={nft.name}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1,
                      objectFit: 'cover',
                    }}
                  />

                  {/* Name */}
                  <Box>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                      {nft.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      {nft.type} • {nft.gender}
                    </Typography>
                  </Box>

                  {/* Token ID */}
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    #{nft.token_id}
                  </Typography>

                  {/* Rarity */}
                  <Typography variant="body2" sx={{ color: '#ffa300' }}>
                    #{nft.rarityScore || '--'}
                  </Typography>

                  {/* Listed Price */}
                  <Typography variant="body2" sx={{ color: listing ? '#4caf50' : 'rgba(255, 255, 255, 0.3)' }}>
                    {listing ? `${listing.price.toFixed(4)} ETH` : '—'}
                  </Typography>

                  {/* Badges - Show All */}
                  <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap">
                    {nftBadges.length > 0 ? (
                      nftBadges.map((badgeKey, index) => {
                        const trimmedKey = badgeKey.trim();
                        const badge = badgeData[trimmedKey];
                        if (!badge) {
                          console.warn(`Badge not found for key: "${trimmedKey}" (token ${nft.token_id}) in list view`);
                          return null;
                        }
                        
                        return (
                          <Tooltip key={index} title={badge.displayName}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(247, 77, 113, 0.1)',
                                border: '1px solid rgba(247, 77, 113, 0.2)',
                                padding: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <img
                                src={`${import.meta.env.BASE_URL}badges/${trimmedKey}.png`}
                                alt={badge.displayName}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                }}
                              />
                            </Box>
                          </Tooltip>
                        );
                      })
                    ) : (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                        —
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Enhanced Filter Dialog */}
        <Dialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              Advanced Filters
              <IconButton onClick={() => setFilterDialogOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {/* Badge Filter */}
            <Box mb={3}>
              <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                Badges
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {Array.from(ownedBadges).map((badgeKey) => {
                  const badge = badgeData[badgeKey];
                  if (!badge) return null;
                  const isSelected = filters.selectedBadges.includes(badgeKey);
                  
                  return (
                    <Chip
                      key={badgeKey}
                      icon={
                        <img 
                          src={`${import.meta.env.BASE_URL}badges/${badgeKey}.png`}
                          alt={badge.displayName}
                          style={{ 
                            width: 20, 
                            height: 20,
                            objectFit: 'contain',
                            marginLeft: 4
                          }}
                        />
                      }
                      label={badge.displayName}
                      onClick={() => {
                        if (isSelected) {
                          setFilters({
                            ...filters,
                            selectedBadges: filters.selectedBadges.filter(b => b !== badgeKey)
                          });
                        } else {
                          setFilters({
                            ...filters,
                            selectedBadges: [...filters.selectedBadges, badgeKey]
                          });
                        }
                      }}
                      color={isSelected ? "secondary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      sx={{
                        borderColor: isSelected ? '#ffa300' : 'rgba(255, 255, 255, 0.2)',
                        color: isSelected ? '#000' : '#fff',
                        '& .MuiChip-icon': {
                          marginLeft: '4px',
                          marginRight: '-4px',
                        }
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Trait Filters */}
            {Object.entries(traitOptions).map(([trait, options]) => (
              <Box key={trait} mb={3}>
                <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1, textTransform: 'capitalize' }}>
                  {trait}
                </Typography>
                <Autocomplete
                  multiple
                  options={options}
                  value={filters.selectedTraits[trait as keyof typeof filters.selectedTraits]}
                  onChange={(_, newValue) => {
                    setFilters({
                      ...filters,
                      selectedTraits: {
                        ...filters.selectedTraits,
                        [trait]: newValue
                      }
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      placeholder={`Select ${trait}...`}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#ffa300',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#f74d71',
                          },
                        },
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        sx={{ color: '#fff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                      />
                    ))
                  }
                  sx={{
                    '& .MuiAutocomplete-popupIndicator': { color: 'rgba(255, 255, 255, 0.5)' },
                    '& .MuiAutocomplete-clearIndicator': { color: 'rgba(255, 255, 255, 0.5)' },
                  }}
                />
              </Box>
            ))}

            {/* Rarity Range */}
            <Box mb={3}>
              <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                Rarity Score Range
              </Typography>
              <Slider
                value={filters.rarityRange}
                onChange={(_, newValue) => setFilters({ ...filters, rarityRange: newValue as [number, number] })}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                sx={{
                  color: '#f74d71',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#f74d71',
                  },
                }}
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  {filters.rarityRange[0]}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  {filters.rarityRange[1]}
                </Typography>
              </Box>
            </Box>

            {/* Listing Status */}
            <Box mb={3}>
              <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                Listing Status
              </Typography>
              <ToggleButtonGroup
                value={filters.showListed}
                exclusive
                onChange={(_, newValue) => newValue && setFilters({ ...filters, showListed: newValue })}
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    '&.Mui-selected': {
                      color: '#fff',
                      backgroundColor: 'rgba(247, 77, 113, 0.2)',
                    },
                  },
                }}
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="listed">Listed Only</ToggleButton>
                <ToggleButton value="unlisted">Unlisted Only</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
            <Button onClick={clearAllFilters} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Clear All
            </Button>
            <Button
              onClick={() => setFilterDialogOpen(false)}
              variant="contained"
              sx={{
                backgroundColor: '#f74d71',
                '&:hover': {
                  backgroundColor: '#d63b5f',
                },
              }}
            >
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>

        {/* NFT Detail Modal - OpenSea Style */}
        <Dialog
          open={!!selectedNft}
          onClose={() => setSelectedNft(null)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#1a1a1a',
              border: 'none',
              borderRadius: 2,
              height: '90vh',
              maxHeight: '900px',
            },
          }}
        >
          {selectedNft && (
            <Box sx={{ display: 'flex', height: '100%', position: 'relative' }}>
              {/* Close Button */}
              <IconButton
                onClick={() => setSelectedNft(null)}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  zIndex: 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  },
                }}
              >
                <Close />
              </IconButton>

              {/* Left Side - Image */}
              <Box
                sx={{
                  flex: '0 0 45%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0a0a0a',
                  p: 3,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={getWebPImageUrl(selectedNft.token_id)}
                  alt={selectedNft.name}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: 2,
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // If WebP fails, show error message
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = 'width: 400px; height: 400px; display: flex; align-items: center; justify-content: center; background: #2a2a2a; color: #888; font-size: 16px; border-radius: 16px; text-align: center; padding: 20px;';
                    errorDiv.textContent = 'Image temporarily unavailable';
                    target.parentElement?.appendChild(errorDiv);
                  }}
                />
              </Box>

              {/* Right Side - Details */}
              <Box
                sx={{
                  flex: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'auto',
                  backgroundColor: '#1a1a1a',
                }}
              >
                {/* Header */}
                <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                    {selectedNft.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={`Good Vibes Club`}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(247, 77, 113, 0.2)',
                        color: '#f74d71',
                        fontWeight: 600,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Owned by <strong style={{ color: '#fff' }}>You</strong>
                    </Typography>
                  </Box>
                </Box>

                {/* Price Section */}
                {(() => {
                  const nftListing = listings && listings[selectedNft.token_id];
                  const bestListing = nftListing?.bestListing;
                  return (
                    <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <Grid container spacing={3}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                            COLLECTION FLOOR
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                            {collectionFloorPrice > 0 ? `${collectionFloorPrice.toFixed(3)} ETH` : '--'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                            {bestListing ? 'LISTED PRICE' : 'STATUS'}
                          </Typography>
                          <Typography variant="h6" sx={{ color: bestListing ? '#4caf50' : '#fff', fontWeight: 600 }}>
                            {bestListing ? `${bestListing.price.toFixed(3)} ETH` : 'Not Listed'}
                          </Typography>
                        </Grid>
                        {selectedNft.rarityScore && (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                                RARITY
                              </Typography>
                              <Typography variant="h6" sx={{ color: '#ffa300', fontWeight: 600 }}>
                                #{selectedNft.rarityScore}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                                TOKEN ID
                              </Typography>
                              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                                #{selectedNft.token_id}
                              </Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Box>
                  );
                })()}

                {/* Action Buttons */}
                <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Stack spacing={2}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => openOpenSea(selectedNft.token_id)}
                      sx={{
                        backgroundColor: '#2081e2',
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: '#1868c7',
                        },
                      }}
                    >
                      View on OpenSea
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Wallpaper />}
                      onClick={() => {
                        setWallpaperNft(selectedNft); // Set the current NFT for wallpaper
                        setWallpaperDialogOpen(true);
                        setSelectedNft(null); // Close the detail modal
                      }}
                      sx={{
                        backgroundColor: '#ffa300',
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: '#ff8c00',
                        },
                      }}
                    >
                      Generate Wallpaper
                    </Button>
                  </Stack>
                </Box>

                {/* Traits Section */}
                <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                      Traits
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', ml: 1 }}>
                      ({[selectedNft.type, selectedNft.gender, selectedNft.background, selectedNft.body, selectedNft.face, selectedNft.hair].filter(Boolean).length})
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {selectedNft.background && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            backgroundColor: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.05)',
                            }
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#2081e2', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            BACKGROUND
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, mt: 0.5 }}>
                            {selectedNft.background}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                    {selectedNft.type && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            backgroundColor: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.05)',
                            }
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#2081e2', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            TYPE
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, mt: 0.5 }}>
                            {selectedNft.type}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                    {selectedNft.face && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            backgroundColor: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.05)',
                            }
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#2081e2', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            FACE
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, mt: 0.5 }}>
                            {selectedNft.face}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                    {selectedNft.gender && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            backgroundColor: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.05)',
                            }
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#2081e2', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            GENDER
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, mt: 0.5 }}>
                            {selectedNft.gender}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                    {selectedNft.body && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            backgroundColor: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.05)',
                            }
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#2081e2', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            BODY
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, mt: 0.5 }}>
                            {selectedNft.body}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                    {selectedNft.hair && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            backgroundColor: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.05)',
                            }
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#2081e2', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            HAIR
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, mt: 0.5 }}>
                            {selectedNft.hair}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>

                  {/* Badges Section */}
                  {[selectedNft.badge1, selectedNft.badge2, selectedNft.badge3, selectedNft.badge4, selectedNft.badge5].filter(Boolean).length > 0 && (
                    <>
                      <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                      <Box>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                          Badges
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={2}>
                          {[selectedNft.badge1, selectedNft.badge2, selectedNft.badge3, selectedNft.badge4, selectedNft.badge5]
                            .filter(Boolean)
                            .map((badgeKey, index) => {
                              const badge = badgeData[badgeKey as string];
                              if (!badge) return null;
                              
                              return (
                                <Paper
                                  key={index}
                                  sx={{
                                    p: 2,
                                    backgroundColor: 'rgba(247, 77, 113, 0.1)',
                                    border: '1px solid rgba(247, 77, 113, 0.3)',
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                  }}
                                >
                                  <img
                                    src={`${import.meta.env.BASE_URL}badges/${badgeKey}.png`}
                                    alt={badge.displayName}
                                    style={{
                                      width: 40,
                                      height: 40,
                                      objectFit: 'contain',
                                    }}
                                  />
                                  <Box>
                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                                      {badge.displayName}
                                    </Typography>
                                  </Box>
                                </Paper>
                              );
                            })}
                        </Box>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Dialog>

        {/* Wallpaper Generator Dialog */}
        <WallpaperGenerator
          open={wallpaperDialogOpen}
          onClose={() => {
            setWallpaperDialogOpen(false);
            setWallpaperNft(null); // Clear wallpaper NFT selection
          }}
          selectedNfts={wallpaperNft ? [wallpaperNft] : filteredNfts}
          badgeData={badgeData}
        />
      </Container>
    </Box>
  );
};

export default Profile;