// src/hooks/useOptimizedProjects.ts
/**
 * Hooks otimizados para gestão de estado com memoização inteligente
 * Reduz re-renders e melhora performance significativamente
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { optimizedQueryService } from '@/services/optimizedQueries'
import { useDebounce } from './useDebounce'

interface ProjectFilters {
  status?: string[]
  health?: string[]
  search?: string
  limit?: number
  offset?: number
}

interface UseProjectsOptions {
  enabled?: boolean
  refetchInterval?: number
  suspense?: boolean
}

/**
 * Hook principal para lista de projetos com otimizações avançadas
 */
export function useOptimizedProjects(
  filters: ProjectFilters = {},
  options: UseProjectsOptions = {}
) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const abortControllerRef = useRef<AbortController | null>(null)
  const lastFiltersRef = useRef<string>('')

  // Debounce search para evitar queries excessivas
  const debouncedSearch = useDebounce(filters.search || '', 300)

  // Memoizar filtros para evitar re-fetches desnecessários
  const memoizedFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch
  }), [filters.status, filters.health, debouncedSearch, filters.limit, filters.offset])

  // Função otimizada de fetch com cancelamento
  const fetchProjects = useCallback(async (resetData = false) => {
    if (!options.enabled) return

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)

      let results
      
      if (memoizedFilters.search) {
        // Usar search otimizado
        results = await optimizedQueryService.searchProjectsOptimized(
          memoizedFilters.search,
          memoizedFilters
        )
      } else {
        // Usar query padrão otimizada
        results = await optimizedQueryService.getProjectsOptimized(memoizedFilters)
      }

      if (resetData || memoizedFilters.offset === 0) {
        setProjects(results || [])
      } else {
        // Append para paginação infinita
        setProjects(prev => [...prev, ...(results || [])])
      }

      setHasMore((results?.length || 0) === (memoizedFilters.limit || 10))

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message)
        console.error('Error fetching projects:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [memoizedFilters, options.enabled])

  // Invalidação inteligente de cache
  const invalidateCache = useCallback(() => {
    optimizedQueryService.invalidateProjectCache()
    fetchProjects(true)
  }, [fetchProjects])

  // Load more para infinite scroll
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextFilters = {
        ...memoizedFilters,
        offset: projects.length
      }
      fetchProjects(false)
    }
  }, [memoizedFilters, projects.length, loading, hasMore, fetchProjects])

  // Effect principal para fetch
  useEffect(() => {
    const filtersString = JSON.stringify(memoizedFilters)
    
    // Só fazer fetch se os filtros mudaram
    if (filtersString !== lastFiltersRef.current) {
      lastFiltersRef.current = filtersString
      fetchProjects(true)
    }
  }, [memoizedFilters, fetchProjects])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Auto-refetch configurável
  useEffect(() => {
    if (options.refetchInterval && options.refetchInterval > 0) {
      const interval = setInterval(() => {
        if (!loading) {
          fetchProjects(true)
        }
      }, options.refetchInterval)

      return () => clearInterval(interval)
    }
  }, [options.refetchInterval, loading, fetchProjects])

  // Métricas derivadas memoizadas
  const metrics = useMemo(() => {
    if (!projects.length) {
      return {
        active: 0,
        critical: 0,
        totalBudget: 0,
        avgProgress: 0
      }
    }

    return {
      active: projects.filter(p => p.status === 'Executando').length,
      critical: projects.filter(p => p.health === 'Crítico').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.total_budget || 0), 0),
      avgProgress: Math.round(
        projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length
      )
    }
  }, [projects])

  return {
    projects,
    loading,
    error,
    hasMore,
    metrics,
    fetchProjects: () => fetchProjects(true),
    loadMore,
    invalidateCache
  }
}

/**
 * Hook para detalhes de projeto individual
 */
export function useProjectDetails(projectId: string, enabled = true) {
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!projectId || !enabled) return

    try {
      setLoading(true)
      setError(null)

      const result = await optimizedQueryService.getProjectDetailsOptimized(projectId)
      setProject(result)

    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching project details:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId, enabled])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const invalidateCache = useCallback(() => {
    optimizedQueryService.invalidateProjectCache(projectId)
    fetchProject()
  }, [projectId, fetchProject])

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
    invalidateCache
  }
}

/**
 * Hook para operações batch
 */
export function useBatchOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const batchUpdate = useCallback(async (
    projectIds: string[], 
    updates: Record<string, any>
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Implementar batch update otimizado
      const { error: updateError } = await supabase
        .from('projects')
        .update(updates)
        .in('id', projectIds)

      if (updateError) throw updateError

      // Invalidar cache relevante
      projectIds.forEach(id => {
        optimizedQueryService.invalidateProjectCache(id)
      })

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const batchDelete = useCallback(async (projectIds: string[]) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .in('id', projectIds)

      if (deleteError) throw deleteError

      // Invalidar todo o cache de projetos
      optimizedQueryService.invalidateProjectCache()

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    batchUpdate,
    batchDelete
  }
}

/**
 * Hook para métricas em tempo real
 */
export function useRealTimeMetrics() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data, error } = await supabase.rpc('get_dashboard_metrics')
        if (error) throw error
        setMetrics(data)
      } catch (err) {
        console.error('Error fetching metrics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()

    // Subscription para updates em tempo real
    const subscription = supabase
      .channel('metrics_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects'
      }, () => {
        fetchMetrics()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { metrics, loading }
}

/**
 * Hook customizado para debounce
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}