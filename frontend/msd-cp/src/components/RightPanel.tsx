import React, { useState, useRef, useEffect } from 'react';
import {
  Package, Star, Check, ShoppingCart,
  MessageCircle, Send,
  Heart, Plus, Minus, CreditCard, Receipt, Search, Filter
} from 'lucide-react';
import ReelsSection from './ReelsSection';
import { useStore } from '../store/useStore';
import { formatTimeAgo } from '../utils/formatTime';

interface RightPanelProps {
  isDarkMode: boolean;
}



interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
}

interface CommentThreadProps {
  comment: Comment;
  isDarkMode: boolean;
  onLike: () => void;
  onReply: (content: string) => void;
  level: number;
}

const CommentThread: React.FC<CommentThreadProps> = ({ comment, isDarkMode, onLike, onReply, level }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(true);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      onReply(replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  const maxLevel = 3; // Maximum nesting level
  const indentClass = level > 0 ? `ml-${Math.min(level * 4, 12)}` : '';

  return (
    <div className={`${indentClass}`}>
      <div className={`p-3 rounded-2xl transition-all duration-300 hover:scale-[1.01] ${
        isDarkMode ? 'bg-gray-700' : 'bg-gray-100 border border-gray-200'
      } ${level > 0 ? 'border-l-2 border-purple-500' : ''}`}>
        <div className="flex items-start space-x-3">
          <img
            src={comment.userAvatar}
            alt={comment.userName}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={`font-semibold text-sm ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {comment.userName}
              </h4>
              <span className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>
            <p className={`text-sm mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {comment.content}
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={onLike}
                className={`flex items-center space-x-1 text-xs transition-colors duration-300 ${
                  comment.isLiked
                    ? 'text-red-500'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-red-400'
                      : 'text-gray-600 hover:text-red-500'
                }`}
              >
                <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                <span>{comment.likes}</span>
              </button>
              {level < maxLevel && (
                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className={`text-xs transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  Reply
                </button>
              )}
              {comment.replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className={`text-xs transition-colors duration-300 ${
                    isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-indigo-600 hover:text-indigo-700'
                  }`}
                >
                  {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {showReplyInput && (
        <div className="mt-2 ml-11">
          <form onSubmit={handleReplySubmit}>
            <div className={`flex items-center space-x-2 p-2 rounded-xl ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
            }`}>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.userName}...`}
                className={`flex-1 bg-transparent outline-none text-sm ${
                  isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                }`}
                autoFocus
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className={`p-1 rounded-full transition-all duration-300 disabled:opacity-50 ${
                  isDarkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Nested Replies */}
      {showReplies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              isDarkMode={isDarkMode}
              onLike={() => {}} // Would need to implement nested like functionality
              onReply={(content) => onReply(content)}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const RightPanel: React.FC<RightPanelProps> = ({ isDarkMode }) => {
  const [newComment, setNewComment] = useState('');
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [showInvoice, setShowInvoice] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Dynamic products based on current video
  const getProductsForVideo = (videoId: string) => {
    const productSets = {
      '1': [ // Beautiful Sunset
        { id: '1', name: 'Sunset Photography Course', price: 49.99, image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Master golden hour photography', category: 'Education' },
        { id: '2', name: 'ND Filter Set', price: 129.99, image: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Professional neutral density filters', category: 'Hardware' },
        { id: '3', name: 'Landscape Tripod', price: 199.99, image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Sturdy tripod for landscape shots', category: 'Equipment' },
      ],
      '2': [ // Ocean Waves
        { id: '4', name: 'Waterproof Camera Housing', price: 299.99, image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Protect your camera near water', category: 'Hardware' },
        { id: '5', name: 'Ocean Sounds Pack', price: 19.99, image: 'https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'High-quality ocean audio samples', category: 'Audio' },
        { id: '6', name: 'Coastal Photography Guide', price: 39.99, image: 'https://images.pexels.com/photos/1181697/pexels-photo-1181697.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Complete guide to coastal photography', category: 'Education' },
      ],
      '3': [ // City Lights
        { id: '7', name: 'Night Photography Lens', price: 599.99, image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Perfect for low-light city shots', category: 'Hardware' },
        { id: '8', name: 'Urban Photography Course', price: 79.99, image: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Master urban night photography', category: 'Education' },
        { id: '9', name: 'LED Light Panel', price: 149.99, image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Portable LED lighting solution', category: 'Equipment' },
      ],
      '4': [ // Mountain Adventure
        { id: '10', name: 'Adventure Camera Backpack', price: 189.99, image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Rugged backpack for outdoor shoots', category: 'Equipment' },
        { id: '11', name: 'Mountain Hiking Guide', price: 29.99, image: 'https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Complete mountain hiking handbook', category: 'Education' },
        { id: '12', name: 'Action Camera Mount', price: 49.99, image: 'https://images.pexels.com/photos/1181697/pexels-photo-1181697.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Versatile mounting system', category: 'Hardware' },
      ],
      '5': [ // Forest Meditation
        { id: '13', name: 'Nature Sounds Collection', price: 24.99, image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Premium forest and nature sounds', category: 'Audio' },
        { id: '14', name: 'Meditation Course Bundle', price: 99.99, image: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'Complete meditation training', category: 'Education' },
        { id: '15', name: 'Portable Audio Recorder', price: 179.99, image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', description: 'High-quality field recording', category: 'Audio' },
      ]
    };
    return productSets[videoId as keyof typeof productSets] || productSets['1'];
  };

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // E-commerce functions
  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };





  const {
    activeTab,
    setActiveTab,
    videos,
    currentVideoIndex,
    comments,
    addComment,
    likeComment,
    currentUser
  } = useStore();

  const currentVideo = videos[currentVideoIndex];
  const videoComments = currentVideo ? comments[currentVideo.id] || [] : [];

  // Initialize products state after currentVideo is available
  const [products, setProducts] = useState<Product[]>(() =>
    getProductsForVideo(currentVideo?.id || '1')
  );

  // Handle video changes with smooth loading
  useEffect(() => {
    if (currentVideo) {
      setIsLoading(true);
      // Clear cart when video changes
      setCart({});

      // Simulate loading delay for smooth transition
      const timer = setTimeout(() => {
        setProducts(getProductsForVideo(currentVideo.id));
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentVideo?.id]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });





  const tabs = [
    { id: 'package', label: 'Package', icon: Package },
    { id: 'reels', label: 'Reels', icon: Star },
    { id: 'comments', label: 'Comments', icon: MessageCircle },
  ];

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [videoComments]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentVideo || !currentUser) return;

    addComment(currentVideo.id, {
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: newComment.trim(),
      likes: 0,
      replies: [],
      isLiked: false
    });

    setNewComment('');
  };

  const handleReplyToComment = (parentId: string, content: string) => {
    if (content.trim() && currentVideo && currentUser) {
      // This would need to be implemented in the store to handle nested replies
      // For now, we'll add it as a regular comment with a mention
      addComment(currentVideo.id, {
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: content.trim(),
        likes: 0,
        replies: [],
        isLiked: false
      });
      setReplyingTo(null);
      setReplyContent('');
    }
  };







  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="h-full rounded-3xl transition-all duration-500 overflow-hidden flex flex-col">
      {/* Tab Navigation */}
      <div className="flex p-6 border-b border-opacity-20 border-gray-300">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 mr-2 ${
                isDarkMode
                  ? isActive 
                    ? 'bg-gray-700' 
                    : 'bg-gray-800'
                  : isActive
                    ? 'bg-gray-200 border border-gray-300'
                    : 'bg-gray-100 border border-gray-200'
              }`}
              style={{
                boxShadow: isActive
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
              <Icon className={`w-5 h-5 ${
                isActive
                  ? isDarkMode
                    ? 'text-purple-400'
                    : 'text-indigo-600'
                  : isDarkMode
                    ? 'text-gray-400'
                    : 'text-gray-600'
              }`} />
              <span className={`text-sm font-medium ${
                isActive
                  ? isDarkMode
                    ? 'text-purple-400'
                    : 'text-indigo-600'
                  : isDarkMode
                    ? 'text-gray-400'
                    : 'text-gray-600'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'comments' && (
          <div className="h-full flex flex-col relative">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Comments ({videoComments.length})
              </h3>
            </div>

            {/* Comments List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
              {videoComments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${
                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videoComments.map((comment) => (
                    <CommentThread
                      key={comment.id}
                      comment={comment}
                      isDarkMode={isDarkMode}
                      onLike={() => likeComment(currentVideo!.id, comment.id)}
                      onReply={(content) => handleReplyToComment(comment.id, content)}
                      level={0}
                    />
                  ))}
                </div>
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Fixed Bottom Input Bar */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
            }`}>
              <form onSubmit={handleAddComment}>
                <div className={`flex items-center space-x-3 p-3 rounded-2xl ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100 border border-gray-200'
                }`}>
                  <img
                    src={currentUser?.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full"
                  />
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className={`flex-1 bg-transparent outline-none ${
                      isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className={`p-2 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}





        {activeTab === 'package' && (
          <div className="h-full p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Section 1: Video Info & Engagement */}
              <div className={`p-4 rounded-xl transition-all duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100 border border-gray-200'
              } ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <div className="flex space-x-4">
                    {/* Left side - Square image */}
                    <div className="flex-shrink-0">
                      <img
                        src={currentVideo?.thumbnail || 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop'}
                        alt="Video thumbnail"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>

                    {/* Right side - Content */}
                    <div className="flex-1 min-w-0">
                      <h2 className={`text-lg font-bold mb-1 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {currentVideo?.title || 'Amazing Sunset Views'}
                      </h2>

                      <p className={`text-xs mb-3 line-clamp-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {currentVideo?.description || 'Experience breathtaking moments captured in stunning detail.'}
                      </p>

                      {/* Engagement Metrics */}
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                          <span className={`text-xs font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {currentVideo?.views?.toLocaleString() || '12.5K'} views
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <span className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {currentVideo?.likes?.toLocaleString() || '1.2K'} likes
                          </span>
                        </div>

                        {(currentVideo?.views && currentVideo.views > 1000000) && (
                          <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-full px-2 py-0.5">
                            <span className="text-white text-xs font-bold">🔥 TRENDING</span>
                          </div>
                        )}
                      </div>

                      {/* Hashtags */}
                      <div className="flex flex-wrap gap-1">
                        {(currentVideo?.tags || ['sunset', 'nature', 'peaceful']).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Products & Services */}
              <div className={`p-4 rounded-xl transition-all duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100 border border-gray-200'
              } ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {currentVideo?.title ? `${currentVideo.title} - Creator Package` : 'Creator Package'}
                </h3>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`p-3 rounded-lg animate-pulse ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded ${
                            isDarkMode ? 'bg-gray-500' : 'bg-gray-300'
                          }`}></div>
                          <div className="flex-1">
                            <div className={`h-4 rounded mb-1 ${
                              isDarkMode ? 'bg-gray-500' : 'bg-gray-300'
                            }`}></div>
                            <div className={`h-3 rounded w-2/3 ${
                              isDarkMode ? 'bg-gray-500' : 'bg-gray-300'
                            }`}></div>
                          </div>
                          <div className={`h-4 w-12 rounded ${
                            isDarkMode ? 'bg-gray-500' : 'bg-gray-300'
                          }`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                        cart[product.id] > 0
                          ? isDarkMode
                            ? 'bg-purple-600/20 border border-purple-500'
                            : 'bg-indigo-50 border border-indigo-200'
                          : isDarkMode
                            ? 'bg-gray-600 hover:bg-gray-500'
                            : 'bg-gray-200 hover:bg-gray-300 border border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => cart[product.id] > 0 ? removeFromCart(product.id) : addToCart(product.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                            cart[product.id] > 0
                              ? isDarkMode
                                ? 'bg-purple-600 border-purple-600'
                                : 'bg-indigo-600 border-indigo-600'
                              : isDarkMode
                                ? 'border-gray-400 hover:border-purple-400'
                                : 'border-gray-400 hover:border-indigo-400'
                          }`}
                        >
                          {cart[product.id] > 0 && <Check className="w-3 h-3 text-white" />}
                        </button>

                        <div>
                          <h4 className={`font-medium text-sm ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {product.name}
                          </h4>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {product.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-bold text-sm ${
                          isDarkMode ? 'text-purple-400' : 'text-indigo-600'
                        }`}>
                          ₹{product.price}
                        </span>
                        {cart[product.id] > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className={`p-1 rounded ${
                                isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400 border border-gray-400'
                              }`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className={`text-xs px-2 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {cart[product.id]}
                            </span>
                            <button
                              onClick={() => addToCart(product.id)}
                              className={`p-1 rounded ${
                                isDarkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-indigo-600 hover:bg-indigo-500'
                              } text-white`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>

              {/* Section 3: Invoice & Cart */}
              {getCartItemCount() > 0 && (
                <div className={`p-4 rounded-xl border-2 ${
                  isDarkMode ? 'bg-gray-800 border-purple-500' : 'bg-gray-50 border-indigo-500'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Package Invoice
                    </h4>
                    <Receipt className={`w-5 h-5 ${
                      isDarkMode ? 'text-purple-400' : 'text-indigo-600'
                    }`} />
                  </div>

                  <div className="space-y-2 mb-4">
                    {Object.entries(cart).map(([productId, quantity]) => {
                      const product = products.find(p => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={productId} className="flex justify-between text-sm">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                            {product.name} x{quantity}
                          </span>
                          <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            ₹{(product.price * quantity).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`border-t pt-3 ${
                    isDarkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between font-bold mb-4">
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        Total Package:
                      </span>
                      <span className={isDarkMode ? 'text-purple-400' : 'text-indigo-600'}>
                        ₹{getTotalPrice().toFixed(2)}
                      </span>
                    </div>

                    <button className={`w-full py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                      isDarkMode
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}>
                      <ShoppingCart className="w-5 h-5 mr-2 inline" />
                      Add Package to Cart
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reels' && (
          <div className="h-full p-6 overflow-y-auto">
            <ReelsSection isDarkMode={isDarkMode} />
          </div>
        )}


      </div>
    </div>
  );
};

export default RightPanel;