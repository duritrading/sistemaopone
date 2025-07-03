// src/domain/financial/use-cases/GetTransactionsUseCase.ts
import { TransactionEntity } from '../entities/Transaction'
import { ITransactionRepository, TransactionFilters } from '../repositories/ITransactionRepository'
import { Logger } from '@/shared/utils/logger'

export interface GetTransactionsRequest {
  filters?: TransactionFilters
  page?: number
  limit?: number
  sortBy?: 'date' | 'amount' | 'description'
  sortOrder?: 'asc' | 'desc'
}

export interface GetTransactionsResponse {
  transactions: TransactionEntity[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export class GetTransactionsUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly logger: Logger
  ) {}

  async execute(request: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    try {
      const page = request.page || 1
      const limit = request.limit || 50

      this.logger.info('Fetching transactions', { request })

      // Get transactions and count
      const [transactions, totalCount] = await Promise.all([
        this.transactionRepository.findAll(request.filters),
        this.transactionRepository.countByFilters(request.filters)
      ])

      // Apply client-side sorting if needed
      let sortedTransactions = transactions
      if (request.sortBy) {
        sortedTransactions = this.sortTransactions(transactions, request.sortBy, request.sortOrder)
      }

      // Apply pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex)

      const totalPages = Math.ceil(totalCount / limit)

      return {
        transactions: paginatedTransactions,
        totalCount,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }

    } catch (error) {
      this.logger.error('Error fetching transactions', { error, request })
      throw new Error('Erro ao buscar transações')
    }
  }

  private sortTransactions(
    transactions: TransactionEntity[], 
    sortBy: 'date' | 'amount' | 'description',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): TransactionEntity[] {
    return transactions.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = a.transactionDate.getTime() - b.transactionDate.getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'description':
          comparison = a.description.localeCompare(b.description)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }
}