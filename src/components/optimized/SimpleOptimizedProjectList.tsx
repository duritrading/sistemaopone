// src/components/optimized/SimpleOptimizedProjectList.tsx
/**
 * Versão simplificada do componente otimizado - SEM dependências externas
 * Use este se tiver problemas com react-window ou outras bibliotecas
 */

import React, { memo, useCallback, useMemo } from 'react'

interface SimpleOptimizedProjectListProps {
  projects: any[]
  onProjectSelect?: (project: any) => void
  loading?: boolean
}

/**
 * Item de projeto memoizado para evitar re-renders
 */
const ProjectItem = memo(function ProjectItem({ 
  project, 
  onSelect 
}: { 
  project: any
  onSelect: (project: any) => void 
}) {
  const handleClick = useCallback(() => {
    onSelect(project)
  }, [project, onSelect])

  const healthConfig = useMemo(() => {
    const configs = {
      'healthy': { color: 'bg-green-100 text-green-800', label: 'Saudável' },
      'warning': { color: 'bg-yellow-100 text-yellow-800', label: 'Atenção' },
      'critical': { color: 'bg-red-100 text-red-800', label: 'Crítico' }
    }
    return configs[project.health] || { color: 'bg-gray-100 text-gray-800', label: 'N/A' }
  }, [project.health])

  const budgetUtilization = useMemo(() => {
    return project.total_budget > 0 
      ? (project.used_budget / project.total_budget) * 100 
      : 0
  }, [project.total_budget, project.used_budget])

  const daysRemaining = useMemo(() => {
    if (!project.estimated_end_date) return null
    return Math.ceil((new Date(project.estimated_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }, [project.estimated_end_date])

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
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
          <p className="text-xs text-gray-500">Progresso</p>
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
          <p className="text-xs text-gray-500">Orçamento</p>
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
          <p className="text-xs text-gray-500">Equipe</p>
          <p className="text-sm font-medium text-gray-900">
            {project.team_count || 0} membros
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{project.project_type}</span>
        <span>
          {daysRemaining !== null 
            ? `${daysRemaining > 0 ? '' : '-'}${Math.abs(daysRemaining)} dias`
            : 'Sem prazo'
          }
        </span>
      </div>
    </div>
  )
})

/**
 * Loading skeleton component
 */
const LoadingSkeleton = memo(function LoadingSkeleton() {
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
})

/**
 * Componente principal simplificado
 */
export default function SimpleOptimizedProjectList({
  projects,
  onProjectSelect,
  loading = false
}: SimpleOptimizedProjectListProps) {
  
  const handleProjectSelect = useCallback((project: any) => {
    if (onProjectSelect) {
      onProjectSelect(project)
    }
  }, [onProjectSelect])

  // Renderizar loading
  if (loading && projects.length === 0) {
    return <LoadingSkeleton />
  }

  // Renderizar lista vazia
  if (!loading && projects.length === 0) {
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

  // Renderizar lista de projetos
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          onSelect={handleProjectSelect}
        />
      ))}
      
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}

// Export também como named export para flexibilidade
export { SimpleOptimizedProjectList }