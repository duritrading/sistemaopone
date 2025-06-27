// src/hooks/useOptimizedProjects.ts
/**
 * Hook otimizado para projetos - SUBSTITUIÇÃO DIRETA
 * Use este hook no lugar dos existentes para ganhos imediatos de performance
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { optimizedProjectService } from '@/services/optimizedProjectService'

interface ProjectFilters {
  search?: string
  status?: string[]
  health?: string[]
  type?: string[]
}

interface UseProjectsOptions {
  enabled?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

/**
 * Hook principal para lista de projetos
 * USO: const { projects, loading, error, metrics } = useOptimizedProjects(filters)
 */
export function useOptimizedProjects(
  filters: ProjectFilters = {},
  options: UseProjectsOptions = { enabled: true }
) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState({
    active: 0,
    critical: 0,
    totalBudget: 0,
    avgProgress: 0
  })

  // Debounce da busca para evitar muitas queries
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search || '')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search || '')
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.search])

  // Filtros memoizados
  const memoizedFilters = useMemo(() => ({
    search: debouncedSearch,
    status: filters.status,
    health: filters.health,
    limit: 50 // Limite razoável
  }), [debouncedSearch, filters.status, filters.health])

  // Função para carregar projetos
  const loadProjects = useCallback(async () => {
    if (!options.enabled) return

    try {
      setLoading(true)
      setError(null)

      const [projectsData, metricsData] = await Promise.all([
        optimizedProjectService.getProjects(memoizedFilters),
        optimizedProjectService.getDashboardMetrics()
      ])

      setProjects(projectsData)
      setMetrics(metricsData)

    } catch (err: any) {
      console.error('Erro ao carregar projetos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [memoizedFilters, options.enabled])

  // Carregar dados quando filtros mudam
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Auto-refresh opcional
  useEffect(() => {
    if (!options.autoRefresh || !options.refreshInterval) return

    const interval = setInterval(() => {
      if (!loading) {
        console.log('🔄 Auto-refresh dos projetos')
        loadProjects()
      }
    }, options.refreshInterval)

    return () => clearInterval(interval)
  }, [options.autoRefresh, options.refreshInterval, loading, loadProjects])

  // Função para invalidar cache e recarregar
  const refresh = useCallback(() => {
    optimizedProjectService.invalidateCache('projects')
    loadProjects()
  }, [loadProjects])

  // Estatísticas do cache
  const cacheStats = useMemo(() => {
    return optimizedProjectService.getCacheStats()
  }, [projects]) // Recalcula quando projetos mudam

  return {
    projects,
    loading,
    error,
    metrics,
    refresh,
    cacheStats
  }
}

/**
 * Hook para detalhes de um projeto específico
 * USO: const { project, loading } = useProjectDetails(projectId)
 */
export function useProjectDetails(projectId: string, enabled = true) {
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const loadProject = useCallback(async () => {
    if (!projectId || !enabled) return

    try {
      setLoading(true)
      setError(null)

      const projectData = await optimizedProjectService.getProjectDetails(projectId)
      setProject(projectData)

    } catch (err: any) {
      console.error('Erro ao carregar projeto:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, enabled])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const refresh = useCallback(() => {
    optimizedProjectService.invalidateCache(`project_details_${projectId}`)
    loadProject()
  }, [projectId, loadProject])

  return {
    project,
    loading,
    error,
    refresh
  }
}

/**
 * Hook para busca de projetos
 * USO: const { results, searching } = useProjectSearch(searchTerm)
 */
export function useProjectSearch(searchTerm: string, enabled = true) {
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce da busca
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const search = useCallback(async () => {
    if (!debouncedTerm.trim() || !enabled) {
      setResults([])
      return
    }

    try {
      setSearching(true)
      setError(null)

      const searchResults = await optimizedProjectService.searchProjects(debouncedTerm)
      setResults(searchResults)

    } catch (err: any) {
      console.error('Erro na busca:', err)
      setError(err.message)
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [debouncedTerm, enabled])

  useEffect(() => {
    search()
  }, [search])

  return {
    results,
    searching,
    error,
    hasResults: results.length > 0,
    hasSearch: debouncedTerm.trim().length > 0
  }
}

/**
 * Hook para métricas em tempo real
 * USO: const { metrics, loading } = useDashboardMetrics()
 */
export function useDashboardMetrics(autoRefresh = false, refreshInterval = 30000) {
  const [metrics, setMetrics] = useState({
    active: 0,
    critical: 0,
    totalBudget: 0,
    avgProgress: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const metricsData = await optimizedProjectService.getDashboardMetrics()
      setMetrics(metricsData)

    } catch (err: any) {
      console.error('Erro ao carregar métricas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMetrics()
  }, [loadMetrics])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (!loading) {
        console.log('🔄 Auto-refresh das métricas')
        loadMetrics()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loading, loadMetrics])

  const refresh = useCallback(() => {
    optimizedProjectService.invalidateCache('dashboard_metrics')
    loadMetrics()
  }, [loadMetrics])

  return {
    metrics,
    loading,
    error,
    refresh
  }
}