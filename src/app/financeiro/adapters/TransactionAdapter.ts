// src/app/financeiro/adapters/TransactionAdapter.ts
// Adapter to handle conversion between domain and app layer types

import { Transaction as DomainTransaction } from '@/domain/financial/entities/Transaction'
import { Transaction as AppTransaction } from '../types/financial'

export class TransactionAdapter {
  /**
   * Convert domain Transaction to app layer Transaction
   */
  static toAppTransaction(domainTransaction: DomainTransaction): AppTransaction {
    return {
      id: domainTransaction.id,
      description: domainTransaction.description,
      amount: domainTransaction.amount,
      type: domainTransaction.type,
      category: domainTransaction.category,
      status: domainTransaction.status,
      transaction_date: domainTransaction.transaction_date.toISOString(),
      due_date: domainTransaction.due_date?.toISOString(),
      payment_date: domainTransaction.payment_date?.toISOString(),
      account_id: domainTransaction.account_id,
      client_id: domainTransaction.client_id,
      supplier_id: domainTransaction.supplier_id,
      cost_center: domainTransaction.cost_center,
      reference_code: domainTransaction.reference_code,
      payment_method: domainTransaction.payment_method, // Keep as string for compatibility
      installments: domainTransaction.installments,
      notes: domainTransaction.notes,
      attachments: domainTransaction.attachments,
      created_at: domainTransaction.created_at.toISOString(),
      updated_at: domainTransaction.updated_at.toISOString(),
    }
  }

  /**
   * Convert app layer Transaction to domain Transaction
   */
  static toDomainTransaction(appTransaction: AppTransaction): DomainTransaction {
    return {
      id: appTransaction.id,
      description: appTransaction.description,
      amount: appTransaction.amount,
      type: appTransaction.type,
      category: appTransaction.category,
      status: appTransaction.status,
      transaction_date: new Date(appTransaction.transaction_date),
      due_date: appTransaction.due_date ? new Date(appTransaction.due_date) : undefined,
      payment_date: appTransaction.payment_date ? new Date(appTransaction.payment_date) : undefined,
      account_id: appTransaction.account_id,
      client_id: appTransaction.client_id,
      supplier_id: appTransaction.supplier_id,
      cost_center: appTransaction.cost_center,
      reference_code: appTransaction.reference_code,
      payment_method: appTransaction.payment_method as any, // Type assertion for compatibility
      installments: appTransaction.installments || 1,
      notes: appTransaction.notes,
      attachments: appTransaction.attachments || [],
      created_at: new Date(appTransaction.created_at),
      updated_at: new Date(appTransaction.updated_at),
    }
  }

  /**
   * Convert array of domain transactions to app transactions
   */
  static toAppTransactions(domainTransactions: DomainTransaction[]): AppTransaction[] {
    return domainTransactions.map(this.toAppTransaction)
  }

  /**
   * Convert array of app transactions to domain transactions
   */
  static toDomainTransactions(appTransactions: AppTransaction[]): DomainTransaction[] {
    return appTransactions.map(this.toDomainTransaction)
  }

  /**
   * Sanitize transaction data for safe usage in components
   */
  static sanitizeTransaction(transaction: any): AppTransaction | null {
    try {
      if (!transaction || typeof transaction !== 'object') {
        return null
      }

      return {
        id: transaction.id || '',
        description: transaction.description || '',
        amount: typeof transaction.amount === 'number' ? transaction.amount : 0,
        type: ['receita', 'despesa'].includes(transaction.type) ? transaction.type : 'despesa',
        category: transaction.category || '',
        status: ['pendente', 'recebido', 'pago', 'vencido', 'cancelado'].includes(transaction.status) 
          ? transaction.status 
          : 'pendente',
        transaction_date: transaction.transaction_date || new Date().toISOString(),
        due_date: transaction.due_date || undefined,
        payment_date: transaction.payment_date || undefined,
        account_id: transaction.account_id || '',
        client_id: transaction.client_id || undefined,
        supplier_id: transaction.supplier_id || undefined,
        cost_center: transaction.cost_center || undefined,
        reference_code: transaction.reference_code || undefined,
        payment_method: transaction.payment_method || undefined,
        installments: typeof transaction.installments === 'number' ? transaction.installments : 1,
        notes: transaction.notes || undefined,
        attachments: Array.isArray(transaction.attachments) ? transaction.attachments : [],
        created_at: transaction.created_at || new Date().toISOString(),
        updated_at: transaction.updated_at || new Date().toISOString(),
        company: transaction.company || undefined,
        document: transaction.document || undefined,
        account: transaction.account || undefined,
      }
    } catch (error) {
      console.error('Error sanitizing transaction:', error)
      return null
    }
  }

  /**
   * Sanitize array of transactions
   */
  static sanitizeTransactions(transactions: any[]): AppTransaction[] {
    if (!Array.isArray(transactions)) {
      return []
    }

    return transactions
      .map(this.sanitizeTransaction)
      .filter((transaction): transaction is AppTransaction => transaction !== null)
  }
}