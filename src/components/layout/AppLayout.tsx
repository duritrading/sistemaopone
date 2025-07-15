// src/components/layout/AppLayout.tsx
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
  Menu,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

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

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`
        bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="flex items-center justify-center flex-shrink-0">
              <img
                src="Logo OpOne Fundo Preto.png"
                alt="OpOne Logo"
                className={`object-contain rounded-2xl ${sidebarCollapsed ? 'w-12 h-12' : 'w-10 h-10'}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/logo-vazia.png';
                }}
              />
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
                    group flex items-center rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                    ${sidebarCollapsed ? 'justify-center px-3 py-4' : 'px-3 py-3'}
                  `}
                >
                  <Icon className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-3 h-3'} ${sidebarCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Settings */}
        <div className="px-4 pb-4">
          <Link
            href="/configuracoes"
            className={`
              group flex items-center rounded-xl text-sm font-medium transition-all duration-200
              text-slate-300 hover:bg-slate-800 hover:text-white
              ${sidebarCollapsed ? 'justify-center px-3 py-4' : 'px-3 py-3'}
            `}
          >
            <Settings className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${sidebarCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
            {!sidebarCollapsed && (
              <span className="truncate">Configurações</span>
            )}
          </Link>
        </div>

        {/* User Menu */}
        {user && (
          <div className="p-4 border-t border-slate-700">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`
                  w-full flex items-center p-3 rounded-xl hover:bg-slate-800 transition-colors
                  ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}
                `}
              >
                <div className={`bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 ${sidebarCollapsed ? 'w-8 h-8' : 'w-7 h-7'}`}>
                  {user.profile_photo_url ? (
                    <img
                      src={user.profile_photo_url}
                      alt={user.full_name}
                      className={`rounded-lg object-cover ${sidebarCollapsed ? 'w-8 h-8' : 'w-7 h-7'}`}
                    />
                  ) : (
                    <User className={`text-white ${sidebarCollapsed ? 'h-4 w-4' : 'h-4 w-4'}`} />
                  )}
                </div>
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-white truncate">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user.seniority_level}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      showUserMenu ? 'rotate-180' : ''
                    }`} />
                  </>
                )}
              </button>

              {/* User Dropdown */}
              {showUserMenu && !sidebarCollapsed && (
                <div className="absolute bottom-full left-0 right-0 mb-2 py-2 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
                  <Link
                    href="/perfil"
                    className="flex items-center px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Meu Perfil
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sair do Sistema
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="text-sm text-gray-600">
              Bem-vindo, {user?.full_name}!
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;