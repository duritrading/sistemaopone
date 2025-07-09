// src/app/projetos/page.tsx - COM BOTÃO NOVO PROJETO
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
  Trash2,
  X,
  Building,
  User,
  Calendar,
  FileText
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

interface Client {
  id: string
  company_name: string
}

interface TeamMember {
  id: string
  full_name: string
}

// === MODAL NOVO PROJETO ===
interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  clients: Client[]
  teamMembers: TeamMember[]
}

const NewProjectModal = ({ isOpen, onClose, onSubmit, clients, teamMembers }: NewProjectModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: 'MVP',
    status: 'Planejamento',
    health: 'Bom',
    risk_level: 'Médio',
    client_id: '',
    manager_id: '',
    start_date: '',
    estimated_end_date: '',
    total_budget: 0,
    next_milestone: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Nome do projeto é obrigatório')
      return
    }

    if (!formData.client_id) {
      alert('Cliente é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        name: '',
        description: '',
        project_type: 'MVP',
        status: 'Planejamento',
        health: 'Bom',
        risk_level: 'Médio',
        client_id: '',
        manager_id: '',
        start_date: '',
        estimated_end_date: '',
        total_budget: 0,
        next_milestone: ''
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Novo Projeto</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Informações Básicas
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Digite o nome do projeto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => handleInputChange('client_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gerente do Projeto</label>
                <select
                  value={formData.manager_id}
                  onChange={(e) => handleInputChange('manager_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Selecione um gerente</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => handleInputChange('project_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Cronograma e Orçamento
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previsão de Término</label>
                  <input
                    type="date"
                    value={formData.estimated_end_date}
                    onChange={(e) => handleInputChange('estimated_end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_budget}
                  onChange={(e) => handleInputChange('total_budget', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Ex: 150000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Próximo Marco</label>
                <input
                  type="text"
                  value={formData.next_milestone}
                  onChange={(e) => handleInputChange('next_milestone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Ex: Levantamento de requisitos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição/Objetivo</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Descreva o objetivo principal do projeto..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Criando...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Criar Projeto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
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

const ProjectRow = ({ project, onEdit, onArchive, onDelete }: { 
  project: Project
  onEdit: (project: Project) => void
  onArchive: (projectId: string) => void
  onDelete?: (projectId: string) => void
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
    if (!dateString) return 'Não definido'
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

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation()
    onArchive(project.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o projeto "${project.name}"?\n\nEsta ação não pode ser desfeita e todos os dados do projeto serão perdidos.`)) {
      onDelete?.(project.id)
    }
  }

  const getDaysOverdue = () => {
    if (!project.estimated_end_date) return null
    const today = new Date()
    const endDate = new Date(project.estimated_end_date)
    const diffTime = today.getTime() - endDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : null
  }

  const daysOverdue = getDaysOverdue()

  return (
    <div 
      className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => router.push(`/projetos/${project.id}`)}
    >
      <div className="p-6">
        {/* Header da linha */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              <div className="flex items-center space-x-2">
                <StatusBadge status={project.status} type="status" />
                <StatusBadge status={project.project_type} type="project_type" />
                <StatusBadge status={project.risk_level} type="risk" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Cliente:</span>
                <p className="font-medium text-gray-900">{project.client?.company_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Gerente:</span>
                <p className="font-medium text-gray-900">{project.manager?.full_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Previsão Fim:</span>
                <p className="font-medium text-gray-900">{formatDate(project.estimated_end_date)}</p>
                {daysOverdue && (
                  <p className="text-red-600 text-xs font-medium">{daysOverdue} dias atrasado</p>
                )}
              </div>
              <div>
                <span className="text-gray-500">Próximo Marco:</span>
                <p className="font-medium text-gray-900">{project.next_milestone || 'Não definido'}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="relative ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowActions(!showActions)
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>

            {showActions && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
              >
                <div className="py-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/projetos/${project.id}`)
                      setShowActions(false)
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver Detalhes</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
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
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Pausar Projeto</span>
                  </button>
                  {onDelete && (
                    <button 
                      onClick={handleDelete}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir Projeto</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Métricas da linha */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-gray-500">Progresso: {project.progress_percentage}%</span>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${project.progress_percentage}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">Saldo: {formatCurrency(project.total_budget - project.used_budget)}</span>
            <p className="font-medium text-sm">
              <span className="text-green-600">{formatCurrency(project.used_budget)}</span> / 
              <span className="text-gray-900"> {formatCurrency(project.total_budget)}</span> 
              <span className="text-gray-500 text-xs ml-1">
                ({project.total_budget > 0 ? Math.round((project.used_budget / project.total_budget) * 100) : 0}% usado)
              </span>
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Equipe:</span>
            <p className="font-medium text-sm">{project.team_members?.length || 0} pessoas</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">Início: {formatDate(project.start_date)}</span>
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

const EmptyState = ({ onNewProject }: { onNewProject: () => void }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
    <p className="text-gray-600 mb-6">Crie seu primeiro projeto para começar.</p>
    <button 
      onClick={onNewProject}
      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
    >
      <Plus className="w-4 h-4" />
      <span>Novo Projeto</span>
    </button>
  </div>
)

// Modal de Edição (mantém o existente)
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Digite o nome do projeto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => handleInputChange('project_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Próximo Marco</label>
                <input
                  type="text"
                  value={formData.next_milestone}
                  onChange={(e) => handleInputChange('next_milestone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Integração com GPG"
                />
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Cronograma e Orçamento</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previsão de Término</label>
                  <input
                    type="date"
                    value={formData.estimated_end_date}
                    onChange={(e) => handleInputChange('estimated_end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                  onChange={(e) => handleInputChange('progress_percentage', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Ex: 65"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_budget}
                    onChange={(e) => handleInputChange('total_budget', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Ex: 150000.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Usado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.used_budget}
                    onChange={(e) => handleInputChange('used_budget', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Ex: 97500.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição/Objetivo</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Descreva o objetivo principal do projeto..."
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

// === COMPONENTE PRINCIPAL ===
export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterType, setFilterType] = useState('todos')
  const [filterHealth, setFilterHealth] = useState('todos')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)

  useEffect(() => {
    loadProjectsAndMetrics()
    loadClientsAndTeamMembers()
  }, [])

  const loadClientsAndTeamMembers = async () => {
    try {
      const [clientsResult, teamResult] = await Promise.all([
        supabase.from('clients').select('id, company_name').eq('is_active', true),
        supabase.from('team_members').select('id, full_name').eq('is_active', true)
      ])

      if (clientsResult.data) setClients(clientsResult.data)
      if (teamResult.data) setTeamMembers(teamResult.data)
    } catch (err) {
      console.error('Erro ao carregar dados auxiliares:', err)
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setIsEditModalOpen(true)
  }

  const handleNewProject = () => {
    setIsNewProjectModalOpen(true)
  }

  const handleCreateProject = async (formData: any) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: formData.name,
          description: formData.description || null,
          project_type: formData.project_type,
          status: formData.status,
          health: formData.health,
          risk_level: formData.risk_level,
          client_id: formData.client_id,
          manager_id: formData.manager_id || null,
          start_date: formData.start_date || null,
          estimated_end_date: formData.estimated_end_date || null,
          total_budget: formData.total_budget,
          used_budget: 0,
          progress_percentage: 0,
          next_milestone: formData.next_milestone || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      setIsNewProjectModalOpen(false)
      loadProjectsAndMetrics() // Reload para mostrar o novo projeto
      alert('Projeto criado com sucesso!')

    } catch (err: any) {
      console.error('Erro ao criar projeto:', err)
      alert('Erro ao criar projeto: ' + err.message)
    }
  }

  const handleArchiveProject = async (projectId: string) => {
    try {
      // Como "Arquivado" não está permitido no constraint do banco,
      // usamos "Pausado" como alternativa funcional
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: 'Pausado'
          // Futuramente pode ser adicionado um campo "archived: true"
        })
        .eq('id', projectId)

      if (error) throw error

      // Recarregar dados
      loadProjectsAndMetrics()
      
      // Feedback positivo
      alert('Projeto pausado com sucesso!')
    } catch (err: any) {
      console.error('Erro ao pausar projeto:', err)
      alert('Erro ao pausar projeto: ' + err.message)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Primeiro, verificar se o projeto existe
      const { data: existingProject, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .single()

      if (checkError || !existingProject) {
        alert('Projeto não encontrado!')
        return
      }

      // Excluir registros relacionados (sem esperar por todos simultaneamente para evitar locks)
      try {
        await supabase.from('project_milestones').delete().eq('project_id', projectId)
      } catch (err) {
        console.log('Erro ao excluir marcos (pode não existir):', err)
      }

      try {
        await supabase.from('project_deliverables').delete().eq('project_id', projectId)
      } catch (err) {
        console.log('Erro ao excluir deliverables (pode não existir):', err)
      }

      try {
        await supabase.from('project_team_members').delete().eq('project_id', projectId)
      } catch (err) {
        console.log('Erro ao excluir team members (pode não existir):', err)
      }

      try {
        await supabase.from('project_technologies').delete().eq('project_id', projectId)
      } catch (err) {
        console.log('Erro ao excluir technologies (pode não existir):', err)
      }

      try {
        await supabase.from('project_scope').delete().eq('project_id', projectId)
      } catch (err) {
        console.log('Erro ao excluir scope (pode não existir):', err)
      }

      // Depois excluir o projeto
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      // Recarregar dados
      await loadProjectsAndMetrics()
      
      // Feedback positivo
      alert('Projeto excluído permanentemente!')
    } catch (err: any) {
      console.error('Erro ao excluir projeto:', err)
      alert('Erro ao excluir projeto: ' + (err.message || 'Erro desconhecido'))
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
        
        {/* Header - ATUALIZADO COM BOTÃO */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Projetos</h1>
            <p className="text-gray-600 mt-1">Acompanhe o progresso e saúde dos seus projetos</p>
          </div>
          <button 
            onClick={handleNewProject}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Novo Projeto</span>
          </button>
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
              <div className="flex items-center space-x-3">
                <button 
                  onClick={loadProjectsAndMetrics}
                  className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Atualizar</span>
                </button>
                <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todas as Saúdes</option>
                <option value="Excelente">Excelente</option>
                <option value="Bom">Bom</option>
                <option value="Crítico">Crítico</option>
              </select>
            </div>
          </div>

          {/* Conteúdo da Lista */}
          {isLoading ? (
            <LoadingState />
          ) : filteredProjects.length === 0 ? (
            <EmptyState onNewProject={handleNewProject} />
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProjects.map(project => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                  onArchive={handleArchiveProject}
                  onDelete={handleDeleteProject}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <EditProjectModal
        project={editingProject}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(formData) => {
          // Implementar save
          console.log('Salvando projeto:', formData)
          setIsEditModalOpen(false)
        }}
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
        clients={clients}
        teamMembers={teamMembers}
      />
    </div>
  )
}