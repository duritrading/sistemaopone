// src/app/layout.tsx
'use client'

import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Páginas que não devem ter o layout principal
  const publicPages = ['/login']
  const isPublicPage = publicPages.includes(pathname)

  return (
    <html lang="pt-BR">
      <head>
        <title>Sistema OpOne</title>
        <meta name="description" content="Sistema de Gestão" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {isPublicPage ? (
            // Páginas públicas sem layout
            children
          ) : (
            // Páginas protegidas com layout
            <AppLayout>
              {children}
            </AppLayout>
          )}
        </AuthProvider>
      </body>
    </html>
  )
}