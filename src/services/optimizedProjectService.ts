// src/services/optimizedProjectService.ts
/**
 * Serviço otimizado para projetos - IMPLEMENTAÇÃO PRÁTICA
 * Substitui as queries existentes por versões com cache e performance melhorada
 */

import { supabase } from '@/lib/supabase'

interface ProjectFilters {
  search?: string
  status?: string[]
  health?: string[]
  limit?: number
  offset?: number
}

interface ProjectMetrics {
  active: number
  critical: number
  totalBudget: number
  avgProgress: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class OptimizedProjectService {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

  /**
   * Cache inteligente
   */
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  private setCache<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Buscar projetos com otimizações
   */
  async getProjects(filters: ProjectFilters = {}) {
    const cacheKey = `projects_${JSON.stringify(filters)}`
    const cached = this.getCached(cacheKey)
    if (cached) {
      console.log('📦 Cache hit para projetos')
      return cached
    }

    console.log('🔍 Buscando projetos do banco...')
    
    try {
      let query = supabase
        .from('projects')
        .select(`
          id, name, description, project_type, status, health,
          progress_percentage, total_budget, used_budget,
          start_date, estimated_end_date, risk_level, next_milestone,
          client:clients!inner(id, company_name),
          manager:team_members(id, full_name),
          project_team_members(count)
        `)
        .eq('is_active', true)

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
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1)
      }

      const { data, error } = await query.order('updated_at', { ascending: false })

      if (error) throw error

      // Processar dados
      const processedData = data?.map(project => ({
        ...project,
        team_count: project.project_team_members?.[0]?.count || 0,
        budget_utilization: project.total_budget > 0 
          ? Math.round((project.used_budget / project.total_budget) * 100)
          : 0,
        days_remaining: project.estimated_end_date 
          ? Math.ceil((new Date(project.estimated_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
      })) || []

      this.setCache(cacheKey, processedData)
      console.log(`✅ ${processedData.length} projetos carregados`)
      
      return processedData

    } catch (error) {
      console.error('❌ Erro ao buscar projetos:', error)
      throw error
    }
  }

  /**
   * Buscar detalhes de um projeto
   */
  async getProjectDetails(projectId: string) {
    const cacheKey = `project_details_${projectId}`
    const cached = this.getCached(cacheKey)
    if (cached) {
      console.log('📦 Cache hit para detalhes do projeto')
      return cached
    }

    console.log(`🔍 Buscando detalhes do projeto ${projectId}...`)

    try {
      // Query principal do projeto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          *, 
          client:clients(id, company_name),
          manager:team_members(id, full_name),
          technologies:project_technologies(name),
          scope_items:project_scope(id, title, status),
          team_members:project_team_members(
            role_in_project,
            team_member:team_members(
              full_name, primary_specialization
            )
          )
        `)
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError

      // Buscar métricas usando a função SQL
      const { data: metrics, error: metricsError } = await supabase
        .rpc('get_project_metrics', { project_id: projectId })

      if (metricsError) {
        console.warn('⚠️ Erro ao buscar métricas:', metricsError)
      }

      const enhancedProject = {
        ...project,
        metrics: metrics || {
          total_milestones: 0,
          completed_milestones: 0,
          total_deliverables: 0,
          approved_deliverables: 0,
          active_risks: 0
        }
      }

      this.setCache(cacheKey, enhancedProject, 2 * 60 * 1000) // Cache menor
      console.log('✅ Detalhes do projeto carregados')
      
      return enhancedProject

    } catch (error) {
      console.error('❌ Erro ao buscar detalhes:', error)
      throw error
    }
  }

  /**
   * Buscar métricas do dashboard
   */
  async getDashboardMetrics(): Promise<ProjectMetrics> {
    const cacheKey = 'dashboard_metrics'
    const cached = this.getCached<ProjectMetrics>(cacheKey)
    if (cached) {
      console.log('📦 Cache hit para métricas')
      return cached
    }

    console.log('🔍 Buscando métricas do dashboard...')

    try {
      const { data, error } = await supabase.rpc('get_dashboard_metrics')

      if (error) throw error

      const metrics: ProjectMetrics = {
        active: data?.[0]?.active_projects || 0,
        critical: data?.[0]?.critical_projects || 0,
        totalBudget: data?.[0]?.total_budget || 0,
        avgProgress: data?.[0]?.avg_progress || 0
      }

      this.setCache(cacheKey, metrics, 60 * 1000) // 1 minuto
      console.log('✅ Métricas carregadas:', metrics)
      
      return metrics

    } catch (error) {
      console.error('❌ Erro ao buscar métricas:', error)
      
      // Fallback: calcular manualmente
      return this.calculateMetricsFallback()
    }
  }

  /**
   * Busca otimizada com full-text search
   */
  async searchProjects(searchTerm: string, limit = 20) {
    if (!searchTerm.trim()) return []

    const cacheKey = `search_${searchTerm}_${limit}`
    const cached = this.getCached(cacheKey)
    if (cached) {
      console.log('📦 Cache hit para busca')
      return cached
    }

    console.log(`🔍 Buscando: "${searchTerm}"`)

    try {
      // Tentar usar a função de busca otimizada primeiro
      const { data, error } = await supabase
        .rpc('search_projects_optimized', {
          search_term: searchTerm,
          limit_results: limit
        })

      if (error) {
        console.warn('⚠️ Função de busca não disponível, usando fallback')
        return this.searchProjectsFallback(searchTerm, limit)
      }

      this.setCache(cacheKey, data || [], 30 * 1000) // 30 segundos
      console.log(`✅ ${data?.length || 0} resultados encontrados`)
      
      return data || []

    } catch (error) {
      console.error('❌ Erro na busca:', error)
      return this.searchProjectsFallback(searchTerm, limit)
    }
  }

  /**
   * Busca fallback caso a função SQL não esteja disponível
   */
  private async searchProjectsFallback(searchTerm: string, limit: number) {
    console.log('🔄 Usando busca fallback...')
    
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id, name, description,
        client:clients(company_name)
      `)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /**
   * Métricas fallback caso a função SQL falhe
   */
  private async calculateMetricsFallback(): Promise<ProjectMetrics> {
    console.log('🔄 Calculando métricas manualmente...')
    
    const { data, error } = await supabase
      .from('projects')
      .select('status, health, total_budget, progress_percentage')
      .eq('is_active', true)

    if (error) throw error

    const projects = data || []
    
    return {
      active: projects.filter(p => p.status === 'Executando').length,
      critical: projects.filter(p => p.health === 'Crítico').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.total_budget || 0), 0),
      avgProgress: projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length)
        : 0
    }
  }

  /**
   * Invalidar cache específico
   */
  invalidateCache(pattern?: string) {
    if (pattern) {
      Array.from(this.cache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.cache.delete(key))
      console.log(`🗑️ Cache invalidado para: ${pattern}`)
    } else {
      this.cache.clear()
      console.log('🗑️ Todo cache limpo')
    }
  }

  /**
   * Estatísticas do cache
   */
  getCacheStats() {
    const now = Date.now()
    let valid = 0
    let expired = 0

    this.cache.forEach((entry) => {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      } else {
        valid++
      }
    })

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: valid / (valid + expired) * 100 || 0
    }
  }

  /**
   * Limpeza automática do cache
   */
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now()
      let cleaned = 0

      this.cache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key)
          cleaned++
        }
      })

      if (cleaned > 0) {
        console.log(`🧹 ${cleaned} entradas de cache limpas`)
      }
    }, 60 * 1000) // A cada minuto
  }
}

// Instância singleton
export const optimizedProjectService = new OptimizedProjectService()

// Iniciar limpeza automática
if (typeof window !== 'undefined') {
  optimizedProjectService.startCacheCleanup()
}

export default optimizedProjectService