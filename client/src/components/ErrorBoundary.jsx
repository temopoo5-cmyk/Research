import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full glass rounded-2xl p-8 text-center">
            <div className="font-display text-4xl font-semibold text-[#12854A] mb-2">Oops!</div>
            <p className="text-muted-foreground text-sm mb-6">Something went wrong while loading this page.</p>
            <pre className="text-left font-mono text-xs bg-red-50 border border-red-100 rounded-lg p-4 mb-6 text-red-700 overflow-auto max-h-40 whitespace-pre-wrap">{String(this.state.error.message || this.state.error)}</pre>
            <button
              onClick={this.handleReload}
              className="w-full rounded-full gradient-btn py-2.5 font-semibold"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}