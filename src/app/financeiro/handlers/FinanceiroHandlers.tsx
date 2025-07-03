// src/app/financeiro/handlers/FinanceiroHandlers.tsx
import { createClient } from '@supabase/supabase-js'
import {
  Transaction,
  Account,
  FinancialMetrics,
  FinancialFilter,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionResponse,
  TransactionsResponse,
  MetricsResponse,
  AccountsResponse,
  BulkAction,
  TRANSACTION_STATUS
} from '@/types/financeiro'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// === TRANSACTION HANDLERS ===
export class TransactionHandlers {
  
  static async getAll(filter?: Partial<FinancialFilter>): Promise<TransactionsResponse> {
    try {
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          account:accounts(id, name, type),
          project:projects(id, name),
          client:clients(id, company_name)
        `)
        .order('date', { ascending: false })

      // Apply filters
      if (filter?.period?.year) {
        const startDate = `${filter.period.year}-01-01`
        const endDate = `${filter.period.year}-12-31`
        query = query.gte('date', startDate).lte('date', endDate)
      }

      if (filter?.accounts?.length) {
        query = query.in('account_id', filter.accounts)
      }

      if (filter?.types?.length) {
        query = query.in('type', filter.types)
      }

      if (filter?.status?.length) {
        query = query.in('status', filter.status)
      }

      if (filter?.searchTerm) {
        query = query.or(`description.ilike.%${filter.searchTerm}%,company.ilike.%${filter.searchTerm}%`)
      }

      const { data, error, count } = await query
      
      if (error) {
        console.error('❌ Erro ao buscar transações:', error)
        return { data: [], total: 0, page: 1, limit: 50, error: this.getErrorMessage(error) }
      }

      return { 
        data: data || [], 
        total: count || 0, 
        page: 1, 
        limit: 50, 
        error: null 
      }

    } catch (err) {
      console.error('💥 Erro ao buscar transações:', err)
      return { data: [], total: 0, page: 1, limit: 50, error: 'Erro inesperado ao buscar transações' }
    }
  }

  static async getById(transactionId: string): Promise<TransactionResponse> {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          account:accounts(id, name, type),
          project:projects(id, name),
          client:clients(id, company_name)
        `)
        .eq('id', transactionId)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar transação:', error)
        return { data: null, error: this.getErrorMessage(error) }
      }

