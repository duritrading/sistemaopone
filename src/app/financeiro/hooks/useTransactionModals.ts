// src/app/financeiro/hooks/useTransactionModals.ts - VERSÃO LIMPA
'use client'

import { useState } from 'react'

export function useTransactionModals() {
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showReceitaModal, setShowReceitaModal] = useState(false)
  const [showDespesaModal, setShowDespesaModal] = useState(false)

  const openTypeModal = () => {
    setShowTypeModal(true)
  }

  const closeTypeModal = () => {
    setShowTypeModal(false)
  }

  const openReceitaModal = () => {
    setShowReceitaModal(true)
  }

  const closeReceitaModal = () => {
    setShowReceitaModal(false)
  }

  const openDespesaModal = () => {
    setShowDespesaModal(true)
  }

  const closeDespesaModal = () => {
    setShowDespesaModal(false)
  }

  const closeAllModals = () => {
    setShowTypeModal(false)
    setShowReceitaModal(false)
    setShowDespesaModal(false)
  }

  return {
    showTypeModal,
    showReceitaModal,
    showDespesaModal,
    openTypeModal,
    closeTypeModal,
    openReceitaModal,
    closeReceitaModal,
    openDespesaModal,
    closeDespesaModal,
    closeAllModals
  }
}