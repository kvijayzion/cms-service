import React, { useState, useRef, useEffect } from 'react';
import {
  Heart, Share, MoreHorizontal, Play, Pause,
  Volume2, VolumeX, Maximize, Loader2, Flag, Bookmark, ExternalLink
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { useSpring, animated } from '@react-spring/web';

interface Video {
  id: string;
  url: string;
  title: string;
  description: string;
  likes: number;
  comments: number;
}

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showBoundaryMessage, setShowBoundaryMessage] = useState<string | null>(null);

  // Elastic swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);

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
    likeVideo,
    bookmarkVideo,
    addToViewHistory,
    updateWatchTime
  } = useStore();

  // Initialize videos - force initialization to ensure all 5 videos are loaded
  useEffect(() => {
    // Always initialize videos to ensure we have all 5 videos
    const sampleVideos: Video[] = [
        {
          id: '1',
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
            id: '1',
            name: 'Nature Lover',
            email: 'nature@example.com',
            avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            followers: 15000,
            following: 500,
            likes: 50000,
            videos: 120,
            verified: true
          },
          createdAt: new Date().toISOString(),
          isLiked: false,
          isBookmarked: false,
          tags: ['nature', 'sunset', 'mountains']
        },
        {
          id: '2',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          title: 'Ocean Waves',
          description: 'Relaxing ocean waves crashing against the shore on a peaceful evening.',
          likes: 2567,
          comments: 156,
          shares: 78,
          views: 25600,
          duration: 180,
          thumbnail: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          creator: {
            id: '2',
            name: 'Ocean Explorer',
            email: 'ocean@example.com',
            avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            followers: 22000,
            following: 800,
            likes: 75000,
            videos: 200,
            verified: true
          },
          createdAt: new Date().toISOString(),
          isLiked: false,
          isBookmarked: false,
          tags: ['ocean', 'waves', 'relaxing']
        },
        {
          id: '3',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          title: 'City Lights',
          description: 'Stunning city skyline at night with vibrant lights and bustling energy.',
          likes: 3456,
          comments: 234,
          shares: 123,
          views: 45600,
          duration: 150,
          thumbnail: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          creator: {
            id: '3',
            name: 'Urban Photographer',
            email: 'urban@example.com',
            avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            followers: 18500,
            following: 650,
            likes: 62000,
            videos: 85,
            verified: true
          },
          createdAt: new Date().toISOString(),
          isLiked: false,
          isBookmarked: false,
          tags: ['city', 'lights', 'urban', 'night']
        },
        {
          id: '4',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          title: 'Mountain Adventure',
          description: 'Epic mountain hiking adventure with breathtaking views and challenging trails.',
          likes: 4789,
          comments: 312,
          shares: 189,
          views: 67800,
          duration: 240,
          thumbnail: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          creator: {
            id: '4',
            name: 'Adventure Seeker',
            email: 'adventure@example.com',
            avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            followers: 32000,
            following: 1200,
            likes: 95000,
            videos: 156,
            verified: true
          },
          createdAt: new Date().toISOString(),
          isLiked: false,
          isBookmarked: false,
          tags: ['mountain', 'adventure', 'hiking', 'nature']
        },
        {
          id: '5',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          title: 'Forest Meditation',
          description: 'Peaceful forest sounds and scenery perfect for meditation and relaxation.',
          likes: 2134,
          comments: 167,
          shares: 89,
          views: 34500,
          duration: 300,
          thumbnail: 'https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          creator: {
            id: '5',
            name: 'Zen Master',
            email: 'zen@example.com',
            avatar: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            followers: 28000,
            following: 450,
            likes: 78000,
            videos: 203,
            verified: true
          },
          createdAt: new Date().toISOString(),
          isLiked: false,
          isBookmarked: false,
          tags: ['forest', 'meditation', 'peaceful', 'zen']
        }
    ];
    useStore.getState().setVideos(sampleVideos);
  }, []); // Force initialization on component mount

  const currentVideo = videos[currentVideoIndex] || null;

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
    if (!progressRef.current || !videoRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    videoRef.current.currentTime = newTime;
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  const shareOptions = [
    { name: 'Twitter', icon: '🐦', url: 'https://twitter.com/intent/tweet?url=' },
    { name: 'Facebook', icon: '📘', url: 'https://www.facebook.com/sharer/sharer.php?u=' },
    { name: 'WhatsApp', icon: '💬', url: 'https://wa.me/?text=' },
    { name: 'Copy Link', icon: '🔗', url: '' },
  ];

  if (!currentVideo) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
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
        {currentVideoIndex < videos.length - 1 && (
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
              src={videos[currentVideoIndex + 1].url}
              className="w-full h-full object-cover cursor-pointer rounded-3xl"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />

            {/* Next Video Right Side Actions */}
            <animated.div
              className="absolute right-4 bottom-20 flex flex-col space-y-6"
              style={{
                zIndex: 2
              }}
            >
              {/* Like Button */}
              <button
                onClick={() => likeVideo(videos[currentVideoIndex + 1].id)}
                className="group relative flex flex-col items-center"
              >
                <Heart
                  className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${
                    videos[currentVideoIndex + 1].isLiked
                      ? 'text-red-500 fill-red-500'
                      : isDarkMode
                        ? 'text-white'
                        : 'text-white'
                  }`}
                />
                <span className={`text-xs mt-1 block text-center transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-white'
                }`}>
                  {videos[currentVideoIndex + 1].likes.toLocaleString()}
                </span>
              </button>

              {/* Bookmark Button */}
              <button
                onClick={() => bookmarkVideo(videos[currentVideoIndex + 1].id)}
                className="group relative flex flex-col items-center"
              >
                <Bookmark className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${
                  videos[currentVideoIndex + 1].isBookmarked
                    ? 'text-yellow-500 fill-yellow-500'
                    : isDarkMode ? 'text-white' : 'text-white'
                }`} />
              </button>

              {/* Share Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="group relative flex flex-col items-center"
              >
                <Share className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${
                  isDarkMode ? 'text-white' : 'text-white'
                }`} />
                <span className={`text-xs mt-1 block text-center transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-white'
                }`}>
                  {videos[currentVideoIndex + 1].shares.toLocaleString()}
                </span>
              </button>

              {/* Report Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="group relative flex flex-col items-center"
              >
                <Flag className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${
                  isDarkMode ? 'text-white' : 'text-white'
                }`} />
              </button>
            </animated.div>

            {/* Next Video Info */}
            <animated.div
              className="absolute bottom-4 left-4 right-20"
              style={{
                zIndex: 2
              }}
            >
              <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-white'
              }`}>
                {videos[currentVideoIndex + 1].title}
              </h3>
              <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-200'
              }`}>
                {videos[currentVideoIndex + 1].description}
              </p>
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

        {/* Progress Bar at Bottom - Hidden by default, shown on hover/drag */}
        <div className="absolute bottom-0 left-0 right-0 group" style={{ zIndex: 10 }}>
          <div
            ref={progressRef}
            className="w-full h-1 bg-white/20 cursor-pointer transition-all duration-300 group-hover:h-2"
            onClick={handleProgressClick}
            onMouseEnter={() => setShowVideoControls(true)}
            onMouseLeave={() => setShowVideoControls(false)}
            style={{ clipPath: 'inset(0 0 0 0 round 24px)' }}
          >
            <div
              className="h-full bg-white transition-all duration-100 relative"
              style={{ width: `${progress}%` }}
            >
              {/* Draggable dot - only visible on hover */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-grab active:cursor-grabbing" />
            </div>
          </div>
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

        {/* Current Video Right Side Actions */}
        <animated.div
          className="absolute right-4 bottom-20 flex flex-col space-y-6"
          style={{
            transform: springProps.currentY.to(y => `translateY(${y}px)`),
            zIndex: 3
          }}
        >
          {/* Like Button */}
          <button
            onClick={() => likeVideo(currentVideo.id)}
            className="group relative flex flex-col items-center"
          >
            <Heart
              className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${
                currentVideo.isLiked
                  ? 'text-red-500 fill-red-500'
                  : isDarkMode
                    ? 'text-white'
                    : 'text-white'
              }`}
            />
            <span className={`text-xs mt-1 block text-center transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-white'
            }`}>
              {currentVideo.likes.toLocaleString()}
            </span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => bookmarkVideo(currentVideo.id)}
            className="group relative flex flex-col items-center"
          >
            <Bookmark className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${
              currentVideo.isBookmarked
                ? 'text-yellow-500 fill-yellow-500'
                : isDarkMode ? 'text-white' : 'text-white'
            }`} />
          </button>

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="group relative flex flex-col items-center"
          >
            <Share className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${
              isDarkMode ? 'text-white' : 'text-white'
            }`} />
            <span className={`text-xs mt-1 block text-center transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-white'
            }`}>
              {currentVideo.shares.toLocaleString()}
            </span>
          </button>

          {/* Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="group relative flex flex-col items-center"
          >
            <Flag className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${
              isDarkMode ? 'text-white' : 'text-white'
            }`} />
          </button>
        </animated.div>

        {/* Current Video Info */}
        <animated.div
          className="absolute bottom-4 left-4 right-20"
          style={{
            transform: springProps.currentY.to(y => `translateY(${y}px)`),
            zIndex: 3
          }}
        >
          <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-white'
          }`}>
            {currentVideo.title}
          </h3>
          <p className={`text-sm leading-relaxed transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-200'
          }`}>
            {currentVideo.description}
          </p>
        </animated.div>



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
                      // Handle report submission
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