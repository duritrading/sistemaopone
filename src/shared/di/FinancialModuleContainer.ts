// src/shared/di/FinancialModuleContainer.ts
import { Container } from './Container'
import { ServiceTokens } from './ServiceTokens'

/**
 * Container configurado para o módulo financeiro
 */
export function createFinancialContainer(): Container {
  const container = new Container()

  // Infrastructure - usando mocks simples
  container.registerInstance(ServiceTokens.SUPABASE_CLIENT, createSupabaseMock())
  container.registerInstance(ServiceTokens.LOGGER, createLoggerMock())
  container.registerInstance(ServiceTokens.PERFORMANCE_MONITOR, createPerformanceMonitorMock())
  container.registerSingleton(ServiceTokens.CACHE_SERVICE, () => createCacheServiceMock())

  // Repositories - mocks
  container.registerScoped(ServiceTokens.TRANSACTION_REPOSITORY, () => 
    createTransactionRepositoryMock()
  )

  container.registerScoped(ServiceTokens.ACCOUNT_REPOSITORY, () => 
    createAccountRepositoryMock()
  )

  container.registerScoped(ServiceTokens.METRICS_REPOSITORY, () => 
    createMetricsRepositoryMock()
  )

  // Domain Services
  container.registerSingleton(ServiceTokens.FINANCIAL_CALCULATOR, () => createFinancialCalculatorMock())

  // Use Cases - mocks funcionais
  container.registerTransient(ServiceTokens.CREATE_TRANSACTION_USE_CASE, () => 
    createCreateTransactionUseCaseMock()
  )

  container.registerTransient(ServiceTokens.GET_TRANSACTIONS_USE_CASE, () => 
    createGetTransactionsUseCaseMock()
  )

  container.registerTransient(ServiceTokens.GET_FINANCIAL_METRICS_USE_CASE, () => 
    createGetFinancialMetricsUseCaseMock()
  )

  container.registerTransient(ServiceTokens.BULK_UPDATE_TRANSACTIONS_USE_CASE, () => 
    createBulkUpdateTransactionsUseCaseMock()
  )

  return container
}

// Mock factory functions
function createSupabaseMock() {
  return {
    from: (table: string) => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
      eq: () => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
      order: () => ({ data: [], error: null }),
      gte: () => ({ data: [], error: null }),
      lte: () => ({ data: [], error: null }),
      in: () => ({ data: [], error: null })
    })
  }
}

function createLoggerMock() {
  return {
    info: (message: string, data?: any) => console.log(message, data),
    warn: (message: string, data?: any) => console.warn(message, data),
    error: (message: string, data?: any) => console.error(message, data),
    debug: (message: string, data?: any) => console.debug(message, data)
  }
}

function createPerformanceMonitorMock() {
  return {
    measureAsync: async (name: string, fn: () => Promise<any>) => fn(),
    measureSync: (name: string, fn: () => any) => fn(),
    recordMetric: () => {},
    getMetrics: () => []
  }
}

function createCacheServiceMock() {
  return {
    get: (key: string) => null,
    set: (key: string, value: any, ttl?: number) => {},
    delete: (key: string) => {},
    clear: () => {}
  }
}

function createTransactionRepositoryMock() {
  return {
    findById: async (id: string) => null,
    findByAccountId: async (accountId: string) => [],
    findAll: async () => [],
    create: async (transaction: any) => transaction,
    update: async (id: string, updates: any) => updates,
    delete: async (id: string) => {},
    bulkUpdate: async (ids: string[], updates: any) => {},
    countByFilters: async () => 0
  }
}

function createAccountRepositoryMock() {
  return {
    findById: async (id: string) => null,
    findAll: async () => [],
    create: async (account: any) => account,
    update: async (id: string, updates: any) => updates,
    delete: async (id: string) => {}
  }
}

function createMetricsRepositoryMock() {
  return {
    getFinancialMetrics: async (params: any) => ({
      totalReceitas: 0,
      totalDespesas: 0,
      saldoPeriodo: 0,
      totalTransacoes: 0
    })
  }
}

function createFinancialCalculatorMock() {
  return {
    calculateTotal: (values: number[]) => values.reduce((sum, val) => sum + val, 0),
    calculatePercentage: (value: number, total: number) => total > 0 ? (value / total) * 100 : 0,
    calculateInstallments: (total: number, installments: number) => total / installments
  }
}

function createCreateTransactionUseCaseMock() {
  return {
    execute: async (request: any) => ({ 
      success: true, 
      transaction: request,
      account: { id: '1', balance: 1000 }
    })
  }
}

function createGetTransactionsUseCaseMock() {
  return {
    execute: async (params: any) => ({ 
      data: [], 
      total: 0,
      pagination: { page: 1, limit: 50, totalPages: 0 }
    })
  }
}

function createGetFinancialMetricsUseCaseMock() {
  return {
    execute: async (params: any) => ({
      data: {
        totalReceitas: 0,
        totalDespesas: 0,
        receitasRealizadas: 0,
        despesasRealizadas: 0,
        saldoPeriodo: 0,
        totalTransacoes: 0
      },
      insights: null
    })
  }
}

function createBulkUpdateTransactionsUseCaseMock() {
  return {
    execute: async (params: any) => ({ 
      success: true,
      updatedCount: params.transactionIds?.length || 0
    })
  }
}