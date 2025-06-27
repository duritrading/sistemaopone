// src/app/projetos/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  ArrowLeft, Edit, Share2, MoreHorizontal, AlertTriangle, 
  Calendar, Users, Clock, DollarSign, Target, TrendingUp, FileText,
  MessageSquare, BarChart3, CheckCircle, Plus
} from 'lucide-react'

// Interface básica
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
  }
  manager?: {
    id: string
    full_name: string
    email: string
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [mounted, setMounted] = useState(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && projectId) {
      loadProject()
    }
  }, [mounted, projectId])

  const loadProject = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Carregando projeto:', projectId)

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, company_name),
          manager:team_members(id, full_name, email)
        `)
        .eq('id', projectId)
        .single()

      console.log('📊 Resultado:', { data, error })

      if (error) {
        throw new Error(`Erro ao carregar projeto: ${error.message}`)
      }

      setProject(data)
    } catch (error: any) {
      console.error('❌ Erro:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Target },
    { id: 'timeline', label: 'Cronograma', icon: Calendar },
    { id: 'risks', label: 'Riscos', icon: AlertTriangle },
    { id: 'deliverables', label: 'Entregáveis', icon: FileText },
    { id: 'communication', label: 'Comunicação', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
    const colors = {
      'Executando': 'text-blue-600 bg-blue-100',
      'Pausado': 'text-yellow-600 bg-yellow-100',
      'Concluído': 'text-green-600 bg-green-100',
      'Aprovado': 'text-green-600 bg-green-100',
      'Cancelado': 'text-red-600 bg-red-100'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getHealthColor = (health: string) => {
    const colors = {
      'Excelente': 'text-green-600 bg-green-100',
      'Bom': 'text-blue-600 bg-blue-100',
      'Crítico': 'text-red-600 bg-red-100'
    }
    return colors[health as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  // Não renderizar até montar
  if (!mounted) {
    return null
  }

  if (loading) {
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
            <div className="bg-red-100 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-mono text-sm">{error || 'Projeto não encontrado'}</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-red-800">🔍 Possíveis Causas:</h3>
              <ul className="text-red-700 space-y-2">
                <li>• Projeto não existe no banco</li>
                <li>• Coluna não existe na tabela clients</li>
                <li>• Problema de permissão (RLS)</li>
                <li>• ID do projeto inválido</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => router.push('/projetos')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Voltar para Projetos
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                🔄 Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const remainingDays = project.estimated_end_date ?
    Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0

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
                <div className="text-sm text-gray-600">{project.client?.company_name || 'Cliente não informado'}</div>
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
                  {remainingDays > 0 ? remainingDays : '--'}
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
            {/* KPIs detalhados */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{project.progress_percentage}%</div>
                    <div className="text-sm text-gray-600">Progresso</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(project.used_budget)}</div>
                    <div className="text-sm text-gray-600">Gasto</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  de {formatCurrency(project.total_budget)}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {remainingDays > 0 ? remainingDays : '--'}
                    </div>
                    <div className="text-sm text-gray-600">Dias restantes</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Término: {formatDate(project.estimated_end_date)}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{project.health_score}</div>
                    <div className="text-sm text-gray-600">Score Saúde</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  de 100 pontos
                </div>
              </div>
            </div>

            {/* Informações do projeto */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Projeto</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Descrição</div>
                    <div className="text-gray-900">{project.description || 'Sem descrição disponível'}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Tipo</div>
                      <div className="font-medium text-gray-900">{project.project_type}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Risco</div>
                      <div className="font-medium text-gray-900">{project.risk_level}</div>
                    </div>
                  </div>

                  {project.next_milestone && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Próximo Marco</div>
                      <div className="font-medium text-gray-900">{project.next_milestone}</div>
                      <div className="text-sm text-gray-500">{formatDate(project.next_milestone_date)}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Cliente</div>
                    <div className="font-medium text-gray-900">{project.client?.company_name || 'Não definido'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Gerente</div>
                    <div className="font-medium text-gray-900">{project.manager?.full_name || 'Não atribuído'}</div>
                    {project.manager?.email && (
                      <div className="text-sm text-gray-500">{project.manager.email}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Datas</div>
                    <div className="text-sm space-y-1">
                      <div>Início: {formatDate(project.start_date)}</div>
                      <div>Fim: {formatDate(project.estimated_end_date)}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Orçamento</div>
                    <div className="text-sm space-y-1">
                      <div>Total: {formatCurrency(project.total_budget)}</div>
                      <div>Usado: {formatCurrency(project.used_budget)}</div>
                      <div>Restante: {formatCurrency(project.total_budget - project.used_budget)}</div>
                    </div>
                  </div>
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
                  <div className="text-2xl font-bold text-green-600">2</div>
                  <div className="text-sm text-gray-600">Marcos Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">5</div>
                  <div className="text-sm text-gray-600">Em Andamento</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">15</div>
                  <div className="text-sm text-gray-600">Dias Restantes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">5</div>
                  <div className="text-sm text-gray-600">Marcos Atrasados</div>
                </div>
              </div>

              {/* Gráfico de Gantt */}
              <div className="mb-8">
                <h4 className="font-medium text-gray-900 mb-4">Gráfico de Gantt</h4>
                <div className="space-y-3">
                  {[
                    { title: 'Discovery e Levantamento de Requisitos', assigned: 'João Silva', status: 'completed', progress: 100, dueDate: '28/03/2024' },
                    { title: 'Arquitetura e Design da Solução', assigned: 'Maria Santos', status: 'completed', progress: 100, dueDate: '14/04/2024' },
                    { title: 'Preparação e Processamento de Dados', assigned: 'Pedro Costa', status: 'in_progress', progress: 85, dueDate: '01/05/2024' },
                    { title: 'Desenvolvimento do Modelo ML', assigned: 'Ana Silva', status: 'in_progress', progress: 45, dueDate: '20/05/2024' },
                    { title: 'Desenvolvimento da API', assigned: 'Carlos Lima', status: 'pending', progress: 0, dueDate: '10/06/2024' },
                    { title: 'Testes e Validação', assigned: 'Lúcia Santos', status: 'pending', progress: 0, dueDate: '25/06/2024' },
                    { title: 'Deploy e Entrega', assigned: 'João Silva', status: 'pending', progress: 0, dueDate: '30/06/2024' }
                  ].map((milestone, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        milestone.status === 'completed' ? 'bg-green-500' :
                        milestone.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{milestone.title}</div>
                        <div className="text-sm text-gray-600">Responsável: {milestone.assigned}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{milestone.progress}%</div>
                        <div className="text-sm text-gray-600">{milestone.dueDate}</div>
                      </div>
                      <div className="w-24">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              milestone.status === 'completed' ? 'bg-green-500' :
                              milestone.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${milestone.progress}%` }}
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
                  {[
                    { title: 'Discovery e Levantamento de Requisitos', assigned: 'João Silva', date: '28/03/2024' },
                    { title: 'Arquitetura e Design da Solução', assigned: 'Maria Santos', date: '14/04/2024' }
                  ].map((milestone, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-gray-900">{milestone.title}</div>
                          <div className="text-sm text-gray-600">Responsável: {milestone.assigned}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">concluído</div>
                        <div className="text-sm text-gray-600">{milestone.date}</div>
                        <div className="text-sm text-gray-600">Progresso: 100%</div>
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
                  <div className="text-2xl font-bold text-red-600">2</div>
                  <div className="text-sm text-gray-600">Riscos Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">51</div>
                  <div className="text-sm text-gray-600">Risco Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">1</div>
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
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">Atraso na entrega do modelo de IA</div>
                          <div className="text-gray-600">Implementação: Implementar desenvolvimento paralelo e testes antecipados</div>
                        </td>
                        <td className="py-3 px-4">70%</td>
                        <td className="py-3 px-4">80%</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Médio
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Ativo
                          </span>
                        </td>
                        <td className="py-3 px-4">João Silva</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="p-1 text-gray-400 hover:text-blue-600">
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
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
                  <div className="text-2xl font-bold text-green-600">1</div>
                  <div className="text-sm text-gray-600">Aprovados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">1</div>
                  <div className="text-sm text-gray-600">Em Revisão</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">1</div>
                  <div className="text-sm text-gray-600">Rascunhos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">3</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>

              {/* Lista de entregáveis */}
              <div className="space-y-4">
                {[
                  { 
                    title: 'Documento de Requisitos', 
                    version: 'v2.1', 
                    status: 'aprovado', 
                    type: 'documento',
                    description: 'Especificação completa dos requisitos funcionais e não-funcionais',
                    dueDate: '14/03/2024'
                  },
                  { 
                    title: 'Protótipo de Interface', 
                    version: 'v1.0', 
                    status: 'revisao', 
                    type: 'outro',
                    description: 'Protótipo interativo das principais telas do sistema',
                    dueDate: '19/03/2024'
                  },
                  { 
                    title: 'Código-fonte MVP', 
                    version: 'v0.8', 
                    status: 'rascunho', 
                    type: 'codigo',
                    description: 'Implementação inicial das funcionalidades principais',
                    dueDate: ''
                  }
                ].map((deliverable, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{deliverable.title}</h4>
                          <span className="text-sm text-gray-600">{deliverable.version}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            deliverable.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                            deliverable.status === 'revisao' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {deliverable.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{deliverable.description}</p>
                        <div className="text-sm text-gray-500">
                          Tipo: {deliverable.type} {deliverable.dueDate && `• Entrega: ${deliverable.dueDate}`}
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
                  <div className="text-2xl font-bold text-blue-600">1</div>
                  <div className="text-sm text-gray-600">Reuniões</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Decisões</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">1</div>
                  <div className="text-sm text-gray-600">Escalações</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">33%</div>
                  <div className="text-sm text-gray-600">Positivas</div>
                </div>
              </div>

              {/* Timeline de comunicação */}
              <div className="space-y-4">
                {[
                  {
                    type: 'escalacao',
                    title: 'Atraso na Entrega de Dados',
                    content: 'Cliente não forneceu os dados necessários no prazo acordado.',
                    participants: ['João Silva', 'Gerente Cliente'],
                    date: '19/03/2024',
                    followUp: ['Definir novo prazo', 'Ajustar cronograma']
                  },
                  {
                    type: 'email',
                    title: 'Mudança nos Requisitos',
                    content: 'Cliente solicitou alteração na funcionalidade de autenticação.',
                    participants: ['Maria Santos', 'Equipe Técnica'],
                    date: '17/03/2024',
                    followUp: ['Revisar impacto no cronograma']
                  }
                ].map((comm, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          comm.type === 'escalacao' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {comm.type === 'escalacao' ? 
                            <AlertTriangle className="w-4 h-4 text-red-600" /> :
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{comm.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              comm.type === 'escalacao' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {comm.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {comm.date} • Participantes: {comm.participants.join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{comm.content}</p>
                    {comm.followUp && (
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-2">Ações de Follow-up:</div>
                        <ul className="space-y-1">
                          {comm.followUp.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-center gap-2 text-sm text-gray-600">
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

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                  <p className="text-gray-600">Relatórios e métricas avançadas</p>
                </div>
                <button className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Novo Relatório
                </button>
              </div>

              {/* Gráficos placeholder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Progresso no Tempo</h4>
                  <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Gráfico de progresso será implementado</p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Distribuição de Custos</h4>
                  <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded">
                    <div className="text-center">
                      <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Gráfico de custos será implementado</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Relatórios */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Relatórios</h4>
                  <button className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    Exportar Todos
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'Relatório de Progresso', description: 'Status atual e próximos passos', updated: '2 dias atrás' },
                    { title: 'Análise Financeira', description: 'Custos e projeções orçamentárias', updated: '1 semana atrás' },
                    { title: 'Relatório de Riscos', description: 'Avaliação e mitigação de riscos', updated: '3 dias atrás' }
                  ].map((report, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <button className="text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{report.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                      <div className="text-xs text-gray-500">Atualizado {report.updated}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">🔍 Debug Info:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>Project ID: {projectId}</div>
            <div>Mounted: {mounted ? '✅' : '❌'}</div>
            <div>Loading: {loading ? '🔄' : '✅'}</div>
            <div>Error: {error ? '❌' : '✅'}</div>
          </div>
          {project && (
            <div className="mt-2 text-xs text-gray-500">
              Projeto: {project.name} | Cliente: {project.client?.company_name || 'N/A'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}