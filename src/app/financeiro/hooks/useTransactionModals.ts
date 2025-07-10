// src/app/financeiro/hooks/useTransactionModals.ts - VERSÃO LIMPA
import { useState } from 'react'

type ModalType = 
  | 'transaction'    // Modal de escolher tipo de transação
  | 'receita'        // Modal de nova receita
  | 'despesa'        // Modal de nova despesa
  | 'fornecedor'     // Modal de novo fornecedor
  | 'centro-custo'   // Modal de novo centro de custo
  | 'categoria'      // Modal de nova categoria
  | 'conta'          // Modal de nova conta

export function useTransactionModals() {
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showReceitaModal, setShowReceitaModal] = useState(false)
  const [showDespesaModal, setShowDespesaModal] = useState(false)
  const [showFornecedorModal, setShowFornecedorModal] = useState(false)
  const [showCentroCustoModal, setShowCentroCustoModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showContaModal, setShowContaModal] = useState(false)

  const openModal = (type: ModalType) => {
    // Abrir o modal específico
    switch (type) {
      case 'transaction':
        closeAllModals()
        setShowTypeModal(true)
        break
      case 'receita':
        closeAllModals()
        setShowReceitaModal(true)
        break
      case 'despesa':
        closeAllModals()
        setShowDespesaModal(true)
        break
      case 'fornecedor':
        closeAllModals()
        setShowFornecedorModal(true)
        break
      case 'centro-custo':
        closeAllModals()
        setShowCentroCustoModal(true)
        break
      case 'categoria':
        closeAllModals()
        setShowCategoriaModal(true)
        break
      case 'conta':
        closeAllModals()
        setShowContaModal(true)
        break
    }
  }

  const closeAllModals = () => {
    setShowTypeModal(false)
    setShowReceitaModal(false)
    setShowDespesaModal(false)
    setShowFornecedorModal(false)
    setShowCentroCustoModal(false)
    setShowCategoriaModal(false)
    setShowContaModal(false)
  }

  return {
    // Estados dos modais
    showTypeModal,
    showReceitaModal,
    showDespesaModal,
    showFornecedorModal,
    showCentroCustoModal,
    showCategoriaModal,
    showContaModal,
    
    // Funções de controle
    openModal,
    closeAllModals
  }
}