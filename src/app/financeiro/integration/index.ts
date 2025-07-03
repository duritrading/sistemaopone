// src/app/financeiro/integration/index.ts
// Arquivo de integração com o sistema OpOne

import { useFinanceiro } from '../hooks/useFinanceiro'
import { calculateMetrics, getFinancialInsights } from '../utils'
import type { FinancialMetrics, Transaction } from '@/types/financeiro'

// === INTEGRAÇÃO COM DASHBOARD PRINCIPAL ===
export const getFinancialSummaryForDashboard = async () => {
  try {
    // TODO: Integrar com o hook quando disponível em contexto de servidor
    // Por enquanto, retorna dados mock para o dashboard
    return {
      totalRevenue: 150000,
      totalExpenses: 85000,
      netProfit: 65000,
      monthlyGrowth: 12.5,
      pendingCount: 5,
      overdueCount: 2,
      lastUpdate: new Date().toISOString()
    }
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error)
    return null
  }
}

// === INTEGRAÇÃO COM MÓDULO DE PROJETOS ===
export const getProjectFinancialData = (projectId: string, transactions: Transaction[]) => {
  const projectTransactions = transactions.filter(t => t.project_id === projectId)
  
  return {
    totalRevenue: projectTransactions
      .filter(t => t.type === 'receita' && t.status === 'recebido')
      .reduce((sum, t) => sum + t.amount, 0),
    
    totalExpenses: projectTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((sum, t) => sum + t.amount, 0),
    
    pendingRevenue: projectTransactions
      .filter(t => t.type === 'receita' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.amount, 0),
    
    pendingExpenses: projectTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.amount, 0),
    
    transactions: projectTransactions,
    lastTransaction: projectTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }
}

// === INTEGRAÇÃO COM MÓDULO DE CLIENTES ===
export const getClientFinancialData = (clientId: string, transactions: Transaction[]) => {
  const clientTransactions = transactions.filter(t => t.client_id === clientId)
  
  return {
    totalBilled: clientTransactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + t.amount, 0),
    
    totalReceived: clientTransactions
      .filter(t => t.type === 'receita' && t.status === 'recebido')
      .reduce((sum, t) => sum + t.amount, 0),
    
    pendingAmount: clientTransactions
      .filter(t => t.type === 'receita' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.amount, 0),
    
    overdueAmount: clientTransactions
      .filter(t => t.type === 'receita' && t.status === 'vencido')
      .reduce((sum, t) => sum + t.amount, 0),
    
    paymentHistory: clientTransactions
      .filter(t => t.type === 'receita')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    
    averagePaymentTime: calculateAveragePaymentTime(clientTransactions)
  }
}

// === HELPERS PARA INTEGRAÇÕES ===
const calculateAveragePaymentTime = (transactions: Transaction[]): number => {
  const paidTransactions = transactions.filter(t => 
    t.type === 'receita' && 
    t.status === 'recebido' && 
    t.due_date && 
    t.payment_date
  )
  
  if (paidTransactions.length === 0) return 0
  
  const totalDays = paidTransactions.reduce((sum, t) => {
    const dueDate = new Date(t.due_date!)
    const paymentDate = new Date(t.payment_date!)
    const diffInDays = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    return sum + diffInDays
  }, 0)
  
  return totalDays / paidTransactions.length
}

// === WEBHOOKS E NOTIFICAÇÕES ===
export const createFinancialNotification = (transaction: Transaction, type: 'overdue' | 'payment_received' | 'large_expense') => {
  const notifications = {
    overdue: {
      title: 'Transação Vencida',
      message: `${transaction.description} - ${transaction.amount}`,
      type: 'warning' as const,
      action: `/financeiro?transaction=${transaction.id}`
    },
    payment_received: {
      title: 'Pagamento Recebido',
      message: `${transaction.description} - ${transaction.amount}`,
      type: 'success' as const,
      action: `/financeiro?transaction=${transaction.id}`
    },
    large_expense: {
      title: 'Despesa Alta Detectada',
      message: `${transaction.description} - ${transaction.amount}`,
      type: 'info' as const,
      action: `/financeiro?transaction=${transaction.id}`
    }
  }
  
  return notifications[type]
}

