'use client';

import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; reset: () => void; reload: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  title?: string;
  description?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Enterprise Production React Error Boundary
 * Captures rendering failures and Suspense crashes, reports them to Sentry,
 * and provides Try Again (Retry) and Reload Page controls.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    try {
      Sentry.captureReactException(error, errorInfo, {
        mechanism: {
          handled: true,
          type: 'react.error_boundary',
        },
      });
    } catch {
      // Rendering recovery must not depend on monitoring availability.
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, title, description } = this.props;

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback({
          error,
          reset: this.handleRetry,
          reload: this.handleReload,
        });
      }

      if (fallback) {
        return fallback;
      }

      return (
        <div
          dir="rtl"
          className="flex min-h-[360px] w-full flex-col items-center justify-center rounded-2xl border border-red-200 bg-gradient-to-b from-red-50/60 to-white p-8 text-center shadow-sm dark:border-red-900/40 dark:from-red-950/20 dark:to-slate-950"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            {title || 'عذراً، حدث خطأ غير متوقع في هذا القسم'}
          </h3>

          <p className="mb-6 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description || 'تم تسجيل تفاصيل الخطأ تلقائياً في نظام المراقبة للعمل على إصلاحه. يمكنك المحاولة مرة أخرى أو تحديث الصفحة.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>المحاولة مرة أخرى</span>
            </button>

            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              <span>تحديث الصفحة</span>
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
