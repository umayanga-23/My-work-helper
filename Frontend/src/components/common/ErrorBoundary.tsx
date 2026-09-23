import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AIU Workspace ErrorBoundary caught an unhandled render error:', error, errorInfo);
  }

  private handleAutoRefresh = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0E1C15] border border-rose-200 dark:border-rose-900/40 rounded-2xl shadow-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#17211B] dark:text-[#EAF7EF]">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] leading-relaxed">
                A display error occurred while updating the view. No data was lost. Click below to auto-refresh immediately.
              </p>
              {this.state.error?.message && (
                <div className="p-2 rounded-lg bg-rose-500/5 text-rose-600 dark:text-rose-400 font-mono text-[11px] break-words text-left">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#DCE9E1] dark:border-[#20372B] text-[#4D5E53] dark:text-[#9BB5A5] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] transition-all cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={this.handleAutoRefresh}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#237A57] hover:bg-[#5FBF8F] text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Auto Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
