'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk')) {
      if (typeof window !== 'undefined') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => registration.unregister());
          });
        }
        setTimeout(() => { window.location.reload(); }, 1000);
      }
      return;
    }
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.name === 'ChunkLoadError' ||
        this.state.error?.message?.includes('Loading chunk');

      if (isChunkError) {
        return (
          <div className="eb-center">
            <div className="eb-box eb-box--chunk">
              <div className="eb-emoji">🔄</div>
              <h2 className="eb-title--chunk">Loading Update...</h2>
              <p className="eb-text">
                The application is updating. This page will reload automatically in a moment.
              </p>
              <button onClick={this.handleReload} className="eb-btn eb-btn--primary">
                Reload Now
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="eb-center">
          <div className="eb-box eb-box--error">
            <div className="eb-emoji">⚠️</div>
            <h2 className="eb-title--error">Something went wrong</h2>
            <p className="eb-text">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="eb-btn-row">
              <button onClick={this.handleRetry} className="eb-btn eb-btn--primary">
                Try Again
              </button>
              <button onClick={this.handleReload} className="eb-btn eb-btn--secondary">
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="eb-details">
                <summary className="eb-summary">Error Details (Development)</summary>
                <pre className="eb-pre">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
