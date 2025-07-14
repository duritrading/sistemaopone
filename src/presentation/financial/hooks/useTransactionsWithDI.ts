// src/domain/financial/repositories/useTransactionsWithDI.ts
import { useMemo } from 'react'
import { useTransactions as useTransactionsOriginal } from './useTransactions'

/**
 * Hook que cria as dependências como mock
 */
export function useTransactions(props: any = {}) {
  // Criar mocks das dependências
  const dependencies = useMemo(() => {
    const getTransactionsUseCase = {
      execute: async (params: any) => {
        // TODO: Implementar chamada real
        return {
          data: [],
          total: 0
        }
      }
    }
    
    const bulkUpdateUseCase = {
      execute: async (params: any) => {
        // TODO: Implementar chamada real
        return { success: true }
      }
    }

    return {
      getTransactionsUseCase,
      bulkUpdateUseCase
    }
  }, [])

  return useTransactionsOriginal({ ...props, dependencies })
}