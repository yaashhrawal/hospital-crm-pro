import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo | null }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('🚨 Error info:', errorInfo);
    console.error('🚨 Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} errorInfo={this.state.errorInfo} />;
      }

      return (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fee2e2', 
          border: '2px solid #dc2626',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#dc2626', fontSize: '18px', fontWeight: 'bold' }}>
            🚨 Component Error Detected
          </h2>
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ color: '#991b1b', fontSize: '16px', fontWeight: '600' }}>Error Details:</h3>
            <p style={{ color: '#7f1d1d', fontSize: '14px', fontFamily: 'monospace', backgroundColor: '#fef2f2', padding: '8px', borderRadius: '4px' }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
          
          {this.state.error?.stack && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ color: '#991b1b', fontSize: '16px', fontWeight: '600' }}>Stack Trace:</h3>
              <pre style={{ 
                color: '#7f1d1d', 
                fontSize: '12px', 
                backgroundColor: '#fef2f2', 
                padding: '8px', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error.stack}
              </pre>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Try Again
            </button>
          </div>

          <div style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
            <p><strong>Troubleshooting:</strong></p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Check browser console for more details</li>
              <li>This might be a database relationship error</li>
              <li>Recent database changes may need schema refresh</li>
            </ul>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;