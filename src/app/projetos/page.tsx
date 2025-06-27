// src/app/projetos/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { 
  Search, Download, Filter, Eye, MoreHorizontal, Edit, FileText, Copy, Archive,
  FolderOpen, AlertTriangle, CheckCircle, DollarSign, BarChart3
} from 'lucide-react'

// Tipos
interface SimpleProject {
  id: string
  name: string
  description?: string
  project_type: string
  status: string
  health: string
  progress_percentage: number
  total_budget: number
  start_date?: string
  estimated_end_date?: string
  risk_level: string
  client?: {
    company_name: string
  }
  manager?: {
    full_name: string
  }
}

interface SimpleMetrics {
  total_projects: number
  active_projects: number
  critical_projects: number
  total_value: number
  average_progress: number
}

// Componente para Cartão de Métrica
const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-lg p-6 border border-gray-200">
    <div className="flex items-center">
      <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center mr-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
    </div>
  </div>
);

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<SimpleProject[]>([])
  const [metrics, setMetrics] = useState<SimpleMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [healthFilter, setHealthFilter] = useState<string>('all')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchData = async () => {
        await loadProjectsAndMetrics();
    };
    fetchData();
  }, [])

  const loadProjectsAndMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, name, description, project_type, status, health, progress_percentage,
          total_budget, start_date, estimated_end_date, risk_level,
          client:clients(company_name),
          manager:team_members(full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Erro Supabase: ${error.message}`)
      
      setProjects(data || [])
      calculateMetrics(data || [])

    } catch (error: any) {
      setError(error.message)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (data: SimpleProject[]) => {
    const totalProjects = data.length
    const activeProjects = data.filter(p => p.status === 'Executando').length
    const criticalProjects = data.filter(p => p.health === 'Crítico').length
    const totalValue = data.reduce((sum, p) => sum + (p.total_budget || 0), 0)
    const totalProgress = data.reduce((sum, p) => sum + (p.progress_percentage || 0), 0)
    const averageProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0

    setMetrics({
      total_projects: totalProjects,
      active_projects: activeProjects,
      critical_projects: criticalProjects,
      total_value: totalValue,
      average_progress: averageProgress,
    })
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesType = typeFilter === 'all' || project.project_type === typeFilter
    const matchesHealth = healthFilter === 'all' || project.health === healthFilter

    return matchesSearch && matchesStatus && matchesType && matchesHealth
  })

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/D'
    return new Date(dateString).toLocaleDateString('pt-BR', {timeZone: 'UTC'})
  }
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Executando': return 'bg-blue-100 text-blue-800'
      case 'Pausado': return 'bg-yellow-100 text-yellow-800'
      case 'Concluído': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getHealthBadgeClass = (health: string) => {
    switch (health) {
        case 'Excelente': return 'bg-green-100 text-green-800'
        case 'Bom': return 'bg-blue-100 text-blue-800'
        case 'Crítico': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Erro ao Carregar Projetos</h2>
          <pre className="bg-red-100 text-red-700 p-4 rounded-md text-sm">{error}</pre>
          <button 
            onClick={loadProjectsAndMetrics}
            className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Projetos</h1>
          <p className="text-gray-600">Acompanhe o progresso e saúde dos seus projetos</p>
        </div>

        {/* Métricas */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <MetricCard title="Total de Projetos" value={metrics.total_projects} icon={FolderOpen} colorClass="bg-blue-500" />
            <MetricCard title="Projetos Ativos" value={metrics.active_projects} icon={CheckCircle} colorClass="bg-green-500" />
            <MetricCard title="Críticos" value={metrics.critical_projects} icon={AlertTriangle} colorClass="bg-red-500" />
            <MetricCard title="Valor Total" value={formatCurrency(metrics.total_value)} icon={DollarSign} colorClass="bg-purple-500" />
            <MetricCard title="Progresso Médio" value={`${metrics.average_progress}%`} icon={BarChart3} colorClass="bg-orange-500" />
          </div>
        )}

        {/* Filtros e Ações */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
                <div className="relative w-full lg:w-96">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar projetos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                {/* Outros filtros podem ser adicionados aqui */}
            </div>
        </div>

        {/* Lista de Projetos em Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div 
              key={project.id} 
              onClick={() => router.push(`/projetos/${project.id}`)}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg flex-1 mr-2">{project.name}</h3>
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getHealthBadgeClass(project.health)}`}>
                        {project.health}
                    </span>
                  </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 h-10 overflow-hidden">{project.description || 'Sem descrição.'}</p>

              <div className="space-y-3 text-sm mb-4">
                  <div className="flex justify-between">
                      <span className="text-gray-500">Cliente</span>
                      <span className="font-medium text-gray-800">{project.client?.company_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-500">Gerente</span>
                      <span className="font-medium text-gray-800">{project.manager?.full_name || 'N/A'}</span>
                  </div>
                   <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium ${getStatusBadgeClass(project.status)}`}>{project.status}</span>
                  </div>
                   <div className="flex justify-between">
                      <span className="text-gray-500">Prazo</span>
                      <span className="font-medium text-gray-800">{formatDate(project.estimated_end_date)}</span>
                  </div>
              </div>

              <div>
                  <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{project.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${project.progress_percentage}%` }}
                      ></div>
                  </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Estado Vazio */}
        {filteredProjects.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum projeto encontrado</h3>
              <p className="text-gray-600 mt-1">
                {projects.length === 0 ? 'Não há projetos para exibir.' : 'Tente ajustar seus filtros.'}
              </p>
            </div>
        )}
      </div>
    </div>
  )
}