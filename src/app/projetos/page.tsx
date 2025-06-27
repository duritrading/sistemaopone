// src/app/projetos/page.tsx - VERSÃO OTIMIZADA
/**
 * Página de projetos completamente otimizada
 * Implementa todas as melhorias de performance identificadas
 */

'use client'

import React, { Suspense, lazy, useMemo, useCallback, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { 
  Search, Download, Filter, Plus, 
  AlertTriangle, CheckCircle, DollarSign, BarChart3 
} from 'lucide-react'

import { useOptimizedProjects } from '@/hooks/useOptimizedProjects'
import { usePerformanceMonitor, useQueryMonitor } from '@/utils/performanceMonitor'
import { useDebounce } from '@/hooks/useDebounce'

// Lazy loading de componentes pesados
const OptimizedProjectList = lazy(() => import('@/components/optimized/OptimizedProjectList'))
const ExportModal = lazy(() => import('@/components/modals/ExportModal'))
const NewProjectModal = lazy(() => import('@/components/modals/NewProjectModal'))

// Interfaces otimizadas
interface ProjectFilters {
  search: string
  status: string[]
  health: string[]
  type: string[]
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<any>
  colorClass: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

/**
 * Componente de métrica memoizado para evitar re-renders
 */
const MetricCard = React.memo<MetricCardProps>(function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  colorClass,
  trend 
}) {
  return (
    <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
        {trend && (
          <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
          </p>
        )}
      </div>
    </div>
  )
})

/**
 * Componente de filtros memoizado
 */
