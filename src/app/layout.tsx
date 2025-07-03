// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AppLayout from '@/components/layout/AppLayout'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema OpOne',
  description: 'Sistema de Gestão',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  )
}