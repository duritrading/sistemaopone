// src/app/financeiro/components/NotificationsManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Bell, Clock, AlertTriangle, CheckCircle, X, Settings,
  Calendar, DollarSign, Mail, Smartphone
} from 'lucide-react'
import { useToast } from './Toast'
import { Transaction } from '../types/financial'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface NotificationRule {
  id: string
  name: string
  type: 'due_date' | 'overdue' | 'payment_reminder' | 'low_balance'
  days_before: number
  enabled: boolean
  notification_methods: ('email' | 'browser' | 'sms')[]
  filters: {
    transaction_type?: 'receita' | 'despesa'
    min_amount?: number
    categories?: string[]
  }
}

interface DueNotification {
  id: string
  transaction: Transaction
  type: 'due_soon' | 'overdue' | 'payment_due'
  days_until_due: number
  priority: 'low' | 'medium' | 'high'
  message: string
}

export function NotificationsManager() {
  const [notifications, setNotifications] = useState<DueNotification[]>([])
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    loadNotifications()
    loadRules()
  }, [])

  const loadNotifications = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          account:accounts(name, type)
        `)
        .in('status', ['pendente'])
        .not('due_date', 'is', null)

      if (error) throw error

      const today = new Date()
      const dueNotifications: DueNotification[] = []

      transactions?.forEach(transaction => {
        if (!transaction.due_date) return

        const dueDate = new Date(transaction.due_date)
        const diffTime = dueDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        let notification: DueNotification | null = null

        if (diffDays < 0) {
          // Vencido
          notification = {
            id: `overdue-${transaction.id}`,
            transaction,
            type: 'overdue',
            days_until_due: diffDays,
            priority: 'high',
            message: `${transaction.type === 'receita' ? 'Receita' : 'Despesa'} venceu há ${Math.abs(diffDays)} dias`
          }
        } else if (diffDays <= 3) {
          // Vence em 3 dias ou menos
          notification = {
            id: `due-soon-${transaction.id}`,
            transaction,
            type: 'due_soon',
            days_until_due: diffDays,
            priority: diffDays === 0 ? 'high' : 'medium',
            message: diffDays === 0 
              ? `${transaction.type === 'receita' ? 'Receita' : 'Despesa'} vence hoje!`
              : `${transaction.type === 'receita' ? 'Receita' : 'Despesa'} vence em ${diffDays} dias`
          }
        } else if (diffDays <= 7) {
          // Vence na próxima semana
          notification = {
            id: `due-week-${transaction.id}`,
            transaction,
            type: 'payment_due',
            days_until_due: diffDays,
            priority: 'low',
            message: `${transaction.type === 'receita' ? 'Receita' : 'Despesa'} vence em ${diffDays} dias`
          }
        }

        if (notification) {
          dueNotifications.push(notification)
        }
      })

      // Ordenar por prioridade e data
      dueNotifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return a.days_until_due - b.days_until_due
      })

      setNotifications(dueNotifications)
    } catch (err: any) {
      console.error('Erro ao carregar notificações:', err)
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar notificações'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .order('name')

      if (error) throw error

      setRules(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar regras:', err)
    }
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const markAsHandled = async (transaction: Transaction) => {
    try {
      const newStatus = transaction.type === 'receita' ? 'recebido' : 'pago'
      
      const { error } = await supabase
        .from('financial_transactions')
        .update({ 
          status: newStatus,
          payment_date: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (error) throw error

      // Remove notification
      setNotifications(prev => prev.filter(n => n.transaction.id !== transaction.id))

      showToast({
        type: 'success',
        title: 'Atualizado',
        message: `Transação marcada como ${newStatus}`
      })
    } catch (err: any) {
      console.error('Erro ao atualizar transação:', err)
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao atualizar transação'
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'medium': return <Clock className="w-4 h-4" />
      case 'low': return <Bell className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        showToast({
          type: 'success',
          title: 'Notificações ativadas',
          message: 'Você receberá notificações do sistema'
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Notificações ({notifications.length})
          </h3>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title="Configurações de notificação"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Tudo em dia!</h4>
          <p className="text-gray-500">Não há notificações pendentes no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 ${getPriorityColor(notification.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    {getPriorityIcon(notification.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {notification.transaction.description}
                      </h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        notification.transaction.type === 'receita' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {notification.transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatCurrency(notification.transaction.amount)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(notification.transaction.due_date!)}</span>
                      </span>
                      {notification.transaction.company && (
                        <span className="truncate">
                          {notification.transaction.company}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => markAsHandled(notification.transaction)}
                    className="px-3 py-1 bg-white text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-50"
                  >
                    Marcar como pago
                  </button>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="Dispensar notificação"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Browser Notifications Permission */}
      {'Notification' in window && Notification.permission === 'default' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Ativar notificações do navegador
              </p>
              <p className="text-sm text-blue-700">
                Receba alertas mesmo quando a aba estiver fechada
              </p>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Ativar
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <NotificationSettingsModal
          rules={rules}
          onClose={() => setShowSettings(false)}
          onRulesUpdate={loadRules}
        />
      )}
    </div>
  )
}

// Modal de configurações de notificação
function NotificationSettingsModal({ 
  rules, 
  onClose, 
  onRulesUpdate 
}: { 
  rules: NotificationRule[]
  onClose: () => void
  onRulesUpdate: () => void
}) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('notification_rules')
        .update({ enabled: !enabled })
        .eq('id', ruleId)

      if (error) throw error

      onRulesUpdate()
      
      showToast({
        type: 'success',
        title: 'Configuração atualizada',
        message: 'Regra de notificação atualizada'
      })
    } catch (err: any) {
      console.error('Erro ao atualizar regra:', err)
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao atualizar configuração'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configurações de Notificação</h2>
              <p className="text-sm text-gray-500">Configure quando e como receber notificações</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Default Rules */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Regras Padrão</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Vencimento em 3 dias</p>
                  <p className="text-sm text-gray-500">Notifica 3 dias antes do vencimento</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Vencimento hoje</p>
                  <p className="text-sm text-gray-500">Notifica no dia do vencimento</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Pagamentos vencidos</p>
                  <p className="text-sm text-gray-500">Notifica quando há pagamentos em atraso</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Notification Methods */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Métodos de Notificação</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Notificações do navegador</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">E-mail</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">SMS (Premium)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200"
          >
            Fechar
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  )
}