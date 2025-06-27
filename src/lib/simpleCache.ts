// src/lib/simpleCache.ts - CACHE SIMPLES E SEGURO
/**
 * Sistema de cache simples para otimizar queries do Supabase
 * Evita requisições desnecessárias sem causar loops
 */

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>()
  private readonly DEFAULT_TTL = 2 * 60 * 1000 // 2 minutos

  /**
   * Buscar no cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    console.log(`📦 Cache hit para: ${key}`)
    return entry.data as T
  }

  /**
   * Salvar no cache
   */
  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
    console.log(`💾 Cache salvou: ${key}`)
  }

  /**
   * Remover do cache
   */
  delete(key: string): void {
    this.cache.delete(key)
    console.log(`🗑️ Cache removeu: ${key}`)
  }

  /**
   * Limpar cache por padrão
   */
  clear(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys())
        .filter(key => key.includes(pattern))
      
      keysToDelete.forEach(key => this.cache.delete(key))
      console.log(`🧹 Cache limpou padrão: ${pattern} (${keysToDelete.length} items)`)
    } else {
      this.cache.clear()
      console.log('🧹 Cache completamente limpo')
    }
  }

  /**
   * Estatísticas do cache
   */
  getStats() {
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
   * Limpeza automática de itens expirados
   */
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    })

    if (cleaned > 0) {
      console.log(`🧹 Limpeza automática: ${cleaned} itens removidos`)
    }
  }

  /**
   * Iniciar limpeza periódica
   */
  startAutoCleanup(): void {
    // Limpar a cada 5 minutos
    setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)

    console.log('🕐 Limpeza automática de cache iniciada')
  }
}

// Instância singleton
export const simpleCache = new SimpleCache()

// Auto-iniciar limpeza se estiver no browser
if (typeof window !== 'undefined') {
  simpleCache.startAutoCleanup()
}

/**
 * Hook para usar cache com Supabase
 */
export function useCachedQuery<T>(
  key: string, 
  queryFn: () => Promise<T>, 
  ttl?: number
) {
  // Tentar buscar do cache primeiro
  const cached = simpleCache.get<T>(key)
  if (cached) {
    return Promise.resolve(cached)
  }

  // Se não estiver no cache, executar query e salvar
  return queryFn().then(result => {
    simpleCache.set(key, result, ttl)
    return result
  })
}

export default simpleCache