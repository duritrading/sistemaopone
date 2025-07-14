// src/domain/financial/entities/Account.ts
import { z } from 'zod'

export const AccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['conta_corrente', 'conta_poupanca', 'cartao_credito', 'cartao_debito', 'dinheiro', 'investimento', 'outros']),
  bank: z.string().optional(),
  balance: z.number().default(0),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date()
})

export type Account = z.infer<typeof AccountSchema>

export class AccountEntity {
  private constructor(private readonly props: Account) {}

  static create(data: Omit<Account, 'id' | 'created_at' | 'updated_at'>): AccountEntity {
    const account = AccountSchema.parse({
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date()
    })
    
    return new AccountEntity(account)
  }

  static fromData(data: Account): AccountEntity {
    return new AccountEntity(AccountSchema.parse(data))
  }

  // Getters
  get id(): string { return this.props.id }
  get name(): string { return this.props.name }
  get type(): Account['type'] { return this.props.type }
  get bank(): string | undefined { return this.props.bank }
  get balance(): number { return this.props.balance }
  get isActive(): boolean { return this.props.is_active }
  get createdAt(): Date { return this.props.created_at }
  get updatedAt(): Date { return this.props.updated_at }

  // Business Logic
  getFormattedBalance(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.balance)
  }

  getTypeLabel(): string {
    const labels = {
      conta_corrente: 'Conta Corrente',
      conta_poupanca: 'Conta Poupança',
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      dinheiro: 'Dinheiro',
      investimento: 'Investimento',
      outros: 'Outros'
    }
    return labels[this.type]
  }

  canDebit(amount: number): boolean {
    return this.balance >= amount
  }

  // Actions
  debit(amount: number): AccountEntity {
    if (!this.canDebit(amount)) {
      throw new Error('Saldo insuficiente')
    }
    
    return new AccountEntity({
      ...this.props,
      balance: this.balance - amount,
      updated_at: new Date()
    })
  }

  credit(amount: number): AccountEntity {
    return new AccountEntity({
      ...this.props,
      balance: this.balance + amount,
      updated_at: new Date()
    })
  }

  updateBalance(newBalance: number): AccountEntity {
    return new AccountEntity({
      ...this.props,
      balance: newBalance,
      updated_at: new Date()
    })
  }

  deactivate(): AccountEntity {
    return new AccountEntity({
      ...this.props,
      is_active: false,
      updated_at: new Date()
    })
  }

  toJSON(): Account {
    return { ...this.props }
  }
}
