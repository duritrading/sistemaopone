// src/app/financeiro/types/financial.ts
// Unified financial types for the application layer

export interface Transaction {
  id: string
  description: string
  amount: number
  type: 'receita' | 'despesa'
  category: string
  status: 'pendente' | 'recebido' | 'pago' | 'vencido' | 'cancelado'
  transaction_date: string
  due_date?: string
  payment_date?: string
  account_id: string
  client_id?: string
  supplier_id?: string
  cost_center?: string
  reference_code?: string
  payment_method?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'boleto'
  installments?: number
  notes?: string
  attachments?: string[]
  created_at: string
  updated_at: string
  company?: string
  document?: string
  // Optional relations for UI
  account?: {
    id: string
    name: string
    type: string
    balance?: number
  }
}

export interface Account {
  id: string
  name: string
  type: 'conta_corrente' | 'conta_poupanca' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'investimento' | 'outros'
  bank?: string
  balance: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface FinancialMetrics {
  receitas_em_aberto: number
  receitas_realizadas: number
  despesas_em_aberto: number
  despesas_realizadas: number
  total_periodo: number
  // Calculated fields
  receitasEmAberto?: number
  receitasRealizadas?: number
  despesasEmAberto?: number
  despesasRealizadas?: number
  totalPeriodo?: number
}

export interface ProjectionStats {
  netChange: number
  lowestBalance: number
  highestBalance: number
  averageDaily: number
  projectionDays: number
  lastUpdate: string
}

export interface DateFilter {
  year?: number
  month?: number
  startDate?: string
  endDate?: string
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
}

export interface TransactionFilters extends DateFilter {
  searchTerm?: string
  status?: Transaction['status'][]
  type?: Transaction['type'][]
  accountIds?: string[]
  categories?: string[]
  minAmount?: number
  maxAmount?: number
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

export interface PaginationState {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}

// Form interfaces
export interface CreateTransactionRequest {
  description: string
  amount: number
  type: 'receita' | 'despesa'
  category: string
  account_id: string
  transaction_date: string
  due_date?: string
  client_id?: string
  supplier_id?: string
  cost_center?: string
  reference_code?: string
  payment_method?: Transaction['payment_method']
  installments?: number
  notes?: string
  is_paid?: boolean
}

export interface UpdateTransactionRequest extends Partial<CreateTransactionRequest> {
  id: string
}

// API response interfaces
export interface TransactionResponse {
  data: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters?: TransactionFilters
}

export interface MetricsResponse {
  data: FinancialMetrics
  period: {
    start: string
    end: string
  }
}

// Component prop interfaces
export interface TransactionComponentProps {
  transaction: Transaction
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
  onMarkPaid?: (id: string) => void
  onMarkPending?: (id: string) => void
  onView?: (transaction: Transaction) => void
}

export interface TransactionListProps extends TransactionComponentProps {
  transactions: Transaction[]
  loading?: boolean
  emptyMessage?: string
}

// Utility types
export type TransactionStatus = Transaction['status']
export type TransactionType = Transaction['type']
export type PaymentMethod = NonNullable<Transaction['payment_method']>
export type AccountType = Account['type']

// Type guards
export function isTransaction(obj: any): obj is Transaction {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.amount === 'number' &&
    ['receita', 'despesa'].includes(obj.type) &&
    typeof obj.category === 'string' &&
    ['pendente', 'recebido', 'pago', 'vencido', 'cancelado'].includes(obj.status) &&
    typeof obj.transaction_date === 'string' &&
    typeof obj.account_id === 'string'
  )
}

export function isAccount(obj: any): obj is Account {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.balance === 'number' &&
    typeof obj.is_active === 'boolean'
  )
}