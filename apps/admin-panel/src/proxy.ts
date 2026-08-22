import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPath = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

const isPublicPath = (pathname: string) =>
  isPath(pathname, '/login') ||
  isPath(pathname, '/signup') ||
  isPath(pathname, '/sso-callback') ||
  isPath(pathname, '/auth/redirect');

const getSafeNextPath = (value: string | null, request: Request) => {
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value, request.url);
  } catch {
    return null;
  }

  if (url.origin !== new URL(request.url).origin) return null;
  if (isPublicPath(url.pathname)) return null;
  return `${url.pathname}${url.search}`;
};

export default clerkMiddleware(
  async (auth, request) => {
    const pathname = request.nextUrl.pathname;

    // Keep the authentication pages reachable while a Clerk session is being
    // resolved. This avoids the login -> dashboard -> login redirect loop when
    // the database profile has not finished syncing yet.
    if (isPublicPath(pathname)) {
      const isLoginPage = isPath(pathname, '/login') || isPath(pathname, '/signup');
      const { userId } = await auth();

      if (isLoginPage && userId) {
        const nextPath = getSafeNextPath(
          request.nextUrl.searchParams.get('redirect_url'),
          request,
        );
        const redirectUrl = new URL('/auth/redirect', request.url);
        if (nextPath) redirectUrl.searchParams.set('next', nextPath);
        return NextResponse.redirect(redirectUrl);
      }

      return NextResponse.next();
    }

    // Authentication is enforced at the network boundary. Authorization for
    // database mutations is enforced again by the Server Action and Supabase
    // RLS, so a hidden client button can never grant access.
    await auth.protect();
    return NextResponse.next();
  },
  { signInUrl: '/login' },
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
