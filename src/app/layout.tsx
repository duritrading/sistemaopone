import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
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
        <Providers>
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
        </Providers>
      </body>
    </html>
  )
}

// Layout wrapper simplificado
function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h1 className="text-base font-medium text-gray-900">Sistema OpOne</h1>
        </div>

        <nav className="mt-4 px-3">
          <div className="space-y-1">
            <NavLink href="/dashboard" icon="📊">Dashboard</NavLink>
            <NavLink href="/vendas" icon="📈">Vendas</NavLink>
            <NavLink href="/projetos" icon="📁">Projetos</NavLink>
            <NavLink href="/clientes" icon="🏢">Clientes</NavLink>
            <NavLink href="/financeiro" icon="💰">Financeiro</NavLink>
            <NavLink href="/equipe" icon="👥">Equipe</NavLink>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-end">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">AD</span>
              </div>
              <span className="text-sm font-medium text-gray-900">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

// Componente de navegação
function NavLink({ 
  href, 
  icon, 
  children, 
  active = false 
}: { 
  href: string
  icon: string
  children: React.ReactNode
  active?: boolean 
}) {
  return (
    <a
      href={href}
      className={`
        flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150
        ${active 
          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      <span className="text-base mr-3">{icon}</span>
      {children}
    </a>
  )
}