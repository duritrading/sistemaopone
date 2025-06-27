// src/app/projetos/page.tsx - VERSÃO OTIMIZADA PRÁTICA
// SUBSTITUA O CÓDIGO EXISTENTE POR ESTE

'use client'

import { useState, useMemo } from 'react'
import { 
  Search, Download, Filter, Plus,
  AlertTriangle, CheckCircle, DollarSign, BarChart3 
} from 'lucide-react'

// IMPORT DOS NOVOS HOOKS OTIMIZADOS
import { useOptimizedProjects } from '@/hooks/useOptimizedProjects'

// IMPORT DO COMPONENTE SIMPLIFICADO (sem dependências externas)
import SimpleOptimizedProjectList from '@/components/optimized/SimpleOptimizedProjectList'

interface ProjectFilters {
  search: string
  status: string[]
  health: string[]
  type: string[]
}

// Componente de métricas (mesmo do seu código)
const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-center gap-4">
    <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  </div>
)

export default function OptimizedProjectsPage() {
  // Estados locais (mesmo que antes)
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: [],
    health: [],
    type: []
  })

  // SUBSTITUIR: em vez de useEffect + supabase, use os hooks otimizados
  const {
    projects,
    loading,
    error,
    metrics,
    refresh,
    cacheStats
  } = useOptimizedProjects(filters, {
    enabled: true,
    autoRefresh: true,
    refreshInterval: 30000 // 30 segundos
  })

  // Formatação das métricas (adaptação dos seus valores existentes)
  const formattedMetrics = useMemo(() => [
    {
      title: 'Projetos Ativos',
      value: metrics.active,
      icon: CheckCircle,
      colorClass: 'bg-blue-500'
    },
    {
      title: 'Críticos', 
      value: metrics.critical,
      icon: AlertTriangle,
      colorClass: 'bg-red-500'
    },
    {
      title: 'Valor Total',
      value: `R$ ${(metrics.totalBudget / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      colorClass: 'bg-green-500'
    },
    {
      title: 'Média Progresso',
      value: `${metrics.avgProgress}%`,
      icon: BarChart3,
      colorClass: 'bg-orange-500'
    }
  ], [metrics])

  // Funções de filtro (mantém a mesma lógica)
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Aplicar filtros locais se necessário
      if (filters.status.length > 0 && !filters.status.includes(project.status)) {
        return false
      }
      if (filters.health.length > 0 && !filters.health.includes(project.health)) {
        return false
      }
      return true
    })
  }, [projects, filters])

  // Handlers (mantém a mesma lógica)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
  }

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }

  const handleHealthFilter = (health: string) => {
    setFilters(prev => ({
      ...prev,
      health: prev.health.includes(health)
        ? prev.health.filter(h => h !== health)
        : [...prev.health, health]
    }))
  }

  // Loading state (melhorado)
  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Projetos</h1>
            <p className="text-gray-600">Carregando dados otimizados...</p>
          </div>
          
          {/* Skeleton loading */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="bg-white rounded-lg p-5 border border-gray-200 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state (melhorado)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Erro ao Carregar Projetos</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-4">
              <button 
                onClick={refresh}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Tentar Novamente
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header com indicador de performance */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Projetos</h1>
              <p className="text-gray-600">
                Acompanhe o progresso e saúde dos seus projetos
                {loading && <span className="ml-2 text-blue-600">🔄 Atualizando...</span>}
              </p>
            </div>
            
            {/* Indicador de cache (opcional - para debug) */}
            {cacheStats && (
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Cache: {cacheStats.valid}/{cacheStats.total} • Hit Rate: {cacheStats.hitRate.toFixed(1)}%
              </div>
            )}
          </div>
        </div>

        {/* Métricas - MESMO LAYOUT, DADOS OTIMIZADOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {formattedMetrics.map((metric, index) => (
            <MetricCard
              key={metric.title}
              {...metric}
            />
          ))}
        </div>
        
        {/* Filtros - MESMO LAYOUT */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lista de Projetos</h2>
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

                {/* Health */}
                {[
                  { key: 'healthy', label: 'Saudável' },
                  { key: 'warning', label: 'Atenção' },
                  { key: 'critical', label: 'Crítico' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleHealthFilter(key)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.health.includes(key)
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <button 
                  onClick={refresh}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  {loading ? '🔄' : '🔄'} Atualizar
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Novo Projeto
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Projetos - USA COMPONENTE OTIMIZADO SIMPLIFICADO */}
          <div className="p-6">
            <SimpleOptimizedProjectList
              projects={filteredProjects}
              onProjectSelect={(project) => {
                // Navegar para página de detalhes
                window.location.href = `/projetos/${project.id}`
              }}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}