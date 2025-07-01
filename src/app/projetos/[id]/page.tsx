// src/app/projetos/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Edit, AlertTriangle, Calendar, Users, DollarSign, 
  Target, BarChart3, CheckCircle, FileText, Clock,
  CheckSquare, Loader2, AlertCircle,
  MessageSquare, Activity, TrendingUp, Eye, Plus, X, Edit3, Trash2
} from 'lucide-react'

// === INTERFACES ===
interface ProjectDetails {
  id: string
  name: string
  description?: string
  status: string
  health: string
  progress_percentage: number
  total_budget: number
  used_budget: number
  start_date?: string
  estimated_end_date?: string
  risk_level: string
  project_type: string
  next_milestone?: string
  client?: { id: string; company_name: string }
  manager?: { id: string; full_name: string }
}

interface Milestone {
  id: string
  project_id: string
  title: string
  description?: string
  status: string
  deadline: string
  responsible_id: string
  progress_percentage: number
  created_at: string
  updated_at: string
  responsible?: { full_name: string }
}

interface ProjectActivity {
  id: string
  project_id: string
  title: string
  description?: string
  status: string
  deadline: string
  responsible_id: string
  category: string
  version?: string
  created_at: string
  updated_at: string
  responsible?: { full_name: string }
}

interface ProjectKPIs {
  totalMilestones: number
  completedMilestones: number
  totalActivities: number
  completedActivities: number
  overallProgress: number
  daysRemaining: number
}

// === COMPONENTES DE UI ===
const KPI_Card = ({ title, value, icon: Icon, subtitle, trend }: {
  title: string
  value: string | number
  icon: any
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}) => (
  <div className="bg-white p-6 rounded-lg border border-gray-300 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-3 rounded-lg bg-gray-200">
          <Icon className="w-6 h-6 text-gray-800" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      {trend && (
        <div className={`p-2 rounded-full ${
          trend === 'up' ? 'bg-green-100' : 
          trend === 'down' ? 'bg-red-100' : 'bg-gray-200'
        }`}>
          <TrendingUp className={`w-4 h-4 ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600 rotate-180' : 'text-gray-700'
          }`} />
        </div>
      )}
    </div>
  </div>
)

const InfoCard = ({ title, icon: Icon, children, actions = null }: {
  title: string
  icon: any
  children: React.ReactNode
  actions?: React.ReactNode
}) => (
  <div className="bg-white rounded-lg border border-gray-300 p-6 hover:shadow-sm transition-shadow">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-800" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {actions}
    </div>
    <div>{children}</div>
  </div>
)

const InfoPair = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="py-2">
    <span className="text-gray-700 font-medium">{label}:</span>
    <span className="ml-2 text-gray-900">{value || 'Não informado'}</span>
  </div>
)

const StatusBadge = ({ status, type = 'status' }: { status: string; type?: string }) => {
  const getStatusConfig = () => {
    if (type === 'health') {
      switch (status) {
        case 'Verde': return 'bg-green-100 text-green-800'
        case 'Amarelo': return 'bg-yellow-100 text-yellow-800'
        case 'Vermelho': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-200 text-gray-800'
      }
    }
    
    switch (status) {
      case 'Ativo': case 'Em Andamento': case 'Aprovado': case 'Concluído':
        return 'bg-green-100 text-green-800'
      case 'Pausado': case 'Em Revisão': case 'Pendente':
        return 'bg-yellow-100 text-yellow-800'
      case 'Cancelado': case 'Atrasado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusConfig()}`}>
      {status}
    </span>
  )
}

// Componente de Loading
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-gray-700">Carregando projeto...</p>
    </div>
  </div>
)

// Componente de Erro
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar projeto</h2>
      <p className="text-gray-700 mb-6">{error}</p>
      <div className="space-x-4">
        <button 
          onClick={onRetry}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Activity className="w-4 h-4" />
          <span>Tentar Novamente</span>
        </button>
        <button 
          onClick={() => window.history.back()}
          className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
      </div>
    </div>
  </div>
)

