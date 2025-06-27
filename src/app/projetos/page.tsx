'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Search, Download, Filter, Eye, MoreHorizontal, Edit, FileText, Copy, Archive
} from 'lucide-react'

// Tipos simplificados para evitar problemas
interface SimpleProject {
  id: string
  name: string
  description?: string
  project_type: string
  status: string
  health: string
  health_score: number
  total_budget: number
  used_budget: number
  progress_percentage: number
  start_date?: string
  estimated_end_date?: string
  risk_level: string
  is_active: boolean
  created_at: string
  client?: {
    id: string
    company_name: string
  }
  manager?: {
    id: string
    full_name: string
    email: string
  }
}

interface SimpleMetrics {
  total_projects: number
  active_projects: number
  critical_projects: number
  total_value: number
  average_progress: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<SimpleProject[]>([])
  const [metrics, setMetrics] = useState<SimpleMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [healthFilter, setHealthFilter] = useState<string>('all')
  
  // Estado para controlar hidratação
  const [mounted, setMounted] = useState(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    setMounted(true)
    loadProjects()
    loadMetrics()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Carregando projetos...')
      console.log('📍 URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      // Tentar query simples primeiro
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      console.log('📊 Resultado da query:', { data, error })

      if (error) {
        console.error('❌ Erro na query:', error)
        throw new Error(`Erro Supabase: ${error.message} (Código: ${error.code})`)
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum projeto encontrado')
        setProjects([])
        return
      }

      console.log('✅ Projetos carregados:', data.length)
      setProjects(data)
      
    } catch (error: any) {
      console.error('💥 Erro completo:', error)
      const errorMessage = error.message || error.toString() || 'Erro desconhecido'
      setError(errorMessage)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)

      if (error) {
        console.error('Erro ao carregar métricas:', error)
        return
      }

      const totalProjects = projectsData?.length || 0
      const activeProjects = projectsData?.filter(p => p.status === 'Executando').length || 0
      const criticalProjects = projectsData?.filter(p => p.health === 'Crítico').length || 0
      const totalValue = projectsData?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0
      const totalProgress = projectsData?.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) || 0
      const averageProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0

      const metrics: SimpleMetrics = {
        total_projects: totalProjects,
        active_projects: activeProjects,
        critical_projects: criticalProjects,
        total_value: totalValue,
        average_progress: averageProgress
      }

