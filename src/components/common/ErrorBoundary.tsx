/**
 * Global error boundary component
 * Handles React errors gracefully and provides fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substring(2, 9)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (in development) or error reporting service (in production)
    const errorDetails = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary Caught an Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Details:', errorDetails);
      console.groupEnd();
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you could send this to an error reporting service
    // Example: ErrorReportingService.report(errorDetails);
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: ''
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack || 'No stack trace',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Create a downloadable error report
    const reportContent = JSON.stringify(errorReport, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-report-${this.state.errorId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-red-500 text-4xl">⚠️</div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                An unexpected error occurred in the patient record system.
              </p>
            </div>

            <Card padding="lg" className="mt-8">
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error Details
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p className="font-mono text-xs bg-red-100 p-2 rounded border">
                          {this.state.error?.message || 'Unknown error occurred'}
                        </p>
                        <p className="mt-2 text-xs text-red-600">
                          Error ID: {this.state.errorId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={this.handleRetry}
                    variant="primary"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    🔄 Try Again
                  </Button>
                  
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    🔄 Reload Page
                  </Button>

                  <Button
                    onClick={this.handleReportError}
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    📄 Download Error Report
                  </Button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  <p>If this error persists, please contact the IT support team.</p>
                  <p className="mt-1">Include the Error ID: <code className="bg-gray-100 px-1 rounded">{this.state.errorId}</code></p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for functional components to handle errors gracefully
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    
    // Log error details
    console.error('Component Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error; // This will be caught by the ErrorBoundary
    }
  }, [error]);

  return { handleError, resetError };
};

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));
};

export default ErrorBoundary;