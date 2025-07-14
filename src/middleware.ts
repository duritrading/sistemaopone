// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthService } from './lib/auth'

const publicRoutes = ['/login']
const authRoutes = ['/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  // Permitir rotas públicas sempre
  if (publicRoutes.includes(pathname)) {
    // Se já está logado e tenta acessar login, redirecionar para dashboard
    if (token && authRoutes.includes(pathname)) {
      const user = await AuthService.verifyToken(token)
      if (user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    return NextResponse.next()
  }

  // Verificar autenticação para rotas protegidas
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const user = await AuthService.verifyToken(token)
  if (!user) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}