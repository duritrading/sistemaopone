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

const InfoPair = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="py-2">
    <span className="text-gray-600 font-medium">{label}:</span>
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
        default: return 'bg-gray-100 text-gray-800'
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
        return 'bg-gray-100 text-gray-800'
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
      <p className="text-gray-600">Carregando projeto...</p>
    </div>
  </div>
)

// Componente de Erro
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar projeto</h2>
      <p className="text-gray-600 mb-6">{error}</p>
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

  // Estados
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Estados para Marcos e Entregáveis
  const [deliverableFilter, setDeliverableFilter] = useState('todos')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [responsibleFilter, setResponsibleFilter] = useState('todos')
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
    if (!dateString) return 'Não definido'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Funções de negócio
  const loadProjectData = async () => {
    try {
      setLoading(true)
      setError(null)

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
      console.error('Erro ao carregar projeto:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleNewActivity = async (formData: FormData) => {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const deadline = formData.get('deadline') as string
    const category = formData.get('category') as string

    const newActivity = {
      id: activities.length + 1,
      title,
      description,
      status: 'Em Andamento',
      deadline,
      responsible: 'Usuário Atual',
      version: 'v1.0',
      category,
      type: 'atividade'
    }

    setActivities([...activities, newActivity])
    setIsNewActivityModalOpen(false)
  }

  // Filtros
  const filteredItems = [...milestones, ...activities].filter(item => {
    if (deliverableFilter !== 'todos' && item.type !== deliverableFilter) return false
    if (typeFilter !== 'todos' && item.status !== typeFilter) return false
    if (responsibleFilter !== 'todos' && item.responsible !== responsibleFilter) return false
    return true
  })

  const uniqueResponsibles = Array.from(new Set([...milestones, ...activities].map(item => item.responsible)))

  // Renders condicionais
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorDisplay error={error} onRetry={loadProjectData} />
  if (!project) return <ErrorDisplay error="Projeto não encontrado" onRetry={loadProjectData} />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/projetos')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
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

          {/* Tabs */}
          <div className="flex space-x-6 mt-6">
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
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPI_Card
                title="Progresso"
                value={`${project.progress_percentage}%`}
                icon={BarChart3}
                subtitle="do projeto concluído"
                trend="up"
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
                value="1"
                icon={Target}
                subtitle="de 3 marcos"
                trend="up"
              />
              <KPI_Card
                title="Dias Restantes"
                value="15"
                icon={Clock}
                subtitle="até o prazo final"
                trend="down"
              />
            </div>

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
                  <InfoPair label="Próximo Marco" value={project.next_milestone} />
                </div>
              </InfoCard>
            </div>

            {/* Progresso visual */}
            <InfoCard title="Progresso do Projeto" icon={TrendingUp}>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progresso Geral</span>
                    <span>{project.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress_percentage}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                <div className="flex flex-wrap gap-4">
                  <select
                    value={deliverableFilter}
                    onChange={(e) => setDeliverableFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todos">Todos os Tipos</option>
                    <option value="marco">Marcos</option>
                    <option value="atividade">Atividades</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
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
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todos">Todos os Responsáveis</option>
                    {uniqueResponsibles.map(responsible => (
                      <option key={responsible} value={responsible}>{responsible}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setIsNewActivityModalOpen(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Atividade</span>
                </button>
              </div>
            </div>

            {/* Lista de Marcos e Atividades */}
            <div className="space-y-4">
              <InfoCard 
                title={`Marcos e Atividades (${filteredItems.length})`} 
                icon={CheckSquare}
              >
                <div className="space-y-4">
                  {filteredItems.length > 0 ? filteredItems.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{item.title}</h4>
                            <StatusBadge status={item.status} />
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.type === 'marco' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.type === 'marco' ? 'Marco' : 'Atividade'}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{item.description}</p>
                          
                          {/* Barra de progresso para marcos */}
                          {item.type === 'marco' && (
                            <div className="mb-3">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progresso</span>
                                <span>{item.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 font-medium">Prazo:</span>
                              <p className={`${new Date(item.deadline) < new Date() && item.status !== 'Concluído' ? 
                                'text-red-600' : 'text-gray-900'}`}>
                                {new Date(item.deadline).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600 font-medium">Responsável:</span>
                              <p className="text-gray-900">{item.responsible}</p>
                            </div>
                          </div>
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

      {/* Modal para Nova Atividade */}
      {isNewActivityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nova Atividade</h3>
              <button
                onClick={() => setIsNewActivityModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action={handleNewActivity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
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
                  placeholder="Descreva o entregável..."
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
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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