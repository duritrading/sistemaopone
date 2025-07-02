// src/components/layout/Sidebar.tsx
'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Settings,
  Menu,
  X
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FolderOpen, label: 'Projetos', href: '/projetos' },
    { icon: Building2, label: 'Clientes', href: '/clientes' },
    { icon: Users, label: 'Equipe', href: '/equipe' },
    { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
    { icon: TrendingUp, label: 'Vendas', href: '/vendas' },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isActiveRoute = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-slate-800 text-white transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isOpen ? 'w-80' : 'lg:w-20'}
        lg:relative lg:translate-x-0
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className={`flex items-center space-x-3 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'lg:opacity-0'}`}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            {isOpen && (
              <div>
                <h2 className="text-xl font-bold">OpOne</h2>
                <p className="text-slate-400 text-sm">Sistema de Gestão</p>
              </div>
            )}
          </div>
          
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors lg:hidden"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6 overflow-y-auto">
          <div className="px-6">
            <h3 className={`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'lg:opacity-0'}`}>
              {isOpen && 'Navegação Principal'}
            </h3>
          </div>
          
          <nav className="space-y-2 px-3">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`
                    group flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 relative
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                    ${!isOpen ? 'lg:justify-center' : ''}
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                    <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-700 p-6">
          {/* Configurações */}
          <Link
            href="/configuracoes"
            className={`
              group flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 mb-6 relative
              ${isActiveRoute('/configuracoes')
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }
              ${!isOpen ? 'lg:justify-center' : ''}
            `}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isOpen && (
              <span className="font-medium">Configurações</span>
            )}
            
            {/* Tooltip for collapsed state */}
            {!isOpen && (
              <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                Configurações
              </div>
            )}
          </Link>

          {/* Version Info */}
          {isOpen && (
            <div className="text-slate-400 text-sm">
              <p className="font-medium">Versão MVP</p>
              <p>v1.0.0</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle button for desktop collapsed state */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="hidden lg:block fixed top-6 left-6 z-50 p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

export default Sidebar;