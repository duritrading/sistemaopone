// src/app/projetos/[id]/components/tabs/CommunicationTab.tsx
'use client'

import { MessageSquare, Users, Bell, FileText, Video, Mail } from 'lucide-react'
import { InfoCard, EmptyState } from '../shared'

interface CommunicationTabProps {
  projectId: string
  loading?: boolean
}

export const CommunicationTab = ({ projectId, loading = false }: CommunicationTabProps) => {
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
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
      <InfoCard title="Central de Comunicação" icon={MessageSquare}>
        <EmptyState
          title="Central de Comunicação em Desenvolvimento"
          description="O sistema de comunicação integrado será implementado na próxima versão, incluindo chat, comentários e notificações."
          icon={MessageSquare}
          action={{
            label: "Ver Roadmap",
            onClick: () => {
              // Scroll to roadmap section
              document.getElementById('communication-roadmap')?.scrollIntoView({ behavior: 'smooth' })
            }
          }}
        />
      </InfoCard>

      {/* Recursos Planejados */}
      <InfoCard title="Recursos de Comunicação Planejados" icon={Users} className="scroll-mt-6" id="communication-roadmap">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Chat em Tempo Real */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
              Chat em Tempo Real
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Conversas por projeto</li>
              <li>• Mensagens diretas</li>
              <li>• Histórico completo</li>
              <li>• Anexos e links</li>
              <li>• Emojis e reações</li>
            </ul>
          </div>

          {/* Comentários */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-green-600" />
              Sistema de Comentários
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Comentários em marcos</li>
              <li>• Feedback em atividades</li>
              <li>• Menções (@usuário)</li>
              <li>• Threading de conversas</li>
              <li>• Aprovações rápidas</li>
            </ul>
          </div>

          {/* Notificações */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Bell className="w-4 h-4 mr-2 text-yellow-600" />
              Notificações Inteligentes
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Alertas de prazo</li>
              <li>• Novas atribuições</li>
              <li>• Atualizações de status</li>
              <li>• Menções em discussões</li>
              <li>• Resumos diários</li>
            </ul>
          </div>

          {/* Videochamadas */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Video className="w-4 h-4 mr-2 text-purple-600" />
              Videochamadas Integradas
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Reuniões rápidas</li>
              <li>• Compartilhamento de tela</li>
              <li>• Gravação de sessões</li>
              <li>• Calendário integrado</li>
              <li>• Salas virtuais por projeto</li>
            </ul>
          </div>

          {/* Integrações */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Mail className="w-4 h-4 mr-2 text-red-600" />
              Integrações Externas
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Slack integration</li>
              <li>• Microsoft Teams</li>
              <li>• Discord webhooks</li>
              <li>• Email notifications</li>
              <li>• WhatsApp Business</li>
            </ul>
          </div>

          {/* Analytics */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2 text-indigo-600" />
              Analytics de Comunicação
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Engagement da equipe</li>
              <li>• Tempo de resposta</li>
              <li>• Tópicos mais discutidos</li>
              <li>• Colaboração por membro</li>
              <li>• Reports automáticos</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Roadmap de Implementação</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-green-800">
                <strong>Sprint 1:</strong> Sistema básico de comentários
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-green-800">
                <strong>Sprint 2:</strong> Notificações em tempo real
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-sm text-green-800">
                <strong>Sprint 3:</strong> Chat integrado
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
              <span className="text-sm text-green-800">
                <strong>Sprint 4:</strong> Videochamadas e integrações
              </span>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Configurações Temporárias */}
      <InfoCard title="Configurações de Comunicação" icon={Bell}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Notificações por Email</h4>
              <p className="text-sm text-gray-600">Receber updates importantes por email</p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled
              />
              <span className="ml-2 text-sm text-gray-500">(Em breve)</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Resumo Semanal</h4>
              <p className="text-sm text-gray-600">Relatório semanal de atividades do projeto</p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled
              />
              <span className="ml-2 text-sm text-gray-500">(Em breve)</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Alertas de Prazo</h4>
              <p className="text-sm text-gray-600">Notificações quando prazos estão próximos</p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled
              />
              <span className="ml-2 text-sm text-gray-500">(Em breve)</span>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  )
}

export default CommunicationTab