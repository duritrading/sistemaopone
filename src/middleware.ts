// src/middleware.ts - VERSÃO SIMPLIFICADA E SEGURA
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login']
const authRoutes = ['/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  console.log('Middleware:', { pathname, hasToken: !!token })

  // ✅ SKIP: Arquivos estáticos (verificação simples por extensão)
  if (pathname.endsWith('.svg') || 
      pathname.endsWith('.png') || 
      pathname.endsWith('.jpg') || 
      pathname.endsWith('.jpeg') || 
      pathname.endsWith('.gif') || 
      pathname.endsWith('.ico') || 
      pathname.endsWith('.css') || 
      pathname.endsWith('.js') ||
      pathname.endsWith('.woff') ||
      pathname.endsWith('.woff2') ||
      pathname.endsWith('.ttf') ||
      pathname.endsWith('.eot')) {
    console.log('✅ Skipping static asset:', pathname)
    return NextResponse.next()
  }

  // ✅ SKIP: Rotas Next.js internas
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Permitir rotas públicas sempre
  if (publicRoutes.includes(pathname)) {
    // Se já está logado e tenta acessar login, redirecionar para dashboard
    if (token && authRoutes.includes(pathname)) {
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
        if (decoded.exp > Date.now()) {
          console.log('Redirecting logged user from login to dashboard')
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch {
        // Token inválido, permitir acesso ao login
      }
    }
    return NextResponse.next()
  }

  // Verificar autenticação para rotas protegidas
  if (!token) {
    console.log('No token, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar se token é válido
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    if (decoded.exp < Date.now()) {
      console.log('Token expired, redirecting to login')
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }
  } catch {
    console.log('Invalid token, redirecting to login')
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }

  return NextResponse.next()
}

// ✅ MATCHER SIMPLES - SEM REGEX COMPLEXA
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