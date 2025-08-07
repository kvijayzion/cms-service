import { Video, createDefaultUser } from '../types/video';

// API Configuration
const API_BASE_URL = ''; // Use relative URLs with Vite proxy

// Note: API Gateway handles authentication, no Basic Auth needed for read operations

// API Client with authentication
class ApiClient {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.headers = {
      'Content-Type': 'application/json',
      // No Authorization header needed - API Gateway handles auth
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as unknown as T;
      }
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/actuator/health');
  }

  // Content API methods
  async getContents(): Promise<any[]> {
    return this.request('/api/contents');
  }

  async getContent(id: string): Promise<any> {
    return this.request(`/api/contents/${id}`);
  }

  async getTrendingContents(): Promise<any[]> {
    return this.request('/api/contents/trending');
  }

  async getContentsByCategory(category: string): Promise<any[]> {
    return this.request(`/api/contents/category/${category}`);
  }

  async searchContents(query: string): Promise<any[]> {
    return this.request(`/api/contents/search?q=${encodeURIComponent(query)}`);
  }

  async createContent(content: {
    title: string;
    description: string;
    category: string;
    videoUrl: string;
    durationSeconds: number;
  }): Promise<any> {
    return this.request('/api/contents', {
      method: 'POST',
      body: JSON.stringify(content),
    });
  }

  async updateContent(id: string, content: any): Promise<any> {
    return this.request(`/api/contents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(content),
    });
  }

  async deleteContent(id: string): Promise<void> {
    return this.request(`/api/contents/${id}`, {
      method: 'DELETE',
    });
  }

  // Metrics and monitoring
  async getMetrics(): Promise<any> {
    return this.request('/actuator/metrics');
  }

  async getPrometheusMetrics(): Promise<string> {
    return this.request('/actuator/prometheus');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Content transformation utilities
export const transformBackendContentToVideo = (backendContent: any): Video => {
  return {
    id: backendContent.id?.toString() || '',
    url: backendContent.videoUrl || '',
    title: backendContent.title || 'Untitled',
    description: backendContent.description || '',
    likes: backendContent.likeCount || 0,
    comments: backendContent.commentCount || 0,
    shares: 0, // Backend doesn't have shares yet
    views: backendContent.viewCount || 0,
    duration: backendContent.durationSeconds || 0,
    thumbnail: backendContent.thumbnailUrl || '',
    creator: backendContent.creator ? {
      id: backendContent.creator.id?.toString() || 'unknown',
      name: backendContent.creator.name || 'Content Creator',
      email: backendContent.creator.email || 'creator@example.com',
      avatar: backendContent.creator.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      followers: backendContent.creator.followers || 1000,
      following: backendContent.creator.following || 500,
      likes: backendContent.creator.likes || 5000,
      videos: backendContent.creator.videos || 25,
      verified: backendContent.creator.verified || true,
    } : createDefaultUser(),
    createdAt: backendContent.uploadedAt || new Date().toISOString(),
    isLiked: false,
    isBookmarked: false,
    tags: backendContent.category ? [backendContent.category] : [],
  };
};

// API service functions
export const contentService = {
  async fetchAllContents() {
    try {
      const contents = await apiClient.getContents();
      return contents.map(transformBackendContentToVideo);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
      return [];
    }
  },

  async fetchTrendingContents() {
    try {
      const contents = await apiClient.getTrendingContents();
      return contents.map(transformBackendContentToVideo);
    } catch (error) {
      console.error('Failed to fetch trending contents:', error);
      return [];
    }
  },

  async searchContents(query: string) {
    try {
      const contents = await apiClient.searchContents(query);
      return contents.map(transformBackendContentToVideo);
    } catch (error) {
      console.error('Failed to search contents:', error);
      return [];
    }
  },

  async fetchContentsByCategory(category: string) {
    try {
      const contents = await apiClient.getContentsByCategory(category);
      return contents.map(transformBackendContentToVideo);
    } catch (error) {
      console.error('Failed to fetch contents by category:', error);
      return [];
    }
  },
};

// Health monitoring service
export const healthService = {
  async checkBackendHealth() {
    try {
      const health = await apiClient.healthCheck();
      return health.status === 'UP';
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  },
};

// WebSocket service for real-time streaming
export class StreamingWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(videoId: string, userId: string) {
    const wsUrl = `ws://localhost:5173/ws/video-stream`; // Use Vite dev server with proxy
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected for video streaming');
        this.reconnectAttempts = 0;
        
        // Send initial streaming request
        this.sendMessage({
          type: 'START_STREAMING',
          videoId,
          userId,
          qualityLevel: '720p'
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.attemptReconnect(videoId, userId);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'STREAMING_STARTED':
        console.log('Streaming session started:', data.sessionId);
        break;
      case 'VIDEO_CHUNK':
        // Handle video chunk data
        console.log('Received video chunk:', data.chunkSize);
        break;
      case 'STREAMING_ERROR':
        console.error('Streaming error:', data.error);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private attemptReconnect(videoId: string, userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(videoId, userId);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const streamingService = new StreamingWebSocketService();
