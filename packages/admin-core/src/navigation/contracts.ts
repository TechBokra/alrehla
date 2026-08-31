/** Options shared by framework adapters when changing the current location. */
export interface AdminNavigationOptions {
  scroll?: boolean;
}

/** Framework-neutral navigation operations consumed by Admin Core. */
export interface AdminNavigationAdapter {
  push(url: string, options?: AdminNavigationOptions): void;
  replace(url: string, options?: AdminNavigationOptions): void;
  back(): void;
}

/** Framework-neutral location observed by URL-backed DataView state. */
export interface AdminLocationAdapter {
  pathname: string;
  searchParams: URLSearchParams;
}

export interface AdminNavigationContextValue {
  navigation: AdminNavigationAdapter;
  location: AdminLocationAdapter;
}
