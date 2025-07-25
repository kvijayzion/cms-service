import React, { useState } from 'react';
import {
  Home, Grid3X3, Settings, Zap, TrendingUp, Users,
  Upload, Radio, Trophy, Heart, Eye, Video, Plus,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface SidebarProps {
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isDarkMode }) => {
  const { currentUser, sidebarCollapsed, toggleSidebar, activeMenuItem, setActiveMenuItem } = useStore();

  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'trending', icon: TrendingUp, label: 'Trending' },
    { id: 'following', icon: Users, label: 'Following' },
    { id: 'categories', icon: Grid3X3, label: 'Categories' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const quickActions = [
    { id: 'upload', icon: Upload, label: 'Upload Video', color: 'text-green-500' },
    { id: 'live', icon: Radio, label: 'Go Live', color: 'text-red-500' },
  ];

  const userStats = currentUser ? [
    { icon: Video, label: 'Videos', value: currentUser.videos || 0 },
    { icon: Users, label: 'Followers', value: currentUser.followers || 0 },
    { icon: Heart, label: 'Likes', value: currentUser.likes || 0 },
    { icon: Eye, label: 'Views', value: '1.2M' },
  ] : [];

  return (
    <div className={`fixed left-4 top-1/2 transform -translate-y-1/2 z-40 flex flex-col items-center space-y-4 p-4 rounded-3xl transition-all duration-300 ease-out ${
      sidebarCollapsed ? 'w-20' : 'w-64'
    } ${
      isDarkMode
        ? 'bg-gray-900'
        : 'bg-gray-50'
    }`}
      style={{
        boxShadow: isDarkMode
          ? `
            12px 12px 30px rgba(0, 0, 0, 0.5),
            -12px -12px 30px rgba(255, 255, 255, 0.02),
            inset 4px 4px 8px rgba(0, 0, 0, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.05)
          `
          : `
            12px 12px 30px rgba(0, 0, 0, 0.1),
            -12px -12px 30px rgba(255, 255, 255, 0.9),
            inset 4px 4px 8px rgba(0, 0, 0, 0.05),
            inset -4px -4px 8px rgba(255, 255, 255, 0.9)
          `
      }}
    >
      {/* Logo as Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`p-4 rounded-full transition-all duration-300 hover:scale-105 ${
          isDarkMode
            ? 'bg-gray-800 hover:bg-gray-700'
            : 'bg-white hover:bg-gray-50'
        }`}
        style={{
          boxShadow: isDarkMode
            ? `
              8px 8px 20px rgba(0, 0, 0, 0.4),
              -8px -8px 20px rgba(255, 255, 255, 0.02),
              inset 2px 2px 4px rgba(0, 0, 0, 0.2),
              inset -2px -2px 4px rgba(255, 255, 255, 0.05)
            `
            : `
              8px 8px 20px rgba(0, 0, 0, 0.1),
              -8px -8px 20px rgba(255, 255, 255, 0.8),
              inset 2px 2px 4px rgba(0, 0, 0, 0.05),
              inset -2px -2px 4px rgba(255, 255, 255, 0.9)
            `
        }}
      >
        <Zap className={`w-6 h-6 transition-all duration-300 ${
          isDarkMode
            ? 'text-purple-400'
            : 'text-indigo-600'
        }`} />
      </button>

      {/* User Stats (when expanded) */}
      {!sidebarCollapsed && currentUser && (
        <div className={`w-full p-4 rounded-2xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
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
        >
          <div className="text-center mb-3">
            <div className="w-12 h-12 rounded-full overflow-hidden mx-auto mb-2">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentUser.name}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {userStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                  <div className={`text-xs font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!sidebarCollapsed && (
        <div className="w-full space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                className={`w-full flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                }`}
                style={{
                  boxShadow: isDarkMode
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
                <Icon className={`w-5 h-5 ${action.color} transition-all duration-300`} />
                <span className={`font-medium transition-all duration-500 overflow-hidden whitespace-nowrap ${
                  sidebarCollapsed
                    ? 'w-0 opacity-0 ml-0'
                    : 'w-auto opacity-100 ml-3'
                } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Menu Items */}
      <div className={`${sidebarCollapsed ? 'space-y-4' : 'w-full space-y-2'}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenuItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveMenuItem(item.id)}
              className={`group relative transition-all duration-300 hover:scale-105 active:scale-95 flex items-center ${
                sidebarCollapsed
                  ? 'p-4 rounded-full justify-center'
                  : 'w-full space-x-3 p-3 rounded-2xl'
              } ${
                isDarkMode
                  ? isActive
                    ? 'bg-gray-700'
                    : 'bg-gray-800'
                  : isActive
                    ? 'bg-gray-200'
                    : 'bg-white'
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
              <Icon className={`${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} transition-all duration-300 ${
                isActive
                  ? isDarkMode
                    ? 'text-purple-400'
                    : 'text-indigo-600'
                  : isDarkMode
                    ? 'text-gray-400'
                    : 'text-gray-600'
              }`} />

              <span className={`font-medium transition-all duration-500 overflow-hidden whitespace-nowrap ${
                sidebarCollapsed
                  ? 'w-0 opacity-0 ml-0'
                  : 'w-auto opacity-100 ml-3'
              } ${
                isActive
                  ? isDarkMode
                    ? 'text-purple-400'
                    : 'text-indigo-600'
                  : isDarkMode
                    ? 'text-gray-300'
                    : 'text-gray-700'
              }`}>
                {item.label}
              </span>

              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className={`absolute left-full ml-4 px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 ${
                  isDarkMode
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-white text-gray-900 border border-gray-200 shadow-lg'
                }`}>
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
