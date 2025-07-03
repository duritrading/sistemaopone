// src/infrastructure/financial/repositories/SupabaseTransactionRepository.ts
import { supabase } from '@/lib/supabase'
import { TransactionEntity, Transaction } from '@/domain/financial/entities/Transaction'
import { ITransactionRepository, TransactionFilters } from '@/domain/financial/repositories/ITransactionRepository'
import { Logger } from '@/shared/utils/logger'
import { performanceMonitor } from '@/shared/utils/performanceMonitor'

export class SupabaseTransactionRepository implements ITransactionRepository {
  private readonly logger = new Logger('SupabaseTransactionRepository')

  async findById(id: string): Promise<TransactionEntity | null> {
    return await performanceMonitor.measureAsync('transaction_find_by_id', async () => {
      try {
        const { data, error } = await supabase
          .from('financial_transactions')
          .select(`
            *,
            account:accounts(name, type)
          `)
          .eq('id', id)
          .single()

        if (error) {
          this.logger.error('Error finding transaction by ID', { error, id })
          throw new Error(`Transaction not found: ${error.message}`)
        }

        return data ? TransactionEntity.fromData(this.mapFromDatabase(data)) : null
      } catch (error) {
        this.logger.error('Database error in findById', { error, id })
        throw error
      }
    })
  }

  async findAll(filters?: TransactionFilters): Promise<TransactionEntity[]> {
    return await performanceMonitor.measureAsync('transaction_find_all', async () => {
      try {
        let query = supabase
          .from('financial_transactions')
          .select(`
            *,
            account:accounts(name, type)
          `)

        // Apply filters
        if (filters) {
          query = this.applyFilters(query, filters)
        }

        query = query.order('transaction_date', { ascending: false })

        const { data, error } = await query

        if (error) {
          this.logger.error('Error finding transactions', { error, filters })
          throw new Error(`Failed to fetch transactions: ${error.message}`)
        }

        return (data || []).map(item => 
          TransactionEntity.fromData(this.mapFromDatabase(item))
        )
      } catch (error) {
        this.logger.error('Database error in findAll', { error, filters })
        throw error
      }
    })
  }

  async create(transaction: TransactionEntity): Promise<TransactionEntity> {
    return await performanceMonitor.measureAsync('transaction_create', async () => {
      try {
        const { data, error } = await supabase
          .from('financial_transactions')
          .insert([this.mapToDatabase(transaction.toJSON())])
          .select()
          .single()

        if (error) {
          this.logger.error('Error creating transaction', { error, transaction: transaction.id })
          throw new Error(`Failed to create transaction: ${error.message}`)
        }

        this.logger.info('Transaction created successfully', { 
          id: data.id, 
          amount: data.amount,
          type: data.type 
        })

        return TransactionEntity.fromData(this.mapFromDatabase(data))
      } catch (error) {
        this.logger.error('Database error in create', { error })
        throw error
      }
    })
  }