const FilterPanel = React.memo<{
  filters: ProjectFilters
  onFiltersChange: (filters: ProjectFilters) => void
  onExport: () => void
  onNewProject: () => void
}>(function FilterPanel({ filters, onFiltersChange, onExport, onNewProject }) {
  const { measureSync } = usePerformanceMonitor('FilterPanel')
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    measureSync('search_change', () => {
      onFiltersChange({
        ...filters,
        search: e.target.value
      })
    })
  }, [filters, onFiltersChange, measureSync])

  const handleStatusFilter = useCallback((status: string) => {
    measureSync('status_filter', () => {
      const newStatuses = filters.status.includes(status)
        ? filters.status.filter(s => s !== status)
        : [...filters.status, status]
      
      onFiltersChange({
        ...filters,
        status: newStatuses
      })
    })
  }, [filters, onFiltersChange, measureSync])

  const handleHealthFilter = useCallback((health: string) => {
    measureSync('health_filter', () => {
      const newHealth = filters.health.includes(health)
        ? filters.health.filter(h => h !== health)
        : [...filters.health, health]
      
      onFiltersChange({
        ...filters,
        health: newHealth
      })
    })
  }, [filters, onFiltersChange, measureSync])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Busca */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2">
          {/* Status */}
          <div className="flex gap-1">
            {['Executando', 'Planejamento', 'Pausado'].map(status => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.status.includes(status)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Health */}
          <div className="flex gap-1 ml-2">
            {[
              { key: 'healthy', label: 'Saudável', color: 'green' },
              { key: 'warning', label: 'Atenção', color: 'yellow' },
              { key: 'critical', label: 'Crítico', color: 'red' }
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => handleHealthFilter(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.health.includes(key)
                    ? `bg-${color}-100 text-${color}-800`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>
      </div>
    </div>
  )
})

/**
 * Componente principal da página
 */
export default function OptimizedProjectsPage() {
  const { measureAsync } = usePerformanceMonitor('ProjectsPage')
  const { measureQuery } = useQueryMonitor()
  
  // Estados locais
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: [],
    health: [],
    type: []
  })
  
  const [modals, setModals] = useState({
    export: false,
    newProject: false
  })

  // Debounce da busca para otimizar queries
  const debouncedSearch = useDebounce(filters.search, 300)

  // Filtros otimizados para o hook
  const optimizedFilters = useMemo(() => ({
    search: debouncedSearch,
    status: filters.status.length > 0 ? filters.status : undefined,
    health: filters.health.length > 0 ? filters.health : undefined,
    limit: 20 // Paginação
  }), [debouncedSearch, filters.status, filters.health])

  // Hook otimizado para projetos
  const {
    projects,
    loading,
    error,
    metrics,
    hasMore,
    loadMore,
    invalidateCache
  } = useOptimizedProjects(optimizedFilters, {
    enabled: true,
    refetchInterval: 30000 // 30 segundos
  })

  // Callbacks otimizados
  const handleFiltersChange = useCallback((newFilters: ProjectFilters) => {
    measureAsync('filter_change', async () => {
      setFilters(newFilters)
    })
  }, [measureAsync])

  const handleProjectSelect = useCallback((project: any) => {
    measureAsync('project_select', async () => {
      // Navegar para detalhes do projeto
      window.location.href = `/projetos/${project.id}`
    })
  }, [measureAsync])

  const handleExport = useCallback(() => {
    measureAsync('export', async () => {
      setModals(prev => ({ ...prev, export: true }))
    })
  }, [measureAsync])

  const handleNewProject = useCallback(() => {
    setModals(prev => ({ ...prev, newProject: true }))
  }, [])

  const handleModalClose = useCallback((modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }))
  }, [])

  const handleProjectCreated = useCallback(() => {
    measureAsync('project_created', async () => {
      invalidateCache()
      setModals(prev => ({ ...prev, newProject: false }))
    })
  }, [invalidateCache, measureAsync])

  // Métricas memoizadas com trends
  const metricsWithTrends = useMemo(() => [
    {
      title: 'Projetos Ativos',
      value: metrics.active,
      icon: CheckCircle,
      colorClass: 'bg-blue-500',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Críticos',
      value: metrics.critical,
      icon: AlertTriangle,
      colorClass: 'bg-red-500',
      trend: { value: 8, isPositive: false }
    },
    {
      title: 'Orçamento Total',
      value: `R$ ${(metrics.totalBudget / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      colorClass: 'bg-green-500',
      trend: { value: 15, isPositive: true }
    },
    {
      title: 'Progresso Médio',
      value: `${metrics.avgProgress}%`,
      icon: BarChart3,
      colorClass: 'bg-orange-500',
      trend: { value: 5, isPositive: true }
    }
  ], [metrics])

  // Error boundary fallback
  const ErrorFallback = useCallback(({ error, resetErrorBoundary }: any) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg border border-red-200 max-w-md w-full">
        <h2 className="text-xl font-semibold text-red-800 mb-4">
          Erro no Sistema
        </h2>
        <p className="text-red-600 mb-4">
          {error.message || 'Ocorreu um erro inesperado'}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  ), [])

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestão de Projetos
            </h1>
            <p className="text-gray-600">
              Acompanhe o progresso e saúde dos seus projetos em tempo real
            </p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metricsWithTrends.map((metric, index) => (
              <MetricCard
                key={metric.title}
                {...metric}
              />
            ))}
          </div>

          {/* Filtros */}
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onExport={handleExport}
            onNewProject={handleNewProject}
          />

          {/* Lista de Projetos */}
          <Suspense fallback={
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }>
            <OptimizedProjectList
              filters={filters}
              onProjectSelect={handleProjectSelect}
              height={800}
              enableVirtualization={projects.length > 50}
            />
          </Suspense>

          {/* Modais Lazy Loaded */}
          <Suspense fallback={null}>
            {modals.export && (
              <ExportModal
                isOpen={modals.export}
                onClose={() => handleModalClose('export')}
                data={projects}
                filename="projetos"
              />
            )}
          </Suspense>

          <Suspense fallback={null}>
            {modals.newProject && (
              <NewProjectModal
                isOpen={modals.newProject}
                onClose={() => handleModalClose('newProject')}
                onSuccess={handleProjectCreated}
              />
            )}
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  )
}

// Export do componente com React.lazy para code splitting
export const LazyOptimizedProjectsPage = lazy(() => Promise.resolve({ 
  default: OptimizedProjectsPage 
}))