import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  let isAuthenticated = false

  if (token) {
    try {
      await jwtVerify(token, secret)
      isAuthenticated = true
    } catch {
      isAuthenticated = false
    }
  }

  if (!isAuthenticated && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!isAuthenticated && request.nextUrl.pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!isAuthenticated && request.nextUrl.pathname.startsWith('/attacks')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Only redirect authenticated users from login/register pages
  if (isAuthenticated && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Don't redirect from root path - let it show landing page
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

