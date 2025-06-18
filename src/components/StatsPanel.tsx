import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useAnalytics } from '../contexts/AnalyticsContext';

const StatsPanel: React.FC = () => {
  const { analytics, showStatsPanel, setShowStatsPanel } = useAnalytics();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const handlePasswordSubmit = () => {
    if (password === 'vibes') {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
      setPassword('');
    } else {
      setPassword('');
      // Add shake animation or error message here
    }
  };

  const handleClose = () => {
    setShowStatsPanel(false);
    setIsAuthenticated(false);
    setShowPasswordPrompt(false);
    setPassword('');
  };

  // Show password prompt first if not authenticated
  if (showStatsPanel && !isAuthenticated) {
    if (!showPasswordPrompt) {
      setShowPasswordPrompt(true);
    }

    return (
      <Dialog 
        open={showStatsPanel} 
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2a2a2a',
            color: '#fff',
            border: '1px solid #404040'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #404040'
        }}>
          <Typography variant="h6" sx={{ color: '#f74d71', fontWeight: 600 }}>
            Access Required
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: '#aaa' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Typography variant="body1" sx={{ textAlign: 'center', mb: 2 }}>
              Enter password to view analytics dashboard
            </Typography>
            <TextField
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Password"
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  '& fieldset': { borderColor: '#404040' },
                  '&:hover fieldset': { borderColor: '#f74d71' },
                  '&.Mui-focused fieldset': { borderColor: '#f74d71' }
                },
                '& .MuiInputBase-input::placeholder': { color: '#aaa' }
              }}
            />
            <Button 
              onClick={handlePasswordSubmit}
              variant="contained"
              sx={{ 
                backgroundColor: '#f74d71',
                '&:hover': { backgroundColor: '#e63950' }
              }}
            >
              Access Dashboard
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // Show stats dashboard if authenticated
  if (!showStatsPanel || !isAuthenticated) return null;

  const topSearches = Object.entries(analytics.searchStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const topFilters = Object.entries(analytics.filterStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const topCountries = Object.entries(analytics.countryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  return (
    <Dialog 
      open={showStatsPanel} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#2a2a2a',
          color: '#fff',
          border: '1px solid #404040',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #404040'
      }}>
        <Typography variant="h5" sx={{ 
          background: 'linear-gradient(45deg, #ffa300, #f74d71)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700
        }}>
          Vibes Analytics Dashboard
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: '#aaa' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* Overview Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              backgroundColor: 'rgba(247, 77, 113, 0.1)', 
              border: '1px solid rgba(247, 77, 113, 0.3)',
              textAlign: 'center'
            }}>
              <VisibilityIcon sx={{ fontSize: 40, color: '#f74d71', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#f74d71', fontWeight: 700 }}>
                {analytics.totalVisitors}
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Total Visitors
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              backgroundColor: 'rgba(255, 163, 0, 0.1)', 
              border: '1px solid rgba(255, 163, 0, 0.3)',
              textAlign: 'center'
            }}>
              <PublicIcon sx={{ fontSize: 40, color: '#ffa300', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#ffa300', fontWeight: 700 }}>
                {Object.keys(analytics.countryStats).length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Countries
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              backgroundColor: 'rgba(0, 255, 150, 0.1)', 
              border: '1px solid rgba(0, 255, 150, 0.3)',
              textAlign: 'center'
            }}>
              <SearchIcon sx={{ fontSize: 40, color: '#00ff96', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#00ff96', fontWeight: 700 }}>
                {Object.values(analytics.searchStats).reduce((a, b) => a + b, 0)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Total Searches
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              backgroundColor: 'rgba(138, 43, 226, 0.1)', 
              border: '1px solid rgba(138, 43, 226, 0.3)',
              textAlign: 'center'
            }}>
              <FilterListIcon sx={{ fontSize: 40, color: '#8a2be2', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#8a2be2', fontWeight: 700 }}>
                {Object.values(analytics.filterStats).reduce((a, b) => a + b, 0)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Filter Uses
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Detailed Stats */}
        <Grid container spacing={3}>
          {/* Top Countries */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 2, 
              backgroundColor: 'rgba(255,255,255,0.03)', 
              border: '1px solid #404040',
              height: 400
            }}>
              <Typography variant="h6" sx={{ color: '#f74d71', mb: 2, fontWeight: 600 }}>
                Top Countries
              </Typography>
              <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                {topCountries.map(([country, count], index) => (
                  <ListItem key={country} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            {index + 1}. {country}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ffa300', fontWeight: 600 }}>
                            {count}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Top Searches */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 2, 
              backgroundColor: 'rgba(255,255,255,0.03)', 
              border: '1px solid #404040',
              height: 400
            }}>
              <Typography variant="h6" sx={{ color: '#f74d71', mb: 2, fontWeight: 600 }}>
                Most Searched Terms
              </Typography>
              <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                {topSearches.map(([query, count], index) => (
                  <ListItem key={query} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            {index + 1}. {query}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#00ff96', fontWeight: 600 }}>
                            {count}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Top Filters */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 2, 
              backgroundColor: 'rgba(255,255,255,0.03)', 
              border: '1px solid #404040',
              height: 400
            }}>
              <Typography variant="h6" sx={{ color: '#f74d71', mb: 2, fontWeight: 600 }}>
                Most Used Filters
              </Typography>
              <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                {topFilters.map(([filter, count], index) => (
                  <ListItem key={filter} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            {index + 1}. {filter}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#8a2be2', fontWeight: 600 }}>
                            {count}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: '#404040' }} />

        {/* Recent Sessions */}
        <Typography variant="h6" sx={{ color: '#f74d71', mb: 2, fontWeight: 600 }}>
          Recent Sessions ({analytics.sessions.length})
        </Typography>
        <Paper sx={{ 
          p: 2, 
          backgroundColor: 'rgba(255,255,255,0.03)', 
          border: '1px solid #404040',
          maxHeight: 300,
          overflow: 'auto'
        }}>
          {analytics.sessions.slice(-20).reverse().map((session) => (
            <Box key={session.sessionId} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #404040' }}>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                {new Date(session.timestamp).toLocaleString()} - {session.country}
              </Typography>
              <Typography variant="body2" sx={{ color: '#fff', mt: 0.5 }}>
                Searches: {session.searchQueries.length} | 
                Filters: {Object.values(session.filterUsage).reduce((a, b) => a + b, 0)}
              </Typography>
            </Box>
          ))}
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default StatsPanel;