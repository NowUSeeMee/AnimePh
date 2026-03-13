import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-anime-bg flex items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 border-anime-primary/20">
            <div className="w-16 h-16 bg-anime-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertTriangle className="text-3xl text-anime-primary animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-white mb-4">Oops! Something went wrong</h1>
            <p className="text-anime-muted text-sm mb-8 leading-relaxed">
              We encountered an unexpected error. Don't worry, it's not your fault. 
              Try refreshing the page or head back home.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold active:scale-95"
              >
                <FiRefreshCw /> Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl text-sm font-bold border border-white/5 active:scale-95 transition-all"
              >
                Back Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-black/40 rounded-xl text-left border border-white/5">
                <p className="text-[10px] font-mono text-anime-primary uppercase mb-2 tracking-widest">Error Details</p>
                <p className="text-xs font-mono text-anime-muted line-clamp-3">{this.state.error?.toString()}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
