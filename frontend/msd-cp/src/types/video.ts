// Shared video types for consistent data structure across components
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

// Utility type for safe video access
export type SafeVideo = Video | null;

// Type guards for runtime validation
export const isValidVideo = (video: any): video is Video => {
  return (
    video !== null &&
    typeof video === 'object' &&
    typeof video.id === 'string' &&
    typeof video.url === 'string' &&
    typeof video.title === 'string' &&
    typeof video.description === 'string' &&
    typeof video.likes === 'number' &&
    typeof video.comments === 'number' &&
    typeof video.shares === 'number' &&
    typeof video.views === 'number' &&
    typeof video.duration === 'number' &&
    typeof video.thumbnail === 'string' &&
    typeof video.createdAt === 'string' &&
    typeof video.isLiked === 'boolean' &&
    typeof video.isBookmarked === 'boolean' &&
    Array.isArray(video.tags) &&
    isValidUser(video.creator)
  );
};

export const isValidUser = (user: any): user is User => {
  return (
    user !== null &&
    typeof user === 'object' &&
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    typeof user.avatar === 'string' &&
    typeof user.followers === 'number' &&
    typeof user.following === 'number' &&
    typeof user.likes === 'number' &&
    typeof user.videos === 'number' &&
    typeof user.verified === 'boolean'
  );
};

// Default values for safe fallbacks
export const createDefaultUser = (): User => ({
  id: 'unknown',
  name: 'Unknown User',
  email: '',
  avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
  followers: 0,
  following: 0,
  likes: 0,
  videos: 0,
  verified: false,
});

export const createDefaultVideo = (): Video => ({
  id: 'unknown',
  url: '',
  title: 'Untitled Video',
  description: 'No description available',
  likes: 0,
  comments: 0,
  shares: 0,
  views: 0,
  duration: 0,
  thumbnail: '',
  creator: createDefaultUser(),
  createdAt: new Date().toISOString(),
  isLiked: false,
  isBookmarked: false,
  tags: [],
});

// Utility functions for safe data access
export const safeGetVideoProperty = <K extends keyof Video>(
  video: SafeVideo,
  property: K,
  fallback: Video[K]
): Video[K] => {
  return video?.[property] ?? fallback;
};

export const formatVideoNumber = (num: number | undefined): string => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatTimeAgo = (timestamp?: string): string => {
  if (!timestamp) return '2 hours ago';
  
  try {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  } catch (error) {
    return '2 hours ago';
  }
};