      setMetrics(metrics)
    } catch (error: any) {
      console.error('Erro ao carregar métricas:', error)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesType = typeFilter === 'all' || project.project_type === typeFilter
    const matchesHealth = healthFilter === 'all' || project.health === healthFilter

    return matchesSearch && matchesStatus && matchesType && matchesHealth
  })

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definido'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  // Funções de cor estáticas para evitar hidratação
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Executando': return 'w-2 h-2 bg-blue-500 rounded-full'
      case 'Pausado': return 'w-2 h-2 bg-yellow-500 rounded-full'
      case 'Concluído': return 'w-2 h-2 bg-green-500 rounded-full'
      case 'Aprovado': return 'w-2 h-2 bg-green-400 rounded-full'
      case 'Cancelado': return 'w-2 h-2 bg-red-500 rounded-full'
      default: return 'w-2 h-2 bg-gray-500 rounded-full'
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Executando': return 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Pausado': return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Concluído': return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Aprovado': return 'bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium'
      case 'Cancelado': return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium'
      default: return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium'
    }
  }

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'Alto': return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Médio': return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Baixo': return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'Crítico': return 'bg-red-100 text-red-900 px-2 py-1 rounded-full text-xs font-medium'
      default: return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium'
    }
  }

  const handleProjectClick = (projectId: string) => {
    window.location.href = `/projetos/${projectId}`
  }

  // Não renderizar até montar para evitar hidratação
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Erro ao Carregar Projetos</h2>
            <div className="bg-red-100 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-mono text-sm">{error}</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-red-800">🔍 Possíveis Causas:</h3>
              <ul className="text-red-700 space-y-2">
                <li>• Tabela 'projects' não existe no Supabase</li>
                <li>• Variáveis de ambiente incorretas</li>
                <li>• RLS (Row Level Security) bloqueando acesso</li>
                <li>• Chave de API inválida</li>
              </ul>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-red-800">✅ Soluções:</h3>
              <ol className="text-red-700 space-y-2">
                <li>1. Execute o SQL no Supabase Dashboard</li>
                <li>2. Verifique .env.local na raiz do projeto</li>
                <li>3. Desabilite RLS temporariamente</li>
                <li>4. Instale: npm install @supabase/supabase-js</li>
              </ol>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={loadProjects}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                🔄 Tentar Novamente
              </button>
              <a 
                href="/debug"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                🔍 Página de Debug
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Projetos</h1>
          <p className="text-gray-600">Acompanhe o progresso e saúde dos seus projetos</p>
        </div>

        {/* Métricas */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.active_projects}</div>
                  <div className="text-sm text-gray-600">Projetos Ativos</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.critical_projects}</div>
                  <div className="text-sm text-gray-600">Críticos</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <div className="text-green-600 font-bold text-sm">R$</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.total_value)}</div>
                  <div className="text-sm text-gray-600">Valor Total</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <div className="text-orange-600 font-bold text-sm">%</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.average_progress}%</div>
                  <div className="text-sm text-gray-600">Média Progresso</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Projetos */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lista de Projetos</h2>
            
            {/* Busca e Filtros */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center flex-1">
                <div className="relative w-full lg:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar projetos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white min-w-0"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="Rascunho">Rascunho</option>
                    <option value="Proposta">Proposta</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Executando">Executando</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="all">Todos os Tipos</option>
                    <option value="MVP">MVP</option>
                    <option value="PoC">PoC</option>
                    <option value="Implementação">Implementação</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Suporte">Suporte</option>
                  </select>

                  <select
                    value={healthFilter}
                    onChange={(e) => setHealthFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="all">Todas as Saúdes</option>
                    <option value="Excelente">Excelente</option>
                    <option value="Bom">Bom</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
              </div>

              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="divide-y divide-gray-200">
            {filteredProjects.map(project => (
              <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={getStatusColorClass(project.status)}></div>
                    <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
                    <span className={getStatusBadgeClass(project.project_type)}>
                      {project.project_type}
                    </span>
                    <span className={getStatusBadgeClass(project.status)}>
                      {project.status}
                    </span>
                    <span className={getRiskBadgeClass(project.risk_level)}>
                      Risco {project.risk_level?.toLowerCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleProjectClick(project.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-gray-600 mb-4">{project.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Cliente</div>
                    <div className="font-medium text-gray-900">{project.client?.company_name || 'Não definido'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Gerente</div>
                    <div className="font-medium text-gray-900">{project.manager?.full_name || 'Não atribuído'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Início</div>
                    <div className="font-medium text-gray-900">{formatDate(project.start_date)}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Previsão Fim</div>
                    <div className="font-medium text-gray-900">{formatDate(project.estimated_end_date)}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Orçamento</div>
                    <div className="font-medium text-gray-900">{formatCurrency(project.total_budget)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-gray-900">Progresso: {project.progress_percentage}%</span>
                      <span className="text-sm text-gray-600">Usado: {formatCurrency(project.used_budget)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(project.progress_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Estado vazio */}
          {filteredProjects.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <FileText className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {projects.length === 0 ? 'Nenhum projeto encontrado' : 'Nenhum projeto corresponde aos filtros'}
              </h3>
              <p className="text-gray-600 mb-4">
                {projects.length === 0 
                  ? 'Execute o SQL no Supabase para criar dados de exemplo.'
                  : 'Tente ajustar os filtros para encontrar projetos.'
                }
              </p>
              {projects.length === 0 && (
                <button 
                  onClick={loadProjects}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Recarregar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">🔍 Debug Info:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>Total: {projects.length}</div>
            <div>Filtrados: {filteredProjects.length}</div>
            <div>Mounted: {mounted ? '✅' : '❌'}</div>
            <div>Loading: {loading ? '🔄' : '✅'}</div>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
              Último erro: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}