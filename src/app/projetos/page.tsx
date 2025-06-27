// src/app/projetos/page.tsx - IMPLEMENTAÇÃO COMPLETA
'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  Search, Download, Filter, Plus,
  AlertTriangle, CheckCircle, DollarSign, BarChart3,
  Calendar, Users, Target, TrendingUp
} from 'lucide-react'

// =================== INTERFACES ===================
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
  start_date?: string
  client?: { company_name: string }
  manager?: { full_name: string }
  project_team_members?: { count: number }[]
}

interface ProjectFilters {
  search: string
  status: string[]
  health: string[]
  type: string[]
}

interface Metrics {
  active: number
  critical: number
  totalBudget: number
  avgProgress: number
}

// =================== COMPONENTES ===================

// Componente de Métrica
const MetricCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  </div>
)

// Componente de Item de Projeto
const ProjectItem = ({ project, onClick }) => {
  const healthConfig = {
    'healthy': { color: 'bg-green-100 text-green-800', label: 'Saudável', dotColor: 'bg-green-500' },
    'warning': { color: 'bg-yellow-100 text-yellow-800', label: 'Atenção', dotColor: 'bg-yellow-500' },
    'critical': { color: 'bg-red-100 text-red-800', label: 'Crítico', dotColor: 'bg-red-500' }
  }[project.health] || { color: 'bg-gray-100 text-gray-800', label: 'N/A', dotColor: 'bg-gray-500' }

  const budgetUtilization = project.total_budget > 0 
    ? (project.used_budget / project.total_budget) * 100 
    : 0

  const daysRemaining = project.estimated_end_date 
    ? Math.ceil((new Date(project.estimated_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const teamCount = project.project_team_members?.[0]?.count || 0

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300"
      onClick={() => onClick(project)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {project.name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${healthConfig.color}`}>
              {healthConfig.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {project.client?.company_name || 'Cliente não definido'}
          </p>
          {project.description && (
            <p className="text-sm text-gray-500 line-clamp-2">
              {project.description.length > 120 
                ? project.description.substring(0, 120) + '...'
                : project.description
              }
            </p>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Progresso</p>
          <p className="text-lg font-bold text-gray-900">{project.progress_percentage || 0}%</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${project.progress_percentage || 0}%` }}
            />
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Orçamento</p>
          <p className="text-lg font-bold text-gray-900">{Math.round(budgetUtilization)}%</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                budgetUtilization > 90 ? 'bg-red-500' : 
                budgetUtilization > 70 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Equipe</p>
          <p className="text-lg font-bold text-gray-900">{teamCount}</p>
          <p className="text-xs text-gray-400">membros</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Prazo</p>
          <p className={`text-lg font-bold ${
            daysRemaining !== null 
              ? daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-yellow-600' : 'text-green-600'
              : 'text-gray-400'
          }`}>
            {daysRemaining !== null 
              ? daysRemaining < 0 ? `${Math.abs(daysRemaining)}d atraso` : `${daysRemaining}d`
              : 'N/D'
            }
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${healthConfig.dotColor}`}></span>
          <span className="text-sm font-medium text-gray-700">{project.status}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{project.project_type}</span>
          {project.manager?.full_name && (
            <span>• {project.manager.full_name}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {Array.from({ length: 4 }, (_, j) => (
            <div key={j} className="text-center">
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-6 bg-gray-200 rounded mb-1"></div>
              <div className="h-1.5 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    ))}
  </div>
)

// =================== COMPONENTE PRINCIPAL ===================

export default function CompleteProjectsPage() {
  const [mounted, setMounted] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: [],
    health: [],
    type: []
  })

  // Evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  // Carregar projetos com cache
  const loadProjects = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Carregando projetos...')

      // Chave do cache
      const cacheKey = 'projects_list'
      
      // Se não for refresh forçado, tentar cache primeiro
      if (!forceRefresh) {
        const { simpleCache } = await import('@/lib/simpleCache')
        const cached = simpleCache.get(cacheKey)
        if (cached) {
          setProjects(cached)
          setLoading(false)
          return
        }
      }

      const { data, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, name, description, status, health, progress_percentage,
          total_budget, used_budget, project_type, estimated_end_date, start_date,
          client:clients(company_name),
          manager:team_members(full_name),
          project_team_members(count)
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (projectsError) {
        throw new Error(`Erro ao carregar projetos: ${projectsError.message}`)
      }

      const projectData = data || []
      
      // Salvar no cache
      const { simpleCache } = await import('@/lib/simpleCache')
      simpleCache.set(cacheKey, projectData, 3 * 60 * 1000) // 3 minutos

      setProjects(projectData)
      console.log(`✅ ${projectData.length} projetos carregados`)

    } catch (err: any) {
      console.error('❌ Erro:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Carregar ao montar
  useEffect(() => {
    if (mounted) {
      loadProjects(false) // false = permitir cache
    }
  }, [mounted])

  // Filtrar projetos
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

      // Filtro de tipo
      if (filters.type.length > 0 && !filters.type.includes(project.project_type)) {
        return false
      }

      return true
    })
  }, [projects, filters])

  // Calcular métricas
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

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
  }

  const handleFilterToggle = (type: keyof ProjectFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: Array.isArray(prev[type])
        ? (prev[type] as string[]).includes(value)
          ? (prev[type] as string[]).filter(item => item !== value)
          : [...(prev[type] as string[]), value]
        : prev[type]
    }))
  }

  const handleProjectClick = (project: Project) => {
    window.location.href = `/projetos/${project.id}`
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Métricas formatadas
  const formattedMetrics = [
    {
      title: 'Projetos Ativos',
      value: metrics.active,
      icon: CheckCircle,
      colorClass: 'bg-blue-500',
      subtitle: `${projects.length} total`
    },
    {
      title: 'Projetos Críticos', 
      value: metrics.critical,
      icon: AlertTriangle,
      colorClass: 'bg-red-500',
      subtitle: metrics.critical > 0 ? 'Atenção necessária' : 'Tudo OK'
    },
    {
      title: 'Orçamento Total',
      value: formatCurrency(metrics.totalBudget),
      icon: DollarSign,
      colorClass: 'bg-green-500',
      subtitle: 'Todos os projetos'
    },
    {
      title: 'Progresso Médio',
      value: `${metrics.avgProgress}%`,
      icon: BarChart3,
      colorClass: 'bg-orange-500',
      subtitle: 'Média geral'
    }
  ]

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

  // Error state
  if (error && projects.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-red-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Erro ao Carregar Projetos
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => loadProjects(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Gestão de Projetos</h1>
              <p className="text-gray-600">
                Acompanhe o progresso e saúde dos seus projetos em tempo real
              </p>
            </div>
            <button 
              onClick={() => loadProjects(true)}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Atualizando...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Atualizar
                </>
              )}
            </button>
          </div>
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
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros e Busca</h2>
            
            <div className="space-y-4">
              {/* Busca */}
              <div className="flex gap-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, descrição ou cliente..."
                      value={filters.search}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Novo Projeto
                </button>
              </div>

              {/* Filtros rápidos */}
              <div className="flex flex-wrap gap-2">
                {/* Status */}
                <div className="flex gap-1">
                  <span className="text-sm font-medium text-gray-700 px-2 py-1">Status:</span>
                  {['Planejamento', 'Executando', 'Pausado', 'Concluído'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleFilterToggle('status', status)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filters.status.includes(status)
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Health */}
                <div className="flex gap-1 ml-4">
                  <span className="text-sm font-medium text-gray-700 px-2 py-1">Saúde:</span>
                  {[
                    { key: 'healthy', label: 'Saudável', color: 'green' },
                    { key: 'warning', label: 'Atenção', color: 'yellow' },
                    { key: 'critical', label: 'Crítico', color: 'red' }
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => handleFilterToggle('health', key)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filters.health.includes(key)
                          ? `bg-${color}-100 text-${color}-800 border border-${color}-300`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resumo dos filtros */}
          {(filters.search || filters.status.length > 0 || filters.health.length > 0) && (
            <div className="px-6 py-3 bg-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-700">
                  Mostrando {filteredProjects.length} de {projects.length} projetos
                  {filters.search && ` • Busca: "${filters.search}"`}
                </p>
                <button
                  onClick={() => setFilters({ search: '', status: [], health: [], type: [] })}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Projetos */}
        {loading ? (
          <LoadingSkeleton />
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filters.search || filters.status.length || filters.health.length 
                  ? 'Nenhum projeto encontrado'
                  : 'Nenhum projeto cadastrado'
                }
              </h3>
              <p className="text-gray-500 mb-6">
                {filters.search || filters.status.length || filters.health.length
                  ? 'Tente ajustar os filtros para encontrar o que procura'
                  : 'Comece criando seu primeiro projeto'
                }
              </p>
              {!filters.search && !filters.status.length && !filters.health.length && (
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto">
                  <Plus className="w-5 h-5" />
                  Criar Primeiro Projeto
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  onClick={handleProjectClick}
                />
              ))}
            </div>
            
            {/* Footer com informações */}
            <div className="text-center py-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Exibindo {filteredProjects.length} de {projects.length} projetos
                {error && (
                  <span className="ml-2 text-amber-600">
                    • Alguns dados podem estar desatualizados
                  </span>
                )}
              </p>
              
              {/* Debug info - apenas em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={async () => {
                    const { simpleCache } = await import('@/lib/simpleCache')
                    const stats = simpleCache.getStats()
                    alert(`Cache Stats:\nTotal: ${stats.total}\nValid: ${stats.valid}\nExpired: ${stats.expired}\nHit Rate: ${stats.hitRate.toFixed(1)}%`)
                  }}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  📊 Ver Stats Cache
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}