'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Search, Filter, Plus, Calendar, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { Project } from '@/types/projects'

type ProjectMetrics = {
  totalActive: number
  totalCritical: number
  totalValue: number
  averageProgress: number
}

export default function ProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [healthFilter, setHealthFilter] = useState<string>('todos')
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    totalActive: 0,
    totalCritical: 0,
    totalValue: 0,
    averageProgress: 0
  })

  const supabase = createClientComponentClient()

  const loadProjects = async () => {
    try {
      setLoading(true)
      console.log('Iniciando carregamento de projetos...')

      // Query mais simples para debug
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(
            id,
            name,
            company_name
          )
        `)
        .order('created_at', { ascending: false })

      console.log('Resposta da query:', { projectsData, projectsError })

      if (projectsError) {
        console.error('Erro na query de projetos:', projectsError)
        throw projectsError
      }

      if (!projectsData) {
        console.log('Nenhum projeto encontrado')
        setProjects([])
        return
      }

      console.log(`${projectsData.length} projetos carregados`)
      setProjects(projectsData as Project[])

      // Calcular métricas
      calculateMetrics(projectsData as Project[])

    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
      // Em caso de erro, não quebrar a página
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (projectsList: Project[]) => {
    const totalActive = projectsList.filter(p => p.status === 'active').length
    const totalCritical = projectsList.filter(p => p.health === 'critical').length
    const totalValue = projectsList.reduce((sum, p) => sum + (p.budget || 0), 0)
    const averageProgress = projectsList.length > 0 
      ? Math.round(projectsList.reduce((sum, p) => sum + (p.progress || 0), 0) / projectsList.length)
      : 0

    setMetrics({
      totalActive,
      totalCritical,
      totalValue,
      averageProgress
    })
  }

  useEffect(() => {
    loadProjects()
  }, [])

  // Filtros
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'todos' || project.status === statusFilter
    const matchesHealth = healthFilter === 'todos' || project.health === healthFilter
    
    return matchesSearch && matchesStatus && matchesHealth
  })

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-100 text-green-700 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'planning': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'completed': return 'bg-green-100 text-green-700 border-green-200'
      case 'paused': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-2 w-64"></div>
          <div className="h-4 bg-gray-200 rounded mb-8 w-96"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-24"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Projetos</h1>
        <p className="text-gray-600">Acompanhe o progresso e saúde dos seus projetos</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalActive}</p>
              <p className="text-sm text-gray-600">Projetos Ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalCritical}</p>
              <p className="text-sm text-gray-600">Críticos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalValue)}</p>
              <p className="text-sm text-gray-600">Valor Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <div className="h-6 w-6 flex items-center justify-center text-orange-600 font-bold">%</div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.averageProgress}%</p>
              <p className="text-sm text-gray-600">Média Progresso</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Projetos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Lista de Projetos</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors">
              <Plus className="h-4 w-4" />
              Novo Projeto
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos Status</option>
              <option value="active">Ativo</option>
              <option value="planning">Planejamento</option>
              <option value="completed">Concluído</option>
              <option value="paused">Pausado</option>
              <option value="cancelled">Cancelado</option>
            </select>

            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todas Saúdes</option>
              <option value="healthy">Saudável</option>
              <option value="warning">Atenção</option>
              <option value="critical">Crítico</option>
            </select>

            <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Mais Filtros
            </button>
          </div>
        </div>

        <div className="p-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {projects.length === 0 ? 'Nenhum projeto encontrado' : 'Nenhum projeto corresponde aos filtros'}
              </h3>
              <p className="text-gray-600">
                {projects.length === 0 
                  ? 'Comece criando seu primeiro projeto.' 
                  : 'Tente ajustar os filtros para encontrar o que procura.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {project.status === 'active' && 'Ativo'}
                        {project.status === 'planning' && 'Planejamento'}
                        {project.status === 'completed' && 'Concluído'}
                        {project.status === 'paused' && 'Pausado'}
                        {project.status === 'cancelled' && 'Cancelado'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getHealthColor(project.health)}`}>
                        {project.health === 'healthy' && 'Saudável'}
                        {project.health === 'warning' && 'Atenção'}
                        {project.health === 'critical' && 'Crítico'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {project.budget ? formatCurrency(project.budget) : 'Não definido'}
                      </p>
                      <p className="text-sm text-gray-600">Orçamento</p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">{project.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <span>Cliente: {project.client?.company_name || project.client?.name || 'Não definido'}</span>
                      <span>Início: {project.start_date ? formatDate(project.start_date) : 'Não definido'}</span>
                      <span>Fim: {project.end_date ? formatDate(project.end_date) : 'Não definido'}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{project.progress || 0}%</p>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}