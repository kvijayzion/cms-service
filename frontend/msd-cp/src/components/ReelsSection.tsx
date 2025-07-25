import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Heart, MessageCircle, User, Sparkles, Loader2 } from 'lucide-react';

interface ReelsSectionProps {
  isDarkMode: boolean;
}

interface Reel {
  id: string;
  thumbnail: string;
  title: string;
  views: string;
  likes: number;
  duration: string;
  height: number; // Add height for masonry layout
}

const ReelsSection: React.FC<ReelsSectionProps> = ({ isDarkMode }) => {
  const [activeSubTab, setActiveSubTab] = useState('live');
  const [displayedReels, setDisplayedReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const liveReels: Reel[] = [
    {
      id: '1',
      thumbnail: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'Amazing Sunset Views',
      views: '12.5K',
      likes: 1250,
      duration: '0:45',
      height: 280
    },
    {
      id: '2',
      thumbnail: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'City Night Life',
      views: '8.3K',
      likes: 890,
      duration: '1:20',
      height: 320
    },
    {
      id: '3',
      thumbnail: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'Ocean Waves',
      views: '15.7K',
      likes: 2100,
      duration: '0:30',
      height: 240
    },
    {
      id: '4',
      thumbnail: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'Mountain Adventure',
      views: '9.8K',
      likes: 1450,
      duration: '2:15',
      height: 360
    },
    {
      id: '5',
      thumbnail: 'https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'Forest Walk',
      views: '22.1K',
      likes: 3200,
      duration: '1:45',
      height: 300
    },
    {
      id: '6',
      thumbnail: 'https://images.pexels.com/photos/1181697/pexels-photo-1181697.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'Urban Photography',
      views: '18.9K',
      likes: 2800,
      duration: '1:10',
      height: 260
    }
  ];

  const recommendedReels: Reel[] = [
    {
      id: '7',
      thumbnail: 'https://images.pexels.com/photos/1181701/pexels-photo-1181701.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'Desert Landscape',
      views: '14.2K',
      likes: 1900,
      duration: '0:55',
      height: 340
    },
    {
      id: '8',
      thumbnail: 'https://images.pexels.com/photos/1181705/pexels-photo-1181705.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'Waterfall Beauty',
      views: '31.5K',
      likes: 4100,
      duration: '2:30',
      height: 290
    },
    {
      id: '9',
      thumbnail: 'https://images.pexels.com/photos/1181709/pexels-photo-1181709.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'Mountain Peak',
      views: '19.8K',
      likes: 2650,
      duration: '1:35',
      height: 380
    },
    {
      id: '10',
      thumbnail: 'https://images.pexels.com/photos/1181712/pexels-photo-1181712.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'Coastal Beauty',
      views: '27.3K',
      likes: 3800,
      duration: '2:05',
      height: 250
    },
    {
      id: '11',
      thumbnail: 'https://images.pexels.com/photos/1181715/pexels-photo-1181715.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'City Lights',
      views: '16.7K',
      likes: 2200,
      duration: '1:25',
      height: 310
    },
    {
      id: '12',
      thumbnail: 'https://images.pexels.com/photos/1181718/pexels-photo-1181718.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
      title: 'Garden Paradise',
      views: '13.4K',
      likes: 1850,
      duration: '0:50',
      height: 270
    }
  ];

  // Function to generate more reels
  const generateMoreReels = useCallback((count: number, startId: number): Reel[] => {
    const imageIds = [
      '1181671', '1181677', '1181686', '1181690', '1181695', '1181697',
      '1181701', '1181705', '1181709', '1181712', '1181715', '1181718',
      '1181720', '1181725', '1181730', '1181735', '1181740', '1181745'
    ];

    const titles = [
      'Amazing Sunset Views', 'City Night Life', 'Ocean Waves', 'Mountain Adventure',
      'Forest Walk', 'Urban Photography', 'Desert Landscape', 'Waterfall Beauty',
      'Mountain Peak', 'Coastal Beauty', 'City Lights', 'Garden Paradise',
      'Starry Night', 'River Flow', 'Autumn Colors', 'Winter Wonderland',
      'Spring Blossoms', 'Summer Vibes', 'Peaceful Lake', 'Rocky Cliffs'
    ];

    const newReels: Reel[] = [];
    for (let i = 0; i < count; i++) {
      const id = startId + i;
      const imageId = imageIds[id % imageIds.length];
      const title = titles[id % titles.length];
      const views = `${(Math.random() * 50 + 5).toFixed(1)}K`;
      const likes = Math.floor(Math.random() * 5000 + 500);
      const duration = `${Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
      const height = Math.floor(Math.random() * 140) + 240; // Random height between 240-380px

      newReels.push({
        id: id.toString(),
        thumbnail: `https://images.pexels.com/photos/${imageId}/pexels-photo-${imageId}.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop`,
        title: `${title} ${id}`,
        views,
        likes,
        duration,
        height
      });
    }
    return newReels;
  }, []);

  const currentReels = activeSubTab === 'live' ? liveReels : recommendedReels;

  // Load more reels function
  const loadMoreReels = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const newReels = generateMoreReels(12, displayedReels.length);
      setDisplayedReels(prev => [...prev, ...newReels]);
      setLoading(false);

      // Stop loading more after 100 items for demo purposes
      if (displayedReels.length + newReels.length >= 100) {
        setHasMore(false);
      }
    }, 500);
  }, [loading, hasMore, displayedReels.length, generateMoreReels]);

  // Initialize reels when tab changes
  useEffect(() => {
    setDisplayedReels([...currentReels]);
    setHasMore(true);
  }, [activeSubTab, currentReels]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreReels();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [loadMoreReels, hasMore, loading]);

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveSubTab('live')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isDarkMode
              ? activeSubTab === 'live' 
                ? 'bg-gray-600' 
                : 'bg-gray-700'
              : activeSubTab === 'live' 
                ? 'bg-gray-200' 
                : 'bg-gray-100'
          }`}
          style={{
            boxShadow: activeSubTab === 'live'
              ? isDarkMode
                ? `
                  inset 4px 4px 12px rgba(0, 0, 0, 0.4),
                  inset -4px -4px 12px rgba(255, 255, 255, 0.02)
                `
                : `
                  inset 4px 4px 12px rgba(0, 0, 0, 0.1),
                  inset -4px -4px 12px rgba(255, 255, 255, 0.9)
                `
              : isDarkMode
                ? `
                  4px 4px 12px rgba(0, 0, 0, 0.4),
                  -4px -4px 12px rgba(255, 255, 255, 0.02)
                `
                : `
                  4px 4px 12px rgba(0, 0, 0, 0.1),
                  -4px -4px 12px rgba(255, 255, 255, 0.8)
                `
          }}
        >
          <User className={`w-5 h-5 ${
            activeSubTab === 'live'
              ? isDarkMode
                ? 'text-purple-400'
                : 'text-indigo-600'
              : isDarkMode
                ? 'text-gray-400'
                : 'text-gray-600'
          }`} />
          <span className={`font-medium ${
            activeSubTab === 'live'
              ? isDarkMode
                ? 'text-purple-400'
                : 'text-indigo-600'
              : isDarkMode
                ? 'text-gray-400'
                : 'text-gray-600'
          }`}>
            User Live Reels
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('recommended')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isDarkMode
              ? activeSubTab === 'recommended' 
                ? 'bg-gray-600' 
                : 'bg-gray-700'
              : activeSubTab === 'recommended' 
                ? 'bg-gray-200' 
                : 'bg-gray-100'
          }`}
          style={{
            boxShadow: activeSubTab === 'recommended'
              ? isDarkMode
                ? `
                  inset 4px 4px 12px rgba(0, 0, 0, 0.4),
                  inset -4px -4px 12px rgba(255, 255, 255, 0.02)
                `
                : `
                  inset 4px 4px 12px rgba(0, 0, 0, 0.1),
                  inset -4px -4px 12px rgba(255, 255, 255, 0.9)
                `
              : isDarkMode
                ? `
                  4px 4px 12px rgba(0, 0, 0, 0.4),
                  -4px -4px 12px rgba(255, 255, 255, 0.02)
                `
                : `
                  4px 4px 12px rgba(0, 0, 0, 0.1),
                  -4px -4px 12px rgba(255, 255, 255, 0.8)
                `
          }}
        >
          <Sparkles className={`w-5 h-5 ${
            activeSubTab === 'recommended'
              ? isDarkMode
                ? 'text-purple-400'
                : 'text-indigo-600'
              : isDarkMode
                ? 'text-gray-400'
                : 'text-gray-600'
          }`} />
          <span className={`font-medium ${
            activeSubTab === 'recommended'
              ? isDarkMode
                ? 'text-purple-400'
                : 'text-indigo-600'
              : isDarkMode
                ? 'text-gray-400'
                : 'text-gray-600'
          }`}>
            Recommendations
          </span>
        </button>
      </div>

      {/* Reels Masonry Grid */}
      <div className="masonry-grid">
        {displayedReels.map((reel) => (
          <div
            key={reel.id}
            className={`masonry-item group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? 'bg-gray-700'
                : 'bg-gray-100'
            }`}
            style={{
              height: `${reel.height}px`,
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
          >
            {/* Thumbnail */}
            <img
              src={reel.thumbnail}
              alt={reel.title}
              className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div
                className={`p-3 rounded-full backdrop-blur-sm ${
                  isDarkMode
                    ? 'bg-white/20'
                    : 'bg-black/20'
                }`}
                style={{
                  boxShadow: isDarkMode
                    ? `
                      4px 4px 12px rgba(0, 0, 0, 0.4),
                      -4px -4px 12px rgba(255, 255, 255, 0.02)
                    `
                    : `
                      4px 4px 12px rgba(0, 0, 0, 0.2),
                      -4px -4px 12px rgba(255, 255, 255, 0.8)
                    `
                }}
              >
                <Play className="w-6 h-6 text-white" fill="white" />
              </div>
            </div>

            {/* Duration */}
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-lg backdrop-blur-sm">
                {reel.duration}
              </span>
            </div>

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h4 className="font-semibold text-sm mb-1 truncate">
                {reel.title}
              </h4>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1">
                  <Play className="w-3 h-3" />
                  <span>{reel.views}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{reel.likes.toLocaleString()}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className={`w-8 h-8 animate-spin ${
            isDarkMode ? 'text-purple-400' : 'text-indigo-600'
          }`} />
          <span className={`ml-3 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Loading more reels...
          </span>
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerRef} className="h-4" />

      {/* End message */}
      {!hasMore && (
        <div className="text-center py-8">
          <p className={`${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            You've reached the end! 🎉
          </p>
        </div>
      )}
    </div>
  );
};

export default ReelsSection;