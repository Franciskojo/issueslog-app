import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Protect admin route — only tech/admin
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'tech' && token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Non-tech users cannot access new issue form if they are tech
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/',
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/my-issues/:path*', '/issues/:path*', '/admin/:path*'],
};
