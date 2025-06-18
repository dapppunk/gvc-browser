import React, { createContext, useContext, useEffect, useState } from 'react';

interface VisitorData {
  sessionId: string;
  country: string;
  timestamp: number;
  searchQueries: string[];
  filterUsage: Record<string, number>;
}

interface AnalyticsData {
  totalVisitors: number;
  uniqueVisitors: number;
  countryStats: Record<string, number>;
  searchStats: Record<string, number>;
  filterStats: Record<string, number>;
  sessions: VisitorData[];
}

interface AnalyticsContextType {
  analytics: AnalyticsData;
  trackSearch: (query: string) => void;
  trackFilter: (filterType: string) => void;
  showStatsPanel: boolean;
  setShowStatsPanel: (show: boolean) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Generate a unique session ID
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get visitor's country (simplified - in production would use IP geolocation)
const getVisitorCountry = async (): Promise<string> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_name || 'Unknown';
  } catch {
    return 'Unknown';
  }
};

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalVisitors: 0,
    uniqueVisitors: 0,
    countryStats: {},
    searchStats: {},
    filterStats: {},
    sessions: []
  });
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [currentSession] = useState<VisitorData>({
    sessionId: generateSessionId(),
    country: 'Unknown',
    timestamp: Date.now(),
    searchQueries: [],
    filterUsage: {}
  });

  // Initialize analytics from localStorage
  useEffect(() => {
    const loadAnalytics = () => {
      try {
        const stored = localStorage.getItem('gvc_analytics');
        if (stored) {
          const data = JSON.parse(stored);
          setAnalytics(data);
        }
      } catch (error) {
        console.warn('Failed to load analytics data');
      }
    };

    loadAnalytics();
  }, []);

  // Track new session
  useEffect(() => {
    const initSession = async () => {
      const country = await getVisitorCountry();
      currentSession.country = country;

      setAnalytics(prev => {
        const isNewSession = !prev.sessions.find(s => 
          s.sessionId === currentSession.sessionId
        );

        if (isNewSession) {
          const newAnalytics = {
            ...prev,
            totalVisitors: prev.totalVisitors + 1,
            uniqueVisitors: prev.uniqueVisitors + 1,
            countryStats: {
              ...prev.countryStats,
              [country]: (prev.countryStats[country] || 0) + 1
            },
            sessions: [...prev.sessions, currentSession].slice(-1000) // Keep last 1000 sessions
          };

          // Save to localStorage
          try {
            localStorage.setItem('gvc_analytics', JSON.stringify(newAnalytics));
          } catch (error) {
            console.warn('Failed to save analytics data');
          }

          return newAnalytics;
        }
        
        return prev;
      });
    };

    initSession();
  }, [currentSession]);

  const trackSearch = (query: string) => {
    if (!query.trim()) return;

    currentSession.searchQueries.push(query);

    setAnalytics(prev => {
      const newAnalytics = {
        ...prev,
        searchStats: {
          ...prev.searchStats,
          [query]: (prev.searchStats[query] || 0) + 1
        }
      };

      try {
        localStorage.setItem('gvc_analytics', JSON.stringify(newAnalytics));
      } catch (error) {
        console.warn('Failed to save analytics data');
      }

      return newAnalytics;
    });
  };

  const trackFilter = (filterType: string) => {
    currentSession.filterUsage[filterType] = 
      (currentSession.filterUsage[filterType] || 0) + 1;

    setAnalytics(prev => {
      const newAnalytics = {
        ...prev,
        filterStats: {
          ...prev.filterStats,
          [filterType]: (prev.filterStats[filterType] || 0) + 1
        }
      };

      try {
        localStorage.setItem('gvc_analytics', JSON.stringify(newAnalytics));
      } catch (error) {
        console.warn('Failed to save analytics data');
      }

      return newAnalytics;
    });
  };

  return (
    <AnalyticsContext.Provider value={{
      analytics,
      trackSearch,
      trackFilter,
      showStatsPanel,
      setShowStatsPanel
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};