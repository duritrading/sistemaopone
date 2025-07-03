import { CreateTransactionUseCase } from '../CreateTransactionUseCase'
import { TransactionEntity } from '../../entities/Transaction'
import { AccountEntity } from '../../entities/Account'
import { ITransactionRepository } from '../../repositories/ITransactionRepository'
import { IAccountRepository } from '../../repositories/IAccountRepository'
import { Logger } from '@/shared/utils/logger'

// Mocks
const mockTransactionRepository: jest.Mocked<ITransactionRepository> = {
  findById: jest.fn(),
  findAll: jest.fn(),
  findByAccountId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  bulkUpdate: jest.fn(),
  countByFilters: jest.fn()
}

const mockAccountRepository: jest.Mocked<IAccountRepository> = {
  findById: jest.fn(),
  findAll: jest.fn(),
  findActive: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateBalance: jest.fn()
}

const mockLogger: jest.Mocked<Logger> = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as any

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase
  let mockAccount: AccountEntity

  beforeEach(() => {
    useCase = new CreateTransactionUseCase(
      mockTransactionRepository,
      mockAccountRepository,
      mockLogger
    )

    mockAccount = AccountEntity.create({
      name: 'Conta Principal',
      type: 'conta_corrente',
      balance: 5000,
      is_active: true
    })

    // Reset mocks
    jest.clearAllMocks()
  })

  describe('successful creation', () => {
    it('should create a pending revenue transaction', async () => {
      const request = {
        description: 'Venda de produto',
        amount: 1000,
        type: 'receita' as const,
        category: 'receitas_produtos',
        accountId: mockAccount.id,
        transactionDate: new Date(),
        isPaid: false
      }

      const mockTransaction = TransactionEntity.create({
        description: request.description,
        amount: request.amount,
        type: request.type,
        category: request.category,
        account_id: request.accountId,
        transaction_date: request.transactionDate,
        status: 'pendente',
        installments: 1,
        attachments: []
      })

      mockAccountRepository.findById.mockResolvedValue(mockAccount)
      mockTransactionRepository.create.mockResolvedValue(mockTransaction)

      const result = await useCase.execute(request)

      expect(result.success).toBe(true)
      expect(result.transaction.description).toBe(request.description)
      expect(result.transaction.status).toBe('pendente')
      expect(mockTransactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: request.description,
          amount: request.amount,
          type: request.type
        })
      )
    })

    it('should create a paid expense transaction and update account balance', async () => {
      const request = {
        description: 'Pagamento de fornecedor',
        amount: 500,
        type: 'despesa' as const,
        category: 'despesas_operacionais',
        accountId: mockAccount.id,
        transactionDate: new Date(),
        isPaid: true
      }

      const mockTransaction = TransactionEntity.create({
        description: request.description,
        amount: request.amount,
        type: request.type,
        category: request.category,
        account_id: request.accountId,
        transaction_date: request.transactionDate,
        status: 'pago',
        payment_date: new Date(),
        installments: 1,
        attachments: []
      })

      const updatedAccount = AccountEntity.create({
        ...mockAccount.toJSON(),
        balance: 4500
      })

      mockAccountRepository.findById.mockResolvedValue(mockAccount)
      mockTransactionRepository.create.mockResolvedValue(mockTransaction)
      mockAccountRepository.updateBalance.mockResolvedValue(updatedAccount)

      const result = await useCase.execute(request)

      expect(result.success).toBe(true)
      expect(result.transaction.status).toBe('pago')
      expect(result.account.balance).toBe(4500)
      expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith(
        mockAccount.id,
        4500
      )
    })
  })

  describe('validation errors', () => {
    it('should return error for empty description', async () => {
      const request = {
        description: '',
        amount: 1000,
        type: 'receita' as const,
        category: 'receitas_servicos',
        accountId: mockAccount.id,
        transactionDate: new Date()
      }

      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Descrição é obrigatória')
    })

    it('should return error for zero amount', async () => {
      const request = {
        description: 'Teste',
        amount: 0,
        type: 'receita' as const,
        category: 'receitas_servicos',
        accountId: mockAccount.id,
        transactionDate: new Date()
      }

      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Valor deve ser maior que zero')
    })

    it('should return error for invalid installments', async () => {
      const request = {
        description: 'Teste',
        amount: 1000,
        type: 'receita' as const,
        category: 'receitas_servicos',
        accountId: mockAccount.id,
        transactionDate: new Date(),
        installments: 15
      }

      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Número de parcelas deve ser entre 1 e 12')
    })
  })

  describe('business rule errors', () => {
    it('should return error for non-existent account', async () => {
      const request = {
        description: 'Teste',
        amount: 1000,
        type: 'receita' as const,
        category: 'receitas_servicos',
        accountId: 'non-existent-account',
        transactionDate: new Date()
      }

      mockAccountRepository.findById.mockResolvedValue(null)

      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Conta não encontrada')
    })

    it('should return error for insufficient balance', async () => {
      const lowBalanceAccount = AccountEntity.create({
        name: 'Conta Baixo Saldo',
        type: 'conta_corrente',
        balance: 100,
        is_active: true
      })

      const request = {
        description: 'Pagamento grande',
        amount: 1000,
        type: 'despesa' as const,
        category: 'despesas_operacionais',
        accountId: lowBalanceAccount.id,
        transactionDate: new Date(),
        isPaid: true
      }

      mockAccountRepository.findById.mockResolvedValue(lowBalanceAccount)

      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Saldo insuficiente na conta')
    })
  })

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const request = {
        description: 'Teste',
        amount: 1000,
        type: 'receita' as const,
        category: 'receitas_servicos',
        accountId: mockAccount.id,
        transactionDate: new Date()
      }

      mockAccountRepository.findById.mockRejectedValue(new Error('Database error'))

      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Erro interno do servidor')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating transaction',
        expect.objectContaining({
          error: expect.any(Error),
          request
        })
      )
    })
  })
})