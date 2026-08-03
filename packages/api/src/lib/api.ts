import {
  captureApiError,
  shouldIgnoreError,
  startSpan,
  sanitizeData,
} from '@alrehla/utils';

// Use relative path for Vercel deployment.
const API_BASE_URL = '/api';

export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

const translateErrorMessage = (status: number, originalMessage: string): string => {
    if (status === 401) return 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.';
    if (status === 403) return 'عذراً، ليس لديك صلاحية للقيام بهذا الإجراء.';
    if (status === 404) return 'عذراً، البيانات المطلوبة غير موجودة.';
    if (status === 429) return 'تم تجاوز حد الطلبات المسموح به، يرجى الانتظار قليلاً.';
    if (status >= 500) return 'واجهنا مشكلة في الخادم، يرجى المحاولة لاحقاً.';

    if (originalMessage.includes('Network request failed')) return 'تأكد من اتصالك بالإنترنت.';
    if (originalMessage.includes('duplicate key')) return 'هذه البيانات مسجلة مسبقاً (مكررة).';
    if (originalMessage.includes('violates foreign key')) return 'لا يمكن حذف هذا العنصر لارتباطه ببيانات أخرى.';

    return originalMessage || 'حدث خطأ غير متوقع.';
};
const makeRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const method = (options.method || 'GET').toUpperCase();
    const url = API_BASE_URL + endpoint;
    const startTime = Date.now();

    return startSpan(
      {
        name: `HTTP ${method} ${endpoint}`,
        op: 'http.client',
        attributes: {
          'http.method': method,
          'http.url': url,
        },
      },
      async (span) => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (options.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
                if (key.toLowerCase() !== 'content-type' && key.toLowerCase() !== 'accept') {
                    headers[key] = value;
                }
            });
        }

        let response: Response;

        try {
            response = await fetch(url, {
                ...options,
                headers,
                credentials: options.credentials || 'same-origin',
            });
        } catch (networkError) {
            const durationMs = Date.now() - startTime;
            if (span && typeof span.setStatus === 'function') {
              span.setStatus({ code: 2, message: 'network_error' });
            }
            if (!shouldIgnoreError(networkError)) {
              captureApiError(networkError, {
                url,
                method,
                statusCode: 0,
                durationMs,
                metadata: { error: 'Network request failed' },
              });
            }
            throw new ApiError('حدث خطأ في الاتصال بالشبكة. يرجى التحقق من الإنترنت.', 0);
        }

        const durationMs = Date.now() - startTime;

        if (span && typeof span.setAttribute === 'function') {
          span.setAttribute('http.status_code', response.status);
        }

        if (!response.ok) {
            if (span && typeof span.setStatus === 'function') {
              span.setStatus({ code: 2, message: `http_${response.status}` });
            }

            if (response.status === 401 && typeof window !== 'undefined') {
                const currentPath = window.location.pathname + window.location.search;
                if (!currentPath.includes('/login')) {
                    window.location.href = '/login?redirect_url=' + encodeURIComponent(currentPath);
                }
            }

            let rawMessage = 'فشل الطلب: ' + response.status;
            let errorData = null;

            try {
                const textBody = await response.text();
                try {
                    const jsonBody = JSON.parse(textBody);
                    rawMessage = jsonBody.message || jsonBody.error || rawMessage;
                    errorData = jsonBody;
                } catch {
                    if (textBody.length < 200) rawMessage = textBody;
                }
            } catch {}

            const friendlyMessage = translateErrorMessage(response.status, rawMessage);
            const apiError = new ApiError(friendlyMessage, response.status, sanitizeData(errorData));

            if (!shouldIgnoreError(apiError) && response.status !== 401 && response.status !== 404) {
              captureApiError(apiError, {
                url,
                method,
                statusCode: response.status,
                durationMs,
                metadata: { errorData: sanitizeData(errorData) },
              });
            }

            throw apiError;
        }

        if (response.status === 204 || response.headers.get('Content-Length') === '0') {
            return null as T;
        }

        try {
            return await response.json();
        } catch (parseError) {
            if (!shouldIgnoreError(parseError)) {
              captureApiError(parseError, {
                url,
                method,
                statusCode: response.status,
                durationMs,
                metadata: { error: 'Failed to parse JSON response' },
              });
            }
            throw new ApiError('فشل قراءة استجابة الخادم.', response.status);
        }
      }
    );
};

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => makeRequest(endpoint, { method: 'GET' }),
  post: async <T>(endpoint: string, body: any): Promise<T> => makeRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: async <T>(endpoint: string, body: any): Promise<T> => makeRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: async <T>(endpoint: string): Promise<T> => makeRequest(endpoint, { method: 'DELETE' }),
};
