import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl">
            <p className="text-xs font-black uppercase tracking-widest text-red-500">Application error</p>
            <h1 className="mt-3 text-2xl font-black text-slate-800">This section could not be displayed</h1>
            <p className="mt-3 text-sm text-slate-500">
              Reload the section to continue. Your saved map analyses remain stored in this browser.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
