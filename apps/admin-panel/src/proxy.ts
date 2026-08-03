import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAuthRoute = createRouteMatcher([
  '/login(.*)',
  '/signup(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/signup(.*)',
  '/sso-callback(.*)',
  '/auth/redirect(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (userId && isAuthRoute(request)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isPublicRoute(request)) return;

  if (userId) return;

  const signInUrl = new URL('/login', request.url);
  signInUrl.searchParams.set(
    'redirect_url',
    request.nextUrl.pathname + request.nextUrl.search,
  );

  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
