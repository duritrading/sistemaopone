// src/app/financeiro/hooks/useTransactionModals.ts
import { useState, useCallback } from 'react'

export function useTransactionModals() {
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showReceitaModal, setShowReceitaModal] = useState(false)
  const [showDespesaModal, setShowDespesaModal] = useState(false)

  const openTypeModal = useCallback(() => {
    setShowTypeModal(true)
  }, [])

  const closeTypeModal = useCallback(() => {
    setShowTypeModal(false)
  }, [])

  const openReceitaModal = useCallback(() => {
    setShowTypeModal(false)
    setShowReceitaModal(true)
  }, [])

  const closeReceitaModal = useCallback(() => {
    setShowReceitaModal(false)
  }, [])

  const openDespesaModal = useCallback(() => {
    setShowTypeModal(false)
    setShowDespesaModal(true)
  }, [])

  const closeDespesaModal = useCallback(() => {
    setShowDespesaModal(false)
  }, [])

  const closeAllModals = useCallback(() => {
    setShowTypeModal(false)
    setShowReceitaModal(false)
    setShowDespesaModal(false)
  }, [])

  return {
    // States
    showTypeModal,
    showReceitaModal,
    showDespesaModal,
    
    // Actions
    openTypeModal,
    closeTypeModal,
    openReceitaModal,
    closeReceitaModal,
    openDespesaModal,
    closeDespesaModal,
    closeAllModals
  }
}