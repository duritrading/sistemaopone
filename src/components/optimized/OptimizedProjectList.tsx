// src/components/optimized/OptimizedProjectList.tsx - REESCRITA COMPLETA
'use client'

import React, { memo, useCallback, useMemo, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Eye, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building
} from 'lucide-react'

// === INTERFACES ===
interface Project {
  id: string
  name: string
  status: string
  health: string
  progress_percentage: number
  total_budget: number
  used_budget: number
  project_type: string
  estimated_end_date?: string
  client?: {
    id: string
    company_name: string
  }
  manager?: {
    id: string
    full_name: string
  }
  team_count?: number
  days_remaining?: number
}

interface OptimizedProjectListProps {
  filters?: {
    status?: string[]
    health?: string[]
    search?: string
  }
  onProjectSelect?: (project: Project) => void
  height?: number
  enableVirtualization?: boolean
}

// === COMPONENTE DE ITEM DA LISTA ===
const ProjectListItem = memo(function ProjectListItem({ 
  project, 
  onProjectSelect 
}: { 
  project: Project
  onProjectSelect?: (project: Project) => void
}) {
  const budgetUtilization = project.total_budget > 0 
    ? (project.used_budget / project.total_budget) * 100 
    : 0

  const getHealthConfig = (health: string) => {
    switch (health.toLowerCase()) {
      case 'excelente': case 'healthy': case 'verde':
        return { color: 'bg-green-100 text-green-800', label: 'Saudável' }
      case 'bom': case 'warning': case 'amarelo':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Atenção' }
      case 'crítico': case 'critical': case 'vermelho':
        return { color: 'bg-red-100 text-red-800', label: 'Crítico' }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'N/A' }
    }
  }

  const healthConfig = getHealthConfig(project.health)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getDaysRemaining = () => {
    if (!project.estimated_end_date) return 'Sem prazo'
    
    const endDate = new Date(project.estimated_end_date)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `${Math.abs(diffDays)} dias atrasado`
    if (diffDays === 0) return 'Vence hoje'
    return `${diffDays} dias restantes`
  }

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onProjectSelect?.(project)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {project.name}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {project.client?.company_name || 'Cliente não definido'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${healthConfig.color}`}>
          {healthConfig.label}
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Progresso</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress_percentage || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {project.progress_percentage || 0}%
            </span>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Orçamento</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  budgetUtilization > 90 ? 'bg-red-500' : 
                  budgetUtilization > 70 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(budgetUtilization)}%
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Valor Total</p>
          <p className="text-sm font-medium text-gray-900">
            {formatCurrency(project.total_budget || 0)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Building className="w-3 h-3" />
          {project.project_type}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {getDaysRemaining()}
        </span>
      </div>
    </div>
  )
})

// === HOOK PERSONALIZADO PARA PROJETOS ===
function useOptimizedProjects(filters: OptimizedProjectListProps['filters'] = {}) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('projects')
        .select(`
          id, name, status, health, progress_percentage, total_budget, used_budget,
          project_type, estimated_end_date,
          client:clients(id, company_name),
          manager:team_members(id, full_name)
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      // Aplicar filtros
      if (filters.status?.length) {
        query = query.in('status', filters.status)
      }
      if (filters.health?.length) {
        query = query.in('health', filters.health)
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Mapear dados com cálculos
      const mappedProjects = (data || []).map(project => ({
        ...project,
        client: Array.isArray(project.client) ? project.client[0] : project.client,
        manager: Array.isArray(project.manager) ? project.manager[0] : project.manager,
        team_count: 0, // Mock value
        days_remaining: project.estimated_end_date 
          ? Math.ceil((new Date(project.estimated_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
      }))

      setProjects(mappedProjects as Project[])
    } catch (err: any) {
      console.error('Erro ao carregar projetos:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return {
    projects,
    loading,
    error,
    refetch: loadProjects
  }
}

// === COMPONENTE PRINCIPAL ===
export default function OptimizedProjectList({
  filters = {},
  onProjectSelect,
  height = 600,
  enableVirtualization = false
}: OptimizedProjectListProps) {
  const { projects, loading, error, refetch } = useOptimizedProjects(filters)

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 text-lg font-medium mb-2">
          Erro ao carregar projetos
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={refetch}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  // Empty state
  if (!projects.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-gray-500 text-lg font-medium mb-2">
          Nenhum projeto encontrado
        </div>
        <p className="text-gray-400">
          Ajuste os filtros ou crie um novo projeto
        </p>
      </div>
    )
  }

  // Lista normal
  return (
    <div 
      className="space-y-4 overflow-y-auto"
      style={{ maxHeight: height }}
    >
      {projects.map((project) => (
        <ProjectListItem
          key={project.id}
          project={project}
          onProjectSelect={onProjectSelect}
        />
      ))}
    </div>
  )
}