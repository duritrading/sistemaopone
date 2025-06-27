// src/app/projetos/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Search, Download, Filter, Eye, MoreHorizontal, Edit, FileText, Copy, Archive
} from 'lucide-react'
import { Project, ProjectMetrics, ProjectStatus, ProjectType, ProjectHealth } from '@/types/projects'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ProjectType | 'all'>('all')
  const [healthFilter, setHealthFilter] = useState<ProjectHealth | 'all'>('all')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadProjects()
    loadMetrics()
  }, [])

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, company_name, logo_url),
          manager:team_members(id, full_name, avatar_url, email),
          team_members:project_team_members(
            id,
            role,
            allocation_percentage,
            user:team_members(id, full_name, avatar_url)
          ),
          scope_items:project_scope_items(id, item_name, is_completed),
          technologies:project_technologies(id, technology_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Processar dados para formato esperado
      const processedProjects: Project[] = (data || []).map(project => ({
        ...project,
        health_status: project.health as ProjectHealth,
        remaining_budget: project.total_budget - project.used_budget,
        budget_percentage: project.total_budget > 0 ? Math.round((project.used_budget / project.total_budget) * 100) : 0,
        completed_milestones: project.scope_items?.filter((item: any) => item.is_completed).length || 0,
        total_milestones: project.scope_items?.length || 0,
        next_milestone: project.next_milestone ? {
          id: '1',
          name: project.next_milestone,
          due_date: project.next_milestone_date,
          is_overdue: project.next_milestone_date ? new Date(project.next_milestone_date) < new Date() : false
        } : undefined,
        days_remaining: project.estimated_end_date ? 
          Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0,
        is_overdue: project.estimated_end_date ? new Date(project.estimated_end_date) < new Date() : false,
        is_near_deadline: project.estimated_end_date ? 
          Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 15 : false,
        comments_count: 0,
        attachments_count: 0,
        team_members_count: project.team_members?.length || 0,
        scope_items: project.scope_items?.map((item: any) => item.item_name) || [],
        technologies: project.technologies?.map((tech: any) => tech.technology_name) || []
      }))

      setProjects(processedProjects)
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)

      if (error) throw error

      const totalProjects = projectsData?.length || 0
      const activeProjects = projectsData?.filter(p => p.status === 'Executando').length || 0
      const criticalProjects = projectsData?.filter(p => p.health === 'Crítico').length || 0
      const totalValue = projectsData?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0
      const totalProgress = projectsData?.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) || 0
      const averageProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0

      const metrics: ProjectMetrics = {
        total_projects: totalProjects,
        active_projects: activeProjects,
        completed_projects: projectsData?.filter(p => p.status === 'Concluído').length || 0,
        overdue_projects: projectsData?.filter(p => p.estimated_end_date && new Date(p.estimated_end_date) < new Date()).length || 0,
        critical_projects: criticalProjects,
        
        projects_by_status: {
          'Rascunho': projectsData?.filter(p => p.status === 'Rascunho').length || 0,
          'Proposta': projectsData?.filter(p => p.status === 'Proposta').length || 0,
          'Aprovado': projectsData?.filter(p => p.status === 'Aprovado').length || 0,
          'Executando': activeProjects,
          'Pausado': projectsData?.filter(p => p.status === 'Pausado').length || 0,
          'Concluído': projectsData?.filter(p => p.status === 'Concluído').length || 0,
          'Cancelado': projectsData?.filter(p => p.status === 'Cancelado').length || 0,
          'Crítico': criticalProjects
        },
        
        projects_by_health: {
          'Excelente': projectsData?.filter(p => p.health === 'Excelente').length || 0,
          'Bom': projectsData?.filter(p => p.health === 'Bom').length || 0,
          'Crítico': criticalProjects
        },
        
        projects_by_type: {
          'MVP': projectsData?.filter(p => p.project_type === 'MVP').length || 0,
          'PoC': projectsData?.filter(p => p.project_type === 'PoC').length || 0,
          'Implementação': projectsData?.filter(p => p.project_type === 'Implementação').length || 0,
          'Consultoria': projectsData?.filter(p => p.project_type === 'Consultoria').length || 0,
          'Suporte': projectsData?.filter(p => p.project_type === 'Suporte').length || 0
        },
        
        projects_by_risk: {
          'Baixo': projectsData?.filter(p => p.risk_level === 'Baixo').length || 0,
          'Médio': projectsData?.filter(p => p.risk_level === 'Médio').length || 0,
          'Alto': projectsData?.filter(p => p.risk_level === 'Alto').length || 0,
          'Crítico': projectsData?.filter(p => p.risk_level === 'Crítico').length || 0
        },
        
        total_budget: projectsData?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0,
        used_budget: projectsData?.reduce((sum, p) => sum + (p.used_budget || 0), 0) || 0,
        remaining_budget: projectsData?.reduce((sum, p) => sum + ((p.total_budget || 0) - (p.used_budget || 0)), 0) || 0,
        average_health_score: 0,
        
        completion_rate: averageProgress,
        on_time_delivery_rate: 0,
        budget_efficiency: 0,
        
        upcoming_deadlines: 0,
        overdue_milestones: 0,
        
        // Métricas específicas do OpOne
        total_value: totalValue,
        average_progress: averageProgress
      }

      setMetrics(metrics)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.company_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesType = typeFilter === 'all' || project.project_type === typeFilter
    const matchesHealth = healthFilter === 'all' || project.health_status === healthFilter

    return matchesSearch && matchesStatus && matchesType && matchesHealth
  })

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Crítico': return 'w-2 h-2 bg-red-500 rounded-full'
      case 'Executando': return 'w-2 h-2 bg-blue-500 rounded-full'
      case 'Pausado': return 'w-2 h-2 bg-yellow-500 rounded-full'
      case 'Concluído': return 'w-2 h-2 bg-green-500 rounded-full'
      case 'Aprovado': return 'w-2 h-2 bg-green-400 rounded-full'
      default: return 'w-2 h-2 bg-gray-500 rounded-full'
    }
  }

  const getStatusBadgeColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Crítico': return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Executando': return 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Pausado': return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Concluído': return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Aprovado': return 'bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium'
      default: return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium'
    }
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Alto': return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Médio': return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Baixo': return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Crítico': return 'bg-red-100 text-red-900 px-2 py-1 rounded-full text-xs font-medium'
      default: return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium'
    }
  }

  const handleProjectClick = (projectId: string) => {
    // Navegar para página de detalhes do projeto
    window.location.href = `/projetos/${projectId}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Projetos</h1>
          <p className="text-gray-600">Acompanhe o progresso e saúde dos seus projetos</p>
        </div>

        {/* Métricas - Layout exato do OpOne */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Projetos Ativos */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.active_projects}</div>
                  <div className="text-sm text-gray-600">Projetos Ativos</div>
                </div>
              </div>
            </div>

            {/* Críticos */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.critical_projects}</div>
                  <div className="text-sm text-gray-600">Críticos</div>
                </div>
              </div>
            </div>

            {/* Valor Total */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <div className="text-green-600 font-bold text-sm">R$</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.total_value)}</div>
                  <div className="text-sm text-gray-600">Valor Total</div>
                </div>
              </div>
            </div>

            {/* Média Progresso */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <div className="text-orange-600 font-bold text-sm">%</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.average_progress}%</div>
                  <div className="text-sm text-gray-600">Média Progresso</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Projetos */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lista de Projetos</h2>
            
            {/* Barra de Busca e Filtros - Layout exato do OpOne */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center flex-1">
                {/* Busca */}
                <div className="relative w-full lg:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar projetos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Filtros - Layout exato */}
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white min-w-0"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="Rascunho">Rascunho</option>
                    <option value="Proposta">Proposta</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Executando">Executando</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                    <option value="Crítico">Crítico</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as ProjectType | 'all')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="all">Todos os Tipos</option>
                    <option value="MVP">MVP</option>
                    <option value="PoC">PoC</option>
                    <option value="Implementação">Implementação</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Suporte">Suporte</option>
                  </select>

                  <select
                    value={healthFilter}
                    onChange={(e) => setHealthFilter(e.target.value as ProjectHealth | 'all')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="all">Todas as Saúdes</option>
                    <option value="Excelente">Excelente</option>
                    <option value="Bom">Bom</option>
                    <option value="Crítico">Crítico</option>
                  </select>

                  <button 
                    onClick={() => setShowMoreFilters(!showMoreFilters)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Mais Filtros
                  </button>
                </div>
              </div>

              {/* Botão Exportar */}
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* Lista de Projetos - Cards horizontais como no OpOne */}
          <div className="divide-y divide-gray-200">
            {filteredProjects.map(project => (
              <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                {/* Header do Card */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={getStatusColor(project.status)}></div>
                    <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
                    <span className={getStatusBadgeColor(project.project_type)}>
                      {project.project_type}
                    </span>
                    <span className={getStatusBadgeColor(project.status)}>
                      {project.status}
                    </span>
                    <span className={getRiskBadgeColor(project.risk_level)}>
                      Risco {project.risk_level.toLowerCase()}
                    </span>
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleProjectClick(project.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Archive className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Informações do Projeto - Layout como no OpOne */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Cliente</div>
                    <div className="font-medium text-gray-900">{project.client?.company_name}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Gerente</div>
                    <div className="font-medium text-gray-900">{project.manager?.full_name || 'Não atribuído'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Previsão Fim</div>
                    <div className="font-medium text-gray-900">{formatDate(project.estimated_end_date || '')}</div>
                    {project.is_overdue && (
                      <div className="text-xs text-red-600">{Math.abs(project.days_remaining)} dias atrasado</div>
                    )}
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Próximo Marco</div>
                    <div className="font-medium text-gray-900">{project.next_milestone?.name || 'Não definido'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Equipe</div>
                    <div className="font-medium text-gray-900">{project.team_members_count} pessoas</div>
                  </div>
                </div>

                {/* Progresso e Financeiro */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-gray-900">Progresso: {project.progress_percentage}%</span>
                      <span className="text-sm text-gray-600">Saldo: {formatCurrency(project.remaining_budget)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div 
                        className="bg-gray-900 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${project.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-6">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(project.used_budget)} / {formatCurrency(project.total_budget)}
                    </div>
                    <div className={`text-sm font-medium ${project.budget_percentage > 100 ? 'text-red-600' : project.budget_percentage > 80 ? 'text-orange-600' : 'text-green-600'}`}>
                      ({project.budget_percentage}% usado)
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Início: {formatDate(project.start_date || '')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Estado vazio */}
          {filteredProjects.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <FileText className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || healthFilter !== 'all'
                  ? 'Tente ajustar os filtros para encontrar projetos.'
                  : 'Comece criando seu primeiro projeto.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}