'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Edit, Share2, MoreHorizontal, AlertTriangle, 
  Calendar, Users, Clock, DollarSign, Target, TrendingUp, FileText,
  MessageSquare, BarChart3, CheckCircle, Plus, Eye, Download,
  ExternalLink, User, Mail, Phone, Building, MapPin, Tag,
  Activity, Zap, Code, Database, Palette, Smartphone
} from 'lucide-react'

// Interfaces completas
interface Project {
  id: string
  name: string
  description?: string
  project_type: string
  status: string
  health: string
  health_score: number
  client_id?: string
  manager_id?: string
  start_date?: string
  estimated_end_date?: string
  actual_end_date?: string
  total_budget: number
  used_budget: number
  progress_percentage: number
  next_milestone?: string
  next_milestone_date?: string
  risk_level: string
  is_active: boolean
  created_at: string
  updated_at: string
  client?: {
    id: string
    company_name: string
    email?: string
  }
  manager?: {
    id: string
    full_name: string
    email: string
  }
}

interface ProjectMilestone {
  id: string
  project_id: string
  title: string
  description?: string
  due_date?: string
  completed_date?: string
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  assigned_to?: string
  progress_percentage: number
}

interface ProjectRisk {
  id: string
  project_id: string
  title: string
  description: string
  probability: 'baixo' | 'medio' | 'alto'
  impact: 'baixo' | 'medio' | 'alto' | 'critico'
  status: 'ativo' | 'mitigado' | 'fechado'
  mitigation_plan?: string
  owner?: string
  due_date?: string
  created_at: string
}

interface ProjectDeliverable {
  id: string
  project_id: string
  title: string
  description?: string
  type: 'documento' | 'codigo' | 'design' | 'relatorio' | 'apresentacao'
  version: string
  status: 'rascunho' | 'revisao' | 'aprovado' | 'rejeitado'
  due_date?: string
  assigned_to?: string
  file_url?: string
  created_at: string
}

interface ProjectCommunication {
  id: string
  project_id: string
  type: 'reuniao' | 'email' | 'escalacao' | 'decisao'
  title: string
  content: string
  participants: string[]
  created_by: string
  created_at: string
  follow_up_actions?: string[]
}

