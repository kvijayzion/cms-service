import React, { useState } from 'react';
import { Play, RefreshCw, CheckCircle, XCircle, Clock, Code, Database } from 'lucide-react';

interface ApiTestPanelProps {
  isDarkMode: boolean;
}

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  statusCode?: number;
  responseTime?: number;
  data?: any;
  error?: string;
}

const ApiTestPanel: React.FC<ApiTestPanelProps> = ({ isDarkMode }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const apiEndpoints = [
    { name: 'Health Check', url: '/api/health' },
    { name: 'All Contents', url: '/api/contents' },
    { name: 'Content by ID', url: '/api/contents/1' },
    { name: 'Search Contents', url: '/api/contents/search?q=sample' },
    { name: 'Trending Contents', url: '/api/contents/trending' },
  ];

  const runApiTests = async () => {
    setIsRunning(true);
    setResults([]);

    for (const endpoint of apiEndpoints) {
      const testResult: TestResult = {
        endpoint: endpoint.name,
        status: 'pending'
      };

      setResults(prev => [...prev, testResult]);

      try {
        const startTime = Date.now();
        const response = await fetch(endpoint.url);
        const endTime = Date.now();
        
        const data = await response.json();
        
        testResult.status = response.ok ? 'success' : 'error';
        testResult.statusCode = response.status;
        testResult.responseTime = endTime - startTime;
        testResult.data = data;
        
        if (!response.ok) {
          testResult.error = `HTTP ${response.status}`;
        }
      } catch (error) {
        testResult.status = 'error';
        testResult.error = error instanceof Error ? error.message : 'Unknown error';
      }

      setResults(prev => 
        prev.map(r => r.endpoint === endpoint.name ? testResult : r)
      );

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Database className={`w-5 h-5 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`} />
          <h3 className={`text-sm font-semibold ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            API Test Panel
          </h3>
        </div>
        
        <button
          onClick={runApiTests}
          disabled={isRunning}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isRunning ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          <span>{isRunning ? 'Testing...' : 'Run Tests'}</span>
        </button>
      </div>

      <div className="space-y-2">
        {results.length === 0 && !isRunning && (
          <div className={`text-center py-4 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Click "Run Tests" to test API endpoints
          </div>
        )}

        {results.map((result, index) => (
          <div
            key={index}
            className={`p-3 rounded-md border transition-all duration-200 ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(result.status)}
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {result.endpoint}
                </span>
              </div>
              
              {result.statusCode && (
                <span className={`text-xs px-2 py-1 rounded ${
                  result.status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.statusCode}
                </span>
              )}
            </div>

            {result.responseTime && (
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Response time: {result.responseTime}ms
              </div>
            )}

            {result.error && (
              <div className="text-xs text-red-500 mt-1">
                Error: {result.error}
              </div>
            )}

            {result.data && result.status === 'success' && (
              <div className="mt-2">
                <details className="text-xs">
                  <summary className={`cursor-pointer ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Code className="w-3 h-3 inline mr-1" />
                    Response Data
                  </summary>
                  <pre className={`mt-1 p-2 rounded text-xs overflow-x-auto ${
                    isDarkMode
                      ? 'bg-gray-800 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between text-xs">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Total: {results.length}
            </span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Success: {results.filter(r => r.status === 'success').length} | 
              Failed: {results.filter(r => r.status === 'error').length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTestPanel;
