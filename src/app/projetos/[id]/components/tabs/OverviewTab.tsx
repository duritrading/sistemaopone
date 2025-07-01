// src/app/projetos/[id]/components/tabs/OverviewTab.tsx
'use client'

import { 
  BarChart3, 
  DollarSign, 
  Target, 
  Clock, 
  FileText, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react'
import { 
  KPICard, 
  InfoCard, 
  InfoPair, 
  ProgressBar, 
  formatCurrency, 
  formatCurrencyCompact, 
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
  const getTrendDirection = (value: number, threshold: { good: number; warning: number }) => {
    if (value >= threshold.good) return 'up'
    if (value >= threshold.warning) return 'neutral'
    return 'down'
  }

  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'healthy': case 'verde': return 'text-green-600'
      case 'warning': case 'amarelo': return 'text-yellow-600'
      case 'critical': case 'vermelho': return 'text-red-600'
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-gray-200 w-12 h-12" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-8 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Progresso"
          value={`${kpis.overallProgress}%`}
          icon={BarChart3}
          subtitle="do projeto concluído"
          trend={getTrendDirection(kpis.overallProgress, { good: 70, warning: 30 })}
          colorClass="bg-blue-500"
        />
        
        <KPICard
          title="Orçamento Usado"
          value={formatCurrencyCompact(project.used_budget)}
          icon={DollarSign}
          subtitle={`de ${formatCurrencyCompact(project.total_budget)}`}
          trend={kpis.budgetUtilization <= kpis.overallProgress ? 'up' : 'down'}
          colorClass="bg-green-500"
        />
        
        <KPICard
          title="Marcos Concluídos"
          value={kpis.completedMilestones}
          icon={Target}
          subtitle={`de ${kpis.totalMilestones} marcos`}
          trend={kpis.completedMilestones > 0 ? 'up' : 'neutral'}
          colorClass="bg-purple-500"
        />
        
        <KPICard
          title="Dias Restantes"
          value={kpis.daysRemaining}
          icon={Clock}
          subtitle="até o prazo final"
          trend={getTrendDirection(kpis.daysRemaining, { good: 30, warning: 7 })}
          colorClass={kpis.daysRemaining > 30 ? 'bg-green-500' : kpis.daysRemaining > 7 ? 'bg-yellow-500' : 'bg-red-500'}
        />
      </div>

      {/* Cards de Informações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Informações do Projeto */}
        <InfoCard title="Informações do Projeto" icon={FileText}>
          <div className="space-y-3">
            <InfoPair label="Descrição" value={project.description} />
            <InfoPair label="Tipo" value={project.project_type} />
            <InfoPair label="Fase Atual" value={getProjectPhase()} />
            <InfoPair label="Nível de Risco" value={project.risk_level} />
            <InfoPair label="Próximo Marco" value={project.next_milestone} />
          </div>
        </InfoCard>

        {/* Equipe e Cliente */}
        <InfoCard title="Equipe e Cliente" icon={Users}>
          <div className="space-y-3">
            <InfoPair label="Cliente" value={project.client?.company_name} />
            <InfoPair label="Gerente do Projeto" value={project.manager?.full_name} />
            <InfoPair label="Total de Marcos" value={kpis.totalMilestones.toString()} />
            <InfoPair label="Total de Atividades" value={kpis.totalActivities.toString()} />
            <InfoPair 
              label="Itens em Risco" 
              value={
                <span className={getRiskLevel().color}>
                  {kpis.activeRisks} ({getRiskLevel().label})
                </span>
              } 
            />
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
              {project.health === 'healthy' ? 'Saudável' :
               project.health === 'warning' ? 'Atenção' :
               project.health === 'critical' ? 'Crítico' : project.health}
            </p>
          </div>
        </div>
      </InfoCard>

      {/* Progresso Detalhado */}
      <InfoCard title="Progresso do Projeto" icon={TrendingUp}>
        <div className="space-y-6">
          
          {/* Progresso Geral */}
          <div>
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
              showLabel={false}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatCurrency(project.used_budget)}</span>
              <span>{formatCurrency(project.total_budget)}</span>
            </div>
          </div>

          {/* Estatísticas de Entregáveis */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Marcos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {kpis.completedMilestones}/{kpis.totalMilestones}
              </p>
              <p className="text-xs text-gray-600">concluídos</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Atividades</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {kpis.completedActivities}/{kpis.totalActivities}
              </p>
              <p className="text-xs text-gray-600">concluídas</p>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Alertas e Riscos (se houver) */}
      {kpis.activeRisks > 0 && (
        <InfoCard title="Alertas do Projeto" icon={AlertTriangle}>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800">
                  {kpis.activeRisks} item(s) em risco
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Existem marcos ou atividades com prazo vencido que ainda não foram concluídos.
                  Verifique a aba "Marcos e Entregáveis" para mais detalhes.
                </p>
              </div>
            </div>
          </div>
        </InfoCard>
      )}

      {/* Performance Insights */}
      <InfoCard title="Insights de Performance" icon={TrendingUp}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Velocidade */}
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {kpis.totalMilestones + kpis.totalActivities > 0 
                ? Math.round((kpis.completedMilestones + kpis.completedActivities) / 
                    Math.max((new Date().getTime() - new Date(project.start_date || '').getTime()) / (1000 * 60 * 60 * 24), 1))
                : 0}
            </div>
            <p className="text-sm text-gray-600">itens/dia</p>
            <p className="text-xs text-gray-500 mt-1">Velocidade média</p>
          </div>
          
          {/* Eficiência */}
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {kpis.budgetUtilization > 0 
                ? Math.round((kpis.overallProgress / kpis.budgetUtilization) * 100)
                : 100}%
            </div>
            <p className="text-sm text-gray-600">eficiência</p>
            <p className="text-xs text-gray-500 mt-1">Progresso vs Orçamento</p>
          </div>
          
          {/* Qualidade */}
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {kpis.totalMilestones + kpis.totalActivities > 0 
                ? Math.round(((kpis.totalMilestones + kpis.totalActivities - kpis.activeRisks) / 
                    (kpis.totalMilestones + kpis.totalActivities)) * 100)
                : 100}%
            </div>
            <p className="text-sm text-gray-600">qualidade</p>
            <p className="text-xs text-gray-500 mt-1">Itens no prazo</p>
          </div>
        </div>
      </InfoCard>
    </div>
  )
}

export default OverviewTab