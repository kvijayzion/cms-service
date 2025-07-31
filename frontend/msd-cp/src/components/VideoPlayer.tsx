import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal, Play, Pause,
  Volume2, VolumeX, Maximize, Loader2, Settings
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { useSpring, animated } from '@react-spring/web';
import VideoInfoPanel from './VideoInfoPanel';
import { useContentApi } from '../hooks/useApi';
import { Video, SafeVideo, isValidVideo } from '../types/video';

interface VideoPlayerProps {
  isDarkMode: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ isDarkMode }) => {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showBoundaryMessage, setShowBoundaryMessage] = useState<string | null>(null);

  // Elastic swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isProgressDragging, setIsProgressDragging] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Spring animation for elastic swipe
  const [springProps, setSpringProps] = useSpring(() => ({
    currentY: 0,
    nextY: containerHeight,
    config: { tension: 300, friction: 30 }
  }));

  // Get container height on mount and resize
  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);
    return () => window.removeEventListener('resize', updateContainerHeight);
  }, []);

  // Elastic swipe handlers
  const handleSwipeStart = (clientY: number) => {
    setIsDragging(true);
    setDragStartY(clientY);
  };

  const handleSwipeMove = (clientY: number) => {
    if (!isDragging || dragStartY === null) return;

    const deltaY = dragStartY - clientY;
    const clampedDelta = Math.max(0, deltaY); // Only allow upward drag

    // Elastic effect: reduce movement as we drag further
    const elasticDelta = clampedDelta > containerHeight / 2
      ? (containerHeight / 2) + (clampedDelta - containerHeight / 2) * 0.3
      : clampedDelta;

    setSpringProps({
      currentY: -elasticDelta,
      nextY: containerHeight - elasticDelta,
      immediate: true
    });
  };

  const handleSwipeEnd = () => {
    if (!isDragging || dragStartY === null) return;

    const currentOffset = Math.abs(springProps.currentY.get());
    const threshold = containerHeight / 2;

    if (currentOffset > threshold && currentVideoIndex < videos.length - 1) {
      // Commit to next video
      setSpringProps({
        currentY: -containerHeight,
        nextY: 0,
        immediate: false
      });

      setTimeout(() => {
        setCurrentVideoIndex(currentVideoIndex + 1);
        setSpringProps({
          currentY: 0,
          nextY: containerHeight,
          immediate: true
        });
      }, 300);
    } else {
      // Spring back to current video
      setSpringProps({
        currentY: 0,
        nextY: containerHeight,
        immediate: false
      });
    }

    setIsDragging(false);
    setDragStartY(null);
  };

  // Swipe gestures for mobile (simplified for elastic behavior)
  const swipeRef = useSwipeGestures({
    onSwipeUp: () => {
      // Elastic swipe handles this via drag events
    },
    onSwipeDown: () => {
      // Only handle boundary case for down swipe
      if (currentVideoIndex === 0) {
        showBoundaryMessageWithTimeout("Back to the beginning! Content refreshed.");
      }
    },
    onSwipeLeft: () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
      }
    },
    onSwipeRight: () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      }
    },
    threshold: 50
  });

  const {
    videos,
    currentVideoIndex,
    isPlaying,
    volume,
    playbackSpeed,
    quality,
    isFullscreen,
    showVideoControls,
    setCurrentVideoIndex,
    setIsPlaying,
    togglePlay,
    setVolume,
    setPlaybackSpeed,
    setQuality,
    toggleFullscreen,
    setShowVideoControls,
    addToViewHistory,
    updateWatchTime
  } = useStore();

  // Use API hook for loading content
  const { loading: contentLoading, error: contentError } = useContentApi();

  // Fallback sample videos for development/demo purposes only when no API data is available
  useEffect(() => {
    // Only use sample data if no videos are loaded and there's no content loading
    if (videos.length === 0 && !contentLoading && contentError) {
      console.warn('Using fallback sample data due to API error:', contentError);
      const sampleVideos: Video[] = [
        {
          id: 'sample-1',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          title: 'Beautiful Sunset',
          description: 'A stunning sunset over the mountains with vibrant colors painting the sky.',
          likes: 1234,
          comments: 89,
          shares: 45,
          views: 12500,
          duration: 120,
          thumbnail: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          creator: {
            id: 'creator-1',
            name: 'Nature Lover',
            email: 'nature@example.com',
            avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            followers: 15000,
            following: 500,
            likes: 50000,
            videos: 120,
            verified: true
          },
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          isLiked: false,
          isBookmarked: false,
          tags: ['nature', 'sunset', 'mountains']
        }
      ];
      useStore.getState().setVideos(sampleVideos);
    }
  }, [videos.length, contentLoading, contentError]);

  // Safe access to current video with error handling
  const currentVideo: SafeVideo = videos[currentVideoIndex] || null;
  const nextVideo: SafeVideo = currentVideoIndex < videos.length - 1 ? videos[currentVideoIndex + 1] : null;

  // Initialize autoplay on component mount
  useEffect(() => {
    // Ensure playing state is set to true on initial load
    if (!isPlaying && videos.length > 0) {
      setIsPlaying(true);
    }
  }, [videos.length, isPlaying, setIsPlaying]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      video.volume = volume;
      video.playbackRate = playbackSpeed;
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);

      // Update watch time in store
      if (currentVideo) {
        updateWatchTime(currentVideo.id, video.currentTime);
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleEnded = () => {
      if (currentVideoIndex < videos.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
      }
    };

    // Sync video play/pause state with store
    const handlePlay = () => {
      if (!isPlaying) {
        setIsPlaying(true);
      }
    };

    const handlePause = () => {
      if (isPlaying) {
        setIsPlaying(false);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [currentVideo, volume, playbackSpeed, currentVideoIndex, videos.length, updateWatchTime, setCurrentVideoIndex, isPlaying, setIsPlaying]);

  // Enhanced autoplay control
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    const attemptPlay = async () => {
      try {
        if (isPlaying) {
          // Reset video to beginning for new video
          video.currentTime = 0;
          await video.play();
          console.log('Video playing successfully');
        } else {
          video.pause();
        }
      } catch (error) {
        console.log('Autoplay was prevented:', error);
        // If autoplay fails, we keep the video ready but paused
        // User will need to click to start playing
      }
    };

    // Small delay to ensure video is ready
    const timer = setTimeout(attemptPlay, 100);
    return () => clearTimeout(timer);
  }, [isPlaying, currentVideoIndex, currentVideo]);

  // Handle video loading and ensure autoplay on video change
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    const handleLoadedData = async () => {
      try {
        // Set volume based on store state (but keep muted for autoplay)
        video.volume = volume;
        video.playbackRate = playbackSpeed;

        // Attempt to play if should be playing
        if (isPlaying) {
          video.currentTime = 0;
          await video.play();
        }
      } catch (error) {
        console.log('Autoplay failed on load:', error);
      }
    };

    const handleCanPlay = async () => {
      try {
        if (isPlaying && video.paused) {
          await video.play();
        }
      } catch (error) {
        console.log('Autoplay failed on canplay:', error);
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentVideo, isPlaying, volume, playbackSpeed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger shortcuts when typing
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentVideoIndex > 0) {
            setCurrentVideoIndex(currentVideoIndex - 1);
          } else {
            showBoundaryMessageWithTimeout("Back to the beginning! Content refreshed.");
            setCurrentVideoIndex(0);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentVideoIndex < videos.length - 1) {
            setCurrentVideoIndex(currentVideoIndex + 1);
          } else {
            showBoundaryMessageWithTimeout("You've reached the end! No more content available.");
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          }
          break;
        case 'KeyM':
          e.preventDefault();
          setVolume(volume > 0 ? 0 : 1);
          break;
        case 'KeyF':
          e.preventDefault();
          handleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, currentVideoIndex, videos.length, setCurrentVideoIndex, duration, volume, setVolume, toggleFullscreen]);

  // Add to view history when video starts
  useEffect(() => {
    if (currentVideo && isPlaying) {
      addToViewHistory(currentVideo.id);
    }
  }, [currentVideo, isPlaying, addToViewHistory]);

  // Function to show boundary message
  const showBoundaryMessageWithTimeout = (message: string) => {
    setShowBoundaryMessage(message);
    setTimeout(() => setShowBoundaryMessage(null), 2000);
  };

  // Wheel/scroll event handler for next/previous video
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;

      e.preventDefault();

      // Detect scroll direction
      if (e.deltaY > 0) {
        // Scroll down - next video
        if (currentVideoIndex < videos.length - 1) {
          setCurrentVideoIndex(currentVideoIndex + 1);
        } else {
          // At the last video
          showBoundaryMessageWithTimeout("You've reached the end! No more content available.");
        }
      } else if (e.deltaY < 0) {
        // Scroll up - previous video
        if (currentVideoIndex > 0) {
          setCurrentVideoIndex(currentVideoIndex - 1);
        } else {
          // At the first video - reload state
          showBoundaryMessageWithTimeout("Back to the beginning! Content refreshed.");
          // Trigger a state reload by resetting to first video
          setCurrentVideoIndex(0);
          // You could also refresh other state here if needed
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [currentVideoIndex, videos.length, setCurrentVideoIndex]);

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  const handleMouseDown = (e: React.MouseEvent) => {
    handleSwipeStart(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleSwipeMove(e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    handleSwipeEnd();
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !videoRef.current || isProgressDragging) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    videoRef.current.currentTime = newTime;
  };

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProgressDragging(true);
    handleProgressClick(e);
  };

  const handleProgressMouseMove = (e: MouseEvent) => {
    if (!isProgressDragging || !progressRef.current || !videoRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    videoRef.current.currentTime = newTime;
  };

  const handleProgressMouseUp = () => {
    setIsProgressDragging(false);
  };

  // Add global mouse event listeners for progress dragging
  useEffect(() => {
    if (isProgressDragging) {
      document.addEventListener('mousemove', handleProgressMouseMove);
      document.addEventListener('mouseup', handleProgressMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleProgressMouseMove);
        document.removeEventListener('mouseup', handleProgressMouseUp);
      };
    }
  }, [isProgressDragging, duration]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  // Format time in MM:SS format
  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const handleQualityChange = (newQuality: string) => {
    setQuality(newQuality);
    setShowQualityMenu(false);
  };

  // Custom fullscreen handler
  const handleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        toggleFullscreen(); // Update store state
      } else {
        await document.exitFullscreen();
        toggleFullscreen(); // Update store state
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Show loading state for content loading or invalid video data
  if (contentLoading || !isValidVideo(currentVideo)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {contentLoading ? 'Loading videos...' : 'No valid video data available'}
          </p>
          {contentError && (
            <p className="text-xs text-red-500 mt-1">
              Error: {contentError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div
        className={`relative w-full h-full rounded-3xl overflow-hidden transition-all duration-500 ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setShowVideoControls(true)}
        onMouseLeave={(e) => {
          handleMouseUp(e);
          setShowVideoControls(false);
        }}
        ref={(el) => {
          if (containerRef.current !== el) containerRef.current = el;
          if (swipeRef.current !== el) swipeRef.current = el;
        }}
      >
        {/* Current Video with Elastic Animation */}
        <animated.div
          style={{
            transform: springProps.currentY.to(y => `translateY(${y}px)`),
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2
          }}
        >
          <video
            ref={videoRef}
            src={currentVideo.url}
            className="w-full h-full object-cover cursor-pointer rounded-3xl"
            onClick={handleVideoClick}
            onContextMenu={handleRightClick}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
        </animated.div>

        {/* Next Video (Preview during drag) */}
        {nextVideo && (
          <animated.div
            style={{
              transform: springProps.nextY.to(y => `translateY(${y}px)`),
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1
            }}
          >
            <video
              src={nextVideo.url}
              className="w-full h-full object-cover cursor-pointer rounded-3xl"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />



            {/* Next Video Info - Enterprise Solution */}
            <animated.div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{
                zIndex: 5
              }}
            >
              <VideoInfoPanel
                video={nextVideo}
                isNext={true}
                isDarkMode={isDarkMode}
                className="pointer-events-auto"
                onTitleClick={() => console.log('Next video title clicked')}
                onDescriptionClick={() => console.log('Next video description clicked')}
              />
            </animated.div>
          </animated.div>
        )}



        {/* Current Video Buffering Indicator */}
        {isBuffering && (
          <animated.div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30"
            style={{
              transform: springProps.currentY.to(y => `translateY(${y}px)`),
              zIndex: 4
            }}
          >
            <div className={`p-4 rounded-full backdrop-blur-sm ${
              isDarkMode ? 'bg-white/20' : 'bg-black/20'
            }`}>
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          </animated.div>
        )}

        {/* Current Video Play/Pause Overlay */}
        {!isPlaying && (
          <animated.div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-300"
            style={{
              transform: springProps.currentY.to(y => `translateY(${y}px)`),
              zIndex: 4
            }}
          >
            <div
              className={`p-4 rounded-full backdrop-blur-sm transition-all duration-300 ${
                isDarkMode
                  ? 'bg-white/20'
                  : 'bg-black/20'
              }`}
              style={{
                boxShadow: isDarkMode
                  ? `
                    8px 8px 20px rgba(0, 0, 0, 0.4),
                    -8px -8px 20px rgba(255, 255, 255, 0.02)
                  `
                  : `
                    8px 8px 20px rgba(0, 0, 0, 0.2),
                    -8px -8px 20px rgba(255, 255, 255, 0.1)
                  `
              }}
            >
              <Play className="w-12 h-12 text-white" fill="white" />
            </div>
          </animated.div>
        )}



        {/* Fullscreen Button - Only visible control */}
        {showVideoControls && (
          <div className="absolute top-4 right-4">
            <button
              onClick={handleFullscreen}
              className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white transition-opacity duration-300"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Enhanced Progress Bar at Bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 group"
          style={{ zIndex: 10 }}
          onMouseEnter={() => setShowProgressBar(true)}
          onMouseLeave={() => !isProgressDragging && setShowProgressBar(false)}
        >
          {/* Hover area for easier interaction */}
          <div className="w-full h-4 flex items-center cursor-pointer">
            <div
              ref={progressRef}
              className={`w-full transition-all duration-300 bg-white/20 rounded-full ${
                showProgressBar || isProgressDragging ? 'h-2' : 'h-1'
              }`}
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
            >
              {/* Progress fill */}
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100 relative"
                style={{ width: `${progress}%` }}
              >
                {/* Draggable dot - visible on hover or drag */}
                <div
                  className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300 cursor-grab active:cursor-grabbing ${
                    showProgressBar || isProgressDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                  }`}
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}
                />
              </div>

              {/* Buffer indicator (optional) */}
              <div
                className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                style={{ width: `${Math.min(100, progress + 10)}%` }}
              />
            </div>
          </div>

          {/* Time display on hover */}
          {(showProgressBar || isProgressDragging) && (
            <div className="absolute -top-8 left-0 right-0 flex justify-between text-xs text-white/80 px-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          )}
        </div>

        {/* Boundary Message */}
        {showBoundaryMessage && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className={`px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-500 ${
              isDarkMode ? 'bg-gray-800/90 text-white border border-gray-600' : 'bg-white/90 text-gray-900 border border-gray-300'
            }`}>
              <p className="text-xs font-medium text-center">{showBoundaryMessage}</p>
            </div>
          </div>
        )}



        {/* Current Video Info - Enterprise Solution */}
        <animated.div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            transform: springProps.currentY.to(y => `translateY(${y}px)`),
            zIndex: 10
          }}
        >
          <VideoInfoPanel
            video={currentVideo}
            isDarkMode={isDarkMode}
            className="pointer-events-auto"
            onTitleClick={() => console.log('Title clicked')}
            onDescriptionClick={() => console.log('Description clicked')}
            onAuthorClick={() => console.log('Author clicked')}
          />
        </animated.div>





        {/* Right-Click Context Menu */}
        {showContextMenu && (
          <div
            className={`fixed z-50 min-w-48 py-2 rounded-lg shadow-lg ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
            }}
          >
            <button
              onClick={() => {
                togglePlay();
                setShowContextMenu(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 flex items-center space-x-2 ${
                isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={() => {
                handleVolumeChange(volume > 0 ? 0 : 1);
                setShowContextMenu(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 flex items-center space-x-2 ${
                isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              {volume === 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{volume === 0 ? 'Unmute' : 'Mute'}</span>
            </button>

            <div className="border-t border-gray-300 dark:border-gray-600 my-1"></div>

            <button
              onClick={() => {
                setShowSpeedMenu(true);
                setShowContextMenu(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 flex items-center space-x-2 ${
                isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Speed ({playbackSpeed}x)</span>
            </button>

            <button
              onClick={() => {
                setShowQualityMenu(true);
                setShowContextMenu(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 flex items-center space-x-2 ${
                isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Quality ({quality})</span>
            </button>

            <div className="border-t border-gray-300 dark:border-gray-600 my-1"></div>

            <button
              onClick={() => {
                handleFullscreen();
                setShowContextMenu(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 flex items-center space-x-2 ${
                isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Maximize className="w-4 h-4" />
              <span>Fullscreen</span>
            </button>
          </div>
        )}

        {/* Speed Menu */}
        {showSpeedMenu && (
          <div className={`fixed z-50 min-w-32 py-2 rounded-lg shadow-lg ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                  playbackSpeed === speed
                    ? isDarkMode ? 'bg-gray-700 text-purple-400' : 'bg-gray-100 text-indigo-600'
                    : isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        )}

        {/* Quality Menu */}
        {showQualityMenu && (
          <div className={`fixed z-50 min-w-32 py-2 rounded-lg shadow-lg ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}>
            {['auto', '1080p', '720p', '480p'].map((q) => (
              <button
                key={q}
                onClick={() => handleQualityChange(q)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                  quality === q
                    ? isDarkMode ? 'bg-gray-700 text-purple-400' : 'bg-gray-100 text-indigo-600'
                    : isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;