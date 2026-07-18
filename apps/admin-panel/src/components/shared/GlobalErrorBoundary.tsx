import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCcw } from 'lucide-react';
import { Button } from '@alrehla/ui/button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertOctagon size={40} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">عذراً، حدث خطأ غير متوقع</h1>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            واجهنا مشكلة تقنية أثناء عرض الصفحة. فريقنا يعمل على إصلاحها. يرجى محاولة تحديث الصفحة.
                        </p>
                        <div className="space-y-3">
                            <Button onClick={this.handleReload} className="w-full gap-2" size="lg">
                                <RefreshCcw size={18} />
                                تحديث الصفحة
                            </Button>
                            <details className="text-xs text-left mt-4 text-gray-400 cursor-pointer">
                                <summary>التفاصيل التقنية</summary>
                                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                                    {this.state.error?.toString()}
                                </pre>
                            </details>
                        </div>
                    </div>
                </div>
            );
        }

        return (this as any).props.children;
    }
}

export default GlobalErrorBoundary;