"use client";

import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import NextLink, { type LinkProps as NextLinkProps } from 'next/link';
import { useParams as useNextParams, usePathname, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation';

type NavigationState = any;
type NavigateOptions = { replace?: boolean; state?: NavigationState };
type To = string | number;

const stateKeyFor = (to: string) => `alrehla:navigation-state:${to}`;

const normalizeTo = (to: string) => to || '/';

const isExternalUrl = (to: string) => /^https?:\/\//i.test(to);

const saveNavigationState = (to: string, state?: NavigationState) => {
  if (typeof window === 'undefined' || state === undefined) return;
  window.sessionStorage.setItem(stateKeyFor(normalizeTo(to)), JSON.stringify(state));
};

const readNavigationState = (pathname: string, search: string) => {
  if (typeof window === 'undefined') return null;
  const exactKey = stateKeyFor(`${pathname}${search}`);
  const pathKey = stateKeyFor(pathname);
  const value = window.sessionStorage.getItem(exactKey) ?? window.sessionStorage.getItem(pathKey);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const useNavigate = () => {
  const router = useRouter();

  return useCallback((to: To, options: NavigateOptions = {}) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }

    const target = normalizeTo(to);
    saveNavigationState(target, options.state);

    if (isExternalUrl(target)) {
      if (options.replace) window.location.replace(target);
      else window.location.assign(target);
      return;
    }

    if (options.replace) router.replace(target);
    else router.push(target);
  }, [router]);
};

export const useLocation = () => {
  const pathname = usePathname() || '/';
  const [search, setSearch] = useState('');
  const [state, setState] = useState<NavigationState>(null);

  useEffect(() => {
    const currentSearch = typeof window === 'undefined' ? '' : window.location.search;
    setSearch(currentSearch);
    setState(readNavigationState(pathname, currentSearch));
  }, [pathname]);

  return useMemo(() => ({ pathname, search, hash: '', state, key: pathname + search }), [pathname, search, state]);
};

export const useParams = <T extends Record<string, string | undefined> = Record<string, string | undefined>>() => {
  return useNextParams() as T;
};

export const useSearchParams = (): [URLSearchParams, (next: URLSearchParams | Record<string, string> | string) => void] => {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const nextParams = useNextSearchParams();
  const params = useMemo(() => new URLSearchParams(nextParams?.toString()), [nextParams]);

  const setSearchParams = useCallback((next: URLSearchParams | Record<string, string> | string) => {
    const value = typeof next === 'string' ? next : new URLSearchParams(next as any).toString();
    router.push(value ? `${pathname}?${value}` : pathname);
  }, [pathname, router]);

  return [params, setSearchParams];
};

type CompatLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> & {
  className?: string;
  to?: string;
  href?: NextLinkProps['href'];
  replace?: boolean;
  state?: NavigationState;
  prefetch?: boolean;
};

export const Link = forwardRef<HTMLAnchorElement, CompatLinkProps>(function Link(
  { to, href, replace, state, prefetch, onClick, ...props },
  ref,
) {
  const target = (href ?? to ?? '/') as NextLinkProps['href'];
  return (
    <NextLink
      ref={ref}
      href={target}
      replace={replace}
      prefetch={prefetch}
      onClick={(event) => {
        if (typeof target === 'string') saveNavigationState(target, state);
        onClick?.(event);
      }}
      {...props}
    />
  );
});

export const NavLink = forwardRef<HTMLAnchorElement, Omit<CompatLinkProps, 'className'> & {
  end?: boolean;
  className?: string | ((state: { isActive: boolean }) => string);
}>(function NavLink({ to, href, end, className, ...props }, ref) {
  const pathname = usePathname() || '/';
  const target = String(href ?? to ?? '/');
  const isActive = end ? pathname === target : (pathname === target || pathname.startsWith(`${target}/`));
  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className;
  return <Link ref={ref} to={target} className={resolvedClassName} {...props} />;
});

export const Navigate: React.FC<{ to: string; replace?: boolean; state?: NavigationState }> = ({ to, replace, state }) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, replace, state, to]);

  return null;
};

export const Outlet: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children ?? null}</>;

