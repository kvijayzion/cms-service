import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Sparkles, Moon, Sun } from 'lucide-react';
import { useStore } from '../store/useStore';

interface LoginSignupProps {
  isDarkMode: boolean;
  onLogin: () => void;
}

const LoginSignup: React.FC<LoginSignupProps> = ({ isDarkMode, onLogin }) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showToast, setShowToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [logoAnimated, setLogoAnimated] = useState(false);

  const { toggleDarkMode } = useStore();

  // Logo animation effect
  useEffect(() => {
    const timer = setTimeout(() => setLogoAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Toast auto-hide
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const getNeomorphicStyle = (pressed = false, size = 'normal') => {
    const baseStyle = {
      transition: 'all 0.3s ease',
    };

    if (size === 'large') {
      return {
        ...baseStyle,
        boxShadow: isDarkMode
          ? pressed
            ? 'inset 8px 8px 20px rgba(0, 0, 0, 0.5), inset -8px -8px 20px rgba(255, 255, 255, 0.02)'
            : '12px 12px 30px rgba(0, 0, 0, 0.4), -12px -12px 30px rgba(255, 255, 255, 0.02)'
          : pressed
            ? 'inset 8px 8px 20px rgba(0, 0, 0, 0.1), inset -8px -8px 20px rgba(255, 255, 255, 0.9)'
            : '12px 12px 30px rgba(0, 0, 0, 0.1), -12px -12px 30px rgba(255, 255, 255, 0.8)'
      };
    }

    return {
      ...baseStyle,
      boxShadow: isDarkMode
        ? pressed
          ? 'inset 4px 4px 12px rgba(0, 0, 0, 0.5), inset -4px -4px 12px rgba(255, 255, 255, 0.02)'
          : '6px 6px 16px rgba(0, 0, 0, 0.4), -6px -6px 16px rgba(255, 255, 255, 0.02)'
        : pressed
          ? 'inset 4px 4px 12px rgba(0, 0, 0, 0.1), inset -4px -4px 12px rgba(255, 255, 255, 0.9)'
          : '6px 6px 16px rgba(0, 0, 0, 0.1), -6px -6px 16px rgba(255, 255, 255, 0.8)'
    };
  };





  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      // Simulate Google OAuth
      await new Promise(resolve => setTimeout(resolve, 1500));

      setShowToast({
        type: 'success',
        message: 'Successfully signed in with Google!'
      });

      setTimeout(() => {
        onLogin();
      }, 1000);
    } catch (error) {
      setShowToast({
        type: 'error',
        message: 'Google sign-in failed. Please try again.'
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-500 relative overflow-hidden ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Background */}
        <div className={`absolute inset-0 opacity-30 ${
          isDarkMode
            ? 'bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-indigo-900/20'
            : 'bg-gradient-to-br from-indigo-100/50 via-purple-100/50 to-pink-100/50'
        }`} />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full opacity-20 animate-pulse ${
              isDarkMode ? 'bg-purple-400' : 'bg-indigo-400'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 3 + 2}s`
            }}
          />
        ))}

        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${isDarkMode ? 'white' : 'black'} 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}
        />
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-lg transform transition-all duration-300 ${
          showToast.type === 'success'
            ? isDarkMode
              ? 'bg-green-800 text-green-100'
              : 'bg-green-100 text-green-800'
            : isDarkMode
              ? 'bg-red-800 text-red-100'
              : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {showToast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{showToast.message}</span>
          </div>
        </div>
      )}

      <div
        className={`w-full max-w-md p-8 rounded-3xl transition-all duration-500 relative z-10 ${
          isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'
        }`}
        style={getNeomorphicStyle(false, 'large')}
      >
        {/* Theme Toggle Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}
            style={getNeomorphicStyle()}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-yellow-400 transition-all duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600 transition-all duration-300" />
            )}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className={`flex items-center justify-center mb-4 transform transition-all duration-1000 ${
            logoAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <div className="relative">
              <Sparkles className={`w-8 h-8 mr-2 ${
                isDarkMode ? 'text-purple-400' : 'text-indigo-600'
              } animate-pulse`} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-ping" />
            </div>
            <h1 className={`text-3xl font-bold bg-clip-text text-transparent ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'
            }`}>
              MySillyDreams
            </h1>
          </div>

          <div className={`transform transition-all duration-1000 delay-300 ${
            logoAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <p className={`text-lg font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Welcome to MySillyDreams
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Sign in to continue your creative journey
            </p>
          </div>
        </div>

        {/* Google Authentication */}
        <div className="space-y-6">



          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className={`group w-full py-4 rounded-2xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3 relative overflow-hidden ${
              isDarkMode
                ? 'bg-gray-700 text-white border border-gray-600 hover:bg-gray-600'
                : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
            }`}
            style={getNeomorphicStyle()}
          >
            {/* Hover Effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${
              isDarkMode ? 'bg-white' : 'bg-gray-900'
            }`} />

            {isGoogleLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="relative z-10">Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          {/* Terms and Privacy */}
          <div className="text-xs text-center space-y-2">
            <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              By continuing, you agree to our{' '}
              <button
                onClick={() => window.open('/terms', '_blank')}
                className={`underline hover:no-underline transition-all duration-300 ${
                  isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-500'
                }`}
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                onClick={() => window.open('/privacy', '_blank')}
                className={`underline hover:no-underline transition-all duration-300 ${
                  isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-500'
                }`}
              >
                Privacy Policy
              </button>
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.open('/terms', '_blank')}
                className={`px-3 py-1 rounded-lg text-xs transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📋 Terms
              </button>
              <button
                onClick={() => window.open('/privacy', '_blank')}
                className={`px-3 py-1 rounded-lg text-xs transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🔒 Privacy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;