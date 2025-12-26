import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAccountPage = req.nextUrl.pathname.startsWith('/account');
  const isLoginPage = req.nextUrl.pathname === '/login';

  // Redirect to login if accessing account pages without auth
  if (isAccountPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect to account if already logged in and visiting login page
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/account', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/account/:path*', '/login'],
};
