'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FolderOpen,
  Building2, 
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FolderOpen, label: 'Projetos', href: '/projetos' },
    { icon: Building2, label: 'Clientes', href: '/clientes' },
    { icon: Users, label: 'Equipe', href: '/equipe' },
    { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
    { icon: TrendingUp, label: 'Vendas', href: '/vendas' },
  ]

  const isActiveRoute = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`
        bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col
        ${sidebarCollapsed ? 'w-16' : 'w-80'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-white">OpOne</h1>
                <p className="text-sm text-slate-400">Sistema de Gestão</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <div className="px-4 py-2 border-b border-slate-700">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6">
          {!sidebarCollapsed && (
            <div className="px-6 mb-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                NAVEGAÇÃO PRINCIPAL
              </h2>
            </div>
          )}
          
          <nav className="px-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className={`
                    w-5 h-5 flex-shrink-0
                    ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}
                  `} />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                  
                  {/* Tooltip when collapsed */}
                  {sidebarCollapsed && (
                    <div className="absolute left-20 bg-slate-800 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700">
          {/* Configurações */}
          <div className="p-4">
            <Link
              href="/configuracoes"
              className={`
                group flex items-center px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
            >
              <Settings className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-white" />
              {!sidebarCollapsed && (
                <span className="ml-3">Configurações</span>
              )}
              
              {/* Tooltip when collapsed */}
              {sidebarCollapsed && (
                <div className="absolute left-20 bg-slate-800 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  Configurações
                </div>
              )}
            </Link>
          </div>

          {/* Versão */}
          {!sidebarCollapsed && (
            <div className="px-6 pb-4">
              <div className="text-xs text-slate-500">
                <div className="font-medium">Versão MVP</div>
                <div>v1.0.0</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">AD</span>
              </div>
              <span className="text-sm font-medium text-gray-900">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppLayout