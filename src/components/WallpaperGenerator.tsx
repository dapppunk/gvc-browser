import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Close,
  Download,
  Wallpaper,
  CheckCircle,
} from '@mui/icons-material';
import { NFT } from '../types';
import { ipfsToUrl } from '../utils/ipfs';
import { BadgeData } from '../utils/badges';

interface WallpaperGeneratorProps {
  open: boolean;
  onClose: () => void;
  selectedNfts: NFT[];
  badgeData: BadgeData;
}

const phoneModels = [
  { name: 'iPhone 14 Pro', width: 1179, height: 2556 },
  { name: 'iPhone 14', width: 1170, height: 2532 },
  { name: 'iPhone 13 Pro', width: 1170, height: 2532 },
  { name: 'iPhone 16 Pro', width: 1179, height: 2556, scale: 1 },
];

// Special NFT IDs that require different handling
const cosmicIds = ['5301', '4425', '489'];
const objectIds = ['5984', '48', '42', '28', '251', '232', '182', '14', '117', '114', '113', '534'];

const WallpaperGenerator: React.FC<WallpaperGeneratorProps> = ({
  open,
  onClose,
  selectedNfts,
  badgeData,
}) => {
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [selectedPhone, setSelectedPhone] = useState(phoneModels[0]);
  const [showGVC, setShowGVC] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCosmic, setIsCosmic] = useState(false);
  const [isWithObjects, setIsWithObjects] = useState(false);
  const [cosmicTopHalf, setCosmicTopHalf] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset when dialog opens
  useEffect(() => {
    if (open && selectedNfts.length > 0) {
      const firstNft = selectedNfts[0];
      setSelectedNft(firstNft);
      
      // Check if it's cosmic or with objects
      setIsCosmic(cosmicIds.includes(firstNft.token_id));
      setIsWithObjects(objectIds.includes(firstNft.token_id));
      
      // Auto-select NFT's badges
      const nftBadges = [
        firstNft.badge1,
        firstNft.badge2,
        firstNft.badge3,
        firstNft.badge4,
        firstNft.badge5,
      ].filter(Boolean) as string[];
      setSelectedBadges(nftBadges.slice(0, 5));
    }
  }, [open, selectedNfts]);

  const handleBadgeToggle = (badgeKey: string) => {
    if (selectedBadges.includes(badgeKey)) {
      setSelectedBadges(selectedBadges.filter(b => b !== badgeKey));
    } else if (selectedBadges.length < 5) {
      setSelectedBadges([...selectedBadges, badgeKey]);
    }
  };

  const generateWallpaper = () => {
    if (!selectedNft || !canvasRef.current) return;
    if (selectedBadges.length < 2) {
      alert('Please select at least 2 badges.');
      return;
    }
    
    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: cW, height: cH } = selectedPhone;
    canvas.width = cW;
    canvas.height = cH;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      const imgRatio = img.width / img.height;
      const drawWidth = cW;
      const drawHeight = Math.round(cW / imgRatio);
      let offsetY = Math.round(cH - drawHeight);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      tempCtx.drawImage(img, 0, 0);

      let sampleCanvas, sampleCtx, darkColor;
      
      if (isWithObjects) {
        // "With objects" special approach
        const startY = 10;
        const sampleHeight = 20;
        
        sampleCanvas = document.createElement('canvas');
        const quarterWidth = Math.floor(cW / 4);
        sampleCanvas.width = quarterWidth;
        sampleCanvas.height = sampleHeight;
        sampleCtx = sampleCanvas.getContext('2d');
        if (!sampleCtx) return;
        sampleCtx.drawImage(img, 0, startY, quarterWidth, sampleHeight, 0, 0, quarterWidth, sampleHeight);

        const imageData = sampleCtx.getImageData(0, 0, quarterWidth, sampleHeight).data;
        let darkest = [255, 255, 255];
        for (let i = 0; i < imageData.length; i += 4) {
          const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
          if (brightness < (darkest[0] + darkest[1] + darkest[2]) / 3) {
            darkest = [imageData[i], imageData[i + 1], imageData[i + 2]];
          }
        }
        darkColor = `rgb(${Math.max(0, darkest[0] - 50)}, ${Math.max(0, darkest[1] - 50)}, ${Math.max(0, darkest[2] - 50)})`;

        const pattern = ctx.createPattern(sampleCanvas, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, cW, offsetY);
        }
        ctx.drawImage(img, 0, offsetY, drawWidth, drawHeight);
        
      } else if (isCosmic && cosmicTopHalf) {
        // Cosmic NFT logic with upper half
        const upperImg = new Image();
        upperImg.crossOrigin = 'anonymous';
        upperImg.onload = async () => {
          const upperRatio = upperImg.width / upperImg.height;
          const upperHeight = Math.min(offsetY, Math.round(cW / upperRatio));
          offsetY = upperHeight;

          // Draw upper half
          ctx.drawImage(upperImg, 0, 0, cW, offsetY);
          // Draw main image
          ctx.drawImage(img, 0, offsetY, drawWidth, drawHeight);

          // Thick line to hide seam
          const lineThickness = 10;
          darkColor = 'black';
          ctx.fillStyle = darkColor;
          ctx.fillRect(0, Math.round(offsetY - lineThickness / 2), cW, lineThickness);
          ctx.fillRect(0, 1170, cW, lineThickness);

          await finishDrawing(ctx, cW, offsetY, darkColor);
        };
        upperImg.src = cosmicTopHalf;
        return;
        
      } else {
        // Regular NFT logic
        const startY = 10;
        let sampleHeight = 30;
        if (startY + sampleHeight >= img.height) sampleHeight = img.height - startY - 1;

        sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = cW;
        sampleCanvas.height = sampleHeight;
        sampleCtx = sampleCanvas.getContext('2d');
        if (!sampleCtx) return;
        sampleCtx.drawImage(img, 0, startY, img.width, sampleHeight, 0, 0, cW, sampleHeight);

        const imageData = sampleCtx.getImageData(0, 0, cW, sampleHeight).data;
        let darkest = [255, 255, 255];
        for (let i = 0; i < imageData.length; i += 4) {
          const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
          if (brightness < (darkest[0] + darkest[1] + darkest[2]) / 3) {
            darkest = [imageData[i], imageData[i + 1], imageData[i + 2]];
          }
        }
        darkColor = `rgb(${Math.max(0, darkest[0] - 50)}, ${Math.max(0, darkest[1] - 50)}, ${Math.max(0, darkest[2] - 50)})`;

        const pattern = ctx.createPattern(sampleCanvas, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, cW, cH);
        }
        ctx.drawImage(img, 0, offsetY, drawWidth, drawHeight);
      }

      // Common lines and finishing
      const lineThickness = 10;
      ctx.fillStyle = darkColor || 'black';
      ctx.beginPath();
      ctx.rect(0, Math.round(offsetY - lineThickness / 2), cW, lineThickness);
      ctx.fill();
      ctx.beginPath();
      ctx.rect(0, 1170, cW, lineThickness);
      ctx.fill();

      await finishDrawing(ctx, cW, offsetY, darkColor || 'black');
    };

    img.onerror = () => {
      alert('Failed to load image. Try another or check CORS settings.');
      setIsGenerating(false);
    };
    
    img.src = ipfsToUrl(selectedNft.image_url || selectedNft.image);
  };

  const finishDrawing = async (ctx: CanvasRenderingContext2D, cW: number, offsetY: number, darkColor: string) => {
    // GVC text
    if (showGVC) {
      ctx.fillStyle = darkColor;
      ctx.font = 'bold 80px Comic Sans MS';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      ctx.fillText('GVC', 50, (offsetY + 1170) / 2);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Badges
    console.log('Selected badges:', selectedBadges);
    if (selectedBadges.length >= 2 && selectedBadges.length <= 5) {
      const badgeMaxWidth = 150;
      const badgeGap = 20;
      
      // First load badges to get actual dimensions
      let adjustedStartX = 0;

      // Load all badge images with promises
      const badgePromises = selectedBadges.map((badgeKey) => {
        return new Promise<HTMLImageElement | null>((resolve) => {
          if (!badgeKey) {
            resolve(null);
            return;
          }
          
          const badgeImg = new Image();
          badgeImg.crossOrigin = 'anonymous';
          badgeImg.onload = () => {
            console.log(`Successfully loaded badge: ${badgeKey}`);
            resolve(badgeImg);
          };
          badgeImg.onerror = () => {
            console.error(`Failed to load badge ${badgeKey} from path: ${import.meta.env.BASE_URL}badges/${badgeKey}.png`);
            // Try without BASE_URL as fallback
            const fallbackImg = new Image();
            fallbackImg.crossOrigin = 'anonymous';
            fallbackImg.onload = () => {
              console.log(`Loaded badge with fallback: ${badgeKey}`);
              resolve(fallbackImg);
            };
            fallbackImg.onerror = () => {
              console.error(`Failed to load badge even with fallback: /badges/${badgeKey}.png`);
              resolve(null);
            };
            fallbackImg.src = `/badges/${badgeKey}.png`;
          };
          // Use direct path without BASE_URL for Vite
          badgeImg.src = `/badges/${badgeKey}.png`;
        });
      });

      try {
        const badgeImages = await Promise.all(badgePromises);
        
        // Calculate total width needed for all badges
        let totalWidth = 0;
        const badgeSizes: Array<{width: number, height: number}> = [];
        
        badgeImages.forEach((img) => {
          if (img) {
            const aspectRatio = img.width / img.height;
            const badgeWidth = Math.min(badgeMaxWidth, img.width);
            const badgeHeight = badgeWidth / aspectRatio;
            badgeSizes.push({ width: badgeWidth, height: badgeHeight });
            totalWidth += badgeWidth;
          }
        });
        
        // Add gaps to total width
        totalWidth += (badgeSizes.length - 1) * badgeGap;
        
        // Calculate starting position for centering
        if (showGVC) {
          ctx.font = 'bold 80px Comic Sans MS';
          const gvcWidth = ctx.measureText('GVC').width;
          const startAfterGVC = 50 + gvcWidth + 30;
          const availableWidth = cW - startAfterGVC - 10;
          adjustedStartX = startAfterGVC + (availableWidth - totalWidth) / 2;
        } else {
          // Center across full width
          adjustedStartX = (cW - totalWidth) / 2;
        }
        
        // Draw badges
        let currentX = adjustedStartX;
        badgeImages.forEach((img, idx) => {
          if (img && badgeSizes[idx]) {
            const { width: badgeWidth, height: badgeHeight } = badgeSizes[idx];
            const badgeY = (offsetY + 1170 - badgeHeight) / 2;
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(img, currentX, badgeY, badgeWidth, badgeHeight);
            currentX += badgeWidth + badgeGap;
          }
        });
      } catch (error) {
        console.error('Failed to load badges:', error);
      }
    }
    
    setPreviewUrl(canvasRef.current?.toDataURL('image/png') || null);
    setIsGenerating(false);
  };

  const downloadWallpaper = () => {
    const canvas = canvasRef.current;
    if (!canvas || !previewUrl || !selectedNft) {
      alert('No image to download. Generate a wallpaper first.');
      return;
    }
    
    // Use the existing canvas content directly
    const link = document.createElement('a');
    link.download = `${selectedNft.token_id}-WP-${selectedPhone.name.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Get all unique badges from selected NFTs
  const availableBadges = Array.from(new Set(
    selectedNfts.flatMap(nft => [
      nft.badge1,
      nft.badge2,
      nft.badge3,
      nft.badge4,
      nft.badge5,
    ].filter(Boolean))
  )) as string[];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          color: '#fff',
          minHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Wallpaper sx={{ color: '#f74d71' }} />
            <Typography variant="h6">Create Wallpaper</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Left side - Controls */}
          <Grid item xs={12} md={5}>
            {/* NFT Selection */}
            <Box mb={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                Select NFT
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedNft?.token_id || ''}
                  onChange={(e) => {
                    const nft = selectedNfts.find(n => n.token_id === e.target.value);
                    if (nft) {
                      setSelectedNft(nft);
                      setIsCosmic(cosmicIds.includes(nft.token_id));
                      setIsWithObjects(objectIds.includes(nft.token_id));
                      // Auto-select NFT's badges
                      const nftBadges = [
                        nft.badge1,
                        nft.badge2,
                        nft.badge3,
                        nft.badge4,
                        nft.badge5,
                      ].filter(Boolean) as string[];
                      setSelectedBadges(nftBadges.slice(0, 5));
                    }
                  }}
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  {selectedNfts.map((nft) => (
                    <MenuItem key={nft.token_id} value={nft.token_id}>
                      {nft.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Phone Model Selection */}
            <Box mb={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                Device
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedPhone.name}
                  onChange={(e) => {
                    const phone = phoneModels.find(p => p.name === e.target.value);
                    if (phone) setSelectedPhone(phone);
                  }}
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                >
                  {phoneModels.map((phone) => (
                    <MenuItem key={phone.name} value={phone.name}>
                      {phone.name} ({phone.width}x{phone.height})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Cosmic Top Half Upload - only show for cosmic NFTs */}
            {isCosmic && (
              <Box mb={3}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                  Upload Cosmic Upper Half (Optional)
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCosmicTopHalf(URL.createObjectURL(file));
                    }
                  }}
                  style={{
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </Box>
            )}

            {/* Badge Selection */}
            <Box mb={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                Select Badges (2-5 Required)
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {availableBadges.map((badgeKey) => {
                  const badge = badgeData[badgeKey];
                  if (!badge) return null;
                  const isSelected = selectedBadges.includes(badgeKey);
                  
                  return (
                    <Chip
                      key={badgeKey}
                      icon={
                        <img
                          src={`/badges/${badgeKey}.png`}
                          alt={badge.displayName}
                          style={{ width: 20, height: 20 }}
                        />
                      }
                      label={badge.displayName}
                      onClick={() => handleBadgeToggle(badgeKey)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      sx={{
                        borderColor: isSelected ? '#f74d71' : 'rgba(255, 255, 255, 0.2)',
                        backgroundColor: isSelected ? '#f74d71' : 'transparent',
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Options */}
            <Box mb={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showGVC}
                    onChange={(e) => setShowGVC(e.target.checked)}
                    sx={{ color: '#f74d71' }}
                  />
                }
                label='Show "GVC" text'
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              />
            </Box>

            {/* Generate Button */}
            <Button
              variant="contained"
              fullWidth
              onClick={generateWallpaper}
              disabled={!selectedNft || !selectedPhone || selectedBadges.length < 2 || isGenerating}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <Wallpaper />}
              sx={{
                backgroundColor: '#f74d71',
                '&:hover': { backgroundColor: '#d63b5f' },
                '&:disabled': { backgroundColor: 'rgba(247, 77, 113, 0.3)' },
                py: 1.5,
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate Wallpaper'}
            </Button>
            {selectedBadges.length < 2 && (
              <Typography variant="caption" sx={{ color: '#ff6b6b', mt: 1, display: 'block' }}>
                Please select at least 2 badges
              </Typography>
            )}
          </Grid>

          {/* Right side - Preview */}
          <Grid item xs={12} md={7}>
            <Box
              sx={{
                backgroundColor: '#0a0a0a',
                borderRadius: 2,
                p: 2,
                minHeight: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {previewUrl ? (
                <Box sx={{ textAlign: 'center' }}>
                  <img
                    src={previewUrl}
                    alt="Wallpaper Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '60vh',
                      borderRadius: 8,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={downloadWallpaper}
                    sx={{
                      mt: 2,
                      backgroundColor: '#4caf50',
                      '&:hover': { backgroundColor: '#45a049' },
                    }}
                  >
                    Download Wallpaper
                  </Button>
                </Box>
              ) : (
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Preview will appear here
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Hidden canvas for generation */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
          width={selectedPhone.width}
          height={selectedPhone.height}
        />
      </DialogContent>
    </Dialog>
  );
};

export default WallpaperGenerator;