interface TeamMember {
  id: string
  full_name: string
  email: string
  role?: string
  allocation_percentage?: number
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [risks, setRisks] = useState<ProjectRisk[]>([])
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([])
  const [communications, setCommunications] = useState<ProjectCommunication[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (projectId) {
      loadAllData()
    }
  }, [projectId])

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Carregar projeto principal
      await loadProject()
      
      // Carregar dados relacionados em paralelo
      await Promise.all([
        loadMilestones(),
        loadRisks(), 
        loadDeliverables(),
        loadCommunications(),
        loadTeamMembers()
      ])
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(id, company_name, email),
        manager:team_members(id, full_name, email)
      `)
      .eq('id', projectId)
      .single()

    if (error) throw new Error(`Erro ao carregar projeto: ${error.message}`)
    setProject(data)
  }

  const loadMilestones = async () => {
    // Por enquanto, dados simulados - implementar tabela no futuro
    const mockMilestones: ProjectMilestone[] = [
      {
        id: '1',
        project_id: projectId,
        title: 'Discovery e Levantamento de Requisitos',
        description: 'Análise completa dos requisitos funcionais e não-funcionais',
        due_date: '2024-03-28',
        completed_date: '2024-03-28',
        status: 'completed',
        assigned_to: 'João Silva',
        progress_percentage: 100
      },
      {
        id: '2', 
        project_id: projectId,
        title: 'Arquitetura e Design da Solução',
        description: 'Definição da arquitetura técnica e design system',
        due_date: '2024-04-15',
        completed_date: '2024-04-14',
        status: 'completed',
        assigned_to: 'Maria Santos',
        progress_percentage: 100
      },
      {
        id: '3',
        project_id: projectId,
        title: 'Preparação e Processamento de Dados',
        description: 'Setup de pipeline de dados e preprocessing',
        due_date: '2024-05-01',
        status: 'in_progress',
        assigned_to: 'Pedro Costa',
        progress_percentage: 85
      },
      {
        id: '4',
        project_id: projectId,
        title: 'Desenvolvimento do Modelo ML',
        description: 'Implementação e treinamento do modelo de recomendação',
        due_date: '2024-05-20',
        status: 'in_progress',
        assigned_to: 'Ana Silva',
        progress_percentage: 45
      },
      {
        id: '5',
        project_id: projectId,
        title: 'Desenvolvimento da API',
        description: 'Criação das APIs RESTful para integração',
        due_date: '2024-06-10',
        status: 'pending',
        assigned_to: 'Carlos Lima',
        progress_percentage: 0
      }
    ]
    setMilestones(mockMilestones)
  }

  const loadRisks = async () => {
    const mockRisks: ProjectRisk[] = [
      {
        id: '1',
        project_id: projectId,
        title: 'Atraso na entrega do modelo de IA',
        description: 'Implementação do desenvolvimento paralelo e testes antecipados',
        probability: 'alto',
        impact: 'medio',
        status: 'ativo',
        mitigation_plan: 'Implementar desenvolvimento paralelo e testes antecipados',
        owner: 'João Silva',
        due_date: '2024-05-01',
        created_at: '2024-03-15'
      }
    ]
    setRisks(mockRisks)
  }

  const loadDeliverables = async () => {
    const mockDeliverables: ProjectDeliverable[] = [
      {
        id: '1',
        project_id: projectId,
        title: 'Documento de Requisitos',
        description: 'Especificação completa dos requisitos funcionais e não-funcionais',
        type: 'documento',
        version: 'v2.1',
        status: 'aprovado',
        due_date: '2024-03-14',
        assigned_to: 'João Silva',
        created_at: '2024-03-10'
      },
      {
        id: '2',
        project_id: projectId,
        title: 'Protótipo de Interface',
        description: 'Protótipo interativo das principais telas do sistema',
        type: 'design',
        version: 'v1.0',
        status: 'revisao',
        due_date: '2024-04-19',
        assigned_to: 'Maria Santos',
        created_at: '2024-04-01'
      },
      {
        id: '3',
        project_id: projectId,
        title: 'Código-fonte MVP',
        description: 'Implementação inicial das funcionalidades principais',
        type: 'codigo',
        version: 'v0.8',
        status: 'rascunho',
        assigned_to: 'Pedro Costa',
        created_at: '2024-04-10'
      }
    ]
    setDeliverables(mockDeliverables)
  }

  const loadCommunications = async () => {
    const mockCommunications: ProjectCommunication[] = [
      {
        id: '1',
        project_id: projectId,
        type: 'escalacao',
        title: 'Atraso na Entrega de Dados',
        content: 'Cliente não forneceu os dados necessários no prazo acordado.',
        participants: ['João Silva', 'Gerente Cliente'],
        created_by: 'João Silva',
        created_at: '2024-03-19',
        follow_up_actions: ['Definir novo prazo', 'Ajustar cronograma']
      },
      {
        id: '2',
        project_id: projectId,
        type: 'email',
        title: 'Mudança nos Requisitos',
        content: 'Cliente solicitou alteração na funcionalidade de autenticação.',
        participants: ['Maria Santos', 'Equipe Técnica'],
        created_by: 'Maria Santos',
        created_at: '2024-03-17',
        follow_up_actions: ['Revisar impacto no cronograma']
      }
    ]
    setCommunications(mockCommunications)
  }

  const loadTeamMembers = async () => {
    const mockTeam: TeamMember[] = [
      {
        id: '1',
        full_name: 'João Silva',
        email: 'joao@empresa.com',
        role: 'Gerente',
        allocation_percentage: 50
      },
      {
        id: '2',
        full_name: 'Maria Santos',
        email: 'maria@empresa.com', 
        role: 'Data Scientist',
        allocation_percentage: 100
      }
    ]
    setTeamMembers(mockTeam)
  }

  // Cálculos de métricas
  const calculateMetrics = () => {
    if (!project) return null

    const totalDays = project.estimated_end_date ? 
      Math.ceil((new Date(project.estimated_end_date).getTime() - new Date(project.start_date || '').getTime()) / (1000 * 60 * 60 * 24)) : 0
    
    const remainingDays = project.estimated_end_date ?
      Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0

    const completedMilestones = milestones.filter(m => m.status === 'completed').length
    const totalMilestones = milestones.length
    const inProgressMilestones = milestones.filter(m => m.status === 'in_progress').length
    const delayedMilestones = milestones.filter(m => m.status === 'delayed').length

    const activeRisks = risks.filter(r => r.status === 'ativo').length
    const mitigatedRisks = risks.filter(r => r.status === 'mitigado').length
    
    const approvedDeliverables = deliverables.filter(d => d.status === 'aprovado').length
    const inReviewDeliverables = deliverables.filter(d => d.status === 'revisao').length
    const draftDeliverables = deliverables.filter(d => d.status === 'rascunho').length

    const meetings = communications.filter(c => c.type === 'reuniao').length
    const escalations = communications.filter(c => c.type === 'escalacao').length

    return {
      remainingDays,
      completedMilestones,
      totalMilestones, 
      inProgressMilestones,
      delayedMilestones,
      activeRisks,
      mitigatedRisks,
      approvedDeliverables,
      inReviewDeliverables,
      draftDeliverables,
      meetings,
      escalations
    }
  }

  const metrics = calculateMetrics()

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Target },
    { id: 'timeline', label: 'Cronograma', icon: Calendar },
    { id: 'risks', label: 'Riscos', icon: AlertTriangle },
    { id: 'deliverables', label: 'Entregáveis', icon: FileText },
    { id: 'communication', label: 'Comunicação', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'calendar', label: 'Calendário', icon: Calendar }
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definido'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Executando': return 'text-blue-600 bg-blue-100'
      case 'Pausado': return 'text-yellow-600 bg-yellow-100'
      case 'Concluído': return 'text-green-600 bg-green-100'
      case 'Aprovado': return 'text-green-600 bg-green-100'
      case 'Cancelado': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Excelente': return 'text-green-600 bg-green-100'
      case 'Bom': return 'text-blue-600 bg-blue-100'
      case 'Crítico': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'baixo': return 'bg-green-100 text-green-800'
      case 'medio': return 'bg-yellow-100 text-yellow-800'
      case 'alto': return 'bg-orange-100 text-orange-800'
      case 'critico': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDeliverableStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800'
      case 'revisao': return 'bg-yellow-100 text-yellow-800'
      case 'rascunho': return 'bg-gray-100 text-gray-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCommunicationTypeColor = (type: string) => {
    switch (type) {
      case 'escalacao': return 'bg-red-100 text-red-800'
      case 'email': return 'bg-blue-100 text-blue-800'
      case 'reuniao': return 'bg-green-100 text-green-800'
      case 'decisao': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Erro ao carregar projeto</h2>
            <p className="text-red-700 mb-4">{error || 'Projeto não encontrado'}</p>
            <button 
              onClick={() => router.push('/projetos')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Voltar para Projetos
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/projetos')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <div className="text-sm text-gray-600">{project.client?.company_name}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
              <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar Projeto
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Saúde</div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(project.health)}`}>
                  {project.health}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Progresso</div>
                <div className="text-2xl font-bold text-gray-900">{project.progress_percentage}%</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Dias Restantes</div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics?.remainingDays || '--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Visão Geral */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações do Projeto */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Informações do Projeto</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Objetivo</div>
                    <div className="text-gray-900">{project.description || 'Desenvolver sistema de recomendação para produtos financeiros usando ML'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Tipo</div>
                      <div className="font-medium text-gray-900">{project.project_type}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Nível de Risco</div>
                      <div className="font-medium text-gray-900">{project.risk_level}</div>
                    </div>
                  </div>
                  {project.next_milestone && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Próximo Marco</div>
                      <div className="font-medium text-gray-900">{project.next_milestone}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Informações Financeiras</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Orçamento Total</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(project.total_budget)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Valor Utilizado</div>
                    <div className="text-xl font-semibold text-gray-900">{formatCurrency(project.used_budget)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Progresso Financeiro</div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gray-900 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.round((project.used_budget / project.total_budget) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {Math.round((project.used_budget / project.total_budget) * 100)}% utilizado
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cronograma */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Cronograma</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Data de Início</div>
                      <div className="font-medium text-gray-900">{formatDate(project.start_date)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Previsão de Fim</div>
                      <div className="font-medium text-gray-900">{formatDate(project.estimated_end_date)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Progresso Geral</div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gray-900 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${project.progress_percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{project.progress_percentage}% concluído</div>
                  </div>
                </div>
              </div>

              {/* Equipe */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Equipe</h3>
                </div>
                <div className="space-y-3">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{member.full_name}</div>
                        <div className="text-sm text-gray-600">{member.role}</div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.allocation_percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Escopo e Tecnologias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Escopo do Projeto</h3>
                <div className="text-gray-700">
                  Sistema completo de recomendação de produtos financeiros com machine learning, 
                  incluindo coleta de dados, processamento, treinamento de modelos e interface web.
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tecnologias</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Python', icon: Code },
                    { name: 'React', icon: Palette },
                    { name: 'PostgreSQL', icon: Database },
                    { name: 'AWS', icon: Zap },
                    { name: 'Docker', icon: Activity }
                  ].map(tech => {
                    const Icon = tech.icon
                    return (
                      <span key={tech.name} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        <Icon className="w-3 h-3" />
                        {tech.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cronograma */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Cronograma do Projeto</h3>
                  <p className="text-gray-600">Gráfico de Gantt e marcos principais</p>
                </div>
                <button className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Novo Marco
                </button>
              </div>

              {/* Métricas de marcos */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics?.completedMilestones}</div>
                  <div className="text-sm text-gray-600">Marcos Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics?.inProgressMilestones}</div>
                  <div className="text-sm text-gray-600">Em Andamento</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{metrics?.remainingDays}</div>
                  <div className="text-sm text-gray-600">Dias Restantes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{metrics?.delayedMilestones}</div>
                  <div className="text-sm text-gray-600">Marcos Atrasados</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-8">
                <h4 className="font-medium text-gray-900 mb-4">Gráfico de Gantt</h4>
                <div className="space-y-3">
                  {milestones.map(milestone => (
                    <div key={milestone.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        milestone.status === 'completed' ? 'bg-green-500' :
                        milestone.status === 'in_progress' ? 'bg-blue-500' :
                        milestone.status === 'delayed' ? 'bg-red-500' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{milestone.title}</div>
                        <div className="text-sm text-gray-600">{milestone.description}</div>
                        <div className="text-sm text-gray-500">Responsável: {milestone.assigned_to}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {milestone.status === 'completed' ? '100%' : `${milestone.progress_percentage}%`}
                        </div>
                        <div className="text-sm text-gray-600">{formatDate(milestone.due_date)}</div>
                      </div>
                      <div className="w-24">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              milestone.status === 'completed' ? 'bg-green-500' :
                              milestone.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${milestone.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marcos e Entregas */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Marcos e Entregas</h4>
                <div className="space-y-4">
                  {milestones.filter(m => m.status === 'completed').map(milestone => (
                    <div key={milestone.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-gray-900">{milestone.title}</div>
                          <div className="text-sm text-gray-600">Responsável: {milestone.assigned_to}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">concluído</div>
                        <div className="text-sm text-gray-600">{formatDate(milestone.completed_date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Riscos */}
        {activeTab === 'risks' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gestão de Riscos</h3>
                  <p className="text-gray-600">Identifique, avalie e mitigue os riscos do projeto</p>
                </div>
                <button className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Novo Risco
                </button>
              </div>

              {/* Métricas de riscos */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{metrics?.activeRisks}</div>
                  <div className="text-sm text-gray-600">Riscos Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">51</div>
                  <div className="text-sm text-gray-600">Risco Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics?.mitigatedRisks}</div>
                  <div className="text-sm text-gray-600">Mitigados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">0</div>
                  <div className="text-sm text-gray-600">Ocorridos</div>
                </div>
              </div>

              {/* Matriz de Probabilidade vs Impacto */}
              <div className="mb-8">
                <h4 className="font-medium text-gray-900 mb-4">Matriz de Probabilidade vs Impacto</h4>
                <div className="grid grid-cols-6 gap-1 text-center text-xs">
                  <div></div>
                  <div className="p-2 font-medium">0-20%</div>
                  <div className="p-2 font-medium">21-40%</div>
                  <div className="p-2 font-medium">41-60%</div>
                  <div className="p-2 font-medium">61-80%</div>
                  <div className="p-2 font-medium">81-100%</div>
                  
                  <div className="p-2 font-medium">81-100%</div>
                  <div className="p-4 bg-green-200"></div>
                  <div className="p-4 bg-yellow-200"></div>
                  <div className="p-4 bg-yellow-300"></div>
                  <div className="p-4 bg-red-300"></div>
                  <div className="p-4 bg-red-400"></div>
                  
                  <div className="p-2 font-medium">61-80%</div>
                  <div className="p-4 bg-green-200"></div>
                  <div className="p-4 bg-green-300"></div>
                  <div className="p-4 bg-yellow-300 flex items-center justify-center">1</div>
                  <div className="p-4 bg-yellow-400"></div>
                  <div className="p-4 bg-red-400"></div>
                  
                  <div className="p-2 font-medium">41-60%</div>
                  <div className="p-4 bg-green-200"></div>
                  <div className="p-4 bg-green-300"></div>
                  <div className="p-4 bg-green-400"></div>
                  <div className="p-4 bg-yellow-400 flex items-center justify-center">1</div>
                  <div className="p-4 bg-yellow-500"></div>
                  
                  <div className="p-2 font-medium">21-40%</div>
                  <div className="p-4 bg-green-200"></div>
                  <div className="p-4 bg-green-300"></div>
                  <div className="p-4 bg-green-400"></div>
                  <div className="p-4 bg-green-400"></div>
                  <div className="p-4 bg-yellow-400"></div>
                  
                  <div className="p-2 font-medium">1-20%</div>
                  <div className="p-4 bg-green-200"></div>
                  <div className="p-4 bg-green-300"></div>
                  <div className="p-4 bg-green-400"></div>
                  <div className="p-4 bg-green-400"></div>
                  <div className="p-4 bg-green-500"></div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-300 rounded"></div>
                    <span>Baixo (0-39)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                    <span>Médio (40-69)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-300 rounded"></div>
                    <span>Alto (70-100)</span>
                  </div>
                </div>
              </div>

              {/* Lista de Riscos */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Lista de Riscos</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">Descrição</th>
                        <th className="text-left py-3 px-4">Probabilidade</th>
                        <th className="text-left py-3 px-4">Impacto</th>
                        <th className="text-left py-3 px-4">Nível</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Responsável</th>
                        <th className="text-left py-3 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {risks.map(risk => (
                        <tr key={risk.id} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{risk.title}</div>
                            <div className="text-gray-600">{risk.description}</div>
                          </td>
                          <td className="py-3 px-4">70%</td>
                          <td className="py-3 px-4">80%</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(risk.impact)}`}>
                              Médio
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(risk.status)}`}>
                              {risk.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">{risk.owner}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button className="p-1 text-gray-400 hover:text-blue-600">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-gray-600">
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Entregáveis */}
        {activeTab === 'deliverables' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Entregáveis</h3>
                  <p className="text-gray-600">Gerencie os entregáveis do projeto</p>
                </div>
                <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Novo Entregável
                </button>
              </div>

              {/* Métricas de entregáveis */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics?.approvedDeliverables}</div>
                  <div className="text-sm text-gray-600">Aprovados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{metrics?.inReviewDeliverables}</div>
                  <div className="text-sm text-gray-600">Em Revisão</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{metrics?.draftDeliverables}</div>
                  <div className="text-sm text-gray-600">Rascunhos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{deliverables.length}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>

              {/* Lista de entregáveis */}
              <div className="space-y-4">
                {deliverables.map(deliverable => (
                  <div key={deliverable.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{deliverable.title}</h4>
                          <span className="text-sm text-gray-600">{deliverable.version}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeliverableStatusColor(deliverable.status)}`}>
                            {deliverable.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{deliverable.description}</p>
                        <div className="text-sm text-gray-500">
                          Tipo: {deliverable.type} • Entrega: {formatDate(deliverable.due_date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {deliverable.status === 'aprovado' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Comunicação */}
        {activeTab === 'communication' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Comunicação</h3>
                  <p className="text-gray-600">Timeline de comunicação do projeto</p>
                </div>
                <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Nova Comunicação
                </button>
              </div>

              {/* Filtro */}
              <div className="mb-6">
                <label className="text-sm text-gray-600 mb-2 block">Filtrar por tipo:</label>
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Todos os tipos</option>
                  <option>Reuniões</option>
                  <option>E-mails</option>
                  <option>Escalações</option>
                  <option>Decisões</option>
                </select>
              </div>

              {/* Métricas de comunicação */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics?.meetings}</div>
                  <div className="text-sm text-gray-600">Reuniões</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Decisões</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{metrics?.escalations}</div>
                  <div className="text-sm text-gray-600">Escalações</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">33%</div>
                  <div className="text-sm text-gray-600">Positivas</div>
                </div>
              </div>

              {/* Timeline de comunicação */}
              <div className="space-y-4">
                {communications.map(comm => (
                  <div key={comm.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          comm.type === 'escalacao' ? 'bg-red-100' :
                          comm.type === 'email' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {comm.type === 'escalacao' ? <AlertTriangle className="w-4 h-4 text-red-600" /> :
                           comm.type === 'email' ? <Mail className="w-4 h-4 text-blue-600" /> :
                           <MessageSquare className="w-4 h-4 text-gray-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{comm.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCommunicationTypeColor(comm.type)}`}>
                              {comm.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(comm.created_at)} • Participantes: {comm.participants.join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{comm.content}</p>
                    {comm.follow_up_actions && comm.follow_up_actions.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-2">Ações de Follow-up:</div>
                        <ul className="space-y-1">
                          {comm.follow_up_actions.map((action, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <input type="checkbox" className="rounded" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics e Calendário - Placeholder */}
        {(activeTab === 'analytics' || activeTab === 'calendar') && (
          <div className="bg-white rounded-lg p-12 border border-gray-200">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                {activeTab === 'analytics' ? <BarChart3 className="w-16 h-16 mx-auto" /> : <Calendar className="w-16 h-16 mx-auto" />}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'analytics' ? 'Analytics' : 'Calendário'}
              </h3>
              <p className="text-gray-600 mb-6">
                Esta funcionalidade será implementada com gráficos avançados e integrações.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 inline mr-2" />
                Em Desenvolvimento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}