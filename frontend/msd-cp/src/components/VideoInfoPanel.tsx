import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, Eye, Flag } from 'lucide-react';
import { SafeVideo, formatVideoNumber, formatTimeAgo } from '../types/video';
import { useStore } from '../store/useStore';

interface VideoInfoPanelProps {
  video: SafeVideo;
  isNext?: boolean;
  isDarkMode?: boolean;
  className?: string;
  onTitleClick?: () => void;
  onDescriptionClick?: () => void;
  onAuthorClick?: () => void;
  onLike?: (videoId: string) => void;
  onBookmark?: (videoId: string) => void;
  onShare?: (videoId: string) => void;
  onReport?: (videoId: string) => void;
  onComment?: (videoId: string) => void;
}

const VideoInfoPanel: React.FC<VideoInfoPanelProps> = ({
  video,
  isNext = false,
  isDarkMode = false,
  className = '',
  onTitleClick,
  onDescriptionClick,
  onAuthorClick,
  onLike,
  onBookmark,
  onShare,
  onReport,
  onComment
}) => {
  // Return null if no video data is provided
  if (!video) {
    return null;
  }

  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState({ title: false, description: false });
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // Get store actions if not provided via props
  const { likeVideo, bookmarkVideo } = useStore();

  // Share options
  const shareOptions = [
    { name: 'Twitter', icon: '🐦', url: 'https://twitter.com/intent/tweet?url=' },
    { name: 'Facebook', icon: '📘', url: 'https://www.facebook.com/sharer/sharer.php?u=' },
    { name: 'WhatsApp', icon: '💬', url: 'https://wa.me/?text=' },
    { name: 'Copy Link', icon: '🔗', url: '' },
  ];

  // Action handlers
  const handleLike = () => {
    if (onLike) {
      onLike(video.id);
    } else {
      likeVideo(video.id);
    }
  };

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark(video.id);
    } else {
      bookmarkVideo(video.id);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(video.id);
    } else {
      setShowShareModal(true);
    }
  };

  const handleReport = () => {
    if (onReport) {
      onReport(video.id);
    } else {
      setShowReportModal(true);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(video.id);
    } else {
      console.log('Comment functionality not implemented yet');
    }
  };

  // Check if text is overflowing
  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        const isOverflowingTitle = titleRef.current.scrollHeight > titleRef.current.clientHeight;
        setIsOverflowing(prev => ({ ...prev, title: isOverflowingTitle }));
      }
      
      if (descriptionRef.current) {
        const isOverflowingDesc = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight;
        setIsOverflowing(prev => ({ ...prev, description: isOverflowingDesc }));
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [video.title, video.description]);

  const handleTitleToggle = () => {
    setIsTitleExpanded(!isTitleExpanded);
    onTitleClick?.();
  };

  const handleDescriptionToggle = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
    onDescriptionClick?.();
  };



  return (
    <div className={`relative ${className}`}>
      {/* Gradient Overlay for Better Text Readability */}
      <div className={`absolute inset-0 ${
        isNext 
          ? 'bg-gradient-to-t from-black/60 via-black/20 to-transparent' 
          : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent'
      }`} />
      
      {/* Content Container */}
      <div className="relative p-4 pb-6">
        <div className="flex items-end justify-between gap-4">
          {/* Text Content Area */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* "Up Next" Label for Next Video */}
            {isNext && (
              <div className="text-xs text-white/60 font-medium uppercase tracking-wide">
                Up Next
              </div>
            )}
            
            {/* Title with Smart Expansion */}
            <div className="group">
              <h3 
                ref={titleRef}
                className={`
                  font-bold leading-tight transition-all duration-300 cursor-pointer
                  ${isNext 
                    ? 'text-sm sm:text-base md:text-lg' 
                    : 'text-base sm:text-lg md:text-xl lg:text-2xl'
                  }
                  text-white text-shadow-lg
                  ${isTitleExpanded ? 'line-clamp-none' : 'line-clamp-2'}
                  hover:text-white/90
                `}
                title={video.title}
                onClick={handleTitleToggle}
              >
                {video.title}
              </h3>
              
              {/* Title Expand/Collapse Button */}
              {isOverflowing.title && (
                <button
                  className="text-xs text-white/70 hover:text-white transition-colors mt-1"
                  onClick={handleTitleToggle}
                >
                  {isTitleExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Description with Smart Expansion */}
            <div className="group">
              <p 
                ref={descriptionRef}
                className={`
                  leading-relaxed transition-all duration-300 cursor-pointer
                  ${isNext 
                    ? 'text-xs sm:text-sm' 
                    : 'text-xs sm:text-sm md:text-base'
                  }
                  text-gray-200 text-shadow
                  ${isDescriptionExpanded ? 'line-clamp-none' : (isNext ? 'line-clamp-2' : 'line-clamp-3')}
                  hover:text-gray-100
                `}
                title={video.description}
                onClick={handleDescriptionToggle}
              >
                {video.description}
              </p>
              
              {/* Description Expand/Collapse Button */}
              {isOverflowing.description && (
                <button
                  className="text-xs text-white/70 hover:text-white transition-colors mt-1 flex items-center gap-1"
                  onClick={handleDescriptionToggle}
                >
                  {isDescriptionExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>


          </div>

          {/* Preview Thumbnail (for next video) */}
          {isNext && (
            <div className="w-16 h-12 bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <Play className="w-4 h-4 text-white/60" />
              </div>
            </div>
          )}

          {/* Right Side Action Panel (for current video only) */}
          {!isNext && (
            <div className="flex flex-col space-y-6 ml-4">
              {/* Like Button */}
              <button
                onClick={handleLike}
                className="group relative flex flex-col items-center"
              >
                <Heart
                  className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${
                    video.isLiked
                      ? 'text-red-500 fill-red-500'
                      : 'text-white'
                  }`}
                />
                <span className="text-xs mt-1 block text-center transition-colors duration-300 text-white">
                  {formatVideoNumber(video.likes || 0)}
                </span>
              </button>

              {/* Bookmark Button */}
              <button
                onClick={handleBookmark}
                className="group relative flex flex-col items-center"
              >
                <Bookmark className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${
                  video.isBookmarked
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-white'
                }`} />
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="group relative flex flex-col items-center"
              >
                <Share2 className="w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 text-white" />
              </button>

              {/* Report Button */}
              <button
                onClick={handleReport}
                className="group relative flex flex-col items-center"
              >
                <Flag className="w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-96 p-6 rounded-3xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Share Video
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className={`p-2 rounded-full ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => {
                    if (option.name === 'Copy Link') {
                      navigator.clipboard.writeText(window.location.href);
                    } else {
                      window.open(option.url + encodeURIComponent(window.location.href));
                    }
                    setShowShareModal(false);
                  }}
                  className={`flex items-center space-x-3 p-4 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-96 p-6 rounded-3xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Report Video
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className={`p-2 rounded-full ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {[
                'Inappropriate content',
                'Spam or misleading',
                'Harassment or bullying',
                'Copyright violation',
                'Other'
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    console.log('Report submitted:', reason);
                    setShowReportModal(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoInfoPanel;
