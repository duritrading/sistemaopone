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
  Menu,
  X
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  // Ordem exata da sua imagem: Dashboard, Vendas, Projetos, Clientes, Financeiro, Equipe
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
      {/* Sidebar - Design exato da sua imagem */}
      <div className={`
        bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-16'}
      `}>
        {/* Header do Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className={`transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            {sidebarOpen && (
              <h1 className="text-base font-medium text-gray-900">Sistema OpOne</h1>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${!sidebarOpen ? 'justify-center' : ''}
                  `}
                >
                  <Icon className={`
                    w-5 h-5 flex-shrink-0
                    ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {sidebarOpen && (
                    <span className="ml-3 truncate">{item.label}</span>
                  )}
                  
                  {/* Tooltip quando collapsed */}
                  {!sidebarOpen && (
                    <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
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

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;