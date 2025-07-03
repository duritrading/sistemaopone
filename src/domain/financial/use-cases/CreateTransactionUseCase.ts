// src/domain/financial/use-cases/CreateTransactionUseCase.ts
import { TransactionEntity } from '../entities/Transaction'
import { AccountEntity } from '../entities/Account'
import { ITransactionRepository } from '../repositories/ITransactionRepository'
import { IAccountRepository } from '../repositories/IAccountRepository'
import { Logger } from '@/shared/utils/logger'

export interface CreateTransactionRequest {
  description: string
  amount: number
  type: 'receita' | 'despesa'
  category: string
  accountId: string
  transactionDate: Date
  dueDate?: Date
  clientId?: string
  supplierId?: string
  costCenter?: string
  referenceCode?: string
  paymentMethod?: string
  installments?: number
  notes?: string
  isPaid?: boolean
}

export interface CreateTransactionResponse {
  transaction: TransactionEntity
  account: AccountEntity
  success: boolean
  errors?: string[]
}

export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly logger: Logger
  ) {}

  async execute(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    try {
      this.logger.info('Creating transaction', { request })

      // Validation
      const errors = this.validateRequest(request)
      if (errors.length > 0) {
        return { success: false, errors, transaction: null as any, account: null as any }
      }

      // Check if account exists
      const account = await this.accountRepository.findById(request.accountId)
      if (!account) {
        return { 
          success: false, 
          errors: ['Conta não encontrada'], 
          transaction: null as any, 
          account: null as any 
        }
      }

      // Check account balance for expenses
      if (request.type === 'despesa' && request.isPaid) {
        if (!account.canDebit(request.amount)) {
          return { 
            success: false, 
            errors: ['Saldo insuficiente na conta'], 
            transaction: null as any, 
            account: null as any 
          }
        }
      }

      // Create transaction
      const transaction = TransactionEntity.create({
        description: request.description,
        amount: request.amount,
        type: request.type,
        category: request.category,
        account_id: request.accountId,
        transaction_date: request.transactionDate,
        due_date: request.dueDate,
        client_id: request.clientId,
        supplier_id: request.supplierId,
        cost_center: request.costCenter,
        reference_code: request.referenceCode,
        payment_method: request.paymentMethod,
        installments: request.installments || 1,
        notes: request.notes,
        status: request.isPaid ? (request.type === 'receita' ? 'recebido' : 'pago') : 'pendente',
        payment_date: request.isPaid ? new Date() : undefined,
        attachments: []
      })

      // Save transaction
      const savedTransaction = await this.transactionRepository.create(transaction)

      // Update account balance if paid
      let updatedAccount = account
      if (request.isPaid) {
        if (request.type === 'receita') {
          updatedAccount = await this.accountRepository.updateBalance(
            account.id, 
            account.balance + request.amount
          )
        } else {
          updatedAccount = await this.accountRepository.updateBalance(
            account.id, 
            account.balance - request.amount
          )
        }
      }

      this.logger.info('Transaction created successfully', { 
        transactionId: savedTransaction.id,
        accountId: updatedAccount.id,
        amount: request.amount,
        type: request.type
      })

      return {
        transaction: savedTransaction,
        account: updatedAccount,
        success: true
      }

    } catch (error) {
      this.logger.error('Error creating transaction', { error, request })
      return {
        success: false,
        errors: ['Erro interno do servidor'],
        transaction: null as any,
        account: null as any
      }
    }
  }

  private validateRequest(request: CreateTransactionRequest): string[] {
    const errors: string[] = []

    if (!request.description?.trim()) {
      errors.push('Descrição é obrigatória')
    }

    if (request.amount <= 0) {
      errors.push('Valor deve ser maior que zero')
    }

    if (!request.accountId) {
      errors.push('Conta é obrigatória')
    }

    if (!request.category) {
      errors.push('Categoria é obrigatória')
    }

    if (request.installments && (request.installments < 1 || request.installments > 12)) {
      errors.push('Número de parcelas deve ser entre 1 e 12')
    }

    return errors
  }
}
