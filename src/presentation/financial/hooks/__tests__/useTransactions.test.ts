import { renderHook, act } from '@testing-library/react'
import { useTransactions } from '../useTransactions'
import { TransactionEntity } from '@/domain/financial/entities/Transaction'
import { createTestContainer } from '@/shared/testing/TestContainer'
import { ContainerProvider } from '@/shared/di/ContainerContext'

// Mock implementations
const mockTransactions = [
  TransactionEntity.create({
    description: 'Receita 1',
    amount: 1000,
    type: 'receita',
    category: 'receitas_servicos',
    status: 'pendente',
    account_id: 'account-1',
    transaction_date: new Date('2025-01-15'),
    installments: 1,
    attachments: []
  }),
  TransactionEntity.create({
    description: 'Despesa 1',
    amount: 500,
    type: 'despesa',
    category: 'despesas_operacionais',
    status: 'pago',
    account_id: 'account-1',
    transaction_date: new Date('2025-01-10'),
    installments: 1,
    attachments: []
  })
]

describe('useTransactions', () => {
  let container: Container
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element

  beforeEach(() => {
    container = createTestContainer()
    
    wrapper = ({ children }: { children: React.ReactNode }) => (
      <ContainerProvider container={container}>
        {children}
      </ContainerProvider>
    )

    // Mock the use case
    const mockGetTransactionsUseCase = {
      execute: jest.fn().mockResolvedValue({
        transactions: mockTransactions,
        totalCount: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      })
    }

    container.registerInstance('GetTransactionsUseCase', mockGetTransactionsUseCase)
  })

  it('should load transactions on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTransactions(), {
      wrapper
    })

    expect(result.current.loading).toBe(true)
    expect(result.current.transactions).toEqual([])

    await waitForNextUpdate()

    expect(result.current.loading).toBe(false)
    expect(result.current.transactions).toHaveLength(2)
    expect(result.current.totalCount).toBe(2)
  })

  it('should handle selection', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTransactions(), {
      wrapper
    })

    await waitForNextUpdate()

    const firstTransactionId = result.current.transactions[0].id

    act(() => {
      result.current.toggleSelection(firstTransactionId)
    })

    expect(result.current.isSelected(firstTransactionId)).toBe(true)
    expect(result.current.selectedIds).toContain(firstTransactionId)
    expect(result.current.hasSelection).toBe(true)
  })

  it('should calculate selection stats', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTransactions(), {
      wrapper
    })

    await waitForNextUpdate()

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.selectionStats.count).toBe(2)
    expect(result.current.selectionStats.totalAmount).toBe(1500)
    expect(result.current.selectionStats.revenueCount).toBe(1)
    expect(result.current.selectionStats.expenseCount).toBe(1)
  })

  it('should clear selection', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTransactions(), {
      wrapper
    })

    await waitForNextUpdate()

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.hasSelection).toBe(true)

    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.hasSelection).toBe(false)
    expect(result.current.selectedIds).toEqual([])
  })

  it('should handle filters', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTransactions(), {
      wrapper
    })

    await waitForNextUpdate()

    act(() => {
      result.current.setFilters({
        type: ['receita'],
        year: 2025
      })
    })

    // Should clear selection when filters change
    expect(result.current.selectedIds).toEqual([])
  })
})