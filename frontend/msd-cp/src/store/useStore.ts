import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  followers: number;
  following: number;
  likes: number;
  videos: number;
  verified: boolean;
}

export interface Video {
  id: string;
  url: string;
  title: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  duration: number;
  thumbnail: string;
  creator: User;
  createdAt: string;
  isLiked: boolean;
  isBookmarked: boolean;
  tags: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likes: number;
  replies: Comment[];
  createdAt: string;
  isLiked: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  message: string;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: string;
  read: boolean;
  videoId?: string;
}

interface AppState {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Authentication
  isLoggedIn: boolean;
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;

  // Videos
  videos: Video[];
  currentVideoIndex: number;
  isPlaying: boolean;
  volume: number;
  playbackSpeed: number;
  quality: string;
  isFullscreen: boolean;
  autoplay: boolean;
  setVideos: (videos: Video[]) => void;
  setCurrentVideoIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setQuality: (quality: string) => void;
  toggleFullscreen: () => void;
  toggleAutoplay: () => void;
  likeVideo: (videoId: string) => void;
  bookmarkVideo: (videoId: string) => void;

  // Comments
  comments: { [videoId: string]: Comment[] };
  addComment: (videoId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  likeComment: (videoId: string, commentId: string) => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;

  // UI State
  sidebarCollapsed: boolean;
  showVideoControls: boolean;
  showComments: boolean;
  showShareModal: boolean;
  activeTab: string;
  activeMenuItem: string;
  toggleSidebar: () => void;
  setShowVideoControls: (show: boolean) => void;
  setShowComments: (show: boolean) => void;
  setShowShareModal: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  setActiveMenuItem: (item: string) => void;

  // Analytics
  viewHistory: string[];
  watchTime: { [videoId: string]: number };
  addToViewHistory: (videoId: string) => void;
  updateWatchTime: (videoId: string, time: number) => void;

  // Search & Filters
  searchQuery: string;
  filters: {
    category: string;
    duration: string;
    sortBy: string;
  };
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<AppState['filters']>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Authentication
      isLoggedIn: false,
      currentUser: null,
      login: (user) => set({ isLoggedIn: true, currentUser: user }),
      logout: () => set({ isLoggedIn: false, currentUser: null }),

      // Videos
      videos: [],
      currentVideoIndex: 0,
      isPlaying: true,
      volume: 1,
      playbackSpeed: 1,
      quality: 'auto',
      isFullscreen: false,
      autoplay: true,
      setVideos: (videos) => set({ videos }),
      setCurrentVideoIndex: (index) => set({ currentVideoIndex: index }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setVolume: (volume) => set({ volume }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      setQuality: (quality) => set({ quality }),
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
      toggleAutoplay: () => set((state) => ({ autoplay: !state.autoplay })),
      likeVideo: (videoId) => set((state) => ({
        videos: state.videos.map(video =>
          video.id === videoId
            ? { ...video, isLiked: !video.isLiked, likes: video.isLiked ? video.likes - 1 : video.likes + 1 }
            : video
        )
      })),
      bookmarkVideo: (videoId) => set((state) => ({
        videos: state.videos.map(video =>
          video.id === videoId
            ? { ...video, isBookmarked: !video.isBookmarked }
            : video
        )
      })),

      // Comments
      comments: {},
      addComment: (videoId, comment) => set((state) => ({
        comments: {
          ...state.comments,
          [videoId]: [
            ...(state.comments[videoId] || []),
            {
              ...comment,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            }
          ]
        }
      })),
      likeComment: (videoId, commentId) => set((state) => ({
        comments: {
          ...state.comments,
          [videoId]: state.comments[videoId]?.map(comment =>
            comment.id === commentId
              ? { ...comment, isLiked: !comment.isLiked, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1 }
              : comment
          ) || []
        }
      })),

      // Notifications
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          },
          ...state.notifications
        ],
        unreadCount: state.unreadCount + 1
      })),
      markAsRead: (notificationId) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      })),
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      })),

      // UI State
      sidebarCollapsed: false,
      showVideoControls: false,
      showComments: false,
      showShareModal: false,
      activeTab: 'package',
      activeMenuItem: 'home',
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setShowVideoControls: (show) => set({ showVideoControls: show }),
      setShowComments: (show) => set({ showComments: show }),
      setShowShareModal: (show) => set({ showShareModal: show }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveMenuItem: (item) => set({ activeMenuItem: item }),

      // Analytics
      viewHistory: [],
      watchTime: {},
      addToViewHistory: (videoId) => set((state) => ({
        viewHistory: [videoId, ...state.viewHistory.filter(id => id !== videoId)].slice(0, 100)
      })),
      updateWatchTime: (videoId, time) => set((state) => ({
        watchTime: { ...state.watchTime, [videoId]: time }
      })),

      // Search & Filters
      searchQuery: '',
      filters: {
        category: 'all',
        duration: 'all',
        sortBy: 'recent'
      },
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
    }),
    {
      name: 'mysillyDreams-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        isLoggedIn: state.isLoggedIn,
        currentUser: state.currentUser,
        volume: state.volume,
        playbackSpeed: state.playbackSpeed,
        quality: state.quality,
        autoplay: state.autoplay,
        viewHistory: state.viewHistory,
        watchTime: state.watchTime,
        filters: state.filters,
      }),
    }
  )
);
