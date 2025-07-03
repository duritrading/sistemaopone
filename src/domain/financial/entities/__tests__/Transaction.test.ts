import { TransactionEntity } from '../Transaction'

describe('TransactionEntity', () => {
  const validTransactionData = {
    description: 'Pagamento de serviço',
    amount: 1000,
    type: 'receita' as const,
    category: 'receitas_servicos',
    status: 'pendente' as const,
    account_id: 'account-123',
    transaction_date: new Date('2025-01-15'),
    installments: 1,
    attachments: []
  }

  describe('create', () => {
    it('should create a valid transaction', () => {
      const transaction = TransactionEntity.create(validTransactionData)
      
      expect(transaction.description).toBe(validTransactionData.description)
      expect(transaction.amount).toBe(validTransactionData.amount)
      expect(transaction.type).toBe(validTransactionData.type)
      expect(transaction.id).toBeDefined()
      expect(transaction.createdAt).toBeInstanceOf(Date)
    })

    it('should throw error for invalid data', () => {
      expect(() => {
        TransactionEntity.create({
          ...validTransactionData,
          amount: -100 // Invalid negative amount
        })
      }).toThrow()
    })

    it('should throw error for missing required fields', () => {
      expect(() => {
        TransactionEntity.create({
          ...validTransactionData,
          description: '' // Empty description
        })
      }).toThrow()
    })
  })

  describe('business logic', () => {
    it('should identify overdue transactions', () => {
      const pastDate = new Date('2024-12-01')
      const transaction = TransactionEntity.create({
        ...validTransactionData,
        due_date: pastDate,
        status: 'pendente'
      })

      expect(transaction.isOverdue()).toBe(true)
    })

    it('should identify paid transactions', () => {
      const paidTransaction = TransactionEntity.create({
        ...validTransactionData,
        status: 'recebido'
      })

      expect(paidTransaction.isPaid()).toBe(true)
    })

    it('should identify revenue transactions', () => {
      const revenueTransaction = TransactionEntity.create({
        ...validTransactionData,
        type: 'receita'
      })

      expect(revenueTransaction.isRevenue()).toBe(true)
      expect(revenueTransaction.isExpense()).toBe(false)
    })

    it('should format amount correctly', () => {
      const transaction = TransactionEntity.create({
        ...validTransactionData,
        amount: 1234.56
      })

      expect(transaction.getFormattedAmount()).toBe('R$ 1.234,56')
    })
  })

  describe('actions', () => {
    it('should mark transaction as paid', () => {
      const transaction = TransactionEntity.create({
        ...validTransactionData,
        type: 'receita',
        status: 'pendente'
      })

      const paidTransaction = transaction.markAsPaid()

      expect(paidTransaction.status).toBe('recebido')
      expect(paidTransaction.paymentDate).toBeInstanceOf(Date)
      expect(paidTransaction.updatedAt).toBeInstanceOf(Date)
    })

    it('should mark expense as paid', () => {
      const transaction = TransactionEntity.create({
        ...validTransactionData,
        type: 'despesa',
        status: 'pendente'
      })

      const paidTransaction = transaction.markAsPaid()

      expect(paidTransaction.status).toBe('pago')
    })

    it('should mark transaction as overdue', () => {
      const transaction = TransactionEntity.create(validTransactionData)
      const overdueTransaction = transaction.markAsOverdue()

      expect(overdueTransaction.status).toBe('vencido')
      expect(overdueTransaction.updatedAt).toBeInstanceOf(Date)
    })

    it('should cancel transaction', () => {
      const transaction = TransactionEntity.create(validTransactionData)
      const canceledTransaction = transaction.cancel()

      expect(canceledTransaction.status).toBe('cancelado')
      expect(canceledTransaction.updatedAt).toBeInstanceOf(Date)
    })

    it('should add attachment', () => {
      const transaction = TransactionEntity.create(validTransactionData)
      const withAttachment = transaction.addAttachment('file1.pdf')

      expect(withAttachment.attachments).toContain('file1.pdf')
      expect(withAttachment.attachments).toHaveLength(1)
    })
  })

  describe('immutability', () => {
    it('should not mutate original transaction when applying actions', () => {
      const originalTransaction = TransactionEntity.create(validTransactionData)
      const originalStatus = originalTransaction.status

      const paidTransaction = originalTransaction.markAsPaid()

      expect(originalTransaction.status).toBe(originalStatus)
      expect(paidTransaction.status).not.toBe(originalStatus)
    })
  })
})