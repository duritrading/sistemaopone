// src/middleware-simple.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  console.log('Middleware check:', { pathname, hasToken: !!token })

  // Se está tentando acessar /login
  if (pathname === '/login') {
    // Se tem token válido, redirecionar para dashboard
    if (token) {
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
        if (decoded.exp && decoded.exp > Date.now()) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch {
        // Token inválido, permitir acesso ao login
      }
    }
    // Permitir acesso ao login
    return NextResponse.next()
  }

  // Para todas as outras rotas, verificar se tem token
  if (!token) {
    console.log('No token found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar se token é válido (sem consulta ao banco)
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    if (!decoded.exp || decoded.exp < Date.now()) {
      console.log('Token expired, redirecting to login')
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }
  } catch (error) {
    console.log('Invalid token, redirecting to login')
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }

  // Token válido, permitir acesso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

// Para usar este middleware, renomeie para middleware.ts