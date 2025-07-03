// src/app/financeiro/hooks/useTransactionSelection.ts
import { useState, useMemo, useCallback } from 'react'
import { Transaction } from '../types/financial'

export function useTransactionSelection(transactions: Transaction[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const selectedTransactions = useMemo(
    () => transactions.filter(t => selectedIds.includes(t.id)),
    [transactions, selectedIds]
  )

  const isSelected = useCallback(
    (transactionId: string) => selectedIds.includes(transactionId),
    [selectedIds]
  )

  const isAllSelected = useMemo(
    () => transactions.length > 0 && selectedIds.length === transactions.length,
    [transactions.length, selectedIds.length]
  )

  const isPartiallySelected = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < transactions.length,
    [selectedIds.length, transactions.length]
  )

  const toggleTransaction = useCallback((transactionId: string) => {
    setSelectedIds(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    )
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => 
      prev.length === transactions.length 
        ? []
        : transactions.map(t => t.id)
    )
  }, [transactions])

  const selectByStatus = useCallback((status: Transaction['status']) => {
    const filteredIds = transactions
      .filter(t => t.status === status)
      .map(t => t.id)
    setSelectedIds(filteredIds)
  }, [transactions])

  const selectByType = useCallback((type: Transaction['type']) => {
    const filteredIds = transactions
      .filter(t => t.type === type)
      .map(t => t.id)
    setSelectedIds(filteredIds)
  }, [transactions])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  const selectionStats = useMemo(() => {
    const stats = selectedTransactions.reduce((acc, transaction) => {
      if (transaction.type === 'receita') {
        acc.receitas += transaction.amount
        acc.receitasCount += 1
      } else {
        acc.despesas += transaction.amount
        acc.despesasCount += 1
      }
      return acc
    }, {
      receitas: 0,
      despesas: 0,
      receitasCount: 0,
      despesasCount: 0,
      total: 0,
      count: 0
    })

    stats.total = stats.receitas - stats.despesas
    stats.count = selectedTransactions.length

    return stats
  }, [selectedTransactions])

  return {
    selectedIds,
    selectedTransactions,
    selectionStats,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    toggleTransaction,
    toggleAll,
    selectByStatus,
    selectByType,
    clearSelection,
    hasSelection: selectedIds.length > 0
  }
}