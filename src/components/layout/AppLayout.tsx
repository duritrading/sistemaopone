'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp,
  FolderOpen, 
  Building2, 
  DollarSign,
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Ordem exata da imagem: Dashboard, Vendas, Projetos, Clientes, Financeiro, Equipe
  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: TrendingUp, label: 'Vendas', href: '/vendas' },
    { icon: FolderOpen, label: 'Projetos', href: '/projetos' },
    { icon: Building2, label: 'Clientes', href: '/clientes' },
    { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
    { icon: Users, label: 'Equipe', href: '/equipe' },
  ];

  const isActiveRoute = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Design escuro igual à imagem */}
      <div className={`
        bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
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
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              
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
              );
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
          <div className="flex items-center justify-between">
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">AD</span>
              </div>
              <span className="text-sm font-medium text-gray-900">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto px-12 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;