  async update(id: string, updates: Partial<Transaction>): Promise<TransactionEntity> {
    return await performanceMonitor.measureAsync('transaction_update', async () => {
      try {
        const { data, error } = await supabase
          .from('financial_transactions')
          .update({
            ...this.mapToDatabase(updates),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()

        if (error) {
          this.logger.error('Error updating transaction', { error, id, updates })
          throw new Error(`Failed to update transaction: ${error.message}`)
        }

        this.logger.info('Transaction updated successfully', { id, updates })

        return TransactionEntity.fromData(this.mapFromDatabase(data))
      } catch (error) {
        this.logger.error('Database error in update', { error, id })
        throw error
      }
    })
  }

  async delete(id: string): Promise<void> {
    return await performanceMonitor.measureAsync('transaction_delete', async () => {
      try {
        const { error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', id)

        if (error) {
          this.logger.error('Error deleting transaction', { error, id })
          throw new Error(`Failed to delete transaction: ${error.message}`)
        }

        this.logger.info('Transaction deleted successfully', { id })
      } catch (error) {
        this.logger.error('Database error in delete', { error, id })
        throw error
      }
    })
  }

  async bulkUpdate(ids: string[], updates: Partial<Transaction>): Promise<void> {
    return await performanceMonitor.measureAsync('transaction_bulk_update', async () => {
      try {
        const { error } = await supabase
          .from('financial_transactions')
          .update({
            ...this.mapToDatabase(updates),
            updated_at: new Date().toISOString()
          })
          .in('id', ids)

        if (error) {
          this.logger.error('Error bulk updating transactions', { error, ids, updates })
          throw new Error(`Failed to bulk update transactions: ${error.message}`)
        }

        this.logger.info('Bulk update completed successfully', { count: ids.length, updates })
      } catch (error) {
        this.logger.error('Database error in bulkUpdate', { error, ids })
        throw error
      }
    })
  }

  async countByFilters(filters?: TransactionFilters): Promise<number> {
    return await performanceMonitor.measureAsync('transaction_count', async () => {
      try {
        let query = supabase
          .from('financial_transactions')
          .select('*', { count: 'exact', head: true })

        if (filters) {
          query = this.applyFilters(query, filters)
        }

        const { count, error } = await query

        if (error) {
          this.logger.error('Error counting transactions', { error, filters })
          throw new Error(`Failed to count transactions: ${error.message}`)
        }

        return count || 0
      } catch (error) {
        this.logger.error('Database error in countByFilters', { error, filters })
        throw error
      }
    })
  }

  private applyFilters(query: any, filters: TransactionFilters): any {
    // Year filter
    if (filters.year) {
      const startDate = `${filters.year}-01-01`
      const endDate = `${filters.year}-12-31`
      query = query.gte('transaction_date', startDate).lte('transaction_date', endDate)
    }

    // Month filter
    if (filters.month) {
      const year = filters.year || new Date().getFullYear()
      const startDate = `${year}-${filters.month.toString().padStart(2, '0')}-01`
      const endDate = `${year}-${filters.month.toString().padStart(2, '0')}-31`
      query = query.gte('transaction_date', startDate).lte('transaction_date', endDate)
    }

    // Date range filter
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        query = query.gte('transaction_date', filters.dateRange.start.toISOString())
      }
      if (filters.dateRange.end) {
        query = query.lte('transaction_date', filters.dateRange.end.toISOString())
      }
    }

    // Account filter
    if (filters.accountIds && filters.accountIds.length > 0) {
      query = query.in('account_id', filters.accountIds)
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      query = query.in('type', filters.type)
    }

    // Search filter
    if (filters.searchTerm) {
      query = query.or(`description.ilike.%${filters.searchTerm}%,notes.ilike.%${filters.searchTerm}%`)
    }

    return query
  }

  private mapFromDatabase(data: any): Transaction {
    return {
      id: data.id,
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category,
      status: data.status,
      account_id: data.account_id,
      transaction_date: new Date(data.transaction_date),
      due_date: data.due_date ? new Date(data.due_date) : undefined,
      payment_date: data.payment_date ? new Date(data.payment_date) : undefined,
      client_id: data.client_id,
      supplier_id: data.supplier_id,
      cost_center: data.cost_center,
      reference_code: data.reference_code,
      payment_method: data.payment_method,
      installments: data.installments,
      notes: data.notes,
      attachments: data.attachments || [],
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    }
  }

  private mapToDatabase(transaction: Partial<Transaction>): any {
    return {
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      status: transaction.status,
      account_id: transaction.account_id,
      transaction_date: transaction.transaction_date?.toISOString(),
      due_date: transaction.due_date?.toISOString(),
      payment_date: transaction.payment_date?.toISOString(),
      client_id: transaction.client_id,
      supplier_id: transaction.supplier_id,
      cost_center: transaction.cost_center,
      reference_code: transaction.reference_code,
      payment_method: transaction.payment_method,
      installments: transaction.installments,
      notes: transaction.notes,
      attachments: transaction.attachments,
      created_at: transaction.created_at?.toISOString(),
      updated_at: transaction.updated_at?.toISOString()
    }
  }
}