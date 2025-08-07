import React, { useEffect } from 'react';
import LoginSignup from './components/LoginSignup';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import RightPanel from './components/RightPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { useStore } from './store/useStore';
import { useBackendHealth, useContentApi, useNotifications } from './hooks/useApi';

const App: React.FC = () => {
  const {
    isDarkMode,
    isLoggedIn,
    toggleDarkMode,
    login,
    sidebarCollapsed
  } = useStore();

  // Backend integration hooks
  const { isHealthy, lastChecked } = useBackendHealth();
  const { loading: contentLoading, error: contentError } = useContentApi();
  const { isConnected: notificationsConnected } = useNotifications();

  // Initialize sample data
  useEffect(() => {
    // Add some sample notifications
    const { addNotification } = useStore.getState();

    if (isLoggedIn) {
      addNotification({
        type: 'like',
        message: 'liked your video "Amazing Sunset"',
        userId: '1',
        userName: 'Sarah Johnson',
        userAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
        read: false,
        videoId: '1'
      });
    }
  }, [isLoggedIn]);

  const handleLogin = () => {
    const sampleUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      followers: 1250,
      following: 890,
      likes: 15600,
      videos: 42,
      verified: true
    };
    login(sampleUser);
  };

  return (
    <ErrorBoundary isDarkMode={isDarkMode}>
      <div className={`h-screen overflow-hidden transition-all duration-500 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        {!isLoggedIn ? (
          <LoginSignup isDarkMode={isDarkMode} onLogin={handleLogin} />
        ) : (
          <>
            <Navbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            <Sidebar isDarkMode={isDarkMode} />

            <div className={`flex h-full transition-all duration-500 relative ${
              sidebarCollapsed ? 'pl-32' : 'pl-80'
            }`} style={{ height: 'calc(100vh - 64px - 60px - 32px)', zIndex: 35 }}>
              {/* Unified Background Container */}
              <div className={`flex w-full h-full mt-4 mr-4 mb-8 ml-4 rounded-3xl overflow-hidden transition-all duration-500 ${
                isDarkMode
                  ? 'bg-gray-900'
                  : 'bg-white border border-gray-200'
              }`}
                style={{
                  boxShadow: isDarkMode
                    ? `
                      20px 20px 60px rgba(0, 0, 0, 0.5),
                      -20px -20px 60px rgba(255, 255, 255, 0.02),
                      inset 8px 8px 20px rgba(0, 0, 0, 0.3),
                      inset -8px -8px 20px rgba(255, 255, 255, 0.05)
                    `
                    : `
                      20px 20px 60px rgba(0, 0, 0, 0.1),
                      -20px -20px 60px rgba(255, 255, 255, 0.9),
                      inset 8px 8px 20px rgba(0, 0, 0, 0.05),
                      inset -8px -8px 20px rgba(255, 255, 255, 0.9)
                    `
                }}
              >
                <div className="max-w-[480px] max-h-[854px] aspect-[9/16] p-4 h-full overflow-hidden">
                  <ErrorBoundary isDarkMode={isDarkMode}>
                    <VideoPlayer isDarkMode={isDarkMode} />
                  </ErrorBoundary>
                </div>
                <div className="flex-1 p-4 min-w-0 h-full overflow-hidden">
                  <ErrorBoundary isDarkMode={isDarkMode}>
                    <RightPanel isDarkMode={isDarkMode} />
                  </ErrorBoundary>
                </div>
              </div>
            </div>

            {/* Professional Footer */}
            <footer className={`fixed bottom-0 left-0 right-0 h-[60px] flex items-center justify-between px-6 transition-all duration-500 ${
              isDarkMode
                ? 'bg-gray-900/95 backdrop-blur-sm border-t border-gray-800/50'
                : 'bg-gray-50/95 backdrop-blur-sm border-t border-gray-200/50'
            }`}
              style={{
                zIndex: 30,
                boxShadow: isDarkMode
                  ? `
                    0 -4px 20px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05)
                  `
                  : `
                    0 -4px 20px rgba(0, 0, 0, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.8)
                  `
              }}
            >
              {/* Fun Line - Left Side */}
              <div className={`text-sm font-medium transition-all duration-500 flex items-center ${
                isDarkMode
                  ? 'text-gray-300 hover:text-gray-200'
                  : 'text-gray-700 hover:text-gray-800'
              }`}>
                <span className="opacity-90 font-medium">Crafted with</span>
                <span className={`mx-2 text-lg animate-pulse hover:scale-110 transition-transform duration-300 cursor-pointer`}>
                  ❤️
                </span>
                <span className="opacity-90 font-medium">in</span>
                <span className={`ml-2 font-bold text-lg bg-gradient-to-r ${
                  isDarkMode
                    ? 'from-orange-400 to-orange-300 bg-clip-text text-transparent'
                    : 'from-orange-600 to-orange-500 bg-clip-text text-transparent'
                }`}>
                  India
                </span>
                <span className={`ml-2 text-xl hover:scale-125 transition-transform duration-300 cursor-pointer filter drop-shadow-sm`}>
                  🇮🇳
                </span>
              </div>

              {/* Copyright - Center */}
              <div className={`text-sm font-medium transition-all duration-500 tracking-wide ${
                isDarkMode
                  ? 'text-gray-300 hover:text-gray-200'
                  : 'text-gray-700 hover:text-gray-800'
              }`}>
                <span className="opacity-90">© 2025</span>
                <span className={`mx-2 font-semibold ${
                  isDarkMode ? 'text-purple-400' : 'text-indigo-600'
                }`}>
                  MySillyDreams Private Limited
                </span>
                <span className="opacity-90">• All rights reserved.</span>
              </div>

              {/* App Info - Right Side */}
              <div className="flex items-center space-x-4">
                {/* App Version */}
                <div className={`text-xs font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <span className="opacity-75">v1.0.0</span>
                </div>

                {/* Backend Status */}
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  <div className="relative">
                    <div className={`w-2 h-2 rounded-full ${
                      isHealthy === true ? 'bg-green-500 animate-pulse' :
                      isHealthy === false ? 'bg-red-500 animate-pulse' :
                      'bg-yellow-500 animate-pulse'
                    }`}></div>
                    {isHealthy === true && (
                      <>
                        <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-green-300 rounded-full animate-pulse opacity-50"
                             style={{
                               boxShadow: '0 0 6px rgba(34, 197, 94, 0.6), 0 0 12px rgba(34, 197, 94, 0.4)'
                             }}>
                        </div>
                      </>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {isHealthy === true ? 'Backend Online' :
                     isHealthy === false ? 'Backend Offline' :
                     'Checking...'}
                  </span>
                </div>

                {/* Notifications Status */}
                {isLoggedIn && (
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      notificationsConnected ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {notificationsConnected ? 'Live Updates' : 'Offline'}
                    </span>
                  </div>
                )}
              </div>
            </footer>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;