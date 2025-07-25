import React from 'react';

interface SkeletonLoaderProps {
  isDarkMode: boolean;
  type: 'video' | 'comment' | 'reel' | 'profile' | 'notification';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ isDarkMode, type, count = 1 }) => {
  const skeletonClass = isDarkMode ? 'skeleton-dark' : 'skeleton';

  const VideoSkeleton = () => (
    <div className={`w-full aspect-[9/16] rounded-3xl ${skeletonClass}`} />
  );

  const CommentSkeleton = () => (
    <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-full ${skeletonClass}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-4 w-24 rounded ${skeletonClass}`} />
          <div className={`h-3 w-full rounded ${skeletonClass}`} />
          <div className={`h-3 w-3/4 rounded ${skeletonClass}`} />
          <div className="flex space-x-4">
            <div className={`h-3 w-12 rounded ${skeletonClass}`} />
            <div className={`h-3 w-12 rounded ${skeletonClass}`} />
          </div>
        </div>
      </div>
    </div>
  );

  const ReelSkeleton = () => (
    <div className={`aspect-[3/4] rounded-2xl ${skeletonClass}`} />
  );

  const ProfileSkeleton = () => (
    <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
      <div className="flex items-center space-x-4 mb-4">
        <div className={`w-16 h-16 rounded-full ${skeletonClass}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-5 w-32 rounded ${skeletonClass}`} />
          <div className={`h-4 w-24 rounded ${skeletonClass}`} />
        </div>
        <div className={`h-8 w-20 rounded-full ${skeletonClass}`} />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <div className={`h-5 w-12 mx-auto rounded ${skeletonClass}`} />
            <div className={`h-3 w-16 mx-auto rounded ${skeletonClass}`} />
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`h-6 w-16 rounded-full ${skeletonClass}`} />
        ))}
      </div>
    </div>
  );

  const NotificationSkeleton = () => (
    <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-full ${skeletonClass}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-4 w-full rounded ${skeletonClass}`} />
          <div className={`h-3 w-20 rounded ${skeletonClass}`} />
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'video':
        return <VideoSkeleton />;
      case 'comment':
        return <CommentSkeleton />;
      case 'reel':
        return <ReelSkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      case 'notification':
        return <NotificationSkeleton />;
      default:
        return <div className={`h-20 w-full rounded ${skeletonClass}`} />;
    }
  };

  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
