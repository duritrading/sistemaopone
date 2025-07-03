import { TransactionEntity } from '../entities/Transaction'
import { ITransactionRepository } from '../repositories/ITransactionRepository'
import { IAccountRepository } from '../repositories/IAccountRepository'
import { Logger } from '@/shared/utils/logger'

export interface BulkUpdateTransactionsRequest {
  transactionIds: string[]
  updates: {
    status?: 'recebido' | 'pago' | 'cancelado'
    category?: string
    costCenter?: string
    notes?: string
  }
}

export interface BulkUpdateTransactionsResponse {
  updatedCount: number
  failedIds: string[]
  success: boolean
  errors?: string[]
}

export class BulkUpdateTransactionsUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly logger: Logger
  ) {}

  async execute(request: BulkUpdateTransactionsRequest): Promise<BulkUpdateTransactionsResponse> {
    try {
      this.logger.info('Bulk updating transactions', { request })

      if (request.transactionIds.length === 0) {
        return { success: false, errors: ['Nenhuma transação selecionada'], updatedCount: 0, failedIds: [] }
      }

      // Validate request
      const errors = this.validateRequest(request)
      if (errors.length > 0) {
        return { success: false, errors, updatedCount: 0, failedIds: [] }
      }

      // If updating status to paid, we need to update account balances
      if (request.updates.status === 'recebido' || request.updates.status === 'pago') {
        return await this.bulkUpdateWithBalanceUpdate(request)
      }

      // Simple bulk update without balance changes
      await this.transactionRepository.bulkUpdate(request.transactionIds, request.updates)

      this.logger.info('Bulk update completed successfully', { 
        count: request.transactionIds.length,
        updates: request.updates
      })

      return {
        success: true,
        updatedCount: request.transactionIds.length,
        failedIds: []
      }

    } catch (error) {
      this.logger.error('Error in bulk update', { error, request })
      return {
        success: false,
        errors: ['Erro interno do servidor'],
        updatedCount: 0,
        failedIds: request.transactionIds
      }
    }
  }

  private async bulkUpdateWithBalanceUpdate(
    request: BulkUpdateTransactionsRequest
  ): Promise<BulkUpdateTransactionsResponse> {
    const failedIds: string[] = []
    let updatedCount = 0

    for (const transactionId of request.transactionIds) {
      try {
        const transaction = await this.transactionRepository.findById(transactionId)
        if (!transaction) {
          failedIds.push(transactionId)
          continue
        }

        // Skip if already paid
        if (transaction.isPaid()) {
          continue
        }

        // Update account balance
        const account = await this.accountRepository.findById(transaction.accountId)
        if (!account) {
          failedIds.push(transactionId)
          continue
        }

        if (transaction.type === 'receita') {
          await this.accountRepository.updateBalance(
            account.id,
            account.balance + transaction.amount
          )
        } else {
          if (!account.canDebit(transaction.amount)) {
            failedIds.push(transactionId)
            continue
          }
          await this.accountRepository.updateBalance(
            account.id,
            account.balance - transaction.amount
          )
        }

        // Update transaction
        await this.transactionRepository.update(transactionId, {
          ...request.updates,
          payment_date: new Date(),
          updated_at: new Date()
        })

        updatedCount++

      } catch (error) {
        this.logger.error('Error updating individual transaction', { error, transactionId })
        failedIds.push(transactionId)
      }
    }

    return {
      success: failedIds.length === 0,
      updatedCount,
      failedIds,
      errors: failedIds.length > 0 ? [`${failedIds.length} transações falharam`] : undefined
    }
  }

  private validateRequest(request: BulkUpdateTransactionsRequest): string[] {
    const errors: string[] = []

    if (request.transactionIds.length > 100) {
      errors.push('Máximo de 100 transações por operação')
    }

    if (Object.keys(request.updates).length === 0) {
      errors.push('Nenhuma atualização especificada')
    }

    return errors
  }
}