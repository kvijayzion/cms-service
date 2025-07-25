import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';

interface LoginSignupProps {
  isDarkMode: boolean;
  onLogin: () => void;
}

const LoginSignup: React.FC<LoginSignupProps> = ({ isDarkMode, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showToast, setShowToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });

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

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    let score = 0;
    let feedback = '';

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        feedback = 'Very weak';
        break;
      case 2:
        feedback = 'Weak';
        break;
      case 3:
        feedback = 'Fair';
        break;
      case 4:
        feedback = 'Good';
        break;
      case 5:
        feedback = 'Strong';
        break;
    }

    return { score, feedback };
  };

  const validateForm = () => {
    const errors = { name: '', email: '', password: '' };
    let isValid = true;

    if (!isLogin && !formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (!isLogin && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }

    // Update password strength
    if (name === 'password') {
      setPasswordStrength(validatePassword(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setShowToast({
        type: 'error',
        message: 'Please fix the errors above'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setShowToast({
        type: 'success',
        message: isLogin ? 'Welcome back!' : 'Account created successfully!'
      });

      setTimeout(() => {
        onLogin();
      }, 1000);
    } catch (error) {
      setShowToast({
        type: 'error',
        message: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
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
        {/* Header */}
        <div className="text-center mb-8">
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
              {isLogin ? 'Welcome back!' : 'Join the community'}
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isLogin
                ? 'Sign in to continue your creative journey'
                : 'Create, share, and discover amazing content'
              }
            </p>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div 
          className={`flex p-1 rounded-2xl mb-8 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}
          style={getNeomorphicStyle(true)}
        >
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
              isLogin
                ? isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-white text-gray-900'
                : isDarkMode
                  ? 'text-gray-400'
                  : 'text-gray-600'
            }`}
            style={isLogin ? getNeomorphicStyle() : {}}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
              !isLogin
                ? isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-white text-gray-900'
                : isDarkMode
                  ? 'text-gray-400'
                  : 'text-gray-600'
            }`}
            style={!isLogin ? getNeomorphicStyle() : {}}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="relative">
              <div className="relative">
                <div
                  className={`flex items-center rounded-2xl p-4 transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  } ${focusedField === 'name' ? 'ring-2 ring-purple-400 ring-opacity-50' : ''} ${
                    formErrors.name ? 'ring-2 ring-red-400 ring-opacity-50' : ''
                  }`}
                  style={getNeomorphicStyle(true)}
                >
                  <User className={`w-5 h-5 mr-3 transition-colors duration-300 ${
                    focusedField === 'name'
                      ? isDarkMode ? 'text-purple-400' : 'text-indigo-600'
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className={`flex-1 bg-transparent outline-none transition-all duration-300 ${
                      isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>

                {/* Floating Label */}
                <label className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                  formData.name || focusedField === 'name'
                    ? `-top-2 text-xs px-2 ${
                        isDarkMode ? 'bg-gray-800 text-purple-400' : 'bg-white text-indigo-600'
                      }`
                    : `top-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`
                }`}>
                  Full Name
                </label>
              </div>

              {formErrors.name && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  {formErrors.name}
                </p>
              )}
            </div>
          )}

          <div className="relative">
            <div className="relative">
              <div
                className={`flex items-center rounded-2xl p-4 transition-all duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                } ${focusedField === 'email' ? 'ring-2 ring-purple-400 ring-opacity-50' : ''} ${
                  formErrors.email ? 'ring-2 ring-red-400 ring-opacity-50' : ''
                }`}
                style={getNeomorphicStyle(true)}
              >
                <Mail className={`w-5 h-5 mr-3 transition-colors duration-300 ${
                  focusedField === 'email'
                    ? isDarkMode ? 'text-purple-400' : 'text-indigo-600'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={`flex-1 bg-transparent outline-none transition-all duration-300 ${
                    isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Floating Label */}
              <label className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                formData.email || focusedField === 'email'
                  ? `-top-2 text-xs px-2 ${
                      isDarkMode ? 'bg-gray-800 text-purple-400' : 'bg-white text-indigo-600'
                    }`
                  : `top-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`
              }`}>
                Email Address
              </label>
            </div>

            {formErrors.email && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                {formErrors.email}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="relative">
              <div
                className={`flex items-center rounded-2xl p-4 transition-all duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                } ${focusedField === 'password' ? 'ring-2 ring-purple-400 ring-opacity-50' : ''} ${
                  formErrors.password ? 'ring-2 ring-red-400 ring-opacity-50' : ''
                }`}
                style={getNeomorphicStyle(true)}
              >
                <Lock className={`w-5 h-5 mr-3 transition-colors duration-300 ${
                  focusedField === 'password'
                    ? isDarkMode ? 'text-purple-400' : 'text-indigo-600'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`flex-1 bg-transparent outline-none transition-all duration-300 ${
                    isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`ml-3 transition-colors duration-300 hover:scale-110 ${
                    isDarkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-500 hover:text-indigo-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Floating Label */}
              <label className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                formData.password || focusedField === 'password'
                  ? `-top-2 text-xs px-2 ${
                      isDarkMode ? 'bg-gray-800 text-purple-400' : 'bg-white text-indigo-600'
                    }`
                  : `top-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`
              }`}>
                Password
              </label>
            </div>

            {/* Password Strength Indicator */}
            {!isLogin && formData.password && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Password Strength
                  </span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.score <= 2
                      ? 'text-red-400'
                      : passwordStrength.score === 3
                        ? 'text-yellow-400'
                        : 'text-green-400'
                  }`}>
                    {passwordStrength.feedback}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i < passwordStrength.score
                          ? passwordStrength.score <= 2
                            ? 'bg-red-400'
                            : passwordStrength.score === 3
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                          : isDarkMode
                            ? 'bg-gray-600'
                            : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {formErrors.password && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                {formErrors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          {isLogin && (
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-lg transition-all duration-300 ${
                      rememberMe
                        ? isDarkMode
                          ? 'bg-purple-600'
                          : 'bg-indigo-600'
                        : isDarkMode
                          ? 'bg-gray-600'
                          : 'bg-gray-200'
                    }`}
                    style={{
                      boxShadow: rememberMe
                        ? isDarkMode
                          ? 'inset 2px 2px 6px rgba(0, 0, 0, 0.4), inset -2px -2px 6px rgba(255, 255, 255, 0.02)'
                          : 'inset 2px 2px 6px rgba(0, 0, 0, 0.1), inset -2px -2px 6px rgba(255, 255, 255, 0.9)'
                        : isDarkMode
                          ? '2px 2px 6px rgba(0, 0, 0, 0.4), -2px -2px 6px rgba(255, 255, 255, 0.02)'
                          : '2px 2px 6px rgba(0, 0, 0, 0.1), -2px -2px 6px rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    {rememberMe && (
                      <CheckCircle className="w-3 h-3 text-white absolute top-1 left-1" />
                    )}
                  </div>
                </div>
                <span className={`ml-3 text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className={`text-sm font-medium transition-colors duration-300 hover:underline ${
                  isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-indigo-600 hover:text-indigo-500'
                }`}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600'
            }`}
            style={getNeomorphicStyle()}
          >
            <span className="flex items-center justify-center">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className={`absolute inset-0 flex items-center ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`}>
              <div className={`w-full border-t ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${
                isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
              }`}>
                Or continue with
              </span>
            </div>
          </div>

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
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFormErrors({ name: '', email: '', password: '' });
                setFormData({ name: '', email: '', password: '' });
                setPasswordStrength({ score: 0, feedback: '' });
              }}
              className={`font-medium transition-all duration-300 hover:underline hover:scale-105 ${
                isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-500'
              }`}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Terms and Privacy */}
          <div className="mt-4 text-xs text-center space-y-2">
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