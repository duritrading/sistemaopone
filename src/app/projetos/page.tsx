// src/app/projetos/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  BarChart3, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  RefreshCw,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Archive,
  X
} from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
  health: string
  progress_percentage: number
  total_budget: number
  used_budget: number
  project_type: string
  risk_level: string
  estimated_end_date?: string
  next_milestone?: string
  start_date?: string
  description?: string
  client?: { id?: string; company_name: string }
  manager?: { id?: string; full_name: string }
  team_members?: Array<{ team_member: { full_name: string } }>
}

interface ProjectMetrics {
  active_projects: number
  critical_projects: number
  total_value: number
  average_progress: number
}

// Componentes
const MetricCard = ({ title, value, icon: Icon, colorClass, subtitle }: {
  title: string
  value: string | number
  icon: any
  colorClass: string
  subtitle?: string
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  </div>
)

const StatusBadge = ({ status, type = 'status' }: { status: string; type?: 'status' | 'health' | 'risk' | 'project_type' }) => {
  const getConfig = () => {
    if (type === 'status') {
      switch (status.toLowerCase()) {
        case 'executando': return 'bg-green-100 text-green-800 border-green-200'
        case 'planejamento': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'pausado': return 'bg-orange-100 text-orange-800 border-orange-200'
        case 'concluído': return 'bg-blue-100 text-blue-800 border-blue-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }
    if (type === 'health') {
      switch (status.toLowerCase()) {
        case 'excelente': return 'bg-green-100 text-green-800 border-green-200'
        case 'bom': return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'crítico': return 'bg-red-100 text-red-800 border-red-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }
    if (type === 'risk') {
      switch (status.toLowerCase()) {
        case 'baixo': return 'bg-green-100 text-green-800 border-green-200'
        case 'médio': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'alto': return 'bg-red-100 text-red-800 border-red-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }
    if (type === 'project_type') {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${getConfig()}`}>
      {status}
    </span>
  )
}

const ProjectRow = ({ project, onEdit, onArchive }: { 
  project: Project
  onEdit: (project: Project) => void
  onArchive: (projectId: string) => void
}) => {
  const router = useRouter()
  const [showActions, setShowActions] = useState(false)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setShowActions(false)
    if (showActions) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showActions])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/D'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getDaysUntilDeadline = () => {
    if (!project.estimated_end_date) return null
    const today = new Date()
    const deadline = new Date(project.estimated_end_date)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysUntilDeadline()
  const budgetUsedPercentage = project.total_budget > 0 ? (project.used_budget / project.total_budget) * 100 : 0

  const handleArchive = async () => {
    if (confirm('Tem certeza que deseja arquivar este projeto?')) {
      onArchive(project.id)
    }
    setShowActions(false)
  }

  return (
    <div className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Nome do projeto e tags */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                project.health === 'Crítico' ? 'bg-red-500' : 
                project.health === 'Bom' ? 'bg-blue-500' : 'bg-green-500'
              }`} />
              <h3 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h3>
              <StatusBadge status={project.project_type} type="project_type" />
              {project.health === 'Crítico' && <StatusBadge status="crítico" type="health" />}
              <StatusBadge status={`Risco ${project.risk_level.toLowerCase()}`} type="risk" />
            </div>

            {/* Informações do projeto */}
            <div className="grid grid-cols-5 gap-8 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Cliente</p>
                <p className="font-medium text-gray-900">{project.client?.company_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Gerente</p>
                <p className="font-medium text-gray-900">{project.manager?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Previsão Fim</p>
                <div>
                  <p className="font-medium text-gray-900">{formatDate(project.estimated_end_date)}</p>
                  {daysRemaining !== null && (
                    <p className={`text-xs ${
                      daysRemaining < 0 ? 'text-red-600' : 
                      daysRemaining < 30 ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {daysRemaining < 0 ? `${Math.abs(daysRemaining)} dias atrasado` : 
                       daysRemaining === 0 ? 'Vence hoje' : `${daysRemaining} dias restantes`}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Próximo Marco</p>
                <p className="font-medium text-gray-900">{project.next_milestone || 'N/D'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Equipe</p>
                <p className="font-medium text-gray-900">{project.team_members?.length || 0} pessoas</p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Progresso: {project.progress_percentage}%</span>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Saldo: {formatCurrency(project.total_budget - project.used_budget)}</span>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(project.used_budget)} / {formatCurrency(project.total_budget)} ({Math.round(budgetUsedPercentage)}% usado)
                  </span>
                  <span className="text-gray-500">Início: {formatDate(project.start_date)}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-900 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${project.progress_percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-2 ml-4">
            <button 
              onClick={() => router.push(`/projetos/${project.id}`)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Detalhes</span>
            </button>
            
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowActions(!showActions)
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {showActions && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                >
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        onEdit(project)
                        setShowActions(false)
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar Projeto</span>
                    </button>
                    <hr className="my-1" />
                    <button 
                      onClick={handleArchive}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Arquivar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const LoadingState = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-8">
    <div className="flex items-center justify-center space-x-3 text-gray-600">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span className="text-lg font-medium">Carregando projetos...</span>
    </div>
  </div>
)

const ErrorState = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
    <div className="flex items-center space-x-3 mb-4">
      <AlertCircle className="w-6 h-6 text-red-600" />
      <h3 className="text-lg font-semibold text-red-800">Erro ao Carregar Projetos</h3>
    </div>
    <div className="bg-red-100 border border-red-200 rounded p-4 mb-4">
      <pre className="text-red-700 text-sm whitespace-pre-wrap">{error}</pre>
    </div>
    <button 
      onClick={onRetry}
      className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      <span>Tentar Novamente</span>
    </button>
  </div>
)

const EmptyState = () => {
  const router = useRouter()
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
      <p className="text-gray-600 mb-6">Crie seu primeiro projeto para começar.</p>
      <button 
        onClick={() => router.push('/projetos/novo')}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
      >
        <Plus className="w-4 h-4" />
        <span>Novo Projeto</span>
      </button>
    </div>
  )
}

// Modal de Edição Simples
const EditProjectModal = ({ project, isOpen, onClose, onSave }: {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedProject: any) => void
}) => {
  const [formData, setFormData] = useState({
    name: '',
    project_type: 'MVP',
    status: 'Planejamento',
    health: 'Bom',
    risk_level: 'Médio',
    start_date: '',
    estimated_end_date: '',
    progress_percentage: 0,
    total_budget: 0,
    used_budget: 0,
    next_milestone: '',
    description: ''
  })

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name || '',
        project_type: project.project_type || 'MVP',
        status: project.status || 'Planejamento',
        health: project.health || 'Bom',
        risk_level: project.risk_level || 'Médio',
        start_date: project.start_date || '',
        estimated_end_date: project.estimated_end_date || '',
        progress_percentage: project.progress_percentage || 0,
        total_budget: project.total_budget || 0,
        used_budget: project.used_budget || 0,
        next_milestone: project.next_milestone || '',
        description: project.description || ''
      })
    }
  }, [project, isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      onSave(formData)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Editar Projeto</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => handleInputChange('project_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MVP">MVP</option>
                    <option value="PoC">PoC</option>
                    <option value="Implementação">Implementação</option>
                    <option value="Consultoria">Consultoria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Planejamento">Planejamento</option>
                    <option value="Executando">Executando</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saúde</label>
                  <select
                    value={formData.health}
                    onChange={(e) => handleInputChange('health', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Excelente">Excelente</option>
                    <option value="Bom">Bom</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risco</label>
                  <select
                    value={formData.risk_level}
                    onChange={(e) => handleInputChange('risk_level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Cronograma e Orçamento</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previsão Fim</label>
                  <input
                    type="date"
                    value={formData.estimated_end_date}
                    onChange={(e) => handleInputChange('estimated_end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progresso (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress_percentage}
                  onChange={(e) => handleInputChange('progress_percentage', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento (R$)</label>
                  <input
                    type="number"
                    value={formData.total_budget}
                    onChange={(e) => handleInputChange('total_budget', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Usado (R$)</label>
                  <input
                    type="number"
                    value={formData.used_budget}
                    onChange={(e) => handleInputChange('used_budget', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Próximo Marco</label>
                <input
                  type="text"
                  value={formData.next_milestone}
                  onChange={(e) => handleInputChange('next_milestone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterType, setFilterType] = useState('todos')
  const [filterHealth, setFilterHealth] = useState('todos')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    loadProjectsAndMetrics()
  }, [])

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setIsEditModalOpen(true)
  }

  const handleArchiveProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'Arquivado' })
        .eq('id', projectId)

      if (error) throw error

      // Recarregar dados
      loadProjectsAndMetrics()
    } catch (err: any) {
      console.error('Erro ao arquivar projeto:', err)
      alert('Erro ao arquivar projeto: ' + err.message)
    }
  }

  const loadProjectsAndMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, name, status, health, progress_percentage, total_budget, used_budget,
          project_type, risk_level, estimated_end_date, next_milestone, start_date,
          client:clients(company_name),
          manager:team_members(full_name),
          team_members:project_team_members(team_member:team_members(full_name))
        `)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      const activeProjects = projectsData?.filter(p => p.status === 'Executando')?.length || 0
      const criticalProjects = projectsData?.filter(p => p.health === 'Crítico')?.length || 0
      const totalValue = projectsData?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0
      const avgProgress = projectsData?.length > 0 
        ? Math.round(projectsData.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projectsData.length)
        : 0

      setProjects(projectsData || [])
      setMetrics({
        active_projects: activeProjects,
        critical_projects: criticalProjects,
        total_value: totalValue,
        average_progress: avgProgress
      })
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`
    }
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'todos' || project.status === filterStatus
    const matchesType = filterType === 'todos' || project.project_type === filterType
    const matchesHealth = filterHealth === 'todos' || project.health === filterHealth
    return matchesSearch && matchesStatus && matchesType && matchesHealth
  })

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <ErrorState error={error} onRetry={loadProjectsAndMetrics} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Projetos</h1>
          <p className="text-gray-600 mt-1">Acompanhe o progresso e saúde dos seus projetos</p>
        </div>

        {/* Métricas */}
        {metrics && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Projetos Ativos" 
              value={metrics.active_projects} 
              icon={CheckCircle} 
              colorClass="bg-blue-500"
              subtitle="Em execução"
            />
            <MetricCard 
              title="Críticos" 
              value={metrics.critical_projects} 
              icon={AlertTriangle} 
              colorClass="bg-red-500"
              subtitle="Requer atenção"
            />
            <MetricCard 
              title="Valor Total" 
              value={formatCurrency(metrics.total_value)} 
              icon={DollarSign} 
              colorClass="bg-green-500"
              subtitle="Portfolio total"
            />
            <MetricCard 
              title="Média Progresso" 
              value={`${metrics.average_progress}%`} 
              icon={BarChart3} 
              colorClass="bg-orange-500"
              subtitle="Progresso geral"
            />
          </div>
        )}

        {/* Lista de Projetos */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Lista de Projetos</h2>
              <button 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>

            {/* Filtros e Busca */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar projetos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="Planejamento">Planejamento</option>
                    <option value="Executando">Executando</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
                  >
                    <option value="todos">Todos os Tipos</option>
                    <option value="MVP">MVP</option>
                    <option value="PoC">PoC</option>
                    <option value="Implementação">Implementação</option>
                    <option value="Consultoria">Consultoria</option>
                  </select>
                  
                  <select
                    value={filterHealth}
                    onChange={(e) => setFilterHealth(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
                  >
                    <option value="todos">Todas as Saúdes</option>
                    <option value="Excelente">Excelente</option>
                    <option value="Bom">Bom</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                  
                  <button className="flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    <span>Mais Filtros</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            {isLoading ? (
              <LoadingState />
            ) : filteredProjects.length === 0 ? (
              projects.length === 0 ? <EmptyState /> : (
                <div className="p-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhum projeto encontrado com os filtros aplicados.</p>
                </div>
              )
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredProjects.map(project => (
                  <ProjectRow 
                    key={project.id} 
                    project={project} 
                    onEdit={handleEditProject}
                    onArchive={handleArchiveProject}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      <EditProjectModal
        project={editingProject}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingProject(null)
        }}
        onSave={(updatedProject) => {
          console.log('Projeto atualizado:', updatedProject)
          loadProjectsAndMetrics()
        }}
      />
    </div>
  )
}