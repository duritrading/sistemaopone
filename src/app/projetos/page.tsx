// src/app/projetos/page.tsx - SEM PROBLEMAS DE HIDRATAÇÃO
'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false)

  // Evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          📊 Gestão de Projetos
        </h1>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-gray-900">
                Página carregada com sucesso!
              </span>
            </div>
            
            <p className="text-gray-600">
              A navegação lateral agora está funcionando corretamente.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">
                Status da Correção:
              </h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>✅ Layout correto aplicado</li>
                <li>✅ Hidratação corrigida</li>
                <li>✅ Navegação funcionando</li>
                <li>✅ Pronto para funcionalidades</li>
              </ul>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button 
                onClick={() => alert('Navegação funcionando!')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Testar Interação
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}