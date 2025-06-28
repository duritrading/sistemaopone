// src/app/projetos/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  BarChart3, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  RefreshCw,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  ChevronRight,
  Eye
} from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
  health: string
  progress_percentage: number
  total_budget: number
  used_budget: number
  client?: { company_name: string }
  manager?: { full_name: string }
}

interface ProjectMetrics {
  active_projects: number
  critical_projects: number
  total_value: number
  average_progress: number
}

// Componentes otimizados
const MetricCard = ({ title, value, icon: Icon, colorClass, trend }: {
  title: string
  value: string | number
  icon: any
  colorClass: string
  trend?: string
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          )}
        </div>
      </div>
    </div>
  </div>
)

const ProjectCard = ({ project }: { project: Project }) => {
  const router = useRouter()

  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'excelente': return 'bg-green-100 text-green-800 border-green-200'
      case 'bom': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'crítico': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'executando': return 'bg-green-100 text-green-800'
      case 'planejamento': return 'bg-yellow-100 text-yellow-800'
      case 'pausado': return 'bg-orange-100 text-orange-800'
      case 'concluído': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const handleCardClick = () => {
    try {
      router.push(`/projetos/${project.id}`)
    } catch (error) {
      console.error('Erro ao navegar para projeto:', error)
    }
  }

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300 group"
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Cliente: {project.client?.company_name || 'N/A'}</span>
            <span>PM: {project.manager?.full_name || 'N/A'}</span>
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getHealthColor(project.health)}`}>
            {project.health}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Progresso</span>
          <span className="text-sm font-medium text-gray-900">{project.progress_percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${project.progress_percentage}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="text-sm">
            <span className="text-gray-600">Orçamento: </span>
            <span className="font-medium text-gray-900">{formatCurrency(project.total_budget)}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm">
              <span className="text-gray-600">Usado: </span>
              <span className="font-medium text-gray-900">{formatCurrency(project.used_budget)}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-400 group-hover:text-blue-600 transition-colors">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">Ver detalhes</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="flex items-center space-x-3 text-gray-600">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span className="text-lg font-medium">Carregando projetos...</span>
    </div>
  </div>
)

const ErrorState = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
    <div className="flex items-center space-x-3 mb-4">
      <AlertCircle className="w-6 h-6 text-red-600" />
      <h3 className="text-lg font-semibold text-red-800">Erro ao Carregar Projetos</h3>
    </div>
    <div className="bg-red-100 border border-red-200 rounded p-4 mb-4">
      <pre className="text-red-700 text-sm whitespace-pre-wrap">{error}</pre>
    </div>
    <button 
      onClick={onRetry}
      className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      <span>Tentar Novamente</span>
    </button>
  </div>
)

const EmptyState = () => {
  const router = useRouter()
  
  return (
    <div className="text-center py-12">
      <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
      <p className="text-gray-600 mb-6">Crie seu primeiro projeto para começar.</p>
      <button 
        onClick={() => router.push('/projetos/novo')}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
      >
        <Plus className="w-4 h-4" />
        <span>Novo Projeto</span>
      </button>
    </div>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')

  // Auto-carregamento na inicialização
  useEffect(() => {
    loadProjectsAndMetrics()
  }, [])

  const loadProjectsAndMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Buscar projetos com relacionamentos
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, name, status, health, progress_percentage, total_budget, used_budget,
          client:clients(company_name),
          manager:team_members(full_name)
        `)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Calcular métricas
      const activeProjects = projectsData?.filter(p => p.status === 'Executando')?.length || 0
      const criticalProjects = projectsData?.filter(p => p.health === 'Crítico')?.length || 0
      const totalValue = projectsData?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0
      const avgProgress = projectsData?.length > 0 
        ? Math.round(projectsData.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projectsData.length)
        : 0

      setProjects(projectsData || [])
      setMetrics({
        active_projects: activeProjects,
        critical_projects: criticalProjects,
        total_value: totalValue,
        average_progress: avgProgress
      })
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Filtros aplicados
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'todos' || project.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <ErrorState error={error} onRetry={loadProjectsAndMetrics} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Projetos</h1>
            <p className="text-gray-600 mt-1">Acompanhe o progresso e saúde dos seus projetos</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={loadProjectsAndMetrics}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
            <button 
              onClick={() => router.push('/projetos/novo')}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Projeto</span>
            </button>
          </div>
        </div>

        {/* Métricas */}
        {metrics && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Projetos Ativos" 
              value={metrics.active_projects} 
              icon={CheckCircle} 
              colorClass="bg-blue-500"
              trend="Em execução"
            />
            <MetricCard 
              title="Projetos Críticos" 
              value={metrics.critical_projects} 
              icon={AlertTriangle} 
              colorClass="bg-red-500"
              trend="Requer atenção"
            />
            <MetricCard 
              title="Valor Total" 
              value={formatCurrency(metrics.total_value)} 
              icon={DollarSign} 
              colorClass="bg-green-500"
              trend="Portfolio total"
            />
            <MetricCard 
              title="Progresso Médio" 
              value={`${metrics.average_progress}%`} 
              icon={BarChart3} 
              colorClass="bg-orange-500"
              trend="Média geral"
            />
          </div>
        )}

        {/* Filtros e Busca */}
        {!isLoading && projects.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar projetos ou clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="Planejamento">Planejamento</option>
                    <option value="Executando">Executando</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {filteredProjects.length} de {projects.length} projetos
              </div>
            </div>
          </div>
        )}

        {/* Lista de Projetos */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Projetos</h2>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <LoadingState />
            ) : filteredProjects.length === 0 ? (
              projects.length === 0 ? <EmptyState /> : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhum projeto encontrado com os filtros aplicados.</p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}