import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName, useEnsAvatar, useChainId, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WarningIcon from '@mui/icons-material/Warning';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';

interface FullyCustomConnectButtonProps {
  isMobile?: boolean;
}

const FullyCustomConnectButton: React.FC<FullyCustomConnectButtonProps> = ({ isMobile = false }) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName ?? undefined });
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { mode } = useTheme();
  const { ownedTokenIds, isLoadingOwnership } = useWallet();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  
  const isWrongNetwork = chainId !== mainnet.id;
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isConnected) {
      setAnchorEl(event.currentTarget);
    } else {
      openConnectModal?.();
    }
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setShowCopySuccess(true);
      handleClose();
    }
  };
  
  const handleDisconnect = () => {
    disconnect();
    handleClose();
  };
  
  const formatAddress = (addr: string) => {
    if (isMobile) {
      return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    }
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  const handleSwitchNetwork = () => {
    switchChain?.({ chainId: mainnet.id });
    handleClose();
  };
  
  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <Button
          onClick={handleClick}
          disabled={isConnecting}
          sx={{
            background: isWrongNetwork 
              ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)' 
              : 'linear-gradient(45deg, #ffa300, #f74d71)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 600,
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            padding: isMobile ? '6px 12px' : '8px 16px',
            minHeight: isMobile ? '32px' : '36px',
            textTransform: 'none',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            opacity: isConnecting ? 0.7 : 1,
            '&:hover': {
              background: isWrongNetwork
                ? 'linear-gradient(45deg, #ff5252, #d63031)'
                : 'linear-gradient(45deg, #ff8c00, #e63946)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(247, 77, 113, 0.3)'
            },
            '&:disabled': {
              opacity: 0.7
            }
          }}
        >
          {isConnecting ? (
            <>
              <CircularProgress size={16} color="inherit" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Connecting...
              </Typography>
            </>
          ) : isConnected && address ? (
          <>
            {isWrongNetwork && (
              <WarningIcon sx={{ fontSize: isMobile ? 16 : 18, mr: 0.5 }} />
            )}
            {ensAvatar ? (
              <Avatar 
                src={ensAvatar} 
                sx={{ 
                  width: isMobile ? 20 : 24, 
                  height: isMobile ? 20 : 24,
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }} 
              />
            ) : (
              <Box
                sx={{
                  width: isMobile ? 20 : 24,
                  height: isMobile ? 20 : 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {address.slice(2, 4).toUpperCase()}
              </Box>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1 }}>
                {ensName || formatAddress(address)}
              </Typography>
              {!isLoadingOwnership && ownedTokenIds.length > 0 && (
                <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8, lineHeight: 1 }}>
                  {ownedTokenIds.length} GVC
                </Typography>
              )}
            </Box>
          </>
        ) : (
          <>
            <AccountBalanceWalletIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Connect Wallet
            </Typography>
          </>
        )}
      </Button>
      
      {isWrongNetwork && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '6px solid #ff6b6b',
            animation: 'pulse 2s infinite'
          }}
        />
      )}
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: mode === 'dark' ? '#2a2a2a' : '#fff',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: mode === 'dark' ? '#404040' : '#e0e0e0',
            boxShadow: mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            minWidth: 220,
            mt: 1
          }
        }}
      >
        {address && (
          <>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: mode === 'dark' ? '#aaa' : '#666',
                  fontWeight: 500 
                }}
              >
                Connected with
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                {ensAvatar ? (
                  <Avatar src={ensAvatar} sx={{ width: 32, height: 32 }} />
                ) : (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}
                  >
                    {address.slice(2, 4).toUpperCase()}
                  </Box>
                )}
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: mode === 'dark' ? '#fff' : '#000'
                    }}
                  >
                    {ensName || formatAddress(address)}
                  </Typography>
                  {ensName && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: mode === 'dark' ? '#aaa' : '#666',
                        fontSize: '0.7rem'
                      }}
                    >
                      {formatAddress(address)}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ borderColor: mode === 'dark' ? '#404040' : '#e0e0e0' }} />
            
            {isWrongNetwork && (
              <>
                <MenuItem 
                  onClick={handleSwitchNetwork}
                  sx={{
                    py: 1.5,
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 107, 107, 0.2)'
                    }
                  }}
                >
                  <WarningIcon sx={{ mr: 1.5, fontSize: 20, color: '#ff6b6b' }} />
                  <Typography variant="body2" sx={{ color: '#ff6b6b', fontWeight: 500 }}>
                    Switch to Ethereum
                  </Typography>
                </MenuItem>
                <Divider sx={{ borderColor: mode === 'dark' ? '#404040' : '#e0e0e0' }} />
              </>
            )}
            
            {!isLoadingOwnership && ownedTokenIds.length > 0 && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: mode === 'dark' ? '#aaa' : '#666',
                    fontSize: '0.7rem'
                  }}
                >
                  You own {ownedTokenIds.length} GVC NFT{ownedTokenIds.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
            
            <MenuItem 
              onClick={handleCopyAddress}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: mode === 'dark' 
                    ? 'rgba(247, 77, 113, 0.1)' 
                    : 'rgba(247, 77, 113, 0.05)'
                }
              }}
            >
              <ContentCopyIcon sx={{ mr: 1.5, fontSize: 20, color: '#f74d71' }} />
              <Typography variant="body2" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>Copy Address</Typography>
            </MenuItem>
            
            <MenuItem 
              onClick={handleDisconnect}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: mode === 'dark' 
                    ? 'rgba(247, 77, 113, 0.1)' 
                    : 'rgba(247, 77, 113, 0.05)'
                }
              }}
            >
              <PowerSettingsNewIcon sx={{ mr: 1.5, fontSize: 20, color: '#f74d71' }} />
              <Typography variant="body2" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>Disconnect</Typography>
            </MenuItem>
          </>
        )}
      </Menu>
      
      <Snackbar
        open={showCopySuccess}
        autoHideDuration={2000}
        onClose={() => setShowCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            backgroundColor: '#4caf50',
            color: '#fff',
            '& .MuiAlert-icon': {
              color: '#fff'
            }
          }}
        >
          Address copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default FullyCustomConnectButton;