import { useMemo } from 'react'
import { useService } from '@/shared/di/ContainerContext'
import { ServiceTokens } from '@/shared/di/ServiceTokens'
import { useTransactions as useTransactionsOriginal } from './useTransactions'
import { GetTransactionsUseCase } from '@/domain/financial/use-cases/GetTransactionsUseCase'
import { BulkUpdateTransactionsUseCase } from '@/domain/financial/use-cases/BulkUpdateTransactionsUseCase'

/**
 * Hook que usa dependency injection
 */
export function useTransactions(props: any) {
  const getTransactionsUseCase = useService<GetTransactionsUseCase>(ServiceTokens.GET_TRANSACTIONS_USE_CASE)
  const bulkUpdateUseCase = useService<BulkUpdateTransactionsUseCase>(ServiceTokens.BULK_UPDATE_TRANSACTIONS_USE_CASE)

  // Usar os use cases injetados
  const dependencies = useMemo(() => ({
    getTransactionsUseCase,
    bulkUpdateUseCase
  }), [getTransactionsUseCase, bulkUpdateUseCase])

  return useTransactionsOriginal({ ...props, dependencies })
}