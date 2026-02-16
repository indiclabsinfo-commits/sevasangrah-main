import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
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
    console.error('🔥 Global Error Boundary caught:', error);
    console.error('🔥 Error stack:', error.stack);
    console.error('🔥 Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to error tracking service (if available)
    if (typeof window !== 'undefined') {
      try {
        // You could send to Sentry, LogRocket, etc.
        console.log('📋 Error details:', {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      } catch (e) {
        console.warn('Failed to log error:', e);
      }
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Something went wrong
              </h2>
              
              <p className="text-gray-600 mb-4">
                The application encountered an error. This is usually a temporary issue.
              </p>

              {this.state.error && (
                <div className="mb-4 p-3 bg-gray-100 rounded text-left">
                  <p className="text-sm font-medium text-gray-700 mb-1">Error:</p>
                  <p className="text-sm text-red-600 font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.error.message.includes('filter') && (
                    <p className="text-xs text-gray-500 mt-1">
                      This is often caused by missing data. Try refreshing.
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRefresh}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Refresh Page
                </button>
                
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Try Again
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  If the problem persists, please contact support.
                </p>
                <button
                  onClick={() => {
                    console.log('Error details:', {
                      error: this.state.error,
                      errorInfo: this.state.errorInfo
                    });
                    alert('Error details logged to console (F12 → Console)');
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  View Technical Details
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;