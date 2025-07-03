// src/types/financeiro.ts

export type TransactionType = 'receita' | 'despesa'

export type TransactionStatus = 
  | 'pendente' 
  | 'recebido' 
  | 'pago' 
  | 'vencido' 
  | 'cancelado'

export type AccountType = 
  | 'conta_corrente'
  | 'poupanca' 
  | 'investimento'
  | 'cartao_credito'
  | 'dinheiro'

export type TransactionCategory =
  | 'receitas_servicos'
  | 'receitas_produtos'
  | 'receitas_outras'
  | 'despesas_operacionais'
  | 'despesas_administrativas'
  | 'despesas_pessoal'
  | 'despesas_marketing'
  | 'despesas_tecnologia'
  | 'despesas_outras'

export interface Transaction {
  id: string
  date: string
  description: string
  category: TransactionCategory
  company?: string
  type: TransactionType
  status: TransactionStatus
  amount: number
  balance: number
  document?: string
  due_date?: string
  payment_date?: string
  account_id: string
  project_id?: string
  client_id?: string
  notes?: string
  attachments?: string[]
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  name: string
  type: AccountType
  bank?: string
  agency?: string
  account_number?: string
  balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FinancialMetrics {
  receitasEmAberto: number
  receitasRealizadas: number
  despesasEmAberto: number
  despesasRealizadas: number
  totalPeriodo: number
  fluxoCaixaPrevisto: number
  saldoAtual: number
}

export interface FinancialFilter {
  period: {
    year: number
    month?: number
    startDate?: string
    endDate?: string
  }
  accounts: string[]
  categories: TransactionCategory[]
  status: TransactionStatus[]
  types: TransactionType[]
  searchTerm: string
  amountRange?: {
    min: number
    max: number
  }
}

export interface BulkAction {
  type: 'mark_paid' | 'mark_received' | 'delete' | 'export' | 'duplicate'
  transactionIds: string[]
  data?: any
}

export interface CreateTransactionRequest {
  description: string
  category: TransactionCategory
  type: TransactionType
  amount: number
  due_date?: string
  account_id: string
  company?: string
  project_id?: string
  client_id?: string
  notes?: string
  attachments?: File[]
}

export interface UpdateTransactionRequest extends Partial<CreateTransactionRequest> {
  id: string
  status?: TransactionStatus
  payment_date?: string
}

export interface TransactionResponse {
  data: Transaction | null
  error: string | null
}

export interface TransactionsResponse {
  data: Transaction[]
  total: number
  page: number
  limit: number
  error: string | null
}

export interface MetricsResponse {
  data: FinancialMetrics | null
  error: string | null
}

export interface AccountsResponse {
  data: Account[]
  error: string | null
}

// Constants
export const TRANSACTION_CATEGORIES: Record<TransactionCategory, string> = {
  receitas_servicos: 'Receitas de Serviços',
  receitas_produtos: 'Receitas de Produtos',
  receitas_outras: 'Outras Receitas',
  despesas_operacionais: 'Despesas Operacionais',
  despesas_administrativas: 'Despesas Administrativas',
  despesas_pessoal: 'Despesas com Pessoal',
  despesas_marketing: 'Despesas de Marketing',
  despesas_tecnologia: 'Despesas de Tecnologia',
  despesas_outras: 'Outras Despesas'
}

export const TRANSACTION_STATUS: Record<TransactionStatus, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  recebido: { label: 'Recebido', color: 'bg-green-100 text-green-800' },
  pago: { label: 'Pago', color: 'bg-blue-100 text-blue-800' },
  vencido: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
}

export const ACCOUNT_TYPES: Record<AccountType, string> = {
  conta_corrente: 'Conta Corrente',
  poupanca: 'Poupança',
  investimento: 'Investimentos',
  cartao_credito: 'Cartão de Crédito',
  dinheiro: 'Dinheiro'
}