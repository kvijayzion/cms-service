import React from 'react';
import { CheckCircle, XCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { useBackendHealth } from '../hooks/useApi';

interface BackendStatusProps {
  isDarkMode: boolean;
}

const BackendStatus: React.FC<BackendStatusProps> = ({ isDarkMode }) => {
  const { isHealthy, lastChecked } = useBackendHealth();

  const getStatusIcon = () => {
    if (isHealthy === true) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (isHealthy === false) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else {
      return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusText = () => {
    if (isHealthy === true) {
      return 'Backend Online';
    } else if (isHealthy === false) {
      return 'Backend Offline';
    } else {
      return 'Checking...';
    }
  };

  const getStatusColor = () => {
    if (isHealthy === true) {
      return 'text-green-600';
    } else if (isHealthy === false) {
      return 'text-red-600';
    } else {
      return 'text-yellow-600';
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          Backend Status
        </h3>
        {isHealthy === true ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {lastChecked && (
          <div className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}

        {isHealthy === true && (
          <div className={`text-xs ${
            isDarkMode ? 'text-green-400' : 'text-green-600'
          }`}>
            All services operational
          </div>
        )}

        {isHealthy === false && (
          <div className={`text-xs ${
            isDarkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            Connection failed
          </div>
        )}
      </div>

      {/* Status indicator bar */}
      <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            isHealthy === true 
              ? 'bg-green-500 w-full' 
              : isHealthy === false 
                ? 'bg-red-500 w-full' 
                : 'bg-yellow-500 w-1/2 animate-pulse'
          }`}
        />
      </div>
    </div>
  );
};

export default BackendStatus;
