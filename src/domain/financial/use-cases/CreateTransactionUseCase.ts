// src/domain/financial/use-cases/CreateTransactionUseCase.ts - REESCRITA COMPLETA PRESERVANDO FUNCIONALIDADES
import { Transaction } from '../entities/Transaction'
import { ITransactionRepository } from '../repositories/ITransactionRepository'
import { IAccountRepository } from '../repositories/IAccountRepository'

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
  transaction: Transaction
  account: any
  success: boolean
  errors?: string[]
}

export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly accountRepository: IAccountRepository
  ) {}

  async execute(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    try {
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
        if (account.balance < request.amount) {
          return { 
            success: false, 
            errors: ['Saldo insuficiente na conta'], 
            transaction: null as any, 
            account: null as any 
          }
        }
      }

      // Create transaction - CORRIGIDO: criação direta do objeto ao invés de TransactionEntity.create
      const transaction = {
        id: crypto.randomUUID(),
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
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      } as Transaction

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

      return {
        success: true,
        transaction: savedTransaction,
        account: updatedAccount
      }

    } catch (error: any) {
      return {
        success: false,
        errors: [error.message || 'Erro interno do servidor'],
        transaction: null as any,
        account: null as any
      }
    }
  }

  private validateRequest(request: CreateTransactionRequest): string[] {
    const errors: string[] = []

    // Required fields validation
    if (!request.description || request.description.trim().length === 0) {
      errors.push('Descrição é obrigatória')
    }

    if (!request.amount || request.amount <= 0) {
      errors.push('Valor deve ser maior que zero')
    }

    if (!request.type || !['receita', 'despesa'].includes(request.type)) {
      errors.push('Tipo deve ser receita ou despesa')
    }

    if (!request.category || request.category.trim().length === 0) {
      errors.push('Categoria é obrigatória')
    }

    if (!request.accountId || request.accountId.trim().length === 0) {
      errors.push('Conta é obrigatória')
    }

    if (!request.transactionDate) {
      errors.push('Data da transação é obrigatória')
    }

    // Business rules validation
    if (request.description && request.description.length > 255) {
      errors.push('Descrição não pode ter mais de 255 caracteres')
    }

    if (request.amount && request.amount > 999999999.99) {
      errors.push('Valor não pode ser maior que R$ 999.999.999,99')
    }

    if (request.installments && (request.installments < 1 || request.installments > 12)) {
      errors.push('Número de parcelas deve estar entre 1 e 12')
    }

    // Date validations
    if (request.dueDate && request.transactionDate && request.dueDate < request.transactionDate) {
      errors.push('Data de vencimento não pode ser anterior à data da transação')
    }

    // Payment method validation for paid transactions
    if (request.isPaid && !request.paymentMethod) {
      errors.push('Método de pagamento é obrigatório para transações pagas')
    }

    // Category validation based on type
    if (request.type === 'receita' && request.category && !request.category.startsWith('receita')) {
      errors.push('Categoria deve ser compatível com o tipo receita')
    }

    if (request.type === 'despesa' && request.category && !request.category.startsWith('despesa')) {
      errors.push('Categoria deve ser compatível com o tipo despesa')
    }

    return errors
  }

  // Helper method to format currency
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  // Helper method to validate payment method
  private isValidPaymentMethod(method: string): boolean {
    const validMethods = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto']
    return validMethods.includes(method)
  }

  // Helper method to generate reference code if not provided
  private generateReferenceCode(type: string, date: Date): string {
    const typePrefix = type === 'receita' ? 'REC' : 'DES'
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${typePrefix}-${dateStr}-${random}`
  }

  // Helper method to determine default status
  private getDefaultStatus(type: string, isPaid: boolean): Transaction['status'] {
    if (isPaid) {
      return type === 'receita' ? 'recebido' : 'pago'
    }
    return 'pendente'
  }

  // Helper method to validate account permissions
  private async validateAccountPermissions(accountId: string): Promise<boolean> {
    try {
      const account = await this.accountRepository.findById(accountId)
      return account?.is_active === true
    } catch {
      return false
    }
  }

  // Helper method to calculate installment amounts
  private calculateInstallmentAmounts(totalAmount: number, installments: number): number[] {
    const baseAmount = Math.floor((totalAmount * 100) / installments) / 100
    const remainder = totalAmount - (baseAmount * installments)
    
    const amounts = Array(installments).fill(baseAmount)
    if (remainder > 0) {
      amounts[0] += remainder
    }
    
    return amounts
  }
}