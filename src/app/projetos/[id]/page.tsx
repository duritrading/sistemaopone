// src/app/projetos/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Edit, AlertTriangle, Calendar, Users, DollarSign, 
  Target, BarChart3, CheckCircle, FileText, Clock,
  CheckSquare, Loader2, AlertCircle,
  MessageSquare, Activity, TrendingUp, Eye, Plus, X
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

// === COMPONENTES DE UI ===
const KPI_Card = ({ title, value, icon: Icon, subtitle, trend }: {
  title: string
  value: string | number
  icon: any
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}) => (
  <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-3 rounded-lg bg-gray-100">
          <Icon className="w-6 h-6 text-gray-700" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {trend && (
        <div className={`p-2 rounded-full ${
          trend === 'up' ? 'bg-green-100' : 
          trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
        }`}>
          <TrendingUp className={`w-4 h-4 ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600 rotate-180' : 'text-gray-600'
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
  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      {actions}
    </div>
    <div>{children}</div>
  </div>
)

const InfoPair = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium text-gray-800">{value || 'N/D'}</p>
  </div>
)

const LoadingState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">Carregando projeto...</p>
        <p className="text-sm text-gray-600">Buscando informações detalhadas</p>
      </div>
    </div>
  </div>
)

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-4xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-xl font-semibold text-red-800">Erro ao Carregar Projeto</h2>
            <p className="text-red-700">Não foi possível carregar os detalhes do projeto.</p>
          </div>
        </div>
        
        <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-6">
          <pre className="text-red-700 text-sm whitespace-pre-wrap overflow-auto">{error}</pre>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={onRetry}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
  </div>
)

// === COMPONENTE PRINCIPAL ===
export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  // Estados
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Estados para Marcos e Entregáveis
  const [deliverableFilter, setDeliverableFilter] = useState('todos')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [responsibleFilter, setResponsibleFilter] = useState('todos')
  const [isNewMilestoneModalOpen, setIsNewMilestoneModalOpen] = useState(false)
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false)
  
  // Dados fictícios para demonstração
  const [milestones, setMilestones] = useState([
    {
      id: 1,
      title: 'MVP Funcional',
      description: 'Primeira versão funcional do sistema',
      status: 'Em Andamento',
      deadline: '2024-06-30',
      responsible: 'João Silva',
      progress: 75,
      type: 'marco'
    },
    {
      id: 2,
      title: 'Integração API Externa',
      description: 'Conectar com APIs de terceiros',
      status: 'Pendente',
      deadline: '2024-07-15',
      responsible: 'Maria Santos',
      progress: 0,
      type: 'marco'
    },
    {
      id: 3,
      title: 'Testes e Validação',
      description: 'Testes completos do sistema',
      status: 'Concluído',
      deadline: '2024-06-20',
      responsible: 'João Silva',
      progress: 100,
      type: 'marco'
    }
  ])
  
  const [activities, setActivities] = useState([
    {
      id: 1,
      title: 'Documentação Técnica',
      description: 'Documentação completa da arquitetura',
      status: 'Em Revisão',
      deadline: '2024-06-25',
      responsible: 'Maria Santos',
      version: 'v1.2',
      category: 'Documento',
      type: 'atividade'
    },
    {
      id: 2,
      title: 'API REST',
      description: 'Desenvolvimento da API principal',
      status: 'Aprovado',
      deadline: '2024-06-18',
      responsible: 'João Silva',
      version: 'v2.0',
      category: 'Código',
      type: 'atividade'
    },
    {
      id: 3,
      title: 'Dashboard Web',
      description: 'Interface web para visualização',
      status: 'Em Andamento',
      deadline: '2024-07-02',
      responsible: 'Maria Santos',
      version: 'v1.0',
      category: 'Interface',
      type: 'atividade'
    },
    {
      id: 4,
      title: 'Testes Automatizados',
      description: 'Suite de testes unitários e integração',
      status: 'Atrasado',
      deadline: '2024-06-22',
      responsible: 'João Silva',
      version: 'v1.0',
      category: 'Teste',
      type: 'atividade'
    }
  ])

  // Effects
  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  // Funções utilitárias
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/D'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getHealthConfig = (health: string) => {
    switch (health.toLowerCase()) {
      case 'excelente':
        return { text: 'Excelente', icon: CheckCircle, color: 'bg-green-100 text-green-800' }
      case 'bom':
        return { text: 'Bom', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' }
      case 'crítico':
        return { text: 'Crítico', icon: AlertTriangle, color: 'bg-red-100 text-red-800' }
      default:
        return { text: health, icon: AlertCircle, color: 'bg-gray-100 text-gray-800' }
    }
  }

  // Carregamento de dados
  const loadProjectData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Carregando projeto com ID:', projectId)

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, company_name),
          manager:team_members(id, full_name)
        `)
        .eq('id', projectId)
        .single()

      if (projectError) {
        console.error('Erro ao buscar projeto:', projectError)
        throw new Error(projectError.message)
      }

      if (!projectData) {
        throw new Error('Projeto não encontrado')
      }

      console.log('Projeto carregado:', projectData)
      setProject(projectData)

    } catch (err: any) {
      console.error('Erro ao carregar dados do projeto:', err)
      setError(err.message || 'Erro desconhecido ao carregar projeto')
    } finally {
      setLoading(false)
    }
  }

  // Cálculos derivados
  const healthConfig = project ? getHealthConfig(project.health) : null
  const daysRemaining = project?.estimated_end_date 
    ? Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const budgetUsed = project ? (project.used_budget / project.total_budget) * 100 : 0

  // Funções para filtros
  const getAllItems = () => [...milestones, ...activities]
  
  const getFilteredItems = () => {
    const allItems = getAllItems()
    return allItems.filter(item => {
      const matchesStatus = deliverableFilter === 'todos' || item.status === deliverableFilter
      const matchesType = typeFilter === 'todos' || item.type === typeFilter
      const matchesResponsible = responsibleFilter === 'todos' || item.responsible === responsibleFilter
      return matchesStatus && matchesType && matchesResponsible
    })
  }

  const getFilteredMilestones = () => {
    return milestones.filter(item => {
      const matchesStatus = deliverableFilter === 'todos' || item.status === deliverableFilter
      const matchesType = typeFilter === 'todos' || typeFilter === 'marco'
      const matchesResponsible = responsibleFilter === 'todos' || item.responsible === responsibleFilter
      return matchesStatus && matchesType && matchesResponsible
    })
  }

  const getFilteredActivities = () => {
    return activities.filter(item => {
      const matchesStatus = deliverableFilter === 'todos' || item.status === deliverableFilter
      const matchesType = typeFilter === 'todos' || typeFilter === 'atividade'
      const matchesResponsible = responsibleFilter === 'todos' || item.responsible === responsibleFilter
      return matchesStatus && matchesType && matchesResponsible
    })
  }

  // Cálculos para resumo
  const allItems = getAllItems()
  const summary = {
    completed: allItems.filter(item => item.status === 'Concluído' || item.status === 'Aprovado').length,
    inProgress: allItems.filter(item => item.status === 'Em Andamento' || item.status === 'Em Revisão').length,
    delayed: allItems.filter(item => item.status === 'Atrasado').length,
    total: allItems.length
  }

  // Funções para modais
  const handleNewMilestone = (milestoneData: any) => {
    const newMilestone = {
      id: milestones.length + 1,
      type: 'marco',
      progress: 0,
      status: 'Pendente',
      ...milestoneData
    }
    setMilestones([...milestones, newMilestone])
    setIsNewMilestoneModalOpen(false)
  }

  const handleNewActivity = (activityData: any) => {
    const newActivity = {
      id: activities.length + 1,
      type: 'atividade',
      status: 'Pendente',
      version: 'v1.0',
      ...activityData
    }
    setActivities([...activities, newActivity])
    setIsNewActivityModalOpen(false)
  }

  // Estados de carregamento e erro
  if (loading) return <LoadingState />
  if (error || !project) return <ErrorState error={error || 'Projeto não encontrado'} onRetry={loadProjectData} />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => router.push('/projetos')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Voltar para Projetos</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${healthConfig?.color}`}>
                {project.status}
              </span>
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Edit className="w-4 h-4" />
                <span>Editar Projeto</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-1">{project.description || 'Sem descrição disponível'}</p>
            </div>
            
            {/* KPIs principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPI_Card 
                title="Saúde do Projeto" 
                value={healthConfig?.text || 'N/D'} 
                icon={healthConfig?.icon || AlertCircle}
                trend={project.health === 'Crítico' ? 'down' : project.health === 'Excelente' ? 'up' : 'neutral'}
              />
              <KPI_Card 
                title="Progresso" 
                value={`${project.progress_percentage}%`} 
                icon={BarChart3}
                subtitle="Progresso geral"
              />
              <KPI_Card 
                title="Dias Restantes" 
                value={daysRemaining !== null ? (daysRemaining > 0 ? daysRemaining : 'Atrasado') : 'N/D'} 
                icon={Clock}
                trend={daysRemaining !== null && daysRemaining < 30 ? 'down' : 'neutral'}
              />
              <KPI_Card 
                title="Orçamento Usado" 
                value={`${Math.round(budgetUsed)}%`} 
                icon={DollarSign}
                subtitle={`${formatCurrency(project.used_budget)} de ${formatCurrency(project.total_budget)}`}
                trend={budgetUsed > 80 ? 'down' : 'neutral'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs de navegação */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Target },
              { id: 'timeline', label: 'Cronograma', icon: Calendar },
              { id: 'deliverables', label: 'Marcos e Entregáveis', icon: FileText },
              { id: 'communication', label: 'Comunicação', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo das tabs */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InfoCard title="Informações do Projeto" icon={Target}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoPair label="Tipo" value={project.project_type} />
                  <InfoPair label="Nível de Risco" value={project.risk_level} />
                  <InfoPair label="Cliente" value={project.client?.company_name} />
                  <InfoPair label="Gerente" value={project.manager?.full_name} />
                  <InfoPair label="Data de Início" value={formatDate(project.start_date)} />
                  <InfoPair label="Previsão de Fim" value={formatDate(project.estimated_end_date)} />
                  <InfoPair label="Próximo Marco" value={project.next_milestone} />
                  <InfoPair label="Status" value={project.status} />
                </div>
              </InfoCard>

              <InfoCard title="Progresso Financeiro" icon={DollarSign}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Orçamento Total</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(project.total_budget)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Usado</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(project.used_budget)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Restante</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(project.total_budget - project.used_budget)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        budgetUsed > 90 ? 'bg-red-500' : 
                        budgetUsed > 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {Math.round(budgetUsed)}% do orçamento utilizado
                  </p>
                </div>
              </InfoCard>
            </div>

            <div className="space-y-6">
              <InfoCard title="Status Geral" icon={Activity}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Saúde</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${healthConfig?.color}`}>
                      {healthConfig?.text}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Progresso</span>
                    <span className="font-semibold">{project.progress_percentage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Dias Restantes</span>
                    <span className={`font-semibold ${
                      daysRemaining !== null && daysRemaining < 0 ? 'text-red-600' :
                      daysRemaining !== null && daysRemaining < 30 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} dias` : 'Atrasado') : 'N/D'}
                    </span>
                  </div>
                </div>
              </InfoCard>

              <InfoCard title="Ações Rápidas" icon={Activity}>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Edit className="w-4 h-4" />
                    <span>Editar Projeto</span>
                  </button>
                  <button className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <FileText className="w-4 h-4" />
                    <span>Relatório</span>
                  </button>
                  <button className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    <Users className="w-4 h-4" />
                    <span>Gerenciar Equipe</span>
                  </button>
                </div>
              </InfoCard>
            </div>
          </div>
        )}

        {activeTab === 'deliverables' && (
          <div className="space-y-6">
            {/* Header com botões */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Marcos e Entregáveis</h3>
                <p className="text-sm text-gray-700">Gerencie atividades e marcos de entrega do projeto</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsNewMilestoneModalOpen(true)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
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

            {/* Resumo Geral no topo */}
            <InfoCard title="Resumo Geral" icon={BarChart3}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{summary.completed}</div>
                  <div className="text-sm text-gray-700 font-medium">Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{summary.inProgress}</div>
                  <div className="text-sm text-gray-700 font-medium">Em Andamento</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{summary.delayed}</div>
                  <div className="text-sm text-gray-700 font-medium">Atrasados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{summary.total}</div>
                  <div className="text-sm text-gray-700 font-medium">Total</div>
                </div>
              </div>
            </InfoCard>

            {/* Filtros */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-4">
                <select 
                  value={deliverableFilter}
                  onChange={(e) => setDeliverableFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Em Revisão">Em Revisão</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="marco">Marco</option>
                  <option value="atividade">Atividade</option>
                </select>
                <select 
                  value={responsibleFilter}
                  onChange={(e) => setResponsibleFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos os Responsáveis</option>
                  <option value="João Silva">João Silva</option>
                  <option value="Maria Santos">Maria Santos</option>
                </select>
                <div className="text-sm text-gray-700 ml-auto">
                  {getFilteredItems().length} de {allItems.length} itens
                </div>
              </div>
            </div>

            {/* Lista de Marcos e Entregáveis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Marcos */}
              <InfoCard title="Marcos do Projeto" icon={Target}>
                <div className="space-y-4">
                  {getFilteredMilestones().length > 0 ? getFilteredMilestones().map((milestone) => (
                    <div key={milestone.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                          <p className="text-sm text-gray-700 mt-1">{milestone.description}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          milestone.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                          milestone.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-800' :
                          milestone.status === 'Atrasado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {milestone.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 font-medium">Prazo:</span>
                          <p className="text-gray-900">{new Date(milestone.deadline).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Responsável:</span>
                          <p className="text-gray-900">{milestone.responsible}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-700 mb-1 font-medium">
                          <span>Progresso</span>
                          <span>{milestone.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              milestone.progress === 100 ? 'bg-green-600' :
                              milestone.progress > 50 ? 'bg-blue-600' : 'bg-yellow-600'
                            }`}
                            style={{ width: `${milestone.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-600 text-center py-4">Nenhum marco encontrado com os filtros aplicados.</p>
                  )}
                </div>
              </InfoCard>

              {/* Entregáveis */}
              <InfoCard title="Atividades e Entregáveis" icon={FileText}>
                <div className="space-y-4">
                  {getFilteredActivities().length > 0 ? getFilteredActivities().map((activity) => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              activity.category === 'Documento' ? 'bg-blue-100 text-blue-800' :
                              activity.category === 'Código' ? 'bg-purple-100 text-purple-800' :
                              activity.category === 'Interface' ? 'bg-green-100 text-green-800' :
                              activity.category === 'Teste' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.category}
                            </span>
                            <h4 className="font-medium text-gray-900">{activity.title}</h4>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          activity.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                          activity.status === 'Em Revisão' ? 'bg-yellow-100 text-yellow-800' :
                          activity.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
                          activity.status === 'Atrasado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 font-medium">Versão:</span>
                          <p className="text-gray-900">{activity.version}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Prazo:</span>
                          <p className={`${activity.status === 'Atrasado' ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(activity.deadline).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Responsável:</span>
                          <p className="text-gray-900">{activity.responsible}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-600 text-center py-4">Nenhuma atividade encontrada com os filtros aplicados.</p>
                  )}
                </div>
              </InfoCard>
            </div>
          </div>
        )}

        {/* Outras tabs com placeholder */}
        {activeTab !== 'overview' && activeTab !== 'deliverables' && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'timeline' && 'Cronograma em Desenvolvimento'}
              {activeTab === 'communication' && 'Central de Comunicação em Desenvolvimento'}
            </h3>
            <p className="text-gray-600">Esta funcionalidade será implementada na próxima versão.</p>
          </div>
        )}
      </div>

      {/* Modal para Novo Marco */}
      {isNewMilestoneModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Novo Marco</h2>
              <button 
                onClick={() => setIsNewMilestoneModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleNewMilestone({
                title: formData.get('title'),
                description: formData.get('description'),
                deadline: formData.get('deadline'),
                responsible: formData.get('responsible')
              })
            }}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título do Marco</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Ex: Deploy em Produção"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Descreva o marco do projeto..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                  <input
                    name="deadline"
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                  <select
                    name="responsible"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Selecione um responsável</option>
                    <option value="João Silva">João Silva</option>
                    <option value="Maria Santos">Maria Santos</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsNewMilestoneModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Criar Marco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Nova Atividade */}
      {isNewActivityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Nova Atividade</h2>
              <button 
                onClick={() => setIsNewActivityModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleNewActivity({
                title: formData.get('title'),
                description: formData.get('description'),
                deadline: formData.get('deadline'),
                responsible: formData.get('responsible'),
                category: formData.get('category')
              })
            }}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título da Atividade</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Ex: Implementar Autenticação"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="Documento">Documento</option>
                    <option value="Código">Código</option>
                    <option value="Interface">Interface</option>
                    <option value="Teste">Teste</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Descreva a atividade..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                  <input
                    name="deadline"
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                  <select
                    name="responsible"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Selecione um responsável</option>
                    <option value="João Silva">João Silva</option>
                    <option value="Maria Santos">Maria Santos</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsNewActivityModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Criar Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}