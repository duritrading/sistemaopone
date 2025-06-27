// src/app/projetos/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Edit, Share2, MoreHorizontal, AlertTriangle, 
  Calendar, Users, Clock, DollarSign, Target, TrendingUp, FileText,
  MessageSquare, BarChart3, CheckCircle, Plus
} from 'lucide-react'

// Usando seus tipos existentes
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

  useEffect(() => {
    setMounted(true)
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, company_name),
          manager:team_members(id, full_name, email)
        `)
        .eq('id', projectId)
        .single()

      if (error) {
        throw new Error(`Erro ao carregar projeto: ${error.message}`)
      }

      setProject(data)
    } catch (error: any) {
      console.error('Erro:', error)
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
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(project.health)}`}>
                    {project.health}
                  </span>
                  <span className="text-sm text-gray-600">{project.project_type}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
              <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
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
            {/* KPIs */}
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
                      {project.estimated_end_date ? 
                        Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : '--'
                      }
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
                    <Users className="w-6 h-6 text-purple-600" />
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

            {/* Informações Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Descrição do Projeto</h3>
                <p className="text-gray-700 leading-relaxed">{project.description || 'Sem descrição disponível'}</p>
                
                {project.next_milestone && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Próximo Marco</h4>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Target className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">{project.next_milestone}</div>
                        <div className="text-sm text-gray-600">{formatDate(project.next_milestone_date)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
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
                    <div className="text-sm text-gray-600 mb-1">Nível de Risco</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.risk_level === 'Alto' ? 'bg-red-100 text-red-800' :
                      project.risk_level === 'Médio' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {project.risk_level}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Outras abas - Implementação básica */}
        {activeTab !== 'overview' && (
          <div className="bg-white rounded-lg p-12 border border-gray-200">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                {activeTab === 'timeline' && <Calendar className="w-16 h-16 mx-auto" />}
                {activeTab === 'risks' && <AlertTriangle className="w-16 h-16 mx-auto" />}
                {activeTab === 'deliverables' && <FileText className="w-16 h-16 mx-auto" />}
                {activeTab === 'communication' && <MessageSquare className="w-16 h-16 mx-auto" />}
                {activeTab === 'analytics' && <BarChart3 className="w-16 h-16 mx-auto" />}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              <p className="text-gray-600 mb-6">
                Esta funcionalidade será implementada em breve.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 inline mr-2" />
                Adicionar {tabs.find(t => t.id === activeTab)?.label}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}