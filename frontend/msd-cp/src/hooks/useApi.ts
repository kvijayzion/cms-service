import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { contentService, healthService, streamingService } from '../services/api';

// Hook for backend health monitoring
export const useBackendHealth = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    try {
      const healthy = await healthService.checkBackendHealth();
      setIsHealthy(healthy);
      setLastChecked(new Date());
    } catch (error) {
      setIsHealthy(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    // Initial health check
    checkHealth();

    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return { isHealthy, lastChecked, checkHealth };
};

// Hook for content management
export const useContentApi = () => {
  const { setVideos, videos } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllContents = async () => {
    setLoading(true);
    setError(null);
    try {
      const contents = await contentService.fetchAllContents();
      setVideos(contents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contents');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingContents = async () => {
    setLoading(true);
    setError(null);
    try {
      const contents = await contentService.fetchTrendingContents();
      setVideos(contents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending contents');
    } finally {
      setLoading(false);
    }
  };

  const searchContents = async (query: string) => {
    if (!query.trim()) {
      await loadAllContents();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const contents = await contentService.searchContents(query);
      setVideos(contents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search contents');
    } finally {
      setLoading(false);
    }
  };

  const loadContentsByCategory = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const contents = await contentService.fetchContentsByCategory(category);
      setVideos(contents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contents by category');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load contents on mount
  useEffect(() => {
    if (videos.length === 0) {
      loadAllContents();
    }
  }, []);

  return {
    loading,
    error,
    loadAllContents,
    loadTrendingContents,
    searchContents,
    loadContentsByCategory,
  };
};

// Hook for video streaming
export const useVideoStreaming = () => {
  const { currentUser } = useStore();
  const [isConnected, setIsConnected] = useState(false);
  const [streamingError, setStreamingError] = useState<string | null>(null);

  const startStreaming = (videoId: string) => {
    if (!currentUser) {
      setStreamingError('User not logged in');
      return;
    }

    try {
      streamingService.connect(videoId, currentUser.id);
      setIsConnected(true);
      setStreamingError(null);
    } catch (error) {
      setStreamingError(error instanceof Error ? error.message : 'Failed to start streaming');
      setIsConnected(false);
    }
  };

  const stopStreaming = () => {
    try {
      streamingService.disconnect();
      setIsConnected(false);
      setStreamingError(null);
    } catch (error) {
      setStreamingError(error instanceof Error ? error.message : 'Failed to stop streaming');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  return {
    isConnected,
    streamingError,
    startStreaming,
    stopStreaming,
  };
};

// Hook for real-time notifications
export const useNotifications = () => {
  const { addNotification } = useStore();
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  const connectNotifications = () => {
    try {
      const ws = new WebSocket('ws://localhost:5173/ws/notifications'); // Use Vite dev server with proxy
      
      ws.onopen = () => {
        console.log('Notifications WebSocket connected');
        setWsConnection(ws);
      };

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          addNotification(notification);
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };

      ws.onclose = () => {
        console.log('Notifications WebSocket disconnected');
        setWsConnection(null);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(connectNotifications, 5000);
      };

      ws.onerror = (error) => {
        console.error('Notifications WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect notifications WebSocket:', error);
    }
  };

  const disconnectNotifications = () => {
    if (wsConnection) {
      wsConnection.close();
      setWsConnection(null);
    }
  };

  useEffect(() => {
    // Disable auto-connect for now to prevent authentication errors
    // connectNotifications();

    return () => {
      disconnectNotifications();
    };
  }, []);

  return {
    isConnected: wsConnection?.readyState === WebSocket.OPEN,
    connectNotifications,
    disconnectNotifications,
  };
};

// Hook for search functionality
export const useSearch = () => {
  const { searchQuery, setSearchQuery } = useStore();
  const { searchContents, loading } = useContentApi();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    // Add to search history
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(item => item !== query)];
      return newHistory.slice(0, 10); // Keep only last 10 searches
    });

    setSearchQuery(query);
    await searchContents(query);
  };

  const clearSearch = async () => {
    setSearchQuery('');
    // Load all contents when search is cleared
    const { loadAllContents } = useContentApi();
    await loadAllContents();
  };

  return {
    searchQuery,
    searchHistory,
    loading,
    performSearch,
    clearSearch,
  };
};

// Hook for analytics and monitoring
export const useAnalytics = () => {
  const { addToViewHistory, updateWatchTime } = useStore();

  const trackVideoView = (videoId: string) => {
    addToViewHistory(videoId);
    
    // Send analytics to backend (if endpoint exists)
    // This would be implemented when backend analytics are ready
    console.log('Video view tracked:', videoId);
  };

  const trackWatchTime = (videoId: string, timeWatched: number) => {
    updateWatchTime(videoId, timeWatched);
    
    // Send watch time to backend (if endpoint exists)
    console.log('Watch time tracked:', videoId, timeWatched);
  };

  const trackUserInteraction = (action: string, videoId?: string, metadata?: any) => {
    const event = {
      action,
      videoId,
      metadata,
      timestamp: new Date().toISOString(),
    };
    
    // Send interaction event to backend (if endpoint exists)
    console.log('User interaction tracked:', event);
  };

  return {
    trackVideoView,
    trackWatchTime,
    trackUserInteraction,
  };
};

// Hook for error handling and retry logic
export const useErrorHandler = () => {
  const [errors, setErrors] = useState<Array<{ id: string; message: string; timestamp: Date }>>([]);

  const addError = (message: string) => {
    const error = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
    };
    setErrors(prev => [...prev, error]);
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  // Auto-remove errors after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setErrors(prev => prev.filter(error => 
        now.getTime() - error.timestamp.getTime() < 5000
      ));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    errors,
    addError,
    removeError,
    clearAllErrors,
  };
};
