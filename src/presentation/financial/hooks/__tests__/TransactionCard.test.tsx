import { render, screen, fireEvent } from '@testing-library/react'
import { TransactionCard } from '../TransactionCard'
import { TransactionEntity } from '@/domain/financial/entities/Transaction'

describe('TransactionCard', () => {
  const mockTransaction = TransactionEntity.create({
    description: 'Pagamento de serviço',
    amount: 1000,
    type: 'receita',
    category: 'receitas_servicos',
    status: 'pendente',
    account_id: 'account-1',
    transaction_date: new Date('2025-01-15'),
    installments: 1,
    attachments: []
  })

  it('should render transaction information', () => {
    render(<TransactionCard transaction={mockTransaction} />)

    expect(screen.getByText('Pagamento de serviço')).toBeInTheDocument()
    expect(screen.getByText('+R$ 1.000,00')).toBeInTheDocument()
    expect(screen.getByText('pendente')).toBeInTheDocument()
    expect(screen.getByText('15/01/2025')).toBeInTheDocument()
  })

  it('should handle selection', () => {
    const onSelect = jest.fn()
    
    render(
      <TransactionCard 
        transaction={mockTransaction} 
        onSelect={onSelect}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onSelect).toHaveBeenCalledWith(mockTransaction.id)
  })

  it('should handle edit action', () => {
    const onEdit = jest.fn()
    
    render(
      <TransactionCard 
        transaction={mockTransaction} 
        onEdit={onEdit}
      />
    )

    const card = screen.getByText('Pagamento de serviço').closest('div')
    fireEvent.click(card!)

    expect(onEdit).toHaveBeenCalledWith(mockTransaction)
  })

  it('should display overdue status', () => {
    const overdueTransaction = TransactionEntity.create({
      description: 'Pagamento vencido',
      amount: 1000,
      type: 'despesa',
      category: 'despesas_operacionais',
      status: 'pendente',
      account_id: 'account-1',
      transaction_date: new Date('2025-01-15'),
      due_date: new Date('2024-12-01'),
      installments: 1,
      attachments: []
    })

    render(<TransactionCard transaction={overdueTransaction} />)

    expect(screen.getByText('VENCIDO')).toBeInTheDocument()
  })

  it('should display attachments count', () => {
    const transactionWithAttachments = TransactionEntity.create({
      description: 'Pagamento com anexos',
      amount: 1000,
      type: 'receita',
      category: 'receitas_servicos',
      status: 'pendente',
      account_id: 'account-1',
      transaction_date: new Date('2025-01-15'),
      attachments: ['file1.pdf', 'file2.jpg'],
      installments: 1
    })

    render(<TransactionCard transaction={transactionWithAttachments} />)

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should apply selected styling', () => {
    render(
      <TransactionCard 
        transaction={mockTransaction} 
        isSelected={true}
      />
    )

    const card = screen.getByText('Pagamento de serviço').closest('div')
    expect(card).toHaveClass('ring-2', 'ring-blue-500')
  })
})

// package.json (test scripts)
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "vitest": "^1.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@vitest/ui": "^1.5.0",
    "jsdom": "^24.0.0"
  }
}