import { useState, useEffect } from 'react'
import { useContainer } from '@/shared/di/ContainerContext'

interface Transaction {
  id: string
  amount: number
  type: 'receita' | 'despesa'
  status: 'pendente' | 'recebido' | 'pago' | 'vencido' | 'cancelado'
  transaction_date: string
  payment_date?: string
  description?: string
  account: {
    id: string
    name: string
    type: string
    bank: string
  }
}

interface Account {
  id: string
  name: string
  type: string
  bank: string
  is_active: boolean
}

interface Metrics {
  receitasEmAberto: number
  receitasRealizadas: number
  despesasEmAberto: number
  despesasRealizadas: number
  saldoPeriodo: number
  totalTransacoes: number
}

interface TransactionData {
  amount: number
  type: 'receita' | 'despesa'
  description?: string
  account_id: string
  transaction_date: string
  status?: string
}

export function useFinancialData() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useContainer()

  // Buscar transações com joins otimizados
  const fetchTransactions = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          account:accounts(
            id,
            name,
            type,
            bank
          )
        `)
        .order('transaction_date', { ascending: false })

      if (error) throw error
      
      console.log('Transações carregadas:', data?.length || 0)
      setTransactions(data || [])
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao buscar transações:', err)
      setError(errorMessage)
    }
  }

  // Buscar contas ativas
  const fetchAccounts = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      
      console.log('Contas carregadas:', data?.length || 0)
      setAccounts(data || [])
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao buscar contas:', err)
      setError(errorMessage)
    }
  }

  // Buscar métricas usando a nova função
  const fetchMetrics = async (): Promise<void> => {
    try {
      // Usar a nova função get_financial_metrics_2025
      const { data, error } = await supabase
        .rpc('get_financial_metrics_2025', { p_year: 2025 })

      if (error) throw error

      console.log('Métricas carregadas:', data)

      if (data && data.length > 0) {
        const metricsData = data[0]
        setMetrics({
          receitasEmAberto: Number(metricsData.receitas_em_aberto || 0),
          receitasRealizadas: Number(metricsData.receitas_realizadas || 0),
          despesasEmAberto: Number(metricsData.despesas_em_aberto || 0),
          despesasRealizadas: Number(metricsData.despesas_realizadas || 0),
          saldoPeriodo: Number(metricsData.total_periodo || 0),
          totalTransacoes: Number(metricsData.total_transacoes || 0)
        })
      } else {
        // Fallback: calcular métricas manualmente se a função não retornar dados
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('financial_transactions')
          .select('amount, type, status')

        if (transactionsError) throw transactionsError

       const receitasEmAberto = (transactionsData || [])
  .filter((t: any) => t.type === 'receita' && t.status === 'pendente')
  .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

const receitasRealizadas = (transactionsData || [])
  .filter((t: any) => t.type === 'receita' && t.status === 'recebido')
  .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

const despesasEmAberto = (transactionsData || [])
  .filter((t: any) => t.type === 'despesa' && t.status === 'pendente')
  .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

const despesasRealizadas = (transactionsData || [])
  .filter((t: any) => t.type === 'despesa' && t.status === 'pago')
  .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

        setMetrics({
          receitasEmAberto,
          receitasRealizadas,
          despesasEmAberto,
          despesasRealizadas,
          saldoPeriodo: receitasRealizadas - despesasRealizadas,
          totalTransacoes: transactionsData?.length || 0
        })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao buscar métricas:', err)
      setError(errorMessage)
    }
  }

  // Função para criar nova transação
  const createTransaction = async (transactionData: TransactionData) => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([transactionData])
        .select()

      if (error) throw error

      // Atualizar lista de transações
      await fetchTransactions()
      await fetchMetrics()

      return { success: true, data: data[0] }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao criar transação:', err)
      return { success: false, error: errorMessage }
    }
  }

  // Função para atualizar transação
  const updateTransaction = async (id: string, updates: Partial<TransactionData>) => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error

      // Atualizar lista de transações
      await fetchTransactions()
      await fetchMetrics()

      return { success: true, data: data[0] }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao atualizar transação:', err)
      return { success: false, error: errorMessage }
    }
  }

  // Função para deletar transação
  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Atualizar lista de transações
      await fetchTransactions()
      await fetchMetrics()

      return { success: true }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao deletar transação:', err)
      return { success: false, error: errorMessage }
    }
  }

  // Função para marcar transação como paga
  const markTransactionAsPaid = async (id: string) => {
    try {
      const transaction = transactions.find(t => t.id === id)
      if (!transaction) throw new Error('Transação não encontrada')

      const newStatus = transaction.type === 'receita' ? 'recebido' : 'pago'
      
      const { error } = await supabase
        .from('financial_transactions')
        .update({
          status: newStatus,
          payment_date: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      // Atualizar dados
      await fetchTransactions()
      await fetchMetrics()

      return { success: true }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao marcar como pago:', err)
      return { success: false, error: errorMessage }
    }
  }

  // Função para refresh completo
  const refreshData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Iniciando carregamento dos dados...')
      
      await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
        fetchMetrics()
      ])
      
      console.log('Dados carregados com sucesso!')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao recarregar dados:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    refreshData()
  }, [])

  return {
    // Estados
    transactions,
    accounts,
    metrics,
    loading,
    error,
    
    // Ações
    refreshData,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    markTransactionAsPaid,
    
    // Utilitários
    formatCurrency: (value: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value || 0)
    },
    
    formatDate: (dateString: string): string => {
      return new Date(dateString).toLocaleDateString('pt-BR')
    },
    
    getStatusColor: (status: string): string => {
      const colors: Record<string, string> = {
        pendente: 'bg-yellow-100 text-yellow-800',
        recebido: 'bg-green-100 text-green-800',
        pago: 'bg-blue-100 text-blue-800',
        vencido: 'bg-red-100 text-red-800',
        cancelado: 'bg-gray-100 text-gray-800'
      }
      return colors[status] || 'bg-gray-100 text-gray-800'
    }
  }
}