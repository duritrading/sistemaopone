// src/app/projetos/[id]/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Edit, AlertTriangle, Calendar, Users, DollarSign, 
  Target, BarChart3, CheckCircle, FileText, Clock,
  CheckSquare, Loader2, XSquare, Plus, AlertCircle,
  ShieldAlert, ShieldCheck, ShieldOff, MessageSquare,
  Eye, TrendingUp, Activity
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
  technologies: { id: string; name: string }[]
  team_members: { 
    role_in_project: string
    team_member: { full_name: string; primary_specialization: string }
  }[]
  scope_items: { id: string; title: string; status: string }[]
}

interface ProjectMilestone {
  id: string
  title: string
  due_date?: string
  start_date?: string
  status: string
  progress_percentage: number
  team_member?: { full_name: string }
}

interface ProjectDeliverable {
  id: string
  title: string
  description?: string
  type: string
  version: string
  status: string
  due_date?: string
  team_member?: { full_name: string }
}

interface ProjectRisk {
  id: string
  title: string
  probability: 'Baixa' | 'Média' | 'Alta'
  impact: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
  status: string
  team_member?: { full_name: string }
}

interface ProjectCommunication {
  id: string
  type: string
  title: string
  created_at: string
  participants: string[]
  content?: string
  sentiment?: string
  creator?: { full_name: string }
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
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([])
  const [risks, setRisks] = useState<ProjectRisk[]>([])
  const [communications, setCommunications] = useState<ProjectCommunication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Effects
  useEffect(() => {
    if (projectId) {
      loadAllData()
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

  // Carregamento de dados otimizado
  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Consulta otimizada com Promise.all para paralelização
      const [projectResult, milestonesResult, deliverablesResult, risksResult, commsResult] = await Promise.all([
        supabase
          .from('projects')
          .select(`
            *,
            client:clients(id, company_name),
            manager:team_members(id, full_name),
            technologies:project_technologies(id, name),
            scope_items:project_scope(id, title, status),
            team_members:project_team_members(role_in_project, team_member:team_members(full_name, primary_specialization))
          `)
          .eq('id', projectId)
          .single(),

        supabase
          .from('project_milestones')
          .select('*, team_member:team_members(full_name)')
          .eq('project_id', projectId)
          .order('due_date'),

        supabase
          .from('project_deliverables')
          .select('*, team_member:team_members(full_name)')
          .eq('project_id', projectId)
          .order('created_at'),

        supabase
          .from('project_risks')
          .select('*, team_member:team_members(full_name)')
          .eq('project_id', projectId)
          .order('created_at'),

        supabase
          .from('project_communications')
          .select('*, creator:team_members(full_name)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
      ])

      // Verificação de erros
      const errors = [projectResult.error, milestonesResult.error, deliverablesResult.error, risksResult.error, commsResult.error]
        .filter(Boolean)
      
      if (errors.length > 0) {
        throw new Error(errors.map(e => e?.message).join(', '))
      }

      // Configuração dos estados
      setProject(projectResult.data)
      setMilestones(milestonesResult.data || [])
      setDeliverables(deliverablesResult.data || [])
      setRisks(risksResult.data || [])
      setCommunications(commsResult.data || [])

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

  const actualProgress = useMemo(() => {
    if (!deliverables || deliverables.length === 0) return project?.progress_percentage || 0
    const approvedCount = deliverables.filter(d => d.status === 'Aprovado').length
    return Math.round((approvedCount / deliverables.length) * 100)
  }, [deliverables, project])

  const budgetUsed = project ? (project.used_budget / project.total_budget) * 100 : 0

  // Métricas calculadas
  const projectMetrics = {
    milestones: {
      completed: milestones.filter(m => m.status === 'Concluído').length,
      inProgress: milestones.filter(m => m.status === 'Em Andamento').length,
      overdue: milestones.filter(m => m.status === 'Atrasado').length,
      total: milestones.length
    },
    deliverables: {
      approved: deliverables.filter(d => d.status === 'Aprovado').length,
      inReview: deliverables.filter(d => d.status === 'Revisão').length,
      draft: deliverables.filter(d => d.status === 'Rascunho').length,
      total: deliverables.length
    },
    risks: {
      active: risks.filter(r => r.status === 'Ativo').length,
      mitigated: risks.filter(r => r.status === 'Mitigado').length,
      total: risks.length
    }
  }

  // Estados de carregamento e erro
  if (loading) return <LoadingState />
  if (error || !project) return <ErrorState error={error || 'Projeto não encontrado'} onRetry={loadAllData} />

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
              <p className="text-gray-600 mt-1">{project.description}</p>
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
                value={`${actualProgress}%`} 
                icon={BarChart3}
                subtitle={`${projectMetrics.deliverables.approved}/${projectMetrics.deliverables.total} entregáveis`}
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
              { id: 'deliverables', label: 'Entregáveis', icon: FileText },
              { id: 'risks', label: 'Riscos', icon: ShieldAlert },
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
                  <InfoPair label="Tecnologias" value={project.technologies?.map(t => t.name).join(', ')} />
                </div>
              </InfoCard>

              <InfoCard title="Escopo do Projeto" icon={CheckSquare}>
                <div className="space-y-3">
                  {project.scope_items?.length > 0 ? (
                    project.scope_items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-800">{item.title}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                          item.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhum item de escopo definido</p>
                  )}
                </div>
              </InfoCard>
            </div>

            <div className="space-y-6">
              <InfoCard title="Equipe do Projeto" icon={Users}>
                <div className="space-y-3">
                  {project.team_members?.length > 0 ? (
                    project.team_members.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{member.team_member.full_name}</p>
                          <p className="text-sm text-gray-600">{member.team_member.primary_specialization}</p>
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded">
                          {member.role_in_project}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhum membro atribuído</p>
                  )}
                </div>
              </InfoCard>

              <InfoCard title="Resumo de Atividades" icon={Activity}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Marcos</span>
                    <span className="font-semibold">{projectMetrics.milestones.completed}/{projectMetrics.milestones.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Entregáveis</span>
                    <span className="font-semibold">{projectMetrics.deliverables.approved}/{projectMetrics.deliverables.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Riscos Ativos</span>
                    <span className="font-semibold text-red-600">{projectMetrics.risks.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Comunicações</span>
                    <span className="font-semibold">{communications.length}</span>
                  </div>
                </div>
              </InfoCard>
            </div>
          </div>
        )}

        {/* Outras tabs seriam implementadas aqui */}
        {activeTab !== 'overview' && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'timeline' && 'Cronograma em Desenvolvimento'}
              {activeTab === 'deliverables' && 'Entregáveis em Desenvolvimento'}
              {activeTab === 'risks' && 'Gestão de Riscos em Desenvolvimento'}
              {activeTab === 'communication' && 'Central de Comunicação em Desenvolvimento'}
            </h3>
            <p className="text-gray-600">Esta funcionalidade será implementada na próxima versão.</p>
          </div>
        )}
      </div>
    </div>
  )
}