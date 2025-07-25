import React from 'react';

interface VideoPlayerSkeletonProps {
  isDarkMode: boolean;
}

const VideoPlayerSkeleton: React.FC<VideoPlayerSkeletonProps> = ({ isDarkMode }) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div 
        className={`relative w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${
          isDarkMode
            ? 'bg-gray-800'
            : 'bg-gray-100'
        }`}
        style={{
          boxShadow: isDarkMode
            ? `
              20px 20px 60px rgba(0, 0, 0, 0.5),
              inset -8px -8px 20px rgba(255, 255, 255, 0.02),
              inset 8px 8px 20px rgba(0, 0, 0, 0.3)
            `
            : `
              20px 20px 60px rgba(0, 0, 0, 0.15),
              inset -8px -8px 20px rgba(255, 255, 255, 0.1),
              inset 8px 8px 20px rgba(0, 0, 0, 0.05)
            `
        }}
      >
        {/* Video Skeleton */}
        <div className={`w-full h-full animate-pulse ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          {/* Shimmer effect */}
          <div className={`w-full h-full relative overflow-hidden ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className={`absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-transparent via-gray-600 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-white to-transparent'
              }`}
            />
          </div>
        </div>

        {/* Right Side Actions Skeleton */}
        <div className="absolute right-4 bottom-20 flex flex-col space-y-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div 
                className={`w-12 h-12 rounded-full ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}
                style={{
                  boxShadow: isDarkMode
                    ? `
                      6px 6px 16px rgba(0, 0, 0, 0.4),
                      -6px -6px 16px rgba(255, 255, 255, 0.02)
                    `
                    : `
                      6px 6px 16px rgba(0, 0, 0, 0.1),
                      -6px -6px 16px rgba(255, 255, 255, 0.8)
                    `
                }}
              />
              {index < 2 && (
                <div className={`w-8 h-3 mx-auto mt-1 rounded ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Video Info Skeleton */}
        <div className="absolute bottom-4 left-4 right-20 animate-pulse">
          <div className={`h-6 rounded mb-2 ${
            isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
          }`} />
          <div className={`h-4 rounded mb-1 ${
            isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
          }`} />
          <div className={`h-4 rounded w-3/4 ${
            isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
          }`} />
        </div>

        {/* Progress Indicator Skeleton */}
        <div className="absolute top-4 left-4 right-4 animate-pulse">
          <div className="flex space-x-1">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerSkeleton;