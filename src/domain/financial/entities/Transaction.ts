import { z } from 'zod'

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  type: z.enum(['receita', 'despesa']),
  category: z.string().min(1),
  status: z.enum(['pendente', 'recebido', 'pago', 'vencido', 'cancelado']),
  account_id: z.string().uuid(),
  transaction_date: z.date(),
  due_date: z.date().optional(),
  payment_date: z.date().optional(),
  client_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  cost_center: z.string().optional(),
  reference_code: z.string().optional(),
  payment_method: z.enum(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto']).optional(),
  installments: z.number().int().min(1).max(12).default(1),
  notes: z.string().optional(),
  attachments: z.array(z.string()).default([]),
  created_at: z.date(),
  updated_at: z.date()
})

export type Transaction = z.infer<typeof TransactionSchema>

export class TransactionEntity {
  private constructor(private readonly props: Transaction) {}

  static create(data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): TransactionEntity {
    const transaction = TransactionSchema.parse({
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date()
    })
    
    return new TransactionEntity(transaction)
  }

  static fromData(data: Transaction): TransactionEntity {
    return new TransactionEntity(TransactionSchema.parse(data))
  }

  // Getters
  get id(): string { return this.props.id }
  get description(): string { return this.props.description }
  get amount(): number { return this.props.amount }
  get type(): 'receita' | 'despesa' { return this.props.type }
  get category(): string { return this.props.category }
  get status(): Transaction['status'] { return this.props.status }
  get accountId(): string { return this.props.account_id }
  get transactionDate(): Date { return this.props.transaction_date }
  get dueDate(): Date | undefined { return this.props.due_date }
  get paymentDate(): Date | undefined { return this.props.payment_date }
  get clientId(): string | undefined { return this.props.client_id }
  get supplierId(): string | undefined { return this.props.supplier_id }
  get costCenter(): string | undefined { return this.props.cost_center }
  get referenceCode(): string | undefined { return this.props.reference_code }
  get paymentMethod(): Transaction['payment_method'] { return this.props.payment_method }
  get installments(): number { return this.props.installments }
  get notes(): string | undefined { return this.props.notes }
  get attachments(): string[] { return this.props.attachments }
  get createdAt(): Date { return this.props.created_at }
  get updatedAt(): Date { return this.props.updated_at }

  // Business Logic
  isOverdue(): boolean {
    if (!this.dueDate) return false
    return this.dueDate < new Date() && this.status === 'pendente'
  }

  isPaid(): boolean {
    return this.status === 'recebido' || this.status === 'pago'
  }

  isRevenue(): boolean {
    return this.type === 'receita'
  }

  isExpense(): boolean {
    return this.type === 'despesa'
  }

  getStatusColor(): string {
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800',
      recebido: 'bg-green-100 text-green-800',
      pago: 'bg-blue-100 text-blue-800',
      vencido: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-800'
    }
    return colors[this.status]
  }

  getFormattedAmount(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.amount)
  }

  // Actions
  markAsPaid(paymentDate?: Date): TransactionEntity {
    const newStatus = this.type === 'receita' ? 'recebido' : 'pago'
    return new TransactionEntity({
      ...this.props,
      status: newStatus,
      payment_date: paymentDate || new Date(),
      updated_at: new Date()
    })
  }

  markAsOverdue(): TransactionEntity {
    return new TransactionEntity({
      ...this.props,
      status: 'vencido',
      updated_at: new Date()
    })
  }

  cancel(): TransactionEntity {
    return new TransactionEntity({
      ...this.props,
      status: 'cancelado',
      updated_at: new Date()
    })
  }

  updateNotes(notes: string): TransactionEntity {
    return new TransactionEntity({
      ...this.props,
      notes,
      updated_at: new Date()
    })
  }

  addAttachment(attachment: string): TransactionEntity {
    return new TransactionEntity({
      ...this.props,
      attachments: [...this.props.attachments, attachment],
      updated_at: new Date()
    })
  }

  toJSON(): Transaction {
    return { ...this.props }
  }
}
