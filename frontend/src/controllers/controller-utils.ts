import { ApiClientError } from '../services';

export function getControllerErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
