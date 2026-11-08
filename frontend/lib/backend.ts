// Public URL embedded in the browser bundle; never put secrets here.
export const backendURL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export class BackendError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "BackendError";
  }
}

export async function backendFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${backendURL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new BackendError(
      response.status === 401
        ? "Your session has expired. Please log in again."
        : "Unable to load users. Please try again.",
      response.status,
    );
  }
  return response.json() as Promise<T>;
}
