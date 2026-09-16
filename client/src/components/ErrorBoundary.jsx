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
        <div className="min-h-screen bg-[#EAF7F0] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#DCEFE4] rounded-2xl border border-[#4F6D7A]/20 shadow-xl shadow-[#4F6D7A]/15 p-8 text-center">
            <div className="text-4xl font-bold text-[#23CE6B] mb-2">Oops!</div>
            <p className="text-muted-foreground text-sm mb-6">Something went wrong while loading this page.</p>
            <pre className="text-left text-xs bg-red-50 border border-red-100 rounded-lg p-4 mb-6 text-red-700 overflow-auto max-h-40 whitespace-pre-wrap">{String(this.state.error.message || this.state.error)}</pre>
            <button
              onClick={this.handleReload}
              className="w-full rounded-lg bg-[#23CE6B] text-[#0A122A] py-2.5 font-semibold hover:bg-[#1CB85C] transition-colors"
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