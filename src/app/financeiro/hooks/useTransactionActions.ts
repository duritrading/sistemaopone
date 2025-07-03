// src/app/financeiro/hooks/useTransactionActions.ts
import { useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Transaction, LoadingState } from '../types/financial'
import { useToast } from '../components/Toast'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useTransactionActions(onRefresh: () => Promise<void>) {
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false })
  const { showToast } = useToast()

  const setLoading = useCallback((isLoading: boolean, message?: string, progress?: number) => {
    setLoadingState({ isLoading, message, progress })
  }, [])

  const markAsPaid = useCallback(async (transactionIds: string[]) => {
    try {
      setLoading(true, `Marcando ${transactionIds.length} transação(ões) como paga(s)...`)

      const { data: transactions, error: fetchError } = await supabase
        .from('financial_transactions')
        .select('id, type')
        .in('id', transactionIds)

      if (fetchError) throw fetchError

      // Group by type to set correct status
      const updates = transactions.map(t => ({
        id: t.id,
        status: t.type === 'receita' ? 'recebido' : 'pago',
        payment_date: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('financial_transactions')
        .upsert(updates)

      if (error) throw error

      await onRefresh()
      
      showToast({
        type: 'success',
        title: 'Transações atualizadas',
        message: `${transactionIds.length} transação(ões) marcada(s) como paga(s)`
      })
    } catch (err: any) {
      console.error('Erro ao marcar transações como pagas:', err)
      showToast({
        type: 'error',
        title: 'Erro ao atualizar',
        message: err.message || 'Erro ao marcar transações como pagas'
      })
    } finally {
      setLoading(false)
    }
  }, [onRefresh, setLoading, showToast])

  const markAsPending = useCallback(async (transactionIds: string[]) => {
    try {
      setLoading(true, `Marcando ${transactionIds.length} transação(ões) como pendente(s)...`)

      const { error } = await supabase
        .from('financial_transactions')
        .update({ 
          status: 'pendente',
          payment_date: null
        })
        .in('id', transactionIds)

      if (error) throw error

      await onRefresh()
      
      showToast({
        type: 'success',
        title: 'Transações atualizadas',
        message: `${transactionIds.length} transação(ões) marcada(s) como pendente(s)`
      })
    } catch (err: any) {
      console.error('Erro ao marcar transações como pendentes:', err)
      showToast({
        type: 'error',
        title: 'Erro ao atualizar',
        message: err.message || 'Erro ao marcar transações como pendentes'
      })
    } finally {
      setLoading(false)
    }
  }, [onRefresh, setLoading, showToast])

  const deleteTransactions = useCallback(async (transactionIds: string[]) => {
    try {
      setLoading(true, `Excluindo ${transactionIds.length} transação(ões)...`)

      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .in('id', transactionIds)

      if (error) throw error

      await onRefresh()
      
      showToast({
        type: 'success',
        title: 'Transações excluídas',
        message: `${transactionIds.length} transação(ões) excluída(s) com sucesso`
      })
    } catch (err: any) {
      console.error('Erro ao excluir transações:', err)
      showToast({
        type: 'error',
        title: 'Erro ao excluir',
        message: err.message || 'Erro ao excluir transações'
      })
    } finally {
      setLoading(false)
    }
  }, [onRefresh, setLoading, showToast])

  const duplicateTransactions = useCallback(async (transactionIds: string[]) => {
    try {
      setLoading(true, `Duplicando ${transactionIds.length} transação(ões)...`)

      const { data: transactions, error: fetchError } = await supabase
        .from('financial_transactions')
        .select('*')
        .in('id', transactionIds)

      if (fetchError) throw fetchError

      const duplicates = transactions.map(t => ({
        description: `${t.description} (Cópia)`,
        category: t.category,
        type: t.type,
        amount: t.amount,
        account_id: t.account_id,
        company: t.company,
        notes: t.notes,
        status: 'pendente',
        transaction_date: new Date().toISOString().split('T')[0]
      }))

      const { error } = await supabase
        .from('financial_transactions')
        .insert(duplicates)

      if (error) throw error

      await onRefresh()
      
      showToast({
        type: 'success',
        title: 'Transações duplicadas',
        message: `${transactionIds.length} transação(ões) duplicada(s) com sucesso`
      })
    } catch (err: any) {
      console.error('Erro ao duplicar transações:', err)
      showToast({
        type: 'error',
        title: 'Erro ao duplicar',
        message: err.message || 'Erro ao duplicar transações'
      })
    } finally {
      setLoading(false)
    }
  }, [onRefresh, setLoading, showToast])

  const updateCategory = useCallback(async (transactionIds: string[], category: string) => {
    try {
      setLoading(true, `Atualizando categoria de ${transactionIds.length} transação(ões)...`)

      const { error } = await supabase
        .from('financial_transactions')
        .update({ category })
        .in('id', transactionIds)

      if (error) throw error

      await onRefresh()
      
      showToast({
        type: 'success',
        title: 'Categoria atualizada',
        message: `${transactionIds.length} transação(ões) atualizada(s)`
      })
    } catch (err: any) {
      console.error('Erro ao atualizar categoria:', err)
      showToast({
        type: 'error',
        title: 'Erro ao atualizar',
        message: err.message || 'Erro ao atualizar categoria'
      })
    } finally {
      setLoading(false)
    }
  }, [onRefresh, setLoading, showToast])

  return {
    loadingState,
    markAsPaid,
    markAsPending,
    deleteTransactions,
    duplicateTransactions,
    updateCategory
  }
}