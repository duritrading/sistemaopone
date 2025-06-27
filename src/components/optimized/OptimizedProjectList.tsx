// src/components/optimized/OptimizedProjectList.tsx
/**
 * Componente de lista otimizado com virtualização e memoização inteligente
 * Implementa lazy loading, infinite scroll e performance monitoring
 */

import React, { memo, useCallback, useMemo, Suspense, lazy } from 'react'
import { FixedSizeList as List } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { useOptimizedProjects } from '@/hooks/useOptimizedProjects'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Lazy load de componentes pesados
const ProjectDetailsModal = lazy(() => import('@/components/modals/ProjectDetailsModal'))
const ProjectGanttChart = lazy(() => import('@/components/charts/ProjectGanttChart'))

interface OptimizedProjectListProps {
  filters?: {
    status?: string[]
    health?: string[]
    search?: string
  }
  onProjectSelect?: (project: any) => void
  height?: number
  itemHeight?: number
  enableVirtualization?: boolean
}

/**
 * Item memoizado da lista para evitar re-renders desnecessários
 */
const ProjectListItem = memo(function ProjectListItem({ 
  index, 
  style, 
  data 
}: {
  index: number
  style: React.CSSProperties
  data: {
    projects: any[]
    onProjectSelect: (project: any) => void
    loadMore: () => void
    hasMore: boolean
  }
}) {
  const { projects, onProjectSelect, loadMore, hasMore } = data
  const project = projects[index]

  // Trigger load more quando próximo do final
  React.useEffect(() => {
    if (index >= projects.length - 5 && hasMore) {
      loadMore()
    }
  }, [index, projects.length, hasMore, loadMore])

  if (!project) {
    return (
      <div style={style} className="p-4 animate-pulse">
        <div className="bg-gray-200 h-24 rounded-lg"></div>
      </div>
    )
  }

  const healthConfig = {
    'healthy': { color: 'bg-green-100 text-green-800', label: 'Saudável' },
    'warning': { color: 'bg-yellow-100 text-yellow-800', label: 'Atenção' },
    'critical': { color: 'bg-red-100 text-red-800', label: 'Crítico' }
  }[project.health] || { color: 'bg-gray-100 text-gray-800', label: 'N/A' }

  const budgetUtilization = project.total_budget > 0 
    ? (project.used_budget / project.total_budget) * 100 
    : 0

  return (
    <div style={style} className="p-2">
      <div 
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onProjectSelect(project)}
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
                  style={{ width: `${project.progress_percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {project.progress_percentage}%
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
            {project.days_remaining !== null 
              ? `${project.days_remaining > 0 ? '' : '-'}${Math.abs(project.days_remaining)} dias`
              : 'Sem prazo'
            }
          </span>
        </div>
      </div>
    </div>
  )
})

/**
 * Componente principal otimizado
 */
export default function OptimizedProjectList({
  filters = {},
  onProjectSelect,
  height = 600,
  itemHeight = 140,
  enableVirtualization = true
}: OptimizedProjectListProps) {
  const {
    projects,
    loading,
    error,
    hasMore,
    metrics,
    loadMore,
    invalidateCache
  } = useOptimizedProjects(filters, {
    enabled: true,
    refetchInterval: 30000 // Refetch a cada 30s
  })

  // Memoizar dados para react-window
  const listData = useMemo(() => ({
    projects,
    onProjectSelect: onProjectSelect || (() => {}),
    loadMore,
    hasMore
  }), [projects, onProjectSelect, loadMore, hasMore])

  // Callback otimizado para item loaded
  const isItemLoaded = useCallback(
    (index: number) => index < projects.length,
    [projects.length]
  )

  // Callback para load more items
  const loadMoreItems = useCallback(
    () => hasMore && !loading ? loadMore() : Promise.resolve(),
    [hasMore, loading, loadMore]
  )

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 text-lg font-medium mb-2">
          Erro ao carregar projetos
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={invalidateCache}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  if (loading && !projects.length) {
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

  // Renderização com virtualização
  if (enableVirtualization && projects.length > 20) {
    return (
      <ErrorBoundary>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={hasMore ? projects.length + 1 : projects.length}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={ref}
              height={height}
              itemCount={projects.length}
              itemSize={itemHeight}
              itemData={listData}
              onItemsRendered={onItemsRendered}
              overscanCount={5}
              className="scrollbar-thin scrollbar-thumb-gray-300"
            >
              {ProjectListItem}
            </List>
          )}
        </InfiniteLoader>
      </ErrorBoundary>
    )
  }

  // Renderização tradicional para listas menores
  return (
    <div className="space-y-4">
      {projects.map((project, index) => (
        <ProjectListItem
          key={project.id}
          index={index}
          style={{}}
          data={listData}
        />
      ))}
      
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {hasMore && !loading && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Carregar Mais
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Hook para intersection observer
 */
function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback()
        }
      },
      {
        threshold: 0.1,
        ...options
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [callback, options])
}