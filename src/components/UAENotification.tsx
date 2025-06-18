import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Alert, 
  Snackbar, 
  IconButton, 
  Typography,
  Collapse
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { isUAEUser, getUserCountry } from '../utils/locationUtils';

const UAENotification: React.FC = () => {
  const [isUAE, setIsUAE] = useState(false);
  const [country, setCountry] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkUAEStatus = async () => {
      try {
        const uaeStatus = await isUAEUser();
        const userCountry = await getUserCountry();
        
        setIsUAE(uaeStatus);
        setCountry(userCountry);
        
        if (uaeStatus && !dismissed) {
          // Show notification after a brief delay
          setTimeout(() => setShowNotification(true), 2000);
        }
      } catch (error) {
        console.warn('Failed to check UAE status:', error);
      }
    };

    checkUAEStatus();
  }, [dismissed]);

  const handleDismiss = () => {
    setShowNotification(false);
    setDismissed(true);
    // Remember dismissal for this session
    sessionStorage.setItem('uae_notification_dismissed', 'true');
  };

  // Check if notification was already dismissed in this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('uae_notification_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  if (!isUAE || dismissed) {
    return null;
  }

  return (
    <Snackbar
      open={showNotification}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ 
        mt: 8, // Account for header height
        maxWidth: '90vw'
      }}
    >
      <Alert
        severity="info"
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleDismiss}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{
          backgroundColor: 'rgba(0, 150, 255, 0.1)',
          color: '#fff',
          border: '1px solid rgba(0, 150, 255, 0.3)',
          '& .MuiAlert-icon': {
            color: '#0096ff'
          },
          '& .MuiAlert-message': {
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            🇦🇪 UAE Optimized Experience
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            We've detected you're browsing from {country}. Images are being served 
            from our optimized servers for the best experience in your region.
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default UAENotification;