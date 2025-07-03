// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
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
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar */}
          <div className="w-64 bg-slate-900 text-white flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">O</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">OpOne</h1>
                  <p className="text-sm text-slate-400">Sistema de Gestão</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6">
              <div className="px-6 mb-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  NAVEGAÇÃO PRINCIPAL
                </h2>
              </div>
              
              <nav className="px-4 space-y-2">
                <NavLink href="/dashboard" icon="📊" label="Dashboard" />
                <NavLink href="/vendas" icon="📈" label="Vendas" />
                <NavLink href="/projetos" icon="📁" label="Projetos" />
                <NavLink href="/clientes" icon="🏢" label="Clientes" />
                <NavLink href="/financeiro" icon="💰" label="Financeiro" />
                <NavLink href="/equipe" icon="👥" label="Equipe" />
              </nav>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-700 p-4">
              <NavLink href="/configuracoes" icon="⚙️" label="Configurações" />
              <div className="mt-4 px-3">
                <div className="text-xs text-slate-500">
                  <div className="font-medium">Versão MVP</div>
                  <div>v1.0.0</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Sistema OpOne</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">AD</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Admin</span>
                </div>
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-auto">
              <div className="p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}

// Componente de navegação
function NavLink({ 
  href, 
  icon, 
  label 
}: { 
  href: string
  icon: string
  label: string
}) {
  return (
    <a
      href={href}
      className="flex items-center px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
    >
      <span className="text-base mr-3">{icon}</span>
      <span>{label}</span>
    </a>
  )
}