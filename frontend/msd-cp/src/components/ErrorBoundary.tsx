import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  isDarkMode?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { isDarkMode = false } = this.props;
      
      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className={`max-w-md w-full p-8 rounded-3xl text-center ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}
            style={{
              boxShadow: isDarkMode
                ? `
                  20px 20px 60px rgba(0, 0, 0, 0.5),
                  -20px -20px 60px rgba(255, 255, 255, 0.02)
                `
                : `
                  20px 20px 60px rgba(0, 0, 0, 0.15),
                  -20px -20px 60px rgba(255, 255, 255, 0.8)
                `
            }}
          >
            {/* Error Icon */}
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-red-900/20' : 'bg-red-100'
            }`}>
              <AlertTriangle className={`w-10 h-10 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>

            {/* Error Message */}
            <h1 className={`text-2xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Oops! Something went wrong
            </h1>
            
            <p className={`text-sm mb-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              We encountered an unexpected error. Don't worry, our team has been notified and we're working on a fix.
            </p>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className={`mb-6 p-4 rounded-2xl text-left text-xs overflow-auto max-h-32 ${
                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}>
                <strong>Error:</strong> {this.state.error.message}
                {this.state.errorInfo && (
                  <div className="mt-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className={`w-full py-3 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isDarkMode
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <RefreshCw className="w-5 h-5 mr-2 inline" />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className={`w-full py-3 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                <Home className="w-5 h-5 mr-2 inline" />
                Go Home
              </button>
            </div>

            {/* Support Info */}
            <div className={`mt-6 pt-6 border-t text-xs ${
              isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'
            }`}>
              If the problem persists, please contact our support team at{' '}
              <a 
                href="mailto:support@mysillyDreams.com"
                className={`underline hover:no-underline ${
                  isDarkMode ? 'text-purple-400' : 'text-indigo-600'
                }`}
              >
                support@mysillyDreams.com
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
