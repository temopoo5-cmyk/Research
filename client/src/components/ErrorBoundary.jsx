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
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-emerald-100 shadow-xl shadow-emerald-100/40 p-8 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent mb-2">Oops!</div>
            <p className="text-muted-foreground text-sm mb-6">Something went wrong while loading this page.</p>
            <pre className="text-left text-xs bg-red-50 border border-red-100 rounded-lg p-4 mb-6 text-red-700 overflow-auto max-h-40 whitespace-pre-wrap">{String(this.state.error.message || this.state.error)}</pre>
            <button
              onClick={this.handleReload}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-2.5 font-medium hover:opacity-90 transition-opacity"
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