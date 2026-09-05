/** Options shared by framework adapters when changing the current location. */
export interface AdminNavigationOptions {
  /** Preserve the browser's current scroll position when supported. */
  scroll?: boolean;
}

/** Framework-neutral navigation operations used by admin-core. */
export interface AdminNavigationAdapter {
  push(url: string, options?: AdminNavigationOptions): void;
  replace(url: string, options?: AdminNavigationOptions): void;
  back(): void;
}

/** The location observable consumed by URL-backed admin state. */
export interface AdminLocationAdapter {
  pathname: string;
  searchParams: URLSearchParams;
}

export interface AdminNavigationContextValue {
  navigation: AdminNavigationAdapter;
  location: AdminLocationAdapter;
}
