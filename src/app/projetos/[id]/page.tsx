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
  const [mounted, setMounted] = useState(false)
  
  // Estados para Filtros e Modais
  const [typeFilter, setTypeFilter] = useState('todos')
  const [responsibleFilter, setResponsibleFilter] = useState('todos')
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false)
  const [isNewMilestoneModalOpen, setIsNewMilestoneModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Effect para mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Effects
  useEffect(() => {
    if (projectId && mounted) {
      loadAllData()
    }
  }, [projectId, mounted])

  useEffect(() => {
    // Recalcular KPIs sempre que milestones ou activities mudarem
    if (mounted) {
      calculateKPIs()
    }
  }, [milestones, activities, project, mounted])

  // === FUNÇÕES DE DADOS ===
  const loadAllData = async () => {
    if (!mounted) return
    
    try {
      setLoading(true)
      setError(null)

      // Carregar dados sequencialmente para evitar conflitos
      await loadProjectData()
      await loadTeamMembers()
      await loadMilestones()
      await loadActivities()
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const loadProjectData = async () => {
    try {
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
    } catch (err) {
      throw err
    }
  }

  const loadMilestones = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('project_milestones')
        .select(`
          *,
          responsible:team_members(full_name)
        `)
        .eq('project_id', projectId)
        .order('deadline', { ascending: true })

      if (fetchError) {
        console.error('Erro ao carregar marcos:', fetchError)
        setMilestones([])
        return
      }
      setMilestones(data || [])
    } catch (err) {
      console.error('Erro ao carregar marcos:', err)
      setMilestones([])
    }
  }

  const loadActivities = async () => {
    try {
      // Usar project_deliverables em vez de project_activities
      const { data, error: fetchError } = await supabase
        .from('project_deliverables')
        .select(`
          *,
          responsible:team_members(full_name)
        `)
        .eq('project_id', projectId)
        .order('deadline', { ascending: true })

      if (fetchError) {
        console.error('Erro ao carregar atividades:', fetchError)
        setActivities([])
        return
      }
      setActivities(data || [])
    } catch (err) {
      console.error('Erro ao carregar atividades:', err)
      setActivities([])
    }
  }

  const loadTeamMembers = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name')

      if (fetchError) throw fetchError
      setTeamMembers(data || [])
    } catch (err) {
      console.error('Erro ao carregar membros da equipe:', err)
      setTeamMembers([])
    }
  }

  // === CÁLCULO DE KPIs ===
  const calculateKPIs = () => {
    if (!project || milestones.length === 0 && activities.length === 0) {
      setKpis({
        totalMilestones: 0,
        completedMilestones: 0,
        totalActivities: 0,
        completedActivities: 0,
        overallProgress: 0,
        daysRemaining: 0
      })
      return
    }

    const completedMilestones = milestones.filter(m => m.status === 'Concluído').length
    const completedActivities = activities.filter(a => a.status === 'Concluído').length
    
    // Calcular progresso geral baseado nos entregáveis
    const totalItems = milestones.length + activities.length
    
    // Progresso considerando progresso parcial dos marcos + atividades concluídas
    const milestonesProgress = milestones.reduce((sum, m) => sum + (m.progress_percentage || 0), 0)
    const activitiesProgress = activities.filter(a => a.status === 'Concluído').length * 100
    
    const overallProgress = totalItems > 0 
      ? Math.round((milestonesProgress + activitiesProgress) / (totalItems * 100) * 100)
      : 0

    // Calcular dias restantes
    const daysRemaining = project.estimated_end_date 
      ? Math.max(0, Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    const newKpis = {
      totalMilestones: milestones.length,
      completedMilestones,
      totalActivities: activities.length,
      completedActivities,
      overallProgress,
      daysRemaining
    }

    setKpis(newKpis)

    // Atualizar progresso do projeto no banco
    updateProjectProgress(overallProgress)
  }

  const updateProjectProgress = async (newProgress: number) => {
    if (project && project.progress_percentage !== newProgress) {
      try {
        const { error } = await supabase
          .from('projects')
          .update({ progress_percentage: newProgress })
          .eq('id', projectId)
        
        if (!error) {
          setProject({ ...project, progress_percentage: newProgress })
        }
      } catch (err) {
        console.error('Erro ao atualizar progresso:', err)
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

      // Usar project_deliverables ao invés de project_activities
      const { data, error } = await supabase
        .from('project_deliverables')
        .insert([{
          project_id: projectId,
          title,
          description,
          deadline,
          category,
          assigned_to: responsibleId, // Verificar se o campo é assigned_to ou responsible_id
          status: 'Pendente',
          type: 'activity'
        }])
        .select(`
          *,
          responsible:team_members(full_name)
        `)
        .single()

      if (error) {
        console.error('Erro detalhado:', error)
        alert(`Erro ao criar atividade: ${error.message}`)
        return
      }

      setActivities([...activities, data])
      setIsNewActivityModalOpen(false)
    } catch (err) {
      console.error('Erro ao criar atividade:', err)
      alert('Erro ao criar atividade. Verifique os dados e tente novamente.')
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
          assigned_to: responsibleId, // Verificar se o campo é assigned_to ou responsible_id
          status: 'Pendente',
          progress_percentage: 0
        }])
        .select(`
          *,
          responsible:team_members(full_name)
        `)
        .single()

      if (error) {
        console.error('Erro detalhado:', error)
        alert(`Erro ao criar marco: ${error.message}`)
        return
      }

      setMilestones([...milestones, data])
      setIsNewMilestoneModalOpen(false)
    } catch (err) {
      console.error('Erro ao criar marco:', err)
      alert('Erro ao criar marco. Verifique os dados e tente novamente.')
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

        if (error) {
          console.error('Erro detalhado:', error)
          alert(`Erro ao atualizar marco: ${error.message}`)
          return
        }

        setMilestones(milestones.map(m => m.id === editingItem.id ? data : m))
      } else {
        const category = formData.get('category') as string
        
        const { data, error } = await supabase
          .from('project_deliverables')
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

        if (error) {
          console.error('Erro detalhado:', error)
          alert(`Erro ao atualizar atividade: ${error.message}`)
          return
        }

        setActivities(activities.map(a => a.id === editingItem.id ? data : a))
      }

      setEditingItem(null)
    } catch (err) {
      console.error('Erro ao atualizar item:', err)
      alert('Erro ao atualizar item. Verifique os dados e tente novamente.')
    }
  }

  const handleDeleteItem = async (item: any) => {
    if (!confirm(`Tem certeza que deseja excluir "${item.title}"?`)) return

    try {
      const table = item.type === 'marco' ? 'project_milestones' : 'project_deliverables'
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id)

      if (error) {
        console.error('Erro detalhado:', error)
        alert(`Erro ao excluir item: ${error.message}`)
        return
      }

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
    if (!dateString || !mounted) return 'Não definido'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  const formatCurrency = (value: number) => {
    if (!mounted) return 'R$ 0,00'
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    } catch {
      return `R$ ${value.toFixed(2).replace('.', ',')}`
    }
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
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50"></div>
  }
  
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
              onClick={() => {
                // Verificar se a rota existe antes de navegar
                if (typeof window !== 'undefined') {
                  window.location.href = `/projetos/${projectId}/edit`
                }
              }}
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
                  </button>
                </div>
              </div>
            </div>

            {/* Colunas separadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna de Marcos */}
              <InfoCard 
                title={`Marcos (${filteredMilestones.length})`} 
                icon={Target}
              >
                <div className="space-y-4">
                  {filteredMilestones.length > 0 ? filteredMilestones.map((milestone) => (
                    <div key={milestone.id} className="border border-gray-300 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{milestone.title}</h4>
                            <StatusBadge status={milestone.status} />
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditItem({...milestone, type: 'marco'})}
                                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem({...milestone, type: 'marco'})}
                                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{milestone.description}</p>
                          
                          <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-700 mb-1">
                              <span>Progresso</span>
                              <span>{milestone.progress_percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${milestone.progress_percentage}%` }}
                              />
                            </div>
                          </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-700 font-medium">Prazo:</span>
                              <p className={`${new Date(milestone.deadline) < new Date() && milestone.status !== 'Concluído' ? 
                                'text-red-600' : 'text-gray-900'}`}>
                                {formatDate(milestone.deadline)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-700 font-medium">Responsável:</span>
                              <p className="text-gray-900">{milestone.responsible?.full_name || 'Não atribuído'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-700 text-center py-4">Nenhum marco encontrado com os filtros aplicados.</p>
                  )}
                </div>
              </InfoCard>

              {/* Coluna de Atividades */}
              <InfoCard 
                title={`Atividades (${filteredActivities.length})`} 
                icon={CheckSquare}
              >
                <div className="space-y-4">
                  {filteredActivities.length > 0 ? filteredActivities.map((activity) => (
                    <div key={activity.id} className="border border-gray-300 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{activity.title}</h4>
                            <StatusBadge status={activity.status} />
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {activity.category}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditItem({...activity, type: 'atividade'})}
                                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem({...activity, type: 'atividade'})}
                                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{activity.description}</p>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-700 font-medium">Prazo:</span>
                              <p className={`${new Date(activity.deadline) < new Date() && activity.status !== 'Concluído' ? 
                                'text-red-600' : 'text-gray-900'}`}>
                                {formatDate(activity.deadline)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-700 font-medium">Responsável:</span>
                              <p className="text-gray-900">{activity.responsible?.full_name || 'Não atribuído'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-700 text-center py-4">Nenhuma atividade encontrada com os filtros aplicados.</p>
                  )}
                </div>
              </InfoCard>
            </div>
          </div>
        )}

        {/* Outras tabs com placeholder */}
        {activeTab !== 'overview' && activeTab !== 'deliverables' && (
          <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'timeline' && 'Cronograma em Desenvolvimento'}
              {activeTab === 'communication' && 'Central de Comunicação em Desenvolvimento'}
            </h3>
            <p className="text-gray-700">Esta funcionalidade será implementada na próxima versão.</p>
          </div>
        )}
      </div>

      {/* Modal para Nova Atividade */}
      {isNewActivityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nova Atividade</h3>
              <button
                onClick={() => setIsNewActivityModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action={handleNewActivity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Título</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Ex: Implementar Autenticação"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Categoria</label>
                <select
                  name="category"
                  required
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="Documento">Documento</option>
                  <option value="Código">Código</option>
                  <option value="Interface">Interface</option>
                  <option value="Teste">Teste</option>
                  <option value="Infraestrutura">Infraestrutura</option>
                  <option value="Análise">Análise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Responsável</label>
                <select
                  name="responsible_id"
                  required
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Selecione um responsável</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Descrição</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Descreva a atividade..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Prazo</label>
                <input
                  name="deadline"
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Criar Atividade
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewActivityModalOpen(false)}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Novo Marco */}
      {isNewMilestoneModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Novo Marco</h3>
              <button
                onClick={() => setIsNewMilestoneModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action={handleNewMilestone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Título</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Ex: Lançamento Beta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Responsável</label>
                <select
                  name="responsible_id"
                  required
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Selecione um responsável</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Descrição</label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Descreva o marco..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Prazo</label>
                <input
                  name="deadline"
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Criar Marco
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewMilestoneModalOpen(false)}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Item */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar {editingItem.type === 'marco' ? 'Marco' : 'Atividade'}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Título</label>
                <input
                  name="title"
                  type="text"
                  required
                  defaultValue={editingItem.title}
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              
              {editingItem.type === 'atividade' && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Categoria</label>
                  <select
                    name="category"
                    required
                    defaultValue={editingItem.category}
                    className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="Documento">Documento</option>
                    <option value="Código">Código</option>
                    <option value="Interface">Interface</option>
                    <option value="Teste">Teste</option>
                    <option value="Infraestrutura">Infraestrutura</option>
                    <option value="Análise">Análise</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Descrição</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingItem.description}
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Status</label>
                <select
                  name="status"
                  required
                  defaultValue={editingItem.status}
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Em Revisão">Em Revisão</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>

              {editingItem.type === 'marco' && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Progresso (%)</label>
                  <input
                    name="progress"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={editingItem.progress_percentage}
                    className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Prazo</label>
                <input
                  name="deadline"
                  type="date"
                  required
                  defaultValue={editingItem.deadline}
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}