// src/services/optimizedQueries.ts
/**
 * Serviço de queries otimizadas para reduzir latência e melhorar performance
 * Implementa patterns de caching e batching para operações críticas
 */

import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Tables = Database['public']['Tables']

interface QueryCache {
  [key: string]: {
    data: any
    timestamp: number
    ttl: number
  }
}

class OptimizedQueryService {
  private cache: QueryCache = {}
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

  /**
   * Cache inteligente com TTL configurável
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache[key]
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      delete this.cache[key]
      return null
    }
    
    return cached.data as T
  }

  private setCache<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    }
  }

  /**
   * Query otimizada para lista de projetos com joins eficientes
   * Reduz múltiplas queries para uma única consulta
   */
  async getProjectsOptimized(filters?: {
    status?: string[]
    health?: string[]
    limit?: number
    offset?: number
  }) {
    const cacheKey = `projects_${JSON.stringify(filters || {})}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    const query = supabase
      .from('projects')
      .select(`
        id, name, description, project_type, status, health, 
        progress_percentage, total_budget, used_budget,
        start_date, estimated_end_date, risk_level, next_milestone,
        client:clients!inner(id, company_name),
        manager:team_members!inner(id, full_name, email),
        project_team_members(count),
        technologies:project_technologies(name),
        milestones:project_milestones(
          id, title, status, due_date,
          team_member:team_members(full_name)
        )
      `)
      .eq('is_active', true)

    // Aplicar filtros dinamicamente
    if (filters?.status?.length) {
      query.in('status', filters.status)
    }
    if (filters?.health?.length) {
      query.in('health', filters.health)
    }
    if (filters?.limit) {
      query.limit(filters.limit)
    }
    if (filters?.offset) {
      query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
    }

    const { data, error } = await query.order('updated_at', { ascending: false })

    if (error) throw new Error(`Query error: ${error.message}`)

    // Processar dados para adicionar métricas calculadas
    const processedData = data?.map(project => ({
      ...project,
      team_count: project.project_team_members?.[0]?.count || 0,
      budget_utilization: project.total_budget > 0 
        ? Math.round((project.used_budget / project.total_budget) * 100)
        : 0,
      days_remaining: project.estimated_end_date 
        ? Math.ceil((new Date(project.estimated_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
      active_milestones: project.milestones?.filter(m => m.status === 'Em Andamento')?.length || 0
    }))

    this.setCache(cacheKey, processedData)
    return processedData
  }

  /**
   * Query otimizada para detalhes de projeto com agregações
   */
  async getProjectDetailsOptimized(projectId: string) {
    const cacheKey = `project_details_${projectId}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    // Usar Promise.allSettled para queries paralelas com fallback
    const [
      projectResult,
      metricsResult,
      timelineResult
    ] = await Promise.allSettled([
      // Query principal do projeto
      supabase
        .from('projects')
        .select(`
          *, 
          client:clients(id, company_name, account_health),
          manager:team_members(id, full_name, email, primary_specialization),
          technologies:project_technologies(name, category),
          scope_items:project_scope(id, title, status, due_date),
          team_members:project_team_members(
            role_in_project,
            allocation_percentage,
            team_member:team_members(
              full_name, primary_specialization, 
              seniority_level, availability_status
            )
          )
        `)
        .eq('id', projectId)
        .single(),

      // Métricas agregadas
      supabase.rpc('get_project_metrics', { 
        project_id: projectId 
      }),

      // Timeline consolidada
      supabase.rpc('get_project_timeline', { 
        project_id: projectId,
        limit_items: 50
      })
    ])

    const project = projectResult.status === 'fulfilled' ? projectResult.value.data : null
    const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value.data : null
    const timeline = timelineResult.status === 'fulfilled' ? timelineResult.value.data : []

    if (!project) {
      throw new Error('Project not found')
    }

    const enhancedProject = {
      ...project,
      metrics: metrics || {
        total_milestones: 0,
        completed_milestones: 0,
        total_deliverables: 0,
        approved_deliverables: 0,
        active_risks: 0,
        team_utilization: 0
      },
      timeline,
      health_score: this.calculateHealthScore(project, metrics)
    }

    this.setCache(cacheKey, enhancedProject, 2 * 60 * 1000) // Cache menor para detalhes
    return enhancedProject
  }

  /**
   * Batch loading para múltiplos projetos
   */
  async batchLoadProjects(projectIds: string[]) {
    const batches = this.chunkArray(projectIds, 10) // Processar em lotes de 10
    
    const results = await Promise.all(
      batches.map(batch => 
        supabase
          .from('projects')
          .select('id, name, status, health, progress_percentage')
          .in('id', batch)
      )
    )

    return results.flatMap(result => result.data || [])
  }

  /**
   * Search otimizado com índices
   */
  async searchProjectsOptimized(searchTerm: string, filters?: any) {
    if (!searchTerm.trim()) return []

    const cacheKey = `search_${searchTerm}_${JSON.stringify(filters || {})}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('projects')
      .select(`
        id, name, description, client:clients(company_name),
        ts_rank_cd(search_vector, plainto_tsquery($1)) as rank
      `)
      .textSearch('search_vector', searchTerm, {
        type: 'websearch',
        config: 'portuguese'
      })
      .order('rank', { ascending: false })
      .limit(20)

    if (error) throw error

    this.setCache(cacheKey, data, 30 * 1000) // Cache curto para buscas
    return data
  }

  /**
   * Invalidação inteligente de cache
   */
  invalidateProjectCache(projectId?: string) {
    if (projectId) {
      // Invalidar caches específicos do projeto
      Object.keys(this.cache)
        .filter(key => key.includes(projectId))
        .forEach(key => delete this.cache[key])
    } else {
      // Invalidar todos os caches de projetos
      Object.keys(this.cache)
        .filter(key => key.startsWith('projects_') || key.startsWith('project_'))
        .forEach(key => delete this.cache[key])
    }
  }

  /**
   * Cálculo de health score baseado em métricas
   */
  private calculateHealthScore(project: any, metrics: any): number {
    let score = 100

    // Reduzir por atraso no cronograma
    if (project.estimated_end_date) {
      const daysRemaining = Math.ceil(
        (new Date(project.estimated_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      if (daysRemaining < 0) score -= 30
      else if (daysRemaining < 7) score -= 15
    }

    // Reduzir por orçamento estourado
    if (project.total_budget > 0) {
      const budgetUtilization = (project.used_budget / project.total_budget) * 100
      if (budgetUtilization > 100) score -= 25
      else if (budgetUtilization > 90) score -= 10
    }

    // Reduzir por riscos ativos
    if (metrics?.active_risks > 0) {
      score -= Math.min(metrics.active_risks * 5, 20)
    }

    // Reduzir por baixo progresso
    if (project.progress_percentage < 50 && project.status === 'Executando') {
      score -= 15
    }

    return Math.max(score, 0)
  }

  /**
   * Utility para dividir arrays em chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Limpeza periódica do cache
   */
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now()
      Object.entries(this.cache).forEach(([key, value]) => {
        if (now - value.timestamp > value.ttl) {
          delete this.cache[key]
        }
      })
    }, 60 * 1000) // Limpeza a cada minuto
  }
}

// Singleton instance
export const optimizedQueryService = new OptimizedQueryService()

// Auto-start cache cleanup
optimizedQueryService.startCacheCleanup()

export default optimizedQueryService