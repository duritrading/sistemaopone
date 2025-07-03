// src/domain/financial/repositories/ITransactionRepository.ts
import { TransactionEntity, Transaction } from '../entities/Transaction'

export interface TransactionFilters {
  year?: number
  month?: number
  dateRange?: {
    start: Date
    end: Date
  }
  accountIds?: string[]
  status?: Transaction['status'][]
  type?: Transaction['type'][]
  searchTerm?: string
}

export interface ITransactionRepository {
  findById(id: string): Promise<TransactionEntity | null>
  findAll(filters?: TransactionFilters): Promise<TransactionEntity[]>
  findByAccountId(accountId: string): Promise<TransactionEntity[]>
  create(transaction: TransactionEntity): Promise<TransactionEntity>
  update(id: string, transaction: Partial<Transaction>): Promise<TransactionEntity>
  delete(id: string): Promise<void>
  bulkUpdate(ids: string[], updates: Partial<Transaction>): Promise<void>
  countByFilters(filters?: TransactionFilters): Promise<number>
}
