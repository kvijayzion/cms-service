import React, { useState, useRef, useEffect } from 'react';
import {
  Moon, Sun, User, ShoppingCart, Bell, Search, Settings,
  LogOut, Bookmark, History, HelpCircle, ChevronDown
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface NavbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isDarkMode, toggleDarkMode }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const {
    currentUser,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    logout,
    setSearchQuery: setGlobalSearchQuery
  } = useStore();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalSearchQuery(searchQuery);
  };


  return (
    <nav className={`sticky top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-500 ${
      isDarkMode
        ? 'bg-gray-900/95 border-gray-700/30'
        : 'bg-white/95 border-gray-200/30'
    }`}>
      <div className="max-w-full mx-auto px-6 pl-28">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className={`text-2xl font-bold bg-clip-text text-transparent transition-all duration-500 animate-gradient ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 via-purple-300'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 via-indigo-500'
            }`}>
              MySillyDreams
            </h1>
          </div>



          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className={`flex items-center rounded-2xl px-4 py-2 transition-all duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Search className={`w-4 h-4 mr-3 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search videos, creators..."
                  className={`flex-1 bg-transparent outline-none ${
                    isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </form>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative group p-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}
                style={{
                  boxShadow: isDarkMode
                    ? `
                      6px 6px 16px rgba(0, 0, 0, 0.4),
                      -6px -6px 16px rgba(255, 255, 255, 0.02),
                      inset 2px 2px 4px rgba(0, 0, 0, 0.2),
                      inset -2px -2px 4px rgba(255, 255, 255, 0.05)
                    `
                    : `
                      6px 6px 16px rgba(0, 0, 0, 0.1),
                      -6px -6px 16px rgba(255, 255, 255, 0.8),
                      inset 2px 2px 4px rgba(0, 0, 0, 0.05),
                      inset -2px -2px 4px rgba(255, 255, 255, 0.9)
                    `
                }}
              >
                <Bell className={`w-4 h-4 transition-all duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className={`absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl border z-50 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-indigo-600 hover:text-indigo-500'
                          }`}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className={`w-12 h-12 mx-auto mb-4 ${
                          isDarkMode ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b transition-colors duration-300 cursor-pointer ${
                            isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                          } ${
                            !notification.read
                              ? isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                              : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <img
                              src={notification.userAvatar}
                              alt={notification.userName}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <span className="font-medium">{notification.userName}</span>{' '}
                                {notification.message}
                              </p>
                              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              className={`relative group p-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
              style={{
                boxShadow: isDarkMode
                  ? `
                    6px 6px 16px rgba(0, 0, 0, 0.4),
                    -6px -6px 16px rgba(255, 255, 255, 0.02),
                    inset 2px 2px 4px rgba(0, 0, 0, 0.2),
                    inset -2px -2px 4px rgba(255, 255, 255, 0.05)
                  `
                  : `
                    6px 6px 16px rgba(0, 0, 0, 0.1),
                    -6px -6px 16px rgba(255, 255, 255, 0.8),
                    inset 2px 2px 4px rgba(0, 0, 0, 0.05),
                    inset -2px -2px 4px rgba(255, 255, 255, 0.9)
                  `
              }}
            >
              <ShoppingCart className={`w-4 h-4 transition-all duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`} />
              {/* Cart badge */}
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex items-center space-x-2 p-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}
                style={{
                  boxShadow: isDarkMode
                    ? `
                      6px 6px 16px rgba(0, 0, 0, 0.4),
                      -6px -6px 16px rgba(255, 255, 255, 0.02),
                      inset 2px 2px 4px rgba(0, 0, 0, 0.2),
                      inset -2px -2px 4px rgba(255, 255, 255, 0.05)
                    `
                    : `
                      6px 6px 16px rgba(0, 0, 0, 0.1),
                      -6px -6px 16px rgba(255, 255, 255, 0.8),
                      inset 2px 2px 4px rgba(0, 0, 0, 0.05),
                      inset -2px -2px 4px rgba(255, 255, 255, 0.9)
                    `
                }}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={currentUser?.avatar || "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${
                  showUserDropdown ? 'rotate-180' : ''
                } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>

              {/* User Dropdown Menu */}
              {showUserDropdown && (
                <div className={`absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl border z-50 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}>
                  {/* User Info */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <img
                          src={currentUser?.avatar || "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {currentUser?.name || 'John Doe'}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {currentUser?.email || 'john@example.com'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {[
                      { icon: User, label: 'Profile', action: () => {} },
                      { icon: Bookmark, label: 'Bookmarks', action: () => {} },
                      { icon: History, label: 'Watch History', action: () => {} },
                      { icon: Settings, label: 'Settings', action: () => {} },
                      { icon: HelpCircle, label: 'Help & Support', action: () => {} },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors duration-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className={`h-8 w-px ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`} />

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`relative group p-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
                isDarkMode
                  ? 'bg-gray-800'
                  : 'bg-gray-100'
              }`}
              style={{
                boxShadow: isDarkMode
                  ? `
                    6px 6px 16px rgba(0, 0, 0, 0.4),
                    -6px -6px 16px rgba(255, 255, 255, 0.02),
                    inset 2px 2px 4px rgba(0, 0, 0, 0.2),
                    inset -2px -2px 4px rgba(255, 255, 255, 0.05)
                  `
                  : `
                    6px 6px 16px rgba(0, 0, 0, 0.1),
                    -6px -6px 16px rgba(255, 255, 255, 0.8),
                    inset 2px 2px 4px rgba(0, 0, 0, 0.05),
                    inset -2px -2px 4px rgba(255, 255, 255, 0.9)
                  `
              }}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-yellow-400 transition-all duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600 transition-all duration-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;