// src/app/projetos/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import ProjectListItem from '@/components/projects/ProjectListItem'
import { 
  Search, Download, Filter, FolderOpen, AlertTriangle, 
  CheckCircle, DollarSign, BarChart3, FileText, Plus
} from 'lucide-react'

// O tipo precisa ser importado ou definido aqui para corresponder ao componente
interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  project_type: string;
  risk_level: string;
  health: string;
  estimated_end_date?: string;
  start_date?: string;
  progress_percentage: number;
  total_budget: number;
  used_budget: number;
  client?: { company_name: string };
  manager?: { full_name: string };
  next_milestone?: string;
  project_team_members: { count: number }[];
}

interface Metrics {
  active_projects: number
  critical_projects: number
  total_value: number
  average_progress: number
}

// Componente para Cartão de Métrica (estilo da nova referência)
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
);

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [healthFilter, setHealthFilter] = useState('all')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadProjectsAndMetrics();
  }, [])

  const loadProjectsAndMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, name, description, project_type, status, health, progress_percentage,
          total_budget, used_budget, start_date, estimated_end_date, risk_level, next_milestone,
          client:clients(company_name),
          manager:team_members(full_name),
          project_team_members(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Erro Supabase: ${error.message}`)
      
      setProjects(data || [])
      calculateMetrics(data || [])

    } catch (error: any) {
      setError(error.message)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }
  
  const calculateMetrics = (data: Project[]) => {
    const activeProjects = data.filter(p => p.status === 'Executando').length
    const criticalProjects = data.filter(p => p.health === 'Crítico').length
    const totalValue = data.reduce((sum, p) => sum + (p.total_budget || 0), 0)
    const totalProgress = data.reduce((sum, p) => sum + (p.progress_percentage || 0), 0)
    const averageProgress = data.length > 0 ? Math.round(totalProgress / data.length) : 0

    setMetrics({
      active_projects: activeProjects,
      critical_projects: criticalProjects,
      total_value: totalValue,
      average_progress: averageProgress,
    })
  }
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const filteredProjects = projects.filter(project => {
    return (
      (searchTerm === '' || project.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || project.status === statusFilter) &&
      (typeFilter === 'all' || project.project_type === typeFilter) &&
      (healthFilter === 'all' || project.health === healthFilter)
    )
  })

  const FilterDropdown = ({ value, onChange, options, placeholder }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      // <-- MUDANÇA AQUI: Adicionamos text-gray-700 para escurecer o texto
      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white min-w-0 text-gray-700 font-medium"
    >
      <option value="all">{placeholder}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Erro ao Carregar Projetos</h2>
          <pre className="bg-red-100 text-red-700 p-4 rounded-md text-sm">{error}</pre>
          <button 
            onClick={loadProjectsAndMetrics}
            className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Projetos</h1>
          <p className="text-gray-600">Acompanhe o progresso e saúde dos seus projetos</p>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard title="Projetos Ativos" value={metrics.active_projects} icon={CheckCircle} colorClass="bg-blue-500" />
            <MetricCard title="Críticos" value={metrics.critical_projects} icon={AlertTriangle} colorClass="bg-red-500" />
            <MetricCard title="Valor Total" value={formatCurrency(metrics.total_value)} icon={DollarSign} colorClass="bg-green-500" />
            <MetricCard title="Média Progresso" value={`${metrics.average_progress}%`} icon={BarChart3} colorClass="bg-orange-500" />
          </div>
        )}
        
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lista de Projetos</h2>
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 flex flex-col md:flex-row gap-3 w-full">
                <div className="relative flex-grow">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar projetos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                     // <-- MUDANÇA AQUI: Adicionamos a classe para o placeholder
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
                  />
                </div>
                <div className="flex gap-3">
                  <FilterDropdown value={statusFilter} onChange={setStatusFilter} placeholder="Todos os Status" options={['Executando', 'Pausado', 'Concluído', 'Cancelado']} />
                  <FilterDropdown value={typeFilter} onChange={setTypeFilter} placeholder="Todos os Tipos" options={['MVP', 'PoC', 'Implementação', 'Consultoria']} />
                  <FilterDropdown value={healthFilter} onChange={setHealthFilter} placeholder="Todas as Saúdes" options={['Excelente', 'Bom', 'Crítico']} />
                </div>
              </div>
              <div className="flex gap-3">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2 text-gray-700 font-medium"> 
                      <Download className="w-4 h-4" /> Exportar
                  </button>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => (
                <ProjectListItem key={project.id} project={project} />
              ))
            ) : (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Nenhum projeto encontrado</h3>
                <p className="text-gray-600 mt-1">Tente ajustar seus filtros ou adicione um novo projeto.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}