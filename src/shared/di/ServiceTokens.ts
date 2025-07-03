// src/shared/di/ServiceTokens.ts
/**
 * Tokens para identificar serviços no container
 */

export const ServiceTokens = {
  // Repositories
  TRANSACTION_REPOSITORY: 'TransactionRepository',
  ACCOUNT_REPOSITORY: 'AccountRepository',
  METRICS_REPOSITORY: 'MetricsRepository',
  
  // Use Cases
  CREATE_TRANSACTION_USE_CASE: 'CreateTransactionUseCase',
  GET_TRANSACTIONS_USE_CASE: 'GetTransactionsUseCase',
  UPDATE_TRANSACTION_USE_CASE: 'UpdateTransactionUseCase',
  DELETE_TRANSACTION_USE_CASE: 'DeleteTransactionUseCase',
  BULK_UPDATE_TRANSACTIONS_USE_CASE: 'BulkUpdateTransactionsUseCase',
  GET_FINANCIAL_METRICS_USE_CASE: 'GetFinancialMetricsUseCase',
  
  // Services
  FINANCIAL_CALCULATOR: 'FinancialCalculator',
  CACHE_SERVICE: 'CacheService',
  
  // Infrastructure
  LOGGER: 'Logger',
  PERFORMANCE_MONITOR: 'PerformanceMonitor',
  
  // External Services
  SUPABASE_CLIENT: 'SupabaseClient',
  EMAIL_SERVICE: 'EmailService',
  NOTIFICATION_SERVICE: 'NotificationService'
} as const

// src/shared/di/FinancialModuleContainer.ts
import { Container } from './Container'
import { ServiceTokens } from './ServiceTokens'

// Domain
import { CreateTransactionUseCase } from '@/domain/financial/use-cases/CreateTransactionUseCase'
import { GetTransactionsUseCase } from '@/domain/financial/use-cases/GetTransactionsUseCase'
import { GetFinancialMetricsUseCase } from '@/domain/financial/use-cases/GetFinancialMetricsUseCase'
import { BulkUpdateTransactionsUseCase } from '@/domain/financial/use-cases/BulkUpdateTransactionsUseCase'

// Infrastructure
import { SupabaseTransactionRepository } from '@/infrastructure/financial/repositories/SupabaseTransactionRepository'
import { SupabaseAccountRepository } from '@/infrastructure/financial/repositories/SupabaseAccountRepository'
import { SupabaseMetricsRepository } from '@/infrastructure/financial/repositories/SupabaseMetricsRepository'

// Services
import { FinancialCalculator } from '@/domain/financial/services/FinancialCalculator'
import { CacheService } from '@/infrastructure/cache/CacheService'
import { Logger } from '@/shared/utils/logger'
import { performanceMonitor } from '@/shared/utils/performanceMonitor'
import { supabase } from '@/lib/supabase'

/**
 * Container configurado para o módulo financeiro
 */
export function createFinancialContainer(): Container {
  const container = new Container()

  // Infrastructure
  container.registerInstance(ServiceTokens.SUPABASE_CLIENT, supabase)
  container.registerInstance(ServiceTokens.LOGGER, new Logger('FinancialModule'))
  container.registerInstance(ServiceTokens.PERFORMANCE_MONITOR, performanceMonitor)
  container.registerSingleton(ServiceTokens.CACHE_SERVICE, CacheService)

  // Repositories
  container.registerScoped(ServiceTokens.TRANSACTION_REPOSITORY, () => 
    new SupabaseTransactionRepository(
      container.resolve(ServiceTokens.SUPABASE_CLIENT),
      container.resolve(ServiceTokens.LOGGER),
      container.resolve(ServiceTokens.PERFORMANCE_MONITOR)
    )
  )

  container.registerScoped(ServiceTokens.ACCOUNT_REPOSITORY, () => 
    new SupabaseAccountRepository(
      container.resolve(ServiceTokens.SUPABASE_CLIENT),
      container.resolve(ServiceTokens.LOGGER)
    )
  )

  container.registerScoped(ServiceTokens.METRICS_REPOSITORY, () => 
    new SupabaseMetricsRepository(
      container.resolve(ServiceTokens.SUPABASE_CLIENT),
      container.resolve(ServiceTokens.LOGGER)
    )
  )

  // Domain Services
  container.registerSingleton(ServiceTokens.FINANCIAL_CALCULATOR, FinancialCalculator)

  // Use Cases
  container.registerTransient(ServiceTokens.CREATE_TRANSACTION_USE_CASE, () => 
    new CreateTransactionUseCase(
      container.resolve(ServiceTokens.TRANSACTION_REPOSITORY),
      container.resolve(ServiceTokens.ACCOUNT_REPOSITORY),
      container.resolve(ServiceTokens.LOGGER)
    )
  )

  container.registerTransient(ServiceTokens.GET_TRANSACTIONS_USE_CASE, () => 
    new GetTransactionsUseCase(
      container.resolve(ServiceTokens.TRANSACTION_REPOSITORY),
      container.resolve(ServiceTokens.LOGGER)
    )
  )

  container.registerTransient(ServiceTokens.GET_FINANCIAL_METRICS_USE_CASE, () => 
    new GetFinancialMetricsUseCase(
      container.resolve(ServiceTokens.METRICS_REPOSITORY),
      container.resolve(ServiceTokens.LOGGER)
    )
  )

  container.registerTransient(ServiceTokens.BULK_UPDATE_TRANSACTIONS_USE_CASE, () => 
    new BulkUpdateTransactionsUseCase(
      container.resolve(ServiceTokens.TRANSACTION_REPOSITORY),
      container.resolve(ServiceTokens.ACCOUNT_REPOSITORY),
      container.resolve(ServiceTokens.LOGGER)
    )
  )

  return container
}