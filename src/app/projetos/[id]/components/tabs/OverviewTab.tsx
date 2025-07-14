'use client'

import { 
  FileText, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Target,
  Clock
} from 'lucide-react'
import { 
  InfoCard, 
  InfoPair, 
  ProgressBar, 
  formatCurrency, 
  formatDate 
} from '../shared'
import { ProjectDetails, ProjectKPIs } from '../../types/project.types'

interface OverviewTabProps {
  project: ProjectDetails
  kpis: ProjectKPIs
  loading?: boolean
}

export const OverviewTab = ({ project, kpis, loading = false }: OverviewTabProps) => {
  
  // === HELPER FUNCTIONS ===
  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'healthy': case 'verde': case 'excelente': return 'text-green-600'
      case 'warning': case 'amarelo': case 'bom': return 'text-blue-600'
      case 'critical': case 'vermelho': case 'crítico': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRiskLevel = () => {
    if (kpis.activeRisks > 3) return { label: 'Alto', color: 'text-red-600' }
    if (kpis.activeRisks > 1) return { label: 'Médio', color: 'text-yellow-600' }
    if (kpis.activeRisks > 0) return { label: 'Baixo', color: 'text-yellow-600' }
    return { label: 'Muito Baixo', color: 'text-green-600' }
  }

  const getProjectPhase = () => {
    if (kpis.overallProgress === 0) return 'Iniciação'
    if (kpis.overallProgress < 25) return 'Planejamento'
    if (kpis.overallProgress < 75) return 'Execução'
    if (kpis.overallProgress < 100) return 'Finalização'
    return 'Concluído'
  }

  // Format risk level as string for InfoPair
  const formatRiskLevel = () => {
    const riskLevel = getRiskLevel()
    return `${kpis.activeRisks} (${riskLevel.label})`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Cards de Informações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Informações do Projeto */}
        <InfoCard title="Informações do Projeto" icon={FileText}>
          <div className="space-y-3">
            <InfoPair label="Descrição" value={project.description || 'Não informado'} />
            <InfoPair label="Tipo" value={project.project_type} />
            <InfoPair label="Fase Atual" value={getProjectPhase()} />
            <InfoPair label="Nível de Risco" value={project.risk_level} />
            <InfoPair label="Próximo Marco" value={project.next_milestone || 'Não definido'} />
          </div>
        </InfoCard>

        {/* Equipe e Cliente */}
        <InfoCard title="Equipe e Cliente" icon={Users}>
          <div className="space-y-3">
            <InfoPair label="Cliente" value={project.client?.company_name || 'Não informado'} />
            <InfoPair label="Gerente do Projeto" value={project.manager?.full_name || 'Não atribuído'} />
            <InfoPair label="Total de Marcos" value={kpis.totalMilestones.toString()} />
            <InfoPair label="Total de Atividades" value={kpis.totalActivities.toString()} />
            
            {/* FIXED: Convert JSX to string */}
            <div className="py-2">
              <span className="text-gray-700 font-medium">Itens em Risco:</span>
              <span className={`ml-2 ${getRiskLevel().color} font-medium`}>
                {formatRiskLevel()}
              </span>
            </div>
          </div>
        </InfoCard>
      </div>

      {/* Cronograma */}
      <InfoCard title="Cronograma do Projeto" icon={Calendar}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-gray-700 font-medium">Data de Início:</span>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {formatDate(project.start_date)}
            </p>
          </div>
          <div>
            <span className="text-gray-700 font-medium">Previsão de Término:</span>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {formatDate(project.estimated_end_date)}
            </p>
          </div>
          <div>
            <span className="text-gray-700 font-medium">Status de Saúde:</span>
            <p className={`text-lg font-semibold mt-1 ${getHealthColor(project.health)}`}>
              {project.health === 'Excelente' ? 'Excelente' :
               project.health === 'Bom' ? 'Bom' :
               project.health === 'Crítico' ? 'Crítico' : project.health}
            </p>
          </div>
        </div>
      </InfoCard>

      {/* Progresso Detalhado */}
      <InfoCard title="Progresso do Projeto" icon={TrendingUp}>
        <div className="space-y-6">
          
          {/* Progresso Geral */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
              <span className="text-sm font-semibold text-gray-900">{kpis.overallProgress}%</span>
            </div>
            <ProgressBar 
              value={kpis.overallProgress} 
              color="bg-blue-600"
              size="lg"
            />
            <p className="text-sm text-gray-600 mt-2">
              Baseado na conclusão de marcos e atividades
            </p>
          </div>
          
          {/* Progresso do Orçamento */}
          <div>
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Orçamento Utilizado</span>
              <span>{kpis.budgetUtilization}%</span>
            </div>
            <ProgressBar 
              value={kpis.budgetUtilization} 
              color={kpis.budgetUtilization > kpis.overallProgress ? "bg-red-600" : "bg-green-600"}
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Usado: {formatCurrency(project.used_budget || 0)}</span>
              <span>Total: {formatCurrency(project.total_budget || 0)}</span>
            </div>
          </div>

          {/* Progresso dos Marcos */}
          <div>
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Marcos Concluídos</span>
              <span>{kpis.completedMilestones}/{kpis.totalMilestones}</span>
            </div>
            <ProgressBar 
              value={kpis.totalMilestones > 0 ? (kpis.completedMilestones / kpis.totalMilestones) * 100 : 0}
              color="bg-purple-600"
            />
          </div>

          {/* Progresso das Atividades */}
          <div>
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Atividades Concluídas</span>
              <span>{kpis.completedActivities}/{kpis.totalActivities}</span>
            </div>
            <ProgressBar 
              value={kpis.totalActivities > 0 ? (kpis.completedActivities / kpis.totalActivities) * 100 : 0}
              color="bg-indigo-600"
            />
          </div>
        </div>
      </InfoCard>

      {/* Orçamento */}
      <InfoCard title="Orçamento do Projeto" icon={Target}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Orçamento Total</h4>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(project.total_budget || 0)}
            </p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-orange-900 mb-2">Utilizado</h4>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(project.used_budget || 0)}
            </p>
            <p className="text-sm text-orange-700 mt-1">
              {kpis.budgetUtilization}% do total
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-2">Disponível</h4>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency((project.total_budget || 0) - (project.used_budget || 0))}
            </p>
            <p className="text-sm text-green-700 mt-1">
              {100 - kpis.budgetUtilization}% restante
            </p>
          </div>
        </div>
      </InfoCard>

      {/* Status e Alertas */}
      {kpis.activeRisks > 0 && (
        <InfoCard title="Alertas e Riscos" icon={AlertTriangle}>
          <div className="space-y-4">
            
            {kpis.activeRisks > 0 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    {kpis.activeRisks} {kpis.activeRisks === 1 ? 'item em risco' : 'itens em risco'}
                  </p>
                  <p className="text-xs text-red-700">
                    Nível de risco: {getRiskLevel().label}
                  </p>
                </div>
              </div>
            )}

            {kpis.activeRisks === 0 && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Projeto sem alertas críticos
                  </p>
                  <p className="text-xs text-green-700">
                    Todos os itens estão dentro do prazo
                  </p>
                </div>
              </div>
            )}
          </div>
        </InfoCard>
      )}
    </div>
  )
}

export default OverviewTab