// === CONFIGURAÇÕES DO MÓDULO ===
export const FINANCEIRO_CONFIG = {
  // Limites para alertas
  LARGE_TRANSACTION_THRESHOLD: 10000,
  OVERDUE_CHECK_INTERVAL: 24 * 60 * 60 * 1000, // 24 horas
  LOW_BALANCE_THRESHOLD: 1000,
  
  // Configurações de UI
  ITEMS_PER_PAGE: 50,
  SEARCH_DEBOUNCE_MS: 300,
  AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutos
  
  // Formatos
  CURRENCY_LOCALE: 'pt-BR',
  DATE_LOCALE: 'pt-BR',
  TIMEZONE: 'America/Sao_Paulo',
  
  // Exportação
  MAX_EXPORT_ITEMS: 10000,
  EXPORT_BATCH_SIZE: 1000,
  
  // Performance
  VIRTUAL_SCROLL_THRESHOLD: 100,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
} as const

// === CONTEXTO GLOBAL (OPCIONAL) ===
// Para usar em toda a aplicação, se necessário
interface FinanceiroContextType {
  metrics: FinancialMetrics | null
  isLoading: boolean
  lastUpdate: Date | null
  refreshMetrics: () => Promise<void>
}

export const createFinanceiroContext = () => {
  // Implementação do contexto seria aqui
  // Para uso opcional em toda a aplicação
  return {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    useContext: () => ({
      metrics: null,
      isLoading: false,
      lastUpdate: null,
      refreshMetrics: async () => {}
    })
  }
}

// === MIDDLEWARE PARA AUDITORIA ===
export const auditTransaction = (
  action: 'create' | 'update' | 'delete',
  transaction: Transaction,
  userId?: string
) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    action,
    transactionId: transaction.id,
    userId: userId || 'system',
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
    changes: action === 'update' ? 'Updated fields would be tracked here' : null
  }
  
  console.log('🔍 Financial Audit:', auditLog)
  
  // TODO: Salvar no banco de dados para auditoria
  // await supabase.from('financial_audit_log').insert([auditLog])
  
  return auditLog
}

// === VALIDAÇÕES DE NEGÓCIO ===
export const validateBusinessRules = (transaction: Transaction): string[] => {
  const errors: string[] = []
  
  // Regra: Transações acima de 50k precisam de aprovação
  if (transaction.amount > 50000 && !transaction.notes?.includes('[APROVADO]')) {
    errors.push('Transações acima de R$ 50.000 precisam de aprovação prévia')
  }
  
  // Regra: Despesas não podem ser maiores que receitas do mês
  // (Esta regra seria implementada com dados do mês atual)
  
  // Regra: Data não pode ser futura para receitas realizadas
  if (transaction.type === 'receita' && transaction.status === 'recebido') {
    const transactionDate = new Date(transaction.date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    if (transactionDate > today) {
      errors.push('Receitas recebidas não podem ter data futura')
    }
  }
  
  return errors
}

// === INTEGRAÇÕES EXTERNAS ===
export const integrateWithAccountingSoftware = async (transaction: Transaction) => {
  // TODO: Integração com sistemas de contabilidade
  console.log('📊 Enviando para sistema contábil:', transaction.id)
  
  try {
    // Exemplo de payload para sistema externo
    const payload = {
      external_id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.date,
      category: transaction.category,
      account: transaction.account_id
    }
    
    // await fetch('/api/accounting/sync', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // })
    
    return { success: true, externalId: 'EXT-' + transaction.id }
  } catch (error) {
    console.error('Erro na integração contábil:', error)
    return { success: false, error: error.message }
  }
}

export const syncBankStatement = async (accountId: string, statementFile: File) => {
  // TODO: Processamento de extratos bancários (OFX, CSV)
  console.log('🏦 Processando extrato bancário:', statementFile.name)
  
  try {
    const formData = new FormData()
    formData.append('file', statementFile)
    formData.append('accountId', accountId)
    
    // const response = await fetch('/api/bank/import', {
    //   method: 'POST',
    //   body: formData
    // })
    
    // return await response.json()
    
    return {
      success: true,
      imported: 0,
      duplicates: 0,
      errors: []
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// === RELATÓRIOS AUTOMÁTICOS ===
export const generateMonthlyReport = async (year: number, month: number) => {
  console.log(`📊 Gerando relatório: ${month}/${year}`)
  
  try {
    // const transactions = await getTransactionsByPeriod(year, month)
    // const metrics = calculateMetrics(transactions)
    // const insights = getFinancialInsights(transactions)
    
    const report = {
      period: `${month}/${year}`,
      summary: {
        // ...metrics
      },
      insights: {
        // ...insights
      },
      generatedAt: new Date().toISOString()
    }
    
    return report
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    throw error
  }
}

// === EXPORTS PARA USO EXTERNO ===
export {
  useFinanceiro,
  calculateMetrics,
  getFinancialInsights
}

export type {
  FinancialMetrics,
  Transaction,
  FinanceiroContextType
}