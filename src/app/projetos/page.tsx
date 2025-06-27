// src/app/projetos/page.tsx - VERSÃO ESTÁVEL SEM LOOPS
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  Search, Download, Plus, AlertTriangle, CheckCircle, DollarSign, BarChart3
} from 'lucide-react'

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Evitar hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  // Função simples para carregar projetos - SEM CACHE
  const handleLoadProjects = async () => {
    if (loading) return // Prevenir múltiplas calls
    
    try {
      setLoading(true)
      setError('')
      
      console.log('🔍 Carregando projetos...')

      const { data, error: supabaseError } = await supabase
        .from('projects')
        .select(`
          id, name, description, status, health, progress_percentage,
          total_budget, used_budget, project_type,
          client:clients(company_name),
          manager:team_members(full_name)
        `)
        .eq('is_active', true)
        .order('name')
        .limit(50)

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      setProjects(data || [])
      console.log(`✅ ${data?.length || 0} projetos carregados`)

    } catch (err) {
      console.error('❌ Erro:', err)
      setError(err.message || 'Erro ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar projetos localmente
  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular métricas simples
  const metrics = {
    total: projects.length,
    active: projects.filter(p => p.status === 'Executando').length,
    critical: projects.filter(p => p.health === 'critical').length,
    avgProgress: projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length)
      : 0
  }

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 Gestão de Projetos</h1>
          <p className="text-gray-600">Gerencie seus projetos de forma eficiente</p>
        </div>

        {/* Métricas Simples */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold">{metrics.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold">{metrics.active}</p>
                <p className="text-sm text-gray-600">Ativos</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold">{metrics.critical}</p>
                <p className="text-sm text-gray-600">Críticos</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold">{metrics.avgProgress}%</p>
                <p className="text-sm text-gray-600">Progresso Médio</p>
              </div>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            
            {/* Botões */}
            <div className="flex gap-2">
              <button
                onClick={handleLoadProjects}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Carregando...' : '🔄 Carregar Projetos'}
              </button>
              
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </button>
              
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo
              </button>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Status: {loading ? 'Carregando...' : `${filteredProjects.length} de ${projects.length} projetos`}
            {searchTerm && ` • Busca: "${searchTerm}"`}
          </p>
        </div>

        {/* Conteúdo Principal */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-800 mb-2">Erro ao carregar projetos</h3>
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <button 
              onClick={handleLoadProjects}
              className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {loading && projects.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-white border rounded-lg p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && projects.length === 0 && !error && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              👆 Clique em "Carregar Projetos" para começar
            </h3>
            <p className="text-gray-600">
              Os projetos serão carregados do banco de dados
            </p>
          </div>
        )}

        {!loading && filteredProjects.length === 0 && projects.length > 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar o termo de busca
            </p>
          </div>
        )}

        {filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div 
                key={project.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/projetos/${project.id}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 truncate flex-1">
                    {project.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                    project.health === 'critical' ? 'bg-red-100 text-red-800' :
                    project.health === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {project.health === 'critical' ? 'Crítico' :
                     project.health === 'warning' ? 'Atenção' : 'Saudável'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 truncate">
                  {project.client?.company_name || 'Cliente não definido'}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progresso:</span>
                    <span className="font-medium">{project.progress_percentage || 0}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress_percentage || 0}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-gray-600">{project.status}</span>
                    <span className="text-gray-600">{project.project_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}