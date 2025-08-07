import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  isDarkMode?: boolean;
  className?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  isDarkMode = false,
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`${getSizeClasses()} animate-spin ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`} />
      {text && (
        <span className={`${getTextSize()} ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {text}
        </span>
      )}
    </div>
  );
};

// Inline loader for smaller spaces
export const InlineLoader: React.FC<{ 
  isDarkMode?: boolean; 
  className?: string;
}> = ({ isDarkMode = false, className = '' }) => {
  return (
    <RefreshCw className={`w-3 h-3 animate-spin ${
      isDarkMode ? 'text-gray-400' : 'text-gray-500'
    } ${className}`} />
  );
};

// Skeleton loader for content placeholders
export const SkeletonLoader: React.FC<{
  lines?: number;
  isDarkMode?: boolean;
  className?: string;
}> = ({ lines = 3, isDarkMode = false, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 rounded animate-pulse ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          } ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

// Spinner for buttons
export const ButtonSpinner: React.FC<{
  size?: 'sm' | 'md';
  className?: string;
}> = ({ size = 'sm', className = '' }) => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  
  return (
    <Loader2 className={`${sizeClass} animate-spin text-current ${className}`} />
  );
};

// Full page loading overlay
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  text?: string;
  isDarkMode?: boolean;
}> = ({ isVisible, text = 'Loading...', isDarkMode = false }) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${
      isDarkMode 
        ? 'bg-gray-900/80 backdrop-blur-sm' 
        : 'bg-white/80 backdrop-blur-sm'
    }`}>
      <div className={`p-6 rounded-lg shadow-lg ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <LoadingIndicator 
          size="lg" 
          text={text} 
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default LoadingIndicator;
