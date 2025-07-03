// src/app/financeiro/types/financial.ts
export interface Transaction {
  id: string
  description: string
  category: string
  type: 'receita' | 'despesa'
  amount: number
  status: 'pendente' | 'recebido' | 'pago' | 'vencido' | 'cancelado'
  transaction_date: string
  due_date?: string
  payment_date?: string
  account_id: string
  company?: string
  document?: string
  notes?: string
  created_at: string
  updated_at: string
  account?: {
    name: string
    type: string
  }
}

export interface Account {
  id: string
  name: string
  type: string
  bank?: string
  balance: number
  is_active: boolean
}

export interface FinancialMetrics {
  receitas_em_aberto: number
  receitas_realizadas: number
  despesas_em_aberto: number
  despesas_realizadas: number
  total_periodo: number
}

export interface BulkAction {
  id: string
  label: string
  icon: any
  color: 'primary' | 'success' | 'warning' | 'danger'
  action: (transactionIds: string[]) => Promise<void>
  requiresConfirmation?: boolean
  confirmMessage?: string
}

export interface TransactionAction {
  id: string
  label: string
  icon: any
  color: 'primary' | 'success' | 'warning' | 'danger'
  action: (transaction: Transaction) => Promise<void>
  condition?: (transaction: Transaction) => boolean
  requiresConfirmation?: boolean
  confirmMessage?: string
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}