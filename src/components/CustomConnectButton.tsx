import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Box } from '@mui/material';

interface CustomConnectButtonProps {
  isMobile?: boolean;
}

const CustomConnectButton: React.FC<CustomConnectButtonProps> = ({ isMobile = false }) => {
  return (
    <Box
      sx={{
        // Remove all wrapper styling
        '& > div': {
          background: 'none !important',
          border: 'none !important',
          padding: '0 !important',
          margin: '0 !important',
          borderRadius: '0 !important',
          boxShadow: 'none !important'
        },
        // Remove any nested wrapper styling
        '& > div > div': {
          background: 'none !important',
          border: 'none !important',
          padding: '0 !important',
          margin: '0 !important',
          borderRadius: '0 !important',
          boxShadow: 'none !important'
        },
        // Style the actual button for both connect and connected states
        '& button, & > div > button, & > div > div > button': {
          background: 'linear-gradient(45deg, #ffa300, #f74d71) !important',
          border: 'none !important',
          borderRadius: '8px !important',
          color: '#fff !important',
          fontWeight: '600 !important',
          fontSize: isMobile ? '0.75rem !important' : '0.875rem !important',
          padding: isMobile ? '6px 12px !important' : '8px 16px !important',
          minHeight: isMobile ? '32px !important' : '36px !important',
          maxHeight: isMobile ? '32px !important' : '36px !important',
          textTransform: 'none !important',
          transition: 'all 0.2s ease !important',
          boxShadow: 'none !important',
          maxWidth: '180px !important',
          overflow: 'hidden !important',
          textOverflow: 'ellipsis !important',
          whiteSpace: 'nowrap !important',
          '&:hover': {
            background: 'linear-gradient(45deg, #ff8c00, #e63946) !important',
            transform: 'translateY(-1px) !important',
            boxShadow: '0 4px 12px rgba(247, 77, 113, 0.3) !important'
          }
        },
        // Style all text inside buttons and remove any backgrounds
        '& button *, & > div > button *, & > div > div > button *': {
          color: '#fff !important',
          fontWeight: '600 !important',
          background: 'none !important',
          backgroundColor: 'transparent !important'
        },
        // Target any nested elements inside the button that might have backgrounds
        '& button > *, & button div, & button span': {
          background: 'none !important',
          backgroundColor: 'transparent !important',
          color: '#fff !important'
        }
      }}
    >
      <ConnectButton 
        showBalance={false}
        chainStatus="none"
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'address',
        }}
      />
    </Box>
  );
};

export default CustomConnectButton;