      return { data, error: null }

    } catch (err) {
      console.error('💥 Erro ao buscar transação:', err)
      return { data: null, error: 'Erro inesperado ao buscar transação' }
    }
  }

  static async create(formData: CreateTransactionRequest): Promise<TransactionResponse> {
    try {
      // Validações básicas
      if (!formData.description?.trim()) {
        return { data: null, error: 'Descrição é obrigatória' }
      }

      if (!formData.amount || formData.amount <= 0) {
        return { data: null, error: 'Valor deve ser maior que zero' }
      }

      if (!formData.account_id) {
        return { data: null, error: 'Conta é obrigatória' }
      }

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([{
          description: formData.description.trim(),
          category: formData.category,
          type: formData.type,
          amount: formData.amount,
          due_date: formData.due_date || null,
          account_id: formData.account_id,
          company: formData.company?.trim() || null,
          project_id: formData.project_id || null,
          client_id: formData.client_id || null,
          notes: formData.notes?.trim() || null,
          status: 'pendente',
          date: new Date().toISOString().split('T')[0]
        }])
        .select(`
          *,
          account:accounts(id, name, type),
          project:projects(id, name),
          client:clients(id, company_name)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao criar transação:', error)
        return { data: null, error: this.getErrorMessage(error) }
      }

      return { data, error: null }

    } catch (err) {
      console.error('💥 Erro ao criar transação:', err)
      return { data: null, error: 'Erro inesperado ao criar transação' }
    }
  }

  static async update(formData: UpdateTransactionRequest): Promise<TransactionResponse> {
    try {
      const updateData: any = {}

      // Apenas atualizar campos fornecidos
      if (formData.description !== undefined) updateData.description = formData.description.trim()
      if (formData.category !== undefined) updateData.category = formData.category
      if (formData.amount !== undefined) updateData.amount = formData.amount
      if (formData.due_date !== undefined) updateData.due_date = formData.due_date
      if (formData.status !== undefined) {
        updateData.status = formData.status
        // Se marcado como pago/recebido, definir data de pagamento
        if (formData.status === 'pago' || formData.status === 'recebido') {
          updateData.payment_date = new Date().toISOString()
        }
      }
      if (formData.account_id !== undefined) updateData.account_id = formData.account_id
      if (formData.company !== undefined) updateData.company = formData.company?.trim()
      if (formData.project_id !== undefined) updateData.project_id = formData.project_id
      if (formData.client_id !== undefined) updateData.client_id = formData.client_id
      if (formData.notes !== undefined) updateData.notes = formData.notes?.trim()

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('financial_transactions')
        .update(updateData)
        .eq('id', formData.id)
        .select(`
          *,
          account:accounts(id, name, type),
          project:projects(id, name),
          client:clients(id, company_name)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao atualizar transação:', error)
        return { data: null, error: this.getErrorMessage(error) }
      }

      return { data, error: null }

    } catch (err) {
      console.error('💥 Erro ao atualizar transação:', err)
      return { data: null, error: 'Erro inesperado ao atualizar transação' }
    }
  }

  static async delete(transactionId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionId)

      if (error) {
        console.error('❌ Erro ao deletar transação:', error)
        return { success: false, error: this.getErrorMessage(error) }
      }

      return { success: true, error: null }

    } catch (err) {
      console.error('💥 Erro ao deletar transação:', err)
      return { success: false, error: 'Erro inesperado ao excluir transação' }
    }
  }

  static async bulkAction(action: BulkAction): Promise<{ success: boolean; error: string | null }> {
    try {
      switch (action.type) {
        case 'mark_paid':
          const { error: paidError } = await supabase
            .from('financial_transactions')
            .update({ 
              status: 'pago',
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .in('id', action.transactionIds)
            .eq('type', 'despesa')

          if (paidError) throw paidError
          break

        case 'mark_received':
          const { error: receivedError } = await supabase
            .from('financial_transactions')
            .update({ 
              status: 'recebido',
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .in('id', action.transactionIds)
            .eq('type', 'receita')

          if (receivedError) throw receivedError
          break

        case 'delete':
          const { error: deleteError } = await supabase
            .from('financial_transactions')
            .delete()
            .in('id', action.transactionIds)

          if (deleteError) throw deleteError
          break

        default:
          return { success: false, error: 'Ação não suportada' }
      }

      return { success: true, error: null }

    } catch (err: any) {
      console.error('💥 Erro na ação em lote:', err)
      return { success: false, error: this.getErrorMessage(err) }
    }
  }

  static getStatusBadgeColor(status: string) {
    return TRANSACTION_STATUS[status as keyof typeof TRANSACTION_STATUS]?.color || 'bg-gray-100 text-gray-800'
  }

  private static getErrorMessage(error: any): string {
    if (error.code === '23514') {
      return 'Dados inválidos. Verifique os campos obrigatórios.'
    } else if (error.code === '42501') {
      return 'Erro de permissão - RLS pode estar ativo'
    } else {
      return error.message || 'Erro desconhecido'
    }
  }
}

// === METRICS HANDLERS ===
export class MetricsHandlers {
  
  static async getFinancialMetrics(filter?: Partial<FinancialFilter>): Promise<MetricsResponse> {
    try {
      let query = supabase
        .from('financial_transactions')
        .select('type, status, amount')

      // Apply period filter
      if (filter?.period?.year) {
        const startDate = `${filter.period.year}-01-01`
        const endDate = `${filter.period.year}-12-31`
        query = query.gte('date', startDate).lte('date', endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao buscar métricas:', error)
        return { data: null, error: this.getErrorMessage(error) }
      }

      // Calculate metrics
      const metrics: FinancialMetrics = {
        receitasEmAberto: 0,
        receitasRealizadas: 0,
        despesasEmAberto: 0,
        despesasRealizadas: 0,
        totalPeriodo: 0,
        fluxoCaixaPrevisto: 0,
        saldoAtual: 0
      }

      data?.forEach(transaction => {
        if (transaction.type === 'receita') {
          if (transaction.status === 'recebido') {
            metrics.receitasRealizadas += transaction.amount
          } else {
            metrics.receitasEmAberto += transaction.amount
          }
        } else if (transaction.type === 'despesa') {
          if (transaction.status === 'pago') {
            metrics.despesasRealizadas += transaction.amount
          } else {
            metrics.despesasEmAberto += transaction.amount
          }
        }
      })

      metrics.totalPeriodo = metrics.receitasRealizadas - metrics.despesasRealizadas
      metrics.fluxoCaixaPrevisto = (metrics.receitasRealizadas + metrics.receitasEmAberto) - 
                                  (metrics.despesasRealizadas + metrics.despesasEmAberto)
      metrics.saldoAtual = metrics.receitasRealizadas - metrics.despesasRealizadas

      return { data: metrics, error: null }

    } catch (err) {
      console.error('💥 Erro ao calcular métricas:', err)
      return { data: null, error: 'Erro inesperado ao calcular métricas' }
    }
  }

  private static getErrorMessage(error: any): string {
    return error.message || 'Erro desconhecido'
  }
}

// === ACCOUNT HANDLERS ===
export class AccountHandlers {
  
  static async getAll(): Promise<AccountsResponse> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('❌ Erro ao buscar contas:', error)
        return { data: [], error: this.getErrorMessage(error) }
      }

      return { data: data || [], error: null }

    } catch (err) {
      console.error('💥 Erro ao buscar contas:', err)
      return { data: [], error: 'Erro inesperado ao buscar contas' }
    }
  }

  private static getErrorMessage(error: any): string {
    return error.message || 'Erro desconhecido'
  }
}