// === COMPONENTE PRINCIPAL ===
export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  // Estados principais
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [activities, setActivities] = useState<ProjectActivity[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [kpis, setKpis] = useState<ProjectKPIs>({
    totalMilestones: 0,
    completedMilestones: 0,
    totalActivities: 0,
    completedActivities: 0,
    overallProgress: 0,
    daysRemaining: 0
  })
  
  // Estados de UI
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Estados para Filtros e Modais
  const [typeFilter, setTypeFilter] = useState('todos')
  const [responsibleFilter, setResponsibleFilter] = useState('todos')
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false)
  const [isNewMilestoneModalOpen, setIsNewMilestoneModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Effects
  useEffect(() => {
    if (projectId) {
      loadAllData()
    }
  }, [projectId])

  useEffect(() => {
    // Recalcular KPIs sempre que milestones ou activities mudarem
    calculateKPIs()
  }, [milestones, activities, project])

  // === FUNÇÕES DE DADOS ===
  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      await Promise.all([
        loadProjectData(),
        loadMilestones(),
        loadActivities(),
        loadTeamMembers()
      ])
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const loadProjectData = async () => {
    const { data, error: fetchError } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(id, company_name),
        manager:team_members(id, full_name)
      `)
      .eq('id', projectId)
      .single()

    if (fetchError) throw fetchError
    if (!data) throw new Error('Projeto não encontrado')

    setProject(data as ProjectDetails)
  }

  const loadMilestones = async () => {
    const { data, error: fetchError } = await supabase
      .from('project_milestones')
      .select(`
        *,
        responsible:team_members(full_name)
      `)
      .eq('project_id', projectId)
      .order('deadline', { ascending: true })

    if (fetchError) throw fetchError
    setMilestones(data || [])
  }

  const loadActivities = async () => {
    const { data, error: fetchError } = await supabase
      .from('project_activities')
      .select(`
        *,
        responsible:team_members(full_name)
      `)
      .eq('project_id', projectId)
      .order('deadline', { ascending: true })

    if (fetchError) throw fetchError
    setActivities(data || [])
  }

  const loadTeamMembers = async () => {
    const { data, error: fetchError } = await supabase
      .from('team_members')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name')

    if (fetchError) throw fetchError
    setTeamMembers(data || [])
  }

  // === CÁLCULO DE KPIs ===
  const calculateKPIs = () => {
    if (!project) return

    const completedMilestones = milestones.filter(m => m.status === 'Concluído').length
    const completedActivities = activities.filter(a => a.status === 'Concluído').length
    
    // Calcular progresso geral baseado nos entregáveis
    const totalItems = milestones.length + activities.length
    const completedItems = completedMilestones + completedActivities
    
    // Progresso considerando também progresso parcial dos marcos
    const milestonesProgress = milestones.reduce((sum, m) => sum + (m.progress_percentage || 0), 0)
    const activitiesProgress = activities.filter(a => a.status === 'Concluído').length * 100
    
    const overallProgress = totalItems > 0 
      ? Math.round((milestonesProgress + activitiesProgress) / (totalItems * 100) * 100)
      : 0

    // Calcular dias restantes
    const daysRemaining = project.estimated_end_date 
      ? Math.max(0, Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    setKpis({
      totalMilestones: milestones.length,
      completedMilestones,
      totalActivities: activities.length,
      completedActivities,
      overallProgress,
      daysRemaining
    })

    // Atualizar progresso do projeto no banco
    updateProjectProgress(overallProgress)
  }

  const updateProjectProgress = async (newProgress: number) => {
    if (project && project.progress_percentage !== newProgress) {
      const { error } = await supabase
        .from('projects')
        .update({ progress_percentage: newProgress })
        .eq('id', projectId)
      
      if (!error) {
        setProject({ ...project, progress_percentage: newProgress })
      }
    }
  }

  // === FUNÇÕES DE CRUD ===
  const handleNewActivity = async (formData: FormData) => {
    try {
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const deadline = formData.get('deadline') as string
      const category = formData.get('category') as string
      const responsibleId = formData.get('responsible_id') as string

      const { data, error } = await supabase
        .from('project_activities')
        .insert([{
          project_id: projectId,
          title,
          description,
          deadline,
          category,
          responsible_id: responsibleId,
          status: 'Pendente'
        }])
        .select(`
          *,
          responsible:team_members(full_name)
        `)
        .single()

      if (error) throw error

      setActivities([...activities, data])
      setIsNewActivityModalOpen(false)
    } catch (err) {
      console.error('Erro ao criar atividade:', err)
      alert('Erro ao criar atividade. Tente novamente.')
    }
  }

  const handleNewMilestone = async (formData: FormData) => {
    try {
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const deadline = formData.get('deadline') as string
      const responsibleId = formData.get('responsible_id') as string

      const { data, error } = await supabase
        .from('project_milestones')
        .insert([{
          project_id: projectId,
          title,
          description,
          deadline,
          responsible_id: responsibleId,
          status: 'Pendente',
          progress_percentage: 0
        }])
        .select(`
          *,
          responsible:team_members(full_name)
        `)
        .single()

      if (error) throw error

      setMilestones([...milestones, data])
      setIsNewMilestoneModalOpen(false)
    } catch (err) {
      console.error('Erro ao criar marco:', err)
      alert('Erro ao criar marco. Tente novamente.')
    }
  }

  const handleEditItem = (item: any) => {
    setEditingItem(item)
  }

  const handleUpdateItem = async (formData: FormData) => {
    if (!editingItem) return

    try {
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const deadline = formData.get('deadline') as string
      const status = formData.get('status') as string

      if (editingItem.type === 'marco') {
        const progress = parseInt(formData.get('progress') as string) || 0
        
        const { data, error } = await supabase
          .from('project_milestones')
          .update({
            title,
            description,
            deadline,
            status,
            progress_percentage: progress,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id)
          .select(`
            *,
            responsible:team_members(full_name)
          `)
          .single()

        if (error) throw error

        setMilestones(milestones.map(m => m.id === editingItem.id ? data : m))
      } else {
        const category = formData.get('category') as string
        
        const { data, error } = await supabase
          .from('project_activities')
          .update({
            title,
            description,
            deadline,
            status,
            category,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id)
          .select(`
            *,
            responsible:team_members(full_name)
          `)
          .single()

        if (error) throw error

        setActivities(activities.map(a => a.id === editingItem.id ? data : a))
      }

      setEditingItem(null)
    } catch (err) {
      console.error('Erro ao atualizar item:', err)
      alert('Erro ao atualizar item. Tente novamente.')
    }
  }

  const handleDeleteItem = async (item: any) => {
    if (!confirm(`Tem certeza que deseja excluir "${item.title}"?`)) return

    try {
      const table = item.type === 'marco' ? 'project_milestones' : 'project_activities'
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id)

      if (error) throw error

      if (item.type === 'marco') {
        setMilestones(milestones.filter(m => m.id !== item.id))
      } else {
        setActivities(activities.filter(a => a.id !== item.id))
      }
    } catch (err) {
      console.error('Erro ao excluir item:', err)
      alert('Erro ao excluir item. Tente novamente.')
    }
  }

  // === FUNÇÕES UTILITÁRIAS ===
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definido'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // === FILTROS ===
  const filteredMilestones = milestones.filter(item => {
    if (typeFilter !== 'todos' && item.status !== typeFilter) return false
    if (responsibleFilter !== 'todos' && item.responsible_id !== responsibleFilter) return false
    return true
  })

  const filteredActivities = activities.filter(item => {
    if (typeFilter !== 'todos' && item.status !== typeFilter) return false
    if (responsibleFilter !== 'todos' && item.responsible_id !== responsibleFilter) return false
    return true
  })

  // Renders condicionais
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorDisplay error={error} onRetry={loadAllData} />
  if (!project) return <ErrorDisplay error="Projeto não encontrado" onRetry={loadAllData} />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo */}
      <div className="bg-white border-b border-gray-300 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/projetos')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <StatusBadge status={project.status} />
                  <StatusBadge status={project.health} type="health" />
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push(`/projetos/${projectId}/edit`)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Editar Projeto</span>
            </button>
          </div>

          {/* KPIs dinâmicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 mb-6">
            <KPI_Card
              title="Progresso"
              value={`${kpis.overallProgress}%`}
              icon={BarChart3}
              subtitle="do projeto concluído"
              trend={kpis.overallProgress > 50 ? "up" : kpis.overallProgress > 25 ? "neutral" : "down"}
            />
            <KPI_Card
              title="Orçamento Usado"
              value={formatCurrency(project.used_budget)}
              icon={DollarSign}
              subtitle={`de ${formatCurrency(project.total_budget)}`}
              trend="neutral"
            />
            <KPI_Card
              title="Marcos Concluídos"
              value={kpis.completedMilestones}
              icon={Target}
              subtitle={`de ${kpis.totalMilestones} marcos`}
              trend={kpis.completedMilestones > 0 ? "up" : "neutral"}
            />
            <KPI_Card
              title="Dias Restantes"
              value={kpis.daysRemaining}
              icon={Clock}
              subtitle="até o prazo final"
              trend={kpis.daysRemaining > 30 ? "up" : kpis.daysRemaining > 7 ? "neutral" : "down"}
            />
          </div>

          {/* Tabs */}
          <div className="flex space-x-6">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'deliverables', label: 'Marcos e Entregáveis', icon: Target },
              { id: 'timeline', label: 'Cronograma', icon: Calendar },
              { id: 'communication', label: 'Comunicação', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Tab Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Cards de informações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InfoCard title="Informações do Projeto" icon={FileText}>
                <div className="space-y-2">
                  <InfoPair label="Descrição" value={project.description} />
                  <InfoPair label="Tipo" value={project.project_type} />
                  <InfoPair label="Nível de Risco" value={project.risk_level} />
                  <InfoPair label="Data de Início" value={formatDate(project.start_date)} />
                  <InfoPair label="Previsão de Término" value={formatDate(project.estimated_end_date)} />
                </div>
              </InfoCard>

              <InfoCard title="Equipe e Cliente" icon={Users}>
                <div className="space-y-2">
                  <InfoPair label="Cliente" value={project.client?.company_name} />
                  <InfoPair label="Gerente do Projeto" value={project.manager?.full_name} />
                  <InfoPair label="Total de Marcos" value={kpis.totalMilestones.toString()} />
                  <InfoPair label="Total de Atividades" value={kpis.totalActivities.toString()} />
                </div>
              </InfoCard>
            </div>

            {/* Progresso visual */}
            <InfoCard title="Progresso do Projeto" icon={TrendingUp}>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span>Progresso Geral (baseado em entregáveis)</span>
                    <span>{kpis.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${kpis.overallProgress}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span>Orçamento Utilizado</span>
                    <span>{Math.round((project.used_budget / project.total_budget) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(project.used_budget / project.total_budget) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>
        )}

        {/* Tab Marcos e Entregáveis */}
        {activeTab === 'deliverables' && (
          <div className="space-y-6">
            {/* Filtros e Ações */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                <div className="flex flex-wrap gap-4">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-400 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Atrasado">Atrasado</option>
                    <option value="Em Revisão">Em Revisão</option>
                    <option value="Aprovado">Aprovado</option>
                  </select>

                  <select
                    value={responsibleFilter}
                    onChange={(e) => setResponsibleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-400 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="todos">Todos os Responsáveis</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsNewMilestoneModalOpen(true)}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Marco</span>
                  </button>
                  <button
                    onClick={() => setIsNewActivityModalOpen(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Atividade</span>