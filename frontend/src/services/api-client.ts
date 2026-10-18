import type { ApiErrorCode, ErrorResponse } from '../types';

export const DEFAULT_API_BASE_URL =
  'https://mock.apidog.com/m1/1399961-1408603-default';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

type ApiDogErrorResponse = {
  apidogError?: {
    code?: number;
    message?: string;
  };
};

function isErrorResponse(
  payload: ErrorResponse | ApiDogErrorResponse | null
): payload is ErrorResponse {
  return Boolean(payload && 'error' in payload);
}

function isApiDogErrorResponse(
  payload: ErrorResponse | ApiDogErrorResponse | null
): payload is ApiDogErrorResponse {
  return Boolean(payload && 'apidogError' in payload);
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | null;
  readonly fieldErrors?: Record<string, string[]>;
  readonly requestId?: string;

  constructor(
    message: string,
    options: {
      status: number;
      code?: ApiErrorCode | null;
      fieldErrors?: Record<string, string[]>;
      requestId?: string;
    }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code ?? null;
    this.fieldErrors = options.fieldErrors;
    this.requestId = options.requestId;
  }
}

export type ApiClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function getErrorMessage(
  payload: ErrorResponse | ApiDogErrorResponse | null,
  fallback: string
): string {
  if (isErrorResponse(payload) && payload.error.message) {
    return payload.error.message;
  }

  if (isApiDogErrorResponse(payload) && payload.apidogError?.message) {
    return payload.apidogError.message;
  }

  return fallback;
}

export class ApiClient {
  readonly baseUrl: string;

  private readonly fetcher: typeof fetch;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = trimTrailingSlash(options.baseUrl ?? API_BASE_URL);
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    headers.set('Accept', 'application/json');

    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers
    });

    if (!response.ok) {
      let payload: ErrorResponse | ApiDogErrorResponse | null = null;

      try {
        payload = (await response.json()) as ErrorResponse | ApiDogErrorResponse;
      } catch {
        // Keep the HTTP status as the fallback when the server returns no JSON.
      }

      const errorPayload = isErrorResponse(payload) ? payload.error : undefined;

      throw new ApiClientError(
        getErrorMessage(payload, response.statusText || 'Request failed'),
        {
          status: response.status,
          code: errorPayload?.code,
          fieldErrors: errorPayload?.fieldErrors,
          requestId: errorPayload?.requestId
        }
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: 'GET' });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
