// src/app/projetos/[id]/components/tabs/TimelineTab.tsx
'use client'

import { Calendar, Clock, GitBranch, Zap } from 'lucide-react'
import { InfoCard, EmptyState } from '../shared'
import { Milestone, Activity } from '../../types/project.types'

interface TimelineTabProps {
  milestones: Milestone[]
  activities: Activity[]
  loading?: boolean
}

export const TimelineTab = ({ milestones, activities, loading = false }: TimelineTabProps) => {
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <InfoCard title="Cronograma do Projeto" icon={Calendar}>
        <EmptyState
          title="Cronograma em Desenvolvimento"
          description="A visualização de cronograma será implementada na próxima versão. Por enquanto, você pode acompanhar marcos e atividades na aba anterior."
          icon={GitBranch}
          action={{
            label: "Ver Marcos e Atividades",
            onClick: () => {
              // Trigger tab change to deliverables
              const event = new CustomEvent('changeTab', { detail: 'deliverables' })
              window.dispatchEvent(event)
            }
          }}
        />
      </InfoCard>

      {/* Preview do que será implementado */}
      <InfoCard title="Recursos Planejados" icon={Zap}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Timeline Visual */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <GitBranch className="w-4 h-4 mr-2 text-blue-600" />
              Timeline Visual
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Visualização cronológica de marcos</li>
              <li>• Linha do tempo interativa</li>
              <li>• Identificação de dependências</li>
              <li>• Marcos críticos destacados</li>
            </ul>
          </div>

          {/* Calendário */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-green-600" />
              Calendário Integrado
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Visualização mensal/semanal</li>
              <li>• Integração com Google Calendar</li>
              <li>• Lembretes automáticos</li>
              <li>• Conflitos de agenda</li>
            </ul>
          </div>

          {/* Gantt Chart */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-purple-600" />
              Gráfico de Gantt
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Duração de atividades</li>
              <li>• Caminho crítico</li>
              <li>• Sobreposições e gaps</li>
              <li>• Replanejamento automático</li>
            </ul>
          </div>

          {/* Alertas */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-yellow-600" />
              Alertas Inteligentes
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Prazos próximos do vencimento</li>
              <li>• Bottlenecks identificados</li>
              <li>• Riscos de atraso</li>
              <li>• Sugestões de otimização</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Próximas Implementações</h4>
          <p className="text-sm text-blue-800">
            O cronograma visual será implementado nas próximas sprints, com foco em:
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1">
            <li>1. Timeline básica com marcos e atividades</li>
            <li>2. Integração com calendário</li>
            <li>3. Gráfico de Gantt interativo</li>
            <li>4. Sistema de alertas e notificações</li>
          </ul>
        </div>
      </InfoCard>

      {/* Estatísticas Temporárias */}
      <InfoCard title="Resumo Temporal" icon={Clock}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{milestones.length}</p>
            <p className="text-sm text-gray-600">Marcos Total</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
            <p className="text-sm text-gray-600">Atividades Total</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {milestones.filter(m => m.status === 'completed').length + 
               activities.filter(a => ['completed', 'approved', 'delivered'].includes(a.status)).length}
            </p>
            <p className="text-sm text-gray-600">Itens Concluídos</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {[...milestones, ...activities].filter(item => {
                const dueDate = new Date(item.due_date || (item as any).deadline || '')
                return dueDate < new Date() && !['completed', 'approved', 'delivered'].includes(item.status)
              }).length}
            </p>
            <p className="text-sm text-gray-600">Itens Atrasados</p>
          </div>
        </div>
      </InfoCard>
    </div>
  )
}

export default TimelineTab
