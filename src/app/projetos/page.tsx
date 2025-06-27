// src/app/projetos/page.tsx - VERSÃO SIMPLIFICADA E FUNCIONAL
'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Search, Download, Filter, Plus,
  AlertTriangle, CheckCircle, DollarSign, BarChart3 
} from 'lucide-react'

// Interface básica
interface Project {
  id: string
  name: string
  description?: string
  status: string
  health: string
  progress_percentage: number
  total_budget: number
  used_budget: number
  project_type: string
  estimated_end_date?: string
  client?: { company_name: string }
  manager?: { full_name: string }
}

interface ProjectFilters {
  search: string
  status: string[]
  health: string[]
}

// Componente de métrica
const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-center gap-4">
    <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  </div>
)

// Componente do item de projeto
const ProjectItem = ({ project }) => {
  const healthConfig = {
    'healthy': { color: 'bg-green-100 text-green-800', label: 'Saudável' },
    'warning': { color: 'bg-yellow-100 text-yellow-800', label: 'Atenção' },
    'critical': { color: 'bg-red-100 text-red-800', label: 'Crítico' }
  }[project.health] || { color: 'bg-gray-100 text-gray-800', label: 'N/A' }

  const budgetUtilization = project.total_budget > 0 
    ? (project.used_budget / project.total_budget) * 100 
    : 0

  const daysRemaining = project.estimated_end_date 
    ? Math.ceil((new Date(project.estimated_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => window.location.href = `/projetos/${project.id}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {project.name}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {project.client?.company_name || 'Cliente não definido'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${healthConfig.color}`}>
          {healthConfig.label}
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500">Progresso</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress_percentage || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {project.progress_percentage || 0}%
            </span>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500">Orçamento</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  budgetUtilization > 90 ? 'bg-red-500' : 
                  budgetUtilization > 70 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(budgetUtilization)}%
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500">Status</p>
          <p className="text-sm font-medium text-gray-900">
            {project.status}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{project.project_type}</span>
        <span>
          {daysRemaining !== null 
            ? `${daysRemaining > 0 ? '' : '-'}${Math.abs(daysRemaining)} dias`
            : 'Sem prazo'
          }
        </span>
      </div>
    </div>
  )
}

// Loading skeleton
const LoadingSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    ))}
  </div>
)

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: [],
    health: []
  })

  // Carregar projetos de forma simples
  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Carregando projetos...')

      const { data, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, name, description, status, health, progress_percentage,
          total_budget, used_budget, project_type, estimated_end_date,
          client:clients(company_name),
          manager:team_members(full_name)
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (projectsError) {
        throw new Error(`Erro Supabase: ${projectsError.message}`)
      }

      setProjects(data || [])
      console.log(`✅ ${data?.length || 0} projetos carregados`)

    } catch (err: any) {
      console.error('❌ Erro ao carregar projetos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Carregar ao montar o componente
  useEffect(() => {
    loadProjects()
  }, [])

  // Filtrar projetos localmente
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Filtro de busca
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          project.name.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.client?.company_name?.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Filtro de status
      if (filters.status.length > 0 && !filters.status.includes(project.status)) {
        return false
      }

      // Filtro de health
      if (filters.health.length > 0 && !filters.health.includes(project.health)) {
        return false
      }

      return true
    })
  }, [projects, filters])

  // Calcular métricas simples
  const metrics = useMemo(() => {
    return {
      active: projects.filter(p => p.status === 'Executando').length,
      critical: projects.filter(p => p.health === 'critical').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.total_budget || 0), 0),
      avgProgress: projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length)
        : 0
    }
  }, [projects])

  // Handlers de filtros
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
  }

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }

  const handleHealthFilter = (health: string) => {
    setFilters(prev => ({
      ...prev,
      health: prev.health.includes(health)
        ? prev.health.filter(h => h !== health)
        : [...prev.health, health]
    }))
  }

  // Métricas formatadas
  const formattedMetrics = [
    {
      title: 'Projetos Ativos',
      value: metrics.active,
      icon: CheckCircle,
      colorClass: 'bg-blue-500'
    },
    {
      title: 'Críticos', 
      value: metrics.critical,
      icon: AlertTriangle,
      colorClass: 'bg-red-500'
    },
    {
      title: 'Valor Total',
      value: `R$ ${(metrics.totalBudget / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      colorClass: 'bg-green-500'
    },
    {
      title: 'Progresso Médio',
      value: `${metrics.avgProgress}%`,
      icon: BarChart3,
      colorClass: 'bg-orange-500'
    }
  ]

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Erro ao Carregar Projetos</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadProjects}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Projetos</h1>
          <p className="text-gray-600">Acompanhe o progresso e saúde dos seus projetos</p>
        </div>

        {/* Métricas */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {formattedMetrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>
        )}
        
        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lista de Projetos</h2>
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              
              {/* Busca */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar projetos..."
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtros rápidos */}
              <div className="flex flex-wrap gap-2">
                {/* Status */}
                {['Executando', 'Planejamento', 'Pausado'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.status.includes(status)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}

                {/* Health */}
                {[
                  { key: 'healthy', label: 'Saudável' },
                  { key: 'warning', label: 'Atenção' },
                  { key: 'critical', label: 'Crítico' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleHealthFilter(key)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.health.includes(key)
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <button 
                  onClick={loadProjects}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  {loading ? '🔄' : '🔄'} Atualizar
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Novo Projeto
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Projetos */}
          <div className="p-6">
            {loading ? (
              <LoadingSkeleton />
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg font-medium mb-2">
                  {filters.search || filters.status.length || filters.health.length 
                    ? 'Nenhum projeto encontrado com os filtros aplicados'
                    : 'Nenhum projeto encontrado'
                  }
                </div>
                <p className="text-gray-400">
                  {filters.search || filters.status.length || filters.health.length
                    ? 'Tente ajustar os filtros'
                    : 'Crie seu primeiro projeto'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <ProjectItem key={project.id} project={project} />
                ))}
                
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    {filteredProjects.length} de {projects.length} projetos
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}