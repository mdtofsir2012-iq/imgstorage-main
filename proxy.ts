import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE } from '@/lib/auth-constants'

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isAuth = req.cookies.get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE

  if (path.startsWith('/dashboard') && !isAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuth && (path === '/' || path === '/login')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
}
